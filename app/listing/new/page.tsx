'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import { uploadImages, uploadVideo, generateVideoPoster, UploadProgress } from '../../../lib/uploadImages'
import { useListingAI } from './useListingAI'
import { NewListingView } from './NewListingView'
import { SITE_URL } from '../../../lib/siteConfig'



export default function NewListing() {
  const { cfgInt, profile } = useAlpazar()
  const maxImages  = profile?.is_premium ? cfgInt('max_images_premium', 10) : cfgInt('max_images_free', 5)
  const freeLimit  = cfgInt('free_listings_limit', 5)
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'ALL',
    condition: '',
    category_id: '',
    city: '',
    images: [] as string[],
    latitude: null as number | null,
    longitude: null as number | null,
    location_address: '',
  })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [myListingCount, setMyListingCount] = useState(0)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const { descLoading, catLoading, catSuggested, priceLoading, priceSuggestion, generateDescription, suggestPrice, suggestCategory } = useListingAI(form, categories, set, setMsg)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string>('')
  const [videoPct, setVideoPct] = useState(0)
  const [videoUploading, setVideoUploading] = useState(false)
  const [showUpsell, setShowUpsell] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_active', true).then(({ count }) => setMyListingCount(count || 0))
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { window.location.href = '/auth/login' }
    })
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Revoke object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => { imagePreviews.forEach(url => URL.revokeObjectURL(url)) }
  }, [imagePreviews])

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('alpazar_listing_draft')
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.title) {
          setForm(f => ({ ...f, ...draft }))
          setDraftRestored(true)
          setTimeout(() => setDraftRestored(false), 4000)
        }
      }
    } catch { /* ignore */ }
  }, [])

  // Autosave draft to localStorage (text fields only, not images)
  useEffect(() => {
    const { title, description, price, currency, condition, category_id, city, location_address } = form
    if (!title && !description) return
    try {
      localStorage.setItem('alpazar_listing_draft', JSON.stringify({ title, description, price, currency, condition, category_id, city, location_address }))
    } catch { /* ignore */ }
  }, [form.title, form.description, form.price, form.currency, form.condition, form.category_id, form.city, form.location_address])

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (!isDirty) return; e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  function set(k: string, v: string) { setIsDirty(true); setForm(f => ({ ...f, [k]: v })) }

  function handleVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('video/')) { setMsg('err:Skedari nuk eshte video.'); e.target.value = ''; return }
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(f); setVideoPreview(URL.createObjectURL(f)); setIsDirty(true); setMsg('')
  }
  function removeVideo() {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(null); setVideoPreview(''); setVideoPct(0)
  }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files || [])
    const files = all.slice(0, maxImages)
    setImageFiles(files); setIsDirty(true)
    if (all.length > maxImages) {
      setMsg(`err:Mund të ngarkoni max ${maxImages} foto. U morën vetëm ${maxImages} të parat.`)
    } else {
      setMsg('')
    }
    // Revoke old object URLs to prevent memory leaks
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    const previews = files.map(f => URL.createObjectURL(f))
    setImagePreviews(previews)
  }

  async function submit() {
    if (!form.title.trim()) { setMsg('err:Titulli është i detyrueshëm!'); return }
    if (!form.category_id) { setMsg('err:Zgjidh kategorinë!'); return }
    if (!form.city) { setMsg('err:Shkruaj qytetin!'); return }
    const priceNum = parseFloat(form.price)
    if (form.price && (isNaN(priceNum) || priceNum < 0)) { setMsg('err:Çmimi duhet të jetë një numër pozitiv!'); return }

    setLoading(true); setMsg(''); setUploadProgress(null)
    try {
      let uploadedUrls: string[] = []
      if (imageFiles.length > 0) {
        try {
          const { urls, errors } = await uploadImages(imageFiles, setUploadProgress)
          if (errors.length > 0 && urls.length === 0) {
            setMsg(`err:Ngarkim dështoi: ${errors[0]}`)
            setLoading(false); setUploadProgress(null); return
          }
          if (errors.length > 0) {
            setMsg(`warn:${urls.length} foto u ngarkuan. ${errors.length} dështuan: ${errors[0]}`)
          }
          uploadedUrls = urls
        } catch (uploadErr: any) {
          setMsg(`err:${uploadErr?.message ?? 'Gabim ngarkim fotosh.'}`)
          setLoading(false); setUploadProgress(null); return
        }
      }
      setUploadProgress(null)
      let videoUrl: string | null = null
      if (videoFile) {
        setVideoUploading(true)
        const vres = await uploadVideo(videoFile, p => setVideoPct(Math.round((p.done / p.total) * 100)))
        setVideoUploading(false)
        if (vres.error) { setMsg(`err:Video: ${vres.error}`); setLoading(false); return }
        videoUrl = vres.url || null
        if (uploadedUrls.length === 0) {
          const poster = await generateVideoPoster(videoFile)
          if (poster) { const pr = await uploadImages([poster]); if (pr.urls[0]) uploadedUrls = [pr.urls[0]] }
        }
      }
      const { data, error } = await supabase.from('listings').insert({
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        condition: form.condition || null,
        category_id: form.category_id,
        city: form.city,
        images: uploadedUrls,
        video_url: videoUrl,
        is_active: true,
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address || null,
      }).select().single()

      if (error) { setMsg(`err:${error.message}`); setLoading(false); return }
      try { localStorage.removeItem('alpazar_listing_draft') } catch { /* ignore */ }
      setIsDirty(false)
      const bonusMsg = myListingCount === 0 ? ' +35 pikë gamifikimi (bonus fillestar)! 🎉' : ' +10 pikë gamifikimi! ⚡'
      setMsg(`ok:Shpallja u publikua me sukses!${bonusMsg}`)
      // IndexNow ping — instant Bing/Yandex indexing (key kept server-side)
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!s) return
        fetch('/api/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` },
          body: JSON.stringify({ url: `${SITE_URL}/listing/${data.id}` }),
        }).catch(() => {})
      })
      // Upsell pas shpalljes së 2-të — max 1 herë/sesion
      if (myListingCount === 1 && !sessionStorage.getItem('alpazar_upsell_shown')) {
        sessionStorage.setItem('alpazar_upsell_shown', '1')
        setShowUpsell(true)
        setTimeout(() => { window.location.href = `/listing/${data.id}` }, 4000)
      } else {
        setTimeout(() => { window.location.href = `/listing/${data.id}` }, 2000)
      }
    } catch (e: any) {
      setMsg(`err:${e.message}`)
    }
    setLoading(false)
  }

  const [mt, mm] = msg.split(/:(.+)/)

  return <NewListingView p={{ form, set, setForm, msg, mt, mm, uploadProgress, videoPreview, videoUploading, videoPct, handleVideo, removeVideo, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell }} />
}

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { uploadImages, UploadProgress } from '../../../lib/uploadImages'
import { useListingAI } from './useListingAI'
import { useListingBoot } from './useListingBoot'
import { useVideos } from './useVideos'
import { NewListingView } from './NewListingView'
import { SITE_URL } from '../../../lib/siteConfig'

export default function NewListing() {
  const [user, setUser] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
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
  const [showUpsell, setShowUpsell] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const vid = useVideos(setMsg, setIsDirty)

  // Kufijte vijne nga nje burim i vetem (get_my_entitlements -> app_config).
  const maxImages = vid.maxImages
  const freeLimit = vid.maxListings < 0 ? Number.POSITIVE_INFINITY : vid.maxListings

  useListingBoot({ setUser, setCategories, setMyListingCount, setForm, setDraftRestored, imagePreviews, form, isDirty })

  function set(k: string, v: string) { setIsDirty(true); setForm(f => ({ ...f, [k]: v })) }

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const all = Array.from(e.target.files || [])
    const files = maxImages < 0 ? all : all.slice(0, maxImages)
    setImageFiles(files); setIsDirty(true)
    if (maxImages >= 0 && all.length > maxImages) {
      setMsg(`err:Mund të ngarkoni max ${maxImages} foto. U morën vetëm ${maxImages} të parat.`)
    } else {
      setMsg('')
    }
    imagePreviews.forEach(url => URL.revokeObjectURL(url))
    setImagePreviews(files.map(f => URL.createObjectURL(f)))
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

      let videos: any[] = []
      if (vid.count > 0) {
        const r = await vid.uploadAll()
        if (r.error) { setMsg(`err:Video: ${r.error}`); setLoading(false); return }
        videos = r.videos
        if (uploadedUrls.length === 0 && r.poster) {
          const pr = await uploadImages([r.poster])
          if (pr.urls[0]) uploadedUrls = [pr.urls[0]]
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
        videos,
        video_poster: uploadedUrls[0] || null,
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
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (!s) return
        fetch('/api/indexnow', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.access_token}` },
          body: JSON.stringify({ url: `${SITE_URL}/listing/${data.id}` }),
        }).catch(() => {})
      })
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

  return <NewListingView p={{ form, set, setForm, msg, mt, mm, uploadProgress, vid, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell }} />
}

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
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
  const [myBusinesses, setMyBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    currency: 'ALL',
    condition: '',
    listing_type: 'produkt',
    category_id: '',
    business_id: '',
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

  useEffect(() => {
    const uid = user?.id
    if (!uid) return
    supabase.from('businesses').select('id,name').eq('owner_id', uid).order('name')
      .then(({ data }) => {
        setMyBusinesses(data || [])
        /*  ATRIBUIM AUTOMATIK (bug #2, vendim i pronarit 1 shtator 2026):
         *  nje pronar biznesi qe hap nje shpallje, e parazgjedh te biznesi i tij.
         *  Me pare parazgjedhja ishte "Vetja ime" → shpalljet mbeteshin pa
         *  `business_id` dhe faqja e biznesit tregonte "0 Shpallje" perballe
         *  "2 aktive" te faqja e shpalljes. Perdoruesi mund ta ndryshoje ende te
         *  "Posto si". Nuk e prek nje draft te rikthyer as nje zgjedhje te bere:
         *  vetem kur fusha eshte bosh. `setForm` direkt, JO `set()`, qe te mos e
         *  shenoje formularin si te ndryshuar (perndryshe do te ndizte rojen e
         *  "ndryshimeve te paruajtura" pa asnje veprim njeriu).  */
        if (data && data.length > 0) {
          setForm(f => f.business_id ? f : { ...f, business_id: data[0].id })
        }
      })
  }, [user?.id])

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
    // Guard: pa sesion të ngarkuar, `user.id` më poshtë do të hidhte gabim në heshtje.
    if (!user?.id) { setMsg('err:Duhet të kesh hyrë në llogari për të publikuar. Po të çojmë te hyrja…'); setTimeout(() => { window.location.href = '/auth/login?next=/listing/new' }, 1600); return }
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
          if (typeof r.poster === 'string') {
            // Poster nga transkoderi (URL thumbnail-i) — përdoret drejtpërdrejt si kopertinë, pa ringarkim.
            uploadedUrls = [r.poster]
          } else {
            const pr = await uploadImages([r.poster])
            if (pr.urls[0]) uploadedUrls = [pr.urls[0]]
          }
        }
      }

      const payload = {
        user_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        price: form.price ? parseFloat(form.price) : null,
        currency: form.currency,
        condition: form.condition || null,
        listing_type: form.listing_type || 'produkt',
        category_id: form.category_id,
        business_id: form.business_id || null,
        city: form.city,
        images: uploadedUrls,
        videos,
        // Poster VETËM kur ka vërtet video. Më parë vendosej gjithmonë fotoja e parë,
        // ndaj shpallje pa asnjë video mbanin `video_poster` (matur: 39bb6642 → 0 video,
        // poster i vendosur). Të dhëna të pakuptimta që ngatërrojnë çdo lexues.
        video_poster: videos.length ? (uploadedUrls[0] || null) : null,
        is_active: true,
        latitude: form.latitude,
        longitude: form.longitude,
        location_address: form.location_address || null,
      }
      // GARANCI publikimi: riprovim me backoff për ndërprerje KALIMTARE (rrjet/timeout),
      // që një blip i rrjetit të mos e humbasë postimin. Gabimet JO-kalimtare (kuota, RLS/leje,
      // validim/constraint) nuk riprovohen — dalin menjëherë me mesazh. Fotot janë ngarkuar tashmë,
      // ndaj riprovimi nuk i ringarkon (payload i njëjtë).
      let data: any = null, error: any = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        const res = await supabase.from('listings').insert(payload).select().single()
        data = res.data; error = res.error
        if (!error) break
        const m = (error.message || '').toLowerCase()
        const code = String(error.code || '')
        const jokalimtar = m.includes('kufi_shpalljesh') || m.includes('permission') || m.includes('policy')
          || m.includes('row-level') || /^(22|23|42|P0001)/.test(code)
        if (jokalimtar || attempt === 3) break
        await new Promise(r => setTimeout(r, attempt * 800))
      }

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

  return <NewListingView p={{ form, set, setForm, msg, mt, mm, uploadProgress, vid, handleImages, imagePreviews, maxImages, categories, catLoading, catSuggested, suggestCategory, priceLoading, priceSuggestion, suggestPrice, descLoading, generateDescription, loading, submit, draftRestored, setDraftRestored, myListingCount, freeLimit, showUpsell, myBusinesses }} />
}

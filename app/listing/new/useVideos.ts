'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { uploadVideo, generateVideoPoster, transcodingEnabled } from '../../../lib/uploadImages'

export type VidItem = { file: File; preview: string; duration: number }

function probeDuration(f: File): Promise<number> {
  return new Promise(resolve => {
    try {
      const v = document.createElement('video')
      const url = URL.createObjectURL(f)
      const done = (d: number) => { URL.revokeObjectURL(url); resolve(d) }
      v.preload = 'metadata'
      v.onloadedmetadata = () => done(isFinite(v.duration) ? v.duration : 0)
      v.onerror = () => done(0)
      v.src = url
    } catch { resolve(0) }
  })
}

// Burimi i VETEM i kufijve: get_my_entitlements (i cili lexon app_config).
// Asnje numer i kodifikuar dhe asnje burim i dyte.
export function useVideos(setMsg: (m: string) => void, setIsDirty: (b: boolean) => void, reserved = 0) {
  const [ent, setEnt] = useState<any>(null)
  const [items, setItems] = useState<VidItem[]>([])
  const [pct, setPct] = useState(0)
  const [uploading, setUploading] = useState(false)
  // Kufiri i madhësisë së videos (MB) — nga app_config (jo i ngurtësuar; §2.9). Kur transkodimi
  // është fikur, duhet të përputhet me kufirin e Supabase (përndryshe "exceeded max size"); kur
  // transkodimi është ndezur, kufiri vjen nga ofruesi (Cloudinary) → cloudinary_max_mb.
  const [maxMb, setMaxMb] = useState(50)
  // A është ndezur transkodimi automatik (çdo kodek → H.264 i luajtshëm)? Nëse po, NUK refuzojmë
  // videot e padekodueshme në shfletues (H.265) — ofruesi i shndërron.
  const [transcode, setTranscode] = useState(false)

  useEffect(() => {
    supabase.rpc('get_my_entitlements').then(({ data }) => setEnt(data), () => {})
    // Fillimisht mësojmë nëse transkodimi është ndezur, PASTAJ zgjedhim kufirin e duhur
    // (dy leximet duhen zinxhir, jo garë — përndryshe kufiri do zgjidhej me flamur të papërcaktuar).
    transcodingEnabled().then(on => {
      setTranscode(on)
      supabase.from('app_config').select('key,value').in('key', ['video_max_mb', 'cloudinary_max_mb'])
        .then(({ data }) => {
          const m: Record<string, string> = {}
          for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = r.value ?? ''
          const n = parseInt(m[on ? 'cloudinary_max_mb' : 'video_max_mb'] ?? '', 10)
          if (!Number.isNaN(n) && n > 0) setMaxMb(n)
          else if (on) setMaxMb(100) // Cloudinary Free ≈ 100MB
        }, () => { if (on) setMaxMb(100) })
    }, () => {})
  }, [])

  const maxVideos: number = ent?.max_videos ?? 5
  const maxImages: number = ent?.max_images ?? 10
  const maxListings: number = ent?.max_listings ?? 10
  const maxSec: number = ent?.video_max_seconds ?? 300
  const isPremium: boolean = !!ent?.is_premium
  const maxMin = Math.round(maxSec / 60)

  async function add(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const room = maxVideos < 0 ? files.length : maxVideos - reserved - items.length
    if (room <= 0) {
      setMsg(`err:Ke arritur kufirin prej ${maxVideos} videosh për një shpallje.${isPremium ? '' : ' Premium lejon më shumë.'}`)
      return
    }

    const accepted: VidItem[] = []
    const rejected: string[] = []
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith('video/')) { rejected.push(`${f.name}: nuk është video`); continue }
      // Kontroll madhësie PARA ngarkimit — që të mos presësh kot dhe pastaj të dështojë me
      // "exceeded max size". Kufiri vjen nga app_config (video_max_mb) = kufiri i serverit.
      if (f.size > maxMb * 1024 * 1024) {
        rejected.push(`${f.name}: ${(f.size / 1048576).toFixed(0)}MB — maksimumi ${maxMb}MB. Shkurtoje ose ul cilësinë e videos.`)
        continue
      }
      const d = await probeDuration(f)
      // Nëse shfletuesi s'e dekodon dot (duration=0 → gabim ngarkimi metadatash), videoja NUK do
      // të luhet te vizitorët (tipike për H.265/HEVC nga disa telefona). E refuzojmë VETËM kur
      // transkodimi automatik është fikur; kur është ndezur, ofruesi e shndërron në H.264 → e lëmë.
      if (d <= 0 && !transcode) {
        rejected.push(`${f.name}: kjo video s'mund të luhet në shfletues (ndoshta format H.265/HEVC). Regjistroje ose eksportoje si MP4 (H.264) dhe provo sërish.`)
        continue
      }
      if (d > 0 && d > maxSec) {
        rejected.push(`${f.name}: ${Math.round(d)}s — maksimumi ${maxMin} minuta`)
        continue
      }
      accepted.push({ file: f, preview: URL.createObjectURL(f), duration: d })
    }

    if (accepted.length > 0) { setItems(p => [...p, ...accepted]); setIsDirty(true) }

    if (rejected.length > 0) setMsg(`err:${rejected.join(' · ')}`)
    else if (files.length > room) setMsg(`err:U pranuan vetëm ${room} video — kufiri është ${maxVideos}.`)
    else setMsg('')
  }

  function remove(i: number) {
    setItems(p => {
      const c = [...p]
      const [x] = c.splice(i, 1)
      if (x) URL.revokeObjectURL(x.preview)
      return c
    })
    setIsDirty(true)
  }

  async function uploadAll(): Promise<{ videos: any[]; poster: File | null; error?: string }> {
    if (items.length === 0) return { videos: [], poster: null }
    setUploading(true)
    setPct(0)
    const out: any[] = []
    for (let i = 0; i < items.length; i++) {
      const r = await uploadVideo(items[i].file, (p: any) => {
        const frac = p && p.total ? p.done / p.total : 0
        setPct(Math.round(((i + frac) / items.length) * 100))
      })
      if (r.error) { setUploading(false); return { videos: out, poster: null, error: r.error } }
      // Kohëzgjatja: nga transkoderi (i saktë edhe kur shfletuesi s'e dekodoi dot burimin), përndryshe nga proba.
      if (r.url) out.push({ url: r.url, duration: r.duration ?? Math.round(items[i].duration) })
    }
    setPct(100)
    setUploading(false)
    let poster: File | null = null
    try { poster = await generateVideoPoster(items[0].file) } catch { /* opsionale */ }
    return { videos: out, poster }
  }

  return {
    items, add, remove, uploadAll, pct, uploading,
    maxVideos, maxImages, maxListings, maxSec, maxMin, maxMb, isPremium,
    ready: !!ent, count: items.length, total: reserved + items.length,
  }
}

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { uploadVideo, generateVideoPoster } from '../../../lib/uploadImages'

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
export function useVideos(setMsg: (m: string) => void, setIsDirty: (b: boolean) => void) {
  const [ent, setEnt] = useState<any>(null)
  const [items, setItems] = useState<VidItem[]>([])
  const [pct, setPct] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    supabase.rpc('get_my_entitlements').then(({ data }) => setEnt(data), () => {})
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

    const room = maxVideos < 0 ? files.length : maxVideos - items.length
    if (room <= 0) {
      setMsg(`err:Ke arritur kufirin prej ${maxVideos} videosh për një shpallje.${isPremium ? '' : ' Premium lejon më shumë.'}`)
      return
    }

    const accepted: VidItem[] = []
    const rejected: string[] = []
    for (const f of files.slice(0, room)) {
      if (!f.type.startsWith('video/')) { rejected.push(`${f.name}: nuk është video`); continue }
      const d = await probeDuration(f)
      if (d > maxSec) {
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
      if (r.url) out.push({ url: r.url, duration: Math.round(items[i].duration) })
    }
    setPct(100)
    setUploading(false)
    let poster: File | null = null
    try { poster = await generateVideoPoster(items[0].file) } catch { /* opsionale */ }
    return { videos: out, poster }
  }

  return {
    items, add, remove, uploadAll, pct, uploading,
    maxVideos, maxImages, maxListings, maxSec, maxMin, isPremium,
    ready: !!ent, count: items.length,
  }
}

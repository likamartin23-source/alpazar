'use client'

import { supabase } from './supabase'

export interface UploadProgress { done: number; total: number; currentName?: string }

async function compress(file: File): Promise<Blob> {
  if (file.size < 250 * 1024 || file.type === 'image/gif') return file
  return new Promise(resolve => {
    const img = new Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objUrl)
      const MAX = 1920
      const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.82)
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file) }
    img.src = objUrl
  })
}

async function uploadWithRetry(path: string, blob: Blob, attempts = 3): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true })
      if (!error) return null
      if (i === attempts - 1) return error.message
    } catch (e: any) {
      if (i === attempts - 1) return e?.message ?? 'Lidhje dështoi'
    }
    await new Promise(r => setTimeout(r, 1200 * (i + 1)))
  }
  return 'Tejkaloi numrin maksimal të tentativave'
}

export async function uploadImages(
  files: File[],
  onProgress?: (p: UploadProgress) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  if (files.length === 0) return { urls: [], errors: [] }

  onProgress?.({ done: 0, total: files.length })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.refreshSession()
    const { data: { session: s2 } } = await supabase.auth.getSession()
    if (!s2) throw new Error('Sesioni ka skaduar. Hyr sërisht.')
  }

  const { data: { session: validSession } } = await supabase.auth.getSession()
  if (!validSession) throw new Error('Sesioni ka skaduar. Hyr sërisht.')

  const uid = validSession.user.id
  const urls: string[] = []
  const errors: string[] = []
  let done = 0

  for (const file of files) {
    onProgress?.({ done, total: files.length, currentName: file.name })

    let blob: Blob = file
    try { blob = await compress(file) } catch { /* use original */ }

    const ext = blob.type === 'image/gif' ? 'gif' : 'jpg'
    const path = `${uid}/${crypto.randomUUID()}.${ext}`

    const err = await uploadWithRetry(path, blob)
    done++
    onProgress?.({ done, total: files.length })

    if (err) {
      errors.push(`${file.name}: ${err}`)
    } else {
      const { data } = supabase.storage.from('listing-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
  }

  return { urls, errors }
}

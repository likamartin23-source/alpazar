'use client'

import { supabase } from './supabase'

export interface UploadProgress { done: number; total: number; currentName?: string }

// Compress to JPEG (max 1920px, quality 0.82). Skips if already small.
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

// PUT with retry (3 attempts, exponential backoff)
async function putWithRetry(signedUrl: string, blob: Blob, attempts = 3): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(signedUrl, {
        method: 'PUT',
        body: blob,
        headers: { 'Content-Type': blob.type || 'image/jpeg' },
      })
      if (res.ok) return null
      const text = await res.text().catch(() => `HTTP ${res.status}`)
      if (i === attempts - 1) return `HTTP ${res.status}: ${text.slice(0, 120)}`
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

  // 1. Get valid session token
  const { data: { session }, error: sessErr } = await supabase.auth.getSession()
  if (sessErr || !session) {
    // Try to refresh first
    const { data: { session: refreshed } } = await supabase.auth.refreshSession()
    if (!refreshed) throw new Error('Sesioni ka skaduar. Hyr sërisht.')
  }

  const { data: { session: validSession } } = await supabase.auth.getSession()
  if (!validSession) throw new Error('Sesioni ka skaduar. Hyr sërisht.')

  // 2. Get presigned URLs from server
  const presignRes = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${validSession.access_token}`,
    },
    body: JSON.stringify({
      files: files.map(f => ({ name: f.name, type: f.type || 'image/jpeg', size: f.size })),
    }),
  })

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: 'Gabim serveri' }))
    throw new Error(err.error ?? `Presign dështoi (${presignRes.status})`)
  }

  const { uploads } = await presignRes.json() as {
    uploads: Array<{ signedUrl: string; path: string; publicUrl: string }>
  }

  // 3. Compress + upload each file
  const urls: string[] = []
  const errors: string[] = []
  let done = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const slot = uploads[i]
    onProgress?.({ done, total: files.length, currentName: file.name })

    // Compress (client-side, canvas)
    let blob: Blob = file
    try { blob = await compress(file) } catch { /* use original on compress error */ }

    // Upload to presigned URL with retry
    const err = await putWithRetry(slot.signedUrl, blob)
    done++
    onProgress?.({ done, total: files.length })

    if (err) {
      errors.push(`${file.name}: ${err}`)
    } else {
      urls.push(slot.publicUrl)
    }
  }

  return { urls, errors }
}

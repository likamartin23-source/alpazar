'use client'

import { supabase } from './supabase'

export interface UploadProgress { done: number; total: number; currentName?: string }

const MAX_DIM = 1600
const IMG_CONCURRENCY = 3

// ── Detektim WebP: dalje me e vogel (~25-35%) me te njejten cilesi ────────────
let _webp: boolean | null = null
function supportsWebp(): boolean {
  if (_webp !== null) return _webp
  try {
    const c = document.createElement('canvas'); c.width = 1; c.height = 1
    _webp = c.toDataURL('image/webp').indexOf('data:image/webp') === 0
  } catch { _webp = false }
  return _webp
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, q: number): Promise<Blob | null> {
  return new Promise(r => canvas.toBlob(b => r(b), type, q))
}

// Nese `p` nuk zgjidhet brenda `ms`, kthe `fallback` (mos ngri UI-n ne "0/1").
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise(resolve => {
    let settled = false
    const finish = (v: T) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v) } }
    const timer = setTimeout(() => finish(fallback), ms)
    p.then(finish, () => finish(fallback))
  })
}

function compressViaImage(file: File): Promise<Blob> {
  return new Promise(resolve => {
    const img = new Image()
    const objUrl = URL.createObjectURL(file)
    img.onload = async () => {
      URL.revokeObjectURL(objUrl)
      const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
      const w = Math.round(img.naturalWidth * scale)
      const h = Math.round(img.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(file); return }
      ctx.drawImage(img, 0, 0, w, h)
      const webp = supportsWebp()
      const blob = await canvasToBlob(canvas, webp ? 'image/webp' : 'image/jpeg', webp ? 0.82 : 0.78)
      resolve(blob && blob.size < file.size ? blob : file)
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file) }
    img.src = objUrl
  })
}

// Zvogelim + rikompresim. Prefereron createImageBitmap (EXIF korrekt, memorie e ulet ne telefon).
async function compress(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file
  if (file.size < 150 * 1024) return file
  try {
    let bmp: ImageBitmap
    try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as any) }
    catch { bmp = await createImageBitmap(file) }
    const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height))
    const w = Math.round(bmp.width * scale)
    const h = Math.round(bmp.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) { bmp.close?.(); return file }
    ctx.drawImage(bmp, 0, 0, w, h)
    bmp.close?.()
    const webp = supportsWebp()
    const type = webp ? 'image/webp' : 'image/jpeg'
    let blob = await canvasToBlob(canvas, type, webp ? 0.82 : 0.78)
    if (blob && blob.size > 1.5 * 1024 * 1024) {
      const smaller = await canvasToBlob(canvas, type, webp ? 0.62 : 0.6)
      if (smaller && smaller.size < blob.size) blob = smaller
    }
    return blob && blob.size < file.size ? blob : file
  } catch {
    return compressViaImage(file)
  }
}

function friendlyUploadError(msg: string): string {
  if (/failed to fetch|network|timed? ?out|load failed|connection/i.test(msg))
    return 'Rrjeti u nderpre gjate ngarkimit. Provo me Wi-Fi ose provo serish.'
  return msg
}

async function uploadWithRetry(bucket: string, path: string, blob: Blob, timeoutMs = 45000, attempts = 4): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const uploadPromise = supabase.storage.from(bucket)
        .upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: true })
      const timeoutPromise = new Promise<{ error: Error }>(resolve =>
        setTimeout(() => resolve({ error: new Error('Upload timed out') }), timeoutMs)
      )
      const result = await Promise.race([uploadPromise, timeoutPromise]) as any
      if (!result.error) return null
      if (i === attempts - 1) return friendlyUploadError(String(result.error.message || ''))
    } catch (e: any) {
      if (i === attempts - 1) return friendlyUploadError(String(e?.message ?? 'Lidhje deshtoi'))
    }
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)))
  }
  return 'Tejkaloi numrin maksimal te tentativave'
}

async function requireUid(): Promise<string> {
  let { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    await supabase.auth.refreshSession()
    session = (await supabase.auth.getSession()).data.session
  }
  if (!session) throw new Error('Sesioni ka skaduar. Hyr serisht.')
  return session.user.id
}

const ALLOWED_IMG = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']
const MAX_IMG = 10 * 1024 * 1024

// ── Ngarkim fotosh NE PARALEL (rendi ruhet: [0] = kryesorja) ─────────────────
export async function uploadImages(
  files: File[],
  onProgress?: (p: UploadProgress) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  if (files.length === 0) return { urls: [], errors: [] }
  onProgress?.({ done: 0, total: files.length })
  const uid = await requireUid()

  const errors: string[] = []
  const results: (string | null)[] = new Array(files.length).fill(null)
  let done = 0
  let cursor = 0

  async function worker() {
    while (true) {
      const idx = cursor++
      if (idx >= files.length) return
      const file = files[idx]
      if (!ALLOWED_IMG.includes(file.type)) {
        errors.push(`${file.name}: Lloji i skedarit nuk lejohet. Provo JPG, PNG, WebP ose HEIC.`)
        done++; onProgress?.({ done, total: files.length }); continue
      }
      if (file.size > MAX_IMG) {
        errors.push(`${file.name}: Skedari eshte shume i madh (max 10MB).`)
        done++; onProgress?.({ done, total: files.length }); continue
      }
      onProgress?.({ done, total: files.length, currentName: file.name })
      const blob: Blob = await withTimeout(compress(file).catch(() => file), 12_000, file)
      if (blob.size > MAX_IMG) {
        errors.push(`${file.name}: Foto teper e madhe edhe pas kompresimit. Provo nje me te vogel.`)
        done++; onProgress?.({ done, total: files.length }); continue
      }
      const ext = blob.type === 'image/gif' ? 'gif' : blob.type === 'image/webp' ? 'webp' : 'jpg'
      const path = `${uid}/${crypto.randomUUID()}.${ext}`
      const err = await uploadWithRetry('listing-images', path, blob)
      done++; onProgress?.({ done, total: files.length })
      if (err) errors.push(`${file.name}: ${err}`)
      else results[idx] = supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl
    }
  }

  await Promise.all(Array.from({ length: Math.min(IMG_CONCURRENCY, files.length) }, worker))
  return { urls: results.filter((u): u is string => !!u), errors }
}

// ── VIDEO ─────────────────────────────────────────────────────────────────────
export const ALLOWED_VIDEO = ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg']
export const MAX_VIDEO = 50 * 1024 * 1024

export async function uploadVideo(
  file: File,
  onProgress?: (p: UploadProgress) => void,
): Promise<{ url?: string; error?: string }> {
  if (!ALLOWED_VIDEO.includes(file.type)) return { error: 'Format i papranuar. Provo MP4, WebM ose MOV.' }
  if (file.size > MAX_VIDEO) return { error: 'Videoja eshte shume e madhe (max 50MB).' }
  onProgress?.({ done: 0, total: 1, currentName: file.name })
  const uid = await requireUid()
  const ext = file.type === 'video/webm' ? 'webm' : file.type === 'video/ogg' ? 'ogv' : file.type === 'video/quicktime' ? 'mov' : 'mp4'
  const path = `${uid}/${crypto.randomUUID()}.${ext}`
  const err = await uploadWithRetry('listing-videos', path, file, 120000, 3)
  onProgress?.({ done: 1, total: 1 })
  if (err) return { error: err }
  return { url: supabase.storage.from('listing-videos').getPublicUrl(path).data.publicUrl }
}

// Kap nje kuader nga videoja si poster (File jpeg) — perdoret si kapak nese s'ka foto.
export function generateVideoPoster(file: File): Promise<File | null> {
  return new Promise(resolve => {
    try {
      const v = document.createElement('video')
      v.muted = true; v.playsInline = true; v.preload = 'metadata'
      const url = URL.createObjectURL(file)
      const done = (f: File | null) => { URL.revokeObjectURL(url); resolve(f) }
      v.onloadeddata = () => { try { v.currentTime = Math.min(1, (v.duration || 2) / 3) } catch { done(null) } }
      v.onseeked = async () => {
        try {
          const scale = Math.min(1, MAX_DIM / Math.max(v.videoWidth, v.videoHeight))
          const canvas = document.createElement('canvas')
          canvas.width = Math.round(v.videoWidth * scale); canvas.height = Math.round(v.videoHeight * scale)
          const ctx = canvas.getContext('2d'); if (!ctx) return done(null)
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
          const blob = await canvasToBlob(canvas, 'image/jpeg', 0.8)
          done(blob ? new File([blob], 'poster.jpg', { type: 'image/jpeg' }) : null)
        } catch { done(null) }
      }
      v.onerror = () => done(null)
      v.src = url
    } catch { resolve(null) }
  })
}

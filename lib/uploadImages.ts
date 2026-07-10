'use client'

import { supabase } from './supabase'

export interface UploadProgress { done: number; total: number; currentName?: string }

const MAX_DIM = 1600

function canvasToJpeg(canvas: HTMLCanvasElement, q: number): Promise<Blob | null> {
  return new Promise(r => canvas.toBlob(b => r(b), 'image/jpeg', q))
}

// Never let a hung decode/encode freeze the upload UI at "0/1": if `p` doesn't
// settle within `ms`, resolve with `fallback` and move on.
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise(resolve => {
    let settled = false
    const finish = (v: T) => { if (!settled) { settled = true; clearTimeout(timer); resolve(v) } }
    const timer = setTimeout(() => finish(fallback), ms)
    p.then(finish, () => finish(fallback))
  })
}

// Classic <img> decode path (fallback when createImageBitmap is unavailable).
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
      const blob = await canvasToJpeg(canvas, 0.78)
      resolve(blob && blob.size < file.size ? blob : file)
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file) }
    img.src = objUrl
  })
}

// Shrink + recompress so payloads are small enough to survive weak mobile links.
// Prefers createImageBitmap (correct EXIF orientation, lower memory on phones).
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
    let blob = await canvasToJpeg(canvas, 0.78)
    // second, harder pass if still heavy (keeps mobile uploads reliable)
    if (blob && blob.size > 1.5 * 1024 * 1024) {
      const smaller = await canvasToJpeg(canvas, 0.6)
      if (smaller && smaller.size < blob.size) blob = smaller
    }
    return blob && blob.size < file.size ? blob : file
  } catch {
    return compressViaImage(file)
  }
}

function friendlyUploadError(msg: string): string {
  if (/failed to fetch|network|timed? ?out|load failed|connection/i.test(msg))
    return 'Rrjeti u ndërpre gjatë ngarkimit. Provo me Wi-Fi ose provo sërish.'
  return msg
}

async function uploadWithRetry(path: string, blob: Blob, attempts = 4): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const uploadPromise = supabase.storage
        .from('listing-images')
        .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true })
      const timeoutPromise = new Promise<{ error: Error }>(resolve =>
        setTimeout(() => resolve({ error: new Error('Upload timed out') }), 45000)
      )
      const result = await Promise.race([uploadPromise, timeoutPromise]) as any
      if (!result.error) return null
      if (i === attempts - 1) return friendlyUploadError(String(result.error.message || ''))
    } catch (e: any) {
      if (i === attempts - 1) return friendlyUploadError(String(e?.message ?? 'Lidhje dështoi'))
    }
    // exponential-ish backoff: 1.5s, 3s, 4.5s
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 1500 * (i + 1)))
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

  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif']
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push(`${file.name}: Lloji i skedarit nuk lejohet. Provo JPG, PNG ose WebP.`)
      done++
      onProgress?.({ done, total: files.length })
      continue
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Skedari është shumë i madh (max 10MB).`)
      done++
      onProgress?.({ done, total: files.length })
      continue
    }

    onProgress?.({ done, total: files.length, currentName: file.name })

    // Compress with a hard 12s cap — some Android images hang createImageBitmap/
    // toBlob forever, which used to freeze the progress at "0/1".
    let blob: Blob = await withTimeout(compress(file).catch(() => file), 12_000, file)

    // If it's still over the bucket limit (compress timed out / couldn't shrink),
    // fail clearly instead of attempting a doomed upload that stalls.
    if (blob.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: Foto është tepër e madhe edhe pas kompresimit. Provo një foto më të vogël.`)
      done++
      onProgress?.({ done, total: files.length })
      continue
    }

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

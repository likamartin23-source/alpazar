'use client'

import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

export interface UploadProgress { done: number; total: number; currentName?: string }

// Optimizim (jo kufi): fotot shume te medha zvogelohen per shpejtesi, por ASNJE
// skedar nuk refuzohet per madhesi. Kufijte e bucket-eve jane hequr (universal).
const MAX_DIM = 1600
const IMG_CONCURRENCY = 3
const RESUMABLE_THRESHOLD = 20 * 1024 * 1024 // >20MB -> ngarkim me copeza (TUS)
const CHUNK = 6 * 1024 * 1024

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
      const blob = await canvasToBlob(canvas, webp ? 'image/webp' : 'image/jpeg', webp ? 0.80 : 0.78)
      resolve(blob && blob.size < file.size ? blob : file)
    }
    img.onerror = () => { URL.revokeObjectURL(objUrl); resolve(file) }
    img.src = objUrl
  })
}

// Optimizim (kurre bllokim): nese s'mund ta perpunoje, kthen skedarin origjinal.
async function compress(file: File): Promise<Blob> {
  if (file.type === 'image/gif') return file
  if (!file.type.startsWith('image/')) return file
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
    let blob = await canvasToBlob(canvas, type, webp ? 0.80 : 0.78)
    if (blob && blob.size > 2 * 1024 * 1024) {
      const smaller = await canvasToBlob(canvas, type, webp ? 0.7 : 0.68)
      if (smaller && smaller.size < blob.size) blob = smaller
    }
    return blob && blob.size < file.size ? blob : file
  } catch {
    return compressViaImage(file)
  }
}

function friendlyUploadError(msg: string): string {
  const m = String(msg || '')
  // Mesazhe të NDERSHME dhe GJITHMONË SHQIP (asnjë gabim i papërkthyer nga serveri).
  if (/exceeded the maximum allowed size|maximum allowed size|payload too large|entity too large|413/i.test(m))
    return 'Skedari është shumë i madh dhe tejkalon kufirin e ngarkimit. Shkurtoje ose ul cilësinë.'
  if (/timed? ?out/i.test(m))
    return 'Ngarkimi zgjati shumë (skedar i madh ose server i ngadaltë) edhe pas disa provash. Provo sërish ose një skedar pak më të vogël.'
  if (/failed to fetch|network|load failed|connection|nderpre/i.test(m))
    return 'Ngarkimi u ndërpre edhe pas disa provash automatike. Provo sërish.'
  if (/exceed|too large|limit/i.test(m))
    return 'Skedari tejkalon kufirin e lejuar. Shkurtoje ose ul cilësinë.'
  if (/permission|denied|unauthorized|forbidden|row-level|policy|jwt/i.test(m))
    return 'Nuk u lejua ngarkimi. Dil e hyr sërish në llogari dhe provo prapë.'
  return m
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

function b64(s: string): string { return btoa(unescape(encodeURIComponent(s))) }

// Ngarkim RESUMABLE (TUS 1.0) — per skedare te medhenj, ne copeza, I GARANTUAR:
// pas cdo ndERprerjeje rrjeti, rimerr offset-in real te serverit (HEAD) dhe RIFILLON nga aty,
// me riprovim + backoff. Nje blip rrjeti NUK e humb ngarkimin — vazhdon aty ku mbeti.
const tusSleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

async function tusHeadOffset(location: string, token: string): Promise<number | null> {
  try {
    const r = await fetch(location, {
      method: 'HEAD',
      headers: { 'Tus-Resumable': '1.0.0', Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    })
    if (r.status === 200 || r.status === 204) {
      const o = parseInt(r.headers.get('Upload-Offset') || '', 10)
      return Number.isNaN(o) ? null : o
    }
  } catch { /* fail-soft */ }
  return null
}

async function resumableUpload(bucket: string, path: string, data: Blob, onFrac?: (f: number) => void): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token || SUPABASE_ANON_KEY
  const contentType = data.type || 'application/octet-stream'

  // 1) CREATE — me riprovim per krijim (deri 4 here)
  let location: string | null = null
  for (let a = 0; a < 4 && !location; a++) {
    try {
      const createRes = await fetch(`${SUPABASE_URL}/storage/v1/upload/resumable`, {
        method: 'POST',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Length': String(data.size),
          'Upload-Metadata': `bucketName ${b64(bucket)},objectName ${b64(path)},contentType ${b64(contentType)},cacheControl ${b64('3600')}`,
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
          'x-upsert': 'true',
        },
      })
      if (createRes.status === 201) {
        let loc = createRes.headers.get('Location') || createRes.headers.get('location')
        if (!loc) return 'resumable_no_location'
        if (loc.startsWith('/')) loc = `${SUPABASE_URL}${loc}`
        location = loc
      } else if (a === 3) {
        return 'resumable_create_' + createRes.status
      }
    } catch (e: any) {
      if (a === 3) return 'resumable_' + String(e?.message ?? 'create_error')
    }
    if (!location) await tusSleep(1000 * (a + 1))
  }
  if (!location) return 'resumable_no_location'

  // 2) PATCH copeza — I GARANTUAR: pas ndERprerjeje, prit, rimerr offset-in real, rifillo.
  let offset = 0
  let stalls = 0
  const MAX_STALLS = 8 // toleron shume ndErprerje para se te dorEzohet
  while (offset < data.size) {
    const end = Math.min(offset + CHUNK, data.size)
    const chunk = data.slice(offset, end)
    try {
      const patchRes = await fetch(location, {
        method: 'PATCH',
        headers: {
          'Tus-Resumable': '1.0.0',
          'Upload-Offset': String(offset),
          'Content-Type': 'application/offset+octet-stream',
          Authorization: `Bearer ${token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: chunk,
      })
      if (patchRes.status === 204) {
        const no = parseInt(patchRes.headers.get('Upload-Offset') || String(end), 10)
        offset = Number.isNaN(no) ? end : no
        onFrac?.(offset / data.size)
        stalls = 0
        continue
      }
      // Jo-204 (p.sh. 409/460 offset-mismatch, 5xx): rimerr offset-in real dhe rifillo
      const srv = await tusHeadOffset(location, token)
      if (srv != null && srv > offset) { offset = srv; onFrac?.(offset / data.size); stalls = 0; continue }
      stalls++
      if (stalls >= MAX_STALLS) return 'resumable_patch_' + patchRes.status
      await tusSleep(1200 * Math.min(stalls, 6))
    } catch (e: any) {
      // NDERPRERJE RRJETI: prit, rimerr offset-in real nga serveri, rifillo nga aty
      stalls++
      if (stalls >= MAX_STALLS) return 'resumable_' + String(e?.message ?? 'network')
      await tusSleep(1200 * Math.min(stalls, 6))
      const srv = await tusHeadOffset(location, token)
      if (srv != null) { offset = srv; onFrac?.(offset / data.size) }
    }
  }
  return null
}

async function standardUpload(bucket: string, path: string, blob: Blob, timeoutMs: number, attempts = 4): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const uploadPromise = supabase.storage.from(bucket)
        .upload(path, blob, { contentType: blob.type || 'application/octet-stream', upsert: true })
      const timeoutPromise = new Promise<{ error: Error }>(resolve =>
        setTimeout(() => resolve({ error: new Error('Upload timed out') }), timeoutMs))
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

// Zgjedh strategji: skedare te medhenj -> resumable (fallback ne standard); te vegjel -> standard.
async function putObject(bucket: string, path: string, blob: Blob, timeoutMs: number, onFrac?: (f: number) => void): Promise<string | null> {
  if (blob.size > RESUMABLE_THRESHOLD) {
    const rerr = await resumableUpload(bucket, path, blob, onFrac)
    if (!rerr) return null
    // fallback: provo standard nese resumable s'punon ne kete mjedis
  }
  return standardUpload(bucket, path, blob, timeoutMs)
}

// ── Ngarkim fotosh NE PARALEL (pa kufi madhesie; rendi ruhet: [0]=kryesorja) ──
export async function uploadImages(
  files: File[],
  onProgress?: (p: UploadProgress) => void,
): Promise<{ urls: string[]; errors: string[] }> {
  if (files.length === 0) return { urls: [], errors: [] }
  onProgress?.({ done: 0, total: files.length })
  const uid = await requireUid()

  const results: (string | null)[] = new Array(files.length).fill(null)
  const errBy: (string | null)[] = new Array(files.length).fill(null) // gabimi për indeks
  let done = 0
  let cursor = 0

  const extOf = (b: Blob) => b.type === 'image/gif' ? 'gif' : b.type === 'image/webp' ? 'webp' : b.type === 'image/png' ? 'png' : 'jpg'

  async function attempt(idx: number, timeoutMs: number): Promise<boolean> {
    const file = files[idx]
    const blob: Blob = await withTimeout(compress(file).catch(() => file), 20_000, file)
    const path = `${uid}/${crypto.randomUUID()}.${extOf(blob)}`
    const err = await putObject('listing-images', path, blob, timeoutMs)
    if (err) { errBy[idx] = err; return false }
    results[idx] = supabase.storage.from('listing-images').getPublicUrl(path).data.publicUrl
    errBy[idx] = null
    return true
  }

  async function worker() {
    while (true) {
      const idx = cursor++
      if (idx >= files.length) return
      const file = files[idx]
      if (!file.type.startsWith('image/')) {
        errBy[idx] = 'Nuk eshte imazh.'
        done++; onProgress?.({ done, total: files.length }); continue
      }
      onProgress?.({ done, total: files.length, currentName: file.name })
      await attempt(idx, 120000)
      done++; onProgress?.({ done, total: files.length })
    }
  }

  await Promise.all(Array.from({ length: Math.min(IMG_CONCURRENCY, files.length) }, worker))

  // GARANCI: riprovim FINAL sekuencial (një nga një → pa kontanie rrjeti) me timeout më të gjatë,
  // për skedaret që dështuan në valën paralele. Shpesh një foto e vetme dështon kur 3 ngarkohen njëkohësisht.
  const failed = results.map((u, i) => (u ? -1 : i)).filter(i => i >= 0 && files[i].type.startsWith('image/'))
  for (const idx of failed) {
    onProgress?.({ done, total: files.length, currentName: files[idx].name })
    await attempt(idx, 180000)
  }

  const errors = errBy
    .map((e, i) => (e && !results[i]) ? `${files[i].name}: ${friendlyUploadError(e)}` : null)
    .filter((e): e is string => !!e)
  return { urls: results.filter((u): u is string => !!u), errors }
}

// Ngarkim i NJE imazhi te vetem ne nje bucket te dhene (logo/kopertine/galeri biznesi).
// Rikthen URL me path UNIK (crypto.randomUUID) → cache-bust automatik + ZERO perplasje
// mes bizneseve/rikrijueve; tip/extension i SAKTE nga blob-i real (jo jpeg i ngurtesuar);
// EXIF-orientim + webp nga compress(); retry/resumable nga putObject().
export async function uploadSingleImage(
  file: File,
  bucket: string,
): Promise<{ url?: string; error?: string }> {
  if (!file.type.startsWith('image/')) return { error: 'Skedari nuk eshte imazh.' }
  const uid = await requireUid()
  const blob: Blob = await withTimeout(compress(file).catch(() => file), 20_000, file)
  const ext = blob.type === 'image/gif' ? 'gif' : blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${uid}/${crypto.randomUUID()}.${ext}`
  const err = await putObject(bucket, path, blob, 120000)
  if (err) return { error: friendlyUploadError(err) }
  return { url: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl }
}

// ── Cloudflare Stream (transkodim H.264 + streaming adaptiv) — GATI-por-në-gjumë ──
// Rekomandimi kryesor: çdo video (edhe H.265/HEVC) shndërrohet automatikisht dhe luhet KUDO,
// e rrjedhshme, me zë e pa zë. Aktivizohet kur app_config ka `cf_stream_customer_code` (PUBLIK,
// pjesë e çdo URL-je luajtjeje) DHE serveri ka çelësin (admin_settings: cf_account_id + cf_stream_token).
// Ngarkimi bëhet me tus (i njëjti protokoll i garantuar që përdorim) drejt Cloudflare-it — skedari
// s'kalon nga serveri ynë; çelësi rri vetëm në server. Deri sa të konfigurohet, rri fjetur.
let _cfCode: string | null | undefined
async function getStreamCode(): Promise<string | null> {
  if (_cfCode !== undefined) return _cfCode
  try {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'cf_stream_customer_code').maybeSingle()
    const c = (data?.value ?? '').trim()
    _cfCode = c || null
  } catch { _cfCode = null }
  return _cfCode
}

// tus PATCH drejt një URL-je të krijuar tashmë (Cloudflare direct creator upload) — pa header-a
// Supabase. I njëjti rifillim i garantuar: pas ndërprerjeje, rimerr offset-in real (HEAD) dhe vazhdon.
async function tusUploadToUrl(location: string, data: Blob, onFrac?: (f: number) => void): Promise<string | null> {
  let offset = 0
  let stalls = 0
  const MAX_STALLS = 8
  const headOffset = async (): Promise<number | null> => {
    try {
      const r = await fetch(location, { method: 'HEAD', headers: { 'Tus-Resumable': '1.0.0' } })
      if (r.status === 200 || r.status === 204) { const o = parseInt(r.headers.get('Upload-Offset') || '', 10); return Number.isNaN(o) ? null : o }
    } catch { /* fail-soft */ }
    return null
  }
  while (offset < data.size) {
    const end = Math.min(offset + CHUNK, data.size)
    try {
      const patchRes = await fetch(location, {
        method: 'PATCH',
        headers: { 'Tus-Resumable': '1.0.0', 'Upload-Offset': String(offset), 'Content-Type': 'application/offset+octet-stream' },
        body: data.slice(offset, end),
      })
      if (patchRes.status === 204 || patchRes.status === 200) {
        const no = parseInt(patchRes.headers.get('Upload-Offset') || String(end), 10)
        offset = Number.isNaN(no) ? end : no
        onFrac?.(offset / data.size); stalls = 0; continue
      }
      const srv = await headOffset()
      if (srv != null && srv > offset) { offset = srv; onFrac?.(offset / data.size); stalls = 0; continue }
      stalls++; if (stalls >= MAX_STALLS) return 'stream_patch_' + patchRes.status
      await tusSleep(1200 * Math.min(stalls, 6))
    } catch (e: any) {
      stalls++; if (stalls >= MAX_STALLS) return 'stream_' + String(e?.message ?? 'network')
      await tusSleep(1200 * Math.min(stalls, 6))
      const srv = await headOffset(); if (srv != null) { offset = srv; onFrac?.(offset / data.size) }
    }
  }
  return null
}

async function uploadVideoStream(
  file: File, code: string, maxSeconds: number, onProgress?: (p: UploadProgress) => void,
): Promise<{ url?: string; error?: string; poster?: string; duration?: number }> {
  // 1) Serveri krijon URL-në një-përdorimëshe (çelësi rri në server).
  let created: { uploadURL?: string; uid?: string; error?: string }
  try {
    const r = await fetch('/api/video/stream-upload', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ size: file.size, maxSeconds, name: file.name }),
    })
    created = await r.json().catch(() => ({}))
    if (!r.ok || !created.uploadURL || !created.uid) return { error: friendlyUploadError(created?.error || 'stream_init') }
  } catch (e: any) { return { error: friendlyUploadError(String(e?.message ?? 'stream_init')) } }

  // 2) Ngarkim tus i garantuar drejt Cloudflare-it.
  const err = await tusUploadToUrl(created.uploadURL!, file, f => onProgress?.({ done: Math.round(f * 100), total: 100, currentName: file.name }))
  onProgress?.({ done: 100, total: 100 })
  if (err) return { error: friendlyUploadError(err) }

  // 3) URL-të e luajtjes (Cloudflare shndërron async; iframe/HLS punojnë sapo bëhet gati).
  const uid = created.uid!
  return {
    url: `https://customer-${code}.cloudflarestream.com/${uid}/iframe`,
    poster: `https://customer-${code}.cloudflarestream.com/${uid}/thumbnails/thumbnail.jpg`,
  }
}

// ── Transkodim automatik (Cloudinary) — GATI-por-në-gjumë ─────────────────────
// Aktivizohet VETËM kur `app_config` ka `cloudinary_cloud_name` + `cloudinary_upload_preset`
// (të dyja PUBLIKE, jo sekrete — kjo është "unsigned upload", e menduar për klientin; §2.7).
// Deri atëherë rri fjetur dhe përdoret ruajtja standarde te Supabase Storage — asgjë s'prishet.
// Kur aktiv: ÇDO kodek (edhe H.265/HEVC nga telefonat) shndërrohet automatikisht në H.264 mp4
// që luhet KUDO — garancia "videoja luhet gjithmonë".
let _cldCfg: { cloud: string; preset: string } | null | undefined
async function getCloudinary(): Promise<{ cloud: string; preset: string } | null> {
  if (_cldCfg !== undefined) return _cldCfg
  try {
    const { data } = await supabase.from('app_config').select('key,value')
      .in('key', ['cloudinary_cloud_name', 'cloudinary_upload_preset'])
    const m: Record<string, string> = {}
    for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = (r.value ?? '').trim()
    _cldCfg = (m.cloudinary_cloud_name && m.cloudinary_upload_preset)
      ? { cloud: m.cloudinary_cloud_name, preset: m.cloudinary_upload_preset } : null
  } catch { _cldCfg = null }
  return _cldCfg
}

// A është ndezur transkodimi automatik? (Cloudflare Stream OSE Cloudinary). E lexon UI-ja që të
// mos refuzojë videot e padekodueshme (H.265) kur ofruesi i shndërron gjithsesi.
export async function transcodingEnabled(): Promise<boolean> {
  const [code, cld] = await Promise.all([getStreamCode(), getCloudinary()])
  return !!(code || cld)
}

function uploadVideoCloudinary(
  file: File, cfg: { cloud: string; preset: string }, onProgress?: (p: UploadProgress) => void,
): Promise<{ url?: string; error?: string; duration?: number }> {
  return new Promise(resolve => {
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${cfg.cloud}/video/upload`)
      xhr.timeout = 600000
      xhr.upload.onprogress = e => {
        if (e.lengthComputable) onProgress?.({ done: Math.round((e.loaded / e.total) * 100), total: 100, currentName: file.name })
      }
      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const j = JSON.parse(xhr.responseText)
            const pid = String(j.public_id || '')
            // URL delivery e detyruar në mp4/H.264 → luhet në çdo shfletues, pavarësisht burimit.
            const url = `https://res.cloudinary.com/${cfg.cloud}/video/upload/f_mp4/${encodeURIComponent(pid)}.mp4`
            resolve({ url, duration: typeof j.duration === 'number' ? Math.round(j.duration) : undefined })
          } else {
            let msg = 'cloudinary_' + xhr.status
            try { msg = JSON.parse(xhr.responseText)?.error?.message || msg } catch { /* keep code */ }
            resolve({ error: friendlyUploadError(msg) })
          }
        } catch (e: any) { resolve({ error: friendlyUploadError(String(e?.message ?? 'cloudinary_parse')) }) }
      }
      xhr.onerror = () => resolve({ error: friendlyUploadError('network') })
      xhr.ontimeout = () => resolve({ error: friendlyUploadError('timed out') })
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', cfg.preset)
      xhr.send(fd)
    } catch (e: any) { resolve({ error: friendlyUploadError(String(e?.message ?? 'cloudinary')) }) }
  })
}

// ── VIDEO (pa kufi artificial; resumable per skedare te medhenj) ──────────────
export async function uploadVideo(
  file: File,
  onProgress?: (p: UploadProgress) => void,
  opts?: { maxSeconds?: number },
): Promise<{ url?: string; error?: string; duration?: number; poster?: string }> {
  if (!file.type.startsWith('video/')) return { error: 'Skedari nuk eshte video.' }
  onProgress?.({ done: 0, total: 100, currentName: file.name })

  // Prioriteti: Cloudflare Stream (rekomandimi kryesor) → Cloudinary → Supabase Storage.
  // Të dy të parët transkodojnë çdo kodek në H.264 që luhet kudo. Në dështim kthejnë gabim të
  // qartë (NUK ruajmë video të padekodueshme në heshtje) — garancia mbetet e paprekur.
  const code = await getStreamCode()
  if (code) {
    const r = await uploadVideoStream(file, code, opts?.maxSeconds ?? 600, onProgress)
    onProgress?.({ done: 100, total: 100 })
    return r
  }

  const cld = await getCloudinary()
  if (cld) {
    const r = await uploadVideoCloudinary(file, cld, onProgress)
    onProgress?.({ done: 100, total: 100 })
    return r
  }

  // Përndryshe: ruajtje standarde te Supabase Storage (burimi duhet H.264 — guardi e siguron).
  const uid = await requireUid()
  const map: Record<string, string> = { 'video/webm': 'webm', 'video/ogg': 'ogv', 'video/quicktime': 'mov', 'video/mp4': 'mp4' }
  const ext = map[file.type] || (file.name.split('.').pop() || 'mp4')
  const path = `${uid}/${crypto.randomUUID()}.${ext}`
  const err = await putObject('listing-videos', path, file, 600000, f => onProgress?.({ done: Math.round(f * 100), total: 100, currentName: file.name }))
  onProgress?.({ done: 100, total: 100 })
  if (err) return { error: friendlyUploadError(err) }
  return { url: supabase.storage.from('listing-videos').getPublicUrl(path).data.publicUrl }
}

// Kap nje kuader nga videoja si poster (File jpeg).
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
          const blob = await canvasToBlob(canvas, 'image/jpeg', 0.82)
          done(blob ? new File([blob], 'poster.jpg', { type: 'image/jpeg' }) : null)
        } catch { done(null) }
      }
      v.onerror = () => done(null)
      v.src = url
    } catch { resolve(null) }
  })
}

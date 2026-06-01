import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../lib/supabase'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'

export const runtime = 'nodejs'

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif'])
const MAX_FILES = 15
const MAX_SIZE_MB = 25

interface FileInfo { name: string; type: string; size: number }

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`presign:${ip}`, { limit: 40, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ error: 'Shumë kërkesa. Provo pas 1 minute.' }, { status: 429 })

  const token = req.headers.get('authorization')?.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'Kërkohet autentifikimi.' }, { status: 401 })

  const userSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error: authErr } = await userSb.auth.getUser()
  if (authErr || !user) return NextResponse.json({ error: 'Sesion i pavlefshëm. Hyr sërisht.' }, { status: 401 })

  let body: { files?: FileInfo[] }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Kërkesë e gabuar.' }, { status: 400 }) }

  const files = body.files
  if (!Array.isArray(files) || files.length === 0) return NextResponse.json({ error: 'Asnjë skedar i specifikuar.' }, { status: 400 })
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Maksimumi ${MAX_FILES} foto.` }, { status: 400 })

  for (const f of files) {
    if (!ALLOWED_TYPES.has((f.type || '').toLowerCase())) {
      return NextResponse.json({ error: `Tipi "${f.type}" nuk lejohet. Lejohen: JPEG, PNG, WEBP, GIF.` }, { status: 400 })
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `"${f.name}" është shumë i madh. Max ${MAX_SIZE_MB}MB.` }, { status: 400 })
    }
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Konfigurim serveri i mangët (SUPABASE_SERVICE_ROLE_KEY).' }, { status: 500 })
  }

  const uploads: Array<{ signedUrl: string; path: string; publicUrl: string }> = []
  for (const f of files) {
    const isGif = f.type === 'image/gif'
    const ext = isGif ? 'gif' : 'jpg'
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

    const { data, error } = await supabaseAdmin.storage
      .from('listing-images')
      .createSignedUploadUrl(path, { upsert: false })

    if (error || !data) {
      return NextResponse.json({ error: `Gabim server gjatë rezervimit: ${error?.message ?? 'unknown'}` }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('listing-images')
      .getPublicUrl(path)

    uploads.push({ signedUrl: data.signedUrl, path, publicUrl })
  }

  return NextResponse.json({ uploads })
}

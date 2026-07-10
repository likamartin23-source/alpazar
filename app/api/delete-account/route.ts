import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GDPR Art.17 — delegon te Edge Function `delete-account` (service_role i
// injektuar automatikisht). Vercel S'KA SERVICE_ROLE_KEY → getSupabaseAdmin
// jepte 500 dhe fshirja s'ndodhte kurrë. Tani funksionon.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`delete-account:${ip}`, { limit: 3, windowMs: 60 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Shumë kërkesa. Provo përsëri pas pak.' }, { status: 429 })
  }

  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Pa autorizim' }, { status: 401 })
  }
  const token = auth.slice(7)

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON,
      },
      body: JSON.stringify({ token }),
    })
    const jsonRes = await res.json().catch(() => ({ error: 'Përgjigje e pavlefshme' }))
    return NextResponse.json(jsonRes, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Gabim serveri' }, { status: 500 })
  }
}

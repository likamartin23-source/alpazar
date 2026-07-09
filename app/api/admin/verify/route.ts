import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../../lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Verifikimi i Admin PIN delegohet te Edge Function `admin-action` (verify_pin),
// e cila ka throttle 30/10min PËR IP në DB (admin_action_throttle) — mbron nga
// brute-force në serverless ku rate-limit-i in-memory s'ndahet mes instancave.
// RPC-ja verify_admin_pin s'është më e ekspozuar te anon (brute-force i drejtpërdrejtë
// via PostgREST u bllokua).
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  // Mburojë e parë e lehtë (per-instancë); mbrojtja reale është throttle-i në DB.
  const rl = rateLimit(`admin-verify:${ip}`, { limit: 10, windowMs: 15 * 60_000 })
  if (!rl.allowed) return NextResponse.json({ ok: false }, { status: 429 })

  const { pin } = await req.json().catch(() => ({ pin: '' }))
  if (!pin || typeof pin !== 'string' || pin.length > 200) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON}`,
        apikey: SUPABASE_ANON,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({ pin, action: 'verify_pin', params: {} }),
    })
    const j = await res.json().catch(() => ({ ok: false }))
    return NextResponse.json({ ok: !!j.ok }, { status: j.ok ? 200 : (res.status === 429 ? 429 : 401) })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../../lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`admin-verify:${ip}`, { limit: 5, windowMs: 15 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }

  const { pin } = await req.json().catch(() => ({ pin: '' }))
  if (!pin || typeof pin !== 'string' || pin.length > 200) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  // Primary source of truth: PIN stored in DB (admin_settings.admin_pin), checked
  // via a SECURITY DEFINER RPC — no ADMIN_PIN env or service-role key required.
  try {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data, error } = await db.rpc('verify_admin_pin', { p_pin: pin })
    if (!error && data === true) {
      return NextResponse.json({ ok: true })
    }
  } catch { /* fall through to env fallback */ }

  // Fallback: ADMIN_PIN env (timing-safe) if it is configured.
  const ADMIN_PIN = process.env.ADMIN_PIN
  if (ADMIN_PIN &&
      pin.length === ADMIN_PIN.length &&
      timingSafeEqual(Buffer.from(pin), Buffer.from(ADMIN_PIN))) {
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ ok: false }, { status: 401 })
}

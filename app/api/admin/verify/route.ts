import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`admin-verify:${ip}`, { limit: 3, windowMs: 15 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 })
  }
  const ADMIN_PIN = process.env.ADMIN_PIN
  if (!ADMIN_PIN) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const { pin } = await req.json().catch(() => ({ pin: '' }))

  if (!pin || pin !== ADMIN_PIN) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}

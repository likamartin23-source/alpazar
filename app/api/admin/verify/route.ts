import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
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

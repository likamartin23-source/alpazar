import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const { pin } = await req.json().catch(() => ({ pin: '' }))
  const ADMIN_PIN = process.env.ADMIN_PIN || '000000'

  if (!pin || pin !== ADMIN_PIN) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  return NextResponse.json({ ok: true })
}

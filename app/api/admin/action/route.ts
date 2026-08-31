import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'
import { kerkoAdmin } from '../../../../lib/adminGuard'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../../lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Veprimet e panelit admin (moderim/premium/metoda) → Edge Function
// `admin-action` (service_role — kalon RLS-në is_admin() që bllokonte veprimet
// kur admini hyn vetëm me PIN). PIN-i verifikohet brenda funksionit.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`admin-action:${ip}`, { limit: 60, windowMs: 10 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Shumë kërkesa.' }, { status: 429 })
  }

  /*  MBROJTJE NE THELLESI (31 gusht 2026). Kjo rruge delegon te nje Edge
      Function me `service_role`, i cili kalon RLS-ne, matricen e lejeve dhe
      trigerin e privilegjeve. Deri sot porta e vetme ishte nje PIN
      gjashtevendesh — ndersa paneli vete kishte kaluar te sesioni + is_admin +
      MFA dhe as nuk e kerkonte me ate PIN. Tani duhen te DYJA: sesion i
      vertete admini DHE PIN-i. */
  const ndalese = await kerkoAdmin(req)
  if (ndalese) return ndalese

  const body = await req.json().catch(() => ({}))
  const pin = typeof body.pin === 'string' ? body.pin : ''
  const action = typeof body.action === 'string' ? body.action : ''
  const params = body.params && typeof body.params === 'object' ? body.params : {}
  if (!pin || !action) {
    return NextResponse.json({ ok: false, error: 'Të dhëna të paplota' }, { status: 400 })
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
      body: JSON.stringify({ pin, action, params }),
    })
    const jsonRes = await res.json().catch(() => ({ ok: false }))
    return NextResponse.json(jsonRes, { status: res.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'Gabim serveri' }, { status: 500 })
  }
}

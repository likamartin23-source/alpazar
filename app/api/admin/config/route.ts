import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'
import { kerkoAdmin } from '../../../../lib/adminGuard'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../../lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Shkrim i konfigurimeve nga paneli admin. Delegon te Edge Function
// `admin-config` (service_role — kalon RLS-në is_admin() që bllokonte shkrimet
// kur admini hyn vetëm me PIN, jo me sesion Supabase). PIN-i verifikohet brenda
// funksionit; këtu shtojmë një rate-limit të parë sipas IP-së.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`admin-config:${ip}`, { limit: 40, windowMs: 10 * 60_000 })
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
  const key = typeof body.key === 'string' ? body.key : ''
  const value = body.value == null ? '' : String(body.value)
  const table = body.table === 'admin_settings' ? 'admin_settings' : 'app_config'
  if (!pin || !key) {
    return NextResponse.json({ ok: false, error: 'Të dhëna të paplota' }, { status: 400 })
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON}`,
        apikey: SUPABASE_ANON,
        'x-forwarded-for': ip,
      },
      body: JSON.stringify({ pin, key, value, table }),
    })
    const jsonRes = await res.json().catch(() => ({ ok: false }))
    return NextResponse.json(jsonRes, { status: res.status })
  } catch {
    return NextResponse.json({ ok: false, error: 'Gabim serveri' }, { status: 500 })
  }
}

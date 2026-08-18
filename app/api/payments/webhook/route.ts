import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { getSupabaseAdmin } from '../../../../lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Webhook i pagesave: HYRJA e leximit automatik.
// FAIL-CLOSED: pa PAYMENT_WEBHOOK_SECRET nuk perpunohet asgje (kurre grant mbi
// input te paverifikuar). Regjistrimi/dhurimi manual nga paneli mbetet gjithmone
// i disponueshem si rrjete sigurie.
//
// Trupi normalizohet nga ofruesi (adapter) ne formen:
//   { provider, provider_ref, user_id?|email?, plan_id?|plan_slug?, amount, currency, event_type? }
// Nenshkrimi: header 'x-alpazar-signature' = HMAC-SHA256(rawBody, secret) ne hex.
// Idempotenca dhe atomiciteti garantohen nga funksioni DB process_payment_event.

function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length || ba.length === 0) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) {
    // Ende i palidhur me ofrues pagese - pergjigju fail-closed.
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const raw = await req.text()
  const sig = req.headers.get('x-alpazar-signature') || ''
  const expected = createHmac('sha256', secret).update(raw).digest('hex')
  if (!safeEqualHex(sig, expected)) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 401 })
  }

  let body: any
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 })
  }

  const provider = String(body.provider || '').trim()
  const providerRef = String(body.provider_ref || body.id || '').trim()
  if (!provider || !providerRef) {
    return NextResponse.json({ error: 'ref_required' }, { status: 400 })
  }

  try {
    const db = getSupabaseAdmin()

    // Zgjidh perdoruesin (user_id ose email). Nese s'zgjidhet, process_payment_event
    // e regjistron pagesen si 'review' (paraja nuk humbet).
    let userId: string | null = body.user_id || null
    if (!userId && body.email) {
      const { data } = await db.from('profiles').select('id').eq('email', String(body.email)).maybeSingle()
      userId = (data as any)?.id || null
    }

    // Zgjidh planin (plan_id ose plan_slug).
    let planId: string | null = body.plan_id || null
    if (!planId && body.plan_slug) {
      const { data } = await db.from('premium_plans').select('id').eq('slug', String(body.plan_slug)).eq('is_active', true).maybeSingle()
      planId = (data as any)?.id || null
    }

    const { data, error } = await db.rpc('process_payment_event', {
      p_provider: provider,
      p_provider_ref: providerRef,
      p_user: userId,
      p_plan_id: planId,
      p_amount: Number(body.amount || 0),
      p_currency: String(body.currency || 'ALL'),
      p_event_type: String(body.event_type || 'payment'),
      p_payload: body,
    })

    if (error) {
      // Gabim i papritur i DB -> 500, qe ofruesi ta riprovoje webhook-un.
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    // ok / already / review / grant_failed = TE REGJISTRUARA -> 200 (mos riprovo;
    // rrjeta e sigurise reconcile_payments ose admini manual e trajton me pas).
    return NextResponse.json({ received: true, result: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 })
  }
}

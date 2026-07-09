// Supabase Edge Function: `admin-action`
// Veprimet e panelit admin (moderim, premium, metoda pagese) me service_role
// — kalon RLS-në is_admin() që bllokonte veprimet kur admini hyn me PIN (jo me
// sesion Supabase). PIN + throttle 30/10min për IP (admin_action_throttle).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (o: unknown, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const pin = String(body.pin ?? '')
    const action = String(body.action ?? '')
    const p = body.params ?? {}

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const { data: thr } = await db.from('admin_action_throttle').select('attempts, window_start').eq('ip', ip).maybeSingle()
    let attempts = 0
    if (thr) {
      const elapsed = Date.now() - new Date(thr.window_start).getTime()
      if (elapsed < 600_000) {
        attempts = thr.attempts
        if (attempts >= 30) return json({ ok: false, error: 'Shumë përpjekje. Prit ~10 min.' }, 429)
      } else {
        await db.from('admin_action_throttle').update({ attempts: 0, window_start: new Date().toISOString() }).eq('ip', ip)
      }
    }

    const { data: pinRow } = await db.from('admin_settings').select('value').eq('key', 'admin_pin').maybeSingle()
    if (!pinRow || pinRow.value !== pin) {
      await db.from('admin_action_throttle').upsert({ ip, attempts: attempts + 1, window_start: thr ? (thr as any).window_start : new Date().toISOString() })
      return json({ ok: false, error: 'PIN i gabuar' }, 401)
    }
    await db.from('admin_action_throttle').upsert({ ip, attempts: 0, window_start: new Date().toISOString() })

    async function run(): Promise<{ ok: boolean; error?: string }> {
      switch (action) {
        case 'verify_pin':
          return { ok: true }
        case 'resolve_report': {
          const { error } = await db.from('reports').update({ status: p.status }).eq('id', p.report_id)
          return { ok: !error, error: error?.message }
        }
        case 'remove_listing': {
          const { error: e1 } = await db.from('listings').update({ is_active: false }).eq('id', p.listing_id)
          if (e1) return { ok: false, error: e1.message }
          if (p.seller_id) {
            await db.from('notifications').insert({
              user_id: p.seller_id, type: 'listing_removed',
              title: 'Shpallja juaj u çaktivizua',
              body: 'Shpallja juaj u çaktivizua pas shqyrtimit të një raporti. Kontaktoni support@alpazar.al për informacion.',
              link: `/listing/${p.listing_id}`,
            })
          }
          if (p.report_id) await db.from('reports').update({ status: 'resolved' }).eq('id', p.report_id)
          return { ok: true }
        }
        case 'resolve_takedown': {
          const { error } = await db.from('takedown_requests').update({
            status: p.status, resolver_note: p.note ?? '', resolved_at: new Date().toISOString(),
          }).eq('id', p.id)
          return { ok: !error, error: error?.message }
        }
        case 'sub_status': {
          const { error: e1 } = await db.from('premium_subscriptions').update({ status: p.status }).eq('id', p.id)
          if (e1) return { ok: false, error: e1.message }
          if (p.status === 'active' && p.user_id)
            await db.from('profiles').update({ is_premium: true, premium_expires_at: p.end_date ?? null }).eq('id', p.user_id)
          if ((p.status === 'cancelled' || p.status === 'suspended') && p.user_id)
            await db.from('profiles').update({ is_premium: false }).eq('id', p.user_id)
          return { ok: true }
        }
        case 'premium_request': {
          const { error: e1 } = await db.from('premium_requests').update({ status: p.action }).eq('id', p.id)
          if (e1) return { ok: false, error: e1.message }
          if (p.action === 'approved' && p.user_id) {
            const exp = new Date(); exp.setDate(exp.getDate() + (Number(p.days) || 30))
            await db.from('profiles').update({ is_premium: true, premium_expires_at: exp.toISOString() }).eq('id', p.user_id)
          }
          return { ok: true }
        }
        case 'gift_premium': {
          const days = Number(p.days); if (!days || days <= 0) return { ok: false, error: 'ditë të pavlefshme' }
          const exp = new Date(); exp.setDate(exp.getDate() + days)
          const { error } = await db.from('profiles').update({ is_premium: true, premium_expires_at: exp.toISOString() }).eq('id', p.user_id)
          return { ok: !error, error: error?.message }
        }
        case 'toggle_method': {
          const { error } = await db.from('payment_methods').update({ is_active: !!p.active }).eq('id', p.id)
          return { ok: !error, error: error?.message }
        }
        default:
          return { ok: false, error: 'veprim i panjohur' }
      }
    }

    const r = await run()
    return json(r, r.ok ? 200 : 500)
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500)
  }
})

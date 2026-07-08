// Supabase Edge Function: `admin-config`
// Shkrim i konfigurimeve nga paneli admin, i mbrojtur me PIN, me service_role
// (kalon RLS-në is_admin() që bllokonte shkrimet kur admini s'ishte i kyçur si
// user Supabase). Throttle 20 përpjekje / 10 min për IP kundër brute-force.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(o: unknown, s = 200) {
  return new Response(JSON.stringify(o), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const ALLOWED_SETTINGS = new Set([
  'brevo_api_key', 'brevo_from_email', 'resend_api_key', 'resend_from_email',
  'site_name', 'site_slogan', 'primary_color', 'accent_color',
  'google_client_id', 'admin_pin',
])

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const pin = String(body.pin ?? '')
    const key = String(body.key ?? '').trim()
    const value = String(body.value ?? '')
    const table = body.table === 'admin_settings' ? 'admin_settings' : 'app_config'
    if (!key) return json({ ok: false, error: 'key required' }, 400)

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'
    const { data: thr } = await db.from('admin_action_throttle').select('attempts, window_start').eq('ip', ip).maybeSingle()
    const now = Date.now()
    let attempts = 0
    if (thr) {
      const elapsed = now - new Date(thr.window_start).getTime()
      if (elapsed < 600_000) {
        attempts = thr.attempts
        if (attempts >= 20) return json({ ok: false, error: 'Shumë përpjekje. Prit ~10 min.' }, 429)
      } else {
        attempts = 0
        await db.from('admin_action_throttle').update({ attempts: 0, window_start: new Date().toISOString() }).eq('ip', ip)
      }
    }

    const { data: pinRow } = await db.from('admin_settings').select('value').eq('key', 'admin_pin').maybeSingle()
    const pinOk = !!pinRow && pinRow.value === pin
    if (!pinOk) {
      await db.from('admin_action_throttle').upsert({
        ip, attempts: attempts + 1,
        window_start: thr ? (thr as any).window_start : new Date().toISOString(),
      })
      return json({ ok: false, error: 'PIN i gabuar' }, 401)
    }

    if (table === 'admin_settings' && !ALLOWED_SETTINGS.has(key)) {
      return json({ ok: false, error: 'key not allowed' }, 400)
    }

    const { error: upErr } = await db.from(table).upsert({ key, value }, { onConflict: 'key' })
    if (upErr) return json({ ok: false, error: upErr.message }, 500)

    await db.from('admin_action_throttle').upsert({ ip, attempts: 0, window_start: new Date().toISOString() })

    return json({ ok: true, key, value })
  } catch (e) {
    return json({ ok: false, error: String((e as Error).message ?? e) }, 500)
  }
})

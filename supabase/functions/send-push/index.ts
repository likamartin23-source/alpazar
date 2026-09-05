// EDGE FUNCTION: send-push — dërguesi i web-push (Faza C, 5 shtator 2026).
//
// GATI, POR JO E VENDOSUR ende: kërkon çelësa VAPID (sekret i pronarit). Pa ta,
// kthen 200 'unconfigured' (inerte). Thirret nga trigeri `tg_notification_web_push`
// (pg_net) me header `x-push-secret`. Lexon push_subscriptions (service_role),
// dërgon njoftimin, dhe fshin abonimet e skaduara (404/410).
//
// Vendosje (pas çelësave): supabase functions deploy send-push  (ose MCP deploy_edge_function)
// Sekrete: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, SEND_PUSH_SECRET.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC  = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@alpazar.al'
const SECRET        = Deno.env.get('SEND_PUSH_SECRET') ?? ''
const SB_URL        = Deno.env.get('SUPABASE_URL') ?? ''
const SB_SERVICE    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 })
  // Autorizim: sekret i përbashkët nga trigeri (jo publik).
  if (!SECRET || req.headers.get('x-push-secret') !== SECRET) {
    return new Response('unauthorized', { status: 401 })
  }
  // Pa çelësa VAPID → inerte (s'prish gjë).
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return new Response('unconfigured', { status: 200 })

  let payload: any
  try { payload = await req.json() } catch { return new Response('bad json', { status: 400 }) }
  const userId = payload?.user_id
  if (!userId) return new Response('no user', { status: 400 })

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  const sb = createClient(SB_URL, SB_SERVICE)

  const { data: subs } = await sb.from('push_subscriptions').select('*').eq('user_id', userId)
  if (!subs || subs.length === 0) return new Response(JSON.stringify({ sent: 0 }), { status: 200 })

  const body = JSON.stringify({
    title: payload.title || 'Alpazar',
    body:  payload.body  || '',
    url:   payload.url   || '/',
    tag:   payload.tag   || undefined,
  })

  let sent = 0, removed = 0
  for (const s of subs as any[]) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      )
      sent++
    } catch (e: any) {
      const code = e?.statusCode
      if (code === 404 || code === 410) {
        await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
        removed++
      }
    }
  }
  return new Response(JSON.stringify({ sent, removed }), {
    status: 200, headers: { 'content-type': 'application/json' },
  })
})

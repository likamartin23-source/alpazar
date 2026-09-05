// EDGE FUNCTION send-push — vetë-provizionues (v2, 5 shtator 2026). DEPLOYED, LIVE.
// Çelësat VAPID gjenerohen NGA vetë funksioni në thirrjen e parë dhe ruhen te
// admin_settings (privat) + app_config (publik, për klientin). Privati s'del KURRË
// nga serveri — as në git, as në bisedë. Auth: x-push-secret krahasuar me
// admin_settings.send_push_secret (edhe ky vetë-gjeneruar). Pa dashboard.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SB_URL     = Deno.env.get('SUPABASE_URL') ?? ''
const SB_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

async function ensureConfig(sb: any) {
  const { data } = await sb.from('admin_settings').select('key,value')
    .in('key', ['vapid_public','vapid_private','send_push_secret','vapid_subject'])
  const m: Record<string,string> = Object.fromEntries((data||[]).map((r:any)=>[r.key,r.value]))
  let pub = m['vapid_public'], priv = m['vapid_private'], secret = m['send_push_secret']
  const subject = m['vapid_subject'] || 'mailto:admin@alpazar.al'
  if (!pub || !priv) {
    const k = webpush.generateVAPIDKeys()
    pub = k.publicKey; priv = k.privateKey
    await sb.from('admin_settings').upsert([
      { key:'vapid_public', value:pub }, { key:'vapid_private', value:priv },
    ], { onConflict:'key' })
    await sb.from('app_config').upsert(
      { key:'vapid_public', value:pub, type:'string', description:'VAPID public key (web-push, lexim publik)' },
      { onConflict:'key' })
  }
  if (!secret) {
    secret = crypto.randomUUID().replace(/-/g,'') + crypto.randomUUID().replace(/-/g,'')
    await sb.from('admin_settings').upsert({ key:'send_push_secret', value:secret }, { onConflict:'key' })
  }
  return { pub, priv, secret, subject }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status:405 })
  const sb = createClient(SB_URL, SB_SERVICE)
  const { pub, priv, secret, subject } = await ensureConfig(sb)

  let payload: any; try { payload = await req.json() } catch { payload = {} }
  if (payload?.action === 'bootstrap') {
    return new Response(JSON.stringify({ ok:true, provisioned:true }), { status:200, headers:{'content-type':'application/json'} })
  }
  if (req.headers.get('x-push-secret') !== secret) return new Response('unauthorized', { status:401 })
  const userId = payload?.user_id
  if (!userId) return new Response('no user', { status:400 })

  webpush.setVapidDetails(subject, pub, priv)
  const { data: subs } = await sb.from('push_subscriptions').select('*').eq('user_id', userId)
  if (!subs || subs.length === 0) return new Response(JSON.stringify({ sent:0 }), { status:200 })

  const body = JSON.stringify({
    title: payload.title || 'Alpazar', body: payload.body || '',
    url: payload.url || '/', tag: payload.tag || undefined,
  })
  let sent = 0, removed = 0
  for (const s of subs as any[]) {
    try { await webpush.sendNotification({ endpoint:s.endpoint, keys:{ p256dh:s.p256dh, auth:s.auth } }, body); sent++ }
    catch (e:any) { const c=e?.statusCode; if (c===404||c===410){ await sb.from('push_subscriptions').delete().eq('endpoint', s.endpoint); removed++ } }
  }
  return new Response(JSON.stringify({ sent, removed }), { status:200, headers:{'content-type':'application/json'} })
})

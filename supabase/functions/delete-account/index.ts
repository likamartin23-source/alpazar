// Supabase Edge Function: `delete-account` (GDPR Art.17 / Ligji 124/2024, neni 20/3)
// §2.3 — FSHIRJE E BUTË 30-DITORE. Më parë kjo bënte fshirje TË FORTË menjëherë me
// service_role; kjo anashkalonte të drejtën 30-ditore të rikthimit dhe mbetej e thirrshme
// me token-in e çdo përdoruesi. Tani ridrejton te RPC-ja `request_account_deletion`
// (fshirje e butë, e rikthyeshme; purge nga cron-i pas 30 ditësh). Asnjë fshirje e fortë këtu.

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
    // Token nga trupi ose nga koka Authorization (të dyja pranohen).
    const body = await req.json().catch(() => ({}))
    const hdr = req.headers.get('Authorization') ?? ''
    const token = String(body.token ?? (hdr.startsWith('Bearer ') ? hdr.slice(7) : ''))
    if (!token) return json({ error: 'Pa autorizim' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Token i pavlefshëm' }, 401)

    // FSHIRJE E BUTË: shënon afatin 30-ditor; cron-i e fshin përfundimisht më vonë.
    const { data: purgeAt, error } = await userClient.rpc('request_account_deletion')
    if (error) return json({ error: error.message }, 500)

    return json({ ok: true, soft: true, purge_at: purgeAt })
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})

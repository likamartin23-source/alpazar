// Supabase Edge Function: `delete-account` (GDPR Art.17 / Ligji 124/2024)
// Fshin llogarinë me service_role (i injektuar automatikisht) — zgjidh 500-in që
// jepte /api/delete-account në Vercel (getSupabaseAdmin pa SERVICE_ROLE_KEY).

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
    const token = String(body.token ?? '')
    if (!token) return json({ error: 'Pa autorizim' }, 401)

    const url = Deno.env.get('SUPABASE_URL')!
    const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) return json({ error: 'Token i pavlefshëm' }, 401)

    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const uid = user.id

    await admin.from('listings').update({ is_active: false }).eq('user_id', uid)
    await admin.from('favorites').delete().eq('user_id', uid)
    await admin.from('saved_searches').delete().eq('user_id', uid)
    await admin.from('saved_listings').delete().eq('user_id', uid)
    await admin.from('price_alerts').delete().eq('user_id', uid)
    await admin.from('notifications').delete().eq('user_id', uid)
    await admin.from('messages').delete().eq('sender_id', uid)
    await admin.from('conversations').delete().or(`user1_id.eq.${uid},user2_id.eq.${uid}`)

    const { error: delErr } = await admin.auth.admin.deleteUser(uid)
    if (delErr) return json({ error: delErr.message }, 500)

    return json({ ok: true })
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})

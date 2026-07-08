// Supabase Edge Function: `embed`
// MAR-7 — Semantic Search. Gjeneron embeddings me modelin FALAS `gte-small`
// (384-dim) të Supabase.ai — pa çelës të jashtëm, pa kosto.
//
// Deploy:  supabase functions deploy embed
// Modet (POST JSON):
//   { mode: 'query', text }          -> { embedding }         (publik; për kërkim)
//   { mode: 'backfill', secret }     -> { processed }         (kërkon EMBED_ADMIN_SECRET)
//
// Backfill-i lexon shpalljet pa embedding (RPC listings_without_embedding),
// i embed-on titull+përshkrim+qytet dhe i ruan (RPC set_listing_embedding)
// me service_role. Thirre disa herë derisa `processed` = 0.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// @ts-ignore — Supabase.ai është global në runtime-in e Edge Functions
const model = new Supabase.ai.Session('gte-small')

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function embed(text: string): Promise<number[]> {
  const output = await model.run(text, { mean_pool: true, normalize: true })
  return output as number[]
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode ?? 'query'

    if (mode === 'query') {
      const text = (body.text ?? '').toString().slice(0, 800).trim()
      if (!text) return json({ error: 'text required' }, 400)
      return json({ embedding: await embed(text) })
    }

    if (mode === 'backfill') {
      const svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const db = createClient(Deno.env.get('SUPABASE_URL')!, svc)
      // Autorizim: service_role OSE EMBED_ADMIN_SECRET OSE admin_settings.embed_cron_secret
      // (trigger/cron nga DB — pa ekspozuar service_role).
      const envSecret = Deno.env.get('EMBED_ADMIN_SECRET')
      const auth = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '')
      const apikey = req.headers.get('apikey') || ''
      let dbSecret = ''
      try { const { data } = await db.from('admin_settings').select('value').eq('key','embed_cron_secret').maybeSingle(); dbSecret = data?.value || '' } catch {}
      const ok = auth === svc || apikey === svc || (!!envSecret && body.secret === envSecret) || (!!dbSecret && body.secret === dbSecret)
      if (!ok) return json({ error: 'unauthorized' }, 401)
      const batch = Math.min(Math.max(Number(body.batch) || 40, 1), 100)
      const { data: rows, error } = await db.rpc('listings_without_embedding', { batch })
      if (error) return json({ error: error.message }, 500)
      let processed = 0
      for (const r of rows ?? []) {
        const text = [r.title, r.description, r.city].filter(Boolean).join('. ').slice(0, 800)
        if (!text) continue
        const emb = await embed(text)
        const { error: upErr } = await db.rpc('set_listing_embedding', { p_id: r.id, p_embedding: emb })
        if (!upErr) processed++
      }
      return json({ processed, remaining_batch: (rows ?? []).length })
    }

    return json({ error: 'unknown mode' }, 400)
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500)
  }

  function json(obj: unknown, status = 200) {
    return new Response(JSON.stringify(obj), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }
})

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// MAR-7 — Semantic Search. Merr pyetjen → embedding (Edge Function `embed`,
// gte-small falas) → RPC match_listings (ivfflat cosine). Kthen shpalljet më
// të ngjashme sipas KUPTIMIT, jo vetëm fjalëve kyçe.
//
// Degradim i butë: nëse Edge Function `embed` s'është deploy-uar ende ose
// dështon, kthen { semantic: false } që klienti të bjere te kërkimi normal.
export async function POST(req: NextRequest) {
  const rl = rateLimit(`semantic:${getClientIp(req)}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ semantic: false, results: [] }, { status: 429 })
  }
  const { q } = await req.json().catch(() => ({ q: '' }))
  const query = (q ?? '').toString().trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ semantic: false, results: [] })
  }

  try {
    // 1) Embedding i pyetjes nga Edge Function `embed`
    const embRes = await fetch(`${SUPABASE_URL}/functions/v1/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}`, apikey: SUPABASE_ANON },
      body: JSON.stringify({ mode: 'query', text: query }),
    })
    if (!embRes.ok) return NextResponse.json({ semantic: false, results: [] })
    const { embedding } = await embRes.json()
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return NextResponse.json({ semantic: false, results: [] })
    }

    // 2) Kërkim me ngjashmëri vektoriale
    const db = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data, error } = await db.rpc('match_listings', {
      query_embedding: embedding,
      match_count: 24,
      similarity_threshold: 0.30,
    })
    if (error) return NextResponse.json({ semantic: false, results: [] })

    return NextResponse.json({ semantic: true, results: data ?? [] })
  } catch {
    return NextResponse.json({ semantic: false, results: [] })
  }
}

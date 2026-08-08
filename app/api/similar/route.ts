import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// "Shpallje të ngjashme" SEMANTIKE (MAR-7): merr embedding-un e titullit+përshkrimit
// të shpalljes nga Edge Function `embed` (gte-small) → RPC `match_listings` (pgvector
// ivfflat cosine) → kthen shpalljet më të ngjashme SIPAS KUPTIMIT, pa vetë shpalljen.
// Degradim i butë: kthen { results: [] } që klienti të bjerë te përputhja sipas kategorisë.
export async function GET(req: NextRequest) {
  const rl = rateLimit(`similar:${getClientIp(req)}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ results: [] }, { status: 429 })

  const id = req.nextUrl.searchParams.get('id') || ''
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) return NextResponse.json({ results: [] }, { status: 400 })

  try {
    const db = createClient(SUPABASE_URL, SUPABASE_ANON)

    // 1) Teksti i shpalljes aktuale
    const { data: l } = await db
      .from('listings')
      .select('title,description')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    if (!l) return NextResponse.json({ results: [] })
    const text = `${l.title ?? ''}. ${l.description ?? ''}`.trim()
    if (text.length < 2) return NextResponse.json({ results: [] })

    // 2) Embedding nga Edge Function `embed`
    const embRes = await fetch(`${SUPABASE_URL}/functions/v1/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}`, apikey: SUPABASE_ANON },
      body: JSON.stringify({ mode: 'query', text }),
    })
    if (!embRes.ok) return NextResponse.json({ results: [] })
    const { embedding } = await embRes.json()
    if (!Array.isArray(embedding) || embedding.length === 0) return NextResponse.json({ results: [] })

    // 3) Përputhje vektoriale, pa vetë shpalljen
    const { data, error } = await db.rpc('match_listings', {
      query_embedding: embedding,
      match_count: 8,
      similarity_threshold: 0.22,
    })
    if (error || !Array.isArray(data)) return NextResponse.json({ results: [] })
    const results = data.filter((r: any) => r.id !== id).slice(0, 4)
    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}

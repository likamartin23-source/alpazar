import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../../lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 10

const anonSb = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Normalize Albanian characters so ë→e, ç→c searches still match
function normalizeAlb(text: string): string {
  return text
    .replace(/[ëÊ]/g, 'e')
    .replace(/[çÇ]/g, 'c')
}

function buildTsquery(text: string): string {
  return text
    .replace(/[^a-zA-ZÀ-öø-ÿëËçÇ0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => `${w}:*`)
    .join(' & ')
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`fts:${ip}`, { limit: 30, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Shumë kërkesa. Provo përsëri pas pak.' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  const sb = anonSb()
  const SELECT = 'id,title,price,currency,city,category,images,condition,created_at,views_count'

  // Build two tsquery forms: original + Albanian-normalized (ë→e, ç→c)
  const tsqueryOriginal   = buildTsquery(q)
  const tsqueryNormalized = buildTsquery(normalizeAlb(q))

  if (!tsqueryOriginal) return NextResponse.json({ results: [] })

  // Run both FTS queries in parallel; if normalized differs, include its results too
  const queries = [
    sb.from('listings')
      .select(SELECT)
      .eq('is_active', true)
      .textSearch('fts', tsqueryOriginal, { type: 'websearch', config: 'simple' })
      .order('views_count', { ascending: false })
      .limit(20),
  ]

  if (tsqueryNormalized !== tsqueryOriginal) {
    queries.push(
      sb.from('listings')
        .select(SELECT)
        .eq('is_active', true)
        .textSearch('fts', tsqueryNormalized, { type: 'websearch', config: 'simple' })
        .order('views_count', { ascending: false })
        .limit(20),
    )
  }

  const results = await Promise.allSettled(queries)
  const primary   = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: true }
  const secondary = results[1]?.status === 'fulfilled' ? results[1].value : { data: null }

  if (primary.error && !secondary?.data) {
    // Both FTS failed — fallback to ilike
    const { data: fallback } = await sb
      .from('listings')
      .select(SELECT)
      .eq('is_active', true)
      .ilike('title', `%${q.replace(/[%_\\]/g, '')}%`)
      .order('views_count', { ascending: false })
      .limit(20)
    return NextResponse.json({ results: fallback || [], mode: 'fallback' })
  }

  // Merge results: primary first, then secondary (deduplicate by id)
  const seen = new Set<string>()
  const merged: any[] = []
  for (const item of [...(primary.data || []), ...(secondary?.data || [])]) {
    if (!seen.has(item.id)) { seen.add(item.id); merged.push(item) }
  }

  const res = NextResponse.json({ results: merged, mode: 'fts' })
  res.headers.set('Cache-Control', 'public, max-age=10, stale-while-revalidate=30')
  return res
}

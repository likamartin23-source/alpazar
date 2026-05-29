import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../../../../lib/rateLimit'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(
  req: NextRequest,
  { params }: { params: { index: string } }
) {
  // 60 requests per minute per IP
  const ip = getClientIp(req)
  const rl = rateLimit(`search:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { hits: [], estimatedTotalHits: 0 },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  try {
    const body = await req.json()
    const q      = String(body.q ?? '').trim().slice(0, 500)
    const limit  = Math.min(Math.max(parseInt(body.limit) || 40, 1), 100)
    const filter = Array.isArray(body.filter) ? body.filter : (body.filter ? [body.filter] : [])

    let qb = supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,created_at,category_id,is_active')
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply filter from Meilisearch filter syntax: ["field = value", ...]
    for (const f of filter) {
      const m = String(f).match(/^(\w+)\s*=\s*"?([^"]+)"?$/)
      if (!m) continue
      const [, field, value] = m
      if (field === 'is_active') qb = qb.eq('is_active', value === 'true')
      else if (field === 'is_premium') qb = qb.eq('is_premium', value === 'true')
      else if (field === 'category_id') qb = qb.eq('category_id', value)
      else if (field === 'city') qb = qb.eq('city', value)
      else if (field === 'condition') qb = qb.eq('condition', value)
    }

    // Full-text search using Postgres GIN index on fts column
    if (q.trim()) {
      qb = qb.textSearch('fts', q.trim(), {
        type: 'websearch',
        config: 'simple',
      })
    }

    const { data, error } = await qb
    if (error) {
      // Fallback to ilike if FTS fails
      let fb = supabase
        .from('listings')
        .select('id,title,price,currency,condition,city,is_premium,images,created_at,category_id,is_active')
        .eq('is_active', true)
        .ilike('title', `%${q.trim()}%`)
        .order('is_premium', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
      const { data: fbData } = await fb
      return NextResponse.json({ hits: fbData || [], estimatedTotalHits: fbData?.length || 0 })
    }

    return NextResponse.json({ hits: data || [], estimatedTotalHits: data?.length || 0 })
  } catch {
    return NextResponse.json({ hits: [], estimatedTotalHits: 0 }, { status: 200 })
  }
}

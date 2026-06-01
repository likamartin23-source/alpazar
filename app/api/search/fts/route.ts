import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../../lib/supabase'

export const runtime = 'nodejs'

const anonSb = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) return NextResponse.json({ results: [] })

  // Sanitize: remove special chars that break tsquery
  const clean = q.replace(/[^a-zA-ZÀ-öø-ÿëËçÇ0-9 ]/g, ' ').trim()
  if (!clean) return NextResponse.json({ results: [] })

  // Build tsquery: each word with prefix match
  const tsquery = clean.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(' & ')

  const sb = anonSb()
  const { data, error } = await sb
    .from('listings')
    .select('id,title,price,currency,city,category,images,condition,created_at,views_count')
    .eq('is_active', true)
    .textSearch('fts', tsquery, { type: 'websearch', config: 'simple' })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    // Fallback: ilike search nëse FTS dështon
    const { data: fallback } = await sb
      .from('listings')
      .select('id,title,price,currency,city,category,images,condition,created_at,views_count')
      .eq('is_active', true)
      .ilike('title', `%${clean}%`)
      .order('created_at', { ascending: false })
      .limit(20)
    return NextResponse.json({ results: fallback || [], mode: 'fallback' })
  }

  return NextResponse.json({ results: data || [], mode: 'fts' })
}

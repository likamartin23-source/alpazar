import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'

export const runtime = 'nodejs'

function userSb(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  const sb = userSb(token)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Token i pavlefshëm' }, { status: 401 })

  const days = Math.min(Math.max(parseInt(req.nextUrl.searchParams.get('days') || '30'), 1), 90)
  const since = new Date(Date.now() - days * 86400000).toISOString()

  // 1. User's listings
  const { data: listings } = await sb
    .from('listings')
    .select('id,title,price,currency,is_active,views_count,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!listings || listings.length === 0) {
    return NextResponse.json({
      views_by_day: [], top_listings: [], hourly: [],
      total_views: 0, total_contacts: 0,
    })
  }

  const listingIds = listings.map((l: any) => l.id)

  // 2. Views + contacts — parallel fetch with hard row cap to prevent memory blow-up
  const [{ data: rawViews }, { data: msgCounts }] = await Promise.all([
    sb
      .from('listing_views')
      .select('viewed_at,listing_id')
      .in('listing_id', listingIds)
      .gte('viewed_at', since)
      .limit(5000),
    sb
      .from('messages')
      .select('listing_id')
      .in('listing_id', listingIds)
      .eq('receiver_id', user.id)
      .gte('created_at', since)
      .limit(2000),
  ])

  // 3. Aggregate in JS (bounded by row caps above)
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    dayMap[new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)] = 0
  }
  const hourMap = new Array<number>(24).fill(0)
  const viewsPerListing: Record<string, number> = {}

  for (const v of rawViews ?? []) {
    const d = new Date(v.viewed_at).toISOString().slice(0, 10)
    if (d in dayMap) dayMap[d]++
    hourMap[new Date(v.viewed_at).getHours()]++
    viewsPerListing[v.listing_id] = (viewsPerListing[v.listing_id] ?? 0) + 1
  }

  const contactMap: Record<string, number> = {}
  for (const m of msgCounts ?? []) {
    contactMap[m.listing_id] = (contactMap[m.listing_id] ?? 0) + 1
  }

  const views_by_day = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  const top_listings = listings
    .map((l: any) => ({
      id: l.id,
      title: l.title,
      price: l.price,
      currency: l.currency,
      is_active: l.is_active,
      views: viewsPerListing[l.id] ?? 0,
      total_views: l.views_count ?? 0,
      contacts: contactMap[l.id] ?? 0,
      ctr: l.views_count > 0
        ? Math.round(((contactMap[l.id] ?? 0) / l.views_count) * 100)
        : 0,
    }))
    .sort((a: any, b: any) => b.views - a.views)

  return NextResponse.json({
    views_by_day,
    top_listings,
    hourly: hourMap.map((count, hour) => ({ hour, count })),
    total_views: (rawViews ?? []).length,
    total_contacts: (msgCounts ?? []).length,
    period_days: days,
  })
}

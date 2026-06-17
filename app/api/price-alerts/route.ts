import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'nodejs'

function userSupabase(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}

function getToken(req: NextRequest): string | null {
  return req.headers.get('authorization')?.replace('Bearer ', '') ?? null
}

// GET /api/price-alerts?listing_id=xxx
export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`price-alerts:${ip}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) return NextResponse.json({ error: 'Shumë kërkesa.' }, { status: 429 })

  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  const listingId = req.nextUrl.searchParams.get('listing_id')
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!listingId || !UUID_RE.test(listingId)) return NextResponse.json({ error: 'listing_id i pavlefshëm' }, { status: 400 })

  const sb = userSupabase(token)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Token i pavlefshëm' }, { status: 401 })

  const { data } = await sb
    .from('price_alerts')
    .select('id,target_price,triggered,created_at')
    .eq('listing_id', listingId)
    .maybeSingle()

  return NextResponse.json({ alert: data })
}

// POST /api/price-alerts — krijo ose përditëso alert
export async function POST(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Kërkesë e pavlefshme' }, { status: 400 })
  }

  const { listing_id, target_price } = body
  if (!listing_id || typeof target_price !== 'number' || target_price <= 0 || target_price > 100_000_000) {
    return NextResponse.json({ error: 'Të dhëna të pavlefshme' }, { status: 400 })
  }

  const sb = userSupabase(token)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Token i pavlefshëm' }, { status: 401 })

  // Verify listing exists before creating alert
  const { data: listing } = await sb.from('listings').select('id').eq('id', listing_id).eq('is_active', true).single()
  if (!listing) return NextResponse.json({ error: 'Shpallja nuk u gjet' }, { status: 404 })

  const { data, error } = await sb
    .from('price_alerts')
    .upsert(
      { user_id: user.id, listing_id, target_price, triggered: false },
      { onConflict: 'user_id,listing_id' }
    )
    .select('id,target_price')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data })
}

// DELETE /api/price-alerts?listing_id=xxx
export async function DELETE(req: NextRequest) {
  const token = getToken(req)
  if (!token) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  const listingId = req.nextUrl.searchParams.get('listing_id')
  if (!listingId) return NextResponse.json({ error: 'listing_id mungon' }, { status: 400 })

  const sb = userSupabase(token)
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Token i pavlefshëm' }, { status: 401 })

  const { error } = await sb
    .from('price_alerts')
    .delete()
    .eq('listing_id', listingId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

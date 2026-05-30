import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getSessionUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const supabase = adminClient()
  const { data: { user } } = await supabase.auth.getUser(token)
  return user
}

// GET /api/price-alerts?listing_id=xxx — merr alert-in aktual të user-it
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  const listingId = req.nextUrl.searchParams.get('listing_id')
  if (!listingId) return NextResponse.json({ error: 'listing_id mungon' }, { status: 400 })

  const supabase = adminClient()
  const { data } = await supabase
    .from('price_alerts')
    .select('id,target_price,triggered,created_at')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  return NextResponse.json({ alert: data })
}

// POST /api/price-alerts — krijo ose përditëso alert
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Kërkesë e pavlefshme' }, { status: 400 })
  }

  const { listing_id, target_price } = body
  if (!listing_id || typeof target_price !== 'number' || target_price <= 0) {
    return NextResponse.json({ error: 'Të dhëna të pavlefshme' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('price_alerts')
    .upsert({
      user_id: user.id,
      listing_id,
      target_price,
      triggered: false,
    }, { onConflict: 'user_id,listing_id' })
    .select('id,target_price')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alert: data })
}

// DELETE /api/price-alerts?listing_id=xxx — fshi alert-in
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Kërkohet hyrja' }, { status: 401 })

  const listingId = req.nextUrl.searchParams.get('listing_id')
  if (!listingId) return NextResponse.json({ error: 'listing_id mungon' }, { status: 400 })

  const supabase = adminClient()
  const { error } = await supabase
    .from('price_alerts')
    .delete()
    .eq('user_id', user.id)
    .eq('listing_id', listingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

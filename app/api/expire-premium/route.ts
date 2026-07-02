import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Uses a SECURITY DEFINER RPC so the cron works without SUPABASE_SERVICE_ROLE_KEY.
  const db = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await db.rpc('expire_premium_run')
  return NextResponse.json({ expired: (data as number) ?? 0, error: error?.message })
}

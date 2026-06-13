import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CRON_SECRET = process.env.CRON_SECRET || ''

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Expire all profiles where premium_expires_at < NOW()
  const { data, error } = await admin
    .from('profiles')
    .update({ is_premium: false })
    .eq('is_premium', true)
    .lt('premium_expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('[expire-premium]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const expired = data?.length ?? 0
  console.log(`[expire-premium] ${expired} profile(s) expired`)
  return NextResponse.json({ expired, ts: new Date().toISOString() })
}

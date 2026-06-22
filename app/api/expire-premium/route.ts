import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const admin = getSupabaseAdmin()
  const { data, error } = await admin
    .from('profiles')
    .update({ is_premium: false, premium_expires_at: null } as never)
    .lt('premium_expires_at', new Date().toISOString())
    .eq('is_premium', true)
    .select('id')
  return NextResponse.json({ expired: data?.length ?? 0, error: error?.message })
}

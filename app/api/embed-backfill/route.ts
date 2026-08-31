import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'

export const dynamic = 'force-dynamic'

// Mbyll boshllekun kur nje shpallje mbetet pa embedding (funksioni ishte poshte,
// ose shpallja u riaktivizua me vone). Sekreti nuk kalon nga ketu — RPC-ja e
// merr vete brenda bazes. Nuk ben asgje nese s'ka pune per te bere.
export async function GET(req: NextRequest) {
  const secret = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createClient(SUPABASE_URL, SUPABASE_ANON)
  const { data, error } = await db.rpc('embed_backfill_run', { p_batch: 50 })
  return NextResponse.json({ result: data ?? null, error: error?.message })
}

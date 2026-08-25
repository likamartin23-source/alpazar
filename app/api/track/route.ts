import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

// Ingestion e ngjarjeve të analitikës (BLLOKU I PËRMIRËSUAR — sistemi i gjurmimit).
// Vizitat/kontaktet/saves/followers vijnë nga sisteme ekzistuese; këtu fusim VETËM
// impression/share/contact_*/notify. Shkrimi bëhet përmes RPC-së SECURITY DEFINER
// `track_event` (Vercel s'ka service_role); owner_id derivohet në DB, s'falsifikohet.
// Fire-and-forget nga klienti; fail-soft (kurrë nuk prish faqen).

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED = new Set([
  'impression', 'share', 'contact_whatsapp', 'contact_viber', 'contact_phone', 'notify',
])
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// Salt privatësie për ip_hash (jo i kthyeshëm). Nga env kur ekziston; përndryshe
// fallback konstant — mjafton për dedupe/reach, s'ruan IP të papërpunuar.
const SALT = process.env.IP_HASH_SALT || 'alpazar_analytics_v1'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  // Impresionet janë të shpeshta → kufi bujar, por mbron nga spam-i.
  const rl = rateLimit(`track:${ip}`, { limit: 80, windowMs: 60_000 })
  if (!rl.allowed) return new NextResponse(null, { status: 204 })

  let body: any
  try { body = await req.json() } catch { return new NextResponse(null, { status: 204 }) }

  const kind = String(body?.kind ?? '')
  const listingId = String(body?.listing_id ?? '')
  if (!ALLOWED.has(kind) || !UUID_RE.test(listingId)) {
    return new NextResponse(null, { status: 204 }) // fail-soft, pa gabim
  }

  const ipHash = createHash('sha256').update(ip + SALT).digest('hex').slice(0, 32)

  // Klienti me token-in e thirrësit (nëse i kyçur → actor_id vendoset nga auth.uid()
  // brenda RPC-së); përndryshe anon.
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined)

  try {
    await sb.rpc('track_event', { p_listing_id: listingId, p_kind: kind, p_ip_hash: ipHash })
  } catch { /* fail-soft */ }

  return new NextResponse(null, { status: 204 })
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY as SUPABASE_ANON } from '../../../lib/supabase'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// MAR-7 + Valë 2.2 — Kërkim agjentik. Merr pyetjen në gjuhë natyrale →
// nxjerr filtra (çmim max, qytet, gjendje) me heuristika shqip → embedding
// (Edge Function `embed`, gte-small falas) → RPC match_listings → post-filtrim.
// Kthen { semantic, results, filters }. Degradim i butë te kërkimi normal.

const CITIES = [
  'tiranë','tirane','durrës','durres','vlorë','vlore','shkodër','shkoder','elbasan',
  'fier','korçë','korce','berat','lushnjë','lushnje','kavajë','kavaje','gjirokastër',
  'gjirokaster','sarandë','sarande','lezhë','lezhe','pogradec','krujë','kruje','kukës',
  'kukes','peshkopi','burrel','laç','lac','patos','ballsh','librazhd','rrëshen','rreshen',
]

function parseFilters(q: string) {
  const s = q.toLowerCase()
  const f: { maxPrice?: number; currency?: string; city?: string; condition?: string } = {}

  // Çmimi: "nën/deri/max/<= 500", "500 euro/eur/€/lek/lekë/l"
  const m = s.match(/(?:nën|nen|deri(?:\s+në|\s+ne)?|max|maksimumi|<=?)\s*([\d.,]{1,9})/) ||
            s.match(/([\d.,]{2,9})\s*(?:euro|eur|€|lek[ëe]?|l\b|all)/)
  if (m) {
    const n = parseFloat(m[1].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'))
    if (!isNaN(n) && n > 0) f.maxPrice = n
  }
  if (/(euro|eur|€)/.test(s)) f.currency = 'EUR'
  else if (/(lek[ëe]?|\ball\b)/.test(s)) f.currency = 'ALL'

  // Qyteti
  const city = CITIES.find(c => s.includes(c))
  if (city) f.city = city

  // Gjendja
  if (/\b(i\s*ri|e\s*re|të\s*reja|te\s*reja|new)\b/.test(s)) f.condition = 'i_ri'
  else if (/\b(i\s*përdorur|i\s*perdorur|e\s*përdorur|e\s*perdorur|used|dorë\s*dyt)/.test(s)) f.condition = 'i_perdorur'

  return f
}

function applyFilters(rows: any[], f: ReturnType<typeof parseFilters>) {
  return (rows ?? []).filter(r => {
    if (f.maxPrice != null && r.price != null && Number(r.price) > f.maxPrice) return false
    if (f.city && r.city && !String(r.city).toLowerCase().includes(f.city.slice(0, 5))) return false
    if (f.condition && r.condition && r.condition !== f.condition) return false
    return true
  })
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(`semantic:${getClientIp(req)}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ semantic: false, results: [] }, { status: 429 })
  }
  const { q } = await req.json().catch(() => ({ q: '' }))
  const query = (q ?? '').toString().trim()
  if (!query || query.length < 2) {
    return NextResponse.json({ semantic: false, results: [] })
  }

  const filters = parseFilters(query)

  try {
    const embRes = await fetch(`${SUPABASE_URL}/functions/v1/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON}`, apikey: SUPABASE_ANON },
      body: JSON.stringify({ mode: 'query', text: query }),
    })
    if (!embRes.ok) return NextResponse.json({ semantic: false, results: [], filters })
    const { embedding } = await embRes.json()
    if (!Array.isArray(embedding) || embedding.length === 0) {
      return NextResponse.json({ semantic: false, results: [], filters })
    }

    const db = createClient(SUPABASE_URL, SUPABASE_ANON)
    const { data, error } = await db.rpc('match_listings', {
      query_embedding: embedding,
      match_count: 40,
      similarity_threshold: 0.30,
    })
    if (error) return NextResponse.json({ semantic: false, results: [], filters })

    const results = applyFilters(data ?? [], filters).slice(0, 24)
    return NextResponse.json({ semantic: true, results, filters })
  } catch {
    return NextResponse.json({ semantic: false, results: [], filters })
  }
}

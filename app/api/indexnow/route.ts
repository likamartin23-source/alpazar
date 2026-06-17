import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../../lib/supabase'
import { rateLimit } from '../../../lib/rateLimit'
import { SITE_URL, SITE_HOST } from '../../../lib/siteConfig'

export const dynamic = 'force-dynamic'

const INDEXNOW_KEY = process.env.INDEXNOW_KEY || '825731eba0e14fec916791e52a62816c'
const BASE_URL = SITE_URL

// Faqet statike gjithmonë të rëndësishme
const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/search`,
  `${BASE_URL}/biznese`,
  `${BASE_URL}/premium`,
  `${BASE_URL}/asistent`,
  `${BASE_URL}/rreth-nesh`,
  `${BASE_URL}/kontakt`,
]

// Të gjitha motorët IndexNow
// api.indexnow.org mbulon: Bing, DuckDuckGo, Ecosia, Startpage, MSN e të tjerë
const INDEXNOW_ENDPOINTS = [
  { name: 'bing',    url: 'https://api.indexnow.org/indexnow' },
  { name: 'yandex',  url: 'https://yandex.com/indexnow' },
  { name: 'naver',   url: 'https://searchadvisor.naver.com/indexnow' },
  { name: 'seznam',  url: 'https://search.seznam.cz/indexnow' },
]

// Called from client after creating a listing — pings a single URL
export async function POST(req: NextRequest) {
  // Require authenticated user — only logged-in users submit listing URLs
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ ok: false }, { status: 401 })
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ ok: false }, { status: 401 })

  const rl = rateLimit(`indexnow:${user.id}`, { limit: 20, windowMs: 60 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 })
  }

  let body: any = {}
  try { body = await req.json() } catch { /* ignore */ }

  const url = String(body.url || '').trim()
  if (!url.startsWith(`${BASE_URL}/`)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: SITE_HOST, key: INDEXNOW_KEY, urlList: [url] }),
  }).catch((err) => { console.error('[indexnow] submit failed:', err) })

  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  // Fail-closed: kërko gjithmonë CRON_SECRET
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Merr URL-et e shpalljeve aktive (max 1000 per this)
    const { data: listings } = await supabase
      .from('listings')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(800)

    const { data: shops } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_premium', true)
      .limit(200)

    const listingUrls = (listings || []).map(l => `${BASE_URL}/listing/${l.id}`)
    const shopUrls = (shops || []).map(s => `${BASE_URL}/biznese/${s.id}`)

    const allUrls = [...STATIC_URLS, ...listingUrls, ...shopUrls]

    const payload = {
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: allUrls.slice(0, 1000),
    }

    // Submit te te gjitha engines ne paralel
    const results = await Promise.allSettled(
      INDEXNOW_ENDPOINTS.map(({ url }) =>
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(payload),
        }).then(r => r.status).catch(() => 0)
      )
    )

    const engines: Record<string, number | string> = {}
    INDEXNOW_ENDPOINTS.forEach(({ name }, i) => {
      engines[name] = results[i].status === 'fulfilled' ? results[i].value : 'failed'
    })

    return NextResponse.json({
      ok: true,
      urlsSubmitted: Math.min(allUrls.length, 1000),
      totalFound: allUrls.length,
      engines,
      note: 'Bing/api.indexnow.org mbulon gjithashtu: DuckDuckGo, Ecosia, Startpage, MSN',
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const INDEXNOW_KEY = '825731eba0e14fec916791e52a62816c'
const BASE_URL = 'https://alpazar.al'

// Faqet statike gjithmonë të rëndësishme
const STATIC_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/search`,
  `${BASE_URL}/dyqane`,
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

export async function GET(req: NextRequest) {
  // Verco cron secret per siguri
  const auth = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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
    const shopUrls = (shops || []).map(s => `${BASE_URL}/dyqane/${s.id}`)

    const allUrls = [...STATIC_URLS, ...listingUrls, ...shopUrls]

    const payload = {
      host: 'alpazar.al',
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

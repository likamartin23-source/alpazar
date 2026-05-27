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

export async function GET(req: NextRequest) {
  // Verco cron secret per siguri (opsional)
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

    // IndexNow: Bing + Yandex + Naver (nje kerkese mbulon te gjitha)
    const payload = {
      host: 'alpazar.al',
      key: INDEXNOW_KEY,
      keyLocation: `${BASE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: allUrls.slice(0, 1000), // max 1000 per request
    }

    const [bingRes, yandexRes] = await Promise.allSettled([
      fetch('https://api.indexnow.org/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
      fetch('https://yandex.com/indexnow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(payload),
      }),
    ])

    const bingStatus = bingRes.status === 'fulfilled' ? bingRes.value.status : 'failed'
    const yandexStatus = yandexRes.status === 'fulfilled' ? yandexRes.value.status : 'failed'

    return NextResponse.json({
      ok: true,
      urlsSubmitted: allUrls.length,
      bing: bingStatus,
      yandex: yandexStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

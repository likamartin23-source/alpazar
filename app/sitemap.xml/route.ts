import { createClient } from '@supabase/supabase-js'

const BASE = 'https://alpazar.al'

const STATIC_PAGES = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/search', priority: '0.8', changefreq: 'daily' },
  { url: '/dyqane', priority: '0.8', changefreq: 'daily' },
  { url: '/premium', priority: '0.7', changefreq: 'weekly' },
  { url: '/asistent', priority: '0.6', changefreq: 'monthly' },
  { url: '/rreth-nesh', priority: '0.5', changefreq: 'monthly' },
  { url: '/kontakt', priority: '0.5', changefreq: 'monthly' },
  { url: '/kushtet', priority: '0.4', changefreq: 'monthly' },
  { url: '/privatesia', priority: '0.4', changefreq: 'monthly' },
]

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Merr shpalljet aktive
  const { data: listings } = await supabase
    .from('listings')
    .select('id, created_at, updated_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1000)

  // Merr dyqanet premium
  const { data: shops } = await supabase
    .from('profiles')
    .select('id, updated_at')
    .eq('is_premium', true)
    .limit(200)

  const now = new Date().toISOString().split('T')[0]

  const staticEntries = STATIC_PAGES.map(
    (p) => `  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  ).join('\n')

  const listingEntries = (listings || []).map((l) => {
    const date = (l.updated_at || l.created_at || now).split('T')[0]
    return `  <url>
    <loc>${BASE}/listing/${l.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  }).join('\n')

  const shopEntries = (shops || []).map((s) => {
    const date = (s.updated_at || now).split('T')[0]
    return `  <url>
    <loc>${BASE}/dyqane/${s.id}</loc>
    <lastmod>${date}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries}
${listingEntries}
${shopEntries}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

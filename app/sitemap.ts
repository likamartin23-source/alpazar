import { createClient } from '@supabase/supabase-js'
import { MetadataRoute } from 'next'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'

const BASE = 'https://alpazar.vercel.app'

// Safe limit: Next.js sitemap times out above ~5s; 5000 rows is well within budget
const LISTING_LIMIT = 5000
const SHOP_LIMIT    = 500

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const [{ data: listings }, { data: businesses }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(LISTING_LIMIT),
    supabase
      .from('businesses')
      .select('id, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(SHOP_LIMIT),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                   lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${BASE}/search`,       lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/biznese`,      lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/premium`,      lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/asistent`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/rreth-nesh`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/kontakt`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/kushtet`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privatesia`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/cookies`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/siguria`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/takedown`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/referral`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map(l => ({
    url:             `${BASE}/listing/${l.id}`,
    lastModified:    new Date(l.updated_at ?? l.created_at),
    changeFrequency: 'weekly' as const,
    priority:        0.6,
  }))

  const businessPages: MetadataRoute.Sitemap = (businesses ?? []).map(b => ({
    url:             `${BASE}/biznese/${b.id}`,
    lastModified:    new Date(b.updated_at ?? b.created_at),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  return [...staticPages, ...listingPages, ...businessPages]
}

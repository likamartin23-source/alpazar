import { createClient } from '@supabase/supabase-js'
import { MetadataRoute } from 'next'

const BASE = 'https://alpazar.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [{ data: listings }, { data: shops }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50000),
    supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('is_premium', true)
      .limit(200),
  ])

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                     lastModified: new Date(), changeFrequency: 'daily',   priority: 1   },
    { url: `${BASE}/search`,         lastModified: new Date(), changeFrequency: 'hourly',  priority: 0.9 },
    { url: `${BASE}/dyqane`,         lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/premium`,        lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/asistent`,       lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/rreth-nesh`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/kontakt`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/kushtet`,        lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privatesia`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]

  const listingPages: MetadataRoute.Sitemap = (listings ?? []).map(l => ({
    url:             `${BASE}/listing/${l.id}`,
    lastModified:    new Date(l.updated_at ?? l.created_at),
    changeFrequency: 'weekly' as const,
    priority:        0.6,
  }))

  const shopPages: MetadataRoute.Sitemap = (shops ?? []).map(s => ({
    url:             `${BASE}/dyqane/${s.id}`,
    lastModified:    new Date(s.updated_at),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  return [...staticPages, ...listingPages, ...shopPages]
}

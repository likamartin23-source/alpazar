import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { SITE_URL } from '../lib/siteConfig'
import type { Listing, Category } from '../lib/types'
import HomeClient from './HomeClient'

// ISR: crawlers get real, recent content in the initial HTML (not an empty
// client shell), refreshed every 60s. Fixes the SEO "0 photos / 0 h1" blocker.
export const revalidate = 60

export const metadata: Metadata = {
  title: 'ALPAZAR — Shit · Bli · Bëj Pazrin Tënd',
  description: 'Platforma #1 shqiptare e tregtisë online. Bli dhe shit shpallje të reja e të përdorura — makina, elektronikë, shtëpi, veshje e më shumë — falas, në të gjithë Shqipërinë.',
  alternates: { canonical: '/' },
}

async function fetchHome(): Promise<{ listings: Listing[]; categories: Category[] }> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const [{ data: listings }, { data: categories }] = await Promise.all([
      sb.from('listings')
        .select('id,title,price,currency,condition,city,is_premium,images,category_id,created_at,user_id,author:user_id(id,full_name,username,avatar_url,is_premium,trust_score)')
        .eq('is_active', true)
        .order('is_premium', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20),
      sb.from('categories').select('*').eq('is_active', true).order('sort_order'),
    ])
    return {
      listings: (listings ?? []) as unknown as Listing[],
      categories: (categories ?? []) as unknown as Category[],
    }
  } catch {
    return { listings: [], categories: [] }
  }
}

export default async function HomePage() {
  const { listings, categories } = await fetchHome()

  // WebSite/Organization schema already lives in the root layout <head>; here we
  // add only the ItemList of current listings (complements, no duplication).
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Shpalljet më të fundit — ALPAZAR',
    numberOfItems: listings.length,
    itemListElement: listings.slice(0, 20).map((l: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/listing/${l.id}`,
      name: l.title,
    })),
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <HomeClient initialListings={listings} initialCategories={categories} />
    </>
  )
}

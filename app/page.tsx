import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { SITE_URL } from '../lib/siteConfig'
import type { Listing, Category } from '../lib/types'
import HomeClient from './HomeClient'

// SSR DINAMIK (jo ISR). Crawler-at vazhdojnë të marrin përmbajtje reale në HTML-in
// fillestar (SEO i ruajtur), POR pa `stale-while-revalidate`-in ~1-vjeçar që Next-i
// stampon për faqet e para-renderuara — pikërisht ai header e mbante shfletuesin në
// versionin e vjetër edhe pas rifreskimit (autopsia e mospasqyrimit live). Dinamik
// => çdo kërkesë merr HTML të freskët; asetet me hash mbeten immutable e të shpejta.
export const dynamic = 'force-dynamic'

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
        // Karta e shpalljes duhet ta njohe biznesin qysh te render-i i pare SSR:
        // pa `business_id` + join-in `business:...`, ListingCard e trajton shpalljen e
        // biznesit si personale (identiteti i pronarit ne vend te logos/emrit te biznesit)
        // — karta e biznesit "noton" te feed-i, por e maskuar. Identik me HomeClient.
        .select('id,title,price,currency,condition,city,is_premium,images,category_id,created_at,user_id,business_id,author:user_id(id,full_name,username,avatar_url,is_premium,trust_score),business:business_id(id,name,logo_url,is_verified)')
        .eq('is_active', true)
        .order('rank_tier', { ascending: false })
        .order('last_bumped_at', { ascending: false })
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

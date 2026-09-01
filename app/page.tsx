import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { SITE_URL } from '../lib/siteConfig'
import type { Listing, Category } from '../lib/types'
import HomeClient from './HomeClient'
import { LISTING_SELECT } from '../lib/listingSelect'

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

// `shops` merret KETU, jo ne klient. Arsyeja u mat me 31 gusht 2026 mbi ndertimin
// e prodhimit, ne telefon te ngadalesuar: seksioni "Biznese Online" render-ohej
// vetem pas fetch-it te klientit dhe hynte 256px MBI rreshtin e filtrave, duke
// shtyre poshte filtrat, kokën e seksionit dhe gjithe rrjetin e shpalljeve.
// Matja: CLS 0.207 ne kryefaqe — "i dobet" sipas Core Web Vitals (kufiri 0.1).
// Duke ardhur nga serveri, blloku ekziston qysh te piktura e pare: pa kercim,
// dhe si perfitim i dyte crawler-at e shohin vitrinen e bizneseve ne HTML.
async function fetchHome(): Promise<{ listings: Listing[]; categories: Category[]; shops: any[]; listingCount: number; userCount: number }> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const [{ data: listings }, { data: categories }, { data: shops }, { count: listingCount }, { count: userCount }] = await Promise.all([
      sb.from('listings')
        // Një projeksion i vetëm identiteti (lib/listingSelect) — pa join-in e biznesit,
        // ListingCard e trajton shpalljen e biznesit si personale (maskim). Identik me HomeClient
        // dhe kërkimin: karta e biznesit "noton" e njohur qysh te render-i i parë SSR.
        .select(LISTING_SELECT)
        .eq('is_active', true)
        .order('rank_tier', { ascending: false })
        .order('last_bumped_at', { ascending: false })
        .limit(20),
      sb.from('categories').select('*').eq('is_active', true).order('sort_order'),
      // I njejti projeksion dhe i njejti kufi si `fetchShops()` te HomeClient —
      // ndryshe SSR-ja dhe klienti do te jepnin dy lartesi te ndryshme.
      sb.from('profiles')
        .select('id,full_name,username,avatar_url,city,shop_name,shop_description,shop_category,shop_banner_url,is_verified,is_premium,has_boost,premium_expires_at,boost_expires_at')
        .eq('is_premium', true)
        .limit(6),
      // Numrat publikë të hero-t merren KËTU (SSR), jo në klient. Më parë nisnin
      // nga 0 dhe kërcenin te vlera reale pas fetch-it të klientit — flash-i
      // "0 SHPALLJE/0 PËRDORUES → 2/2" që pa terminali live (#6). Të pjekura në
      // HTML, shfaqen sakt qysh te piktura e parë, edhe në guaskën e cache-uar.
      sb.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
    ])
    return {
      listings: (listings ?? []) as unknown as Listing[],
      categories: (categories ?? []) as unknown as Category[],
      shops: shops ?? [],
      listingCount: Number.isFinite(listingCount as number) ? (listingCount as number) : 0,
      userCount: Number.isFinite(userCount as number) ? (userCount as number) : 0,
    }
  } catch {
    return { listings: [], categories: [], shops: [], listingCount: 0, userCount: 0 }
  }
}

export default async function HomePage() {
  const { listings, categories, shops, listingCount, userCount } = await fetchHome()

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
      <HomeClient initialListings={listings} initialCategories={categories} initialShops={shops} initialListingCount={listingCount} initialUserCount={userCount} />
    </>
  )
}

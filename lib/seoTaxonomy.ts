// SEO taxonomy helpers — programmatic category + city landing pages (Faza 2, 2-B).
// Server-only utilities: slug maps for Albanian cities and Supabase fetchers used by
// the /kategori/* routes and the sitemap. Kept dependency-free (relative imports only).

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase'

export type SeoCategory = { id: string; name: string; slug: string; icon: string | null }

export type SeoListing = {
  id: string
  title: string
  price: number
  currency: string
  condition: string | null
  city: string | null
  is_premium: boolean
  images: string[] | null
  created_at: string
}

// Fallback category names if the DB is unreachable at build time (mirrors search page).
export const FALLBACK_CATEGORIES = [
  'Elektronikë', 'Makina', 'Shtëpi', 'Veshje', 'Kafshë', 'Sport',
  'Punë', 'Shërbime', 'Fëmijë', 'Bukuri', 'Libra', 'Ushqim', 'Tjera',
]

// Major Albanian cities used across the app (search results). 'Tjetër' is excluded
// on purpose — an "Other" bucket makes a poor, non-descriptive landing page.
export const CITIES = [
  'Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat',
  'Lushnjë', 'Kavajë', 'Gjirokastër', 'Sarandë', 'Lezhë', 'Kukës', 'Pogradec',
  'Peshkopi', 'Tropojë', 'Përmet', 'Tepelenë',
]

// Albanian-aware slugify: ë→e, ç→c, spaces→-, drop everything else.
export function slugify(input: string): string {
  return (input || '')
    .toLowerCase()
    .replace(/ë/g, 'e')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const CITY_BY_SLUG: Record<string, string> = CITIES.reduce((acc, c) => {
  acc[slugify(c)] = c
  return acc
}, {} as Record<string, string>)

export function citySlug(city: string): string { return slugify(city) }
export function cityFromSlug(slug: string): string | null { return CITY_BY_SLUG[slug] ?? null }

function db() { return createClient(SUPABASE_URL, SUPABASE_ANON_KEY) }

// All active categories, ordered for display. Guarantees a usable slug for every row.
export async function fetchCategories(): Promise<SeoCategory[]> {
  try {
    const { data, error } = await db()
      .from('categories')
      .select('id,name,slug,icon')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    if (error || !data) return []
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || slugify(c.name),
      icon: c.icon ?? null,
    }))
  } catch {
    return []
  }
}

// Resolve a category by its URL slug (falls back to matching a slugified name).
export async function fetchCategoryBySlug(slug: string): Promise<SeoCategory | null> {
  const cats = await fetchCategories()
  return cats.find(c => c.slug === slug) ?? null
}

// Listings for a category, optionally narrowed to a city. Premium first, then newest.
export async function fetchCategoryListings(
  categoryId: string,
  opts: { city?: string; limit?: number } = {},
): Promise<{ listings: SeoListing[]; total: number }> {
  const limit = opts.limit ?? 48
  try {
    let q = db()
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,created_at', { count: 'exact' })
      .eq('is_active', true)
      .eq('category_id', categoryId)
    if (opts.city) q = q.ilike('city', opts.city)
    const { data, count, error } = await q
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error || !data) return { listings: [], total: 0 }
    return { listings: data as SeoListing[], total: count ?? data.length }
  } catch {
    return { listings: [], total: 0 }
  }
}

export function fmtPrice(price: number, cur: string): string {
  if (!price) return 'Me marrëveshje'
  return cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`
}

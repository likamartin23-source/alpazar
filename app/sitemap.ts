import { createClient } from '@supabase/supabase-js'
import { MetadataRoute } from 'next'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { fetchCategories, CITIES, citySlug } from '../lib/seoTaxonomy'

export const revalidate = 3600 // Rigjeneroj çdo orë

const BASE = 'https://alpazar.vercel.app'

// Safe limit: Next.js sitemap times out above ~5s; 5000 rows is well within budget
const LISTING_LIMIT = 5000
const SHOP_LIMIT    = 500

// Pragu për faqet kategori×qytet. Faqja vetë vendos `robots:{index:false}` kur
// total===0, ndaj emetimi i 247 kombinimeve (13×19) i thoshte Google-it të
// zvarriste dhjetëra faqe që ne i ndalojmë — një rrjet faqesh gati-identike e
// gati-bosh është pikerisht ajo që klasifikohet si "doorway/scaled content".
// Tre shpallje është minimumi që e bën faqen një listë reale, jo një stub.
const MIN_LISTINGS_CITY = 3
const MIN_LISTINGS_CAT  = 1

// Normalizim qyteti: faqja filtron me `ilike`, pra pa dallim shkronjash.
const normCity = (c: string | null) => (c || '').trim().toLowerCase()

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  const [{ data: listings }, { data: businesses }] = await Promise.all([
    supabase
      .from('listings')
      // category_id + city na duhen për të numëruar realisht çdo kombinim pa
      // bërë 247 kërkesa të veçanta — një lexim, agregim në kujtesë.
      .select('id, category_id, city, updated_at, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(LISTING_LIMIT),
    supabase
      .from('businesses')
      .select('id, updated_at, created_at')
      .order('created_at', { ascending: false })
      .limit(SHOP_LIMIT),
  ])

  const rows = listings ?? []
  const stamp = (l: any) => new Date(l.updated_at ?? l.created_at)

  // Agregim: numër + data e fundit reale, për kategori dhe për kategori×qytet.
  const catCount = new Map<string, number>()
  const catLast  = new Map<string, Date>()
  const cityCount = new Map<string, number>()   // çelës: `${category_id}|${qytet i normalizuar}`
  const cityLast  = new Map<string, Date>()
  let newest: Date | null = null

  for (const l of rows as any[]) {
    const d = stamp(l)
    if (!newest || d > newest) newest = d
    const cid = l.category_id
    if (!cid) continue
    catCount.set(cid, (catCount.get(cid) ?? 0) + 1)
    if (!catLast.get(cid) || d > (catLast.get(cid) as Date)) catLast.set(cid, d)

    const key = `${cid}|${normCity(l.city)}`
    cityCount.set(key, (cityCount.get(key) ?? 0) + 1)
    if (!cityLast.get(key) || d > (cityLast.get(key) as Date)) cityLast.set(key, d)
  }

  // Faqet statike: `lastModified` HIQET qëllimisht. Google e përdor `lastmod`
  // vetëm nëse është "consistently and verifiably accurate"; `new Date()` në çdo
  // rigjenerim është një gënjeshter që e bën ta injorojë sinjalin për krejt sitemap-in.
  // https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  //
  // `/search` u hoq: navigim me faseta, URL të pafundme, zero përmbajtje unike.
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                   lastModified: newest ?? undefined, changeFrequency: 'daily',   priority: 1   },
    { url: `${BASE}/biznese`,      changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/premium`,      changeFrequency: 'weekly',  priority: 0.7 },
    { url: `${BASE}/asistent`,     changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/rreth-nesh`,   changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/kontakt`,      changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/kushtet`,      changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privatesia`,   changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/cookies`,      changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/siguria`,      changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/takedown`,     changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE}/referral`,     changeFrequency: 'monthly', priority: 0.4 },
  ]

  // SEO programatik — vetëm kombinimet që kanë përmbajtje reale.
  const categories = await fetchCategories()
  const seoPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/kategori`, lastModified: newest ?? undefined, changeFrequency: 'daily', priority: 0.8 },
  ]
  for (const c of categories) {
    if ((catCount.get(c.id) ?? 0) < MIN_LISTINGS_CAT) continue
    seoPages.push({
      url: `${BASE}/kategori/${c.slug}`,
      lastModified: catLast.get(c.id),
      changeFrequency: 'daily', priority: 0.7,
    })
    for (const city of CITIES) {
      const key = `${c.id}|${normCity(city)}`
      if ((cityCount.get(key) ?? 0) < MIN_LISTINGS_CITY) continue
      seoPages.push({
        url: `${BASE}/kategori/${c.slug}/${citySlug(city)}`,
        lastModified: cityLast.get(key),
        changeFrequency: 'weekly', priority: 0.5,
      })
    }
  }

  const listingPages: MetadataRoute.Sitemap = (rows as any[]).map(l => ({
    url:             `${BASE}/listing/${l.id}`,
    lastModified:    stamp(l),
    changeFrequency: 'weekly' as const,
    priority:        0.6,
  }))

  const businessPages: MetadataRoute.Sitemap = (businesses ?? []).map(b => ({
    url:             `${BASE}/biznese/${b.id}`,
    lastModified:    new Date(b.updated_at ?? b.created_at),
    changeFrequency: 'weekly' as const,
    priority:        0.7,
  }))

  return [...staticPages, ...seoPages, ...listingPages, ...businessPages]
}

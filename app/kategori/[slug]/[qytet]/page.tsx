import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '../../../../lib/siteConfig'
import {
  fetchCategoryBySlug, fetchCategoryListings, cityFromSlug, citySlug, CITIES,
} from '../../../../lib/seoTaxonomy'
import { ListingGrid, LANDING_CSS } from '../../_shared'

export const revalidate = 3600
export const dynamicParams = true

// City pages are generated on demand (ISR) — the combinatorial space is large,
// so we don't pre-build them; the sitemap still lists them for discovery.
export function generateStaticParams() { return [] }

export async function generateMetadata(
  { params }: { params: { slug: string; qytet: string } },
): Promise<Metadata> {
  const cat = await fetchCategoryBySlug(params.slug)
  const city = cityFromSlug(params.qytet)
  if (!cat || !city) return { title: 'Kategori — ALPAZAR' }
  const { total } = await fetchCategoryListings(cat.id, { city, limit: 1 })
  const url = `${SITE_URL}/kategori/${cat.slug}/${params.qytet}`
  const title = `${cat.name} në ${city} — shpallje online | ALPAZAR`
  const desc = `${total > 0 ? total + ' ' : ''}shpallje ${cat.name.toLowerCase()} në ${city}. Bli dhe shit ${cat.name.toLowerCase()} të reja e të përdorura në ${city}, Shqipëri — çmime, foto dhe kontakt direkt.`
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: total > 0 ? undefined : { index: false, follow: true },
    openGraph: {
      type: 'website', url, siteName: 'ALPAZAR', locale: 'sq_AL',
      title, description: desc,
      images: [{ url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512, alt: `${cat.name} ${city}` }],
    },
  }
}

export default async function CategoryCityPage(
  { params }: { params: { slug: string; qytet: string } },
) {
  const cat = await fetchCategoryBySlug(params.slug)
  const city = cityFromSlug(params.qytet)
  if (!cat || !city) notFound()

  const { listings, total } = await fetchCategoryListings(cat.id, { city, limit: 48 })
  const url = `${SITE_URL}/kategori/${cat.slug}/${params.qytet}`

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Kreu', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Kategoritë', item: `${SITE_URL}/kategori` },
          { '@type': 'ListItem', position: 3, name: cat.name, item: `${SITE_URL}/kategori/${cat.slug}` },
          { '@type': 'ListItem', position: 4, name: city, item: url },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${cat.name} në ${city} — ALPAZAR`,
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: listings.length,
          itemListElement: listings.slice(0, 20).map((l, i) => ({
            '@type': 'ListItem', position: i + 1,
            url: `${SITE_URL}/listing/${l.id}`, name: l.title,
          })),
        },
      },
    ],
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  const otherCities = CITIES.filter(c => c !== city)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <main className="seo-wrap">
        <nav className="seo-crumb" aria-label="Breadcrumb">
          <a href="/">Kreu</a> <span>/</span>
          <a href="/kategori">Kategoritë</a> <span>/</span>
          <a href={`/kategori/${cat.slug}`}>{cat.name}</a> <span>/</span>
          <span aria-current="page">{city}</span>
        </nav>

        <h1 className="seo-h1">
          <span className="ic" aria-hidden="true">{cat.icon || '🏷️'}</span> {cat.name} në {city}
        </h1>
        <p className="seo-sub">
          {total > 0
            ? `${total} shpallje "${cat.name}" në ${city}, Shqipëri.`
            : `Ende nuk ka shpallje "${cat.name}" në ${city}. Bëhu i pari që publikon!`}
        </p>

        {listings.length > 0 ? (
          <ListingGrid listings={listings} />
        ) : (
          <div className="seo-empty">
            Asnjë shpallje ende në {city}. <a href="/listing/new">Publiko një shpallje →</a>
          </div>
        )}

        <h2 className="seo-h2">{cat.name} në qytete të tjera</h2>
        <div className="seo-city-links">
          {otherCities.map(c => (
            <a key={c} className="seo-city-chip" href={`/kategori/${cat.slug}/${citySlug(c)}`}>{c}</a>
          ))}
        </div>

        <a className="seo-cta" href={`/search?cat=${encodeURIComponent(cat.id)}&city=${encodeURIComponent(city)}`}>
          Kërko {cat.name} në {city} →
        </a>
      </main>
    </>
  )
}

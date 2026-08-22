import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SITE_URL } from '../../../lib/siteConfig'
import {
  fetchCategoryBySlug, fetchCategoryListings,
  CITIES, citySlug,
} from '../../../lib/seoTaxonomy'
import { ListingGrid, LANDING_CSS } from '../_shared'

// SSR DINAMIK (jo ISR) — konsistencë build-i cross-route + verifikueshmëri (Cowork §12).
// ISR-ja shërbente prerender të deploy-eve të vjetra nga edge-i (staleness) dhe s'jepte
// sentry-release/buildId në HTML statik (s'monitorohej dot). force-dynamic i zgjidh të dyja.
export const dynamic = 'force-dynamic'

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params
  const cat = await fetchCategoryBySlug(params.slug)
  if (!cat) return { title: 'Kategori — ALPAZAR' }
  const { total } = await fetchCategoryListings(cat.id, { limit: 1 })
  const url = `${SITE_URL}/kategori/${cat.slug}`
  const title = `${cat.name} — shpallje online në Shqipëri | ALPAZAR`
  const desc = `${total > 0 ? total + ' ' : ''}shpallje ${cat.name.toLowerCase()} në ALPAZAR. Bli dhe shit ${cat.name.toLowerCase()} të reja e të përdorura në të gjithë Shqipërinë — çmime, foto dhe kontakt direkt.`
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    robots: total > 0 ? undefined : { index: false, follow: true },
    openGraph: {
      type: 'website', url, siteName: 'ALPAZAR', locale: 'sq_AL',
      title, description: desc,
      images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: cat.name }],
    },
  }
}

export default async function CategoryPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params
  const cat = await fetchCategoryBySlug(params.slug)
  if (!cat) notFound()

  const { listings, total } = await fetchCategoryListings(cat.id, { limit: 48 })
  const url = `${SITE_URL}/kategori/${cat.slug}`

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Kreu', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Kategoritë', item: `${SITE_URL}/kategori` },
          { '@type': 'ListItem', position: 3, name: cat.name, item: url },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${cat.name} — ALPAZAR`,
        url,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: listings.length,
          itemListElement: listings.slice(0, 20).map((l, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${SITE_URL}/listing/${l.id}`,
            name: l.title,
          })),
        },
      },
    ],
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />
      <main className="seo-wrap">
        <nav className="seo-crumb" aria-label="Breadcrumb">
          <a href="/">Kreu</a> <span>/</span>
          <a href="/kategori">Kategoritë</a> <span>/</span>
          <span aria-current="page">{cat.name}</span>
        </nav>

        <h1 className="seo-h1">
          <span className="ic" aria-hidden="true">{cat.icon || '🏷️'}</span> {cat.name}
        </h1>
        <p className="seo-sub">
          {total > 0
            ? `${total} shpallje aktive në kategorinë "${cat.name}" në të gjithë Shqipërinë.`
            : `Ende nuk ka shpallje aktive në "${cat.name}". Bëhu i pari që publikon!`}
        </p>

        <h2 className="seo-h2">Sipas qytetit</h2>
        <div className="seo-city-links">
          {CITIES.map(city => (
            <a key={city} className="seo-city-chip" href={`/kategori/${cat.slug}/${citySlug(city)}`}>
              {city}
            </a>
          ))}
        </div>

        {listings.length > 0 ? (
          <>
            <h2 className="seo-h2">Shpalljet më të fundit</h2>
            <ListingGrid listings={listings} />
          </>
        ) : (
          <div className="seo-empty" style={{ marginTop: 24 }}>
            Asnjë shpallje ende. <a href="/listing/new">Publiko një shpallje →</a>
          </div>
        )}

        <a className="seo-cta" href={`/search?cat=${encodeURIComponent(cat.id)}`}>Kërko në {cat.name} →</a>
      </main>
    </>
  )
}

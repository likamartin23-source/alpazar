import type { Metadata } from 'next'
import { SITE_URL } from '../../lib/siteConfig'
import { fetchCategories, FALLBACK_CATEGORIES, slugify, CITIES, citySlug } from '../../lib/seoTaxonomy'

// SSR DINAMIK (jo ISR). Prova (Cowork, verifikim anonim §12): rrugët ISR mund të
// shërbejnë një prerender të një deploy-i të VJETËR nga edge-i (staleness cross-deploy)
// — middleware no-store s'e parandalon dhe as sentry-release/buildId s'del në prerender
// statik (s'monitorohet dot). force-dynamic => buildId i njëjtë kudo + i verifikueshëm.
export const dynamic = 'force-dynamic'

const TITLE = 'Kategoritë — ALPAZAR'
const DESC = 'Shfleto të gjitha kategoritë e shpalljeve në ALPAZAR: elektronikë, makina, shtëpi, veshje e më shumë — sipas kategorisë dhe qytetit në Shqipëri.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/kategori` },
  openGraph: {
    type: 'website', url: `${SITE_URL}/kategori`, siteName: 'ALPAZAR',
    locale: 'sq_AL', title: TITLE, description: DESC,
    images: [{ url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512, alt: 'ALPAZAR' }],
  },
}

export default async function KategoriIndexPage() {
  const dbCats = await fetchCategories()
  const cats = dbCats.length > 0
    ? dbCats
    : FALLBACK_CATEGORIES.map(name => ({ id: name, name, slug: slugify(name), icon: null }))

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: TITLE,
    url: `${SITE_URL}/kategori`,
    hasPart: cats.map(c => ({
      '@type': 'CollectionPage',
      name: c.name,
      url: `${SITE_URL}/kategori/${c.slug}`,
    })),
  }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      <style dangerouslySetInnerHTML={{ __html: SEO_CSS }} />
      <main className="seo-wrap">
        <nav className="seo-crumb" aria-label="Breadcrumb">
          <a href="/">Kreu</a> <span>/</span> <span aria-current="page">Kategoritë</span>
        </nav>
        <h1 className="seo-h1">Kategoritë e shpalljeve</h1>
        <p className="seo-sub">Zgjidh një kategori për të parë shpalljet aktive në të gjithë Shqipërinë.</p>

        <div className="seo-cat-grid">
          {cats.map(c => (
            <a key={c.slug} className="seo-cat-card" href={`/kategori/${c.slug}`}>
              <span className="seo-cat-ico">{c.icon || '🏷️'}</span>
              <span className="seo-cat-name">{c.name}</span>
            </a>
          ))}
        </div>

        <h2 className="seo-h2">Shpallje sipas qytetit</h2>
        <div className="seo-city-links">
          {CITIES.map(city => (
            <a key={city} className="seo-city-chip" href={`/kategori/${cats[0]?.slug || 'elektronike'}/${citySlug(city)}`}>
              {city}
            </a>
          ))}
        </div>
      </main>
    </>
  )
}

const SEO_CSS = `
.seo-wrap{max-width:960px;margin:0 auto;padding:20px 16px 60px;font-family:inherit;}
.seo-crumb{font-size:12px;color:#888;margin-bottom:14px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.seo-crumb a{color:#C42B0F;text-decoration:none;}
.seo-crumb span[aria-current]{color:#555;}
.seo-h1{font-size:24px;font-weight:800;color:#1a1a1a;margin:0 0 6px;}
.seo-sub{font-size:14px;color:#666;margin:0 0 22px;line-height:1.5;}
.seo-h2{font-size:18px;font-weight:700;color:#1a1a1a;margin:34px 0 14px;}
.seo-cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;}
.seo-cat-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:20px 12px;background:#fff;border:1px solid #eee;border-radius:14px;text-decoration:none;color:#1a1a1a;transition:box-shadow .15s,transform .15s;}
.seo-cat-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.08);transform:translateY(-2px);}
.seo-cat-ico{font-size:30px;line-height:1;}
.seo-cat-name{font-size:13px;font-weight:600;text-align:center;}
.seo-city-links{display:flex;flex-wrap:wrap;gap:8px;}
.seo-city-chip{padding:8px 14px;background:#F7F7F7;border:1px solid #eee;border-radius:999px;font-size:13px;color:#333;text-decoration:none;transition:background .15s;}
.seo-city-chip:hover{background:#FDE9E4;color:#C42B0F;}
`

// Shared server-rendered pieces for the /kategori/* SEO landing pages.
import { fmtPrice, type SeoListing } from '../../lib/seoTaxonomy'

export function ListingGrid({ listings }: { listings: SeoListing[] }) {
  return (
    <div className="seo-grid">
      {listings.map(l => (
        <a key={l.id} className="seo-card" href={`/listing/${l.id}`}>
          <div className="seo-card-img">
            {l.images?.[0]
              ? <img src={l.images[0]} alt={l.title} loading="lazy" width={400} height={300} />
              : <span className="seo-card-ph" aria-hidden="true">📷</span>}
            {l.condition === 'i_ri' && <span className="seo-badge seo-badge-new">I ri</span>}
            {l.condition === 'i_perdorur' && <span className="seo-badge seo-badge-used">I përdorur</span>}
            {l.is_premium && <span className="seo-badge seo-badge-prem" aria-label="Premium">⭐</span>}
          </div>
          <div className="seo-card-body">
            <div className="seo-card-title">{l.title}</div>
            <div className="seo-card-price">{fmtPrice(l.price, l.currency)}</div>
            <div className="seo-card-loc">📍 {l.city || 'Shqipëri'}</div>
          </div>
        </a>
      ))}
    </div>
  )
}

export const LANDING_CSS = `
.seo-wrap{max-width:1040px;margin:0 auto;padding:20px 16px 60px;font-family:inherit;}
.seo-crumb{font-size:12px;color:#888;margin-bottom:14px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.seo-crumb a{color:#E63312;text-decoration:none;}
.seo-crumb span[aria-current]{color:#555;}
.seo-h1{font-size:23px;font-weight:800;color:#1a1a1a;margin:0 0 6px;display:flex;align-items:center;gap:10px;}
.seo-h1 .ic{font-size:26px;}
.seo-sub{font-size:14px;color:#666;margin:0 0 20px;line-height:1.5;}
.seo-h2{font-size:17px;font-weight:700;color:#1a1a1a;margin:32px 0 12px;}
.seo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;}
.seo-card{background:#fff;border:1px solid #eee;border-radius:14px;overflow:hidden;text-decoration:none;color:#1a1a1a;transition:box-shadow .15s,transform .15s;}
.seo-card:hover{box-shadow:0 6px 18px rgba(0,0,0,.08);transform:translateY(-2px);}
.seo-card-img{position:relative;aspect-ratio:4/3;background:#f4f4f4;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.seo-card-img img{width:100%;height:100%;object-fit:cover;display:block;}
.seo-card-ph{font-size:28px;opacity:.5;}
.seo-badge{position:absolute;top:8px;font-size:10px;font-weight:700;padding:3px 7px;border-radius:999px;}
.seo-badge-new{left:8px;background:#1FA463;color:#fff;}
.seo-badge-used{left:8px;background:#555;color:#fff;}
.seo-badge-prem{right:8px;background:#F5C842;}
.seo-card-body{padding:10px 11px 12px;}
.seo-card-title{font-size:13px;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:34px;}
.seo-card-price{font-size:14px;font-weight:800;color:#E63312;margin-top:5px;}
.seo-card-loc{font-size:11px;color:#999;margin-top:3px;}
.seo-city-links{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;}
.seo-city-chip{padding:8px 14px;background:#F7F7F7;border:1px solid #eee;border-radius:999px;font-size:13px;color:#333;text-decoration:none;transition:background .15s;}
.seo-city-chip:hover{background:#FDE9E4;color:#E63312;}
.seo-empty{padding:34px 16px;text-align:center;background:#fff;border:1px dashed #ddd;border-radius:14px;color:#777;font-size:14px;}
.seo-empty a{color:#E63312;text-decoration:none;font-weight:600;}
.seo-cta{display:inline-block;margin-top:20px;padding:11px 22px;background:#E63312;color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;}
`

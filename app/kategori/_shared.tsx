// Shared server-rendered CSS for the /kategori/* SEO landing pages.
// GAP 2 (RESTAURIMI FINAL): `ListingGrid` u zhvendos te `CategoryGrid.tsx` dhe përdor tani
// kartën e përbashkët `ListingCard` (jo `seo-card`). CSS-ja `seo-card*/seo-grid/seo-badge*`
// u hoq — grid-i përdor `.listings-grid` (ui-refine.css) dhe karta `.listing-card`.

export const LANDING_CSS = `
.seo-wrap{max-width:1040px;margin:0 auto;padding:20px 16px 60px;font-family:inherit;}
@media(min-width:1024px){.seo-wrap{max-width:100%;padding-left:clamp(32px,4vw,72px);padding-right:clamp(32px,4vw,72px);}}
.seo-crumb{font-size:12px;color:#555;margin-bottom:14px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;}
.seo-crumb a{color:#C42B0F;text-decoration:none;}
.seo-crumb span[aria-current]{color:#555;}
.seo-h1{font-size:var(--fs-3xl);font-weight:800;color:var(--az-ink);margin:0 0 6px;display:flex;align-items:center;gap:10px;}
.seo-h1 .ic{font-size:26px;}
.seo-sub{font-size:14px;color:#666;margin:0 0 20px;line-height:1.5;max-width:68ch;}
.seo-h2{font-size:17px;font-weight:700;color:var(--az-ink);margin:32px 0 12px;}
.seo-city-links{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:6px;}
.seo-city-chip{padding:8px 16px;min-height:44px;display:inline-flex;align-items:center;background:#F7F7F7;border:1px solid #eee;border-radius:999px;font-size:13px;color:#333;text-decoration:none;transition:background .15s;}
.seo-city-chip:hover{background:#FDE9E4;color:#C42B0F;}
.seo-empty{padding:34px 16px;text-align:center;background:#fff;border:1px dashed #ddd;border-radius:14px;color:#777;font-size:14px;}
.seo-empty a{color:#C42B0F;text-decoration:none;font-weight:600;}
.seo-cta{display:inline-flex;align-items:center;margin-top:20px;padding:11px 22px;min-height:44px;background:var(--az-red);color:#fff;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;}
`

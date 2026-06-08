'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { SkeletonGrid } from '../../components/Skeleton'

const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë', 'Gjirokastër', 'Sarandë', 'Lezhë', 'Kukës', 'Pogradec', 'Peshkopi', 'Tropojë', 'Përmet', 'Tepelenë', 'Tjetër']

const SHOP_CATEGORIES = [
  { id: 'elektronike', label: 'Elektronikë' },
  { id: 'makina', label: 'Makina' },
  { id: 'shtepi', label: 'Shtëpi' },
  { id: 'veshje', label: 'Veshje' },
  { id: 'sport', label: 'Sport' },
  { id: 'sherbime', label: 'Shërbime' },
  { id: 'femije', label: 'Fëmijë' },
  { id: 'bukuri', label: 'Bukuri' },
]

function fmt(price: number, cur: string) {
  if (!price) return 'Me marrëveshje'
  return cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`
}

function ShopCard({ shop }: { shop: any }) {
  const initials = (shop.shop_name || shop.full_name || '?').slice(0, 2).toUpperCase()
  const catLabel = SHOP_CATEGORIES.find(c => c.id === shop.shop_category)?.label

  return (
    <div className="shop-card" onClick={() => window.location.href = `/biznese/${shop.id}`}>
      <div className="shop-banner" style={{
        background: shop.shop_banner_url
          ? `url(${shop.shop_banner_url}) center/cover`
          : 'linear-gradient(135deg, #F5C84222, #F5C84244)'
      }}>
        <div className="shop-avatar">
          {shop.avatar_url
            ? <img src={shop.avatar_url} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <span style={{ fontSize: 17, fontWeight: 700, color: '#E63312' }}>{initials}</span>
          }
        </div>
        <div className="shop-premium-badge">⭐ Premium</div>
      </div>
      <div className="shop-body">
        <div className="shop-name">{shop.shop_name || shop.full_name}</div>
        {catLabel && <div className="shop-cat-tag">{catLabel}</div>}
        <div className="shop-meta">
          <span className="shop-city"><i className="ti ti-map-pin" style={{ fontSize: 10 }} /> {shop.city || 'Shqipëri'}</span>
          <span className="shop-count">{shop.listing_count || 0} shpallje</span>
        </div>
      </div>
    </div>
  )
}

function ListingCard({ l, premium }: { l: any; premium?: boolean }) {
  return (
    <div className="listing-card" onClick={() => window.location.href = `/listing/${l.id}`}>
      <div className="card-img">
        {l.images?.[0]
          ? <img src={l.images[0]} alt={l.title} />
          : <i className="ti ti-photo" style={{ fontSize: 30, color: '#ccc' }} />}
        {l.condition === 'i_ri'       && <span className="badge-new">I ri</span>}
        {l.condition === 'i_perdorur' && <span className="badge-used">I përdorur</span>}
        {premium && <span className="badge-premium">⭐</span>}
      </div>
      <div className="card-body">
        <div className="card-title">{l.title}</div>
        <div className="card-price">{fmt(l.price, l.currency)}</div>
        <div className="card-loc"><i className="ti ti-map-pin" style={{ fontSize: 10 }} />{l.city || 'Shqipëri'}</div>
      </div>
    </div>
  )
}

export default function SearchResultsPage() {
  const [q, setQ]                   = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [condFilter, setCondFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [priceMin, setPriceMin]     = useState('')
  const [priceMax, setPriceMax]     = useState('')

  const [shops, setShops]           = useState<any[]>([])
  const [premium, setPremium]       = useState<any[]>([])
  const [regular, setRegular]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // Read params from URL on mount and search
  useEffect(() => {
    supabase.from('categories').select('id,name,slug,icon').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
    const params = new URLSearchParams(window.location.search)
    const qp    = params.get('q')    || ''
    const catp  = params.get('cat')  || ''
    const condp = params.get('cond') || ''
    const cityp = params.get('city') || ''
    const pminp = params.get('pmin') || ''
    const pmaxp = params.get('pmax') || ''

    setQ(qp)
    setCatFilter(catp)
    setCondFilter(condp)
    setCityFilter(cityp)
    setPriceMin(pminp)
    setPriceMax(pmaxp)

    doSearch(qp, catp, condp, cityp, pminp, pmaxp)
  }, [])

  useEffect(() => {
    let n = 0
    if (condFilter) n++
    if (cityFilter) n++
    if (priceMin)   n++
    if (priceMax)   n++
    setActiveFilterCount(n)
  }, [condFilter, cityFilter, priceMin, priceMax])

  // Realtime: update/remove premium + regular listings
  useEffect(() => {
    if (!premium.length && !regular.length) return
    const ch = supabase
      .channel('results-rt')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listings' }, (payload) => {
        const n = payload.new as any
        if (!n.is_active) {
          setPremium(prev => prev.filter(l => l.id !== n.id))
          setRegular(prev => prev.filter(l => l.id !== n.id))
          return
        }
        if (n.is_premium) {
          setPremium(prev => prev.map(l => l.id === n.id ? { ...l, ...n } : l))
          setRegular(prev => prev.filter(l => l.id !== n.id))
        } else {
          setRegular(prev => prev.map(l => l.id === n.id ? { ...l, ...n } : l))
          setPremium(prev => prev.filter(l => l.id !== n.id))
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listings' }, (payload) => {
        const id = (payload.old as any).id
        setPremium(prev => prev.filter(l => l.id !== id))
        setRegular(prev => prev.filter(l => l.id !== id))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [premium.length > 0 || regular.length > 0])

  async function doSearch(
    query    = q,
    cat      = catFilter,
    cond     = condFilter,
    city     = cityFilter,
    pMin     = priceMin,
    pMax     = priceMax,
  ) {
    setLoading(true)

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const baseFilters: string[] = ['is_active = true']
    if (cat && UUID_RE.test(cat)) baseFilters.push(`category_id = "${cat}"`)
    if (cond) baseFilters.push(`condition = "${cond}"`)
    if (city) baseFilters.push(`city = "${city}"`)

    // ── 1) SHOPS ──────────────────────────────────────────────
    let shopResults: any[] = []
    {
      let qb = supabase
        .from('profiles')
        .select('id,full_name,username,avatar_url,city,bio,is_premium,shop_name,shop_description,shop_category,shop_banner_url')
        .eq('is_premium', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (query.trim()) {
        // ilike match on shop_name or full_name
        qb = (qb as any).or(`shop_name.ilike.%${query}%,full_name.ilike.%${query}%,city.ilike.%${query}%`)
      }

      const { data: profiles } = await qb
      if (profiles?.length) {
        const ids = profiles.map(p => p.id)
        const { data: listingsData } = await supabase
          .from('listings')
          .select('user_id')
          .in('user_id', ids)
          .eq('is_active', true)

        const countMap: Record<string, number> = {}
        for (const l of listingsData || []) countMap[l.user_id] = (countMap[l.user_id] || 0) + 1
        shopResults = profiles.map(p => ({ ...p, listing_count: countMap[p.id] || 0 }))
      }
    }
    setShops(shopResults)

    // ── 2 + 3) LISTINGS — FTS GIN ───────────────────────────
    const buildQb = (isPrem: boolean) => {
      let qb = supabase
        .from('listings')
        .select('id,title,price,currency,condition,city,is_premium,images,created_at,category_id')
        .eq('is_active', true)
        .eq('is_premium', isPrem)
        .order('created_at', { ascending: false })
        .limit(40)

      if (query.trim()) qb = (qb as any).textSearch('search_tsv', query.trim(), { type: 'websearch', config: 'simple' })
      if (cat)  qb = qb.eq('category_id', cat)
      if (cond) qb = qb.eq('condition', cond)
      if (city) qb = qb.eq('city', city)
      if (pMin) qb = qb.gte('price', parseFloat(pMin))
      if (pMax) qb = qb.lte('price', parseFloat(pMax))
      return qb
    }

    const [premRes, regRes] = await Promise.all([
      buildQb(true),
      buildQb(false),
    ])

    setPremium(premRes.data || [])
    setRegular(regRes.data || [])
    setLoading(false)
  }

  function applyFilters() {
    setFiltersOpen(false)
    const url = new URL(window.location.href)
    if (condFilter) url.searchParams.set('cond', condFilter); else url.searchParams.delete('cond')
    if (cityFilter) url.searchParams.set('city', cityFilter); else url.searchParams.delete('city')
    if (priceMin)   url.searchParams.set('pmin', priceMin);   else url.searchParams.delete('pmin')
    if (priceMax)   url.searchParams.set('pmax', priceMax);   else url.searchParams.delete('pmax')
    window.history.replaceState(null, '', url.toString())
    doSearch(q, catFilter, condFilter, cityFilter, priceMin, priceMax)
  }

  function clearFilters() {
    setCondFilter(''); setCityFilter(''); setPriceMin(''); setPriceMax('')
    const url = new URL(window.location.href)
    url.searchParams.delete('cond'); url.searchParams.delete('city')
    url.searchParams.delete('pmin'); url.searchParams.delete('pmax')
    window.history.replaceState(null, '', url.toString())
    doSearch(q, catFilter, '', '', '', '')
  }

  function newSearch(e: React.FormEvent) {
    e.preventDefault()
    const url = new URL(window.location.href)
    url.searchParams.set('q', q)
    window.history.replaceState(null, '', url.toString())
    doSearch()
  }

  const totalResults = shops.length + premium.length + regular.length

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:80px;}

        /* Topbar */
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .back i{font-size:18px;color:#111;}
        .search-wrap{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 11px;gap:7px;border:0.5px solid #e0b030;}
        .search-wrap i{font-size:14px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .filter-btn{position:relative;width:36px;height:36px;background:rgba(0,0,0,.1);border:none;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .filter-btn i{font-size:17px;color:#111;}
        .filter-badge{position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#E63312;border-radius:50%;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #F5C842;}

        /* Category chips */
        .cats{display:flex;gap:6px;overflow-x:auto;padding:10px 14px;background:#fff;border-bottom:1px solid #f0f0f0;}
        .cats::-webkit-scrollbar{display:none;}
        .cb{background:#f5f5f5;border:none;border-radius:20px;padding:5px 12px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;white-space:nowrap;}
        .cb.on{background:#F5C842;color:#111;}

        /* Active filters */
        .active-filters{display:flex;gap:5px;flex-wrap:wrap;padding:8px 14px;background:#fff;border-bottom:1px solid #f5f5f0;}
        .afilter{display:flex;align-items:center;gap:5px;background:#FFF8EE;border:1px solid #e0b030;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:600;color:#856404;}

        /* Body */
        .body{padding:12px 10px;}
        .results-meta{font-size:11px;color:#888;margin-bottom:14px;}
        .results-meta strong{color:#111;}

        /* Section headings */
        .section{margin-bottom:20px;}
        .section-hdr{display:flex;align-items:center;gap:7px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #F5C842;}
        .section-hdr .section-icon{font-size:16px;}
        .section-hdr h2{font-size:13px;font-weight:800;color:#111;flex:1;}
        .section-count{font-size:10px;color:#888;background:#f5f5f0;border-radius:20px;padding:2px 8px;}

        /* Shop grid */
        .shops-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
        .shop-card{background:#fff;border:0.5px solid #eee;border-radius:13px;overflow:hidden;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:transform .12s;}
        .shop-card:active{transform:scale(.97);}
        .shop-banner{height:56px;position:relative;display:flex;align-items:flex-end;padding:6px;}
        .shop-avatar{width:40px;height:40px;border-radius:50%;background:#fff;border:2.5px solid #F5C842;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.12);}
        .shop-premium-badge{position:absolute;top:5px;right:6px;background:#F5C842;color:#111;font-size:7.5px;padding:2px 5px;border-radius:8px;font-weight:700;}
        .shop-body{padding:7px 9px 9px;}
        .shop-name{font-size:11.5px;font-weight:700;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .shop-cat-tag{font-size:9px;color:#E63312;font-weight:600;margin-bottom:4px;}
        .shop-meta{display:flex;align-items:center;justify-content:space-between;}
        .shop-city{font-size:9px;color:#aaa;display:flex;align-items:center;gap:2px;}
        .shop-count{font-size:9px;color:#E63312;font-weight:700;}

        /* Listing grid */
        .listings-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
        .listing-card{background:#fff;border:0.5px solid #eee;border-radius:11px;overflow:hidden;cursor:pointer;display:flex;flex-direction:column;aspect-ratio:3/4;transition:transform .12s;}
        .listing-card:active{transform:scale(.98);}
        .card-img{flex:0 0 70%;position:relative;background:#f9f5e0;overflow:hidden;}
        .card-img img{width:100%;height:100%;object-fit:cover;position:absolute;inset:0;}
        .card-img i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
        .badge-new{position:absolute;top:5px;left:5px;background:#E63312;color:#fff;font-size:8px;padding:2px 5px;border-radius:4px;font-weight:700;}
        .badge-used{position:absolute;top:5px;left:5px;background:#111;color:#F5C842;font-size:8px;padding:2px 5px;border-radius:4px;font-weight:700;}
        .badge-premium{position:absolute;top:5px;right:5px;background:#F5C842;color:#111;font-size:8px;padding:2px 5px;border-radius:4px;font-weight:700;}
        .card-body{flex:0 0 30%;padding:7px 8px;display:flex;flex-direction:column;justify-content:space-between;min-height:0;}
        .card-title{font-size:11px;font-weight:700;color:#222;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .card-price{font-size:12.5px;font-weight:700;color:#E63312;}
        .card-loc{font-size:9.5px;color:#999;display:flex;align-items:center;gap:3px;}

        /* Empty state per section */
        .section-empty{text-align:center;padding:16px;background:#f9f9f7;border-radius:10px;color:#aaa;font-size:11px;}

        /* Global loading */
        .loading{text-align:center;padding:50px 20px;}
        .spinner{width:28px;height:28px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px;}
        @keyframes spin{to{transform:rotate(360deg);}}

        /* Filter panel */
        .filter-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;animation:fadeIn .2s;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .filter-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:210;padding:18px 16px 32px;box-shadow:0 -4px 24px rgba(0,0,0,.15);}
        .fp-handle{width:36px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 14px;}
        .fp-title{font-size:15px;font-weight:700;color:#111;margin-bottom:14px;}
        .fp-row{margin-bottom:14px;}
        .fp-label{font-size:11px;font-weight:700;color:#555;margin-bottom:6px;display:block;}
        .fp-row select,.fp-row input{width:100%;border:1.5px solid #ddd;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#111;}
        .fp-row select:focus,.fp-row input:focus{border-color:#F5C842;}
        .price-range{display:flex;gap:8px;}
        .price-range input{flex:1;}
        .cond-row{display:flex;gap:8px;}
        .cond-btn{flex:1;border:1.5px solid #ddd;border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;}
        .cond-btn.active{border-color:#E63312;background:#FFF0EE;color:#E63312;}
        .fp-actions{display:flex;gap:8px;margin-top:6px;}
        .fp-apply{flex:1;background:#E63312;color:#fff;border:none;border-radius:11px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .fp-clear{background:#f5f5f5;color:#555;border:none;border-radius:11px;padding:13px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}

        @keyframes ai-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .section{animation:ai-fade .25s ease;}
      `}</style>

      <div className="wrap">
        {/* ── TOP BAR ── */}
        <div className="topbar">
          <button className="back" onClick={() => window.location.href = '/search'}>
            <i className="ti ti-arrow-left" />
          </button>
          <form className="search-wrap" onSubmit={newSearch} style={{ flex: 1 }}>
            <i className="ti ti-search" />
            <input
              type="text"
              placeholder="Kërko çdo gjë..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </form>
          <button className="filter-btn" onClick={() => setFiltersOpen(true)}>
            <i className="ti ti-adjustments-horizontal" />
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* ── CATEGORY CHIPS ── */}
        <div className="cats">
          <button className={`cb ${!catFilter ? 'on' : ''}`}
            onClick={() => { setCatFilter(''); doSearch(q, '', condFilter, cityFilter, priceMin, priceMax) }}>
            Të gjitha
          </button>
          {categories.map(c => (
            <button key={c.id}
              className={`cb ${catFilter === c.id ? 'on' : ''}`}
              onClick={() => { setCatFilter(c.id); doSearch(q, c.id, condFilter, cityFilter, priceMin, priceMax) }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* ── ACTIVE FILTERS BAR ── */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            {condFilter && <span className="afilter">{condFilter === 'i_ri' ? '✨ I ri' : '🔄 I përdorur'}</span>}
            {cityFilter && <span className="afilter">📍 {cityFilter}</span>}
            {priceMin   && <span className="afilter">Min: {priceMin} L</span>}
            {priceMax   && <span className="afilter">Max: {priceMax} L</span>}
          </div>
        )}

        {/* ── BODY ── */}
        <div className="body">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <>
              <div className="results-meta">
                {q
                  ? <>Rezultate për <strong>"{q}"</strong> — <strong>{totalResults}</strong> gjëra</>
                  : <><strong>{totalResults}</strong> shpallje</>
                }
              </div>

              {/* ── SECTION 1: SHOPS ── */}
              <div className="section">
                <div className="section-hdr">
                  <span className="section-icon">🏪</span>
                  <h2>Bizneset</h2>
                  <span className="section-count">{shops.length}</span>
                </div>
                {shops.length === 0 ? (
                  <div className="section-empty">Nuk u gjet asnjë biznes{q ? ` për "${q}"` : ''}</div>
                ) : (
                  <div className="shops-grid">
                    {shops.map(s => <ShopCard key={s.id} shop={s} />)}
                  </div>
                )}
              </div>

              {/* ── SECTION 2: PREMIUM LISTINGS ── */}
              <div className="section">
                <div className="section-hdr">
                  <span className="section-icon">⭐</span>
                  <h2>Shpallje Premium</h2>
                  <span className="section-count">{premium.length}</span>
                </div>
                {premium.length === 0 ? (
                  <div className="section-empty">Nuk ka shpallje premium{q ? ` për "${q}"` : ''}</div>
                ) : (
                  <div className="listings-grid">
                    {premium.map(l => <ListingCard key={l.id} l={l} premium={true} />)}
                  </div>
                )}
              </div>

              {/* ── SECTION 3: ALL OTHER LISTINGS ── */}
              <div className="section">
                <div className="section-hdr">
                  <span className="section-icon">📋</span>
                  <h2>Të gjitha shpalljet</h2>
                  <span className="section-count">{regular.length}</span>
                </div>
                {regular.length === 0 ? (
                  <div className="section-empty">Nuk ka shpallje të tjera{q ? ` për "${q}"` : ''}</div>
                ) : (
                  <div className="listings-grid">
                    {regular.map(l => <ListingCard key={l.id} l={l} premium={false} />)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── FILTER PANEL ── */}
      {filtersOpen && (
        <>
          <div className="filter-overlay" onClick={() => setFiltersOpen(false)} />
          <div className="filter-panel">
            <div className="fp-handle" />
            <div className="fp-title">🎛 Filtrat e Avancuar</div>

            <div className="fp-row">
              <span className="fp-label">Gjendja</span>
              <div className="cond-row">
                <button className={`cond-btn ${condFilter === '' ? 'active' : ''}`}
                  onClick={() => setCondFilter('')}>Të gjitha</button>
                <button className={`cond-btn ${condFilter === 'i_ri' ? 'active' : ''}`}
                  onClick={() => setCondFilter(condFilter === 'i_ri' ? '' : 'i_ri')}>✨ I ri</button>
                <button className={`cond-btn ${condFilter === 'i_perdorur' ? 'active' : ''}`}
                  onClick={() => setCondFilter(condFilter === 'i_perdorur' ? '' : 'i_perdorur')}>🔄 I përdorur</button>
              </div>
            </div>

            <div className="fp-row">
              <span className="fp-label">Qyteti</span>
              <select value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                <option value="">Të gjitha qytetet</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="fp-row">
              <span className="fp-label">Çmimi (L)</span>
              <div className="price-range">
                <input type="number" placeholder="Min" value={priceMin}
                  onChange={e => setPriceMin(e.target.value)} min="0" />
                <input type="number" placeholder="Max" value={priceMax}
                  onChange={e => setPriceMax(e.target.value)} min="0" />
              </div>
            </div>

            <div className="fp-actions">
              <button className="fp-clear" onClick={() => { clearFilters(); setFiltersOpen(false) }}>
                Pastro
              </button>
              <button className="fp-apply" onClick={applyFilters}>
                Apliko filtrat {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

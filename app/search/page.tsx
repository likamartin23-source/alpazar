'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const MS_URL = process.env.NEXT_PUBLIC_MEILISEARCH_URL || '/api/meili'
const MS_KEY = process.env.NEXT_PUBLIC_MEILISEARCH_KEY || 'alpazar_search'

const CITIES = ['Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Fier', 'Korçë', 'Berat', 'Lushnjë', 'Kavajë', 'Gjirokastër', 'Sarandë', 'Lezhë', 'Kukës', 'Pogradec', 'Peshkopi', 'Tropojë', 'Përmet', 'Tepelenë', 'Tjetër']

async function meilisearch(query: string, filters: string[]) {
  if (!MS_URL || !MS_KEY) return null
  try {
    const res = await fetch(`${MS_URL}/indexes/listings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MS_KEY}` },
      body: JSON.stringify({ q: query, limit: 60, filter: filters, sort: ['is_premium:desc', 'created_at:desc'] }),
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.hits ?? null
  } catch {
    return null
  }
}

export default function SearchPage() {
  const [q, setQ]               = useState('')
  const [results, setResults]   = useState<any[]>([])
  const [loading, setLoading]   = useState(false)
  const [searched, setSearched] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  // Filters
  const [catFilter, setCatFilter]         = useState('')
  const [condFilter, setCondFilter]       = useState('')
  const [cityFilter, setCityFilter]       = useState('')
  const [priceMin, setPriceMin]           = useState('')
  const [priceMax, setPriceMax]           = useState('')
  const [filtersOpen, setFiltersOpen]     = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  useEffect(() => {
    supabase.from('categories').select('id,name,slug,icon').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
    const params = new URLSearchParams(window.location.search)
    const qp = params.get('q')
    const cp = params.get('cat')
    if (cp) setCatFilter(cp)
    if (qp) { setQ(qp); doSearch(qp, cp || '', '', '', '', '') }
  }, [])

  useEffect(() => {
    let n = 0
    if (condFilter) n++
    if (cityFilter) n++
    if (priceMin)   n++
    if (priceMax)   n++
    setActiveFilterCount(n)
  }, [condFilter, cityFilter, priceMin, priceMax])

  async function doSearch(
    query = q,
    cat = catFilter,
    cond = condFilter,
    city = cityFilter,
    pMin = priceMin,
    pMax = priceMax,
  ) {
    setLoading(true); setSearched(true)

    // Build filter array for Meilisearch-compatible API
    const filters: string[] = ['is_active = true']
    if (cat)  filters.push(`category_id = "${cat}"`)
    if (cond) filters.push(`condition = "${cond}"`)
    if (city) filters.push(`city = "${city}"`)

    if (query.trim() && MS_URL && MS_KEY) {
      const msResults = await meilisearch(query, filters)
      if (msResults !== null) {
        let filtered = msResults
        if (pMin) filtered = filtered.filter((l: any) => (l.price || 0) >= parseFloat(pMin))
        if (pMax) filtered = filtered.filter((l: any) => (l.price || 0) <= parseFloat(pMax))
        setResults(filtered)
        setLoading(false)
        return
      }
    }

    // Supabase fallback
    let qb = supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,created_at,category_id')
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(60)

    if (query.trim()) qb = qb.ilike('title', `%${query.trim()}%`)
    if (cat)  qb = qb.eq('category_id', cat)
    if (cond) qb = qb.eq('condition', cond)
    if (city) qb = qb.eq('city', city)
    if (pMin) qb = qb.gte('price', parseFloat(pMin))
    if (pMax) qb = qb.lte('price', parseFloat(pMax))

    const { data } = await qb
    setResults(data || [])
    setLoading(false)
  }

  function applyFilters() {
    setFiltersOpen(false)
    doSearch(q, catFilter, condFilter, cityFilter, priceMin, priceMax)
  }

  function clearFilters() {
    setCondFilter(''); setCityFilter(''); setPriceMin(''); setPriceMax('')
    doSearch(q, catFilter, '', '', '', '')
  }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); doSearch() }

  const fmt = (price: number, cur: string) =>
    !price ? 'Me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:80px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .back i{font-size:18px;color:#111;}
        .search-wrap{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 11px;gap:7px;border:0.5px solid #e0b030;}
        .search-wrap i{font-size:14px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .search-btn{background:#111;color:#F5C842;border:none;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
        .filter-btn{position:relative;width:36px;height:36px;background:rgba(0,0,0,.1);border:none;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .filter-btn i{font-size:17px;color:#111;}
        .filter-badge{position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#E63312;border-radius:50%;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #F5C842;}
        .cats{display:flex;gap:6px;overflow-x:auto;padding:10px 14px;background:#fff;border-bottom:1px solid #f0f0f0;}
        .cats::-webkit-scrollbar{display:none;}
        .cb{background:#f5f5f5;border:none;border-radius:20px;padding:5px 12px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;white-space:nowrap;}
        .cb.on{background:#F5C842;color:#111;}
        .body{padding:12px 10px;}
        .results-info{font-size:11px;color:#888;margin-bottom:10px;display:flex;align-items:center;flex-wrap:wrap;gap:6px;}
        .results-info strong{color:#111;}
        .active-filters{display:flex;gap:5px;flex-wrap:wrap;padding:0 14px 8px;background:#fff;border-bottom:1px solid #f5f5f0;}
        .afilter{display:flex;align-items:center;gap:5px;background:#FFF8EE;border:1px solid #e0b030;border-radius:20px;padding:3px 10px;font-size:10px;font-weight:600;color:#856404;}
        .listings-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
        .listing-card{background:#fff;border:0.5px solid #eee;border-radius:11px;overflow:hidden;cursor:pointer;transition:transform .12s;}
        .listing-card:active{transform:scale(.98);}
        .card-img{height:90px;display:flex;align-items:center;justify-content:center;font-size:32px;position:relative;background:#f9f5e0;}
        .card-img img{width:100%;height:100%;object-fit:cover;}
        .badge-new{position:absolute;top:5px;left:5px;background:#E63312;color:#fff;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .badge-used{position:absolute;top:5px;left:5px;background:#111;color:#F5C842;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .badge-premium{position:absolute;top:5px;right:5px;background:#F5C842;color:#111;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .card-body{padding:9px 10px;}
        .card-title{font-size:12px;font-weight:700;color:#222;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .card-price{font-size:14px;font-weight:700;color:#E63312;margin-bottom:4px;}
        .card-loc{font-size:10px;color:#999;display:flex;align-items:center;gap:3px;}
        .empty{text-align:center;padding:40px 20px;}
        .empty i{font-size:44px;color:#e0b030;display:block;margin-bottom:10px;}
        .empty h3{font-size:14px;font-weight:700;color:#555;margin-bottom:6px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.7;}
        .initial{text-align:center;padding:50px 20px;}
        .initial i{font-size:50px;color:#e0b030;display:block;margin-bottom:14px;}
        .initial h3{font-size:15px;font-weight:700;color:#111;margin-bottom:6px;}
        .initial p{font-size:12px;color:#888;}
        .loading{text-align:center;padding:40px;color:#888;font-size:13px;}
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
        .fp-row select,
        .fp-row input{width:100%;border:1.5px solid #ddd;border-radius:10px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#111;}
        .fp-row select:focus,.fp-row input:focus{border-color:#F5C842;}
        .price-range{display:flex;gap:8px;}
        .price-range input{flex:1;}
        .cond-row{display:flex;gap:8px;}
        .cond-btn{flex:1;border:1.5px solid #ddd;border-radius:9px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;}
        .cond-btn.active{border-color:#E63312;background:#FFF0EE;color:#E63312;}
        .fp-actions{display:flex;gap:8px;margin-top:6px;}
        .fp-apply{flex:1;background:#E63312;color:#fff;border:none;border-radius:11px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .fp-clear{background:#f5f5f5;color:#555;border:none;border-radius:11px;padding:13px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.location.href = '/'}>
            <i className="ti ti-arrow-left" />
          </button>
          <form className="search-wrap" onSubmit={handleSubmit}>
            <i className="ti ti-search" />
            <input
              type="text"
              placeholder="Kërko çdo gjë..."
              value={q}
              onChange={e => setQ(e.target.value)}
              autoFocus
            />
          </form>
          <button className="search-btn" onClick={() => doSearch()}>Kërko</button>
          <button className="filter-btn" onClick={() => setFiltersOpen(true)}>
            <i className="ti ti-adjustments-horizontal" />
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* Category chips */}
        <div className="cats">
          <button className={`cb ${!catFilter ? 'on' : ''}`}
            onClick={() => { setCatFilter(''); if (q) doSearch(q, '', condFilter, cityFilter, priceMin, priceMax) }}>
            Të gjitha
          </button>
          {categories.map(c => (
            <button key={c.id}
              className={`cb ${catFilter === c.id ? 'on' : ''}`}
              onClick={() => { setCatFilter(c.id); if (q) doSearch(q, c.id, condFilter, cityFilter, priceMin, priceMax) }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Active filters bar */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            {condFilter && <span className="afilter">{condFilter === 'i_ri' ? '✨ I ri' : '🔄 I përdorur'}</span>}
            {cityFilter && <span className="afilter">📍 {cityFilter}</span>}
            {priceMin   && <span className="afilter">Min: {priceMin} L</span>}
            {priceMax   && <span className="afilter">Max: {priceMax} L</span>}
          </div>
        )}

        <div className="body">
          {loading ? (
            <div className="loading">
              <div className="spinner" />
              <div>Duke kërkuar...</div>
            </div>
          ) : !searched ? (
            <div className="initial">
              <i className="ti ti-search" />
              <h3>Kërko çdo gjë në Shqipëri</h3>
              <p>Elektronikë, Automjete, Prona,<br />Kafshë, Shërbime dhe shumë të tjera</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty">
              <i className="ti ti-mood-sad" />
              <h3>Nuk u gjet asgjë</h3>
              <p>Provo terma të tjerë ose<br />ndrysho filtrat</p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters}
                  style={{ marginTop: 12, background: '#F5C842', color: '#111', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Pastro filtrat
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="results-info">
                Gjetur <strong>{results.length}</strong> shpallje {q && `për "${q}"`}
              </div>
              <div className="listings-grid">
                {results.map(l => (
                  <div key={l.id} className="listing-card" onClick={() => window.location.href = `/listing/${l.id}`}>
                    <div className="card-img">
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt={l.title} />
                        : <i className="ti ti-photo" style={{ fontSize: 32, color: '#ccc' }} />}
                      {l.condition === 'i_ri'       && <span className="badge-new">I ri</span>}
                      {l.condition === 'i_perdorur' && <span className="badge-used">I përdorur</span>}
                      {l.is_premium && <span className="badge-premium">⭐</span>}
                    </div>
                    <div className="card-body">
                      <div className="card-title">{l.title}</div>
                      <div className="card-price">{fmt(l.price, l.currency)}</div>
                      <div className="card-loc"><i className="ti ti-map-pin" style={{ fontSize: 11 }} />{l.city || 'Shqipëri'}</div>
                    </div>
                  </div>
                ))}
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

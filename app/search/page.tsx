'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const ALBANIAN_CITIES = [
  'Tiranë', 'Durrës', 'Vlorë', 'Shkodër', 'Elbasan', 'Korçë', 'Fier',
  'Berat', 'Lushnjë', 'Kavajë', 'Gjirokastër', 'Sarandë', 'Lezhë', 'Kukës',
  'Peshkopi', 'Përmet', 'Tepelenë', 'Selenicë', 'Himarë', 'Rrogozhinë',
]

const FALLBACK_CATEGORIES = [
  'Elektronikë', 'Makina', 'Shtëpi', 'Veshje', 'Kafshë', 'Sport',
  'Punë', 'Shërbime', 'Fëmijë', 'Bukuri', 'Libra', 'Ushqim', 'Tjera',
]

export default function SearchPage() {
  const [q, setQ]               = useState('')
  const [categories, setCategories] = useState<string[]>([])

  // Filters
  const [catFilter, setCatFilter]         = useState('')
  const [condFilter, setCondFilter]       = useState('Të gjitha')
  const [cityFilter, setCityFilter]       = useState('')
  const [priceMin, setPriceMin]           = useState('')
  const [priceMax, setPriceMax]           = useState('')
  const [premiumOnly, setPremiumOnly]     = useState(false)
  const [filtersOpen, setFiltersOpen]     = useState(false)
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  useEffect(() => {
    Promise.resolve(
      supabase.from('categories').select('name').order('name')
    ).then(({ data, error }) => {
      if (!error && data && data.length > 0) {
        setCategories(data.map((c: any) => c.name))
      } else {
        setCategories(FALLBACK_CATEGORIES)
      }
    }).catch(() => setCategories(FALLBACK_CATEGORIES))

    const params = new URLSearchParams(window.location.search)
    const qp   = params.get('q')
    const cp   = params.get('cat')
    const pp   = params.get('prem')
    const condp = params.get('cond')
    const cityp = params.get('city')
    const pminp = params.get('pmin')
    const pmaxp = params.get('pmax')

    if (cp)   setCatFilter(cp)
    if (pp === '1') setPremiumOnly(true)
    if (condp) setCondFilter(condp)
    if (cityp) setCityFilter(cityp)
    if (pminp) setPriceMin(pminp)
    if (pmaxp) setPriceMax(pmaxp)

    if (qp) {
      setQ(qp)
      const p = new URLSearchParams()
      p.set('q', qp)
      if (cp)   p.set('cat',  cp)
      if (pp)   p.set('prem', pp)
      if (condp) p.set('cond', condp)
      if (cityp) p.set('city', cityp)
      if (pminp) p.set('pmin', pminp)
      if (pmaxp) p.set('pmax', pmaxp)
      window.location.href = `/search/results?${p.toString()}`
    }
  }, [])

  useEffect(() => {
    let n = 0
    if (catFilter)                      n++
    if (condFilter && condFilter !== 'Të gjitha') n++
    if (cityFilter)                     n++
    if (priceMin)                       n++
    if (priceMax)                       n++
    if (premiumOnly)                    n++
    setActiveFilterCount(n)
  }, [catFilter, condFilter, cityFilter, priceMin, priceMax, premiumOnly])

  function goToResults(
    query  = q,
    cat    = catFilter,
    cond   = condFilter,
    city   = cityFilter,
    pMin   = priceMin,
    pMax   = priceMax,
    prem   = premiumOnly,
  ) {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (cat)  params.set('cat',  cat)
    if (cond && cond !== 'Të gjitha') params.set('cond', cond)
    if (city.trim()) params.set('city', city.trim())
    if (pMin) params.set('pmin', pMin)
    if (pMax) params.set('pmax', pMax)
    if (prem) params.set('prem', '1')
    window.location.href = `/search/results?${params.toString()}`
  }

  function applyFilters() {
    setFiltersOpen(false)
    goToResults()
  }

  function clearFilters() {
    setCatFilter('')
    setCondFilter('Të gjitha')
    setCityFilter('')
    setPriceMin('')
    setPriceMax('')
    setPremiumOnly(false)
    goToResults(q, '', 'Të gjitha', '', '', '', false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    goToResults()
  }

  const conditions = ['Të gjitha', 'I ri', 'I përdorur']

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--az-cream);}
        .wrap{max-width:480px;margin:0 auto;background:var(--az-cream);min-height:100vh;padding-bottom:80px;}

        /* ── Topbar ── */
        .topbar{background:linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%);padding:10px 12px;display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:50;}
        .back{width:44px;height:44px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .back i{font-size:18px;color:#111;}
        .search-wrap{flex:1;background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 11px;gap:8px;border:0.5px solid #e0b030;transition:border-color .15s ease,box-shadow .15s ease;}
        .search-wrap i{font-size:14px;color:#bbb;transition:color .15s ease;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .search-wrap:focus-within{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
        .search-wrap:focus-within i{color:#C42B0F;}
        .search-btn{background:linear-gradient(135deg,var(--az-ink),#000);color:var(--az-yellow);border:none;border-radius:12px;padding:9px 14px;min-height:44px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(0,0,0,.25);transition:transform .15s ease,box-shadow .15s ease;}
        .search-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px -2px rgba(0,0,0,.35);}

        /* ── Filter toggle bar ── */
        .filter-toggle-bar{background:#fff;border-bottom:1px solid #ececec;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;}
        .filter-toggle-btn{display:flex;align-items:center;gap:5px;background:transparent;border:1px solid #ececec;border-radius:999px;padding:5px 14px;min-height:44px;font-size:11px;font-weight:700;color:#111;cursor:pointer;font-family:inherit;transition:background .15s ease,color .15s ease,border-color .15s ease;}
        .filter-toggle-btn:hover{background:#f5f5f5;}
        .filter-toggle-btn.active{background:linear-gradient(135deg,var(--az-ink),#000);color:var(--az-yellow);border-color:#111;}
        .filter-badge-inline{background:var(--az-red);color:#fff;border-radius:50%;width:16px;height:16px;font-size:9px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;}
        .clear-link{font-size:11px;color:#C42B0F;font-weight:600;cursor:pointer;background:none;border:none;font-family:inherit;padding:4px 10px;min-height:44px;display:inline-flex;align-items:center;}

        /* ── Category chips ── */
        .cats{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;background:#fff;border-bottom:1px solid #f0f0f0;}
        .cats::-webkit-scrollbar{display:none;}
        .cb{background:#f5f5f5;border:none;border-radius:999px;padding:5px 14px;min-height:44px;display:inline-flex;align-items:center;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;white-space:nowrap;transition:background .15s ease,color .15s ease;}
        .cb.on{background:linear-gradient(135deg,var(--az-ink),#000);color:var(--az-yellow);}

        /* ── Inline filter panel ── */
        /* visibility:hidden kur eshte i palosur — JO vetem max-height/opacity.
           MATUR: pa te, 26 nga 60 ndalesat e tastieres binin BRENDA ketij paneli
           te padukshem; perdoruesi me tastiere humbte fokusin ne 26 kontrolle qe
           nuk i shihte dhe nuk i klikonte dot (pointer-events:none). Lexuesi i
           ekranit i lexonte te 17 cipat e kategorive dy here.
           opacity:0 NUK e heq nga rendi i tabit; visibility:hidden po, ne cdo
           shfletues. inert do ta bente me bukur, por s'e mbulon browserslist-in
           e projektit (chrome>=90, safari>=14). Vonesa te visibility e le
           animacionin e mbylljes te perfundoje para se te fshihet.
           Prove: 26 ndalesa -> 0. axe NUK e kap kete klase defekti. */
        .filter-panel{background:#fff;border-bottom:2px solid var(--az-yellow);overflow:hidden;transition:max-height .25s ease,opacity .2s ease,visibility 0s linear .25s;max-height:0;opacity:0;pointer-events:none;visibility:hidden;}
        .filter-panel.open{max-height:600px;opacity:1;pointer-events:auto;visibility:visible;transition:max-height .25s ease,opacity .2s ease,visibility 0s;}
        .filter-inner{padding:14px 12px 6px;}

        .fp-section{margin-bottom:14px;}
        .fp-label{display:block;font-size:10px;font-weight:700;color:#4A4A4A;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;}

        /* City dropdown */
        .fp-select{width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#111;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;cursor:pointer;transition:border-color .15s ease,box-shadow .15s ease;}
        .fp-select:focus{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}

        /* Price inputs */
        .price-row{display:flex;gap:8px;align-items:center;}
        .price-input-wrap{flex:1;position:relative;}
        .price-input-wrap input{width:100%;border:1.5px solid #e0e0e0;border-radius:12px;padding:10px 13px;font-size:13px;font-family:inherit;outline:none;background:#fff;color:#111;transition:border-color .15s ease,box-shadow .15s ease;}
        .price-input-wrap input:focus{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
        .price-sep{font-size:13px;color:#bbb;font-weight:600;flex-shrink:0;}

        /* Condition chips */
        .cond-row{display:flex;gap:8px;}
        .cond-chip{flex:1;border:1.5px solid #e0e0e0;border-radius:12px;padding:8px 4px;min-height:44px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;white-space:nowrap;transition:all .15s ease;}
        .cond-chip:hover{border-color:#aaa;}
        .cond-chip.on{border-color:#111;background:linear-gradient(135deg,var(--az-ink),#000);color:var(--az-yellow);}

        /* Premium toggle */
        .premium-toggle{display:flex;align-items:center;justify-content:space-between;border:1.5px solid #e0e0e0;border-radius:12px;padding:11px 14px;cursor:pointer;transition:border-color .15s ease,background .15s ease;}
        .premium-toggle.on{border-color:#e0b030;background:var(--az-cream);}
        .premium-toggle-label{font-size:13px;font-weight:700;color:#111;}
        .premium-toggle-sub{font-size:10px;color:#555;margin-top:2px;}
        .toggle-track{width:42px;height:24px;border-radius:12px;position:relative;transition:background .2s;flex-shrink:0;}
        .toggle-thumb{width:18px;height:18px;border-radius:50%;background:#fff;position:absolute;top:3px;transition:left .2s;box-shadow:0 1px 4px rgba(0,0,0,.2);}

        /* Action row */
        .fp-actions{display:flex;gap:8px;padding:0 12px 14px;}
        .fp-apply{flex:1;background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 8px -2px rgba(230,51,18,.4);transition:transform .15s ease,box-shadow .15s ease;}
        .fp-apply:hover{transform:translateY(-1px);box-shadow:0 4px 16px -4px rgba(230,51,18,.5);}
        .fp-clear{background:#f5f5f5;color:#555;border:none;border-radius:12px;padding:13px 16px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;}

        /* ── Active filter tags ── */
        .active-filters{display:flex;gap:5px;flex-wrap:wrap;padding:8px 12px;background:#fff;border-bottom:1px solid #ececec;}
        .afilter{display:flex;align-items:center;gap:5px;background:#FFF8EE;border:1px solid #e0b030;border-radius:999px;padding:3px 10px;font-size:10px;font-weight:600;color:#856404;}

        /* ── Body / initial state ── */
        .body{padding:12px;}
        .initial{text-align:center;padding:50px 20px;}
        .initial i{font-size:50px;color:#e0b030;display:block;margin-bottom:14px;}
        .initial h1{font-size:var(--fs-xl);font-weight:700;color:var(--az-ink);margin-bottom:6px;}
        .initial p{font-size:12px;color:#555;}
      ` }} />

      <div className="wrap">
        {/* ── Topbar ── */}
        <div className="topbar">
          <button
            type="button"
            className="back"
            aria-label="Kthehu në ballina"
            onClick={() => { window.location.href = '/' }}
          >
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <form
            className="search-wrap"
            role="search"
            aria-label="Kërko shpallje"
            onSubmit={handleSubmit}
          >
            <i className="ti ti-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Kërko çdo gjë..."
              value={q}
              onChange={e => setQ(e.target.value)}
              autoFocus
            />
          </form>
          <button
            type="button"
            className="search-btn"
            onClick={() => goToResults()}
          >
            Kërko
          </button>
        </div>

        {/* ── Filter toggle bar ── */}
        <div className="filter-toggle-bar">
          <button
            type="button"
            className={`filter-toggle-btn${filtersOpen ? ' active' : ''}`}
            aria-expanded={filtersOpen}
            aria-controls="filter-panel"
            onClick={() => setFiltersOpen(v => !v)}
          >
            <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
            Filtrat {filtersOpen ? '▲' : '▼'}
            {activeFilterCount > 0 && (
              <span className="filter-badge-inline" aria-label={`${activeFilterCount} filtra aktiv`}>
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button type="button" className="clear-link" onClick={clearFilters}>
              ✕ Pastro filtrat
            </button>
          )}
        </div>

        {/* ── Inline collapsible filter panel ── */}
        <div
          id="filter-panel"
          className={`filter-panel${filtersOpen ? ' open' : ''}`}
          role="region"
          aria-label="Filtrat e avancuara"
        >
          <div className="filter-inner">

            {/* 1. Kategoria */}
            <div className="fp-section">
              <span className="fp-label">Kategoria</span>
              <div className="cats" style={{ padding: '0', marginBottom: 2 }}>
                <button
                  type="button"
                  className={`cb${catFilter === '' ? ' on' : ''}`}
                  aria-pressed={catFilter === ''}
                  onClick={() => setCatFilter('')}
                >
                  Të gjitha
                </button>
                {categories.map(name => (
                  <button
                    type="button"
                    key={name}
                    className={`cb${catFilter === name ? ' on' : ''}`}
                    aria-pressed={catFilter === name}
                    onClick={() => setCatFilter(catFilter === name ? '' : name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Qyteti */}
            <div className="fp-section">
              <label className="fp-label" htmlFor="city-select">Qyteti</label>
              <select
                id="city-select"
                className="fp-select"
                aria-label="Zgjidh qytetin"
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              >
                <option value="">Të gjitha qytetet</option>
                {ALBANIAN_CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* 3. Çmim min-max */}
            <div className="fp-section">
              <span className="fp-label">Çmimi</span>
              <div className="price-row">
                <div className="price-input-wrap">
                  <input
                    type="number"
                    aria-label="Çmim minimal në lekë"
                    placeholder="Çmim min (L)"
                    value={priceMin}
                    min="0"
                    onChange={e => setPriceMin(e.target.value)}
                  />
                </div>
                <span className="price-sep" aria-hidden="true">—</span>
                <div className="price-input-wrap">
                  <input
                    type="number"
                    aria-label="Çmim maksimal në lekë"
                    placeholder="Çmim max (L)"
                    value={priceMax}
                    min="0"
                    onChange={e => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* 4. Gjendja */}
            <div className="fp-section">
              <span className="fp-label">Gjendja</span>
              <div className="cond-row" role="group" aria-label="Gjendja e produktit">
                {conditions.map(cond => (
                  <button
                    type="button"
                    key={cond}
                    className={`cond-chip${condFilter === cond ? ' on' : ''}`}
                    aria-pressed={condFilter === cond}
                    onClick={() => setCondFilter(cond)}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Vetëm Premium */}
            <div className="fp-section">
              <div
                className={`premium-toggle${premiumOnly ? ' on' : ''}`}
                role="switch"
                aria-checked={premiumOnly}
                tabIndex={0}
                onClick={() => setPremiumOnly(v => !v)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setPremiumOnly(v => !v)
                  }
                }}
              >
                <div>
                  <div className="premium-toggle-label">
                    <span aria-hidden="true">⭐</span> Vetëm shpallje premium
                  </div>
                  <div className="premium-toggle-sub">Shpallje të verifikuara dhe prioritare</div>
                </div>
                <div
                  className="toggle-track"
                  style={{ background: premiumOnly ? 'var(--az-yellow)' : '#ddd' }}
                  aria-hidden="true"
                >
                  <div
                    className="toggle-thumb"
                    style={{ left: premiumOnly ? 21 : 3 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="fp-actions">
            <button type="button" className="fp-clear" onClick={clearFilters}>
              ✕ Pastro
            </button>
            <button type="button" className="fp-apply" onClick={applyFilters}>
              <i className="ti ti-search" aria-hidden="true" />
              Kërko
              {activeFilterCount > 0 && ` (${activeFilterCount})`}
            </button>
          </div>
        </div>

        {/* ── Category chips (always visible quick filter) ── */}
        <div className="cats" aria-label="Filtro sipas kategorisë">
          <button
            type="button"
            className={`cb${catFilter === '' ? ' on' : ''}`}
            aria-pressed={catFilter === ''}
            onClick={() => {
              setCatFilter('')
              if (q) goToResults(q, '', condFilter, cityFilter, priceMin, priceMax, premiumOnly)
            }}
          >
            Të gjitha
          </button>
          {categories.map(name => (
            <button
              type="button"
              key={name}
              className={`cb${catFilter === name ? ' on' : ''}`}
              aria-pressed={catFilter === name}
              onClick={() => {
                setCatFilter(name)
                if (q) goToResults(q, name, condFilter, cityFilter, priceMin, priceMax, premiumOnly)
              }}
            >
              {name}
            </button>
          ))}
        </div>

        {/* ── Active filter tags ── */}
        {activeFilterCount > 0 && (
          <div className="active-filters" role="list" aria-label="Filtrat aktiv">
            {catFilter && (
              <span className="afilter" role="listitem">
                <span aria-hidden="true">🏷</span> {catFilter}
              </span>
            )}
            {condFilter && condFilter !== 'Të gjitha' && (
              <span className="afilter" role="listitem">
                {condFilter === 'I ri'
                  ? <><span aria-hidden="true">✨</span> I ri</>
                  : <><span aria-hidden="true">🔄</span> I përdorur</>
                }
              </span>
            )}
            {cityFilter && (
              <span className="afilter" role="listitem">
                <span aria-hidden="true">📍</span> {cityFilter}
              </span>
            )}
            {priceMin && (
              <span className="afilter" role="listitem">Min: {priceMin} L</span>
            )}
            {priceMax && (
              <span className="afilter" role="listitem">Max: {priceMax} L</span>
            )}
            {premiumOnly && (
              <span className="afilter" role="listitem">
                <span aria-hidden="true">⭐</span> Premium
              </span>
            )}
          </div>
        )}

        {/* ── Initial state body ── */}
        <div className="body">
          <div className="initial">
            <i className="ti ti-search" aria-hidden="true" />
            <h1>Kërko çdo gjë në Shqipëri</h1>
            <p>
              Elektronikë, Automjete, Prona,<br />
              Kafshë, Shërbime dhe shumë të tjera
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

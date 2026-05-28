'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Module 3: Meilisearch — fast full-text search with Supabase fallback
// Defaults to built-in Next.js API route (Postgres FTS) if no cloud instance configured
const MS_URL = process.env.NEXT_PUBLIC_MEILISEARCH_URL || '/api/meili'
const MS_KEY = process.env.NEXT_PUBLIC_MEILISEARCH_KEY || 'alpazar_search'

async function meilisearch(query: string, catId: string) {
  if (!MS_URL || !MS_KEY || !query.trim()) return null
  try {
    const filter = catId ? [`category_id = "${catId}"`, 'is_active = true'] : ['is_active = true']
    const res = await fetch(`${MS_URL}/indexes/listings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MS_KEY}` },
      body: JSON.stringify({ q: query, limit: 40, filter, sort: ['is_premium:desc', 'created_at:desc'] }),
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.hits ?? null
  } catch {
    return null
  }
}

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [catFilter, setCatFilter] = useState('')
  const [searchEngine, setSearchEngine] = useState<'meilisearch'|'supabase'>('supabase')

  useEffect(() => {
    supabase.from('categories').select('id,name,slug,icon').eq('is_active', true).order('sort_order').then(({ data }) => {
      if (data) setCategories(data)
    })
    // auto search if URL has query
    const params = new URLSearchParams(window.location.search)
    const qp = params.get('q')
    if (qp) { setQ(qp); doSearch(qp, '') }
  }, [])

  async function doSearch(query = q, cat = catFilter) {
    setLoading(true); setSearched(true)

    // Module 3: Try Meilisearch first, fallback to Supabase
    if (query.trim() && MS_URL && MS_KEY) {
      const msResults = await meilisearch(query, cat)
      if (msResults !== null) {
        setResults(msResults)
        setSearchEngine('meilisearch')
        setLoading(false)
        return
      }
    }

    // Supabase fallback
    setSearchEngine('supabase')
    let qb = supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,created_at')
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(40)

    if (query.trim()) qb = qb.ilike('title', `%${query.trim()}%`)
    if (cat) qb = qb.eq('category_id', cat)

    const { data } = await qb
    setResults(data || [])
    setLoading(false)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    doSearch()
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString()} €` : `${price.toLocaleString()} L`

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:80px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .search-wrap{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 11px;gap:7px;border:0.5px solid #e0b030;}
        .search-wrap i{font-size:14px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .search-btn{background:#111;color:#F5C842;border:none;border-radius:9px;padding:9px 12px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit;}
        .cats{display:flex;gap:6px;overflow-x:auto;padding:10px 14px;background:#fff;border-bottom:1px solid #f0f0f0;}
        .cats::-webkit-scrollbar{display:none;}
        .cb{background:#f5f5f5;border:none;border-radius:20px;padding:5px 12px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;white-space:nowrap;}
        .cb.on{background:#F5C842;color:#111;}
        .body{padding:12px 10px;}
        .results-info{font-size:11px;color:#888;margin-bottom:10px;}
        .results-info strong{color:#111;}
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
        </div>

        <div className="cats">
          <button className={`cb ${!catFilter ? 'on' : ''}`} onClick={() => { setCatFilter(''); if (q) doSearch(q, '') }}>
            Të gjitha
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`cb ${catFilter === c.id ? 'on' : ''}`}
              onClick={() => { setCatFilter(c.id); if (q) doSearch(q, c.id) }}
            >
              {c.name}
            </button>
          ))}
        </div>

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
              <p>Provo terma të tjerë ose<br />shfleto kategoritë</p>
            </div>
          ) : (
            <>
              <div className="results-info">
                Gjetur <strong>{results.length}</strong> shpallje {q && `për "${q}"`}
                {searchEngine === 'meilisearch' && (
                  <span style={{ marginLeft: 8, background: '#EAF3DE', color: '#3B6D11', fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>⚡ Kërkim i shpejtë</span>
                )}
              </div>
              <div className="listings-grid">
                {results.map(l => (
                  <div key={l.id} className="listing-card" onClick={() => window.location.href = `/listing/${l.id}`}>
                    <div className="card-img">
                      {l.images?.[0] ? <img src={l.images[0]} alt={l.title} /> : <i className="ti ti-photo" style={{ fontSize: 32, color: '#ccc' }} />}
                      {l.condition === 'i_ri' && <span className="badge-new">I ri</span>}
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
    </>
  )
}

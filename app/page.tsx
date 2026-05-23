'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Listing } from '../lib/types'

function AlpazarIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill="#E63312"/>
      <g fill="#111">
        <ellipse cx="20" cy="22" rx="4" ry="5.5"/>
        <circle cx="15.5" cy="13" r="3.2"/>
        <circle cx="24.5" cy="13" r="3.2"/>
        <polygon points="13,15.5 11,16.5 13,17.5"/>
        <polygon points="27,15.5 29,16.5 27,17.5"/>
        <polygon points="20,20 6,18 8,26 20,25"/>
        <polygon points="20,20 34,18 32,26 20,25"/>
        <polygon points="17,27 23,27 24,33 20,32 16,33"/>
      </g>
      <rect x="24" y="26" width="12" height="10" rx="3" fill="#F5C842"/>
    </svg>
  )
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [listingCount, setListingCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetchAll()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  useEffect(() => {
    fetchListings()
  }, [activeCategory, activeFilter])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchListings(), fetchCounts()])
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (data) setCategories(data)
  }

  async function fetchListings(catSlug = activeCategory, filter = activeFilter) {
    setLoading(true)
    let query = supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,category_id,created_at')
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)

    if (catSlug !== 'all') {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', catSlug).single()
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (filter === 'new') query = query.eq('condition', 'i_ri')
    if (filter === 'used') query = query.eq('condition', 'i_perdorur')
    if (filter === 'premium') query = query.eq('is_premium', true)

    const { data } = await query
    if (data) setListings(data as Listing[])
    setLoading(false)
  }

  async function fetchCounts() {
    const [{ count: lc }, { count: uc }] = await Promise.all([
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ])
    if (lc) setListingCount(lc)
    if (uc) setUserCount(uc)
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return fetchListings()
    setLoading(true)
    const { data } = await supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,category_id,created_at')
      .ilike('title', `%${searchQuery.trim()}%`)
      .eq('is_active', true)
      .limit(20)
    if (data) setListings(data as Listing[])
    setLoading(false)
  }

  function changeCat(slug: string) {
    setActiveCategory(slug)
    fetchListings(slug, activeFilter)
  }

  function changeFilter(f: string) {
    setActiveFilter(f)
    fetchListings(activeCategory, f)
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` :
    `${price.toLocaleString('sq-AL')} L`

  const go = (path: string) => { window.location.href = path }

  const filters = [
    { id: 'all', label: 'Të gjitha' },
    { id: 'new', label: 'I ri' },
    { id: 'used', label: 'I përdorur' },
    { id: 'premium', label: 'Premium ⭐' },
  ]

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;padding-bottom:80px;}
        .header{background:#F5C842;position:sticky;top:0;z-index:50;}
        .topbar{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;}
        .logo{display:flex;align-items:center;gap:8px;cursor:pointer;}
        .brand{font-size:20px;font-weight:700;color:#111;letter-spacing:2px;}
        .nav{display:flex;gap:5px;align-items:center;}
        .icon-btn{width:32px;height:32px;background:rgba(0,0,0,.10);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;}
        .icon-btn i{font-size:16px;color:#111;}
        .login-btn{background:#111;color:#F5C842;border:none;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .searchbar{padding:0 12px 10px;display:flex;gap:8px;}
        .search-wrap{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 12px;gap:8px;border:0.5px solid #e0b030;}
        .search-wrap i{font-size:15px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .search-btn{background:#111;color:#F5C842;border:none;border-radius:9px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:0 12px 12px;}
        .cat-item{background:#fff;border-radius:8px;padding:7px 3px 5px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;border:none;font-family:inherit;transition:all .15s;}
        .cat-item.active{background:#111;}
        .cat-item i{font-size:16px;color:#777;}
        .cat-item.active i{color:#F5C842;}
        .cat-item span{font-size:7px;color:#555;text-align:center;font-weight:500;}
        .cat-item.active span{color:#F5C842;font-weight:700;}
        .body{padding:0 10px;}
        .no-ads{background:#EAF3DE;border:0.5px solid #97C459;border-radius:6px;padding:5px 12px;display:flex;align-items:center;gap:6px;margin-bottom:8px;}
        .no-ads i{font-size:13px;color:#3B6D11;}
        .no-ads span{font-size:9px;color:#3B6D11;font-weight:700;}
        .hero{background:#111;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;position:relative;overflow:hidden;}
        .hero-stripe{position:absolute;top:0;bottom:0;width:4px;background:#E63312;}
        .hero h2{color:#F5C842;font-size:13px;font-weight:700;margin-bottom:4px;}
        .hero p{color:#888;font-size:10px;line-height:1.5;}
        .hero-stats{display:flex;gap:14px;}
        .stat{text-align:center;}
        .stat-n{color:#F5C842;font-size:16px;font-weight:700;}
        .stat-l{color:#666;font-size:8px;margin-top:1px;}
        .ai-bar{background:#111;border-radius:11px;padding:10px 14px;display:flex;align-items:center;gap:9px;border:1px solid #E63312;margin-bottom:8px;}
        .ai-icon{width:30px;height:30px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ai-icon i{font-size:15px;color:#111;}
        .ai-text strong{color:#F5C842;font-size:11px;font-weight:700;display:block;}
        .ai-text span{color:#888;font-size:9px;}
        .ai-btn{background:#E63312;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;margin-left:auto;}
        .trust-row{display:flex;gap:5px;margin-bottom:8px;}
        .trust-card{flex:1;border-radius:7px;padding:6px 7px;display:flex;align-items:center;gap:4px;}
        .tc-green{background:#EAF3DE;border:0.5px solid #97C459;}
        .tc-blue{background:#EEF4FF;border:0.5px solid #85B7EB;}
        .tc-red{background:#FFF0EE;border:0.5px solid #F09595;}
        .trust-card i{font-size:13px;}
        .trust-card span{font-size:8px;font-weight:600;}
        .tc-green i,.tc-green span{color:#3B6D11;}
        .tc-blue i,.tc-blue span{color:#185FA5;}
        .tc-red i,.tc-red span{color:#A32D2D;}
        .filter-row{display:flex;gap:5px;margin-bottom:8px;overflow-x:auto;}
        .filter-row::-webkit-scrollbar{display:none;}
        .filter-btn{background:#fff;border:0.5px solid #e0b030;border-radius:20px;padding:5px 12px;font-size:10px;color:#555;white-space:nowrap;flex-shrink:0;cursor:pointer;font-family:inherit;transition:all .12s;}
        .filter-btn.active{background:#F5C842;border-color:#F5C842;color:#111;font-weight:700;}
        .section-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;}
        .section-hdr span{font-size:13px;font-weight:700;color:#111;}
        .section-hdr a{color:#E63312;font-size:11px;text-decoration:none;cursor:pointer;}
        .listings-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px;}
        .listing-card{background:#fff;border:0.5px solid #eee;border-radius:11px;overflow:hidden;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.04);transition:transform .12s;}
        .listing-card:active{transform:scale(.98);}
        .card-img{height:95px;display:flex;align-items:center;justify-content:center;font-size:32px;position:relative;background:#f9f5e0;}
        .card-img img{width:100%;height:100%;object-fit:cover;}
        .badge-new{position:absolute;top:5px;left:5px;background:#E63312;color:#fff;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .badge-used{position:absolute;top:5px;left:5px;background:#111;color:#F5C842;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .badge-premium{position:absolute;top:5px;right:5px;background:#F5C842;color:#111;font-size:8.5px;padding:2px 6px;border-radius:4px;font-weight:700;}
        .card-body{padding:9px 10px;}
        .card-title{font-size:12px;font-weight:700;color:#222;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .card-price{font-size:14px;font-weight:700;color:#E63312;margin-bottom:5px;}
        .card-meta{display:flex;align-items:center;justify-content:space-between;}
        .card-loc{font-size:10px;color:#999;display:flex;align-items:center;gap:3px;}
        .card-like{width:22px;height:22px;border:0.5px solid #eee;border-radius:50%;display:flex;align-items:center;justify-content:center;background:none;cursor:pointer;}
        .card-like i{font-size:12px;color:#ddd;}
        .empty-state{grid-column:1/-1;text-align:center;padding:32px 16px;background:#f9f5e0;border:0.5px solid #eee;border-radius:11px;}
        .empty-state i{font-size:38px;color:#e0b030;display:block;margin-bottom:8px;}
        .empty-state h3{font-size:13px;font-weight:700;color:#555;margin-bottom:5px;}
        .empty-state p{font-size:11px;color:#aaa;line-height:1.6;margin-bottom:12px;}
        .empty-cta{background:#E63312;color:#fff;border:none;border-radius:9px;padding:9px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .premium-cta{margin-bottom:10px;background:#FFFBEA;border:1.5px solid #F5C842;border-radius:11px;padding:11px 14px;display:flex;align-items:center;gap:9px;}
        .prem-icon{width:28px;height:28px;background:#F5C842;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .prem-icon i{font-size:14px;color:#111;}
        .prem-text strong{font-size:11px;font-weight:700;color:#111;display:block;}
        .prem-text span{font-size:9px;color:#888;}
        .prem-btn{background:#111;color:#F5C842;border:none;border-radius:7px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;margin-left:auto;}
        .bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#111;padding:9px 10px 14px;display:flex;justify-content:space-around;align-items:center;z-index:100;}
        .nav-item{display:flex;flex-direction:column;align-items:center;gap:2px;color:#555;border:none;background:none;font-family:inherit;cursor:pointer;}
        .nav-item.active{color:#F5C842;}
        .nav-item i{font-size:20px;}
        .nav-item span{font-size:9px;color:inherit;}
        .nav-add{width:44px;height:44px;background:#E63312;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #FFFBEA;margin-top:-12px;cursor:pointer;}
        .nav-add i{font-size:20px;color:#fff;}
        .loading{text-align:center;padding:30px;color:#888;font-size:13px;}
        .spinner{display:inline-block;width:28px;height:28px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;margin-bottom:8px;display:block;margin:0 auto 8px;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="wrap">
        <div className="header">
          <div className="topbar">
            <div className="logo" onClick={() => go('/')}>
              <AlpazarIcon />
              <span className="brand">ALPAZAR</span>
            </div>
            <div className="nav">
              <button className="icon-btn" onClick={() => go(user ? '/messages' : '/auth/login')}>
                <i className="ti ti-bell" />
              </button>
              {user ? (
                <button className="login-btn" onClick={() => go('/profile')}>Profili</button>
              ) : (
                <button className="login-btn" onClick={() => go('/auth/login')}>Hyr / Regjistrohu</button>
              )}
            </div>
          </div>

          <form className="searchbar" onSubmit={handleSearch}>
            <div className="search-wrap">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Kërko çdo gjë në Shqipëri..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button type="submit" className="search-btn">Kërko</button>
          </form>

          <div className="cat-grid">
            <button className={`cat-item ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => changeCat('all')}>
              <i className="ti ti-layout-grid" />
              <span>Të gjitha</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-item ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => changeCat(cat.slug)}
              >
                <i className={`ti ti-${cat.icon}`} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="body">
          <div className="no-ads">
            <i className="ti ti-ad-off" />
            <span>Pa reklama — për të gjithë gjithmonë</span>
          </div>

          <div className="hero">
            <div className="hero-stripe" style={{ left: 0 }} />
            <div className="hero-stripe" style={{ right: 0 }} />
            <div>
              <h2>🦅 Shit · Bli · Bëj Pazrin Tënd</h2>
              <p>Platforma #1 shqiptare<br />e tregtisë online</p>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="stat-n">{listingCount.toLocaleString('sq-AL')}</div>
                <div className="stat-l">Shpallje</div>
              </div>
              <div className="stat">
                <div className="stat-n">{userCount.toLocaleString('sq-AL')}</div>
                <div className="stat-l">Përdorues</div>
              </div>
            </div>
          </div>

          <div className="ai-bar">
            <div className="ai-icon"><i className="ti ti-robot" /></div>
            <div className="ai-text">
              <strong>AI Asistent · 24/7</strong>
              <span>Gjej produktin ideal — pyetmë çdo gjë</span>
            </div>
            <button className="ai-btn" onClick={() => go('/search?ai=1')}>Pyet ↗</button>
          </div>

          <div className="trust-row">
            <div className="trust-card tc-green">
              <i className="ti ti-shield-check" /><span>Shitës të verifikuar</span>
            </div>
            <div className="trust-card tc-blue">
              <i className="ti ti-star" /><span>Vlerësime ⭐</span>
            </div>
            <div className="trust-card tc-red">
              <i className="ti ti-message-circle" /><span>Chat live</span>
            </div>
          </div>

          <div className="filter-row">
            {filters.map(f => (
              <button
                key={f.id}
                className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => changeFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="section-hdr">
            <span>🔥 Shpallje të fundit</span>
            <a onClick={() => changeCat('all')}>Të gjitha →</a>
          </div>

          {loading ? (
            <div className="loading">
              <span className="spinner" />
              <div>Duke ngarkuar shpalljet...</div>
            </div>
          ) : (
            <div className="listings-grid">
              {listings.length === 0 ? (
                <div className="empty-state">
                  <i className="ti ti-mood-empty" />
                  <h3>Nuk ka shpallje aktualisht</h3>
                  <p>Bëhu i pari që shton!<br />Regjistrimi është falas.</p>
                  <button className="empty-cta" onClick={() => go(user ? '/listing/new' : '/auth/login')}>
                    + Shto shpallje falas
                  </button>
                </div>
              ) : (
                listings.map(listing => (
                  <div key={listing.id} className="listing-card" onClick={() => go(`/listing/${listing.id}`)}>
                    <div className="card-img">
                      {listing.images?.[0]
                        ? <img src={listing.images[0]} alt={listing.title} />
                        : <i className="ti ti-photo" style={{ fontSize: 32, color: '#ccc' }} />
                      }
                      {listing.condition === 'i_ri' && <span className="badge-new">I ri</span>}
                      {listing.condition === 'i_perdorur' && <span className="badge-used">I përdorur</span>}
                      {listing.is_premium && <span className="badge-premium">⭐</span>}
                    </div>
                    <div className="card-body">
                      <div className="card-title">{listing.title}</div>
                      <div className="card-price">{fmt(listing.price, listing.currency)}</div>
                      <div className="card-meta">
                        <span className="card-loc">
                          <i className="ti ti-map-pin" style={{ fontSize: 11 }} />
                          {listing.city || 'Shqipëri'}
                        </span>
                        <button className="card-like" onClick={e => { e.stopPropagation(); go(user ? '#' : '/auth/login') }}>
                          <i className="ti ti-heart" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="premium-cta">
            <div className="prem-icon"><i className="ti ti-crown" /></div>
            <div className="prem-text">
              <strong>👑 Bëhu Anëtar Premium</strong>
              <span>Dyqan · Badge · Shpallje ∞ · 9.99€/muaj</span>
            </div>
            <button className="prem-btn" onClick={() => go('/premium')}>Shiko →</button>
          </div>
        </div>

        <nav className="bottom-nav">
          <button className="nav-item active">
            <i className="ti ti-home" /><span>Kreu</span>
          </button>
          <button className="nav-item" onClick={() => go('/search')}>
            <i className="ti ti-search" /><span>Kërko</span>
          </button>
          <div className="nav-add" onClick={() => go(user ? '/listing/new' : '/auth/login')}>
            <i className="ti ti-plus" />
          </div>
          <button className="nav-item" onClick={() => go(user ? '/messages' : '/auth/login')}>
            <i className="ti ti-message" /><span>Mesazhe</span>
          </button>
          <button className="nav-item" onClick={() => go(user ? '/profile' : '/auth/login')}>
            <i className="ti ti-user" /><span>Profili</span>
          </button>
        </nav>
      </div>
    </>
  )
}

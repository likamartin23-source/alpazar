'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const SHOP_CATEGORIES = [
  { id: 'all', label: 'Të gjitha', icon: 'layout-grid' },
  { id: 'elektronike', label: 'Elektronikë', icon: 'device-laptop' },
  { id: 'makina', label: 'Makina', icon: 'car' },
  { id: 'shtepi', label: 'Shtëpi', icon: 'home-2' },
  { id: 'veshje', label: 'Veshje', icon: 'shirt' },
  { id: 'sport', label: 'Sport', icon: 'ball-football' },
  { id: 'sherbime', label: 'Shërbime', icon: 'tool' },
  { id: 'femije', label: 'Fëmijë', icon: 'baby-carriage' },
  { id: 'bukuri', label: 'Bukuri', icon: 'sparkles' },
]

const CATEGORY_COLORS: Record<string, string> = {
  elektronike: '#3B82F6', makina: '#EF4444', shtepi: '#10B981',
  veshje: '#8B5CF6', sport: '#F59E0B', sherbime: '#06B6D4',
  femije: '#EC4899', bukuri: '#F97316', all: '#E63312',
}

function ShopCard({ shop, onClick }: { shop: any; onClick: () => void }) {
  const color = CATEGORY_COLORS[shop.shop_category] || '#E63312'
  const initials = (shop.shop_name || shop.full_name || '?').slice(0, 2).toUpperCase()

  return (
    <div className="shop-card" onClick={onClick}>
      <div className="shop-banner" style={{ background: shop.shop_banner_url ? `url(${shop.shop_banner_url}) center/cover` : `linear-gradient(135deg, ${color}22, ${color}44)` }}>
        <div className="shop-avatar" style={{ borderColor: color }}>
          {shop.avatar_url
            ? <img src={shop.avatar_url} alt={shop.shop_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <span style={{ fontSize: 18, fontWeight: 700, color }}>{initials}</span>
          }
        </div>
        <div className="premium-badge">⭐ Premium</div>
      </div>
      <div className="shop-body">
        <div className="shop-name">{shop.shop_name || shop.full_name}</div>
        <div className="shop-desc">{shop.shop_description || shop.bio || 'Dyqan i verifikuar në ALPAZAR'}</div>
        <div className="shop-meta">
          <span className="shop-city"><i className="ti ti-map-pin" /> {shop.city || 'Shqipëri'}</span>
          <span className="shop-count" style={{ background: color + '22', color }}>{shop.listing_count || 0} shpallje</span>
        </div>
        {shop.shop_category && shop.shop_category !== 'all' && (
          <div className="shop-tag" style={{ background: color + '15', color }}>
            <i className={`ti ti-${SHOP_CATEGORIES.find(c => c.id === shop.shop_category)?.icon || 'tag'}`} />
            {SHOP_CATEGORIES.find(c => c.id === shop.shop_category)?.label}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DyqanePage() {
  const [shops, setShops] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    fetchShops()
  }, [])

  useEffect(() => {
    filterShops()
  }, [activeCategory, search, shops])

  async function fetchShops() {
    setLoading(true)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url,city,bio,is_premium,shop_name,shop_description,shop_category,shop_banner_url,created_at')
      .eq('is_premium', true)
      .order('created_at', { ascending: false })

    if (!profiles?.length) { setShops([]); setLoading(false); return }

    const ids = profiles.map(p => p.id)
    const { data: listingsData } = await supabase
      .from('listings')
      .select('user_id')
      .in('user_id', ids)
      .eq('is_active', true)

    const countMap: Record<string, number> = {}
    for (const l of listingsData || []) {
      countMap[l.user_id] = (countMap[l.user_id] || 0) + 1
    }

    setShops(profiles.map(p => ({ ...p, listing_count: countMap[p.id] || 0 })))
    setLoading(false)
  }

  function filterShops() {
    let result = [...shops]
    if (activeCategory !== 'all') {
      result = result.filter(s => s.shop_category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        (s.shop_name || s.full_name || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q) ||
        (s.shop_description || s.bio || '').toLowerCase().includes(q)
      )
    }
    setFiltered(result)
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:30px;}
        .header{background:#F5C842;position:sticky;top:0;z-index:50;}
        .topbar{padding:10px 14px;display:flex;align-items:center;gap:10px;}
        .back-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back-btn i{font-size:18px;color:#111;}
        .page-title{font-size:16px;font-weight:700;color:#111;flex:1;}
        .open-shop-btn{background:#111;color:#F5C842;border:none;border-radius:8px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;}
        .searchbar{padding:0 12px 10px;display:flex;gap:8px;}
        .search-wrap{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 12px;gap:8px;border:0.5px solid #e0b030;}
        .search-wrap i{font-size:15px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .cat-scroll{display:flex;gap:6px;padding:0 12px 12px;overflow-x:auto;}
        .cat-scroll::-webkit-scrollbar{display:none;}
        .cat-chip{display:flex;align-items:center;gap:5px;padding:6px 12px;background:#fff;border:0.5px solid #ddd;border-radius:20px;cursor:pointer;white-space:nowrap;font-family:inherit;font-size:11px;color:#555;transition:all .15s;}
        .cat-chip.active{background:#111;border-color:#111;color:#F5C842;font-weight:700;}
        .cat-chip i{font-size:13px;}
        .body{padding:10px 10px;}
        .hero-banner{background:linear-gradient(135deg,#111 60%,#1a1a1a);border-radius:14px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;position:relative;overflow:hidden;}
        .hero-stripe{position:absolute;top:0;right:0;bottom:0;width:80px;background:linear-gradient(135deg,transparent,#E6331218);}
        .hero-icon{width:48px;height:48px;background:#F5C842;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .hero-icon i{font-size:24px;color:#111;}
        .hero-text h2{color:#F5C842;font-size:14px;font-weight:700;margin-bottom:4px;}
        .hero-text p{color:#888;font-size:10px;line-height:1.5;}
        .hero-stats{display:flex;gap:12px;margin-top:8px;}
        .hstat{text-align:center;}
        .hstat-n{color:#F5C842;font-size:15px;font-weight:700;}
        .hstat-l{color:#666;font-size:8px;}
        .section-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
        .section-hdr h3{font-size:13px;font-weight:700;color:#111;}
        .section-hdr span{font-size:11px;color:#E63312;}
        .shops-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .shop-card{background:#fff;border-radius:14px;overflow:hidden;cursor:pointer;border:0.5px solid #eee;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:transform .15s,box-shadow .15s;}
        .shop-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,.08);}
        .shop-card:active{transform:scale(.97);}
        .shop-banner{height:60px;position:relative;display:flex;align-items:flex-end;padding:6px;}
        .shop-avatar{width:44px;height:44px;border-radius:50%;background:#fff;border:2.5px solid;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.15);}
        .premium-badge{position:absolute;top:6px;right:6px;background:#F5C842;color:#111;font-size:8px;padding:2px 6px;border-radius:10px;font-weight:700;}
        .shop-body{padding:8px 10px 10px;}
        .shop-name{font-size:12px;font-weight:700;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .shop-desc{font-size:9.5px;color:#888;margin-bottom:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5;}
        .shop-meta{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;}
        .shop-city{font-size:9px;color:#aaa;display:flex;align-items:center;gap:2px;}
        .shop-city i{font-size:10px;}
        .shop-count{font-size:9px;padding:2px 7px;border-radius:10px;font-weight:700;}
        .shop-tag{display:inline-flex;align-items:center;gap:4px;font-size:9px;padding:3px 8px;border-radius:10px;font-weight:600;}
        .shop-tag i{font-size:10px;}
        .empty{text-align:center;padding:40px 20px;background:#f9f5e0;border-radius:14px;border:0.5px solid #eee;}
        .empty i{font-size:40px;color:#F5C842;display:block;margin-bottom:10px;}
        .empty h3{font-size:14px;font-weight:700;color:#555;margin-bottom:6px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.6;margin-bottom:14px;}
        .empty-btn{background:#E63312;color:#fff;border:none;border-radius:9px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        .open-cta{background:linear-gradient(135deg,#F5C842,#e0b030);border-radius:12px;padding:14px;margin-bottom:14px;display:flex;align-items:center;gap:12px;}
        .cta-icon{width:40px;height:40px;background:#111;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .cta-icon i{font-size:20px;color:#F5C842;}
        .cta-text strong{font-size:12px;font-weight:700;color:#111;display:block;margin-bottom:3px;}
        .cta-text span{font-size:10px;color:#555;}
        .cta-btn{background:#111;color:#F5C842;border:none;border-radius:8px;padding:8px 14px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;margin-left:auto;}
        .loading{text-align:center;padding:40px;}
        .spinner{display:block;width:28px;height:28px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="wrap">
        <div className="header">
          <div className="topbar">
            <button className="back-btn" onClick={() => window.location.href = '/'}>
              <i className="ti ti-arrow-left" />
            </button>
            <span className="page-title">🏪 Dyqanet Online</span>
            <button className="open-shop-btn" onClick={() => window.location.href = user ? '/profile?tab=shop' : '/auth/login'}>
              + Hap Dyqanin
            </button>
          </div>
          <div className="searchbar">
            <div className="search-wrap">
              <i className="ti ti-search" />
              <input
                type="text"
                placeholder="Kërko dyqan, qytet..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="cat-scroll">
            {SHOP_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`cat-chip ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <i className={`ti ti-${cat.icon}`} />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="body">
          <div className="hero-banner">
            <div className="hero-stripe" />
            <div className="hero-icon"><i className="ti ti-building-store" /></div>
            <div className="hero-text">
              <h2>Dyqane Premium Shqipëri</h2>
              <p>Shitës të verifikuar · Shpallje të garantuara<br />Kontakt direkt · Vlerësime reale</p>
              <div className="hero-stats">
                <div className="hstat">
                  <div className="hstat-n">{shops.length}</div>
                  <div className="hstat-l">Dyqane</div>
                </div>
                <div className="hstat">
                  <div className="hstat-n">{shops.reduce((a, s) => a + (s.listing_count || 0), 0)}</div>
                  <div className="hstat-l">Produkte</div>
                </div>
              </div>
            </div>
          </div>

          {!user && (
            <div className="open-cta">
              <div className="cta-icon"><i className="ti ti-crown" /></div>
              <div className="cta-text">
                <strong>Hap Dyqanin Tënd!</strong>
                <span>Premium 9.99€/muaj · Shpallje ∞ · Badge ⭐</span>
              </div>
              <button className="cta-btn" onClick={() => window.location.href = '/premium'}>Shiko →</button>
            </div>
          )}

          <div className="section-hdr">
            <h3>🏪 {activeCategory === 'all' ? 'Të gjitha dyqanet' : SHOP_CATEGORIES.find(c => c.id === activeCategory)?.label}</h3>
            <span>{filtered.length} dyqane</span>
          </div>

          {loading ? (
            <div className="loading">
              <span className="spinner" />
              <div style={{ color: '#888', fontSize: 13 }}>Duke ngarkuar dyqanet...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <i className="ti ti-building-store" />
              <h3>Nuk ka dyqane</h3>
              <p>Bëhu i pari që hap dyqanin tënd<br />dhe shi produktet tua online!</p>
              <button className="empty-btn" onClick={() => window.location.href = '/premium'}>
                👑 Hap Dyqanin — 9.99€/muaj
              </button>
            </div>
          ) : (
            <div className="shops-grid">
              {filtered.map(shop => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  onClick={() => window.location.href = `/dyqane/${shop.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

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
        <rect x="17" y="27" width="2.5" height="4" rx="1"/>
        <rect x="20.5" y="27" width="2.5" height="4" rx="1"/>
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

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchListings() }, [activeCategory, activeFilter])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchListings(), fetchCounts()])
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    if (data) setCategories(data)
  }

  async function fetchListings() {
    let query = supabase.from('listings')
      .select('id,title,price,currency,condition,city,is_premium,images,category_id')
      .eq('is_active', true)
      .order('is_premium', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6)
    if (activeCategory !== 'all') {
      const cat = categories.find(c => c.slug === activeCategory)
      if (cat) query = query.eq('category_id', cat.id)
    }
    if (activeFilter === 'new') query = query.eq('condition', 'i_ri')
    if (activeFilter === 'used') query = query.eq('condition', 'i_perdorur')
    if (activeFilter === 'premium') query = query.eq('is_premium', true)
    const { data } = await query
    if (data) setListings(data)
  }

  async function fetchCounts() {
    const { count: lc } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true)
    const { count: uc } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    if (lc) setListingCount(lc)
    if (uc) setUserCount(uc)
  }

  const fmt = (p: number, c: string) => !p ? 'Cmim me marreveshje' : c === 'EUR' ? `${p.toLocaleString()} EUR` : `${p.toLocaleString()} L`
  const filters = [{ id:'all',label:'Te gjitha' },{ id:'new',label:'I ri' },{ id:'used',label:'I perdorur' },{ id:'premium',label:'Premium' }]

  const CSS = `*{box-sizing:border-box;margin:0;padding:0;} .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;padding-bottom:80px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;} .header{background:#F5C842;} .topbar{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;} .logo{display:flex;align-items:center;gap:8px;} .brand{font-size:20px;font-weight:700;color:#111;letter-spacing:2px;} .nav{display:flex;gap:5px;align-items:center;} .icon-btn{width:32px;height:32px;background:rgba(0,0,0,.10);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;} .icon-btn i{font-size:16px;color:#111;} .login-btn{background:#111;color:#F5C842;border:none;border-radius:7px;padding:6px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;} .searchbar{padding:0 12px 10px;display:flex;gap:8px;} .search-wrap{flex:1;background:#fff;border-radius:9px;display:flex;align-items:center;padding:0 12px;gap:8px;border:0.5px solid #ddd;} .search-wrap i{font-size:15px;color:#bbb;} .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;} .search-wrap input::placeholder{color:#bbb;} .search-btn{background:#111;color:#F5C842;border:none;border-radius:9px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;} .cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:0 12px 12px;} .cat-item{background:#fff;border:1px solid #e0b030;border-radius:8px;padding:7px 3px 5px;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;border:none;font-family:inherit;} .cat-item.active{background:#F5C842;} .cat-item i{font-size:16px;color:#777;} .cat-item.active i{color:#111;} .cat-item span{font-size:7px;color:#555;text-align:center;font-weight:500;} .cat-item.active span{color:#111;font-weight:700;} .no-ads{background:#EAF3DE;border:0.5px solid #97C459;border-radius:6px;padding:5px 12px;display:flex;align-items:center;gap:6px;margin:0 10px 8px;} .no-ads i{font-size:13px;color:#3B6D11;} .no-ads span{font-size:9px;color:#3B6D11;font-weight:700;} .hero{background:#111;margin:0 10px 8px;border-radius:12px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;position:relative;overflow:hidden;} .hero-s{position:absolute;top:0;bottom:0;width:4px;background:#E63312;} .hero h2{color:#F5C842;font-size:13px;font-weight:700;margin-bottom:4px;} .hero p{color:#888;font-size:10px;line-height:1.5;} .hero-stats{display:flex;gap:14px;} .stat{text-align:center;} .stat-n{color:#F5C842;font-size:16px;font-weight:700;} .stat-l{color:#666;font-size:8px;} .ai-bar{margin:0 10px 8px;background:#111;border-radius:11px;padding:10px 14px;display:flex;align-items:center;gap:9px;border:1px solid #E63312;} .ai-icon{width:30px;height:30px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;} .ai-icon i{font-size:15px;color:#111;} .ai-text strong{color:#F5C842;font-size:11px;font-weight:700;display:block;} .ai-text span{color:#888;font-size:9px;} .ai-btn{background:#E63312;color:#fff;border:none;border-radius:7px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;} .sw{padding:0 10px;} .ttl{display:flex;justify-content:space-between;align-items:center;margin:8px 0 6px;} .ttl span{font-size:13px;font-weight:700;color:#111;} .ttl a{color:#E63312;font-size:11px;text-decoration:none;} .trust-row{display:flex;gap:5px;margin-bottom:8px;} .tc{flex:1;border-radius:7px;padding:6px;display:flex;align-items:center;gap:4px;} .tc-g{background:#EAF3DE;border:0.5px solid #97C459;} .tc-b{background:#EEF4FF;border:0.5px solid #85B7EB;} .tc-r{background:#FFF0EE;border:0.5px solid #F09595;} .tc i{font-size:13px;} .tc span{font-size:8px;font-weight:600;} .tc-g i,.tc-g span{color:#3B6D11;} .tc-b i,.tc-b span{color:#185FA5;} .tc-r i,.tc-r span{color:#A32D2D;} .filter-row{display:flex;gap:5px;margin-bottom:8px;overflow-x:auto;} .filter-row::-webkit-scrollbar{display:none;} .fb{background:#fff;border:0.5px solid #e0b030;border-radius:20px;padding:5px 12px;font-size:10px;color:#555;white-space:nowrap;cursor:pointer;font-family:inherit;} .fb.active{background:#F5C842;border-color:#F5C842;color:#111;font-weight:700;} .grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:10px;} .lcard{background:#fff;border:0.5px solid #eee;border-radius:11px;overflow:hidden;cursor:pointer;} .card-img{height:90px;display:flex;align-items:center;justify-content:center;font-size:32px;position:relative;background:#f9f5e0;} .card-img img{width:100%;height:100%;object-fit:cover;} .b-new{position:absolute;top:6px;left:6px;background:#E63312;color:#fff;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700;} .b-used{position:absolute;top:6px;left:6px;background:#111;color:#F5C842;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700;} .b-prem{position:absolute;top:6px;right:6px;background:#F5C842;color:#111;font-size:9px;padding:2px 6px;border-radius:4px;font-weight:700;} .card-body{padding:9px 10px;} .card-t{font-size:12px;font-weight:700;color:#222;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;} .card-p{font-size:14px;font-weight:700;color:#E63312;margin-bottom:5px;} .card-m{display:flex;align-items:center;justify-content:space-between;} .card-l{font-size:10px;color:#999;display:flex;align-items:center;gap:3px;} .card-fav{width:22px;height:22px;border:0.5px solid #eee;border-radius:50%;display:flex;align-items:center;justify-content:center;background:none;cursor:pointer;} .card-fav i{font-size:12px;color:#ddd;} .empty{grid-column:1/-1;text-align:center;padding:30px;background:#f9f5e0;border:0.5px solid #eee;border-radius:11px;} .empty i{font-size:36px;color:#e0b030;display:block;margin-bottom:8px;} .empty p{font-size:12px;color:#aaa;line-height:1.6;margin-bottom:10px;} .empty-btn{background:#F5C842;color:#111;border:none;border-radius:8px;padding:8px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;} .prem-cta{margin-bottom:10px;background:#FFFBEA;border:1.5px solid #F5C842;border-radius:11px;padding:10px 14px;display:flex;align-items:center;gap:8px;} .prem-i{width:28px;height:28px;background:#F5C842;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0;} .prem-i i{font-size:14px;color:#111;} .prem-t strong{font-size:12px;font-weight:700;color:#111;display:block;} .prem-t span{font-size:9px;color:#888;} .prem-btn{background:#111;color:#F5C842;border:none;border-radius:7px;padding:7px 12px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;} .bnav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#111;padding:9px 10px 14px;display:flex;justify-content:space-around;align-items:center;border-top:1px solid #222;z-index:100;} .bi{display:flex;flex-direction:column;align-items:center;gap:2px;color:#555;border:none;background:none;font-family:inherit;cursor:pointer;} .bi.on{color:#F5C842;} .bi i{font-size:20px;} .bi span{font-size:9px;color:inherit;} .badd{width:44px;height:44px;background:#E63312;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #FFFBEA;margin-top:-12px;cursor:pointer;} .badd i{font-size:20px;color:#fff;} .spin{display:block;width:28px;height:28px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 8px;} @keyframes spin{to{transform:rotate(360deg);}}`

  return (
    <>
      <style>{CSS}</style>
      <div className="wrap">
        <div className="header">
          <div className="topbar">
            <div className="logo"><AlpazarIcon /><span className="brand">ALPAZAR</span></div>
            <div className="nav">
              <button className="icon-btn"><i className="ti ti-bell"/></button>
              <button className="icon-btn"><i className="ti ti-message"/></button>
              <button className="login-btn" onClick={()=>window.location.href='/auth/login'}>Hyr</button>
            </div>
          </div>
          <form className="searchbar" onSubmit={e=>{e.preventDefault();fetchListings()}}>
            <div className="search-wrap">
              <i className="ti ti-search"/>
              <input type="text" placeholder="Kerko cdo gje ne Shqiperi..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
            </div>
            <button type="submit" className="search-btn">Kerko</button>
          </form>
          <div className="cat-grid">
            <button className={`cat-item ${activeCategory==='all'?'active':''}`} onClick={()=>setActiveCategory('all')}><i className="ti ti-layout-grid"/><span>Te gjitha</span></button>
            {categories.map(c=>(
              <button key={c.id} className={`cat-item ${activeCategory===c.slug?'active':''}`} onClick={()=>setActiveCategory(c.slug)}>
                <i className={`ti ti-${c.icon}`}/><span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="no-ads"><i className="ti ti-ad-off"/><span>Pa reklama - per te gjith gjithmone</span></div>
        <div className="hero">
          <div className="hero-s" style={{left:0}}/><div className="hero-s" style={{right:0}}/>
          <div><h2>Shit - Bli - Bej Pazrin Tend</h2><p>Platforma #1 shqiptare e tregtise</p></div>
          <div className="hero-stats">
            <div className="stat"><div className="stat-n">{listingCount}</div><div className="stat-l">Shpallje</div></div>
            <div className="stat"><div className="stat-n">{userCount}</div><div className="stat-l">Perdorues</div></div>
          </div>
        </div>
        <div className="ai-bar">
          <div className="ai-icon"><i className="ti ti-robot"/></div>
          <div className="ai-text"><strong>AI Asistent 24/7</strong><span>Gjej produktin ideal</span></div>
          <button className="ai-btn">Pyet</button>
        </div>
        <div className="sw">
          <div className="trust-row">
            <div className="tc tc-g"><i className="ti ti-shield-check"/><span>Te verifikuar</span></div>
            <div className="tc tc-b"><i className="ti ti-star"/><span>Vlereime</span></div>
            <div className="tc tc-r"><i className="ti ti-message-circle"/><span>Chat live</span></div>
          </div>
          <div className="filter-row">
            {filters.map(f=><button key={f.id} className={`fb ${activeFilter===f.id?'active':''}`} onClick={()=>setActiveFilter(f.id)}>{f.label}</button>)}
          </div>
          <div className="ttl"><span>Shpallje te fundit</span><a href="#">Te gjitha</a></div>
          {loading ? <div style={{textAlign:'center',padding:30}}><span className="spin"/><div style={{color:'#888',fontSize:13}}>Duke ngarkuar...</div></div> : (
            <div className="grid">
              {listings.length===0 ? (
                <div className="empty"><i className="ti ti-mood-empty"/><p>Nuk ka shpallje.<br/>Behu i pari qe shton!</p><button className="empty-btn" onClick={()=>window.location.href='/listing/new'}>+ Shto shpallje</button></div>
              ) : listings.map(l=>(
                <div key={l.id} className="lcard" onClick={()=>window.location.href=`/listing/${l.id}`}>
                  <div className="card-img">
                    {l.images?.[0]?<img src={l.images[0]} alt={l.title}/>:<i className="ti ti-photo" style={{fontSize:32,color:'#ccc'}}/>}
                    {l.condition==='i_ri'&&<span className="b-new">I ri</span>}
                    {l.condition==='i_perdorur'&&<span className="b-used">I perdorur</span>}
                    {l.is_premium&&<span className="b-prem">Premium</span>}
                  </div>
                  <div className="card-body">
                    <div className="card-t">{l.title}</div>
                    <div className="card-p">{fmt(l.price,l.currency)}</div>
                    <div className="card-m">
                      <span className="card-l"><i className="ti ti-map-pin" style={{fontSize:11}}/>{l.city||'Shqiperi'}</span>
                      <button className="card-fav"><i className="ti ti-heart"/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="prem-cta">
            <div className="prem-i"><i className="ti ti-crown"/></div>
            <div className="prem-t"><strong>Bëhu Premium 9.99EUR/muaj</strong><span>Dyqan - Badge - Shpallje te pakufizuara</span></div>
            <button className="prem-btn" onClick={()=>window.location.href='/premium'}>Shiko</button>
          </div>
        </div>
        <nav className="bnav">
          <button className="bi on"><i className="ti ti-home"/><span>Kreu</span></button>
          <button className="bi" onClick={()=>window.location.href='/search'}><i className="ti ti-search"/><span>Kerko</span></button>
          <div className="badd" onClick={()=>window.location.href='/listing/new'}><i className="ti ti-plus"/></div>
          <button className="bi" onClick={()=>window.location.href='/messages'}><i className="ti ti-message"/><span>Mesazhe</span></button>
          <button className="bi" onClick={()=>window.location.href='/profile'}><i className="ti ti-user"/><span>Profili</span></button>
        </nav>
      </div>
    </>
  )
}

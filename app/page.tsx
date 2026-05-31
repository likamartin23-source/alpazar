'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, Listing } from '../lib/types'
import { SkeletonGrid } from './components/Skeleton'
import { getLevel } from './components/Badges'
import { PremiumUpsellModal } from './components/PremiumUpsell'
import { useAlpazar } from '../lib/context'
import { saveRefFromUrl } from '../lib/referral'

// Banner shkarkim — buton i vogël katrore pulsues (fixed, vetem faqja kryesore)
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); setShow(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setShow(false) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setShow(false)
  }

  if (!show || installed || dismissed) return null
  return (
    <div style={{ position: 'fixed', bottom: 226, left: 12, zIndex: 190, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
      <button
        onClick={install}
        style={{
          width: 36, height: 44,
          background: 'linear-gradient(135deg,#22C55E,#16a34a)',
          borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 13px rgba(34,197,94,.45)',
          animation: 'install-pulse 2.2s infinite',
          transition: 'transform .15s',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(.92)')}
        onMouseUp={e => (e.currentTarget.style.transform = '')}
      >
        <i className="ti ti-device-mobile-down" style={{ fontSize: 16, color: '#fff' }} />
        <span style={{ fontSize: 7, color: '#fff', fontWeight: 800, letterSpacing: .3, lineHeight: 1 }}>Instalo</span>
      </button>
      <button onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: 'rgba(34,197,94,.7)', cursor: 'pointer', fontSize: 7, padding: 0, lineHeight: 1, alignSelf: 'center' }}>✕</button>
    </div>
  )
}

// Kuti ndarje — buton i vogël katrore pulsues (fixed, vetem faqja kryesore)
function ShareBox({ refCode }: { refCode?: string }) {
  const [open, setOpen] = useState(false)
  const base = 'https://alpazar.vercel.app'
  const url = refCode ? `${base}?ref=${refCode}` : base
  const text = refCode
    ? `Bashkohu me mua në ALPAZAR — marketplace #1 shqiptar! Shit, bli dhe bëj pazarin tënd falas:`
    : 'Zbulo ALPAZAR — platforma #1 shqiptare e tregtisë online! Shit, bli dhe bëj pazarin tënd.'

  return (
    <div style={{ position: 'fixed', bottom: 157, left: 12, zIndex: 190, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
      {open && (
        <div style={{
          background: '#111', border: '1.5px solid #1d4ed8', borderRadius: '12px 12px 12px 0',
          padding: '10px', boxShadow: '0 4px 18px rgba(59,130,246,.25)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6,
          animation: 'ai-fade .25s ease',
        }}>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')}
            style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 6px', fontSize: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} />WhatsApp
          </button>
          <button onClick={() => window.open(`viber://forward?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')}
            style={{ background: '#7360F2', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 6px', fontSize: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <i className="ti ti-brand-viber" style={{ fontSize: 16 }} />Viber
          </button>
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')}
            style={{ background: '#1877F2', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 6px', fontSize: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <i className="ti ti-brand-facebook" style={{ fontSize: 16 }} />Facebook
          </button>
          <button onClick={() => window.open('https://www.instagram.com/', '_blank')}
            style={{ background: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 6px', fontSize: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <i className="ti ti-brand-instagram" style={{ fontSize: 16 }} />Instagram
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 44,
          background: open ? '#2563EB' : 'linear-gradient(135deg,#3B82F6,#2563EB)',
          borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 13px rgba(59,130,246,.45)',
          animation: open ? 'none' : 'share-pulse 2.2s infinite',
          transition: 'transform .15s',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(.92)')}
        onMouseUp={e => (e.currentTarget.style.transform = '')}
      >
        <i className={`ti ti-${open ? 'x' : 'share-2'}`} style={{ fontSize: 16, color: '#fff' }} />
        <span style={{ fontSize: 7, color: '#fff', fontWeight: 800, letterSpacing: .3, lineHeight: 1 }}>Ndaj</span>
      </button>
      <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(59,130,246,.7)', cursor: 'pointer', fontSize: 8, padding: 0, lineHeight: 1, alignSelf: 'center', display: open ? 'block' : 'none' }}>✕</button>
    </div>
  )
}

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
  // Global context — auth, config, unread counts
  const { user, profile, authReady, unreadMessages: unreadCount, cfg } = useAlpazar()

  const [categories, setCategories] = useState<Category[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [shops, setShops] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [listingCount, setListingCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  // settings now from app_config via context (cfg helper)
  const settings: Record<string, string> = {}
  const [newListingBadge, setNewListingBadge] = useState(false)
  const listingsChRef = useRef<any>(null)

  useEffect(() => {
    saveRefFromUrl()
    fetchAll()

    // Rilexo kur tab bëhet aktiv sërish
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchListings()
        fetchCounts()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    // Poll shpallje çdo 10 sekonda
    const listingsPoll = setInterval(() => {
      fetchListings()
      fetchCounts()
    }, 10000)

    // Supabase Realtime si bonus (kur replication është aktive)
    const lch = supabase
      .channel('listings-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, (payload) => {
        const n = payload.new as any
        if (!n.is_active) return
        setListings(prev => prev.find(l => l.id === n.id) ? prev : [n, ...prev].slice(0, 20))
        setListingCount(c => c + 1)
        setNewListingBadge(true)
        setTimeout(() => setNewListingBadge(false), 4000)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listings' }, (payload) => {
        const n = payload.new as any
        setListings(prev =>
          n.is_active
            ? prev.map(l => l.id === n.id ? { ...l, ...n } : l)
            : prev.filter(l => l.id !== n.id)
        )
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listings' }, (payload) => {
        setListings(prev => prev.filter(l => l.id !== (payload.old as any).id))
        setListingCount(c => Math.max(0, c - 1))
      })
      .subscribe()
    listingsChRef.current = lch

    return () => {
      if (listingsChRef.current) supabase.removeChannel(listingsChRef.current)
      clearInterval(listingsPoll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])


  useEffect(() => { fetchListings() }, [activeCategory, activeFilter])

  async function fetchAll() {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchListings(), fetchCounts(), fetchShops()])
    setLoading(false)
  }

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').eq('is_active', true).order('sort_order')
    if (data) setCategories(data)
  }

  async function fetchShops() {
    const { data } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url,city,shop_name,shop_description,shop_category,shop_banner_url')
      .eq('is_premium', true)
      .limit(6)
    if (data) setShops(data)
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

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  const go = (path: string) => { window.location.href = path }

  const SHOP_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4']

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;padding-bottom:80px;}
        /* Header */
        .header{background:linear-gradient(180deg,#F5C842,#f0bc30);position:sticky;top:0;z-index:50;box-shadow:0 2px 8px rgba(0,0,0,.1);}
        .topbar{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;}
        .logo{display:flex;align-items:center;gap:8px;cursor:pointer;}
        .brand{font-size:20px;font-weight:800;color:#111;letter-spacing:2px;}
        .nav{display:flex;gap:5px;align-items:center;}
        .icon-btn{width:34px;height:34px;background:rgba(0,0,0,.10);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;transition:background .15s;}
        .icon-btn:hover{background:rgba(0,0,0,.18);}
        .icon-btn i{font-size:17px;color:#111;}
        .login-btn{background:#111;color:#F5C842;border:none;border-radius:8px;padding:7px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;transition:opacity .15s;}
        .login-btn:hover{opacity:.85;}
        /* Identiteti i përdoruesit të loguar */
        .user-chip{display:flex;align-items:center;gap:7px;background:rgba(0,0,0,.08);border:none;border-radius:20px;padding:4px 10px 4px 4px;cursor:pointer;font-family:inherit;transition:background .15s;}
        .user-chip:hover{background:rgba(0,0,0,.15);}
        .user-chip-av{width:28px;height:28px;border-radius:50%;background:#111;color:#F5C842;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;overflow:hidden;flex-shrink:0;position:relative;}
        .user-chip-av img{width:100%;height:100%;object-fit:cover;}
        .user-chip-on{position:absolute;bottom:-1px;right:-1px;width:9px;height:9px;background:#22C55E;border-radius:50%;border:2px solid #F5C842;}
        .user-chip-txt{display:flex;flex-direction:column;align-items:flex-start;line-height:1.1;}
        .user-chip-name{font-size:11px;font-weight:700;color:#111;max-width:84px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .user-chip-lvl{font-size:8px;font-weight:700;}
        .auth-skel{width:90px;height:34px;border-radius:8px;background:rgba(0,0,0,.07);animation:auth-pulse 1.2s ease-in-out infinite;}
        @keyframes auth-pulse{0%,100%{opacity:.5}50%{opacity:.9}}
        /* Search */
        .searchbar{padding:0 12px 10px;display:flex;gap:8px;}
        .search-wrap{flex:1;background:#fff;border-radius:10px;display:flex;align-items:center;padding:0 12px;gap:8px;border:1.5px solid rgba(0,0,0,.08);box-shadow:0 1px 4px rgba(0,0,0,.06);}
        .search-wrap i{font-size:15px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:10px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .search-btn{background:#111;color:#F5C842;border:none;border-radius:10px;padding:10px 14px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        /* Categories */
        .cat-scroll{display:flex;gap:6px;padding:0 10px 10px;overflow-x:auto;scroll-snap-type:x mandatory;}
        .cat-scroll::-webkit-scrollbar{display:none;}
        .cat-item{background:#fff;border-radius:20px;padding:6px 12px;display:flex;align-items:center;gap:5px;cursor:pointer;border:1.5px solid transparent;font-family:inherit;transition:all .15s;box-shadow:0 1px 4px rgba(0,0,0,.06);white-space:nowrap;flex-shrink:0;scroll-snap-align:start;}
        .cat-item:active{transform:scale(.95);}
        .cat-item.active{background:#111;border-color:#111;box-shadow:0 3px 10px rgba(0,0,0,.2);}
        .cat-item i{font-size:14px;color:#777;}
        .cat-item.active i{color:#F5C842;}
        .cat-item span{font-size:11px;color:#555;font-weight:600;}
        .cat-item.active span{color:#F5C842;font-weight:700;}
        /* Body */
        .body{padding:0 10px;}
        .no-ads{background:#EAF3DE;border:0.5px solid #97C459;border-radius:7px;padding:6px 12px;display:flex;align-items:center;gap:6px;margin-bottom:2px;}
        .no-ads i{font-size:13px;color:#3B6D11;}
        .no-ads span{font-size:9px;color:#3B6D11;font-weight:700;}
        /* Hero — -40% lartesi */
        .hero{background:linear-gradient(135deg,#111 0%,#1c1c1c 100%);border-radius:16px;padding:3px 14px;display:flex;align-items:center;justify-content:space-between;margin-top:-6px;margin-bottom:4px;position:relative;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.15);}
        .hero h2{color:#F5C842;font-size:12px;font-weight:700;margin-bottom:3px;}
        .hero p{color:#777;font-size:9px;line-height:1.5;}
        .hero-stats{display:flex;gap:14px;}
        .stat{text-align:center;}
        .stat-n{color:#F5C842;font-size:15px;font-weight:800;}
        .stat-l{color:#555;font-size:7px;margin-top:1px;}
        /* Trust row */
        .trust-row{display:flex;gap:6px;margin-bottom:10px;}
        .trust-card{flex:1;border-radius:9px;padding:7px 8px;display:flex;align-items:center;gap:5px;}
        .tc-green{background:#EAF3DE;border:0.5px solid #97C459;}
        .tc-blue{background:#EEF4FF;border:0.5px solid #85B7EB;}
        .tc-red{background:#FFF0EE;border:0.5px solid #F09595;}
        .trust-card i{font-size:14px;}
        .trust-card span{font-size:8px;font-weight:600;line-height:1.3;}
        .tc-green i,.tc-green span{color:#3B6D11;}
        .tc-blue i,.tc-blue span{color:#185FA5;}
        .tc-red i,.tc-red span{color:#A32D2D;}
        /* Shops section */
        .section-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;}
        .section-hdr h3{font-size:13px;font-weight:700;color:#111;}
        .section-hdr a{color:#E63312;font-size:11px;text-decoration:none;cursor:pointer;font-weight:600;}
        .shops-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:12px;}
        .shop-mini{background:#fff;border-radius:10px;overflow:hidden;cursor:pointer;border:0.5px solid #eee;box-shadow:0 2px 6px rgba(0,0,0,.04);transition:transform .15s;}
        .shop-mini:hover{transform:translateY(-2px);}
        .shop-mini:active{transform:scale(.96);}
        .shop-top{height:45px;display:flex;align-items:flex-end;padding:6px;position:relative;}
        .shop-av{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.2);}
        .shop-prem{position:absolute;top:4px;right:4px;font-size:7px;background:#F5C842;color:#111;padding:1px 5px;border-radius:8px;font-weight:700;}
        .shop-info{padding:5px 6px 7px;}
        .shop-nm{font-size:8px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .shop-ct{font-size:7.5px;color:#aaa;margin-top:2px;}
        /* Filter row */
        .filter-row{display:flex;gap:5px;margin-bottom:10px;overflow-x:auto;}
        .filter-row::-webkit-scrollbar{display:none;}
        .filter-btn{background:#fff;border:0.5px solid #ddd;border-radius:20px;padding:6px 13px;font-size:10px;color:#666;white-space:nowrap;flex-shrink:0;cursor:pointer;font-family:inherit;transition:all .12s;box-shadow:0 1px 3px rgba(0,0,0,.04);}
        .filter-btn.active{background:#111;border-color:#111;color:#F5C842;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);}
        /* Listings grid — -40% madhesi nga originali */
        .listings-grid{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:12px;}
        .listing-card{background:#fff;border:0.5px solid #eee;border-radius:10px;overflow:hidden;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.04);transition:transform .12s,box-shadow .12s;}
        .listing-card:hover{transform:translateY(-2px);box-shadow:0 6px 18px rgba(0,0,0,.08);}
        .listing-card:active{transform:scale(.97);}
        .card-img{height:45px;display:flex;align-items:center;justify-content:center;font-size:20px;position:relative;background:linear-gradient(135deg,#f9f5e0,#f5f0d5);}
        .card-img img{width:100%;height:100%;object-fit:cover;}
        .badge-new{position:absolute;top:3px;left:3px;background:#E63312;color:#fff;font-size:6px;padding:1px 4px;border-radius:4px;font-weight:700;}
        .badge-used{position:absolute;top:3px;left:3px;background:#111;color:#F5C842;font-size:6px;padding:1px 4px;border-radius:4px;font-weight:700;}
        .badge-premium{position:absolute;top:3px;right:3px;background:#F5C842;color:#111;font-size:6px;padding:1px 4px;border-radius:4px;font-weight:700;}
        .card-body{padding:5px 6px;}
        .card-title{font-size:8px;font-weight:700;color:#222;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .card-price{font-size:9px;font-weight:800;color:#E63312;margin-bottom:3px;}
        .card-meta{display:flex;align-items:center;justify-content:space-between;}
        .card-loc{font-size:7px;color:#aaa;display:flex;align-items:center;gap:2px;}
        .card-loc i{font-size:7px;}
        .card-like{width:16px;height:16px;border:0.5px solid #eee;border-radius:50%;display:flex;align-items:center;justify-content:center;background:none;cursor:pointer;transition:border-color .15s;}
        .card-like:hover{border-color:#E63312;}
        .card-like i{font-size:8px;color:#ddd;}
        .empty-state{grid-column:1/-1;text-align:center;padding:36px 16px;background:linear-gradient(135deg,#f9f5e0,#f5f0d5);border:0.5px solid #eee;border-radius:13px;}
        .empty-state i{font-size:40px;color:#F5C842;display:block;margin-bottom:10px;}
        .empty-state h3{font-size:14px;font-weight:700;color:#555;margin-bottom:6px;}
        .empty-state p{font-size:11px;color:#aaa;line-height:1.6;margin-bottom:14px;}
        .empty-cta{background:#E63312;color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        /* Premium CTA */
        .premium-cta{margin-top:-4px;margin-bottom:8px;background:linear-gradient(135deg,#FFFBEA,#fff8d9);border:1.5px solid #F5C842;border-radius:13px;padding:4px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 3px 12px rgba(245,200,66,.15);}
        .prem-icon{width:30px;height:30px;background:#F5C842;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .prem-icon i{font-size:15px;color:#111;}
        .prem-text strong{font-size:11px;font-weight:700;color:#111;display:block;}
        .prem-text span{font-size:9px;color:#888;}
        .prem-btn{background:#111;color:#F5C842;border:none;border-radius:8px;padding:8px 13px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;margin-left:auto;}
        /* Bottom nav */
        .bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#111;padding:8px 6px 16px;display:flex;justify-content:space-around;align-items:center;z-index:100;box-shadow:0 -4px 20px rgba(0,0,0,.25);border-top:1px solid #1e1e1e;}
        .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;color:#556;border:none;background:none;font-family:inherit;cursor:pointer;transition:color .2s;padding:4px 10px;border-radius:12px;position:relative;}
        .nav-item.active{color:#F5C842;}
        .nav-item.active::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(245,200,66,.1);border-radius:12px;}
        .nav-item i{font-size:22px;transition:transform .2s;}
        .nav-item.active i{transform:scale(1.12);}
        .nav-item span{font-size:10px;color:inherit;font-weight:600;}
        .nav-badge{position:absolute;top:2px;right:6px;background:#E63312;color:#fff;font-size:7px;font-weight:700;border-radius:10px;padding:1px 4px;min-width:14px;text-align:center;line-height:14px;}
        .nav-add{width:50px;height:50px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #111;margin-top:-18px;cursor:pointer;box-shadow:0 4px 16px rgba(230,51,18,.5);transition:transform .15s,box-shadow .15s;}
        .nav-add:active{transform:scale(.9);box-shadow:0 2px 8px rgba(230,51,18,.3);}
        .nav-add i{font-size:24px;color:#fff;}
        /* Floating pulsing squares */
        @keyframes install-pulse{0%,100%{box-shadow:0 6px 20px rgba(34,197,94,.4);transform:scale(1)}50%{box-shadow:0 8px 28px rgba(34,197,94,.65);transform:scale(1.07)}}
        @keyframes share-pulse{0%,100%{box-shadow:0 6px 20px rgba(59,130,246,.35);transform:scale(1)}50%{box-shadow:0 8px 28px rgba(59,130,246,.6);transform:scale(1.07)}}
        .loading{text-align:center;padding:32px;color:#888;font-size:13px;}
        .spinner{display:block;width:28px;height:28px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 10px;}
        @keyframes spin{to{transform:rotate(360deg);}}
        .new-listing-toast{background:#EAF3DE;border:1px solid #97C459;border-radius:8px;padding:6px 12px;display:flex;align-items:center;gap:7px;margin-bottom:7px;animation:toast-in .3s ease;}
        @keyframes toast-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .new-listing-toast span{font-size:11px;font-weight:700;color:#3B6D11;}
      `}</style>

      <div className="wrap">
        <div className="header">
          <div className="topbar">
            <div className="logo" onClick={() => go('/')}>
              <AlpazarIcon />
              <span className="brand">{settings.site_name || 'ALPAZAR'}</span>
            </div>
            <div className="nav">
              {unreadCount > 0 && (
                <button className="icon-btn" onClick={() => go(user ? '/messages' : '/auth/login')} style={{ position: 'relative' }}>
                  <i className="ti ti-bell" />
                  <span style={{ position: 'absolute', top: 2, right: 2, background: '#E63312', color: '#fff', fontSize: 7, fontWeight: 700, borderRadius: 8, padding: '1px 3px', minWidth: 12, textAlign: 'center', lineHeight: '12px' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                </button>
              )}
              {!authReady ? (
                <div className="auth-skel" aria-hidden />
              ) : user ? (
                (() => {
                  const lvl = getLevel(profile?.gamification_points || 0)
                  const nm = profile?.full_name || profile?.username || 'Profili'
                  const inits = nm.slice(0, 2).toUpperCase()
                  return (
                    <button className="user-chip" onClick={() => go('/profile')} aria-label="Profili im">
                      <span className="user-chip-av">
                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="" /> : inits}
                        <span className="user-chip-on" />
                      </span>
                      <span className="user-chip-txt">
                        <span className="user-chip-name">{nm}</span>
                        <span className="user-chip-lvl" style={{ color: lvl.color }}>
                          {profile?.is_premium ? '👑 Premium' : `${lvl.icon} ${lvl.name}`}
                        </span>
                      </span>
                    </button>
                  )
                })()
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

          <div className="cat-scroll">
            <button className={`cat-item ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => { setActiveCategory('all'); fetchListings('all', activeFilter) }}>
              <i className="ti ti-layout-grid" />
              <span>Të gjitha</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`cat-item ${activeCategory === cat.slug ? 'active' : ''}`}
                onClick={() => { setActiveCategory(cat.slug); fetchListings(cat.slug, activeFilter) }}
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
            <span>Pa reklama — për të gjithë gjithmonë falas</span>
          </div>

          {/* 1. Hero — 40% më i shkurtër vertikalisht */}
          <div className="hero">
            <div>
              <h2>🦅 {cfg('site_slogan', 'Shit · Bli · Bëj Pazrin Tënd')}</h2>
              <p><span style={{color:'#E63312',fontWeight:800}}>Platforma #1 shqiptare<br />e tregtisë online</span></p>
            </div>
            {(cfg('show_listing_count','true') !== 'false' || cfg('show_user_count','true') !== 'false') && (
              <div className="hero-stats">
                {cfg('show_listing_count','true') !== 'false' && (
                  <div className="stat">
                    <div className="stat-n">{listingCount.toLocaleString('sq-AL')}</div>
                    <div className="stat-l">Shpallje</div>
                  </div>
                )}
                {cfg('show_user_count','true') !== 'false' && (
                  <div className="stat">
                    <div className="stat-n">{userCount.toLocaleString('sq-AL')}</div>
                    <div className="stat-l">Përdorues</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Premium CTA — vendosur ku ishte AI asistenti */}
          <div className="premium-cta">
            <div className="prem-icon"><i className="ti ti-crown" /></div>
            <div className="prem-text">
              <strong>👑 Bëhu Anëtar Premium</strong>
              <span>Dyqan · Badge · Shpallje ∞ · {cfg('premium_monthly_price','9.99')}€/muaj</span>
            </div>
            <button className="prem-btn" onClick={() => go('/premium')}>Shiko →</button>
          </div>

          {/* 3. Trust row */}
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

          {/* Shops section */}
          {shops.length > 0 && (
            <>
              <div className="section-hdr">
                <h3>🏪 Dyqane Premium</h3>
                <a onClick={() => go('/dyqane')}>Të gjitha →</a>
              </div>
              <div className="shops-grid">
                {shops.map((shop, idx) => {
                  const col = SHOP_COLORS[idx % SHOP_COLORS.length]
                  const initials = (shop.shop_name || shop.full_name || '?').slice(0, 2).toUpperCase()
                  return (
                    <div key={shop.id} className="shop-mini" onClick={() => go(`/dyqane/${shop.id}`)}>
                      <div className="shop-top" style={{ background: `linear-gradient(135deg,${col}22,${col}44)` }}>
                        <div className="shop-av" style={{ background: col }}>
                          {shop.avatar_url
                            ? <img src={shop.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            : initials
                          }
                        </div>
                        <span className="shop-prem">⭐</span>
                      </div>
                      <div className="shop-info">
                        <div className="shop-nm">{shop.shop_name || shop.full_name}</div>
                        <div className="shop-ct">{shop.city || 'Shqipëri'}</div>
                      </div>
                    </div>
                  )
                })}
                <div className="shop-mini" onClick={() => go('/dyqane')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px dashed #F5C842', cursor: 'pointer', minHeight: 80 }}>
                  <i className="ti ti-arrow-right" style={{ fontSize: 20, color: '#E63312' }} />
                  <div style={{ fontSize: 9, color: '#E63312', fontWeight: 700, marginTop: 4, textAlign: 'center', padding: '0 6px' }}>Shiko të gjitha</div>
                </div>
              </div>
            </>
          )}

          {newListingBadge && (
            <div className="new-listing-toast" onClick={() => { fetchListings(); setNewListingBadge(false) }}>
              <i className="ti ti-sparkles" style={{ fontSize: 14, color: '#3B6D11' }} />
              <span>Shpallje e re u shtua — klikoni për të rifreskuar</span>
            </div>
          )}

          <div className="filter-row">
            {[
              { id: 'all', label: 'Të gjitha' },
              { id: 'new', label: '🆕 I ri' },
              { id: 'used', label: 'I përdorur' },
              { id: 'premium', label: '⭐ Premium' },
            ].map(f => (
              <button
                key={f.id}
                className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                onClick={() => { setActiveFilter(f.id); fetchListings(activeCategory, f.id) }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="section-hdr">
            <h3>🔥 Shpallje të fundit</h3>
            <a onClick={() => { setActiveCategory('all'); fetchListings('all', 'all') }}>Të gjitha →</a>
          </div>

          {/* 6. Shpalljet — -30% madhësi */}
          {loading ? (
            <SkeletonGrid count={6} />
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
                        : <i className="ti ti-photo" style={{ fontSize: 26, color: '#ccc' }} />
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
                          <i className="ti ti-map-pin" />
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

        </div>

        <nav className="bottom-nav">
          <button className="nav-item active">
            <i className="ti ti-home-filled" /><span>Kreu</span>
          </button>
          <button className="nav-item" onClick={() => go('/search')}>
            <i className="ti ti-search" /><span>Kërko</span>
          </button>
          <div className="nav-add" onClick={() => go(user ? '/listing/new' : '/auth/login')}>
            <i className="ti ti-plus" />
          </div>
          <button className="nav-item" onClick={() => go(user ? '/messages' : '/auth/login')} style={{ position: 'relative' }}>
            <i className="ti ti-message-circle" />
            {unreadCount > 0 && <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            <span>Mesazhe</span>
          </button>
          <button className="nav-item" onClick={() => go(user ? '/profile' : '/auth/login')} style={{ position: 'relative' }}>
            <i className="ti ti-user-circle" />
            {authReady && user && (
              <span style={{ position: 'absolute', top: 4, right: 12, width: 8, height: 8, background: '#22C55E', borderRadius: '50%', border: '1.5px solid #111' }} />
            )}
            <span>{authReady && user ? 'Profili' : 'Hyr'}</span>
          </button>
        </nav>
      </div>

      {/* Butonat pulsuese katrore — vetem faqja kryesore */}
      <ShareBox refCode={profile?.referral_code || profile?.username || undefined} />
      <InstallBanner />
      {/* Marketing: upsell modal per jo-premium */}
      {authReady && user && !profile?.is_premium && <PremiumUpsellModal trigger="scroll" />}
    </>
  )
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useDraggable } from '../hooks/useDraggable'
import type { Category, Listing } from '../lib/types'
import { SkeletonGrid } from './components/Skeleton'
import Avatar, { tierNgaProfili } from './components/Avatar'
import ListingCard from './components/ListingCard'
import { getLevel } from './components/Badges'
import { PremiumUpsellModal } from './components/PremiumUpsell'
import { Onboarding } from './components/Onboarding'
import { useAlpazar } from '../lib/context'
import { saveRefFromUrl } from '../lib/referral'
import { SITE_URL } from '../lib/siteConfig'
import { nf } from '../lib/format'

// Banner shkarkim — buton i vogël katrore pulsues (fixed, vetem faqja kryesore)
function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [showGuide, setShowGuide] = useState(false)

  const { pos, dragging, onPointerDown } = useDraggable(
    '_alpz_pos_install',
    () => window.innerWidth >= 768 ? { left: 24, bottom: 104 } : { left: 12, bottom: 226 },
    64
  )

  useEffect(() => {
    // Nese app-i eshte tashme i instaluar (standalone), fshihe butonin.
    try {
      if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) setStandalone(true)
    } catch { /* ignore */ }
    // Chromium ndez beforeinstallprompt -> instalim me nje klik. Firefox/Safari nuk e ndezin;
    // atehere butoni mbetet i dukshem dhe klik-u tregon udhezime manuale (shih install()).
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e) }
    const installedHandler = () => { setInstalled(true) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)
    return () => { window.removeEventListener('beforeinstallprompt', handler); window.removeEventListener('appinstalled', installedHandler) }
  }, [])

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
      return
    }
    // Pa prompt native (Firefox/Safari) -> udhezime manuale.
    setShowGuide(v => !v)
  }

  // GJITHMONE i dukshem per perdoruesin (jo i varur nga beforeinstallprompt qe s'ndizet
  // ne cdo browser) — fshihet vetem nese eshte instaluar, mbyllur, ose ne standalone.
  if (installed || dismissed || standalone) return null
  return (
    <div
      className="install-float"
      style={{
        position: 'fixed',
        bottom: pos?.bottom ?? 226,
        left: pos?.left ?? 12,
        right: 'auto',
        zIndex: 190,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 3,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
    >
      {showGuide && (
        <div
          role="dialog"
          aria-label="Si të instaloni Alpazar"
          style={{
            position: 'absolute', bottom: '112%', left: 0,
            width: 236, maxWidth: '78vw',
            background: '#111', color: '#fff', borderRadius: '12px 12px 12px 4px',
            padding: '12px 13px', boxShadow: '0 10px 30px rgba(0,0,0,.35)',
            fontSize: 12, lineHeight: 1.5, zIndex: 5, cursor: 'default',
          }}
          onPointerDown={e => e.stopPropagation()}
        >
          <strong style={{ display: 'block', color: '#22C55E', fontSize: 13, marginBottom: 6 }}>
            Instalo Alpazar-in
          </strong>
          <div style={{ marginBottom: 5 }}><b>Chrome/Edge:</b> menyja ⋮ → “Instalo aplikacionin”.</div>
          <div style={{ marginBottom: 5 }}><b>iPhone (Safari):</b> Ndaj <span aria-hidden="true">↑</span> → “Add to Home Screen”.</div>
          <div><b>Android:</b> menyja ⋮ → “Shto te ekrani kryesor”.</div>
          <button
            type="button"
            onClick={() => setShowGuide(false)}
            style={{ position: 'absolute', top: 6, right: 8, background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
            aria-label="Mbyll udhëzimet"
          >✕</button>
        </div>
      )}
      <button
        type="button"
        aria-label="Instalo aplikacionin"
        onClick={install}
        style={{
          width: 36, height: 44,
          background: 'linear-gradient(135deg,#22C55E,#16a34a)',
          borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          border: 'none', cursor: 'inherit',
          boxShadow: '0 4px 13px rgba(34,197,94,.45)',
          animation: 'install-pulse 2.2s infinite',
          transition: 'transform .15s',
        }}
      >
        <i className="ti ti-device-mobile-down float-icon-main" aria-hidden="true" />
        <span className="float-label">Instalo</span>
      </button>
      <button type="button" aria-label="Mbyll" onClick={() => setDismissed(true)} style={{ background: 'none', border: 'none', color: 'rgba(34,197,94,.7)', cursor: 'pointer', fontSize: 7, padding: 0, lineHeight: 1, alignSelf: 'center' }}>✕</button>
    </div>
  )
}

// Kuti ndarje — buton i vogël katrore pulsues (fixed, vetem faqja kryesore)
function ShareBox({ refCode }: { refCode?: string }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'feed' | 'msg'>('feed')
  const [copied, setCopied] = useState<string | null>(null)

  const { pos, dragging, onPointerDown } = useDraggable(
    '_alpz_pos_share',
    () => window.innerWidth >= 768 ? { left: 24, bottom: 24 } : { left: 12, bottom: 157 },
    64
  )

  const base = SITE_URL
  const url  = refCode ? `${base}?ref=${refCode}` : base
  const text = refCode
    ? 'Bashkohu me mua në ALPAZAR — marketplace #1 shqiptar! Shit, bli dhe bëj pazarin tënd falas:'
    : 'Zbulo ALPAZAR — platforma #1 shqiptare e tregtisë online! Shit, bli dhe bëj pazarin tënd.'

  const enc = (s: string) => encodeURIComponent(s)

  // platform: [id, label, bg, feedUrl, msgUrl, feedApp?, msgApp?]
  const platforms = [
    {
      id: 'facebook',  label: 'Facebook',
      bg: '#1877F2',
      feedUrl: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
      msgUrl:  `fb-messenger://share?link=${enc(url)}`,
      feedSub: 'Feed', msgSub: 'Messenger',
      icon: 'ti-brand-facebook',
    },
    {
      id: 'instagram', label: 'Instagram',
      bg: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)',
      feedUrl: null, msgUrl: null,
      feedApp: 'https://www.instagram.com/', msgApp: 'https://www.instagram.com/direct/new/',
      feedSub: 'Story', msgSub: 'DM',
      icon: 'ti-brand-instagram',
    },
    {
      id: 'tiktok',    label: 'TikTok',
      bg: '#010101',
      feedUrl: null, msgUrl: null,
      feedApp: 'https://www.tiktok.com/', msgApp: 'https://www.tiktok.com/messages',
      feedSub: 'Post', msgSub: 'DM',
      icon: 'ti-brand-tiktok',
    },
    {
      id: 'linkedin',  label: 'LinkedIn',
      bg: '#0A66C2',
      feedUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`,
      msgUrl:  `https://www.linkedin.com/messaging/compose/?body=${enc(text + '\n' + url)}`,
      feedSub: 'Post', msgSub: 'Mesazh',
      icon: 'ti-brand-linkedin',
    },
    {
      id: 'whatsapp',  label: 'WhatsApp',
      bg: '#25D366',
      feedUrl: `https://api.whatsapp.com/send?text=${enc(text + '\n' + url)}`,
      msgUrl:  `https://wa.me/?text=${enc(text + '\n' + url)}`,
      feedSub: 'Status', msgSub: 'Chat',
      icon: 'ti-brand-whatsapp',
    },
    {
      id: 'viber',     label: 'Viber',
      bg: '#7360F2',
      feedUrl: `viber://forward?text=${enc(text + '\n' + url)}`,
      msgUrl:  `viber://forward?text=${enc(text + '\n' + url)}`,
      feedSub: 'Forward', msgSub: 'Mesazh',
      icon: 'ti-phone',
    },
  ]

  function handlePlatform(p: typeof platforms[number]) {
    const target = mode === 'feed' ? p.feedUrl : p.msgUrl
    const app    = mode === 'feed' ? (p as any).feedApp : (p as any).msgApp

    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer')
    } else if (app) {
      navigator.clipboard?.writeText(url).catch(() => {})
      setCopied(p.id)
      setTimeout(() => { window.open(app, '_blank', 'noopener,noreferrer'); setCopied(null) }, 1100)
    }
  }

  const BTN_BASE: React.CSSProperties = {
    border: 'none', borderRadius: 8, padding: '7px 4px', fontSize: 7.5, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit', color: '#fff',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
  }

  return (
    <div
      className="share-float"
      style={{
        position: 'fixed',
        bottom: pos?.bottom ?? 157,
        left: pos?.left ?? 12,
        right: 'auto',
        zIndex: 190,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 3,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
    >
      {open && (
        <div style={{
          background: '#111', border: '1.5px solid #1d4ed8', borderRadius: '14px 14px 14px 0',
          padding: '10px', boxShadow: '0 4px 20px rgba(59,130,246,.3)',
          width: 212, animation: 'ai-fade .2s ease',
        }}>
          {/* Mode toggle */}
          <div style={{ display: 'flex', background: '#222', borderRadius: 8, padding: 3, gap: 3, marginBottom: 9 }}>
            {(['feed', 'msg'] as const).map(m => (
              <button key={m} type="button" onClick={() => setMode(m)} style={{
                flex: 1, border: 'none', borderRadius: 6, padding: '5px 2px',
                fontSize: 8, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                background: mode === m ? '#3B82F6' : 'transparent',
                color: mode === m ? '#fff' : '#888', transition: 'all .15s',
              }}>
                {m === 'feed' ? <><span aria-hidden='true'>📢</span> Statusi</> : <><span aria-hidden='true'>💬</span> Mesazh</>}
              </button>
            ))}
          </div>

          {/* 3×2 grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {platforms.map(p => {
              const isCopying = copied === p.id
              const sub = mode === 'feed' ? p.feedSub : p.msgSub
              return (
                <button key={p.id} type="button" onClick={() => handlePlatform(p)}
                  style={{ ...BTN_BASE, background: isCopying ? '#EAF3DE' : p.bg, color: isCopying ? '#3B6D11' : '#fff' }}>
                  {isCopying
                    ? <span style={{ fontSize: 14 }} aria-hidden="true">✅</span>
                    : <i className={`ti ${p.icon}`} style={{ fontSize: 14 }} />
                  }
                  <span>{p.label}</span>
                  <span style={{ fontSize: 6.5, opacity: 0.8, fontWeight: 400 }}>
                    {isCopying ? 'Kopjuar!' : sub}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={open ? 'Mbyll menynë e ndarjes' : 'Ndaj aplikacionin'}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 44,
          background: open ? '#2563EB' : 'linear-gradient(135deg,#3B82F6,#2563EB)',
          borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 4px 13px rgba(59,130,246,.45)',
          animation: open ? 'none' : 'share-pulse 2.2s infinite',
          transition: 'transform .15s',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(.92)')}
        onMouseUp={e => (e.currentTarget.style.transform = '')}
      >
        <i className={`ti ti-${open ? 'x' : 'share-2'} float-icon-main`} aria-hidden="true" />
        <span className="float-label">Ndaj</span>
      </button>
      <button type="button" aria-label="Mbyll" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(59,130,246,.7)', cursor: 'pointer', fontSize: 8, padding: 0, lineHeight: 1, alignSelf: 'center', display: open ? 'block' : 'none' }}>✕</button>
    </div>
  )
}

function AlpazarIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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

export default function HomeClient({ initialListings = [], initialCategories = [] }: { initialListings?: Listing[]; initialCategories?: Category[] }) {
  // Global context — auth, config, unread counts
  const { user, profile, authReady, unreadMessages: unreadCount, unreadNotifications, cfg } = useAlpazar()

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [listings, setListings] = useState<Listing[]>(initialListings)
  const [shops, setShops] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{id:string;title:string;price:number;currency:string;images:string[]|null}[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [loading, setLoading] = useState(initialListings.length === 0)
  // When the server seeded initial listings, skip the mount refetch so the
  // SSR'd content stays visible (no skeleton flicker). Filter/poll/visibility
  // fetches still run normally.
  const skipMountFetch = useRef(initialListings.length > 0)
  const listingsReqId = useRef(0)
  const [listingCount, setListingCount] = useState(0)
  const [userCount, setUserCount] = useState(0)
  // settings now from app_config via context (cfg helper)
  const settings: Record<string, string> = {}
  const [newListingBadge, setNewListingBadge] = useState(false)
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([])
  // Hidratimi: koha relative (timeAgo) varet nga Date.now() → ndryshon mes
  // serverit dhe klientit. Renderohet vetëm pas mount-it që SSR-i dhe render-i
  // i parë në klient të jenë identikë (pa React #418/#425).
  const [mounted, setMounted] = useState(false)

  // Realtime listings via hook
  useRealtimeTable<Listing>(
    'listings',
    null,
    (row) => {
      if (!row.is_active) return
      setListings(prev => prev.find(l => l.id === row.id) ? prev : [row, ...prev].slice(0, 20))
      setListingCount(c => c + 1)
      setNewListingBadge(true)
      setTimeout(() => setNewListingBadge(false), 4000)
    },
    (row) => {
      setListings(prev =>
        (row as any).is_active
          ? prev.map(l => l.id === row.id ? { ...l, ...row } : l)
          : prev.filter(l => l.id !== row.id)
      )
    },
    (row) => {
      setListings(prev => prev.filter(l => l.id !== row.id))
      setListingCount(c => Math.max(0, c - 1))
    }
  )

  useEffect(() => {
    ;(async () => {
      let rv: any[] = []
      try { rv = JSON.parse(localStorage.getItem('_alpazar_rv') || '[]') } catch { rv = [] }
      if (!Array.isArray(rv) || rv.length === 0) return
      // de-dup by id
      const seen = new Set<string>()
      rv = rv.filter((x: any) => x && x.id && !seen.has(x.id) && (seen.add(x.id), true))
      // drop entries whose listing was deleted / deactivated, so "fshira" disappear
      try {
        const ids = rv.map((x: any) => x.id)
        const { data } = await supabase.from('listings').select('id').in('id', ids).eq('is_active', true)
        const active = new Set((data || []).map((r: any) => r.id))
        rv = rv.filter((x: any) => active.has(x.id))
        localStorage.setItem('_alpazar_rv', JSON.stringify(rv.slice(0, 8)))
      } catch { /* if validation fails, keep the de-duped cache */ }
      setRecentlyViewed(rv)
    })()
    saveRefFromUrl()
    // Seeded from SSR: listings + categories already present; only fetch the
    // extras (counts, shops) on mount. Otherwise do the full initial load.
    if (skipMountFetch.current) { fetchCounts(); fetchShops() } else { fetchAll() }

    // Rilexo kur tab bëhet aktiv sërish
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchListings(activeCategory, activeFilter, { silent: true })
        fetchCounts()
      }
    }
    document.addEventListener('visibilitychange', onVisible)

    // Rrjeti/bateria: useRealtimeTable tashme streamon insert/update/delete per
    // 'listings', dhe visibilitychange rifreskon kur kthehet perdoruesi. Polling-u
    // 10s ishte tepri (2 count(exact) — count-i me i shtrenjte ne Postgres — plus
    // nje refetch i plote qe ri-renderonte gjithe grid-in cdo 10s).
    const listingsPoll = setInterval(() => {
      fetchListings(activeCategory, activeFilter, { silent: true })
    }, 60000)
    // Statistikat ndryshojne ngadale — mjafton cdo 5 minuta.
    const countsPoll = setInterval(() => { fetchCounts() }, 300000)

    return () => {
      clearInterval(listingsPoll)
      clearInterval(countsPoll)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])


  useEffect(() => {
    if (skipMountFetch.current) { skipMountFetch.current = false; return }
    fetchListings()
  }, [activeCategory, activeFilter])

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

  async function fetchListings(catSlug = activeCategory, filter = activeFilter, opts?: { silent?: boolean }) {
    const reqId = ++listingsReqId.current
    if (!opts?.silent) setLoading(true) // poll/visibility: mos rifut skeleton-in
    let query = supabase
      .from('listings')
      .select('id,title,price,currency,condition,city,is_premium,rank_tier,images,category_id,created_at,user_id,business_id,views_count,author:user_id(id,full_name,username,avatar_url,is_premium,trust_score),business:business_id(id,name,logo_url,is_verified)')
      .eq('is_active', true)
      .order('rank_tier', { ascending: false })
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
    // Guard kundër race: apliko vetëm nëse ky është kërkimi më i fundit.
    if (reqId !== listingsReqId.current) return
    if (data) setListings(data as unknown as Listing[])
    if (!opts?.silent) setLoading(false)
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
    const q = searchQuery.trim()
    setShowSuggestions(false)
    if (!q) return fetchListings()
    window.location.href = `/search/results?q=${encodeURIComponent(q)}`
  }

  useEffect(() => {
    const q = searchQuery.trim()
    if (suggestTimer.current) clearTimeout(suggestTimer.current)
    if (q.length < 2) { setSuggestions([]); setShowSuggestions(false); return }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/fts?q=${encodeURIComponent(q)}`)
        if (!res.ok) { setSuggestions([]); setShowSuggestions(false); return }
        const json = await res.json()
        if (json.results?.length) { setSuggestions(json.results.slice(0, 5)); setShowSuggestions(true) }
        else { setSuggestions([]); setShowSuggestions(false) }
      } catch { setSuggestions([]); setShowSuggestions(false) }
    }, 280)
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current) }
  }, [searchQuery])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  useEffect(() => { setMounted(true) }, [])

  // `fmt` dhe `timeAgo` u zhvendosen te ListingCard bashke me karten — ishin
  // te vetmit perdorues te tyre ketu.

  const go = (path: string) => { window.location.href = path }

  const SHOP_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#06B6D4']

  // "Rishikimet e fundit" must not repeat listings already shown in the main
  // grid below (no "postime 2 fishta"), and never show the same id twice.
  const recentUnique = recentlyViewed.filter(
    (item, i, a) =>
      a.findIndex(x => x.id === item.id) === i &&
      !listings.some(l => l.id === item.id),
  )

  return (
    <>
      <Onboarding />
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;padding-bottom:80px;}
        /* Header */
        .header{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);position:sticky;top:0;z-index:50;box-shadow:0 6px 22px -8px rgba(190,130,0,.5),inset 0 1px 0 rgba(255,255,255,.4);border-bottom:1px solid rgba(255,255,255,.25);}
        .topbar{padding:10px 14px;display:flex;align-items:center;justify-content:space-between;}
        .logo{display:flex;align-items:center;gap:8px;cursor:pointer;}
        .brand{font-size:20px;font-weight:800;color:#111;letter-spacing:2px;text-shadow:0 1px 0 rgba(255,255,255,.3);}
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
        .searchbar{padding:0 12px 12px;display:flex;gap:8px;}
        .search-wrap{flex:1;background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 12px;gap:8px;border:1.5px solid rgba(0,0,0,.07);box-shadow:0 1px 4px rgba(0,0,0,.05);transition:border-color .2s ease,box-shadow .2s ease;}
        .search-wrap:focus-within{border-color:#E63312;box-shadow:0 6px 20px -6px rgba(230,51,18,.22);transform:translateY(-1px);}
        .search-wrap:focus-within i{color:#C42B0F;}
        .search-wrap i{font-size:15px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:10px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .search-btn{background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;border:none;border-radius:12px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(0,0,0,.4);transition:transform .15s ease,box-shadow .15s ease;}
        .search-btn:hover{transform:translateY(-1px);box-shadow:0 5px 14px -3px rgba(0,0,0,.5);}
        .search-btn:active{transform:translateY(0);}
        .search-suggestions{position:absolute;left:12px;right:12px;top:100%;background:#fff;border-radius:0 0 12px 12px;box-shadow:0 8px 24px rgba(0,0,0,.12);z-index:200;overflow:hidden;border:1.5px solid rgba(0,0,0,.08);border-top:none;}
        .sug-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background .1s;}
        .sug-item:hover{background:#FFFBEA;}
        .sug-img{width:38px;height:38px;border-radius:6px;object-fit:cover;flex-shrink:0;background:#f0e8d0;}
        .sug-title{font-size:13px;font-weight:600;color:#111;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sug-price{font-size:12px;font-weight:700;color:#C42B0F;white-space:nowrap;}
        /* Categories */
        .cat-scroll{display:flex;gap:8px;padding:0 12px 12px;overflow-x:auto;scroll-snap-type:x mandatory;}
        .cat-scroll::-webkit-scrollbar{display:none;}
        .cat-item{background:#fff;border-radius:20px;padding:6px 12px;display:flex;align-items:center;gap:5px;cursor:pointer;border:1.5px solid transparent;font-family:inherit;transition:all .15s;box-shadow:0 1px 4px rgba(0,0,0,.06);white-space:nowrap;flex-shrink:0;scroll-snap-align:start;}
        .cat-item:hover{border-color:#F5C84288;background:#FFFDF5;}
        .cat-item:active{transform:scale(.95);}
        .cat-item.active{background:linear-gradient(135deg,#1a1a1a,#000);border-color:#111;box-shadow:0 6px 16px -4px rgba(0,0,0,.35);transform:translateY(-1px);}
        .cat-item i{font-size:14px;color:#777;}
        .cat-item.active i{color:#F5C842;}
        .cat-item span{font-size:11px;color:#555;font-weight:600;}
        .cat-item.active span{color:#F5C842;font-weight:700;}
        /* Body */
        .body{padding:0 12px;}
        .no-ads{background:#EAF3DE;border:0.5px solid #97C459;border-radius:8px;padding:7px 12px;display:flex;align-items:center;gap:6px;margin-bottom:12px;}
        .no-ads i{font-size:13px;color:#3B6D11;}
        .no-ads span{font-size:9px;color:#3B6D11;font-weight:700;}
        /* Hero — premium (CSS-only, performant) */
        .hero{background:linear-gradient(155deg,#151517 0%,#101012 100%);border-radius:18px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;margin:0 0 12px;position:relative;overflow:hidden;box-shadow:0 10px 30px -10px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.04);}
        .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(120px 90px at 92% 40%,rgba(245,200,66,.05),transparent 70%);pointer-events:none;}
        .hero::after{content:'';position:absolute;top:0;left:-60%;width:50%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.06),transparent);transform:skewX(-18deg);animation:hero-sheen 7s ease-in-out infinite;pointer-events:none;}
        @keyframes hero-sheen{0%,74%{left:-60%}90%,100%{left:135%}}
        @keyframes hero-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
        .hero>div{position:relative;z-index:1;animation:hero-in .55s cubic-bezier(.2,.8,.2,1) both;}
        .hero h2{color:#F5C842;font-size:17px;font-weight:800;margin-bottom:5px;letter-spacing:-.2px;text-shadow:0 1px 2px rgba(0,0,0,.35);}
        .hero p{color:#9a9488;font-size:11px;line-height:1.55;}
        .hero-stats{display:flex;gap:0;flex-shrink:0;position:relative;z-index:1;}
        .stat{text-align:center;padding:0 14px;}
        .stat+.stat{border-left:1px solid rgba(245,200,66,.18);}
        .stat-n{color:#F5C842;font-size:20px;font-weight:800;line-height:1;letter-spacing:-.5px;}
        .stat-l{color:#8a8375;font-size:8px;margin-top:3px;text-transform:uppercase;letter-spacing:.6px;}
        @media (prefers-reduced-motion: reduce){.hero::after,.hero>div{animation:none;}}
        /* Trust row */
        .trust-row{display:flex;gap:8px;margin-bottom:16px;}
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
        .section-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
        .section-hdr h3{font-size:13px;font-weight:700;color:#111;}
        .section-hdr a{color:#C42B0F;font-size:11px;text-decoration:none;cursor:pointer;font-weight:600;}
        .shops-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:16px;}
        /* Kartat e bizneseve = madhësi e barabartë me kartat e shpalljeve: të njëjtat
           kolona responsive si .listings-grid (768→180px, 1024→220px) + media 4/3 e njëjtë. */
        @media(min-width:768px){.shops-grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));}}
        @media(min-width:1024px){.shops-grid{grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;}}
        @media(min-width:1440px){.shops-grid{grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:24px;}}
        .shop-mini{background:#fff;border-radius:14px;overflow:hidden;cursor:pointer;border:1px solid #eee;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 18px -12px rgba(0,0,0,.14);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s cubic-bezier(.2,.8,.2,1);display:flex;flex-direction:column;}
        .shop-mini:hover{transform:translateY(-3px);box-shadow:0 10px 24px -8px rgba(0,0,0,.2);}
        .shop-mini:active{transform:scale(.96);}
        .shop-top{flex:none;width:100%;aspect-ratio:4/3;display:flex;align-items:flex-end;padding:8px;position:relative;}
        .shop-av{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff;border:1.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.25);}
        .shop-prem{position:absolute;top:6px;right:6px;font-size:9px;background:#F5C842;color:#111;padding:3px 7px;border-radius:999px;font-weight:700;}
        .shop-info{flex:1 1 auto;padding:9px 10px 10px;display:flex;flex-direction:column;gap:3px;min-height:72px;}
        .shop-nm{font-size:13px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .shop-ct{font-size:11px;color:#6B6B6B;}
        /* Filter row */
        .filter-row{display:flex;gap:8px;margin-bottom:12px;overflow-x:auto;}
        .filter-row::-webkit-scrollbar{display:none;}
        .filter-btn{background:#fff;border:0.5px solid #ddd;border-radius:20px;padding:6px 13px;font-size:10px;color:#666;white-space:nowrap;flex-shrink:0;cursor:pointer;font-family:inherit;transition:all .12s;box-shadow:0 1px 3px rgba(0,0,0,.04);}
        .filter-btn:hover{border-color:#F5C842;color:#C42B0F;}
        .filter-btn.active{background:#111;border-color:#111;color:#F5C842;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);}
        /* Karta e shpalljes (.listing-card e me radhe) rri te
           app/ui-refine.css seksioni 8 — nje burim i vetem per kryefaqen,
           faqen e biznesit dhe profilin. Ketu mbeten vetem klasat qe i
           perkasin VETEM kryefaqes. */
        .empty-state{grid-column:1/-1;text-align:center;padding:36px 16px;background:linear-gradient(135deg,#f9f5e0,#f5f0d5);border:0.5px solid #eee;border-radius:13px;}
        .empty-state i{font-size:40px;color:#F5C842;display:block;margin-bottom:10px;}
        .empty-state h3{font-size:14px;font-weight:700;color:#555;margin-bottom:6px;}
        .empty-state p{font-size:11px;color:#aaa;line-height:1.6;margin-bottom:14px;}
        .empty-cta{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:10px;padding:10px 20px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}
        /* Premium CTA */
        .premium-cta{margin:0 0 16px;background:linear-gradient(135deg,#FFFBEA,#fff8d9);border:1.5px solid #F5C842;border-radius:14px;padding:10px 14px;display:flex;align-items:center;gap:12px;box-shadow:0 3px 12px rgba(245,200,66,.15);}
        .prem-icon{width:30px;height:30px;background:#F5C842;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .prem-icon i{font-size:15px;color:#111;}
        .prem-text strong{font-size:11px;font-weight:700;color:#111;display:block;}
        .prem-text span{font-size:9px;color:#888;}
        .prem-btn{background:#111;color:#F5C842;border:none;border-radius:8px;padding:8px 13px;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;margin-left:auto;}
        /* Bottom nav */
        .bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(15,15,15,.9);backdrop-filter:blur(16px) saturate(1.4);-webkit-backdrop-filter:blur(16px) saturate(1.4);padding:8px 6px 16px;display:flex;justify-content:space-around;align-items:center;z-index:100;box-shadow:0 -6px 26px rgba(0,0,0,.32);border-top:1px solid rgba(255,255,255,.06);}
        .nav-item{display:flex;flex-direction:column;align-items:center;gap:3px;color:#8a8a99;border:none;background:none;font-family:inherit;cursor:pointer;transition:color .2s;padding:4px 10px;border-radius:12px;position:relative;}
        .nav-item.active{color:#F5C842;}
        .nav-item.active::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(245,200,66,.1);border-radius:12px;}
        .nav-item i{font-size:22px;transition:transform .2s;}
        .nav-item.active i{transform:scale(1.12);}
        .nav-item span{font-size:10px;color:inherit;font-weight:600;}
        .nav-badge{position:absolute;top:2px;right:6px;background:#E63312;color:#fff;font-size:7px;font-weight:700;border-radius:10px;padding:1px 4px;min-width:14px;text-align:center;line-height:14px;}
        .nav-add{width:50px;height:50px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #111;margin-top:-18px;cursor:pointer;box-shadow:0 4px 16px rgba(230,51,18,.5);transition:transform .15s,box-shadow .15s;padding:0;appearance:none;}
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
        /* ── Etiketat e butonave lundrues (responsive me className) ── */
        .float-label{font-size:7px;color:#fff;font-weight:800;letter-spacing:.3px;line-height:1;}
        .float-icon-main{font-size:16px;color:#fff;}
        /* ── Navigimi desktop ── */
        .desk-nav{display:none;}
        .desk-nav-btn{background:rgba(0,0,0,.08);border:none;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:700;color:#111;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;white-space:nowrap;transition:background .15s;}
        .desk-nav-btn:hover{background:rgba(0,0,0,.16);}
        .desk-nav-btn.dn-active{background:rgba(0,0,0,.16);}
        .desk-nav-add{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:8px;padding:6px 13px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px;white-space:nowrap;transition:opacity .15s;box-shadow:0 2px 8px rgba(230,51,18,.3);}
        .desk-nav-add:hover{opacity:.88;}
        /* ── Responsive breakpoints (additive) ── */
        @media(min-width:768px){
          body{background:#FFFBEA;}
          .wrap{max-width:960px;padding-bottom:0;}
          .body{padding:0 24px;}
          .bottom-nav{display:none;}
          .desk-nav{display:flex;gap:3px;align-items:center;margin-right:6px;}
          /* pozicioni i share-float dhe install-float menaxhohet nga useDraggable (JS) */
          .share-float>button:first-of-type,.install-float>button:first-of-type{width:60px !important;height:60px !important;border-radius:50% !important;}
          .float-label{font-size:11px;}
          .float-icon-main{font-size:22px;}
        }
        @media(min-width:1024px){
          /* 100% full screen: wrap-i mbush gjithë gjerësinë e ekranit; padding-u
             anësor rritet me viewport-in. Rregull i artë (#4): gjithçka zmadhohet
             NË SINKRON — header, kërkim, kategori, hero, tituj, karta, banner-a —
             përndryshe do dukej si mobile e tejzgjatur nëpër ekran. */
          .wrap{max-width:100%;}
          .body{padding:0 clamp(32px,4vw,72px);}
          .topbar{padding:14px clamp(32px,4vw,72px);}
          .searchbar{padding:0 clamp(32px,4vw,72px) 14px;}
          .cat-scroll{padding:0 clamp(32px,4vw,72px) 14px;flex-wrap:wrap;}
          /* Header */
          .brand{font-size:24px;}
          .icon-btn{width:40px;height:40px;}
          .icon-btn i{font-size:20px;}
          /* Kërkimi */
          .search-wrap i{font-size:18px;}
          .search-wrap input{font-size:15px;padding:14px 0;}
          .search-btn{font-size:14px;padding:14px 24px;}
          /* Kategoritë */
          .cat-item{padding:9px 16px;}
          .cat-item i{font-size:16px;}
          .cat-item span{font-size:13px;}
          /* Hero */
          .hero{padding:26px 32px;border-radius:22px;margin-bottom:18px;}
          .hero h2{font-size:24px;}
          .hero p{font-size:14px;}
          .stat{padding:0 22px;}
          .stat-n{font-size:30px;}
          .stat-l{font-size:10px;}
          /* Tituj seksioni */
          .section-hdr h3{font-size:18px;}
          .section-hdr a{font-size:14px;}
          /* Kartat e bizneseve — në sinkron me kartat e shpalljeve */
          .shop-av{width:42px;height:42px;font-size:16px;}
          .shop-nm{font-size:15px;}
          .shop-ct{font-size:13px;}
          .shop-info{min-height:80px;padding:12px 13px 13px;}
          /* Banner-a & rreshta */
          .no-ads{padding:10px 16px;} .no-ads i{font-size:16px;} .no-ads span{font-size:12px;}
          .trust-card{padding:10px 12px;} .trust-card i{font-size:18px;} .trust-card span{font-size:11px;}
          .filter-btn{font-size:13px;padding:8px 16px;}
          .premium-cta{padding:14px 20px;border-radius:16px;}
          .prem-icon{width:38px;height:38px;} .prem-icon i{font-size:19px;}
          .prem-text strong{font-size:14px;} .prem-text span{font-size:12px;}
          .prem-btn{font-size:13px;padding:11px 18px;}
        }
        @media(min-width:1440px){
          .body{padding:0 clamp(56px,5vw,120px);}
          .topbar{padding-left:clamp(56px,5vw,120px);padding-right:clamp(56px,5vw,120px);}
          .searchbar{padding-left:clamp(56px,5vw,120px);padding-right:clamp(56px,5vw,120px);}
          .cat-scroll{padding-left:clamp(56px,5vw,120px);padding-right:clamp(56px,5vw,120px);}
          .brand{font-size:26px;}
          .hero h2{font-size:27px;}
          .stat-n{font-size:34px;}
          .section-hdr h3{font-size:20px;}
        }
      ` }} />

      <div className="wrap">
        <div className="header">
          <div className="topbar">
            <div role="link" tabIndex={0} className="logo" onClick={() => go('/')} onKeyDown={e => { if (e.key === 'Enter') go('/') }}>
              <AlpazarIcon />
              <span className="brand">{settings.site_name || 'ALPAZAR'}</span>
            </div>
            <div className="nav">
              {/* Navigim desktop — i fshehur në mobile me CSS */}
              <div className="desk-nav">
                <button type="button" className="desk-nav-btn dn-active" aria-current="page">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                  Kreu
                </button>
                <button type="button" className="desk-nav-btn" onClick={() => go('/search')}>
                  <i className="ti ti-search" aria-hidden="true" />Kërko
                </button>
                <button type="button" className="desk-nav-add" onClick={() => go(user ? '/listing/new' : '/auth/login')}>
                  <i className="ti ti-plus" aria-hidden="true" />Shto
                </button>
                <button type="button" className="desk-nav-btn" onClick={() => go(user ? '/messages' : '/auth/login')} style={{ position: 'relative' }}>
                  <i className="ti ti-message-circle" aria-hidden="true" />Mesazhe
                  {unreadCount > 0 && <span className="nav-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                <button type="button" className="desk-nav-btn" onClick={() => go(user ? '/profile' : '/auth/login')}>
                  <i className="ti ti-user-circle" aria-hidden="true" />
                  {authReady && user ? 'Profili' : 'Hyr'}
                </button>
              </div>
              {/* Njoftimet — GJITHMONË i dukshëm e funksional për përdoruesin e loguar
                  (më parë zhdukej kur s'kishte njoftime të palexuara, ose çonte gabimisht
                  te /messages). Tani: kambanë e qëndrueshme → /notifications; distinktivi
                  del vetëm kur ka të palexuara. Mesazhet kanë hyrjen e vet (bottom-nav + desk-nav). */}
              {user && (
                <button type="button" className="icon-btn" aria-label={unreadNotifications > 0 ? `Njoftime — ${unreadNotifications} të palexuara` : 'Njoftime'} onClick={() => go('/notifications')} style={{ position: 'relative' }}>
                  <i className={`ti ti-bell${unreadNotifications > 0 ? '-ringing' : ''}`} aria-hidden="true" />
                  {unreadNotifications > 0 && (
                    <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 2, background: '#E63312', color: '#fff', fontSize: 7, fontWeight: 700, borderRadius: 8, padding: '1px 3px', minWidth: 12, textAlign: 'center', lineHeight: '12px' }}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>
                  )}
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
                    <button type="button" className="user-chip" onClick={() => go('/profile')} aria-label="Profili im">
                      <span className="user-chip-av" style={{ overflow: 'visible' }}>
                        <Avatar src={profile?.avatar_url} name={nm} type="person" tier={tierNgaProfili(profile)} verified={(profile?.trust_score ?? 0) >= 60} size={28} />
                        <span className="user-chip-on" />
                      </span>
                      <span className="user-chip-txt">
                        <span className="user-chip-name">{nm}</span>
                        <span className="user-chip-lvl" style={{ color: lvl.color }}>
                          {profile?.is_premium ? <><span aria-hidden='true'>👑</span> Premium</> : <><span aria-hidden='true'>{lvl.icon}</span> {lvl.name}</>}
                        </span>
                      </span>
                    </button>
                  )
                })()
              ) : (
                <button type="button" className="login-btn" onClick={() => go('/auth/login')}>Hyr / Regjistrohu</button>
              )}
            </div>
          </div>

          <div ref={searchRef} style={{ position: 'relative' }}>
            <form className="searchbar" onSubmit={handleSearch} role="search" aria-label="Kërko shpallje">
              <div className="search-wrap">
                <i className="ti ti-search" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Kërko çdo gjë në Shqipëri..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  autoComplete="off"
                  aria-label="Kërko shpallje"
                />
              </div>
              <button type="submit" className="search-btn">Kërko</button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions">
                {suggestions.map(s => {
                  const img = Array.isArray(s.images) && s.images.length ? s.images[0] : null
                  const price = !s.price ? 'Falas' : s.currency === 'EUR' ? `${nf(s.price)} €` : `${nf(s.price)} L`
                  return (
                    <div key={s.id} className="sug-item" onMouseDown={() => { setShowSuggestions(false); window.location.href = `/listing/${s.id}` }}>
                      {img
                        ? <img src={img} alt="" className="sug-img" loading="lazy" />
                        : <div className="sug-img" style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }} aria-hidden="true">📦</div>
                      }
                      <span className="sug-title">{s.title}</span>
                      <span className="sug-price">{price}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="cat-scroll">
            <button type="button" className={`cat-item ${activeCategory === 'all' ? 'active' : ''}`} aria-pressed={activeCategory === 'all'} onClick={() => { setActiveCategory('all'); fetchListings('all', activeFilter) }}>
              <i className="ti ti-layout-grid" aria-hidden="true" />
              <span>Të gjitha</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`cat-item ${activeCategory === cat.slug ? 'active' : ''}`}
                aria-pressed={activeCategory === cat.slug}
                onClick={() => { setActiveCategory(cat.slug); fetchListings(cat.slug, activeFilter) }}
              >
                <i className={`ti ti-${cat.icon}`} aria-hidden="true" />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="body">
          <div className="no-ads">
            <i className="ti ti-ad-off" aria-hidden="true" />
            <span>Pa reklama — për të gjithë gjithmonë falas</span>
          </div>

          {/* 1. Hero — 40% më i shkurtër vertikalisht */}
          <div className="hero">
            <div>
              <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', margin: 0 }}>Alpazar — Treg Online Shqipëri</h1>
              <h2><span aria-hidden="true">🦅</span> {cfg('site_slogan', 'Shit · Bli · Bëj Pazrin Tënd')}</h2>
              <p><span style={{color: '#C42B0F',fontWeight:800}}>Platforma #1 shqiptare<br />e tregtisë online</span></p>
            </div>
            {(cfg('show_listing_count','true') !== 'false' || cfg('show_user_count','true') !== 'false') && (
              <div className="hero-stats">
                {cfg('show_listing_count','true') !== 'false' && (
                  <div className="stat">
                    <div className="stat-n">{nf(listingCount)}</div>
                    <div className="stat-l">Shpallje</div>
                  </div>
                )}
                {cfg('show_user_count','true') !== 'false' && (
                  <div className="stat">
                    <div className="stat-n">{nf(userCount)}</div>
                    <div className="stat-l">Përdorues</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Premium CTA — vendosur ku ishte AI asistenti */}
          <div className="premium-cta">
            <div className="prem-icon"><i className="ti ti-crown" aria-hidden="true" /></div>
            <div className="prem-text">
              <strong><span aria-hidden="true">👑</span> Bëhu Anëtar Premium</strong>
              <span>Biznes · Badge · Shpallje ∞ · {cfg('premium_monthly_price_all','') ? `${Number(cfg('premium_monthly_price_all','')).toLocaleString('sq-AL')} L/muaj` : ''}</span>
            </div>
            <button type="button" className="prem-btn" onClick={() => go('/premium')}>Shiko →</button>
          </div>

          {/* 3. Trust row */}
          <div className="trust-row">
            <div className="trust-card tc-green">
              <i className="ti ti-shield-check" aria-hidden="true" /><span>Shitës të verifikuar</span>
            </div>
            <div className="trust-card tc-blue">
              <i className="ti ti-star" aria-hidden="true" /><span>Vlerësime ⭐</span>
            </div>
            <div className="trust-card tc-red">
              <i className="ti ti-message-circle" aria-hidden="true" /><span>Chat live</span>
            </div>
          </div>

          {/* Shops section */}
          {shops.length > 0 && (
            <>
              <div className="section-hdr">
                <h3><span aria-hidden="true">🏢</span> Biznese Online</h3>
                <a role="button" tabIndex={0} onClick={() => go('/biznese')} onKeyDown={e => { if (e.key === 'Enter') go('/biznese') }} style={{ cursor: 'pointer' }}>Të gjitha →</a>
              </div>
              <div className="shops-grid">
                {shops.map((shop, idx) => {
                  const col = SHOP_COLORS[idx % SHOP_COLORS.length]
                  const initials = (shop.shop_name || shop.full_name || '?').slice(0, 2).toUpperCase()
                  return (
                    <div key={shop.id} role="link" tabIndex={0} className="shop-mini" onClick={() => go(`/biznese/${shop.id}`)} onKeyDown={e => { if (e.key === 'Enter') go(`/biznese/${shop.id}`) }}>
                      <div className="shop-top" style={{ background: `linear-gradient(135deg,${col}22,${col}44)` }}>
                        <div className="shop-av" style={{ background: 'transparent' }}>
                          <Avatar src={shop.avatar_url} name={shop.shop_name || shop.full_name} type="business" tier={tierNgaProfili(shop)} verified={shop.is_verified} size={40} />
                        </div>
                        <span className="shop-prem" aria-label="Premium">⭐</span>
                      </div>
                      <div className="shop-info">
                        <div className="shop-nm">{shop.shop_name || shop.full_name}</div>
                        <div className="shop-ct">{shop.city || 'Shqipëri'}</div>
                      </div>
                    </div>
                  )
                })}
                <div role="link" tabIndex={0} className="shop-mini" onClick={() => go('/biznese')} onKeyDown={e => { if (e.key === 'Enter') go('/biznese') }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px dashed #F5C842', cursor: 'pointer' }}>
                  <i className="ti ti-arrow-right" style={{ fontSize: 14, color: '#C42B0F' }} aria-hidden="true" />
                  <div style={{ fontSize: 7, color: '#C42B0F', fontWeight: 700, marginTop: 3, textAlign: 'center', padding: '0 4px' }}>Shiko të gjitha</div>
                </div>
              </div>
            </>
          )}

          {newListingBadge && (
            <div role="button" tabIndex={0} className="new-listing-toast" onClick={() => { fetchListings(); setNewListingBadge(false) }} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { fetchListings(); setNewListingBadge(false) } }}>
              <i className="ti ti-sparkles" style={{ fontSize: 14, color: '#3B6D11' }} aria-hidden="true" />
              <span>Shpallje e re u shtua — klikoni për të rifreskuar</span>
            </div>
          )}

          <div className="filter-row">
            {[
              { id: 'all', label: 'Të gjitha' },
              { id: 'new', label: '🆕 I ri' },
              { id: 'used', label: 'I përdorur' },
              { id: 'premium', label: <><span aria-hidden='true'>⭐</span> Premium</> },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                className={`filter-btn ${activeFilter === f.id ? 'active' : ''}`}
                aria-pressed={activeFilter === f.id}
                onClick={() => { setActiveFilter(f.id); fetchListings(activeCategory, f.id) }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="section-hdr">
            <h3><span aria-hidden="true">🔥</span> Shpallje të fundit</h3>
            <a role="button" tabIndex={0} onClick={() => { setActiveCategory('all'); fetchListings('all', 'all') }} onKeyDown={e => { if (e.key === 'Enter') { setActiveCategory('all'); fetchListings('all', 'all') } }} style={{ cursor: 'pointer' }}>Të gjitha →</a>
          </div>

          {/* Recently viewed listings */}
          {recentUnique.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111' }}><span aria-hidden="true">👁</span> Rishikimet e fundit</h3>
                <button type="button" onClick={() => { localStorage.removeItem('_alpazar_rv'); setRecentlyViewed([]) }} style={{ background: 'none', border: 'none', fontSize: 10, color: '#aaa', cursor: 'pointer', fontFamily: 'inherit' }}>Pastro</button>
              </div>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                {recentUnique.map(item => {
                  const price = item.currency === 'EUR'
                    ? `€${nf(item.price)}`
                    : `${nf(item.price)} L`
                  return (
                    <div key={item.id} role="link" tabIndex={0} onClick={() => { window.location.href = `/listing/${item.id}` }} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${item.id}` }} style={{ flex: '0 0 120px', borderRadius: 10, overflow: 'hidden', background: '#fff', border: '1px solid #F0F0F0', boxShadow: '0 1px 4px rgba(0,0,0,.06)', cursor: 'pointer' }}>
                      <div style={{ width: '100%', aspectRatio: '4/3', background: '#F6F6F6', overflow: 'hidden' }}>
                        {item.img
                          ? <img src={item.img} alt={item.title} loading="lazy" width={120} height={90} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><i className="ti ti-photo" style={{ fontSize: 20, color: '#ccc' }} aria-hidden="true" /></div>
                        }
                      </div>
                      <div style={{ padding: '6px 8px' }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#111', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3, marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#C42B0F' }}>{price}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 6. Shpalljet — -30% madhësi */}
          {loading ? (
            <SkeletonGrid count={6} />
          ) : (
            <div className="listings-grid">
              {listings.length === 0 ? (
                <div className="empty-state">
                  <i className="ti ti-mood-empty" aria-hidden="true" />
                  <h3>Nuk ka shpallje aktualisht</h3>
                  <p>Bëhu i pari që shton!<br />Regjistrimi është falas.</p>
                  <button type="button" className="empty-cta" onClick={() => go(user ? '/listing/new' : '/auth/login')}>
                    + Shto shpallje falas
                  </button>
                </div>
              ) : (
                listings.map((listing, idx) => (
                  <ListingCard key={listing.id} listing={listing as any} index={idx} mounted={mounted} />
                ))
              )}
            </div>
          )}

          {listings.length >= 20 && (
            <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
              <button
                type="button"
                onClick={() => go('/search')}
                style={{ background: '#111', color: '#F5C842', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <><span aria-hidden="true">🔍</span> Eksploro të gjitha shpalljet →</>
              </button>
            </div>
          )}

        </div>

        <nav className="bottom-nav" aria-label="Navigimi kryesor">
          <button type="button" className="nav-item active" aria-current="page">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span>Kreu</span>
          </button>
          <button type="button" className="nav-item" onClick={() => go('/search')}>
            <i className="ti ti-search" aria-hidden="true" /><span>Kërko</span>
          </button>
          <button type="button" className="nav-add" aria-label="Shto shpallje të re" onClick={() => go(user ? '/listing/new' : '/auth/login')}>
            <i className="ti ti-plus" aria-hidden="true" />
          </button>
          <button type="button" className="nav-item" onClick={() => go(user ? '/messages' : '/auth/login')} style={{ position: 'relative' }} aria-label={unreadCount > 0 ? `Mesazhe (${unreadCount > 9 ? '9+' : unreadCount} të palexuara)` : 'Mesazhe'}>
            <i className="ti ti-message-circle" aria-hidden="true" />
            {unreadCount > 0 && <span className="nav-badge" aria-hidden="true">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            <span aria-hidden="true">Mesazhe</span>
          </button>
          <button type="button" className="nav-item" onClick={() => go(user ? '/profile' : '/auth/login')} style={{ position: 'relative' }}>
            <i className="ti ti-user-circle" aria-hidden="true" />
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

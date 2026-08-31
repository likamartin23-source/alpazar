'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { SkeletonGrid } from '../../components/Skeleton'
import ListingCard from '../../components/ListingCard'
import { LISTING_SELECT } from '../../../lib/listingSelect'

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

// Select-i i vetem per listat e shpalljeve — i njejti te kerkimi fillestar
// (buildQb) dhe te "Shiko me shume" (loadMore), qe kartat te mos divergjojne
// brenda te njejtes liste (badge VIP, overlay SHITUR, chip biznes/person).
// LISTING_SELECT vjen nga lib/listingSelect (një projeksion identiteti për të gjitha feed-et).

function ShopCard({ shop }: { shop: any }) {
  const initials = (shop.shop_name || shop.full_name || '?').slice(0, 2).toUpperCase()
  const catLabel = SHOP_CATEGORIES.find(c => c.id === shop.shop_category)?.label

  return (
    <a className="shop-card" href={`/biznese/${shop.id}`}>
      <div className="shop-banner" style={{
        background: shop.shop_banner_url
          ? `url(${shop.shop_banner_url}) center/cover`
          : 'linear-gradient(135deg, #F5C84222, #F5C84244)'
      }}>
        <div className="shop-avatar">
          {shop.avatar_url
            ? <img src={shop.avatar_url} alt={shop.shop_name} loading="lazy" width={60} height={60} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : <span style={{ fontSize: 17, fontWeight: 700, color: '#C42B0F' }}>{initials}</span>
          }
        </div>
        <div className="shop-premium-badge"><span aria-hidden="true">⭐</span> Premium</div>
      </div>
      <div className="shop-body">
        <div className="shop-name">{shop.shop_name || shop.full_name}</div>
        {catLabel && <div className="shop-cat-tag">{catLabel}</div>}
        <div className="shop-meta">
          <span className="shop-city"><i className="ti ti-map-pin" style={{ fontSize: 10 }} aria-hidden="true" /> {shop.city || 'Shqipëri'}</span>
          <span className="shop-count">{shop.listing_count || 0} shpallje</span>
        </div>
      </div>
    </a>
  )
}

export default function SearchResultsPage() {
  const [q, setQ]                   = useState('')
  const [catFilter, setCatFilter]   = useState('')
  const [condFilter, setCondFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [priceMin, setPriceMin]     = useState('')
  const [priceMax, setPriceMax]     = useState('')
  const [premiumOnly, setPremiumOnly] = useState(false)

  const [shops, setShops]           = useState<any[]>([])
  const [premium, setPremium]       = useState<any[]>([])
  const [regular, setRegular]       = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
const [searchError, setSearchError] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [savedOk, setSavedOk]         = useState(false)
  const [saveErr, setSaveErr]         = useState(false)
  const searchReqId = useRef(0)
  const [userId, setUserId]           = useState<string | null>(null)
  const [sortBy, setSortBy]           = useState('newest')

  const [activeFilterCount, setActiveFilterCount] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [regularOffset, setRegularOffset] = useState(0)
  const [showScrollTop, setShowScrollTop] = useState(false)
  // `timeAgo` te ListingCard varet nga Date.now(); jepet vetem pas montimit
  // per te shmangur mospershtatje hidratimi.
  const [mounted, setMounted] = useState(false)
  // "Afer meje" (Faza 7c): mode i vecante, i nisur nga perdoruesi. Vendndodhja
  // merret nga shfletuesi (pelqim) dhe kalon vetem si parametra te RPC-se
  // listings_near — nuk ruhet asgje ne server (privatesi, Ligji 124/2024).
  const [nearMode, setNearMode]   = useState(false)
  const [nearBusy, setNearBusy]   = useState(false)
  const [nearErr, setNearErr]     = useState('')
  const [nearList, setNearList]   = useState<any[]>([])

  useEffect(() => { setMounted(true) }, [])

  // Show/hide scroll-to-top button
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Load user id for save search
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id)
    })
  }, [])

  async function saveSearch() {
    if (!userId) { window.location.href = '/auth/login'; return }
    const filters: Record<string, string> = {}
    if (catFilter) filters.cat = catFilter
    if (condFilter) filters.cond = condFilter
    if (cityFilter) filters.city = cityFilter
    if (priceMin) filters.priceMin = priceMin
    if (priceMax) filters.priceMax = priceMax
    if (premiumOnly) filters.prem = '1'
    const { error } = await supabase.from('saved_searches').insert({
      user_id: userId, query: q || null, filters, notify: true
    })
    if (!error) {
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } else {
      setSaveErr(true)
      setTimeout(() => setSaveErr(false), 3000)
    }
  }

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
    const premp = params.get('prem') === '1'
    const sortp = params.get('sort') || 'newest'

    setQ(qp)
    setCatFilter(catp)
    setCondFilter(condp)
    setCityFilter(cityp)
    setPriceMin(pminp)
    setPriceMax(pmaxp)
    setPremiumOnly(premp)
    setSortBy(sortp)

    doSearch(qp, catp, condp, cityp, pminp, pmaxp, premp, sortp)
  }, [])

  useEffect(() => {
    let n = 0
    if (catFilter)            n++
    if (condFilter)           n++
    if (cityFilter)           n++
    if (priceMin)             n++
    if (priceMax)             n++
    if (premiumOnly)          n++
    if (sortBy !== 'newest')  n++
    setActiveFilterCount(n)
  }, [catFilter, condFilter, cityFilter, priceMin, priceMax, premiumOnly, sortBy])

  // Ref-i i filtrave aktualë — që handler-i realtime i INSERT-it të lexojë gjendjen e tanishme
  // (jo atë të kapur në closure kur u abonua). Përditësohet në çdo render.
  const filtersRef = useRef({ q, catFilter, condFilter, cityFilter, priceMin, priceMax, premiumOnly, sortBy })
  filtersRef.current = { q, catFilter, condFilter, cityFilter, priceMin, priceMax, premiumOnly, sortBy }

  // A i përshtatet një shpallje e re filtrave aktualë? Konservativ: kthen false kur s'jemi të
  // sigurt (p.sh. filtër kategorie i vendosur — shmang përputhje id/slug të gabuar). Zero false-pozitive.
  function matchesCurrentSearch(r: any): boolean {
    const f = filtersRef.current
    if (!r || r.is_active === false) return false
    if (f.sortBy !== 'newest') return false          // pozicioni i saktë s'dihet pa rirenditje
    if (f.catFilter) return false                    // shmang paqartësinë id↔slug — del në refresh
    const qq = (f.q || '').trim().toLowerCase()
    if (qq && !String(r.title || '').toLowerCase().includes(qq)) return false
    if (f.condFilter && r.condition !== f.condFilter) return false
    if (f.cityFilter && !String(r.city || '').toLowerCase().includes(f.cityFilter.trim().toLowerCase())) return false
    if (f.priceMin && Number(r.price) < Number(f.priceMin)) return false
    if (f.priceMax && Number(r.price) > Number(f.priceMax)) return false
    if (f.premiumOnly && !r.is_premium) return false
    return true
  }

  // Realtime: shto (INSERT) + përditëso/hiq (UPDATE/DELETE) premium + regular
  useEffect(() => {
    if (!premium.length && !regular.length) return
    const ch = supabase
      .channel('results-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, async (payload) => {
        const row = payload.new as any
        if (!matchesCurrentSearch(row)) return
        // Merr projeksionin e plotë (payload-i s'ka join biznes/autor) pastaj vëre në krye.
        let full: any = row
        try { const { data } = await supabase.from('listings').select(LISTING_SELECT).eq('id', row.id).maybeSingle(); if (data) full = data } catch { /* fail-soft */ }
        if (full.is_premium) setPremium(prev => prev.some(l => l.id === full.id) ? prev : [full, ...prev])
        else setRegular(prev => prev.some(l => l.id === full.id) ? prev : [full, ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'listings' }, (payload) => {
        const n = payload.new as any
        // Kanali s'ka filter → ndizet për ÇDO UPDATE të listings site-wide (përfshi increment_listing_views
        // në çdo hapje shpalljeje, kurthi #7). GUARD brenda updater-it: kthe TË NJËJTIN prev kur rreshti
        // s'është në listë → React bën bail-out, pa re-render të faqes. (Pa closure të vjetruar.)
        const patch = (prev: any[], keep: boolean) => {
          const i = prev.findIndex(l => l.id === n.id)
          if (i < 0) return prev                                   // jashtë listës → pa ndryshim
          if (!keep) return prev.filter(l => l.id !== n.id)        // joaktive, ose kaloi te lista tjetër
          return prev.map(l => l.id === n.id ? { ...l, ...n } : l) // patch në vend
        }
        const active = !!n.is_active
        setPremium(prev => patch(prev, active && !!n.is_premium))
        setRegular(prev => patch(prev, active && !n.is_premium))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'listings' }, (payload) => {
        const id = (payload.old as any).id
        setPremium(prev => prev.findIndex(l => l.id === id) < 0 ? prev : prev.filter(l => l.id !== id))
        setRegular(prev => prev.findIndex(l => l.id === id) < 0 ? prev : prev.filter(l => l.id !== id))
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
    premOnly = premiumOnly,
    sort     = sortBy,
  ) {
    const reqId = ++searchReqId.current // guard kundër race të kërkimeve paralele
    setLoading(true)
    setSearchError(false)
    try {

    // ── 1) SHOPS — skip if premiumOnly (shops are always premium) ──
    let shopResults: any[] = []
    if (!premOnly) {
      let qb = supabase
        .from('profiles')
        .select('id,full_name,username,avatar_url,city,bio,is_premium,premium_expires_at,shop_name,shop_description,shop_category,shop_banner_url')
        .eq('is_premium', true)
        // NDERO skadimin: përjashto premium-in e skaduar edhe para se cron-i ta fikë flamurin.
        .or(`premium_expires_at.is.null,premium_expires_at.gt.${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (query.trim()) {
        qb = (qb as any).or(`shop_name.ilike.%${query}%,full_name.ilike.%${query}%,city.ilike.%${query}%`)
      }
      if (city.trim()) qb = (qb as any).ilike('city', `%${city.trim()}%`)

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
    if (reqId !== searchReqId.current) return // erdhi një kërkim më i ri
    setShops(shopResults)

    // ── 2 + 3) LISTINGS — FTS GIN ───────────────────────────
    const sortOrder: { col: string; asc: boolean } =
      sort === 'price_asc'  ? { col: 'price',        asc: true  } :
      sort === 'price_desc' ? { col: 'price',        asc: false } :
      sort === 'views'      ? { col: 'views_count',  asc: false } :
                              { col: 'created_at',   asc: false }

    const buildQb = (isPrem: boolean) => {
      let qb = supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('is_active', true)
        .eq('is_premium', isPrem)
        .order(sortOrder.col, { ascending: sortOrder.asc })
        .limit(40)

      if (query.trim()) qb = (qb as any).textSearch('fts', query.trim(), { type: 'websearch', config: 'simple' })
      if (cat)         qb = qb.eq('category_id', cat)
      if (cond)        qb = qb.eq('condition', cond)
      if (city.trim()) qb = (qb as any).ilike('city', `%${city.trim()}%`)
      if (pMin)        qb = qb.gte('price', parseFloat(pMin))
      if (pMax)        qb = qb.lte('price', parseFloat(pMax))
      return qb
    }

    const PAGE = 40
    if (premOnly) {
      const premRes = await buildQb(true)
      if (reqId !== searchReqId.current) return
      setPremium(premRes.data || [])
      setRegular([])
      setHasMore(false)
    } else {
      const [premRes, regRes] = await Promise.all([
        buildQb(true),
        buildQb(false),
      ])
      if (reqId !== searchReqId.current) return
      setPremium(premRes.data || [])
      setRegular(regRes.data || [])
      setHasMore((regRes.data?.length ?? 0) >= PAGE)
    }
    setRegularOffset(0)
    } catch {
      setSearchError(true)
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    setLoadingMore(true)
    const PAGE = 40
    const nextOffset = regularOffset + PAGE
    let qb = supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('is_active', true)
      .eq('is_premium', false)
      .range(nextOffset, nextOffset + PAGE - 1)

    const sortOrder: { col: string; asc: boolean } =
      sortBy === 'price_asc'  ? { col: 'price',       asc: true  } :
      sortBy === 'price_desc' ? { col: 'price',       asc: false } :
      sortBy === 'views'      ? { col: 'views_count', asc: false } :
                                { col: 'created_at',  asc: false }
    qb = qb.order(sortOrder.col, { ascending: sortOrder.asc })

    if (q.trim())         qb = (qb as any).textSearch('fts', q.trim(), { type: 'websearch', config: 'simple' })
    if (catFilter)        qb = qb.eq('category_id', catFilter)
    if (condFilter)       qb = qb.eq('condition', condFilter)
    if (cityFilter.trim()) qb = (qb as any).ilike('city', `%${cityFilter.trim()}%`)
    if (priceMin)         qb = qb.gte('price', parseFloat(priceMin))
    if (priceMax)         qb = qb.lte('price', parseFloat(priceMax))

    const { data } = await qb
    if (data?.length) {
      setRegular(prev => [...prev, ...data])
      setHasMore(data.length >= PAGE)
      setRegularOffset(nextOffset)
    } else {
      setHasMore(false)
    }
    setLoadingMore(false)
  }

  function applyFilters() {
    setFiltersOpen(false)
    const url = new URL(window.location.href)
    if (catFilter)          url.searchParams.set('cat',  catFilter);  else url.searchParams.delete('cat')
    if (condFilter)         url.searchParams.set('cond', condFilter); else url.searchParams.delete('cond')
    if (cityFilter)         url.searchParams.set('city', cityFilter); else url.searchParams.delete('city')
    if (priceMin)           url.searchParams.set('pmin', priceMin);   else url.searchParams.delete('pmin')
    if (priceMax)           url.searchParams.set('pmax', priceMax);   else url.searchParams.delete('pmax')
    if (premiumOnly)        url.searchParams.set('prem', '1');        else url.searchParams.delete('prem')
    if (sortBy !== 'newest') url.searchParams.set('sort', sortBy);    else url.searchParams.delete('sort')
    window.history.replaceState(null, '', url.toString())
    doSearch(q, catFilter, condFilter, cityFilter, priceMin, priceMax, premiumOnly, sortBy)
  }

  function clearFilters() {
    setCatFilter(''); setCondFilter(''); setCityFilter(''); setPriceMin(''); setPriceMax(''); setPremiumOnly(false); setSortBy('newest')
    const url = new URL(window.location.href)
    url.searchParams.delete('cat');  url.searchParams.delete('cond')
    url.searchParams.delete('city'); url.searchParams.delete('pmin')
    url.searchParams.delete('pmax'); url.searchParams.delete('prem')
    url.searchParams.delete('sort')
    window.history.replaceState(null, '', url.toString())
    doSearch(q, '', '', '', '', '', false, 'newest')
  }

  // Toggle i "Afer meje": kërkon vendndodhjen, thërret RPC-në, pastaj merr
  // kartat e plota (LISTING_SELECT) dhe i rendit sipas distances. Pa leje ose
  // pa rezultat → mesazh i qartë, pa e prishur kërkimin normal.
  function toggleNear() {
    if (nearMode) { setNearMode(false); setNearErr(''); return }
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setNearErr('Shfletuesi nuk e mbështet vendndodhjen.'); return
    }
    setNearBusy(true); setNearErr('')
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          const { latitude, longitude } = pos.coords
          const { data: near } = await supabase.rpc('listings_near', { p_lat: latitude, p_lng: longitude, p_radius_km: 25, p_limit: 60 })
          const rows = (near || []) as { id: string; distance_km: number }[]
          if (rows.length === 0) { setNearList([]); setNearMode(true); return }
          const dist = new Map(rows.map(r => [r.id, r.distance_km]))
          const { data: full } = await supabase.from('listings').select(LISTING_SELECT).in('id', rows.map(r => r.id))
          const ordered = (full || [])
            .map((l: any) => ({ ...l, _dist: dist.get(l.id) }))
            .sort((a: any, b: any) => (a._dist ?? 1e9) - (b._dist ?? 1e9))
          setNearList(ordered); setNearMode(true)
        } catch { setNearErr('Nuk u ngarkuan shpalljet afër teje.') }
        finally { setNearBusy(false) }
      },
      () => { setNearErr('Nuk u dha leje për vendndodhjen.'); setNearBusy(false) },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    )
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
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;padding-bottom:80px;}

        /* Topbar */
        .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 12px;display:flex;align-items:center;gap:8px;position:sticky;top:0;z-index:50;box-shadow:0 4px 16px -8px rgba(190,130,0,.4);}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .back i{font-size:18px;color:#111;}
        .search-wrap{flex:1;background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 11px;gap:8px;border:0.5px solid #e0b030;transition:border-color .15s ease,box-shadow .15s ease;}
        .search-wrap:focus-within{border-color:#111;box-shadow:0 4px 16px -4px rgba(0,0,0,.2);}
        .search-wrap i{font-size:14px;color:#bbb;}
        .search-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-wrap input::placeholder{color:#bbb;}
        .filter-btn{position:relative;width:36px;height:36px;background:rgba(0,0,0,.1);border:none;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .filter-btn i{font-size:17px;color:#111;}
        .filter-badge{position:absolute;top:-3px;right:-3px;width:16px;height:16px;background:#E63312;border-radius:50%;font-size:9px;font-weight:700;color:#fff;display:flex;align-items:center;justify-content:center;border:2px solid #F5C842;}

        /* Category chips */
        .cats{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;background:#fff;border-bottom:1px solid #f0f0f0;}
        .cats::-webkit-scrollbar{display:none;}
        .cb{background:#f5f5f5;border:none;border-radius:999px;padding:5px 12px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;white-space:nowrap;transition:background .15s ease,color .15s ease;}
        .cb.on{background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;}

        /* Active filters */
        .active-filters{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px;background:#fff;border-bottom:1px solid #ececec;}
        .afilter{display:flex;align-items:center;gap:5px;background:#FFF8EE;border:1px solid #e0b030;border-radius:999px;padding:3px 10px;font-size:10px;font-weight:600;color:#856404;}

        /* Body */
        .body{padding:12px 10px;}
        .results-meta{font-size:11px;color:#6B6B6B;margin-bottom:14px;}
        .results-meta strong{color:#111;}

        /* Section headings */
        .section{margin-bottom:20px;}
        .section-hdr{display:flex;align-items:center;gap:7px;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #F5C842;}
        .section-hdr .section-icon{font-size:16px;}
        .section-hdr h2{font-size:13px;font-weight:800;color:#111;flex:1;}
        .section-count{font-size:10px;color:#6B6B6B;background:#f5f5f0;border-radius:20px;padding:2px 8px;}

        /* Shop grid */
        .shops-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
        .shop-card{background:#fff;border:0.5px solid #ececec;border-radius:12px;overflow:hidden;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04),0 6px 16px -10px rgba(0,0,0,.14);transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s cubic-bezier(.2,.8,.2,1);text-decoration:none;color:inherit;display:block;}
        .shop-card:hover{transform:translateY(-3px);box-shadow:0 10px 24px -8px rgba(0,0,0,.2);}
        .shop-card:active{transform:scale(.97);}
        .shop-banner{height:56px;position:relative;display:flex;align-items:flex-end;padding:6px;}
        .shop-avatar{width:40px;height:40px;border-radius:50%;background:#fff;border:2.5px solid #F5C842;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,.12);}
        .shop-premium-badge{position:absolute;top:5px;right:6px;background:#F5C842;color:#111;font-size:7.5px;padding:2px 5px;border-radius:8px;font-weight:700;}
        .shop-body{padding:7px 9px 9px;}
        .shop-name{font-size:11.5px;font-weight:700;color:#111;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .shop-cat-tag{font-size:9px;color:#C42B0F;font-weight:600;margin-bottom:4px;}
        .shop-meta{display:flex;align-items:center;justify-content:space-between;}
        .shop-city{font-size:9px;color:#aaa;display:flex;align-items:center;gap:2px;}
        .shop-count{font-size:9px;color:#C42B0F;font-weight:700;}

        /* Kartat e shpalljeve: stilet vijne nga app/ui-refine.css (§8), i njejti
           ListingCard i perbashket si kudo. Rregullat lokale u hoqen qe kjo faqe
           te mos divergjoje me kryefaqen/profilin/biznesin. Grid-i i njesuar. */

        /* Empty state per section */
        .section-empty{text-align:center;padding:16px;background:#f9f9f7;border-radius:10px;color:#555;font-size:11px;}

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
        .cond-row{display:flex;gap:6px;flex-wrap:wrap;}
        .cond-btn{flex:1;min-width:70px;border:1.5px solid #ddd;border-radius:9px;padding:8px 6px;font-size:11px;font-weight:600;cursor:pointer;background:#fff;font-family:inherit;color:#555;text-align:center;white-space:nowrap;}
        .cond-btn.active{border-color:#E63312;background:#FFF0EE;color:#C42B0F;}
        .fp-actions{display:flex;gap:8px;margin-top:6px;}
        .fp-apply{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:11px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .fp-clear{background:#f5f5f5;color:#555;border:none;border-radius:11px;padding:13px 18px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}

        @keyframes ai-fade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        .section{animation:ai-fade .25s ease;}
      ` }} />

      <div className="wrap">
        {/* ── TOP BAR ── */}
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu te kërkimi" onClick={() => window.location.href = '/search'}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <form className="search-wrap" role="search" aria-label="Kërko shpallje" onSubmit={newSearch} style={{ flex: 1 }}>
            <i className="ti ti-search" aria-hidden="true" />
            <input
              type="search"
              placeholder="Kërko çdo gjë..."
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </form>
          <button type="button" className="filter-btn" aria-label="Hap filtrat" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(true)}>
            <i className="ti ti-adjustments-horizontal" aria-hidden="true" />
            {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
        </div>

        {/* ── CATEGORY CHIPS ── */}
        <div className="cats">
          <button type="button" aria-pressed={nearMode} className={`cb ${nearMode ? 'on' : ''}`}
            onClick={toggleNear} disabled={nearBusy} aria-label="Shpallje afër meje">
            <span aria-hidden="true">📍</span> {nearBusy ? 'Duke gjetur…' : 'Afër meje'}
          </button>
          <button type="button" aria-pressed={!catFilter} className={`cb ${!catFilter ? 'on' : ''}`}
            onClick={() => { setCatFilter(''); doSearch(q, '', condFilter, cityFilter, priceMin, priceMax) }}>
            Të gjitha
          </button>
          {categories.map(c => (
            <button key={c.id}
              type="button"
              aria-pressed={catFilter === c.id}
              className={`cb ${catFilter === c.id ? 'on' : ''}`}
              onClick={() => { setCatFilter(c.id); doSearch(q, c.id, condFilter, cityFilter, priceMin, priceMax) }}>
              {c.name}
            </button>
          ))}
        </div>

        {nearErr && (
          <div role="alert" style={{ padding: '8px 12px', fontSize: 12, color: '#C42305', background: '#FFF0EE', borderBottom: '1px solid #F5C5BC' }}>
            {nearErr}
          </div>
        )}

        {/* ── ACTIVE FILTERS BAR ── */}
        {activeFilterCount > 0 && (
          <div className="active-filters">
            {catFilter              && <span className="afilter"><span aria-hidden="true">🏷</span> {categories.find(c => c.id === catFilter)?.name || catFilter}</span>}
            {condFilter             && <span className="afilter">{condFilter === 'i_ri' ? <><span aria-hidden="true">✨</span> I ri</> : condFilter === 'i_mire' ? <><span aria-hidden="true">👍</span> I mirë</> : <><span aria-hidden="true">🔄</span> I përdorur</>}</span>}
            {cityFilter             && <span className="afilter"><span aria-hidden="true">📍</span> {cityFilter}</span>}
            {priceMin               && <span className="afilter">Min: {priceMin} L</span>}
            {priceMax               && <span className="afilter">Max: {priceMax} L</span>}
            {premiumOnly            && <span className="afilter"><span aria-hidden="true">⭐</span> Premium</span>}
            {sortBy === 'price_asc' && <span className="afilter">↑ Çmimi</span>}
            {sortBy === 'price_desc'&& <span className="afilter">↓ Çmimi</span>}
            {sortBy === 'views'     && <span className="afilter"><span aria-hidden="true">👁</span> Shikimet</span>}
          </div>
        )}

        {/* ── BODY ── */}
        <div className="body">
          {searchError ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 36 }} aria-hidden="true">⚠️</div>
              <div style={{ fontWeight: 700, color: '#111' }}>Gabim gjatë kërkimit</div>
              <button type="button" onClick={() => doSearch()} style={{ background: '#F5C842', border: 'none', borderRadius: 24, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Provo Përsëri</button>
            </div>
          ) : loading ? (
            <SkeletonGrid count={6} />
          ) : nearMode ? (
            <>
              <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>Shpallje afër teje</h1>
              <div className="results-meta">
                <span aria-live="polite"><span aria-hidden="true">📍</span> <strong>{nearList.length}</strong> shpallje afër teje (deri 25 km)</span>
              </div>
              {nearList.length === 0 ? (
                <div className="section-empty">Nuk u gjet asnjë shpallje afër teje. Provo më vonë ose kërko normalisht.</div>
              ) : (
                <div className="listings-grid">
                  {nearList.map((l, i) => <ListingCard key={l.id} listing={l} index={i} mounted={mounted} />)}
                </div>
              )}
            </>
          ) : (
            <>
              <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
                {q ? `Rezultatet e kërkimit për "${q}"` : 'Rezultatet e kërkimit'}
              </h1>
              <div className="results-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span aria-live="polite" aria-atomic="true">
                  {q
                    ? <>Rezultate për <strong>"{q}"</strong> — <strong>{totalResults}</strong> gjëra</>
                    : <><strong>{totalResults}</strong> shpallje</>
                  }
                </span>
                {(q || activeFilterCount > 0) && (
                  <button
                    type="button"
                    onClick={saveSearch}
                    aria-label="Ruaj këtë kërkim"
                    style={{
                      background: savedOk ? '#10B981' : '#fff',
                      color: savedOk ? '#fff' : '#C42305',
                      border: `1.5px solid ${savedOk ? '#10B981' : '#C42305'}`,
                      borderRadius: 20, padding: '3px 10px', fontSize: 10,
                      fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      transition: 'all .2s',
                    }}
                  >
                    <i className={`ti ti-bell${savedOk ? '-ringing' : ''}`} aria-hidden="true" style={{ fontSize: 11 }} />
                    {savedOk ? '✓ Ruajtur!' : saveErr ? '✕ Provo sërish' : 'Ruaj'}
                  </button>
                )}
              </div>

              {/* ── SECTION 1: SHOPS ── */}
              <div className="section">
                <div className="section-hdr">
                  <span className="section-icon" aria-hidden="true">🏪</span>
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
                  <span className="section-icon" aria-label="Premium">⭐</span>
                  <h2>Shpallje Premium</h2>
                  <span className="section-count">{premium.length}</span>
                </div>
                {premium.length === 0 ? (
                  <div className="section-empty">Nuk ka shpallje premium{q ? ` për "${q}"` : ''}</div>
                ) : (
                  <div className="listings-grid">
                    {premium.map((l, i) => <ListingCard key={l.id} listing={l} index={i} mounted={mounted} />)}
                  </div>
                )}
              </div>

              {/* ── SECTION 3: ALL OTHER LISTINGS ── */}
              <div className="section">
                <div className="section-hdr">
                  <span className="section-icon" aria-hidden="true">📋</span>
                  <h2>Të gjitha shpalljet</h2>
                  <span className="section-count">{regular.length}</span>
                </div>
                {regular.length === 0 ? (
                  <div className="section-empty">Nuk ka shpallje të tjera{q ? ` për "${q}"` : ''}</div>
                ) : (
                  <div className="listings-grid">
                    {regular.map((l, i) => <ListingCard key={l.id} listing={l} index={i} mounted={mounted} />)}
                  </div>
                )}
                {hasMore && (
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <button
                      type="button"
                      onClick={loadMore}
                      disabled={loadingMore}
                      style={{ background: '#111', color: '#F5C842', border: 'none', borderRadius: 24, padding: '11px 28px', fontWeight: 700, fontSize: 13, cursor: loadingMore ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: loadingMore ? 0.7 : 1 }}
                    >
                      {loadingMore ? <><span aria-hidden='true'>⏳</span> Duke ngarkuar...</> : 'Shiko më shumë →'}
                    </button>
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
          <div className="filter-panel" role="dialog" aria-modal="true" aria-label="Filtrat e Avancuar" onKeyDown={e => { if (e.key === 'Escape') setFiltersOpen(false) }} style={{ overflowY: 'auto', maxHeight: '85vh' }}>
            <div className="fp-handle" />
            <div className="fp-title">Filtrat e Avancuar</div>

            {/* Kategoria */}
            <div className="fp-row">
              <span className="fp-label">Kategoria</span>
              <select aria-label="Kategoria" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                <option value="">Të gjitha kategoritë</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                ))}
              </select>
            </div>

            {/* Qyteti */}
            <div className="fp-row">
              <span className="fp-label">Qyteti</span>
              <select aria-label="Qyteti" value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
                <option value="">Të gjitha qytetet</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Çmimi */}
            <div className="fp-row">
              <span className="fp-label">Çmimi (L)</span>
              <div className="price-range">
                <input type="number" aria-label="Çmimi minimal (Lekë)" placeholder="Min" value={priceMin}
                  onChange={e => setPriceMin(e.target.value)} min="0" />
                <input type="number" aria-label="Çmimi maksimal (Lekë)" placeholder="Max" value={priceMax}
                  onChange={e => setPriceMax(e.target.value)} min="0" />
              </div>
            </div>

            {/* Gjendja */}
            <div className="fp-row">
              <span className="fp-label">Gjendja</span>
              <div className="cond-row">
                <button type="button" aria-pressed={condFilter === ''} className={`cond-btn ${condFilter === '' ? 'active' : ''}`}
                  onClick={() => setCondFilter('')}>Të gjitha</button>
                <button type="button" aria-pressed={condFilter === 'i_ri'} className={`cond-btn ${condFilter === 'i_ri' ? 'active' : ''}`}
                  onClick={() => setCondFilter(condFilter === 'i_ri' ? '' : 'i_ri')}>I ri</button>
                <button type="button" aria-pressed={condFilter === 'i_mire'} className={`cond-btn ${condFilter === 'i_mire' ? 'active' : ''}`}
                  onClick={() => setCondFilter(condFilter === 'i_mire' ? '' : 'i_mire')}>I mirë</button>
                <button type="button" aria-pressed={condFilter === 'i_perdorur'} className={`cond-btn ${condFilter === 'i_perdorur' ? 'active' : ''}`}
                  onClick={() => setCondFilter(condFilter === 'i_perdorur' ? '' : 'i_perdorur')}>I përdorur</button>
              </div>
            </div>

            {/* Premium only */}
            <div className="fp-row"
              role="switch"
              aria-checked={premiumOnly}
              aria-label="Vetëm Premium"
              tabIndex={0}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: premiumOnly ? '#FFF8EE' : '#f9f9f7', border: `1.5px solid ${premiumOnly ? '#e0b030' : '#eee'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer' }}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPremiumOnly(v => !v) } }}
              onClick={() => setPremiumOnly(v => !v)}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>Vetëm Premium</div>
                <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 2 }}>Shpallje të verifikuara</div>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12, background: premiumOnly ? '#F5C842' : '#ddd',
                position: 'relative', transition: 'background .2s', flexShrink: 0,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: 3, left: premiumOnly ? 23 : 3,
                  transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>

            {/* Renditja */}
            <div className="fp-row">
              <span className="fp-label">Rendit sipas</span>
              <div className="cond-row">
                {[
                  { v: 'newest',     label: <><span aria-hidden="true">🕐</span> Më të rejat</> },
                  { v: 'price_asc',  label: '↑ Çmim' },
                  { v: 'price_desc', label: '↓ Çmim' },
                  { v: 'views',      label: <><span aria-hidden="true">👁</span> Shikimet</> },
                ].map(o => (
                  <button key={o.v}
                    type="button"
                    className={`cond-btn ${sortBy === o.v ? 'active' : ''}`}
                    aria-pressed={sortBy === o.v}
                    onClick={() => setSortBy(o.v)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="fp-actions">
              <button type="button" className="fp-clear" onClick={() => { clearFilters(); setFiltersOpen(false) }}>
                Pastro
              </button>
              <button type="button" className="fp-apply" onClick={applyFilters}>
                Apliko filtrat {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ position: 'fixed', bottom: 80, right: 16, width: 42, height: 42, borderRadius: '50%', background: '#111', color: '#F5C842', border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, zIndex: 99 }}
          aria-label="Kthehu në krye"
        >
          <i className="ti ti-arrow-up" aria-hidden="true" />
        </button>
      )}
    </>
  )
}

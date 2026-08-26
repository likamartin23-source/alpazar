'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import dynamicImport from 'next/dynamic'
import Avatar, { tierNgaProfili } from '../../components/Avatar'
import ListingCard from '../../components/ListingCard'
import { TrustBadge } from '../../components/TrustBadge'
import { useSyteLive } from '../../components/PremiumUpsell'
import { nf } from '../../../lib/format'

const MapDisplay = dynamicImport(() => import('../../components/MapDisplay').then(m => ({ default: m.MapDisplay })), { ssr: false })

// "Hapur tani" — llogaritet nga hours.days ({mon..sun:{closed,open,close}}) i shkruar nga
// BusinessForm. Thirret VETËM pas montimit (mounted) sepse varet nga ora → pa mospërputhje SSR.
// getDay(): 0=Diel..6=Shtunë. Kthen null kur s'ka orar → chip-i s'shfaqet.
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
function openNowFromHours(h: any): boolean | null {
  const days = h?.days
  if (!days || typeof days !== 'object') return null
  const now = new Date()
  const d = days[DAY_KEYS[now.getDay()]]
  if (!d) return null
  if (d.closed) return false
  if (!d.open || !d.close) return null
  const [oh, om] = String(d.open).split(':').map(Number)
  const [ch, cm] = String(d.close).split(':').map(Number)
  if ([oh, om, ch, cm].some(x => !Number.isFinite(x))) return null
  const cur = now.getHours() * 60 + now.getMinutes(), o = oh * 60 + om, c = ch * 60 + cm
  return c <= o ? (cur >= o || cur < c) : (cur >= o && cur < c) // c<=o => kalon mesnatën
}
// "Përgjigjet ~N orë/ditë" nga business_response_time (median në orë).
function fmtResp(hrs: number): string {
  if (hrs < 1.5) return '~1 orë'
  if (hrs < 24) return `~${Math.round(hrs)} orë`
  return `~${Math.round(hrs / 24)} ditë`
}

interface Biz {
  id: string; owner_id: string; name: string; slug: string; type: string
  logo_url: string | null; cover_url: string | null; description: string | null
  address: string | null; latitude: number | null; longitude: number | null
  phone: string | null; website: string | null; hours: any; is_verified: boolean
  created_at: string; city: string | null; email: string | null
  nipt: string | null; withdrawal_days: number | null; updated_at: string | null
  // Fushat e reja profesionale (FINAL §3.8) — opsionale; shfaqen kur plotësohen.
  tagline?: string | null; founded_year?: number | null; whatsapp?: string | null
  contact_person?: string | null; gallery?: string[] | null
  socials?: { instagram?: string | null; facebook?: string | null; tiktok?: string | null } | null
  service_area?: string | null; delivery?: { ka?: boolean; detaje?: string | null } | null
  legal_form?: string | null; payment_methods?: string[] | null
  return_policy?: string | null; warranty?: string | null
}

export default function BiznesPageClient({ params, initialBiz, initialListings, initialSubcats, initialIsOwner }: { params: { id: string }; initialBiz?: any; initialListings?: any[]; initialSubcats?: any[]; initialIsOwner?: boolean }) {
  const seedListings = Array.isArray(initialListings) ? initialListings : []
  const seedSubcats  = Array.isArray(initialSubcats) ? initialSubcats : []
  const [biz, setBiz]               = useState<Biz | null>(initialBiz ?? null)
  // Seed nga SSR (initialListings/initialSubcats/initialIsOwner) => paraqitja e parë
  // renderon TE NJEJTEN dege si klienti (FIX-3): shpallje, kategori, pronar/vizitor —
  // pa kërcim pas hidratimit. Refetch-i ne klient eshte vetem "rifreskim i heshtur".
  const [subcats, setSubcats]       = useState<any[]>(seedSubcats)
  const [listings, setListings]     = useState<any[]>(seedListings)
  const [loading, setLoading]       = useState(!initialBiz)
  const [loadError, setLoadError]   = useState(false)
  const [activeTab, setActiveTab]   = useState<'grid' | 'about'>('grid')
  // FINAL — harmonizim vizitor-pronar (si rrjet social): pronari mund të kalojë te
  // pamja publike ("Shiko si vizitor") dhe të kthehet te menaxhimi. Detektimi isOwner
  // (SSR, anti-flaker) mbetet i paprekur; kjo vetëm fsheh panelin e pronarit lokalisht.
  const [asVisitor, setAsVisitor]   = useState(false)
  // BP2 §B2 — paneli i brendshëm i biznesit = PASQYRË e panelit /profile (guaskë e veçantë
  // biznesi, e pavarur; /profile s'preket). Tab-et e panelit të pronarit.
  const [panelTab, setPanelTab]     = useState<'home' | 'listings' | 'reviews'>('home')
  const [userId, setUserId]         = useState<string | null>(null)
  const [isOwner, setIsOwner]       = useState(!!initialIsOwner)
  const [descExpanded, setDescExpanded] = useState(false)
  const [totalViews, setTotalViews] = useState(() => seedListings.reduce((s: number, l: any) => s + (l?.views_count || 0), 0))
  // Vleresimet e biznesit: agregim nga reviews→listings.business_id (funksionet
  // DB business_rating/business_reviews). Empty-state dinjitoz kur 0 (Notion §5B/5).
  const [rating, setRating]         = useState<{ avg: number | null; count: number }>({ avg: null, count: 0 })
  const [reviews, setReviews]       = useState<any[]>([])
  const [reviewsLoaded, setReviewsLoaded] = useState(false)
  // Shitjet e kryera — social proof (jo fshehje). Funksion agregimi
  // business_sold_count (status='sold'), pa N+1. Shfaqet vetem kur >0.
  const [soldCount, setSoldCount]   = useState(0)
  // Koha e përgjigjes ("Përgjigjet ~N orë") — median nga business_response_time.
  // Fail-soft: null kur pak të dhëna → s'shfaqet (spec: subjekti biznes, ana e jashtme).
  const [respHrs, setRespHrs]       = useState<number | null>(null)
  // Faqja renderohet edhe ne server (`initialBiz`). Koha relative e kartes
  // varet nga `Date.now()`, ndaj i jepet ListingCard-it vetem pas montimit.
  const [mounted, setMounted]       = useState(false)

  // Ndjekesit. Tabela `business_followers` ekzistonte ne baze me RLS te plote
  // (lexim publik; shto/hiq vetem rreshtin tend) por asnje ekran nuk e prekte.
  const [followers, setFollowers]   = useState(0)
  const [following, setFollowing]   = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  // Tier-i i unazes se biznesit vjen nga pronari (Vendimi 1: identiteti eshte i
  // biznesit, abonimi eshte i personit). Marrim vetem kater fushat qe llogarit
  // `owner_rank_tier`.
  const [pronari, setPronari]       = useState<{
    is_premium?: boolean | null; premium_expires_at?: string | null
    has_boost?: boolean | null; boost_expires_at?: string | null
  } | null>(null)

  // Syte live te faqja e biznesit (BLLOKU Imazhi 4: "👁+🔴") — e njejta presence
  // reale fail-soft si te shpallja; kanal i vecante 'biz-{id}'.
  const syteLive = useSyteLive(biz ? `biz-${biz.id}` : undefined)

  useEffect(() => {
    setMounted(true)
    // ?public=1 (nga "Shiko faqen publike" te /profile) → hap pamjen publike edhe për pronarin.
    try { if (new URLSearchParams(window.location.search).get('public') === '1') setAsVisitor(true) } catch {}
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
    fetchBiz()
  }, [])

  async function refreshFollow(bizId: string) {
    const { count } = await supabase
      .from('business_followers')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', bizId)
    setFollowers(count ?? 0)

    const uid = (await supabase.auth.getSession()).data.session?.user.id
    if (!uid) { setFollowing(false); return }
    const { data: mine } = await supabase
      .from('business_followers')
      .select('id')
      .eq('business_id', bizId)
      .eq('user_id', uid)
      .maybeSingle()
    setFollowing(!!mine)
  }

  async function toggleFollow() {
    if (followBusy || !biz) return
    if (!userId) { window.location.href = '/auth/login'; return }
    setFollowBusy(true)
    // Numri perditesohet ne cast dhe kthehet mbrapsht nese shkruarja deshton —
    // butoni s'duhet te rrije i ngrire sa te vije pergjigjja.
    const wasFollowing = following
    setFollowing(!wasFollowing)
    setFollowers(n => n + (wasFollowing ? -1 : 1))

    const { error } = wasFollowing
      ? await supabase.from('business_followers').delete().eq('business_id', biz.id).eq('user_id', userId)
      : await supabase.from('business_followers').insert({ business_id: biz.id, user_id: userId })

    if (error) {
      setFollowing(wasFollowing)
      setFollowers(n => n + (wasFollowing ? 1 : -1))
    }
    setFollowBusy(false)
  }

  async function fetchBiz() {
    try {
      let { data: b } = await supabase.from('businesses').select('*').eq('id', params.id).maybeSingle()
      if (!b) {
        const res = await supabase.from('businesses').select('*').eq('owner_id', params.id).maybeSingle()
        b = res.data
      }
      if (!b) { setLoading(false); return }
      setBiz(b)
      // Mos e ndrysho degën pronar↔vizitor pas hidratimit (FIX-3): përditëso isOwner
      // VETËM kur ka sesion të vërtetë. Nëse s'ka sesion (vizitor ose ende s'u ngarkua),
      // ruaj vlerën fillestare nga serveri => pa kërcim true→false.
      const sid = (await supabase.auth.getSession()).data.session?.user.id
      if (sid) setIsOwner(sid === b.owner_id)

      // Profili i pronarit — vetem fushat e tier-it, per unazen e avatarit.
      const { data: pr } = await supabase
        .from('profiles')
        .select('is_premium,premium_expires_at,has_boost,boost_expires_at')
        .eq('id', b.owner_id)
        .maybeSingle()
      setPronari(pr)

      // Rating agregat i biznesit (pa N+1 — nje funksion). Empty kur 0 reviews.
      supabase.rpc('business_rating', { p_business: b.id }).then(({ data }) => {
        const row = Array.isArray(data) ? data[0] : data
        if (row) setRating({ avg: row.avg_rating ?? null, count: row.review_count ?? 0 })
      })

      // Numri i shitjeve — social proof (Faza 6). Funksioni kthen skalar integer.
      supabase.rpc('business_sold_count', { p_business: b.id }).then(({ data }) => {
        const n = Number(Array.isArray(data) ? data[0] : data)
        if (Number.isFinite(n)) setSoldCount(n)
      })

      // Koha e përgjigjes — median në orë; null kur pak të dhëna (fail-soft).
      supabase.rpc('business_response_time', { p_business: b.id }).then(({ data }) => {
        const n = Number(Array.isArray(data) ? data[0] : data)
        setRespHrs(Number.isFinite(n) && n > 0 ? n : null)
      })

      const { data: mapRows } = await supabase
        .from('business_subcategory_map')
        .select('subcategory_id, business_subcategories(name, icon)')
        .eq('business_id', b.id)
      // Rifreskim i heshtur: zëvendëso vetëm kur ka të dhëna reale; kurrë mos i fshij
      // kategoritë (do të kërciste layout-i). Bosh legjitim vjen nga SSR seed.
      const sc = (mapRows ?? []).map((r: any) => r.business_subcategories).filter(Boolean)
      if (sc.length) setSubcats(sc)

      // `created_at` dhe `rank_tier` u shtuan bashke me ListingCard: karta
      // shfaq kohen relative dhe shenjen VIP, te dyja mungonin ne kete select.
      const { data: ls } = await supabase
        .from('listings')
        .select('id,title,price,currency,images,condition,city,is_premium,views_count,created_at,rank_tier')
        .eq('business_id', b.id)
        .eq('is_active', true)
        .order('rank_tier', { ascending: false })   // VIP-first (Vendimi 2)
        .order('created_at', { ascending: false })
        .limit(20)
      // Rifreskim i heshtur: zevendeso VETEM kur kthehen te dhena reale. Nese
      // query-ja kthen bosh (race/rrjet), MBAJ te dhenat ekzistuese (SSR ose te
      // meparshmet) => kurre nuk shfaqet flash 0. (Bosh legjitim shfaqet nga SSR.)
      if (ls && ls.length) {
        setListings(ls)
        setTotalViews(ls.reduce((s: number, l: any) => s + (l.views_count || 0), 0))
      }

      await refreshFollow(b.id)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  // `fmt` u hoq bashke me grid-in e vjeter: ishte i vetmi perdorues i tij dhe
  // formatonte me `toLocaleString('sq-AL')`, qe jep rezultat te ndryshem ne
  // server e ne shfletues (shih lib/format.ts). ListingCard perdor `nf()`.

  function share() {
    if (navigator.share) navigator.share({ title: biz?.name, url: window.location.href })
    else navigator.clipboard?.writeText(window.location.href)
  }

  if (loadError) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#FFFBEA', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">⚠️</div>
      <div style={{ fontSize: 14, color: '#C42B0F', marginBottom: 16, textAlign: 'center' }}>Nuk u ngarkua biznesi. Kontrollo lidhjen dhe provo sërish.</div>
      <button type="button" onClick={() => window.location.reload()} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
    </div>
  )

  if (loading) return (
    <div style={{ maxWidth: 480, margin: '0 auto', background: '#f8f8f8', minHeight: '100vh' }}>
      <div style={{ background: 'linear-gradient(135deg,#F5C842,#E63312)', aspectRatio: '16/7' }} />
      <div style={{ padding: 16 }}>
        <div style={{ height: 24, background: '#eee', borderRadius: 8, marginBottom: 10, width: '60%' }} />
        <div style={{ height: 14, background: '#eee', borderRadius: 6, width: '40%' }} />
      </div>
    </div>
  )

  if (!biz) return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 40, textAlign: 'center', background: '#FFFBEA', minHeight: '100vh' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🏢</div>
      <div style={{ fontWeight: 700, color: '#111', marginBottom: 16 }}>Biznesi nuk u gjet</div>
      <button type="button" onClick={() => window.history.back()} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>← Kthehu</button>
    </div>
  )

  const descShort = (biz.description || '').length > 120
  const descText  = descExpanded || !descShort ? biz.description : (biz.description || '').slice(0, 120) + '…'
  // "Hapur tani" — vetëm pas montimit (varet nga ora → pa mospërputhje SSR).
  const openNow   = mounted ? openNowFromHours(biz.hours) : null
  const tier      = tierNgaProfili(pronari)
  const tierLabel = tier === 'vip' ? 'VIP Ekstra Boost' : tier === 'premium' ? 'Premium' : null

  // ── BP2 §B2 — PANELI I BRENDSHËM I BIZNESIT = PASQYRË e panelit /profile ──────────────
  // Guaskë e veçantë biznesi (e pavarur; /profile s'preket). Pronari default sheh KËTË panel;
  // "Shiko faqen publike" → pamja publike (asVisitor=true). Shiriti "Vepro si" (B3.1) lart.
  if (isOwner && !asVisitor) {
    return (
      <div className="bizp">
        <style dangerouslySetInnerHTML={{ __html: `
          *{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
          .bizp{background:#f2f2f2;min-height:100vh;padding-bottom:70px;}
          .bizp-shell{max-width:480px;margin:0 auto;}
          .vs-bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:8px;background:#111;color:#fff;padding:8px 12px;font-size:12px;font-weight:700;}
          .vs-bar .vs-lbl{color:#bbb;}
          .vs-seg{display:inline-flex;background:#000;border-radius:999px;padding:3px;gap:2px;margin-left:auto;}
          .vs-seg button{border:none;background:none;color:#ccc;font-weight:800;font-size:12px;padding:6px 12px;border-radius:999px;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:5px;min-height:34px;}
          .vs-seg button.on{background:#F5C842;color:#111;}
          .bizp-cover{position:relative;aspect-ratio:16/7;overflow:hidden;background:linear-gradient(135deg,#F5C842,#E63312);}
          .bizp-cover img{width:100%;height:100%;object-fit:cover;}
          .cam{position:absolute;background:rgba(0,0,0,.55);border:none;border-radius:999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#fff;}
          .bizp-card{background:#fff;border-radius:0 0 20px 20px;padding:0 16px 16px;margin-bottom:8px;}
          .bizp-badges{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
          .bdg{font-size:11px;font-weight:800;padding:3px 9px;border-radius:8px;display:inline-flex;align-items:center;gap:4px;}
          /* Shirit statistikash i zi — pasqyrë e panelit /profile (BP2: paneli identik në formë). */
          .bizp-stats{display:flex;background:#111;border-radius:14px;padding:14px 6px;margin-top:12px;}
          .bizp-stats .stat-div{width:1px;background:#333;}
          .stat-pill{display:flex;flex-direction:column;align-items:center;flex:1;}
          .stat-n{font-size:18px;font-weight:800;color:#F5C842;}
          .stat-l{font-size:10px;color:#bbb;font-weight:500;margin-top:1px;}
          .bizp-tabs{position:sticky;top:50px;z-index:10;background:#fff;border-bottom:1px solid #eee;display:flex;overflow-x:auto;margin-bottom:2px;}
          .bizp-tabs button{flex:1 0 auto;padding:12px 14px;font-size:12.5px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;color:#888;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:5px;}
          .bizp-tabs button.on{color:#C42B0F;border-bottom-color:#E63312;}
          .mcard{background:#fff;border-radius:14px;margin:8px 12px 0;padding:14px 16px;}
          .mrow{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;background:#fff;border:1px solid #ececec;border-radius:12px;padding:10px 14px;cursor:pointer;font-family:inherit;text-align:left;margin-bottom:8px;}
          .mrow:hover{background:#fafafa;border-color:#ddd;}
          .mrow i.lead{font-size:19px;color:#C42B0F;width:24px;text-align:center;}
          .mrow .mtxt{flex:1;min-width:0;}
          .mrow .mtt{font-size:13.5px;font-weight:700;color:#111;}
          .mrow .msub{font-size:11px;color:#888;margin-top:1px;}
          .mrow i.arr{color:#bbb;font-size:16px;}
        ` }} />
        <div className="bizp-shell">
          {/* B3.1 — Shiriti "Vepro si" (i qëndrueshëm; s'krijon inbox/analitikë të dytë) */}
          <div className="vs-bar">
            <span className="vs-lbl">Vepro si:</span>
            <div className="vs-seg" role="tablist" aria-label="Vepro si">
              <button type="button" className="on" aria-current="true"><i className="ti ti-building-store" aria-hidden="true" /> Biznesi</button>
              <button type="button" onClick={() => { window.location.href = '/profile' }}><i className="ti ti-user" aria-hidden="true" /> Unë</button>
            </div>
          </div>

          {/* Kopertinë + kamerë (→ /edit) */}
          <div className="bizp-cover">
            {biz.cover_url && <img src={biz.cover_url} alt="" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
            <button type="button" className="cam" aria-label="Ndrysho kopertinën" style={{ top: 12, right: 12 }} onClick={() => { window.location.href = `/biznese/${biz.id}/edit` }}>
              <i className="ti ti-camera" aria-hidden="true" style={{ fontSize: 16 }} />
            </button>
          </div>

          <div className="bizp-card">
            {/* Avatar unazë+🏢 (+kurorë kur VIP) + kamerë */}
            <div style={{ position: 'relative', width: 84, marginTop: -42, marginBottom: 10 }}>
              <Avatar src={biz.logo_url} name={biz.name} type="business" tier={tier} verified={biz.is_verified} size={84} />
              <button type="button" className="cam" aria-label="Ndrysho logon" style={{ bottom: 0, right: -4, width: 30, height: 30 }} onClick={() => { window.location.href = `/biznese/${biz.id}/edit` }}>
                <i className="ti ti-camera" aria-hidden="true" style={{ fontSize: 14 }} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <h1 style={{ fontSize: 21, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{biz.name}</h1>
              {biz.is_verified && <span aria-hidden="true" style={{ fontSize: 17 }}>✅</span>}
            </div>

            {/* Bexhat (VIP Ekstra Boost / Premium · Biznes · I verifikuar) */}
            <div className="bizp-badges">
              {tierLabel && <span className="bdg" style={tier === 'vip' ? { background: '#F3E8FF', color: '#7C3AED' } : { background: '#FFF3D6', color: '#7A4A00' }}><span aria-hidden="true">👑</span> {tierLabel}</span>}
              <span className="bdg" style={{ background: '#E7F0FF', color: '#1D4ED8' }}><span aria-hidden="true">🏢</span> Biznes</span>
              {biz.is_verified && <span className="bdg" style={{ background: '#dcfce7', color: '#16a34a' }}>✅ I verifikuar</span>}
            </div>

            {/* Statistika (Shpallje · Të shitura · Ndjekës · Anëtar) */}
            <div className="bizp-stats">
              <div className="stat-pill"><span className="stat-n">{listings.length}</span><span className="stat-l">Shpallje</span></div>
              <div className="stat-div" />
              <div className="stat-pill"><span className="stat-n" style={soldCount > 0 ? { color: '#4ADE80' } : undefined}>{soldCount}</span><span className="stat-l">Të shitura</span></div>
              <div className="stat-div" />
              <div className="stat-pill"><span className="stat-n">{followers}</span><span className="stat-l">Ndjekës</span></div>
              <div className="stat-div" />
              <div className="stat-pill"><span className="stat-n">{new Date(biz.created_at).getFullYear()}</span><span className="stat-l">Anëtar prej</span></div>
            </div>

            {/* Meta: 👁 · 🔴 · ⏱ · 🚫 0% komision */}
            <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {totalViews > 0 && <span><span aria-hidden="true">👁</span> {nf(totalViews)} shikime</span>}
              {syteLive > 0 && <span style={{ color: '#C4230F', fontWeight: 700 }}><span style={{ color: '#ccc', margin: '0 4px' }}>·</span><span aria-hidden="true">🔴</span> {syteLive} tani</span>}
              {respHrs != null && <span><span style={{ color: '#ccc', margin: '0 4px' }}>·</span><span aria-hidden="true">⏱️</span> Përgjigjet {fmtResp(respHrs)}</span>}
              <span><span style={{ color: '#ccc', margin: '0 4px' }}>·</span><span aria-hidden="true">🚫</span> 0% komision</span>
            </div>

            {/* Shiko faqen publike */}
            <button type="button" onClick={() => setAsVisitor(true)}
              style={{ width: '100%', marginTop: 14, minHeight: 44, background: '#fff', border: '1.5px solid #e5e5e5', borderRadius: 11, fontSize: 13, fontWeight: 800, color: '#111', cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <i className="ti ti-eye" aria-hidden="true" /> Shiko faqen publike
            </button>
          </div>

          {/* Tabet e panelit — VETËM ato me përmbajtje inline (Profili i biznesit · Shpalljet ·
              Vlerësime). Analitika & Mesazhet janë sipërfaqe më vete → rrinë VETËM si karta te
              "Profili i biznesit" (pa dublim tab+kartë; korrigjim nga verifikimi live). */}
          <div className="bizp-tabs" role="tablist" aria-label="Paneli i biznesit">
            <button type="button" className={panelTab === 'home' ? 'on' : ''} aria-selected={panelTab === 'home'} onClick={() => setPanelTab('home')}><i className="ti ti-building-store" aria-hidden="true" /> Profili i biznesit</button>
            <button type="button" className={panelTab === 'listings' ? 'on' : ''} aria-selected={panelTab === 'listings'} onClick={() => setPanelTab('listings')}><i className="ti ti-layout-grid" aria-hidden="true" /> Shpalljet</button>
            <button type="button" className={panelTab === 'reviews' ? 'on' : ''} aria-selected={panelTab === 'reviews'} onClick={() => { setPanelTab('reviews'); if (!reviewsLoaded) { setReviewsLoaded(true); supabase.rpc('business_reviews', { p_business: biz.id }).then(({ data }) => setReviews(data || [])) } }}><i className="ti ti-star" aria-hidden="true" /> Vlerësime</button>
          </div>

          {/* Tab: Profili i biznesit — kartat e menaxhimit (mision-biznesi; pa ekskluzivitete llogarie) */}
          {panelTab === 'home' && (
            <div className="mcard">
              <button type="button" className="mrow" onClick={() => { window.location.href = `/biznese/${biz.id}/edit` }}>
                <i className="ti ti-settings lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Të dhënat e biznesit</span><span className="msub">Emri, përshkrimi, kontakti, orari, ligjore…</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              <button type="button" className="mrow" onClick={() => { window.location.href = `/biznese/${biz.id}/edit` }}>
                <i className="ti ti-photo lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Logo &amp; Kopertinë</span><span className="msub">Identiteti vizual i biznesit</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              <button type="button" className="mrow" onClick={() => { window.location.href = `/biznese/${biz.id}/analytics` }}>
                <i className="ti ti-chart-bar lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Analitika</span><span className="msub">Shikime, arritje, kontakte (pa referral)</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              <button type="button" className="mrow" onClick={() => { window.location.href = `/messages?biz=${biz.id}` }}>
                <i className="ti ti-message lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Mesazhet</span><span className="msub">Një inbox — filtruar për biznesin</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              {/* Plani (trashëgim) — reflektim i planit të llogarisë; menaxhimi mbetet te llogaria personale */}
              <div className="mrow" style={{ cursor: 'default' }}>
                <i className="ti ti-crown lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Plani: {tierLabel || 'Falas'} <span style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>· trashëgim</span></span><span className="msub">Trashëguar nga llogaria — menaxhohet te “Vepro si: Unë”</span></span>
              </div>
            </div>
          )}

          {/* Tab: Shpalljet */}
          {panelTab === 'listings' && (
            listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#aaa', background: '#fff', margin: '8px 12px 0', borderRadius: 14 }}>
                <div style={{ fontSize: 44, marginBottom: 10 }} aria-hidden="true">🛍️</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#666', marginBottom: 8 }}>Asnjë shpallje ende</div>
                <button type="button" onClick={() => { window.location.href = '/listing/new' }} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Shto shpallje</button>
              </div>
            ) : (
              <div className="listings-grid" style={{ padding: 12 }}>
                {listings.map((l, idx) => <ListingCard key={l.id} listing={l as any} index={idx} showSeller={false} mounted={mounted} />)}
              </div>
            )
          )}

          {/* Tab: Vlerësime (subjekt = biznes) */}
          {panelTab === 'reviews' && (
            <div style={{ margin: 8 }}>
              {rating.count > 0 && rating.avg != null && (
                <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{rating.avg.toFixed(1)}</div>
                  <div>
                    <div style={{ color: '#F5C842', fontSize: 16 }} aria-hidden="true">{'★'.repeat(Math.round(rating.avg))}{'☆'.repeat(5 - Math.round(rating.avg))}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>{rating.count} vlerësim{rating.count !== 1 ? 'e' : ''}</div>
                  </div>
                </div>
              )}
              {reviews.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {reviews.map(rv => (
                    <div key={rv.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Avatar src={rv.reviewer_avatar} name={rv.reviewer_name} type="person" size={30} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{rv.reviewer_name}</div>
                          <div style={{ fontSize: 10, color: '#aaa' }}>{new Date(rv.created_at).toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' })}{rv.purchase_verified ? ' · ✅ Blerje e verifikuar' : ''}</div>
                        </div>
                        <div style={{ color: '#F5C842', fontSize: 13 }} aria-label={`${rv.rating} nga 5`}>{'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}</div>
                      </div>
                      {rv.comment && <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{rv.comment}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: 16, padding: '40px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }} aria-hidden="true">⭐</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111', marginBottom: 6 }}>Ende pa vlerësime</div>
                  <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>Klientët që blejnë nga ky biznes do të mund të lënë vlerësimin këtu.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="biz-page">
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
        /* Gjeresia rrinte si stil inline (maxWidth:480) mbi rrenjen, pra nuk
           kapërcehej dot me CSS dhe desktopi mbetej nje shirit i ngushte.
           Tani eshte klase: mobili identik (480 i centruar), dhe nga 1000px
           e siper dy kolona — koka/info ngjitese majtas, tabet me grid-in
           djathtas, si te faqja e shpalljes (PR #72). */
        .biz-page{background:#f2f2f2;min-height:100vh;padding-bottom:60px;}
        .biz-shell{max-width:480px;margin:0 auto;}
        @media (min-width:1000px){
          .biz-shell{max-width:1120px;display:grid;grid-template-columns:minmax(320px,390px) 1fr;gap:24px;align-items:start;padding:0 20px;}
          .biz-left{position:sticky;top:12px;align-self:start;max-height:calc(100vh - 24px);overflow-y:auto;overscroll-behavior:contain;}
          .biz-left::-webkit-scrollbar{width:0;}
          .biz-right{min-width:0;}
        }
        .biz-tab{flex:1;padding:13px 0;font-size:13px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;color:#888;font-family:inherit;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:4px;}
        .biz-tab.active{color:#C42B0F;border-bottom-color:#E63312;}
        /* Grid-i .ig-* (katror 1/1, vetem foto + cmim) u zevendesua nga
           .listings-grid + ListingCard — stilet e tyre rrine te
           app/ui-refine.css, seksioni 8. */
        .action-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:11px 0;border-radius:12px;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit;border:none;box-shadow:0 2px 8px -2px rgba(0,0,0,.25);transition:transform .15s ease,box-shadow .15s ease;}
        .action-btn:hover{transform:translateY(-1px);}
        .action-btn:active{opacity:.8;}
        .info-row{display:flex;align-items:flex-start;gap:10px;padding:11px 0;border-bottom:1px solid #f0f0f0;}
        .info-row:last-child{border:none;}
        .info-icon{font-size:16px;min-width:22px;text-align:center;margin-top:1px;}
        .info-text{font-size:13px;color:#333;line-height:1.5;flex:1;}
        .info-text a{color:#C42B0F;font-weight:700;text-decoration:none;}
        .stat-pill{display:flex;flex-direction:column;align-items:center;flex:1;}
        .stat-n{font-size:18px;font-weight:800;color:#111;}
        .stat-l{font-size:10px;color:#888;font-weight:500;margin-top:1px;}
        .card{background:#fff;border-radius:16px;margin:8px 12px 0;padding:16px;}
        .card-title{font-size:13px;font-weight:800;color:#111;margin-bottom:14px;display:flex;align-items:center;gap:6px;}
        .biz-chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:700;color:#444;background:#f4f4f4;border:1px solid #e2e2e2;border-radius:999px;padding:6px 11px;min-height:32px;text-decoration:none;cursor:default;}
        a.biz-chip{cursor:pointer;}
        .biz-panel-btn{min-height:44px;background:#fff;border:1px solid #e5e5e5;border-radius:10px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;color:#111;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 6px;text-align:center;}
        .biz-panel-btn:hover{background:#fafafa;border-color:#d8d8d8;}
      ` }} />

      <div className="biz-shell">
      <div className="biz-left">
      {/* ── Cover photo ────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        <div style={{ aspectRatio: '16/7', overflow: 'hidden', background: 'linear-gradient(135deg,#F5C842,#E63312)' }}>
          {biz.cover_url && (
            <img src={biz.cover_url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          )}
        </div>

        {/* Floating buttons */}
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()} style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 18, color: '#fff' }} />
        </button>
        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
          <button type="button" aria-label="Ndaj biznesin" onClick={share} style={{ background: 'rgba(0,0,0,.45)', border: 'none', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <i className="ti ti-share" style={{ fontSize: 16, color: '#fff' }} aria-hidden="true" />
          </button>
          {/* Lapsi edit u hoq: pronari e sheh faqen si vizitor i veçantë (pamje e pastër);
              administrimi (përfshi Edito) bëhet te paneli ekzistues përmes "Vepro si biznes"
              → /profile → Biznesi im. Pa hibrid pronar/vizitor te koka. */}
        </div>
      </div>

      {/* ── Identity card (white, rounded top) ──────────────── */}
      <div style={{ background: '#fff', borderRadius: '0 0 20px 20px', paddingBottom: 16, marginBottom: 8 }}>
        {/* Avatar overlapping the cover */}
        <div style={{ position: 'relative', marginTop: -42, marginLeft: 16, marginBottom: 10 }}>
          <Avatar
            src={biz.logo_url}
            name={biz.name}
            type="business"
            tier={tierNgaProfili(pronari)}
            verified={biz.is_verified}
            size={84}
          />
        </div>

        {/* Name + verified */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111', lineHeight: 1.2 }}>{biz.name}</h1>
            {biz.is_verified && (
              <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">✅</span>
            )}
          </div>
          {biz.is_verified && (
            <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>Biznes i verifikuar</span>
          )}

          {/* Category chips */}
          {subcats.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
              {subcats.map((s, i) => (
                <span key={i} style={{ fontSize: 11, background: '#FFF8E1', color: '#7B5000', padding: '3px 10px', borderRadius: 12, fontWeight: 700, border: '1px solid #F5C84233' }}>
                  {s.icon} {s.name}
                </span>
              ))}
            </div>
          )}

          {/* Reputacioni: rating agregat (vetem kur ka reviews — Notion §5B/5) +
              TrustBadge (0-100 + nivel), si karta e shitesit. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {rating.count > 0 && rating.avg != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFF8E1', color: '#7B5000', border: '1px solid #F5C84255', borderRadius: 9, padding: '3px 9px', fontSize: 12.5, fontWeight: 800 }}>
                <span aria-hidden="true">★</span> {rating.avg.toFixed(1)}
                <span style={{ fontWeight: 600, color: '#9a7b2a' }}>({rating.count})</span>
              </span>
            )}
            {soldCount > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E7F6EC', color: '#0E7A35', border: '1px solid #0E7A3533', borderRadius: 9, padding: '3px 9px', fontSize: 12.5, fontWeight: 800 }}>
                <span aria-hidden="true">✓</span> {soldCount} të shitura
              </span>
            )}
            <TrustBadge createdAt={biz.created_at} listingsActive={listings.length} gamificationPoints={0} compact />
          </div>

          {/* Stats row — matrica e ngrire (BLLOKU Imazhi 4): Shpallje / Të shitura /
              Ndjekës / Anëtar, PA Shikime (ato zbresin te rreshti 👁+🔴 poshtë). */}
          <div style={{ display: 'flex', borderTop: '1px solid #f0f0f0', paddingTop: 14, marginBottom: 8 }}>
            <div className="stat-pill">
              <span className="stat-n">{listings.length}</span>
              <span className="stat-l">Shpallje</span>
            </div>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div className="stat-pill">
              <span className="stat-n" style={soldCount > 0 ? { color: '#0E7A35' } : undefined}>{soldCount}</span>
              <span className="stat-l">Të shitura</span>
            </div>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div className="stat-pill">
              <span className="stat-n">{followers}</span>
              <span className="stat-l">Ndjekës</span>
            </div>
            <div style={{ width: 1, background: '#f0f0f0' }} />
            <div className="stat-pill">
              <span className="stat-n">{new Date(biz.created_at).getFullYear()}</span>
              <span className="stat-l">Anëtar prej</span>
            </div>
          </div>

          {/* "👁 N shikime · 🔴 M duke shikuar" (Imazhi 4) — shikimet reale nga baza,
              syte live nga presence reale (fail-soft: 0 → pjesa 🔴 s'shfaqet). */}
          {(totalViews > 0 || syteLive > 0 || respHrs != null) && (
            <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 14, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center' }}>
              {totalViews > 0 && <span><span aria-hidden="true">👁</span> {nf(totalViews)} shikime</span>}
              {syteLive > 0 && (
                <span style={{ color: '#C4230F', fontWeight: 700 }}>
                  {totalViews > 0 && <span style={{ color: '#ccc', margin: '0 4px' }}>·</span>}
                  <span aria-hidden="true">🔴</span> {syteLive} duke shikuar
                </span>
              )}
              {respHrs != null && (
                <span>
                  {(totalViews > 0 || syteLive > 0) && <span style={{ color: '#ccc', margin: '0 4px' }}>·</span>}
                  <span aria-hidden="true">⏱️</span> Përgjigjet {fmtResp(respHrs)}
                </span>
              )}
            </div>
          )}

          {/* Lidhja biznes → person. Gjysma tjeter e ndërlidhjes: profili i
              personit çon te biznesi i tij (§4.5). */}
          {biz.owner_id && (
            <div style={{ marginBottom: 12 }}>
              {/* ★ Pronari (BLLOKU I PËRMIRËSUAR §3, business_v5): kutizë e theksuar e
                  identitetit të pronarit → profili i personit. Gjysma tjetër e çiftit
                  (profil → biznes) rri te profili. Prekje ≥44px (Vendimi 8). */}
              <a
                href={`/u/${biz.owner_id}`}
                aria-label={isOwner ? 'Ti je pronari — shiko profilin tënd' : 'Pronari — shiko profilin'}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#111', textDecoration: 'none', minHeight: 44, padding: '6px 12px', border: '1px solid #F5C842', background: '#FFFBEA', borderRadius: 999, fontWeight: 600 }}>
                <span aria-hidden="true" style={{ color: '#E6A200', fontSize: 14, lineHeight: 1 }}>★</span>
                {isOwner ? <>Ti je pronari <span style={{ color: '#C42305', fontWeight: 700 }}>— profili yt →</span></> : <>Pronari <span style={{ color: '#C42305', fontWeight: 700 }}>— shiko profilin →</span></>}
              </a>
            </div>
          )}

          {/* Action buttons — modaliteti pronar vs vizitor (urdhër pronari):
              Pronari e shikon biznesin si "vizitor i veçantë" (entitet i mëvetësishëm)
              dhe ka NJË buton "Vepro si biznes" që e çon te administrimi EKZISTUES
              (/profile → Biznesi im), pa dublim, në sinkron me modalitetet ekzistuese.
              Vizitori sheh veprimet e kontaktit (Telefono/Mesazh/Ndiq). Veprimet drejt
              vetes (mesazh/telefono/ndiq) nuk i shfaqen pronarit — s'kanë kuptim. */}
          {/* Veprimet e vizitorit (Telefono/Mesazh/Ndiq). Pronari e menaxhon biznesin te
              paneli-pasqyrë (BP2 §B2); këtu, kur pronari është në "Shiko faqen publike",
              sheh pikërisht pamjen e vizitorit — pa kontrolle pronari të përziera. */}
          <div style={{ display: 'flex', gap: 8 }}>
            {isOwner ? (
              /* Vizitor-pronar (i veçantë): platforma e njeh se je pronari — veprimet ndaj vetes
                 (Telefono/Mesazh/Ndiq) s'kanë kuptim, ndaj s'shfaqen; shfaqet njohja + Ndaj. */
              <div className="action-btn" style={{ background: '#FFF8E1', color: '#7A4A00', boxShadow: 'none', border: '1px solid #F5C84255', cursor: 'default', flexDirection: 'column', gap: 0, lineHeight: 1.3 }}>
                <span style={{ fontWeight: 800 }}><span aria-hidden="true">👁</span> Kështu e sheh vizitori</span>
                <span style={{ fontSize: 10.5, fontWeight: 600 }}>Ti je pronari — veprimet janë për vizitorët</span>
              </div>
            ) : (
              <>
                {biz.phone && (
                  <a href={`tel:${biz.phone}`} className="action-btn" style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff' }}>
                    <i className="ti ti-phone" style={{ fontSize: 15 }} aria-hidden="true" /> Telefono
                  </a>
                )}
                <button type="button" aria-label="Dërgo mesazh" onClick={() => { if (!userId) { window.location.href = '/auth/login'; return } window.location.href = `/messages?biz=${biz.id}` }}
                  className="action-btn" style={{ background: 'linear-gradient(135deg,#1a1a1a,#000)', color: '#F5C842' }}>
                  <i className="ti ti-message" style={{ fontSize: 15 }} aria-hidden="true" /> Mesazh
                </button>
                <button
                  type="button"
                  onClick={toggleFollow}
                  disabled={followBusy}
                  aria-pressed={following}
                  aria-label={following ? 'Mos e ndiq më këtë biznes' : 'Ndiq këtë biznes'}
                  className="action-btn"
                  style={following
                    ? { background: '#fff', color: '#C42305', border: '1.5px solid #C42305', boxShadow: 'none' }
                    : { background: 'linear-gradient(135deg,#F8D24E,#F5C842)', color: '#111' }}>
                  <i className={`ti ti-${following ? 'check' : 'plus'}`} style={{ fontSize: 15 }} aria-hidden="true" />
                  {following ? 'Po ndjek' : 'Ndiq'}
                </button>
              </>
            )}
            <button type="button" aria-label="Ndaj" onClick={share} className="action-btn" style={{ background: '#f0f0f0', color: '#333', flex: '0 0 48px' }}>
              <i className="ti ti-share-3" style={{ fontSize: 17 }} aria-hidden="true" />
            </button>
          </div>

          {/* Chip-et e biznesit (spec — ana e jashtme): Harta · Hapur tani · NIPT · 0% komision.
              Secili shfaqet vetëm kur ka kuptim; "Hapur tani" vetëm pas montimit (varet nga ora). */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
            {biz.latitude && biz.longitude && (
              <a href={`https://www.google.com/maps?q=${biz.latitude},${biz.longitude}`} target="_blank" rel="noopener noreferrer" className="biz-chip">
                <span aria-hidden="true">🗺️</span> Harta
              </a>
            )}
            {openNow !== null && (
              <span className="biz-chip" style={openNow
                ? { background: '#E7F6EC', color: '#0E7A35', borderColor: '#0E7A3533' }
                : { background: '#FDECEC', color: '#C42305', borderColor: '#C4230533' }}>
                <span aria-hidden="true">🕐</span> {openNow ? 'Hapur tani' : 'Mbyllur tani'}
              </span>
            )}
            {biz.nipt && (
              <span className="biz-chip"><span aria-hidden="true">🏛️</span> NIPT</span>
            )}
            <span className="biz-chip" style={{ background: '#E7F6EC', color: '#0E7A35', borderColor: '#0E7A3533' }}>
              <span aria-hidden="true">🚫</span> 0% komision
            </span>
          </div>
        </div>
      </div>

      {/* BP2 §B2/B3.1 — Pronari e menaxhon biznesin te paneli-pasqyrë (default). Kjo pamje
          publike i shfaqet pronarit VETËM kur ka shtypur "Shiko faqen publike" → banderolë
          e qëndrueshme për t'u kthyer te menaxhimi ("Vepro si: Biznesi"). */}
      {isOwner && asVisitor && (
        <div style={{ background: '#111', color: '#F5C842', margin: '0 0 8px', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 12.5, fontWeight: 700 }}>
          <span><i className="ti ti-eye" aria-hidden="true" /> Po e shikon faqen publike të biznesit</span>
          <button type="button" onClick={() => setAsVisitor(false)}
            style={{ background: '#F5C842', color: '#111', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Kthehu te menaxhimi
          </button>
        </div>
      )}

      {/* ── Description preview ──────────────────────────────── */}
      {biz.description && (
        <div style={{ background: '#fff', margin: '0 0 8px', padding: '14px 16px' }}>
          <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, margin: 0 }}>{descText}</p>
          {descShort && (
            <button type="button" aria-expanded={descExpanded} onClick={() => setDescExpanded(e => !e)} style={{ marginTop: 6, background: 'none', border: 'none', color: '#C42B0F', fontSize: 12, fontWeight: 700, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
              {descExpanded ? 'Shfaq më pak ↑' : 'Shfaq më shumë ↓'}
            </button>
          )}
        </div>
      )}

      {/* ── Quick info strip ─────────────────────────────────── */}
      <div style={{ background: '#fff', margin: '0 0 8px', padding: '4px 16px' }}>
        {biz.address && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">📍</span>
            <span className="info-text">{biz.address}</span>
          </div>
        )}
        {biz.phone && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">📞</span>
            <span className="info-text"><a href={`tel:${biz.phone}`}>{biz.phone}</a></span>
          </div>
        )}
        {biz.website && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">🌐</span>
            <span className="info-text"><a href={biz.website} target="_blank" rel="noopener noreferrer">{biz.website.replace(/^https?:\/\//, '')}</a></span>
          </div>
        )}
        {biz.hours?.schedule && (
          <div className="info-row">
            <span className="info-icon" aria-hidden="true">🕐</span>
            <span className="info-text">{biz.hours.schedule}</span>
          </div>
        )}
      </div>

      </div>{/* /biz-left */}

      <div className="biz-right">
      {/* ── Sticky tabs ──────────────────────────────────────── */}
      <div role="tablist" aria-label="Seksionet e biznesit" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#fff', borderBottom: '1px solid #eee', display: 'flex', marginBottom: 2 }}>
        <button id="tab-grid" type="button" role="tab" aria-selected={activeTab === 'grid'} aria-controls="tabpanel-grid" className={`biz-tab ${activeTab === 'grid' ? 'active' : ''}`} onClick={() => setActiveTab('grid')}>
          <i className="ti ti-layout-grid" style={{ fontSize: 14 }} aria-hidden="true" /> Shpalljet
        </button>
        {/* FINAL §3.7: Info + Vlerësime të bashkuara në një tab "Rreth & Vlerësime". */}
        <button id="tab-about" type="button" role="tab" aria-selected={activeTab === 'about'} aria-controls="tabpanel-about" className={`biz-tab ${activeTab === 'about' ? 'active' : ''}`} onClick={() => { setActiveTab('about'); if (biz && !reviewsLoaded) { setReviewsLoaded(true); supabase.rpc('business_reviews', { p_business: biz.id }).then(({ data }) => setReviews(data || [])) } }}>
          <i className="ti ti-info-circle" style={{ fontSize: 14 }} aria-hidden="true" /> Rreth &amp; Vlerësime{rating.count > 0 ? ` (${rating.count})` : ''}
        </button>
      </div>

      {/* ── Instagram grid tab ───────────────────────────────── */}
      {activeTab === 'grid' && (
        <div id="tabpanel-grid" role="tabpanel" aria-labelledby="tab-grid">
          {listings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px', color: '#aaa', background: '#fff' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden="true">🛍️</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 6 }}>Asnjë shpallje ende</div>
              {isOwner && (
                <button type="button" onClick={() => window.location.href = '/listing/new'} style={{ marginTop: 8, background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Shto shpallje</button>
              )}
            </div>
          ) : (
            // I njejti komponent si te kryefaqja — keshtu kartat e biznesit
            // marrin titull dhe cmim poshte fotos, jo vetem nje pill cmimi mbi
            // te. `showSeller={false}`: te gjitha shpalljet ketu i perkasin
            // ketij biznesi, ndaj chip-i i shitesit vetem do te perseritej.
            <div className="listings-grid" style={{ padding: 12, marginBottom: 0 }}>
              {listings.map((l, idx) => (
                <ListingCard key={l.id} listing={l as any} index={idx} showSeller={false} mounted={mounted} />
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', padding: '14px 0', fontSize: 11, color: '#bbb' }}>
            <>{listings.length} shpallje aktive <span aria-hidden="true">♾️</span></>
          </div>
        </div>
      )}

      {/* ── Rreth & Vlerësime (info) ─────────────────────────── */}
      {activeTab === 'about' && (
        <div id="tabpanel-about" role="tabpanel" aria-labelledby="tab-about" style={{ padding: '8px 0' }}>
          <div className="card">
            <h2 className="card-title"><i className="ti ti-building-store" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Rreth biznesit</h2>
            {biz.tagline && (
              <p style={{ fontSize: 13.5, color: '#C42305', fontWeight: 700, fontStyle: 'italic', marginBottom: 10 }}>“{biz.tagline}”</p>
            )}
            {biz.description
              ? <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginBottom: 12 }}>{biz.description}</p>
              : <p style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>Nuk ka përshkrim.</p>
            }
            {biz.type && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🏷️</span>
                <span className="info-text" style={{ textTransform: 'capitalize' }}>{biz.type}</span>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-title"><i className="ti ti-map-pin" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Vendndodhja & Kontakti</h2>
            {biz.address && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">📍</span>
                <span className="info-text">{biz.address}</span>
              </div>
            )}
            {biz.city && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🏙️</span>
                <span className="info-text">{biz.city}</span>
              </div>
            )}
            {biz.phone && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">📞</span>
                <span className="info-text"><a href={`tel:${biz.phone}`}>{biz.phone}</a></span>
              </div>
            )}
            {biz.whatsapp && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">💬</span>
                <span className="info-text"><a href={`https://wa.me/${biz.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">WhatsApp: {biz.whatsapp}</a></span>
              </div>
            )}
            {biz.contact_person && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">👤</span>
                <span className="info-text">Kontakti: {biz.contact_person}</span>
              </div>
            )}
            {biz.email && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">✉️</span>
                <span className="info-text"><a href={`mailto:${biz.email}`}>{biz.email}</a></span>
              </div>
            )}
            {biz.website && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🌐</span>
                <span className="info-text"><a href={biz.website} target="_blank" rel="noopener noreferrer">{biz.website.replace(/^https?:\/\//, '')}</a></span>
              </div>
            )}
            {biz.hours?.schedule && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🕐</span>
                <span className="info-text">{biz.hours.schedule}</span>
              </div>
            )}
          </div>

          {subcats.length > 0 && (
            <div className="card">
              <h2 className="card-title"><i className="ti ti-tag" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Kategoritë</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {subcats.map((s, i) => (
                  <span key={i} style={{ fontSize: 12, background: '#FFF8E1', color: '#7B5000', padding: '5px 12px', borderRadius: 20, fontWeight: 700, border: '1px solid #F5C84244' }}>
                    {s.icon} {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {biz.latitude && biz.longitude && (
            <div style={{ margin: '8px 12px 0', borderRadius: 16, overflow: 'hidden' }}>
              <MapDisplay lat={biz.latitude} lng={biz.longitude} address={biz.address || biz.name} />
            </div>
          )}

          {/* BP2 §B5 — Galeria e biznesit (rrjet fotosh); shfaqet vetëm kur ka foto. */}
          {Array.isArray(biz.gallery) && biz.gallery.length > 0 && (
            <div className="card">
              <h2 className="card-title"><i className="ti ti-photo" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Galeria</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {biz.gallery.filter(Boolean).slice(0, 12).map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', aspectRatio: '1/1', borderRadius: 10, overflow: 'hidden', background: '#f2f2f2' }}>
                    <img src={url} alt={`Foto ${i + 1} e biznesit ${biz.name}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* FINAL §3.8 — Detajet e reja profesionale; secili rresht shfaqet vetëm kur plotësohet. */}
          {(biz.founded_year || biz.service_area || biz.delivery?.ka || biz.socials?.instagram || biz.socials?.facebook || biz.socials?.tiktok) && (
            <div className="card">
              <h2 className="card-title"><i className="ti ti-building-store" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Detaje</h2>
              {biz.founded_year ? <div className="info-row"><span className="info-icon" aria-hidden="true">📅</span><span className="info-text">Themeluar: <strong>{biz.founded_year}</strong></span></div> : null}
              {biz.service_area ? <div className="info-row"><span className="info-icon" aria-hidden="true">🗺️</span><span className="info-text">Zona e shërbimit: {biz.service_area}</span></div> : null}
              {biz.delivery?.ka ? <div className="info-row"><span className="info-icon" aria-hidden="true">🚚</span><span className="info-text">Dorëzim: Po{biz.delivery.detaje ? ` — ${biz.delivery.detaje}` : ''}</span></div> : null}
              {(biz.socials?.instagram || biz.socials?.facebook || biz.socials?.tiktok) && (
                <div className="info-row" style={{ gap: 12 }}>
                  <span className="info-icon" aria-hidden="true">🔗</span>
                  <span className="info-text" style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap' }}>
                    {biz.socials?.instagram && <a href={biz.socials.instagram.startsWith('http') ? biz.socials.instagram : `https://instagram.com/${biz.socials.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#C42305', fontWeight: 700 }}>Instagram</a>}
                    {biz.socials?.facebook && <a href={biz.socials.facebook.startsWith('http') ? biz.socials.facebook : `https://facebook.com/${biz.socials.facebook}`} target="_blank" rel="noopener noreferrer" style={{ color: '#C42305', fontWeight: 700 }}>Facebook</a>}
                    {biz.socials?.tiktok && <a href={biz.socials.tiktok.startsWith('http') ? biz.socials.tiktok : `https://tiktok.com/@${biz.socials.tiktok.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#C42305', fontWeight: 700 }}>TikTok</a>}
                  </span>
                </div>
              )}
            </div>
          )}

          {(biz.nipt || biz.withdrawal_days || biz.legal_form || (biz.payment_methods && biz.payment_methods.length) || biz.return_policy || biz.warranty) && (
            <div className="card">
              <h2 className="card-title"><i className="ti ti-scale" style={{ fontSize: 16, color: '#C42B0F' }} aria-hidden="true" /> Informacion ligjor</h2>
              {biz.legal_form ? <div className="info-row"><span className="info-icon" aria-hidden="true">🏢</span><span className="info-text">Forma ligjore: <strong>{biz.legal_form}</strong></span></div> : null}
              {biz.payment_methods && biz.payment_methods.length > 0 ? <div className="info-row"><span className="info-icon" aria-hidden="true">💳</span><span className="info-text">Pagesa: {biz.payment_methods.join(' · ')}</span></div> : null}
              {biz.return_policy ? <div className="info-row"><span className="info-icon" aria-hidden="true">↩️</span><span className="info-text">Kthimi: {biz.return_policy}</span></div> : null}
              {biz.warranty ? <div className="info-row"><span className="info-icon" aria-hidden="true">🛡️</span><span className="info-text">Garancia: {biz.warranty}</span></div> : null}
              {biz.nipt && (
                <div className="info-row">
                  <span className="info-icon" aria-hidden="true">🏛️</span>
                  <span className="info-text">NIPT: <strong>{biz.nipt}</strong></span>
                </div>
              )}
              {(biz.withdrawal_days ?? 0) > 0 && (
                <div className="info-row">
                  <span className="info-icon" aria-hidden="true">↩️</span>
                  <span className="info-text">E drejta e tërheqjes: <strong>{biz.withdrawal_days} ditë</strong> (Direktiva EU 2011/83/EU)</span>
                </div>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 11, color: '#bbb' }}>
            Anëtar që nga {new Date(biz.created_at).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      )}

      {/* ── Reviews tab ──────────────────────────────────────── */}
      {/* ── Rreth & Vlerësime (vlerësimet) ───────────────────── */}
      {activeTab === 'about' && (
        <div style={{ margin: 8 }}>
          {rating.count > 0 && rating.avg != null && (
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#111' }}>{rating.avg.toFixed(1)}</div>
              <div>
                <div style={{ color: '#F5C842', fontSize: 16 }} aria-hidden="true">{'★'.repeat(Math.round(rating.avg))}{'☆'.repeat(5 - Math.round(rating.avg))}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{rating.count} vlerësim{rating.count !== 1 ? 'e' : ''}</div>
              </div>
            </div>
          )}
          {reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reviews.map(rv => (
                <div key={rv.id} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Avatar src={rv.reviewer_avatar} name={rv.reviewer_name} type="person" size={30} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{rv.reviewer_name}</div>
                      <div style={{ fontSize: 10, color: '#aaa' }}>{new Date(rv.created_at).toLocaleDateString('sq-AL', { day: 'numeric', month: 'short', year: 'numeric' })}{rv.purchase_verified ? ' · ✅ Blerje e verifikuar' : ''}</div>
                    </div>
                    <div style={{ color: '#F5C842', fontSize: 13 }} aria-label={`${rv.rating} nga 5`}>{'★'.repeat(rv.rating)}{'☆'.repeat(5 - rv.rating)}</div>
                  </div>
                  {rv.comment && <div style={{ fontSize: 13, color: '#444', lineHeight: 1.5 }}>{rv.comment}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }} aria-hidden="true">⭐</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 6 }}>Ende pa vlerësime</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>Klientët që blejnë nga ky biznes do të mund<br />të lënë vlerësimin e tyre këtu.</div>
            </div>
          )}
        </div>
      )}
      </div>{/* /biz-right */}
      </div>{/* /biz-shell */}
    </div>
  )
}

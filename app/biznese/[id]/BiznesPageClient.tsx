'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import dynamicImport from 'next/dynamic'
import Avatar, { tierNgaProfili } from '../../components/Avatar'
import ListingCard from '../../components/ListingCard'
import { TrustBadge } from '../../components/TrustBadge'
import { useSyteLive } from '../../components/PremiumUpsell'
import { useIsOnline } from '../../components/OnlinePresence'
import { BackButton } from '../../components/BackButton'
import { LISTING_SELECT } from '../../../lib/listingSelect'
import { nf, monthYear } from '../../../lib/format'
import { uploadSingleImage } from '../../../lib/uploadImages'

const MapDisplay = dynamicImport(() => import('../../components/MapDisplay').then(m => ({ default: m.MapDisplay })), { ssr: false })

// "Hapur tani" — llogaritet nga hours.days ({mon..sun:{closed,open,close}}) i shkruar nga
// BusinessForm. Thirret VETËM pas montimit (mounted) sepse varet nga ora → pa mospërputhje SSR.
// getDay(): 0=Diel..6=Shtunë. Kthen null kur s'ka orar → chip-i s'shfaqet.
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
function openNowFromHours(h: any): boolean | null {
  const days = h?.days
  if (!days || typeof days !== 'object') return null
  // Ora e SHQIPËRISË (Europe/Tirane), jo e pajisjes së vizitorit — orari i biznesit është
  // lokal; një vizitor jashtë vendit (ose me orë të gabuar) përndryshe sheh gjendje të pasaktë.
  let dayIdx: number, cur: number
  try {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Tirane', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).map(x => [x.type, x.value]),
    )
    const wd: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    dayIdx = wd[p.weekday as string] ?? new Date().getDay()
    cur = Number(p.hour) * 60 + Number(p.minute)
  } catch {
    const n = new Date(); dayIdx = n.getDay(); cur = n.getHours() * 60 + n.getMinutes()
  }
  const d = days[DAY_KEYS[dayIdx]]
  if (!d) return null
  if (d.closed) return false
  if (!d.open || !d.close) return null
  const [oh, om] = String(d.open).split(':').map(Number)
  const [ch, cm] = String(d.close).split(':').map(Number)
  if ([oh, om, ch, cm].some(x => !Number.isFinite(x))) return null
  const o = oh * 60 + om, c = ch * 60 + cm
  return c <= o ? (cur >= o || cur < c) : (cur >= o && cur < c) // c<=o => kalon mesnatën
}
// "Përgjigjet ~N orë/ditë" nga business_response_time (median në orë).
function fmtResp(hrs: number): string {
  if (hrs < 1.5) return '~1 orë'
  if (hrs < 24) return `~${Math.round(hrs)} orë`
  return `~${Math.round(hrs / 24)} ditë`
}
// Tipi i biznesit → etiketë e lexueshme (përputhje me sistemin e ri të regjistrimit —
// BusinessForm.MAIN_TYPES). Pa këtë, shfaqej vlera e papërpunuar "Sherbime_produkte".
function typeLabel(t: string | null | undefined): string {
  switch ((t || '').toLowerCase()) {
    case 'sherbime': return 'Shërbime'
    case 'produkte': return 'Produkte'
    case 'sherbime_produkte': return 'Shërbime & Produkte'
    default: return (t || '').replace(/_/g, ' ')
  }
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

// H6: vlerësimet e biznesit shfaqeshin me kod IDENTIK në dy vende (paneli i pronarit dhe
// pamja publike "Rreth & Vlerësime"). Një komponent i vetëm → një burim, pa kopjim verbatim.
// Kthen përmbajtjen; secili thirrës mban mbështjellësin e vet (role/id për a11y).
function BizReviews({ rating, reviews }: { rating: { count: number; avg: number | null }; reviews: any[] }) {
  return (
    <>
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
          <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 6 }}>Ende pa vlerësime</div>
          <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6 }}>Klientët që blejnë nga ky biznes do të mund të lënë vlerësimin këtu.</div>
        </div>
      )}
    </>
  )
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
  const bizRtDebounce = useRef<ReturnType<typeof setTimeout> | null>(null) // debounce për realtime-in e shpalljeve
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
  // Feedback i "Ndaj" në desktop (pa navigator.share): "Kopjuar!" (si /profile). BUG #11.
  const [copied, setCopied]         = useState(false)
  // Ngarkim INLINE i kopertinës/logos te paneli-pasqyrë — harmonizuar me /profile (ngarkim
  // i menjëhershëm, jo ridrejtim te /edit). Realtime (#137) + setBiz e pasqyrojnë menjëherë.
  const [imgUp, setImgUp]           = useState<'logo' | 'cover' | null>(null)
  const [imgErr, setImgErr]         = useState('')
  // Menaxhimi aktiv↔pasiv i shpalljeve te guaska e biznesit (i njëjti sistem si /profile,
  // por i mëvetësishëm — BP2 §B2). Ngarkohet me përtaci kur hapet tab-i "Shpalljet".
  const [mgmtListings, setMgmtListings] = useState<any[] | null>(null)
  const [mgmtLoaded, setMgmtLoaded]     = useState(false)
  const [listFilter, setListFilter]     = useState<'active' | 'paused' | 'sold'>('active')
  const [listErr, setListErr]           = useState('')
  const [reactMsg, setReactMsg]         = useState('')
  const [reactBusy, setReactBusy]       = useState<string | null>(null)
  const [pendingSold, setPendingSold]   = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

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
    gamification_points?: number | null; trust_score_visible?: boolean | null
  } | null>(null)

  // Syte live te faqja e biznesit (BLLOKU Imazhi 4: "👁+🔴") — e njejta presence
  // reale fail-soft si te shpallja; kanal i vecante 'biz-{id}'.
  const syteLive = useSyteLive(biz ? `biz-${biz.id}` : undefined)
  // Prania LIVE e pronarit — e njëjta si te /u/[id] (Imazhi 5). Shfaqet vetëm te faqja
  // PUBLIKE e biznesit (koherencë me profilin publik të personit); jo te paneli-pasqyrë.
  const ownerOnline = useIsOnline(biz?.owner_id)

  useEffect(() => {
    setMounted(true)
    // ?public=1 (nga "Shiko faqen publike" te /profile) → hap pamjen publike edhe për pronarin.
    try { if (new URLSearchParams(window.location.search).get('public') === '1') setAsVisitor(true) } catch {}
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id)
    })
    fetchBiz()
  }, [])

  // SINKRONIZIM LIVE: sapo ndryshon biznesi (edito → ruaj, foto e galerisë, çdo fushë),
  // faqja e jashtme publike/pasqyra rifreskohet menjëherë (realtime). `businesses` është në
  // publikimin supabase_realtime + politika `biz_public_read` → shikuesi merr ngjarjet.
  useEffect(() => {
    if (!biz?.id) return
    const ch = supabase.channel('biz-live-' + biz.id)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'businesses', filter: `id=eq.${biz.id}` }, () => { fetchBiz() })
      // Shpalljet e biznesit LIVE (mungonte): shto/hiq/shit një shpallje → vitrina rifreskohet.
      // DEBOUNCE: `increment_listing_views` bën UPDATE në listings në ÇDO shikim (kurthi #7); pa
      // debounce, fetchBiz() (~10 query) do thirrej për çdo shikim. Grumbullojmë ngjarjet në 1.5s.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `business_id=eq.${biz.id}` }, () => {
        if (bizRtDebounce.current) clearTimeout(bizRtDebounce.current)
        bizRtDebounce.current = setTimeout(() => { fetchBiz() }, 1500)
      })
      .subscribe()
    return () => {
      if (bizRtDebounce.current) clearTimeout(bizRtDebounce.current)
      supabase.removeChannel(ch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biz?.id])

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
        .select('is_premium,premium_expires_at,has_boost,boost_expires_at,gamification_points,trust_score_visible')
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
        .select(LISTING_SELECT)
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
    if (navigator.share) { navigator.share({ title: biz?.name, url: window.location.href }).catch(() => {}); return }
    // Desktop / pa Web Share: kopjo linkun dhe jep feedback "Kopjuar!" (jo no-op i heshtur).
    navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {})
  }

  // Ngarkim i menjëhershëm i kopertinës/logos (si /profile): uploadSingleImage (path unik →
  // cache-bust, tip i saktë, EXIF) → update businesses → setBiz (realtime sinkronizon pjesën tjetër).
  async function uploadBizImage(file: File, type: 'logo' | 'cover') {
    if (!biz || imgUp) return
    setImgUp(type); setImgErr('')
    const r = await uploadSingleImage(file, type === 'cover' ? 'covers' : 'avatars')
    if (r.error || !r.url) { setImgErr(r.error || 'Ngarkimi dështoi'); setImgUp(null); setTimeout(() => setImgErr(''), 3500); return }
    const field = type === 'cover' ? 'cover_url' : 'logo_url'
    const { error } = await supabase.from('businesses').update({ [field]: r.url }).eq('id', biz.id)
    if (error) { setImgErr(error.message); setTimeout(() => setImgErr(''), 3500) }
    else setBiz((b: any) => ({ ...b, [field]: r.url }))
    setImgUp(null)
  }

  // ── Menaxhimi i shpalljeve te guaska e biznesit (aktiv/pasiv) ──────────────────
  // Të gjitha shpalljet e biznesit (aktive+pauzuara+shitura), NDRYSHE nga `listings`
  // publike (vetëm aktive). Ngarkohet vetëm kur pronari hap tab-in "Shpalljet".
  function loadMgmt() {
    if (mgmtLoaded || !biz) return
    setMgmtLoaded(true)
    // listing-select-exempt: kjo NUK ushqen ListingCard — është lista e MENAXHIMIT te paneli
    // i pronarit (rreshta me butona Rifresko/Shitur/Hiq), kërkon is_active/last_bumped_at që
    // LISTING_SELECT s'i ka. Prandaj projeksion me dorë, i lejuar shprehimisht.
    supabase.from('listings')
      .select('id,title,price,currency,images,city,is_premium,views_count,is_active,status,last_bumped_at,created_at,rank_tier,author,business_id')
      .eq('business_id', biz.id)
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => setMgmtListings(data || []))
  }
  const bizFmt = (p: number, c: string) => !p ? 'Me marrëveshje' : c === 'EUR' ? `${nf(p)} €` : `${nf(p)} L`
  function canBump(lastBumped: string | null): boolean {
    if (!lastBumped) return true
    return Date.now() - new Date(lastBumped).getTime() >= 7 * 24 * 60 * 60 * 1000
  }
  function bumpDaysLeft(lastBumped: string | null): number {
    if (!lastBumped) return 0
    const rem = 7 * 24 * 60 * 60 * 1000 - (Date.now() - new Date(lastBumped).getTime())
    return Math.max(0, Math.ceil(rem / (24 * 60 * 60 * 1000)))
  }
  async function bizBump(id: string) {
    const now = new Date().toISOString()
    const para = (mgmtListings || []).find(l => l.id === id)
    setMgmtListings(ls => (ls || []).map(l => l.id === id ? { ...l, created_at: now, last_bumped_at: now } : l))
    const { error } = await supabase.from('listings').update({ created_at: now, last_bumped_at: now }).eq('id', id)
    if (error) {
      /*  Kthim mbrapsht i vertete + mesazhi i sakte i bazes. "Provo sërish" ishte
       *  keshille e gabuar: rifreskimi nuk deshtoi rastesisht, por sepse ende
       *  s'ka ardhur koha — dhe trigeri e thote saktesisht sa mbetet, ne shqip.  */
      if (para) setMgmtListings(ls => (ls || []).map(l => l.id === id ? para : l))
      setListErr(error.message || 'Nuk u rifreskua dot.')
      setTimeout(() => setListErr(''), 6000)
    }
  }
  async function bizReactivate(id: string) {
    if (reactBusy) return
    setReactBusy(id); setReactMsg('')
    const { data, error } = await supabase.from('listings').update({ is_active: true, status: 'active' }).eq('id', id).select('id')
    if (error || !data || data.length === 0) {
      const m = (error?.message || '').includes('KUFI_SHPALLJESH')
        ? 'Ke arritur kufirin e shpalljeve aktive. Pauzo një tjetër ose kalo në Premium.'
        : (error?.message || 'Nuk u riaktivizua dot. Provo sërish.')
      setReactMsg('err:' + m)
    } else {
      setMgmtListings(ls => (ls || []).map(l => l.id === id ? { ...l, is_active: true, status: 'active' } : l))
      setReactMsg('ok:Shpallja u riaktivizua.')
    }
    setReactBusy(null); setTimeout(() => setReactMsg(''), 4000)
  }
  async function bizMarkSold(id: string) {
    setListErr('')
    const { data, error } = await supabase.from('listings').update({ status: 'sold', is_active: false }).eq('id', id).select('id')
    if (error || !data || data.length === 0) { setListErr(error?.message || 'Nuk u shënua dot si e shitur. Provo sërish.'); return }
    setMgmtListings(ls => (ls || []).map(l => l.id === id ? { ...l, status: 'sold', is_active: false } : l)); setPendingSold(null)
  }
  // "Hiq" = çaktivizim i butë (kalon te "Të pauzuara"; riaktivizohet kurdo). Zgjedhje e
  // ndershme: s'është fshirje e vërtetë (si /profile), ndaj etiketa thotë "Hiq/pauzo".
  async function bizDeactivate(id: string) {
    setListErr('')
    const { data, error } = await supabase.from('listings').update({ is_active: false }).eq('id', id).select('id')
    if (error || !data || data.length === 0) { setListErr(error?.message || 'Nuk u hoq dot. Provo sërish.'); return }
    setMgmtListings(ls => (ls || []).map(l => l.id === id ? { ...l, is_active: false } : l)); setPendingDelete(null)
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
          .stat-pill{display:flex;flex-direction:column;align-items:center;flex:1;}
          .stat-n{font-size:18px;font-weight:800;color:#F5C842;}
          .stat-l{font-size:10px;color:#555;font-weight:500;margin-top:1px;}
          .bizp-tabs{position:sticky;top:50px;z-index:10;background:#fff;border-bottom:1px solid #eee;display:flex;overflow-x:auto;margin-bottom:2px;}
          .bizp-tabs button{flex:1 0 auto;padding:12px 14px;font-size:12.5px;font-weight:700;border:none;background:none;cursor:pointer;border-bottom:2.5px solid transparent;color:#888;font-family:inherit;white-space:nowrap;display:inline-flex;align-items:center;justify-content:center;gap:5px;}
          .bizp-tabs button.on{color:#C42B0F;border-bottom-color:#E63312;}
          .mcard{background:#fff;border-radius:14px;margin:8px 12px 0;padding:14px 16px;}
          .mrow{display:flex;align-items:center;gap:12px;width:100%;min-height:52px;background:#fff;border:1px solid #ececec;border-radius:12px;padding:10px 14px;cursor:pointer;font-family:inherit;text-align:left;margin-bottom:8px;}
          .mrow:hover{background:#fafafa;border-color:#ddd;}
          /* Menaxhimi i shpalljeve (aktiv/pasiv) — i njëjti sistem si /profile, i mëvetësishëm
             te guaska e biznesit (BP2 §B2), i filtruar për business_id. */
          .bl-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:0.5px solid #f5f5f0;}
          .bl-row:last-child{border:none;}
          .bl-thumb{width:52px;height:52px;border-radius:10px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden;cursor:pointer;}
          .bl-thumb img{width:100%;height:100%;object-fit:cover;}
          .bl-info{flex:1;min-width:0;cursor:pointer;}
          .bl-title{font-size:12px;font-weight:700;color:#1a1a1a;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
          .bl-price{font-size:13px;font-weight:800;color:#C42B0F;margin-top:2px;}
          .bl-meta{font-size:10px;color:#aaa;margin-top:2px;}
          .bl-edit{background:#FFFBEA;border:1px solid #e0b030;border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer;color:#856404;font-family:inherit;min-height:34px;}
          .bl-edit:disabled{opacity:.6;cursor:not-allowed;}
          .bl-del{background:#FFF0EE;border:none;border-radius:10px;padding:6px 10px;font-size:12px;cursor:pointer;color:#C42B0F;font-family:inherit;min-height:34px;}
          .bl-filter{flex:1;min-height:40px;border-radius:9px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;border:1px solid #eee;background:#fff;color:#666;}
          .bl-filter.on{border:1.5px solid #C42305;background:#FFF1EE;color:#C42305;}
          .mrow i.lead{font-size:19px;color:#C42B0F;width:24px;text-align:center;}
          .mrow .mtxt{flex:1;min-width:0;}
          .mrow .mtt{font-size:13.5px;font-weight:700;color:#111;}
          .mrow .msub{font-size:11px;color:#555;margin-top:1px;}
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

          {/* Kopertinë — ngarkim INLINE i menjëhershëm (harmonizuar me /profile) */}
          <div className="bizp-cover">
            {biz.cover_url && <img src={biz.cover_url} alt="" loading="lazy" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />}
            <label className="cam" aria-label="Ndrysho kopertinën" style={{ top: 12, right: 12, width: 'auto', padding: '0 12px', height: 34, gap: 6, fontSize: 12, fontWeight: 700 }}>
              <span aria-hidden="true">{imgUp === 'cover' ? '⏳' : '📷'}</span> Kopertina
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadBizImage(f, 'cover'); e.currentTarget.value = '' }} />
            </label>
          </div>

          <div className="bizp-card">
            {/* Avatar unazë+🏢 (+kurorë kur VIP) + kamerë INLINE */}
            <div style={{ position: 'relative', width: 84, marginTop: -42, marginBottom: 10 }}>
              <Avatar src={biz.logo_url} name={biz.name} type="business" tier={tier} verified={biz.is_verified} size={84} />
              {/* Kamera te CEPI LART-MAJTAS: i vetmi cep që Avatar-i s'e përdor kurrë
                  (djathtas-lart=vula e abonimit, djathtas-poshtë=🏢/✓, majtas-poshtë=pika online).
                  Më parë rrinte poshtë-djathtas dhe përplasej me vulën 🏢 (raporti terminal, H). */}
              <label className="cam" aria-label="Ndrysho logon" style={{ top: -4, left: -4, width: 30, height: 30 }}>
                <span aria-hidden="true" style={{ fontSize: 13 }}>{imgUp === 'logo' ? '⏳' : '📷'}</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadBizImage(f, 'logo'); e.currentTarget.value = '' }} />
              </label>
            </div>
            {imgErr && <div role="alert" style={{ fontSize: 11, color: '#C42305', marginBottom: 6 }}>{imgErr}</div>}

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

            {/* Reputacioni (GAP 3+4 — mbyllja e lakut): TrustBadge i plotë (unazë "X/100") +
                "⚡ N pikë" reale të pronarit; pikët fitohen e njoftohen por s'shfaqeshin këtu. */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', margin: '10px 0 2px' }}>
              {/* Opt-out i Trust Score (Ligji 124/2024 neni 19 · CLAUDE.md §2.1) — si /u & /listing */}
              {pronari?.trust_score_visible !== false && (
                <TrustBadge createdAt={biz.created_at} listingsActive={listings.length} gamificationPoints={pronari?.gamification_points || 0} />
              )}
              {(pronari?.gamification_points || 0) > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #F5C84255', borderRadius: 9, padding: '4px 10px' }}>
                  <span aria-hidden="true">⚡</span> {pronari?.gamification_points} pikë
                </span>
              )}
            </div>

            {/* Statistika (Shpallje · Të shitura · Ndjekës · Anëtar) */}
            <div className="alpz-stats" style={{ marginTop: 12 }}>
              <div className="stat-pill"><span className="stat-n">{listings.length}</span><span className="stat-l">Shpallje</span></div>
              <div className="stat-div" />
              <div className="stat-pill"><span className="stat-n" style={soldCount > 0 ? { color: '#4ADE80' } : undefined}>{soldCount}</span><span className="stat-l">Të shitura</span></div>
              <div className="stat-div" />
              <div className="stat-pill"><span className="stat-n">{followers}</span><span className="stat-l">Ndjekës</span></div>
              <div className="stat-div" />
              <div className="stat-pill"><span className="stat-n">{new Date(biz.created_at).getFullYear()}</span><span className="stat-l">Anëtar prej</span></div>
            </div>

            {/* Ana e BRENDSHME (menaxhimi) NUK shfaq shiritin publik 👁/🔴/0% — ato janë
                sinjale trust/marketingu për vizitorin (rrinë vetëm te faqja publike, më poshtë);
                pronari i sheh pamjet te "Analitika". (Vendim Martinel + verifikim live, 26 gusht.) */}

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
            <button type="button" role="tab" id="tab-home" aria-controls="tabpanel-home" className={panelTab === 'home' ? 'on' : ''} aria-selected={panelTab === 'home'} onClick={() => setPanelTab('home')}><i className="ti ti-building-store" aria-hidden="true" /> Profili i biznesit</button>
            <button type="button" role="tab" id="tab-listings" aria-controls="tabpanel-listings" className={panelTab === 'listings' ? 'on' : ''} aria-selected={panelTab === 'listings'} onClick={() => { setPanelTab('listings'); loadMgmt() }}><i className="ti ti-layout-grid" aria-hidden="true" /> Shpalljet</button>
            <button type="button" role="tab" id="tab-reviews" aria-controls="tabpanel-reviews" className={panelTab === 'reviews' ? 'on' : ''} aria-selected={panelTab === 'reviews'} onClick={() => { setPanelTab('reviews'); if (!reviewsLoaded) { setReviewsLoaded(true); supabase.rpc('business_reviews', { p_business: biz.id }).then(({ data }) => setReviews(data || [])) } }}><i className="ti ti-star" aria-hidden="true" /> Vlerësime</button>
          </div>

          {/* Tab: Profili i biznesit — kartat e menaxhimit (mision-biznesi; pa ekskluzivitete llogarie) */}
          {panelTab === 'home' && (
            <div className="mcard" role="tabpanel" id="tabpanel-home" aria-labelledby="tab-home">
              {/* Një hyrje e vetme te editimi (pa përsëritje): "Të dhënat e biznesit" përfshin
                  edhe logon & kopertinën — më parë ishin dy butona që hapnin të njëjtin /edit. */}
              <button type="button" className="mrow" onClick={() => { window.location.href = `/biznese/${biz.id}/edit` }}>
                <i className="ti ti-settings lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Të dhënat e biznesit</span><span className="msub">Logo &amp; kopertinë, emri, kontakti, orari, ligjore…</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              <button type="button" className="mrow" onClick={() => { window.location.href = `/biznese/${biz.id}/analytics` }}>
                <i className="ti ti-chart-bar lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Analitika</span><span className="msub">Shikime, arritje, kontakte (pa referral)</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              <button type="button" className="mrow" onClick={() => { window.location.href = `/messages` }}>
                <i className="ti ti-message lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Mesazhet</span><span className="msub">Bisedat e tua — një inbox i vetëm</span></span>
                <i className="ti ti-chevron-right arr" aria-hidden="true" />
              </button>
              {/* Plani (trashëgim) — reflektim i planit të llogarisë; menaxhimi mbetet te llogaria personale */}
              <div className="mrow" style={{ cursor: 'default' }}>
                <i className="ti ti-crown lead" aria-hidden="true" />
                <span className="mtxt"><span className="mtt">Plani: {tierLabel || 'Falas'} <span style={{ fontSize: 10, fontWeight: 700, color: '#888' }}>· trashëgim</span></span><span className="msub">Trashëguar nga llogaria — menaxhohet te “Vepro si: Unë”</span></span>
              </div>
            </div>
          )}

          {/* Tab: Shpalljet — MENAXHIM aktiv/pasiv (jo vetëm shfaqje). Sistemi i /profile,
              i mëvetësishëm te guaska e biznesit (BP2 §B2), i filtruar për business_id:
              filtra Aktive/Të pauzuara/Të shitura + ⬆️ rifresko · ♻️ riaktivizo · ✏️ ndrysho
              · 💰 shitur · 🗑 hiq(pauzo). */}
          {panelTab === 'listings' && (
            <div role="tabpanel" id="tabpanel-listings" aria-labelledby="tab-listings" style={{ background: '#fff', borderRadius: 14, margin: '8px 12px 0', padding: '14px 16px' }}>
              {listErr && <div role="alert" style={{ background: '#FEECEC', color: '#B42318', border: '1px solid #F5C2C2', borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>{listErr}</div>}
              {reactMsg && <div role="alert" style={{ background: reactMsg.startsWith('err:') ? '#FEECEC' : '#E7F6EC', color: reactMsg.startsWith('err:') ? '#B42318' : '#0E7A35', border: `1px solid ${reactMsg.startsWith('err:') ? '#F5C2C2' : '#8fd3a8'}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, marginBottom: 10 }}>{reactMsg.split(/:(.+)/)[1]}</div>}
              {mgmtListings === null ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#555', fontSize: 12 }}>Duke ngarkuar…</div>
              ) : mgmtListings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#aaa' }}>
                  <div style={{ fontSize: 44, marginBottom: 10 }} aria-hidden="true">🛍️</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#666', marginBottom: 8 }}>Asnjë shpallje ende</div>
                  <button type="button" onClick={() => { window.location.href = '/listing/new' }} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>+ Shto shpallje</button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Shpalljet e biznesit</span>
                    <button type="button" onClick={() => { window.location.href = '/listing/new' }} style={{ background: '#F5C842', border: 'none', borderRadius: 9, padding: '7px 14px', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', color: '#111' }}>+ Shto</button>
                  </div>
                  <div role="tablist" aria-label="Filtro shpalljet" style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {([['active', 'Aktive'], ['paused', 'Të pauzuara'], ['sold', 'Të shitura']] as const).map(([k, etiketa]) => {
                      const n = k === 'active' ? mgmtListings.filter(l => l.is_active).length
                              : k === 'sold' ? mgmtListings.filter(l => l.status === 'sold').length
                              : mgmtListings.filter(l => !l.is_active && l.status !== 'sold').length
                      return (
                        <button key={k} type="button" role="tab" aria-selected={listFilter === k} className={`bl-filter ${listFilter === k ? 'on' : ''}`} onClick={() => setListFilter(k)}>{etiketa} ({n})</button>
                      )
                    })}
                  </div>
                  {(() => {
                    const shown = listFilter === 'active' ? mgmtListings.filter(l => l.is_active)
                                : listFilter === 'sold' ? mgmtListings.filter(l => l.status === 'sold')
                                : mgmtListings.filter(l => !l.is_active && l.status !== 'sold')
                    const bosh = listFilter === 'active' ? 'Nuk ke shpallje aktive.' : listFilter === 'sold' ? 'Ende asnjë shpallje e shitur.' : 'Asnjë shpallje e pauzuar.'
                    return shown.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px 0', color: '#555', fontSize: 12 }}>
                        <i className="ti ti-package" style={{ fontSize: 36, display: 'block', marginBottom: 10, color: '#F5C842' }} aria-hidden="true" />{bosh}
                      </div>
                    ) : shown.map(l => (
                      <div key={l.id} className="bl-row" style={!l.is_active ? { opacity: 0.72 } : undefined}>
                        <div role="link" tabIndex={0} className="bl-thumb" onClick={() => { window.location.href = `/listing/${l.id}` }} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }}>
                          {l.images?.[0] ? <img src={l.images[0]} alt={l.title} loading="lazy" /> : <i className="ti ti-photo" style={{ color: '#ccc', fontSize: 20 }} aria-hidden="true" />}
                        </div>
                        <div role="link" tabIndex={0} className="bl-info" onClick={() => { window.location.href = `/listing/${l.id}` }} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${l.id}` }}>
                          <div className="bl-title">{l.title}</div>
                          <div className="bl-price">{bizFmt(l.price, l.currency)}</div>
                          <div className="bl-meta"><span aria-hidden="true">👁</span> {l.views_count || 0} · <span aria-hidden="true">📍</span> {l.city || 'Shqipëri'}{l.is_premium ? ' · ⭐ Premium' : ''}</div>
                        </div>
                        {l.is_active && (canBump(l.last_bumped_at) ? (
                          <button type="button" className="bl-edit" onClick={() => bizBump(l.id)} aria-label="Rifresko shpalljen" style={{ fontSize: 13 }}><span aria-hidden="true">⬆️</span></button>
                        ) : (
                          <span title={`Mund ta rifreskosh pas ${bumpDaysLeft(l.last_bumped_at)} ditësh`} style={{ fontSize: 10, color: '#aaa', padding: '0 4px' }}>{bumpDaysLeft(l.last_bumped_at)}d</span>
                        ))}
                        {!l.is_active && l.status !== 'sold' && (
                          <button type="button" className="bl-edit" disabled={reactBusy === l.id} onClick={() => bizReactivate(l.id)} aria-label="Riaktivizo shpalljen" title="Riaktivizo" style={{ fontSize: 13 }}><span aria-hidden="true">{reactBusy === l.id ? '⏳' : '♻️'}</span></button>
                        )}
                        <button type="button" className="bl-edit" onClick={() => { window.location.href = `/listing/${l.id}/edit` }} aria-label="Ndrysho">✏️</button>
                        {l.is_active && (pendingSold === l.id ? (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <button type="button" onClick={() => bizMarkSold(l.id)} style={{ background: 'linear-gradient(135deg,#0E7A35,#0b6a2e)', color: '#fff', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Shitur ✓</button>
                            <button type="button" onClick={() => setPendingSold(null)} style={{ background: '#eee', color: '#555', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Jo</button>
                          </div>
                        ) : (
                          <button type="button" className="bl-edit" onClick={() => setPendingSold(l.id)} aria-label="Shëno si të shitur" title="Shëno si të shitur"><span aria-hidden="true">💰</span></button>
                        ))}
                        {pendingDelete === l.id ? (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            <button type="button" onClick={() => bizDeactivate(l.id)} style={{ background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Hiq</button>
                            <button type="button" onClick={() => setPendingDelete(null)} style={{ background: '#eee', color: '#555', border: 'none', borderRadius: 7, padding: '3px 9px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Jo</button>
                          </div>
                        ) : (
                          <button type="button" className="bl-del" onClick={() => setPendingDelete(l.id)} aria-label="Hiq shpalljen (pauzo)"><span aria-hidden="true">🗑</span></button>
                        )}
                      </div>
                    ))
                  })()}
                </>
              )}
            </div>
          )}

          {/* Tab: Vlerësime (subjekt = biznes) */}
          {panelTab === 'reviews' && (
            <div style={{ margin: 8 }} role="tabpanel" id="tabpanel-reviews" aria-labelledby="tab-reviews">
              <BizReviews rating={rating} reviews={reviews} />
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
        .stat-l{font-size:10px;color:#555;font-weight:500;margin-top:1px;}
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
        <BackButton style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,.45)', borderRadius: '50%' }} iconStyle={{ fontSize: 18, color: '#fff' }} />
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
            online={ownerOnline}
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

          {/* Reputacioni (RESTAURIMI FINAL, dëshifrimi B — zëvendëson BP2 C4): koka publike e
              biznesit shfaq ★ rating + "📦 Shitës aktiv" + "⚡ pikë" + TrustBadge unazë "X/100". */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            {/* 👑 VIP / Premium (tier i trashëguar nga pronari) + 🏢 Biznes — më parë vetëm te
                paneli i pronarit, jo te pamja publike (gjetje audit: badge-t mungonin te vizitori). */}
            {tierLabel && (
              <span style={tier === 'vip'
                ? { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: '#7C3AED', background: '#F3E8FF', border: '1px solid #7C3AED33', borderRadius: 9, padding: '4px 10px' }
                : { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 800, color: '#7A4A00', background: '#FFF3D6', border: '1px solid #F5C84255', borderRadius: 9, padding: '4px 10px' }}>
                <span aria-hidden="true">👑</span> {tierLabel}
              </span>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: '#0B8A5A', background: '#E7F8F1', border: '1px solid #0B8A5A33', borderRadius: 9, padding: '4px 10px' }}>
              <span aria-hidden="true">🏢</span> Biznes
            </span>
            {rating.count > 0 && rating.avg != null && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FFF8E1', color: '#7B5000', border: '1px solid #F5C84255', borderRadius: 9, padding: '4px 10px', fontSize: 12.5, fontWeight: 800 }}>
                <span aria-hidden="true">★</span> {rating.avg.toFixed(1)}
                <span style={{ fontWeight: 600, color: '#9a7b2a' }}>({rating.count})</span>
              </span>
            )}
            {listings.length > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: '#0E7A35', background: '#E7F6EC', border: '1px solid #0E7A3533', borderRadius: 9, padding: '4px 10px' }}>
                <span aria-hidden="true">📦</span> Shitës aktiv
              </span>
            )}
            {(pronari?.gamification_points || 0) > 0 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700, color: '#7A4A00', background: '#FFF8E1', border: '1px solid #F5C84255', borderRadius: 9, padding: '4px 10px' }}>
                <span aria-hidden="true">⚡</span> {pronari?.gamification_points} pikë
              </span>
            )}
            {pronari?.trust_score_visible !== false && (
              <TrustBadge createdAt={biz.created_at} listingsActive={listings.length} gamificationPoints={pronari?.gamification_points || 0} />
            )}
          </div>

          {/* Stats row — matrica e ngrire (BLLOKU Imazhi 4): Shpallje / Të shitura /
              Ndjekës / Anëtar, PA Shikime (ato zbresin te rreshti 👁+🔴 poshtë). */}
          <div className="alpz-stats" style={{ marginBottom: 8 }}>
            <div className="stat-pill">
              <span className="stat-n">{listings.length}</span>
              <span className="stat-l">Shpallje</span>
            </div>
            <div className="stat-div" />
            <div className="stat-pill">
              <span className="stat-n" style={soldCount > 0 ? { color: '#4ADE80' } : undefined}>{soldCount}</span>
              <span className="stat-l">Të shitura</span>
            </div>
            <div className="stat-div" />
            <div className="stat-pill">
              <span className="stat-n">{followers}</span>
              <span className="stat-l">Ndjekës</span>
            </div>
            <div className="stat-div" />
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
                <button type="button" aria-label="Dërgo mesazh" onClick={() => { if (!userId) { window.location.href = '/auth/login'; return } window.location.href = `/messages?with=${biz.owner_id}` }}
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
            {copied && (
              <div role="status" style={{ position: 'fixed', left: '50%', bottom: 24, transform: 'translateX(-50%)', background: '#111', color: '#fff', padding: '10px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,.25)' }}>
                <i className="ti ti-check" aria-hidden="true" /> Kopjuar!
              </div>
            )}
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
            {/* H5: chip-i "🏛️ NIPT" pa vlerë hiqet — NIPT-i real me numër shfaqet te rreshti
                ligjor te tab-i "Rreth" (një vend i vetëm, me vlerën e vërtetë). */}
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

      {/* BP2 B5: "Quick info strip"-i u hoq — përsëriste adresë/telefon/website/orar që
          shfaqen te tab-i "Rreth & Vlerësime" (kartela "Vendndodhja & Kontakti"). Një vend i
          vetëm për kontaktin, pa dublim mes strip-it dhe tab-it. */}

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
              : <p style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>Nuk ka përshkrim.</p>
            }
            {biz.type && (
              <div className="info-row">
                <span className="info-icon" aria-hidden="true">🏷️</span>
                <span className="info-text">{typeLabel(biz.type)}</span>
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
            Anëtar që nga {monthYear(biz.created_at)}
          </div>
        </div>
      )}

      {/* ── Reviews tab ──────────────────────────────────────── */}
      {/* ── Rreth & Vlerësime (vlerësimet) ───────────────────── */}
      {activeTab === 'about' && (
        <div style={{ margin: 8 }}>
          <BizReviews rating={rating} reviews={reviews} />
        </div>
      )}
      </div>{/* /biz-right */}
      </div>{/* /biz-shell */}
    </div>
  )
}

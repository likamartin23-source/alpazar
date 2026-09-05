'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../../../lib/supabase'
import { nf, dateShort, dayMonth, monthYear, clockTime, priceLabel } from '../../../lib/format'
import { isNewMember } from '../../components/Badges'
import OfferBox from '../../components/OfferBox'
import { SocialProofBar, SellerPremiumUpsell } from '../../components/PremiumUpsell'
import { ReportSheet } from '../../components/ReportSheet'
import { saveRefFromUrl, buildShareUrl } from '../../../lib/referral'
import { TrustBadge } from '../../components/TrustBadge'
import { IdentityBadges } from '../../components/IdentityBadges'
import { SharePanel } from '../../components/SharePanel'
import { ImageCarousel } from '../../components/ImageCarousel'
import { BackButton } from '../../components/BackButton'
import { LISTING_SELECT } from '../../../lib/listingSelect'
import Avatar, { tierNgaProfili, avatarVerified } from '../../components/Avatar'
import { useIsOnline } from '../../components/OnlinePresence'
import ListingCard from '../../components/ListingCard'
import { trackEvent } from '../../../lib/track'

/*  `loading` NUK eshte zbukurim — eshte i vetmi rregullim i CLS-se ne kete faqe.
 *  Matur me 31 gusht 2026: pa te, folea e hartes eshte nje <template> me
 *  lartesi 0 deri ne ~900ms, pastaj behet nje DIV 235px. Rritja i shtynte
 *  244px poshte TE GJITHA seksionet nen te — dhe deshmia ishte mashtruese,
 *  sepse burimet e raportuara nga `layout-shift` ishin elementet e ZHVENDOSUR
 *  (textarea e ofertes, butonat e sigurise), jo shkaktari. CLS 0,076 te
 *  desktop-i vinte i teri prej ketej. Lartesia 235px eshte e MATUR nga harta
 *  reale, jo e hamendesuar. */
const MapDisplay = dynamic(
  () => import('../../components/MapDisplay').then(m => ({ default: m.MapDisplay })),
  {
    ssr: false,
    loading: () => (
      <div aria-hidden="true"
        style={{ height: 235, borderRadius: 12, background: 'linear-gradient(135deg,#FBF7E8,#F2EAD0)' }} />
    ),
  },
)

const CATEGORY_LABELS: Record<string, string> = {
  elektronike: 'Elektronikë', makina: 'Makina', shtepi: 'Shtëpi & Mobilje',
  veshje: 'Veshje & Aksesore', sport: 'Sport & Hobi', sherbime: 'Shërbime',
  femije: 'Fëmijë', bukuri: 'Bukuri & Kujdes',
}

function fullTime(d: string) {
  return clockTime(d)
}
function dayLabel(d: string) {
  const dt = new Date(d), now = new Date()
  if (dt.toDateString() === now.toDateString()) return 'Sot'
  const yes = new Date(); yes.setDate(now.getDate() - 1)
  if (dt.toDateString() === yes.toDateString()) return 'Dje'
  return dayMonth(d)
}
function pubDate(d: string) {
  return dateShort(d)
}

export default function ListingPageClient({ params, initialListing, initialSeller, initialSellerCount, initialBiz }: { params: { id: string }; initialListing?: any; initialSeller?: any; initialSellerCount?: number; initialBiz?: any }) {
  const [listing, setListing]         = useState<any>(initialListing ?? null)
  // §12/task#18: shitesi + numri + biznesi vijne nga serveri (initial*) → blloku i
  // shitesit/biznesit + kontakti render-ohen ne SSR; useEffect vetem i freskon.
  const [seller, setSeller]           = useState<any>(initialSeller ?? null)
  const [sellerCount, setSellerCount] = useState(initialSellerCount ?? 0)
  const sellerOnline = useIsOnline(seller?.id) // prania LIVE e shitësit (BLLOKU Imazhi 3)
  const [loading, setLoading]         = useState(!initialListing)
  const [loadError, setLoadError]     = useState(false)
  const [offerState, setOfferState] = useState<any>(null)
  /*  Kontakti: `kontakti` mban kanalin e zgjedhur (wa/viber) dhe njekohesisht
   *  hap fleten; numri mbahet vecmas sepse vjen nga nje RPC dhe NUK duhet te
   *  jetoje te objekti i shitesit (perndryshe do te rrinte ne memorie edhe pa
   *  u kerkuar dhe do te ishte i lehte per t'u ri-ekspozuar).  */
  const [kontakti,     setKontakti]     = useState<'wa' | 'viber' | null>(null)
  const [sellerPhone,  setSellerPhone]  = useState<string | null>(null)
  const [kontaktDuke,  setKontaktDuke]  = useState(false)
  const [kontaktGabim, setKontaktGabim] = useState<string | null>(null)

  async function hapKontaktin() {
    if (sellerPhone || kontaktDuke) return
    if (!user) { window.location.href = '/auth/login'; return }
    setKontaktDuke(true); setKontaktGabim(null)
    try {
      const { data } = await supabase.rpc('listing_contact', { p_listing_id: params.id })
      if (data?.numri) setSellerPhone(data.numri)
      else setKontaktGabim(data?.mesazhi || 'Kontakti nuk u hap dot.')
    } catch { setKontaktGabim('Kontakti nuk u hap dot.') }
    setKontaktDuke(false)
  }
  const [similar, setSimilar]         = useState<any[]>([])
  const [user, setUser]               = useState<any>(null)
  const [liked, setLiked]             = useState(false)
  const [myRefCode, setMyRefCode]     = useState<string | null>(null)
  const [shareOpen, setShareOpen]     = useState(false)

  // Vlerësimi i shitësit
  const [myReview, setMyReview]       = useState<any>(null)
  const [reviewStars, setReviewStars] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewMsg, setReviewMsg]     = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)

  // Price Alert
  const [priceAlert, setPriceAlert]         = useState<any>(null)
  const [alertOpen, setAlertOpen]           = useState(false)
  const [alertTarget, setAlertTarget]       = useState('')
  const [alertSaving, setAlertSaving]       = useState(false)
  const [alertMsg, setAlertMsg]             = useState('')

  // Bump
  const [bumpLoading, setBumpLoading] = useState(false)
  const [bumpMsg, setBumpMsg]         = useState('')

  // Report
  const [reportOpen, setReportOpen]   = useState(false)

  // Fshirja e shpalljes nga pronari — dy hapa: klikimi i pare kerkon konfirmim.
  const [delConfirm, setDelConfirm]   = useState(false)
  const [delLoading, setDelLoading]   = useState(false)
  const [delMsg, setDelMsg]           = useState('')


  async function submitReview() {
    if (!user) { window.location.href = '/auth/login'; return }
    if (!seller || reviewStars === 0) return
    setReviewSaving(true); setReviewMsg('')
    try {
      // Kontroll: a ka biseduar user-i me shitësin? (proxy për blerje të verifikuar)
      const { count: msgCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${seller.id},receiver_id.eq.${seller.id}`)
        .eq('listing_id', params.id)

      const isVerified = (msgCount || 0) >= 3

      const { error } = await supabase.from('reviews').upsert({
        reviewer_id: user.id,
        seller_id: seller.id,
        listing_id: params.id,
        rating: reviewStars,
        comment: reviewComment.trim() || null,
        purchase_verified: isVerified,
      }, { onConflict: 'reviewer_id,seller_id' })

      if (error) { setReviewMsg(`err:${error.message}`); return }
      setMyReview({ rating: reviewStars, comment: reviewComment, purchase_verified: isVerified })
      setReviewMsg('ok:Faleminderit! Vlerësimi u ruajt.')
    } catch (e: any) {
      setReviewMsg(`err:${e.message}`)
    }
    setReviewSaving(false)
  }


  // Chat bottom sheet
  const [chatOpen, setChatOpen]   = useState(false)
  const [chatMsgs, setChatMsgs]   = useState<any[]>([])
  const [draft, setDraft]         = useState('')
  const [sending, setSending]     = useState(false)
  const [typingVis, setTypingVis] = useState(false)
  const [chatReady, setChatReady] = useState(false)

  const chatBottom   = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const channelRef   = useRef<any>(null)
  const typingTimer  = useRef<any>(null)
  const userRef      = useRef<any>(null)
  const sellerRef    = useRef<any>(initialSeller ?? null)
  const listingRef   = useRef<any>(initialListing ?? null)
  const autoOpenDone = useRef(false)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { sellerRef.current = seller }, [seller])
  useEffect(() => { listingRef.current = listing }, [listing])

  useEffect(() => {
    saveRefFromUrl()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null
      if (session?.user) {
        loadMyReview(params.id, session.user.id)
        loadPriceAlert(params.id)
        supabase.from('profiles')
          .select('referral_code,username')
          .eq('id', session.user.id)
          .single()
          .then(({ data: p }) => {
            if (p) setMyRefCode(p.referral_code || p.username || null)
          })
        supabase.from('favorites')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('listing_id', params.id)
          .then(({ count }) => { if ((count ?? 0) > 0) setLiked(true) })
      }
    })
    fetchListing()

    // Realtime: track listing status changes (sold, deactivated, price changes)
    const lsCh = supabase
      .channel(`listing-status-${params.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'listings',
        filter: `id=eq.${params.id}`,
      }, (payload) => {
        setListing((prev: any) => prev ? { ...prev, ...payload.new } : payload.new)
        listingRef.current = { ...(listingRef.current || {}), ...payload.new }
      })
      .subscribe()
    return () => { supabase.removeChannel(lsCh) }
  }, [])

  // Load chat once both user and seller are known
  useEffect(() => {
    const u = userRef.current
    const s = sellerRef.current
    const l = listingRef.current
    if (u && s && l && u.id !== s.id) {
      loadChat(u.id, s.id, l)
    }
  }, [user, seller, listing])

  const scrollChat = useCallback((smooth = true) => {
    chatBottom.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { if (chatMsgs.length) scrollChat() }, [chatMsgs])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (alertOpen) { setAlertOpen(false); setAlertMsg('') }
      if (reportOpen) setReportOpen(false)
      if (chatOpen) setChatOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [alertOpen, reportOpen, chatOpen])

  function canBump(lastBumped: string | null): boolean {
    if (!lastBumped) return true
    return Date.now() - new Date(lastBumped).getTime() >= 7 * 24 * 60 * 60 * 1000
  }

  async function doBump() {
    if (bumpLoading) return
    setBumpLoading(true)
    const now = new Date().toISOString()
    const { error } = await supabase.from('listings').update({ last_bumped_at: now }).eq('id', params.id)
    if (error) {
      setBumpMsg('err:Gabim gjatë ngritjes.')
    } else {
      setListing((l: any) => l ? { ...l, last_bumped_at: now } : l)
      setBumpMsg('ok:Shpallja u ngrit në krye! ⬆️')
      setTimeout(() => setBumpMsg(''), 3000)
    }
    setBumpLoading(false)
  }

  // Fshirje e BUTE — rreshti mbetet ne baze, vetem shenohet.
  //
  // `is_active:false` nuk eshte dekor: politika `listings_select` e lejon
  // publikun te lexoje rreshtin kur `is_active = true`, dhe asnje triger nuk e
  // sinkronizon `status` me `is_active`. Po te vendosnim vetem `deleted_at`
  // dhe `status='deleted'`, shpallja do te vazhdonte te dukej per te gjithe —
  // pra fshirja do te ishte vetem e dukshme per pronarin, jo reale.
  async function doDelete() {
    if (delLoading) return
    setDelLoading(true); setDelMsg('')
    const { error } = await supabase
      .from('listings')
      .update({ deleted_at: new Date().toISOString(), status: 'deleted', is_active: false })
      .eq('id', params.id)
    if (error) {
      setDelMsg('Fshirja deshtoi: ' + error.message)
      setDelLoading(false)
      setDelConfirm(false)
      return
    }
    window.location.href = '/'
  }

  async function fetchListing() {
    let data: any = initialListing ?? null

    /*  Gjendja e ofertes nisret MENJEHERE, jashte deges se meposhtme.
     *  Ishte brenda saj dhe kjo ishte gabim: kur faqja vjen me `initialListing`
     *  nga SSR-ja, ajo dege NUK ekzekutohet — pra thirrja s'behej kurre dhe
     *  `OfferBox` binte prapa te thirrja e vet. Matur: zhvendosja thjesht u
     *  shty nga 1857ms ne 5181ms, me te njejtin CLS 0,076.  */
    supabase.rpc('listing_offer_state', { p_listing_id: params.id })
      .then(({ data: od }) => setOfferState(od ?? null), () => {})

    if (!data) {
      const res = await supabase.from('listings').select('*').eq('id', params.id).single()
      if (res.error && res.error.code !== 'PGRST116') { setLoadError(true); setLoading(false); return }
      data = res.data
      if (data) { setListing(data); listingRef.current = data }
      setLoading(false)
    }
    if (data) {
      let sid = typeof window !== 'undefined' ? localStorage.getItem('_alpazar_sid') : null
      if (!sid) { sid = crypto.randomUUID(); if (typeof window !== 'undefined') localStorage.setItem('_alpazar_sid', sid) }
      supabase.rpc('increment_listing_views', { p_listing_id: data.id, p_viewer_id: userRef.current?.id ?? null, p_ip_hash: sid }).then(() => {}, () => {})
      // Track recently viewed
      try {
        const rv = JSON.parse(localStorage.getItem('_alpazar_rv') || '[]')
        const entry = { id: data.id, title: data.title, price: data.price, currency: data.currency, img: Array.isArray(data.images) ? data.images[0] : null, city: data.city, ts: Date.now() }
        const filtered = rv.filter((x: any) => x.id !== data.id)
        localStorage.setItem('_alpazar_rv', JSON.stringify([entry, ...filtered].slice(0, 8)))
      } catch { /* ignore */ }
      if (data.category_id) fetchSimilarListings(data.category_id, data.id, data.city, data.price)
      if (data.user_id) {
        const [{ data: p }, { count }] = await Promise.all([
          // Siguri HIGH-1: kolona të sigurta, PA `phone`/`is_admin`/`is_suspended` (PII/privilegj) —
          // që të mos rrjedhin te vizitorët anonimë (anon-key publik). Telefoni merret veç më poshtë,
          // vetëm kur përdoruesi është i loguar (kontakti mbetet për anëtarët; scraping-u anonim vdes).
          supabase.from('profiles').select('id,username,full_name,avatar_url,city,bio,is_premium,premium_expires_at,gamification_points,gamification_level,created_at,shop_name,shop_description,shop_category,shop_banner_url,is_verified,last_seen,seller_rating,reviews_count,referral_code,cover_url,website,listings_count,total_sales,followers_count,following_count,shop_is_open,total_saved,updated_at,trust_score,trust_score_visible,has_boost,boost_expires_at,has_phone').eq('id', data.user_id).single(),
          supabase.from('listings').select('*', { count: 'exact', head: true })
            .eq('user_id', data.user_id).eq('is_active', true),
        ])
        if (p) { setSeller(p); sellerRef.current = p }
        // `count` vjen nga header-i `content-range`. Kur ai mungon ose vjen i
        // cunguar, supabase-js jep NaN — dhe `!== null` NUK e kap: faqja publike
        // e shpalljes shfaqte 'NaN shpallje aktive' te blloku i shitesit.
        // Pare me sy me 31 gusht 2026.
        if (Number.isFinite(count as number)) setSellerCount(count as number)
        /*  TELEFONI NUK MERRET ME NE NGARKIM TE FAQES.
         *  Kufizimi i meparshem ishte "vetem per te loguar" — por kjo do te
         *  thoshte qe nje llogari e vetme plus nje skript nxirrte numrin e cdo
         *  shitesi ne platforme, pa asnje veprim njerezor. Matur dhe provuar me
         *  31 gusht 2026. Tani numri vjen nga `listing_contact()` VETEM kur
         *  perdoruesi klikon kontaktin: nje veprim i shprehur, i kufizuar ne
         *  shpeshtesi dhe i regjistruar (`contact_reveal_log` + metrika
         *  `contact_phone` qe shitesi e sheh te analitika e vet).
         *  Butonat varen nga flamuri jo-identifikues `has_phone`.  */
      }
    }
  }

  async function fetchSimilarListings(categoryId: string, currentId: string, city?: string, price?: number) {
    // Semantike së pari (pgvector /api/similar): shpallje të ngjashme sipas KUPTIMIT.
    // Bie te përputhja sipas kategori/qytet/çmim si fallback nëse s'ka mjaftueshëm.
    try {
      const r = await fetch(`/api/similar?id=${currentId}`)
      if (r.ok) {
        const j = await r.json()
        if (Array.isArray(j.results) && j.results.length >= 3) { setSimilar(j.results); return }
      }
    } catch { /* fallback më poshtë */ }
    let q = supabase
      .from('listings')
      .select(LISTING_SELECT)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentId)
    if (city) q = q.eq('city', city)
    if (price && price > 0) {
      q = q.gte('price', price * 0.7).lte('price', price * 1.3)
    }
    // Fillimisht rekomandimi semantik (pgvector). Nese s'ka embedding ende,
    // biem butesisht te logjika e meparshme sipas kategorise dhe shikimeve.
    try {
      const { data: sim } = await supabase.rpc('recommend_similar', { p_listing_id: currentId, p_k: 4 })
      if (Array.isArray(sim) && sim.length > 0) { setSimilar(sim as any); return }
    } catch { /* pa embedding — vazhdo me rezerven */ }

    const { data } = await q.order('views_count', { ascending: false }).limit(4)
    if (data && data.length > 0) {
      setSimilar(data)
    } else if (city || price) {
      // Fallback: broader search without city/price filters
      const { data: fallback } = await supabase
        .from('listings')
        .select(LISTING_SELECT)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .neq('id', currentId)
        .order('views_count', { ascending: false })
        .limit(4)
      if (fallback) setSimilar(fallback)
    }
  }

  async function loadPriceAlert(listingId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    try {
      const res = await fetch(`/api/price-alerts?listing_id=${listingId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      if (json.alert) {
        setPriceAlert(json.alert)
        setAlertTarget(String(json.alert.target_price))
      }
    } catch {}
  }

  async function saveAlert() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth/login'; return }
    const price = parseFloat(alertTarget)
    if (!price || price <= 0) { setAlertMsg('err:Vendos një çmim të vlefshëm'); return }
    if (listing.price && price >= listing.price) { setAlertMsg('err:Çmimi i alarmit duhet të jetë më i ulët se çmimi aktual.'); return }
    setAlertSaving(true); setAlertMsg('')
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ listing_id: params.id, target_price: price }),
      })
      if (!res.ok) {
        let errMsg = 'Gabim i serverit.'
        try { const e = await res.json(); if (e?.error) errMsg = e.error } catch {}
        setAlertMsg(`err:${errMsg}`); return
      }
      const json = await res.json()
      setPriceAlert(json.alert)
      setAlertMsg('ok:Alarmi u ruajt! Do të njoftohesh kur çmimi ulet.')
      setTimeout(() => setAlertOpen(false), 1800)
    } catch (e: any) {
      setAlertMsg(`err:${e.message}`)
    }
    setAlertSaving(false)
  }

  async function deleteAlert() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setAlertSaving(true)
    try {
      await fetch(`/api/price-alerts?listing_id=${params.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      setPriceAlert(null); setAlertTarget(''); setAlertMsg('')
      setAlertOpen(false)
    } catch {
      setAlertMsg('err:Gabim në fshirjen e alarmit. Provo sërisht.')
    }
    setAlertSaving(false)
  }

  async function toggleSave() {
    if (!user) { window.location.href = '/auth/login'; return }
    const prev = liked
    setLiked(!prev)
    if (prev) {
      const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', params.id)
      if (error) setLiked(prev)
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: user.id, listing_id: params.id })
      if (error) setLiked(prev)
    }
  }

  async function loadMyReview(listingId: string, userId: string) {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('listing_id', listingId)
      .eq('reviewer_id', userId)
      .maybeSingle()
    if (data) {
      setMyReview(data)
      setReviewStars(data.rating)
      setReviewComment(data.comment || '')
    }
  }

  async function loadChat(myId: string, otherId: string, lst: any) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    setChatMsgs(data || [])
    setChatReady(true)

    if (!data || data.length === 0) {
      const fmt = (p: number, c: string) => !p ? '' : c === 'EUR' ? ` — ${nf(p)} €` : ` — ${nf(p)} L`
      setDraft(`Përshëndetje! Jam i interesuar/e për: "${lst.title}"${fmt(lst.price, lst.currency)}. A është ende në shitje?`)
    }

    supabase.from('messages').update({ read: true })
      .eq('receiver_id', myId).eq('sender_id', otherId).eq('read', false)
      .then()

    const topic = `listing-chat-${[myId, otherId].sort().join('-')}`
    // Topik i përbashkët/deterministik — nëse jemi tashmë në të, mos e rikrijo
    // (përndryshe rihapja e chat-it hedh 'cannot add postgres_changes after subscribe()').
    if (channelRef.current?.topic === `realtime:${topic}`) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    supabase.getChannels().filter(c => c.topic === `realtime:${topic}`).forEach(c => supabase.removeChannel(c))
    const ch = supabase
      .channel(topic)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${myId}`,
      }, (payload) => {
        const m = payload.new as any
        if (m.sender_id !== otherId) return
        setChatMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m])
        supabase.from('messages').update({ read: true }).eq('id', m.id).then()
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.userId !== otherId) return
        setTypingVis(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingVis(false), 2500)
      })
      .subscribe()
    channelRef.current = ch

    // Auto-open sheet after 800 ms (only once per page load)
    if (!autoOpenDone.current) {
      autoOpenDone.current = true
      setTimeout(() => {
        setChatOpen(true)
        setTimeout(() => inputRef.current?.focus(), 350)
      }, 800)
    }
  }

  async function sendMsg() {
    const text = draft.trim()
    if (!user) { window.location.href = '/auth/login'; return }
    if (!text || !seller || sending) return
    setSending(true)
    setDraft('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const optimistic: any = {
      id: `tmp-${Date.now()}`, sender_id: user.id, receiver_id: seller.id,
      content: text, created_at: new Date().toISOString(), read: false,
    }
    setChatMsgs(prev => [...prev, optimistic])

    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: seller.id,
      listing_id: listing.id, content: text,
    }).select().single()

    if (data) setChatMsgs(prev => prev.map(m => m.id === optimistic.id ? data : m))
    else if (error) { setChatMsgs(prev => prev.filter(m => m.id !== optimistic.id)); setDraft(text) }
    setSending(false)
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } })
  }

  // Burim i vetëm: `lib/format.ts`. Këtu mbetet vetëm fjala e kësaj sipërfaqeje.
  const fmt = (price: number, cur: string) => priceLabel(price, cur, 'Çmim me marrëveshje')

  const memberSince = (d: string) => monthYear(d)

  function buildGroups(msgs: any[]) {
    const groups: Array<{ date: string; items: any[] }> = []
    let cur = ''
    for (const m of msgs) {
      const d = dayLabel(m.created_at)
      if (d !== cur) { groups.push({ date: d, items: [] }); cur = d }
      groups[groups.length - 1].items.push(m)
    }
    return groups
  }

  useEffect(() => () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
  }, [])

  if (loadError) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">⚠️</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Gabim gjatë ngarkimit</h2>
      <button type="button" onClick={() => window.location.reload()} style={{ background: 'var(--az-yellow)', border: 'none', borderRadius: 24, padding: '10px 24px', fontWeight: 700, fontSize: 'var(--fs-dysheme)', cursor: 'pointer' }}>Rifresko</button>
    </div>
  )

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg);}}` }} />
      <div style={{ width: 28, height: 28, border: '3px solid var(--az-yellow)', borderTopColor: 'var(--az-red)', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">🔍</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Shpallja nuk u gjet</h2>
      <a href="/" style={{ color: '#C42B0F', fontSize: 'var(--fs-dysheme)' }}>← Kthehu</a>
    </div>
  )

  const images  = listing.images?.length ? listing.images : []
  const isOwner = user?.id === listing.user_id
  // Tier-i i shitësit që NDERON skadimin (seller vjen me select('*') → ka afatet).
  const sellerTier = tierNgaProfili(seller)
  const hasShop = sellerTier !== 'free' && seller?.shop_name

  // A i perket kjo shpallje nje biznesi? Burimi i vertete eshte lidhja, jo
  // `profiles.shop_name`.
  //
  // `shop_name` ishte nje kopje e emrit te biznesit e mbajtur te profili, dhe
  // mbi te varej edhe shenja "Biznes" edhe pamja e avatarit. Kjo i mbante
  // identitetet e ngaterruar: emri i dyqanit mbulonte emrin e personit. Tani
  // identiteti biznes/person varet VETEM nga `business_id` (fakti i lidhjes),
  // jo nga `shop_name` — ndarja person/biznes eshte e prere (Vendimi 7). Per
  // lidhjen (bizHref) `hasShop` mbetet vetem si rrugedalje legacy me poshte.
  const isBusinessListing = !!listing?.business_id

  // Lidhja me biznesin del GJITHMONE nga `listing.business_id` — ky eshte
  // biznesi te cili i PERKET kjo shpallje.
  //
  // Me pare perdorej `/biznese/${seller.id}`, pra id-ja e PERDORUESIT ne vend
  // te id-se se biznesit. Ajo faqe nuk binte gjithmone, sepse BiznesPageClient
  // ka nje rrugedalje: nese s'gjen biznes me ate id, e kerkon me `owner_id`.
  // Por rrugedalja te con te biznesi i PARE i atij personi — jo domosdoshmerisht
  // te ai i shpalljes. Nje shites me dy biznese e conte blerësin te i gabuari.
  //
  // `hasShop` mbetet vetem si rrugedalje per shitesit e vjeter premium qe kane
  // `shop_name` pa nje rresht `businesses` te lidhur; atje id-ja e perdoruesit
  // eshte e vetmja qe kemi dhe rrugedalja me `owner_id` e zgjidh sakte.
  const bizHref = listing?.business_id
    ? `/biznese/${listing.business_id}`
    : (hasShop && seller ? `/biznese/${seller.id}` : null)
  const sellerHref = bizHref || (seller ? `/u/${seller.id}` : '/')
  const initials  = (seller?.shop_name || seller?.full_name || '?').slice(0, 2).toUpperCase()
  const groups    = buildGroups(chatMsgs)
  const showChatSheet = !isOwner
  const chatPanelOpen = chatOpen && showChatSheet

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:var(--az-cream);}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:${chatPanelOpen ? '300px' : '70px'};}
        @media(min-width:768px){.wrap{max-width:760px}}
        /* 100% web (si ballina, ≥1024): mbush ekranin me padding anësor që rritet me viewport-in,
           në vend të një kolone 1080px me marzhe bosh krem (ankesa e pronarit — kolonë e ngushtë). */
        @media(min-width:1024px){.wrap{max-width:100%;padding-left:clamp(32px,4vw,72px);padding-right:clamp(32px,4vw,72px);}}
        .topbar{background:linear-gradient(165deg,var(--az-yellow-hi) 0%,var(--az-yellow) 52%,var(--az-yellow-lo) 100%);padding:10px 12px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        /* klasa e vjeter e back-butonit u zevendesua nga komponenti i perbashket BackButton (44px). */
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        /* Butonat e sigurise (§7.4): terciar i vogel, gjithmone i arritshem,
           lartesi prekjeje 36px dhe kontrast qe kalon WCAG AA. */
        /* SHKALLË E VETME për butonat dytësorë (O24): kufi me kontrast ≥3:1 + mbushje e lehtë
           (që kutia të KETË formë, jo tekst i shpërndarë), lartësi 44px (Vendimi 8), dhe gjendje
           :active (transform+sfond) — sepse :hover NUK ekziston në telefon. Të tria (safety/njoftim/
           ndaj) nga i njëjti fjalor. */
        .safety-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:44px;padding:0 14px;background:#f4f4f4;border:1px solid #b0b0b0;border-radius:11px;color:#3d3d3d;font-size:var(--fs-dysheme);font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none;transition:transform .12s ease,border-color .15s ease,background .15s ease;}
        .safety-btn:hover{border-color:var(--az-red-deep);color:var(--az-red-deep);}
        .safety-btn:active{transform:scale(.97);background:#e9e9e9;border-color:var(--az-red-deep);}
        .share-btn{width:44px;height:44px;background:#f4f4f4;border:1px solid #b0b0b0;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .12s ease,background .15s ease;}
        .share-btn:active{transform:scale(.94);background:#e9e9e9;}
        .share-btn i{font-size:17px;color:#333;}
        /* "Njoftomë" hyn te e njëjta shkallë; gjendja aktive (alarm i vendosur) e verdhë. */
        .njofto-btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;min-height:44px;padding:0 14px;background:#f4f4f4;border:1px solid #b0b0b0;border-radius:11px;color:#3d3d3d;font-size:var(--fs-dysheme);font-weight:700;font-family:inherit;cursor:pointer;transition:transform .12s ease,border-color .15s ease,background .15s ease;}
        .njofto-btn:active{transform:scale(.97);background:#e9e9e9;}
        .njofto-btn.on{background:#FFF8E1;color:#856404;border-color:#FFCf5a;}

        /* Gallery */
        .img-wrap{width:100%;height:230px;background:linear-gradient(135deg,#FBF7E8,#F2EAD0);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .img-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;}
        .img-dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:var(--fs-dysheme);}
        .like-btn{position:absolute;top:6px;right:6px;width:44px;height:44px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}

        /* Info */
        .info{padding:12px 12px 0;}
        /* Rreshti i VETËM i veprimeve (vendim pronari, 5 shtator): të gjitha veprimet
           e shpalljes mblidhen këtu, mbi shenjat e statusit, ku i pa syri — jo të
           shpërndara nëpër faqe. I njëjti fjalor vizual (.safety-btn/.njofto-btn). */
        .quick-actions{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f0f0f0;}
        .qa-msg{font-size:var(--fs-dysheme);font-weight:600;text-align:center;padding:0 0 10px;}
        .status-row{display:flex;align-items:center;gap:6px;margin-bottom:7px;}
        .status-chip{display:inline-flex;align-items:center;gap:4px;font-size:var(--fs-dysheme);font-weight:700;padding:4px 11px;border-radius:999px;}
        .sc-active{background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A7;}
        .sc-sold{background:#F3F3F3;color:#555;border:1px solid #ccc;}
        h1{font-size:var(--fs-2xl);font-weight:800;color:var(--az-ink);margin-bottom:6px;line-height:1.3;letter-spacing:-.2px;}
        .price{font-size:25px;font-weight:800;color:#C42B0F;margin-bottom:12px;letter-spacing:-.5px;}
        .meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
        .meta-item{display:flex;align-items:center;gap:4px;font-size:var(--fs-dysheme);color:#555;background:#f5f3eb;padding:5px 10px;border-radius:999px;font-weight:600;}
        .meta-item i{font-size:var(--fs-dysheme);color:#999;}
        .cond-new{background:#FFF0EE;color:#C42B0F;font-weight:700;}
        .cond-used{background:#F0F0F0;color:#555;font-weight:700;}
        .divider{height:1px;background:#f0f0f0;margin:10px 0;}
        .sec-label{display:flex;align-items:center;gap:7px;font-size:var(--fs-dysheme);font-weight:800;color:#4A4A4A;text-transform:uppercase;letter-spacing:.6px;margin-bottom:9px;}
        .sec-label::before{content:'';flex:0 0 auto;width:3px;height:13px;border-radius:2px;background:linear-gradient(180deg,var(--az-yellow),var(--az-red));}
        .desc{font-size:var(--fs-dysheme);color:#555;line-height:1.7;}

        /* Seller section — free-flowing */
        .seller-section{background:#fff;border:0.5px solid #ececec;border-radius:14px;padding:14px;margin:0 12px 12px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 20px -12px rgba(0,0,0,.16);}
        .seller-av-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .seller-av{width:44px;height:44px;border-radius:50%;background:var(--az-yellow);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;border:2.5px solid var(--az-yellow);}
        .seller-av img{width:100%;height:100%;object-fit:cover;}
        .seller-name{font-size:var(--fs-dysheme);font-weight:700;color:#111;}
        .seller-sub{font-size:var(--fs-dysheme);color:#555;margin-top:2px;}
        .seller-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;}
        .seller-stats{display:flex;gap:6px;margin-bottom:7px;flex-wrap:wrap;}
        .stat-chip{display:flex;align-items:center;gap:4px;background:#f8f6f0;border:0.5px solid #ececec;border-radius:10px;padding:5px 10px;font-size:var(--fs-dysheme);color:#555;}
        .stat-chip i{font-size:var(--fs-dysheme);color:#999;}
        .seller-bio{font-size:var(--fs-dysheme);color:#666;line-height:1.65;margin-bottom:8px;}
        .view-profile-btn{display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,var(--az-ink),#000);color:var(--az-yellow);border:none;border-radius:12px;padding:10px 16px;font-size:var(--fs-dysheme);font-weight:700;cursor:pointer;font-family:inherit;width:100%;box-shadow:0 2px 8px -2px rgba(0,0,0,.35);transition:transform .15s ease,box-shadow .15s ease;}
        .view-profile-btn:hover{transform:translateY(-1px);box-shadow:0 5px 14px -3px rgba(0,0,0,.45);}
        .shop-link-row{display:flex;align-items:center;gap:9px;background:#f8f6f0;border:0.5px solid #ececec;border-radius:12px;padding:9px 12px;margin-top:8px;cursor:pointer;text-decoration:none;transition:background .15s ease;}
        .shop-link-row:hover{background:#f2efe6;}
        .shop-link-row span{font-size:var(--fs-dysheme);font-weight:700;color:#111;}
        .shop-link-row small{font-size:var(--fs-dysheme);color:#555;display:block;margin-top:1px;}

        /* ── CHAT BOTTOM SHEET ── */
        .cs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:190;animation:fadeIn .2s;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .cs-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:200;box-shadow:0 -4px 24px rgba(0,0,0,.15);display:flex;flex-direction:column;max-height:75vh;}
        .cs-handle-row{padding:8px 0 4px;display:flex;justify-content:center;flex-shrink:0;}
        .cs-handle{width:36px;height:4px;background:#ddd;border-radius:4px;}
        .cs-header{padding:0 13px 8px;display:flex;align-items:center;gap:9px;flex-shrink:0;border-bottom:1px solid #f0f0f0;}
        .cs-av{width:32px;height:32px;border-radius:50%;background:var(--az-yellow);display:flex;align-items:center;justify-content:center;font-size:var(--fs-dysheme);font-weight:700;color:#111;flex-shrink:0;overflow:hidden;}
        .cs-av img{width:100%;height:100%;object-fit:cover;}
        .cs-seller-name{font-size:var(--fs-dysheme);font-weight:700;color:#111;flex:1;}
        .cs-priv{font-size:var(--fs-dysheme);background:#EEF4FF;color:#185FA5;border:1px solid #C3DAFB;padding:2px 7px;border-radius:8px;font-weight:700;}
        .cs-close{width:28px;height:28px;background:#f5f5f5;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .cs-close i{font-size:var(--fs-dysheme);color:#888;}
        .cs-ref{background:#FFF8EE;border-bottom:1px solid #FFE8C4;padding:7px 13px;display:flex;align-items:center;gap:7px;flex-shrink:0;}
        .cs-ref i{font-size:var(--fs-dysheme);color:#C42B0F;flex-shrink:0;}
        .cs-ref-text{font-size:var(--fs-dysheme);color:#333;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .cs-ref-price{font-size:var(--fs-dysheme);font-weight:700;color:#C42B0F;white-space:nowrap;}
        .cs-msgs{flex:1;overflow-y:auto;padding:10px 12px 6px;display:flex;flex-direction:column;gap:2px;background:#f9f6ef;}
        .cs-msgs::-webkit-scrollbar{width:2px;}
        .cs-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}
        .day-sep{text-align:center;margin:6px 0 3px;pointer-events:none;}
        .day-sep span{background:rgba(0,0,0,.08);color:#777;font-size:var(--fs-dysheme);font-weight:600;padding:2px 9px;border-radius:10px;}
        .msg-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:1px;}
        .msg-row.mine{flex-direction:row-reverse;}
        .bubble-w{max-width:76%;}
        .mine .bubble-w{align-items:flex-end;display:flex;flex-direction:column;}
        .bubble{padding:7px 11px;font-size:var(--fs-dysheme);line-height:1.5;word-break:break-word;border-radius:14px;}
        .mine .bubble{background:linear-gradient(135deg,var(--az-yellow),#e8b820);color:#111;border-bottom-right-radius:4px;box-shadow:0 2px 6px rgba(245,200,66,.3);}
        .theirs .bubble{background:#fff;color:#111;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
        .btime{font-size:var(--fs-dysheme);color:rgba(0,0,0,.3);margin-top:2px;text-align:right;}
        .theirs .btime{text-align:left;color:#bbb;}
        .empty-chat{text-align:center;padding:20px 16px;color:#555;}
        .empty-chat-icon{font-size:30px;margin-bottom:6px;}
        .empty-chat-txt{font-size:var(--fs-dysheme);line-height:1.6;}
        .typing-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:4px;}
        .typing-bbl{background:#fff;border-radius:14px 14px 14px 4px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:3px;}
        .tdot{width:5px;height:5px;border-radius:50%;background:#bbb;animation:tdot .9s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .cs-input-bar{background:#fff;border-top:1px solid #eee;padding:9px 11px;display:flex;gap:7px;align-items:flex-end;flex-shrink:0;}
        .cs-input-wrap{flex:1;background:#f5f5f0;border-radius:20px;padding:0 12px;display:flex;align-items:flex-end;border:1.5px solid transparent;transition:border-color .15s;}
        .cs-input-wrap:focus-within{border-color:var(--az-red);background:#fff;}
        .cs-input-wrap textarea{border:none;background:transparent;font-size:var(--fs-dysheme);color:#111;outline:none;flex:1;resize:none;min-height:20px;max-height:80px;line-height:1.5;padding:9px 0;font-family:inherit;}
        .cs-input-wrap textarea::placeholder{color:#bbb;}
        .cs-send-btn{width:44px;height:44px;background:linear-gradient(135deg,var(--az-red),#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .cs-send-btn:disabled{opacity:.4;box-shadow:none;}
        .cs-send-btn i{color:#fff;font-size:18px;}
        .login-prompt{background:#FFF0EE;padding:18px;text-align:center;}
        .login-prompt p{font-size:var(--fs-dysheme);color:#555;margin-bottom:10px;font-weight:600;}
        .login-prompt-btn{background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border:none;border-radius:12px;padding:10px 22px;font-size:var(--fs-dysheme);font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(230,51,18,.4);transition:transform .15s ease,box-shadow .15s ease;}
        .login-prompt-btn:hover{transform:translateY(-1px);box-shadow:0 5px 14px -3px rgba(230,51,18,.5);}

        /* Bottom bar */
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid #eee;padding:10px 12px;display:flex;gap:8px;align-items:center;z-index:100;box-shadow:0 -6px 20px rgba(0,0,0,.06);}
        .bb-price{display:flex;flex-direction:column;justify-content:center;flex-shrink:0;max-width:112px;padding-right:2px;}
        .bb-price-l{font-size:var(--fs-dysheme);font-weight:600;color:#4A4A4A;text-transform:uppercase;letter-spacing:.3px;line-height:1;}
        .bb-price-n{font-size:16px;font-weight:800;color:#C42B0F;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.3px;line-height:1.2;}
        .main-chat-btn{flex:1;background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border:none;border-radius:12px;padding:12px;font-size:var(--fs-dysheme);font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .main-chat-btn i{font-size:16px;}
        .wa-btn{width:48px;height:48px;background:#25D366;border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(37,211,102,.3);text-decoration:none;}
        .wa-btn i{font-size:22px;color:#fff;}
        .viber-btn{width:48px;height:48px;background:#7360F2;border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(115,96,242,.3);text-decoration:none;}
        .viber-btn i{font-size:22px;color:#fff;}

        /* Location section */
        .map-link{display:inline-flex;align-items:center;gap:6px;background:#EEF4FF;color:#185FA5;border:1px solid #C3DAFB;border-radius:9px;padding:7px 13px;font-size:var(--fs-dysheme);font-weight:600;text-decoration:none;margin-top:8px;}
        .map-link i{font-size:var(--fs-dysheme);}

        /* Price alert modal */
        .alert-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;animation:fadeIn .2s;}
        .alert-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:310;padding:20px 18px 36px;box-shadow:0 -4px 24px rgba(0,0,0,.15);}
        .alert-handle{width:36px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 16px;}
        .alert-title{font-size:16px;font-weight:800;color:#111;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
        .alert-sub{font-size:var(--fs-dysheme);color:#555;margin-bottom:16px;}
        .alert-input{width:100%;border:1.5px solid #ddd;border-radius:11px;padding:12px 14px;font-size:15px;font-weight:700;color:#111;box-sizing:border-box;font-family:inherit;outline:none;}
        .alert-input:focus{border-color:var(--az-red);}
        .alert-btn-row{display:flex;gap:8px;margin-top:14px;}
        .alert-save{flex:1;background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border:none;border-radius:11px;padding:13px;font-size:var(--fs-dysheme);font-weight:700;cursor:pointer;font-family:inherit;}
        .alert-save:disabled{opacity:.5;cursor:not-allowed;}
        .alert-del{width:48px;background:#FFF0EE;color:#C42B0F;border:1.5px solid #FFCDD2;border-radius:11px;padding:13px;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .alert-msg{font-size:var(--fs-dysheme);text-align:center;margin-top:8px;font-weight:600;}

        @keyframes spin{to{transform:rotate(360deg);}}

        /* Report modal */
        .report-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;animation:fadeIn .2s;}
        .report-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:310;padding:18px 16px 32px;box-shadow:0 -4px 24px rgba(0,0,0,.15);}
        .report-handle{width:36px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 14px;}
        .report-title{font-size:15px;font-weight:700;color:#111;margin-bottom:4px;}
        .report-sub{font-size:var(--fs-dysheme);color:#555;margin-bottom:14px;}
        .reason-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
        .reason-btn{display:flex;align-items:center;gap:10px;border:1.5px solid #eee;border-radius:10px;padding:11px 13px;background:#fff;font-family:inherit;font-size:var(--fs-dysheme);color:#333;cursor:pointer;text-align:left;}
        .reason-btn.sel{border-color:var(--az-red);background:#FFF0EE;color:#C42B0F;font-weight:600;}
        .report-submit{width:100%;background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border:none;border-radius:11px;padding:13px;font-size:var(--fs-dysheme);font-weight:700;cursor:pointer;font-family:inherit;}
        .report-submit:disabled{opacity:.5;cursor:not-allowed;}
        .report-success{text-align:center;padding:18px 0;}
        .report-link{display:block;text-align:center;font-size:var(--fs-dysheme);color:#555;margin-top:14px;cursor:pointer;}
        .report-link:hover{color:#C42B0F;}
        @keyframes ai-fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      ` }} />

      <div className="wrap">
        <div className="topbar">
          <BackButton style={{ background: 'rgba(0,0,0,.1)', borderRadius: '50%', marginLeft: -6 }} iconStyle={{ fontSize: 18, color: '#111' }} />
          <span className="topbar-title">Shpallja</span>
          <button type="button" className="share-btn" aria-label={shareOpen ? 'Mbyll ndarjen' : 'Ndaj shpalljen'} aria-expanded={shareOpen} onClick={() => setShareOpen(o => !o)}>
            <i className={`ti ti-${shareOpen ? 'x' : 'share'}`} aria-hidden="true" />
          </button>
        </div>

        {/* Share sheet */}
        {shareOpen && (() => {
          const shareUrl = buildShareUrl(`/listing/${params.id}`, myRefCode)
          const shareText = `Shiko këtë shpallje në Alpazar: "${listing.title}"${myRefCode ? ' 🔗' : ''}`
          return (
            <div style={{
              background: '#fff', borderBottom: '1px solid #eee',
              padding: '12px 14px', animation: 'ai-fade .2s ease',
            }}>
              <SharePanel
                shareUrl={shareUrl}
                shareText={shareText}
                refCode={myRefCode}
                listingId={params.id}
                userId={user?.id ?? null}
              />
            </div>
          )
        })()}

        {/* Gallery — full-bleed square hero */}
        <div style={{ padding: 0, marginBottom: 12, position: 'relative' }}>
          <ImageCarousel images={images} alt={listing.title} aspectRatio="1/1" rounded={false} />
          {!isOwner && (
            <button
              type="button"
              onClick={toggleSave}
              aria-label={liked ? 'Hiq nga të preferuarat' : 'Shto te të preferuarat'}
              style={{
                position: 'absolute', top: 10, right: 23,
                width: 34, height: 34, background: '#fff',
                borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)', zIndex: 5,
              }}>
              <i className={`ti ti-heart${liked ? '-filled' : ''}`} aria-hidden="true"
                style={{ fontSize: 17, color: liked ? 'var(--az-red)' : '#888' }} />
            </button>
          )}
        </div>

        {/* Social proof — shikues aktiv + total pamje */}
        <SocialProofBar viewsCount={listing.views_count || 0} listingId={params.id} />

        <div className="info">
          {/* ── VEPRIME — rreshti i vetëm, te vija ku e kërkoi pronari (5 shtator):
              mbi shenjat e statusit, poshtë provës sociale. Butonat vijnë sipas
              rolit: pronari sheh Ndaj · Rifresko · Ndrysho; vizitori sheh
              Ndaj · Njoftomë · Raporto · Kërkesë heqjeje. Të njëjtat mbajtëse dhe
              klasa si më parë — thjesht të bashkuara në një vend. ── */}
          <div className="quick-actions" role="group" aria-label="Veprime për shpalljen">
            <button
              type="button"
              className="safety-btn"
              aria-label={shareOpen ? 'Mbyll ndarjen' : 'Ndaj shpalljen'}
              aria-expanded={shareOpen}
              onClick={() => { trackEvent('share', listing.id); setShareOpen(o => !o) }}>
              <i className="ti ti-share" style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />Ndaj
            </button>

            {isOwner ? (
              <>
                <button
                  type="button"
                  className="safety-btn"
                  onClick={doBump}
                  disabled={bumpLoading || !canBump(listing.last_bumped_at)}
                  aria-label={canBump(listing.last_bumped_at) ? 'Rifresko dukshmërinë — ngrije në krye' : 'Mund ta rifreskosh pas 7 ditësh'}
                  title="Rifresko dukshmërinë — një herë çdo 7 ditë"
                  style={{ opacity: bumpLoading ? 0.7 : 1 }}>
                  <i className="ti ti-arrow-up" style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />{canBump(listing.last_bumped_at) ? 'Rifresko' : 'Rifreskuar'}
                </button>
                <button
                  type="button"
                  className="safety-btn"
                  aria-label="Ndrysho shpalljen"
                  onClick={() => window.location.href = `/listing/${params.id}/edit`}>
                  <i className="ti ti-pencil" style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />Ndrysho
                </button>
              </>
            ) : (
              <>
                {user && listing.is_active && (
                  <button
                    type="button"
                    aria-label={priceAlert ? 'Ndrysho alarmin e çmimit' : 'Vendos alarm çmimi'}
                    onClick={() => { trackEvent('notify', listing.id); setAlertOpen(true) }}
                    className={`njofto-btn${priceAlert ? ' on' : ''}`}>
                    <i className={`ti ti-bell${priceAlert ? '-ringing' : ''}`} style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />
                    {priceAlert ? <><span aria-hidden="true">🔔</span> {priceAlert.target_price} ALL</> : 'Njoftomë'}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Raporto shpalljen"
                  aria-haspopup="dialog"
                  onClick={() => setReportOpen(true)}
                  className="safety-btn">
                  <i className="ti ti-flag" style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />Raporto
                </button>
                <a
                  href="/takedown"
                  className="safety-btn"
                  title="Kërkesë ligjore për heqjen e përmbajtjes">
                  <i className="ti ti-gavel" style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />Kërkesë heqjeje
                </a>
              </>
            )}
          </div>
          {/* Rezultati i rifreskimit (bump) — pranë butonit që e nis. */}
          {isOwner && bumpMsg && (
            <div role="alert" className="qa-msg" style={{ color: bumpMsg.startsWith('ok:') ? '#1D9E75' : 'var(--az-red-deep)' }}>
              {bumpMsg.replace(/^(ok:|err:)/, '')}
            </div>
          )}

          {/* Status chip */}
          <div className="status-row">
            {listing.is_active
              ? <span className="status-chip sc-active"><span aria-hidden="true">🟢</span> Në shitje</span>
              : <span className="status-chip sc-sold"><span aria-hidden="true">✅</span> Shitur</span>}
            {listing.is_premium && (
              <span className="status-chip" style={{ background: '#FFF8E1', color: '#856404', border: '1px solid #FFE082' }}><span aria-hidden="true">⭐</span> Premium</span>
            )}
          </div>

          <h1>{listing.title}</h1>
          {/* Çmimi — "Njoftomë" u ngjit lart te rreshti i veprimeve (quick-actions). */}
          <div className="price">{fmt(listing.price, listing.currency)}</div>

          {/* Meta row: condition + city + date + category + views */}
          <div className="meta">
            {listing.condition === 'i_ri' && (
              <div className="meta-item cond-new"><span aria-hidden="true">✨</span> I ri</div>
            )}
            {listing.condition === 'i_perdorur' && (
              <div className="meta-item cond-used"><span aria-hidden="true">🔘</span> I përdorur</div>
            )}
            {listing.city && <div className="meta-item"><i className="ti ti-map-pin" aria-hidden="true" />{listing.city}</div>}
            {listing.created_at && <div className="meta-item"><i className="ti ti-calendar" aria-hidden="true" />{pubDate(listing.created_at)}</div>}
            {listing.category && <div className="meta-item"><i className="ti ti-tag" aria-hidden="true" />{CATEGORY_LABELS[listing.category] || listing.category}</div>}
            {/* H5: numri i shikimeve hiqet nga meta-rreshti — SocialProofBar (lart) e shfaq
                tashmë me praninë live (👁 N · 🔴 M), pa e dyfishuar ~50px më poshtë. */}
          </div>

          {/* ── PROFILI I SHITËSIT — free-flowing ── */}
          {seller && (
            <>
              <div className="seller-section">
                <div className="sec-label" style={{ marginTop: 0 }}>Shitësi</div>

                {/* Avatar row */}
                <div role="link" tabIndex={0} className="seller-av-row" onClick={() => window.location.href = sellerHref} onKeyDown={e => { if (e.key === 'Enter') window.location.href = sellerHref }} style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={seller.avatar_url}
                    name={seller.shop_name || seller.full_name || seller.username}
                    type={isBusinessListing ? 'business' : 'person'}
                    tier={tierNgaProfili(seller)}
                    verified={avatarVerified(seller)}
                    online={sellerOnline}
                    size={44}
                  />
                  <div>
                    <div className="seller-name" style={{ textDecoration: 'underline', textDecorationColor: '#ddd' }}>
                      {seller.shop_name || seller.full_name || seller.username || 'Shitës'}
                    </div>
                    <div className="seller-sub">
                      {seller.city && <><span aria-hidden='true'>📍</span> {seller.city}</>}
                      {seller.city && seller.created_at && ' · '}
                      {seller.created_at && `Anëtar nga ${memberSince(seller.created_at)}`}
                    </div>
                  </div>
                </div>

                {/* Vulat e identitetit — komponenti i VETEM ([O56]). Me pare gjashte .schip
                    te shkruara me dore, me kontrast 2.15:1 te .sch-shop ([O52]). density="compact"
                    sepse ky eshte cip i ngushte: Niveli shfaqet vetem mbi 100 pike. */}
                <div className="seller-chips">
                  <IdentityBadges
                    subject={seller}
                    activeListings={sellerCount}
                    isBusiness={isBusinessListing}
                    density="compact"
                    isAdmin={!!seller.is_admin}
                    isVerified={avatarVerified(seller, isBusinessListing ? 'business' : 'person')}
                    isNewMember={isNewMember(seller.created_at)}
                    isActiveSeller={sellerCount > 0}
                    isPrivateChat={!isOwner}
                  />
                </div>

                {/* Stats */}
                {/* Pikët hiqen nga këtu: IdentityBadges më lart i jep tashmë "⚡ N pikë"
                    (dyfishim i matur nga terminali [O58], vetëm /listing e kishte). Mbeten
                    "N shpallje aktive" dhe "@username" — s'i jep komponenti, pa dyfishim. */}
                <div className="seller-stats">
                  <span className="stat-chip"><i className="ti ti-package" aria-hidden="true" />{sellerCount} shpallje aktive</span>
                  {seller.username && <span className="stat-chip"><i className="ti ti-at" aria-hidden="true" />{seller.username}</span>}
                </div>

                {/* Trust Score — respekto opt-out (Ligj 124/2024 n.19) */}
                {seller.created_at && seller.trust_score_visible !== false && (
                  <div style={{ marginBottom: 8 }}>
                    <TrustBadge
                      score={seller.trust_score ?? undefined}
                      createdAt={seller.created_at}
                      listingsActive={sellerCount}
                      gamificationPoints={seller.gamification_points || 0}
                    />
                  </div>
                )}

                {/* Bio */}
                {(seller.bio || seller.shop_description) && (
                  <div className="seller-bio">{seller.bio || seller.shop_description}</div>
                )}

                {/* Profile / Business button. Për PRONARIN nuk e FSHEHIM (do vdiste hapi 2 i
                    modelit 3-shkallësh pikërisht për personin që i hap më shpesh shpalljet e veta);
                    ndryshojmë ETIKETËN — njësoj si BiznesPageClient (§4-bis: një zgjidhje, jo dy). */}
                {bizHref && (
                  <button type="button" className="view-profile-btn"
                    onClick={() => { window.location.href = bizHref }}>
                    <i className="ti ti-building-store" aria-hidden="true" />
                    {isOwner ? 'Biznesi yt →' : 'Shiko biznesin →'}
                  </button>
                )}
                {/* Profili i personit del edhe kur shitesi eshte biznes:
                    dyqani dhe njeriu pas tij jane dy faqe te ndryshme dhe
                    blerësi mund te doje te dyja (§4.5 — lidhje dydrejtimeshe). */}
                <button type="button" className="view-profile-btn"
                  onClick={() => window.location.href = `/u/${seller.id}`}>
                  <i className="ti ti-user" aria-hidden="true" />
                  {isOwner ? 'Profili yt →' : 'Shiko profilin →'}
                </button>

                {/* Shop link — vetem per shitesit e vjeter me `shop_name` pa
                    `business_id`; kur shpallja ka biznes, BusinessMiniCard e
                    mbulon tashme kete rresht dhe do te ishte dyfishim. */}
                {hasShop && !isOwner && !listing.business_id && bizHref && (
                  <a className="shop-link-row" href={bizHref}>
                    <span style={{ fontSize: 20 }} aria-hidden="true">🏢</span>
                    <div>
                      <span>{seller.shop_name}</span>
                      <small>Shfleto të gjitha shpalljet e biznesit</small>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 'var(--fs-dysheme)', color: '#aaa', marginLeft: 'auto' }} aria-hidden="true" />
                  </a>
                )}
              </div>
              <div style={{ height: 11 }} />
            </>
          )}

          {/* GAP 5 (RESTAURIMI FINAL): BusinessMiniCard u hoq — dublonte lidhjen e biznesit
              që jepet tashmë nga butoni "Shiko biznesin →" te blloku i shitësit (një lidhje e
              vetme biznesi, pa dy kartela për të njëjtin biznes). */}

          {listing.description && (
            <>
              <div className="divider" />
              <div className="sec-label">Përshkrimi</div>
              <div className="desc">{listing.description}</div>
            </>
          )}

          {/* Vendndodhja */}
          {(listing.city || (listing.latitude && listing.longitude)) && (
            <>
              <div className="divider" />
              <div className="sec-label">Vendndodhja</div>
              {listing.latitude && listing.longitude ? (
                <MapDisplay
                  lat={listing.latitude}
                  lng={listing.longitude}
                  address={listing.location_address || listing.city || ''}
                />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--fs-dysheme)', color: '#555' }}><span aria-hidden="true">📍</span> {listing.city}</span>
                  <a
                    href={`https://www.google.com/maps/search/${encodeURIComponent(listing.city + ', Shqipëri')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="map-link">
                    <i className="ti ti-map" aria-hidden="true" />Hap në Maps
                  </a>
                </div>
              )}
            </>
          )}

          {/* Oferta — mbyllja e qarkut te `offers`. Vjen PAS pershkrimit dhe
              vendndodhjes: bleresi vendos per cmimin pasi e ka kuptuar sendin.
              Komponenti vetefshihet kur ofertat jane te fikura nga `app_config`,
              kur shpallja s'eshte aktive, ose kur s'ka asgje per te thene. */}
          <OfferBox listingId={params.id} isOwner={isOwner} initial={offerState} />

          {/* Marketing: upsell per pronarin jo-premium */}
          {isOwner && sellerTier === 'free' && (
            <SellerPremiumUpsell isPremium={false} />
          )}

          {/* Owner actions — Ndrysho/Rifresko u ngjitën lart te quick-actions;
              këtu mbetet vetëm veprimi shkatërrues (Fshi), me rrjedhën e vet të
              konfirmimit dy-hapëshe (§7.4). */}
          {isOwner && (
            <div style={{ padding: '0 13px 14px' }}>
              {/* Fshirja — buton shkaterrues: outline i kuq, jo mbushje, dhe
                  kurre me nje klikim te vetem (§7.4). Klikimi i pare hap
                  konfirmimin, i dyti fshin. */}
              <div style={{ marginTop: 8 }}>
                {!delConfirm ? (
                  <button
                    type="button"
                    onClick={() => { setDelConfirm(true); setDelMsg('') }}
                    aria-label="Fshi shpalljen"
                    style={{ width: '100%', background: '#fff', color: 'var(--az-red-deep)', border: '1.5px solid var(--az-red-deep)', borderRadius: 12, minHeight: 44, padding: '10px', fontSize: 'var(--fs-dysheme)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                    <i className="ti ti-trash" style={{ fontSize: 'var(--fs-dysheme)' }} aria-hidden="true" />Fshi shpalljen
                  </button>
                ) : (
                  <div role="alertdialog" aria-label="Konfirmo fshirjen" style={{ background: '#FFF5F3', border: '1.5px solid #F0BDB2', borderRadius: 12, padding: '11px 12px' }}>
                    <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: 'var(--az-red-deep)', marginBottom: 4 }}>
                      Ta fshijmë këtë shpallje?
                    </div>
                    <div style={{ fontSize: 'var(--fs-dysheme)', color: '#6b5a56', lineHeight: 1.5, marginBottom: 10 }}>
                      Hiqet nga faqja dhe nga kërkimi. Bisedat dhe historiku i pagesave nuk preken.
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setDelConfirm(false)}
                        style={{ flex: 1, background: '#fff', color: '#555', border: '1px solid #ddd', borderRadius: 12, minHeight: 44, fontSize: 'var(--fs-dysheme)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        Jo, hiqe
                      </button>
                      <button
                        type="button"
                        onClick={doDelete}
                        disabled={delLoading}
                        style={{ flex: 1, background: 'var(--az-red-deep)', color: '#fff', border: 'none', borderRadius: 12, minHeight: 44, fontSize: 'var(--fs-dysheme)', fontWeight: 800, cursor: delLoading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: delLoading ? 0.7 : 1 }}>
                        {delLoading ? 'Po fshihet…' : 'Po, fshije'}
                      </button>
                    </div>
                  </div>
                )}
                {delMsg && (
                  <div role="alert" style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 600, color: 'var(--az-red-deep)', textAlign: 'center', padding: '6px 0 0' }}>
                    {delMsg}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review section — vetëm vizitorë jo-pronar të loguar */}
          {!isOwner && user && seller && (
            <div style={{ padding: '0 13px 14px' }}>
              <div className="divider" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: '#4A4A4A', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                Vlerëso shitësin
              </div>

              {myReview ? (
                <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 10, padding: '10px 13px', fontSize: 'var(--fs-dysheme)' }}>
                  <div style={{ color: '#3B6D11', fontWeight: 700, marginBottom: 4 }}>
                    <><span aria-hidden='true'>{'⭐'.repeat(myReview.rating)}</span> Vlerësimi yt u ruajt</>
                    {myReview.purchase_verified && (
                      <span style={{ marginLeft: 6, background: '#0E7A35', color: '#fff', fontSize: 'var(--fs-dysheme)', fontWeight: 700, padding: '1px 6px', borderRadius: 6 }}><span aria-hidden="true">✅</span> Blerje e verifikuar</span>
                    )}
                  </div>
                  {myReview.comment && <div style={{ color: '#555' }}>{myReview.comment}</div>}
                </div>
              ) : (
                <div style={{ background: '#fff', border: '0.5px solid #eee', borderRadius: 10, padding: '12px 13px' }}>
                  {/* Yjet */}
                  <div role="group" aria-label="Vlerëso me yje" style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" aria-label={`${s} yll${s > 1 ? 'e' : ''}`} aria-pressed={s <= reviewStars} onClick={() => setReviewStars(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, padding: 0, opacity: s <= reviewStars ? 1 : 0.3 }}><span aria-hidden="true">⭐</span>
                      </button>
                    ))}
                  </div>
                  {/* Koment */}
                  <textarea
                    aria-label="Komenti"
                    placeholder="Komenti (opsional)..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    maxLength={300}
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 9, padding: '8px 11px', fontSize: 'var(--fs-dysheme)', fontFamily: 'inherit', outline: 'none', resize: 'none', minHeight: 60, color: '#111', background: '#fff', boxSizing: 'border-box' }}
                  />
                  {reviewMsg && (
                    <div style={{ fontSize: 'var(--fs-dysheme)', marginTop: 6, color: reviewMsg.startsWith('ok:') ? '#3B6D11' : 'var(--az-red-deep)', fontWeight: 600 }}>
                      {reviewMsg.split(/:(.+)/)[1]}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewStars === 0 || reviewSaving}
                    style={{ marginTop: 8, width: '100%', background: reviewStars ? 'var(--az-red-deep)' : '#ccc', color: '#fff', border: 'none', borderRadius: 9, padding: '10px', fontSize: 'var(--fs-dysheme)', fontWeight: 700, cursor: reviewStars ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                    {reviewSaving ? <><span aria-hidden='true'>⏳</span> Duke ruajtur...</> : <><span aria-hidden='true'>⭐</span> Dërgo vlerësimin</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Similar listings */}
          {similar.length > 0 && (
            <div style={{ padding: '0 13px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--fs-dysheme)', color: '#111', marginBottom: 12 }}>
                Shpallje të ngjashme
              </div>
              {/* I njejti ListingCard si kudo tjeter. showSeller={true}: tani te tria burimet
                  (/api/similar, recommend_similar, fallback) perdorin LISTING_SELECT, ndaj mbajne
                  join-et business/author -> cipi i shitesit shfaqet edhe ketu (3-shkalleshi konsistent,
                  D2). `similar` mbushet vetem pas montimit, ndaj mounted={true} eshte i sigurt. */}
              <div className="listings-grid">
                {similar.map((s, i) => (
                  <ListingCard key={s.id} listing={s as any} index={i} showSeller={true} mounted={true} />
                ))}
              </div>
            </div>
          )}

          {/* Rreshti i sigurisë/besimit (Raporto · Kërkesë heqjeje · Ndaj) u ngjit
              lart te rreshti i vetëm i veprimeve (quick-actions), te vija ku e
              kërkoi pronari — nuk rri më i shpërndarë në fund të faqes. */}
        </div>
      </div>

      {/* ── PRICE ALERT MODAL ── */}
      {alertOpen && (
        <>
          <div className="alert-overlay" onClick={() => { setAlertOpen(false); setAlertMsg('') }} />
          <div className="alert-panel" role="dialog" aria-modal="true" aria-label="Alarmi i Çmimit">
            <div className="alert-handle" />
            <div className="alert-title">
              <i className="ti ti-bell-ringing" style={{ color: '#C42B0F' }} aria-hidden="true" />
              Alarmi i Çmimit
            </div>
            <div className="alert-sub">
              Do të njoftohesh kur çmimi të bjerë poshtë kufirit që vendos.
              {priceAlert && !priceAlert.triggered && (
                <span style={{ color: '#856404', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 7, padding: '2px 8px', marginLeft: 6, fontSize: 'var(--fs-dysheme)' }}>
                  Aktiv: {priceAlert.target_price} ALL
                </span>
              )}
              {priceAlert?.triggered && (
                <span style={{ color: '#2e7d32', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 7, padding: '2px 8px', marginLeft: 6, fontSize: 'var(--fs-dysheme)' }}>
                  <><span aria-hidden="true">✅</span> U aktivizua</>
                </span>
              )}
            </div>
            <div style={{ fontSize: 'var(--fs-dysheme)', color: '#555', marginBottom: 8 }}>
              Çmimi aktual: <strong style={{ color: '#111' }}>{fmt(listing?.price, listing?.currency)}</strong>
            </div>
            <input
              className="alert-input"
              type="number"
              aria-label="Çmimi target i alarmit"
              placeholder="Çmimi target (p.sh. 5000)"
              value={alertTarget}
              onChange={e => setAlertTarget(e.target.value)}
              min={1}
            />
            <div className="alert-btn-row">
              {priceAlert && (
                <button type="button" className="alert-del" onClick={deleteAlert} disabled={alertSaving} aria-label="Fshi alarmin">
                  <i className="ti ti-trash" aria-hidden="true" />
                </button>
              )}
              <button type="button" className="alert-save" onClick={saveAlert} disabled={alertSaving || !alertTarget}>
                {alertSaving ? 'Duke ruajtur...' : priceAlert ? 'Përditëso alarmin' : <><span aria-hidden='true'>🔔</span> Aktivizo alarmin</>}
              </button>
            </div>
            {alertMsg && (
              <div role="alert" className="alert-msg" style={{ color: alertMsg.startsWith('ok:') ? '#2e7d32' : 'var(--az-red-deep)' }}>
                {alertMsg.replace(/^(ok|err):/, '')}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── REPORT MODAL ── */}
      {reportOpen && (
        <ReportSheet
          listingId={params.id}
          userId={user?.id || null}
          onClose={() => setReportOpen(false)}
        />
      )}

      {/* ── CHAT BOTTOM SHEET ── */}
      {chatPanelOpen && seller && (
        <>
          <div className="cs-overlay" onClick={() => setChatOpen(false)} />
          <div role="dialog" aria-modal="true" aria-label="Kontakto shitësin" className="cs-panel">
            <div className="cs-handle-row"><div className="cs-handle" /></div>

            {/* Header */}
            <div className="cs-header">
              <Avatar
                src={seller.avatar_url}
                name={seller.shop_name || seller.full_name || seller.username}
                type={isBusinessListing ? 'business' : 'person'}
                tier={tierNgaProfili(seller)}
                verified={avatarVerified(seller)}
                online={sellerOnline}
                size={36}
              />
              <span className="cs-seller-name">
                {seller.shop_name || seller.full_name || seller.username || 'Shitës'}
              </span>
              <span className="cs-priv"><span aria-hidden="true">🔒</span> Private</span>
              <button type="button" className="cs-close" aria-label="Mbyll bisedën" onClick={() => setChatOpen(false)}>
                <i className="ti ti-x" aria-hidden="true" />
              </button>
            </div>

            {/* Listing reference */}
            <div className="cs-ref">
              <i className="ti ti-bookmark" aria-hidden="true" />
              <span className="cs-ref-text"><span aria-hidden="true">📌</span> {listing.title}</span>
              {listing.price > 0 && (
                <span className="cs-ref-price">{fmt(listing.price, listing.currency)}</span>
              )}
            </div>

            {/* Messages or login prompt */}
            {!user ? (
              <div className="login-prompt">
                <p>Hyr në llogarinë tënde për të biseduar me shitësin</p>
                <button type="button" className="login-prompt-btn"
                  onClick={() => window.location.href = '/auth/login'}>
                  <><span aria-hidden="true">🔑</span> Hyr / Regjistrohu</>
                </button>
              </div>
            ) : (
              <>
                <div className="cs-msgs">
                  {chatMsgs.length === 0 && chatReady ? (
                    <div className="empty-chat">
                      <div className="empty-chat-icon" aria-hidden="true">👋</div>
                      <div className="empty-chat-txt">
                        Fillo bisedën me shitësin.<br />
                        Mesazhet janë private dhe të sigurta.
                      </div>
                    </div>
                  ) : (
                    groups.map((g, gi) => (
                      <div key={gi}>
                        <div className="day-sep"><span>{g.date}</span></div>
                        {g.items.map((msg) => {
                          const mine = msg.sender_id === user?.id
                          return (
                            <div key={msg.id} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                              <div className="bubble-w">
                                <div className="bubble">{msg.content}</div>
                                <div className="btime">{fullTime(msg.created_at)}</div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))
                  )}
                  {typingVis && (
                    <div className="typing-row">
                      <div className="typing-bbl">
                        <span className="tdot" /><span className="tdot" /><span className="tdot" />
                      </div>
                    </div>
                  )}
                  <div ref={chatBottom} style={{ height: 4 }} />
                </div>

                <div className="cs-input-bar">
                  <div className="cs-input-wrap">
                    <textarea
                      ref={inputRef}
                      aria-label="Shkruaj mesazhin tënd"
                      rows={1}
                      placeholder="Shkruaj mesazhin tënd..."
                      value={draft}
                      onChange={e => {
                        setDraft(e.target.value)
                        e.target.style.height = 'auto'
                        e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'
                        channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user?.id } })
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() }
                      }}
                    />
                  </div>
                  <button type="button" className="cs-send-btn" aria-label="Dërgo mesazhin" onClick={sendMsg} disabled={!draft.trim() || sending}>
                    <i className={`ti ti-${sending ? 'loader-2' : 'send'}`} aria-hidden="true"
                      style={sending ? { animation: 'spin .7s linear infinite' } : {}} />
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Bottom bar — visible when chat sheet is closed */}
      {!isOwner && !chatPanelOpen && seller && (
        <div className="bottom-bar">
          <div className="bb-price">
            <span className="bb-price-l">Çmimi</span>
            <span className="bb-price-n">{listing.price ? fmt(listing.price, listing.currency) : 'Marrëveshje'}</span>
          </div>
          <button type="button" className="main-chat-btn" onClick={() => {
            if (!user) { window.location.href = '/auth/login'; return }
            setChatOpen(true)
            setTimeout(() => inputRef.current?.focus(), 350)
          }}>
            <i className="ti ti-messages" aria-hidden="true" />
            {user ? <><span aria-hidden='true'>💬</span> Fillo bisedën</> : <><span aria-hidden='true'>🔑</span> Hyr për të biseduar</>}
          </button>
          {/*  BUTONA, JO LIDHJE: numri nuk ekziston ne faqe derisa perdoruesi
               ta kerkoje. Fleta e konfirmimit perdor te njejtin fjalor si ajo
               te `/messages` — i njejti veprim duhet te duket i njejte.  */}
          {seller.has_phone && (
            <button type="button" className="wa-btn" aria-label="Kontakto me WhatsApp"
              onClick={() => { setKontakti('wa'); hapKontaktin() }}>
              <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            </button>
          )}
          {seller.has_phone && (
            <button type="button" className="viber-btn" aria-label="Kontakto me Viber"
              onClick={() => { setKontakti('viber'); hapKontaktin() }}>
              <i className="ti ti-phone" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {/*  FLETA E KONTAKTIT — i njejti model si te `/messages`: emoji, titull,
           fjali shpjeguese, numri i shfaqur SHPREHIMISHT, veprimi kryesor,
           anulimi. Numri tregohet sepse perdoruesi duhet te shohe cfare po
           merr; eshte edhe zbulim i ndershem edhe rruge e dyte kur aplikacioni
           nuk hapet dot.
           z-index 300 = i njejti nivel si `.overlay` e `/messages`, JO nje numer
           i ri: me 120 flluska e Albit (z-index 200) dilte MBI fleten modale dhe
           mbulonte fjaline — pare me sy me 31 gusht 2026.  */}
      {kontakti && seller && (
        <div onClick={() => setKontakti(null)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:300, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div role="dialog" aria-modal="true"
            aria-label={kontakti === 'wa' ? 'Vazhdo në WhatsApp' : 'Vazhdo në Viber'}
            onClick={e => e.stopPropagation()}
            style={{ width:'100%', maxWidth:480, background:'#fff', borderRadius:'20px 20px 0 0', padding:'10px 20px 24px', textAlign:'center' }}>
            <div style={{ width:38, height:4, borderRadius:2, background:'#e0e0e0', margin:'0 auto 14px' }} aria-hidden="true" />
            <div style={{ fontSize:52, marginBottom:10 }} aria-hidden="true">{kontakti === 'wa' ? '💬' : '📲'}</div>
            <div style={{ fontWeight:700, fontSize:16, color:'#111', marginBottom:8 }}>
              {kontakti === 'wa' ? 'Vazhdo në WhatsApp' : 'Vazhdo në Viber'}
            </div>
            <div style={{ fontSize: 'var(--fs-dysheme)', color:'#555', lineHeight:1.7, marginBottom:18 }}>
              Do të kontaktosh <strong>{seller.shop_name || seller.full_name || seller.username || 'shitësin'}</strong> jashtë Alpazar-it.
            </div>

            {kontaktDuke ? (
              <div role="status" style={{ padding:14, borderRadius:14, background:'#f5f3eb', fontSize: 'var(--fs-dysheme)', fontWeight:600, color:'#555', marginBottom:10 }}>
                Duke hapur kontaktin…
              </div>
            ) : kontaktGabim ? (
              <div role="alert" style={{ padding:'12px 14px', borderRadius:14, background:'#FFF0EE', border:'1px solid #F09595', fontSize: 'var(--fs-dysheme)', fontWeight:600, color:'var(--az-red-deep)', marginBottom:10, lineHeight:1.6 }}>
                {kontaktGabim}
              </div>
            ) : sellerPhone ? (
              <>
                <div style={{ fontSize:15, fontWeight:800, color:'#111', letterSpacing:'.3px', marginBottom:12 }}>{sellerPhone}</div>
                <a
                  href={kontakti === 'wa'
                    ? `https://wa.me/${sellerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Përshëndetje! Jam i interesuar/e për: "${listing.title}"`)}`
                    : `viber://chat?number=%2B${sellerPhone.replace(/\D/g, '')}`}
                  target={kontakti === 'wa' ? '_blank' : undefined}
                  rel={kontakti === 'wa' ? 'noopener noreferrer' : undefined}
                  onClick={() => { trackEvent(kontakti === 'wa' ? 'contact_whatsapp' : 'contact_viber', listing.id); setKontakti(null) }}
                  style={{ display:'block', background: kontakti === 'wa' ? '#25D366' : '#7360F2', color:'#fff', textDecoration:'none', padding:14, borderRadius:14, fontWeight:700, fontSize:15, marginBottom:10 }}>
                  {kontakti === 'wa' ? 'Hap WhatsApp' : 'Hap Viber'}
                </a>
              </>
            ) : null}

            <button type="button" onClick={() => setKontakti(null)}
              style={{ width:'100%', padding:13, background:'#f5f3eb', border:'none', borderRadius:14, fontWeight:600, fontSize: 'var(--fs-dysheme)', cursor:'pointer', color:'#555', fontFamily:'inherit' }}>
              Anulo
            </button>
          </div>
        </div>
      )}

    </>
  )
}

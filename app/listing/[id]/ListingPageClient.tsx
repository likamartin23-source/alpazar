'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { supabase } from '../../../lib/supabase'
import { nf, dateShort, dayMonth, monthYear, clockTime } from '../../../lib/format'
import { getLevel, isNewMember } from '../../components/Badges'
import { SocialProofBar, SellerPremiumUpsell } from '../../components/PremiumUpsell'
import { saveRefFromUrl, buildShareUrl } from '../../../lib/referral'
import { TrustBadge } from '../../components/TrustBadge'
import { SharePanel } from '../../components/SharePanel'
import { ImageCarousel } from '../../components/ImageCarousel'
import Avatar from '../../components/Avatar'

const MapDisplay = dynamic(() => import('../../components/MapDisplay').then(m => ({ default: m.MapDisplay })), { ssr: false })

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
function BusinessMiniCard({ bizId }: { bizId: string }) {
  const [biz, setBiz] = useState<any>(null)
  useEffect(() => {
    supabase.from('businesses').select('id,name,logo_url,is_verified').eq('id', bizId).single().then(({ data }) => { if (data) setBiz(data) })
  }, [bizId])
  if (!biz) return null
  return (
    <div role="link" tabIndex={0} style={{ margin: '0 0 12px', padding: '10px 12px', background: '#F5F5F5', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.location.href = `/biznese/${biz.id}`} onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/biznese/${biz.id}` }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: '1px solid #eee', flexShrink: 0 }}>
        {biz.logo_url ? <img src={biz.logo_url} alt={biz.name} loading="lazy" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span aria-hidden="true">🏢</span>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#111' }}>{biz.name} {biz.is_verified && <span style={{ color: '#16a34a' }} aria-label="Biznes i verifikuar"><span aria-hidden="true">✓</span> Biznes</span>}</div>
        <div style={{ fontSize: 10, color: '#888' }}>Shfaq faqen e biznesit →</div>
      </div>
    </div>
  )
}

function pubDate(d: string) {
  return dateShort(d)
}

export default function ListingPageClient({ params, initialListing }: { params: { id: string }; initialListing?: any }) {
  const [listing, setListing]         = useState<any>(initialListing ?? null)
  const [seller, setSeller]           = useState<any>(null)
  const [sellerCount, setSellerCount] = useState(0)
  const [loading, setLoading]         = useState(!initialListing)
  const [loadError, setLoadError]     = useState(false)
  const [similar, setSimilar]         = useState<any[]>([])
  const [user, setUser]               = useState<any>(null)
  const [liked, setLiked]             = useState(false)
  const [myRefCode, setMyRefCode]     = useState<string | null>(null)
  const [shareOpen, setShareOpen]     = useState(false)
  const [linkCopied, setLinkCopied]   = useState(false)

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
  const [reportReason, setReportReason] = useState('')
  const [reportSent, setReportSent]   = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportErr, setReportErr]     = useState('')

  const REPORT_REASONS = [
    'Shpallje mashtruese / e rreme',
    'Çmim i dyshimtë',
    'Produkt i ndaluar',
    'Foto / informacion i vjedhur',
    'Kontakt i rremë',
    'Tjetër',
  ]

  async function submitReview() {
    if (!user || !seller || reviewStars === 0) return
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

  async function submitReport() {
    if (!reportReason) return
    setReportLoading(true); setReportErr('')
    const { error } = await supabase.from('reports').insert({
      listing_id: params.id,
      reporter_id: user?.id || null,
      reason: reportReason,
      status: 'pending',
    })
    setReportLoading(false)
    if (!error) {
      setReportSent(true)
      setTimeout(() => setReportOpen(false), 1800)
    } else {
      setReportErr(/row-level security|permission|denied/i.test(error.message)
        ? 'Duhet të kyçesh për të raportuar. Hyr dhe provo sërish.'
        : 'Raporti nuk u dërgua. Provo sërish.')
    }
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
  const sellerRef    = useRef<any>(null)
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
    const { error } = await supabase.from('listings').update({ created_at: now, last_bumped_at: now }).eq('id', params.id)
    if (error) {
      setBumpMsg('err:Gabim gjatë ngritjes.')
    } else {
      setListing((l: any) => l ? { ...l, last_bumped_at: now, created_at: now } : l)
      setBumpMsg('ok:Shpallja u ngrit në krye! ⬆️')
      setTimeout(() => setBumpMsg(''), 3000)
    }
    setBumpLoading(false)
  }

  async function fetchListing() {
    let data: any = initialListing ?? null
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
          supabase.from('profiles').select('*').eq('id', data.user_id).single(),
          supabase.from('listings').select('*', { count: 'exact', head: true })
            .eq('user_id', data.user_id).eq('is_active', true),
        ])
        if (p) { setSeller(p); sellerRef.current = p }
        if (count !== null) setSellerCount(count)
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
      .select('id,title,price,currency,images,condition,city,is_premium,views_count')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .neq('id', currentId)
    if (city) q = q.eq('city', city)
    if (price && price > 0) {
      q = q.gte('price', price * 0.7).lte('price', price * 1.3)
    }
    const { data } = await q.order('views_count', { ascending: false }).limit(4)
    if (data && data.length > 0) {
      setSimilar(data)
    } else if (city || price) {
      // Fallback: broader search without city/price filters
      const { data: fallback } = await supabase
        .from('listings')
        .select('id,title,price,currency,images,condition,city,is_premium,views_count')
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
    if (!text || !user || !seller || sending) return
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

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${nf(price)} €` : `${nf(price)} L`

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
      <button type="button" onClick={() => window.location.reload()} style={{ background: '#F5C842', border: 'none', borderRadius: 24, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Rifresko</button>
    </div>
  )

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg);}}` }} />
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }} aria-hidden="true">🔍</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Shpallja nuk u gjet</h2>
      <a href="/" style={{ color: '#E63312', fontSize: 13 }}>← Kthehu</a>
    </div>
  )

  const images  = listing.images?.length ? listing.images : []
  const isOwner = user?.id === listing.user_id
  const hasShop = seller?.is_premium && seller?.shop_name
  const initials  = (seller?.shop_name || seller?.full_name || '?').slice(0, 2).toUpperCase()
  const groups    = buildGroups(chatMsgs)
  const showChatSheet = !isOwner
  const chatPanelOpen = chatOpen && showChatSheet

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:${chatPanelOpen ? '300px' : '70px'};}
        .topbar{background:linear-gradient(165deg,#F8D24E 0%,#F5C842 52%,#EEB828 100%);padding:10px 12px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .share-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:16px;color:#111;}

        /* Gallery */
        .img-wrap{width:100%;height:230px;background:linear-gradient(135deg,#FBF7E8,#F2EAD0);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .img-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;}
        .img-dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:14px;}
        .like-btn{position:absolute;top:10px;right:10px;width:34px;height:34px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}

        /* Info */
        .info{padding:12px 12px 0;}
        .status-row{display:flex;align-items:center;gap:6px;margin-bottom:7px;}
        .status-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:4px 11px;border-radius:999px;}
        .sc-active{background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A7;}
        .sc-sold{background:#F3F3F3;color:#555;border:1px solid #ccc;}
        h1{font-size:18px;font-weight:800;color:#1a1a1a;margin-bottom:6px;line-height:1.3;letter-spacing:-.2px;}
        .price{font-size:25px;font-weight:800;color:#E63312;margin-bottom:12px;letter-spacing:-.5px;}
        .meta{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;}
        .meta-item{display:flex;align-items:center;gap:4px;font-size:11px;color:#555;background:#f5f3eb;padding:5px 10px;border-radius:999px;font-weight:600;}
        .meta-item i{font-size:12px;color:#999;}
        .cond-new{background:#FFF0EE;color:#E63312;font-weight:700;}
        .cond-used{background:#F0F0F0;color:#555;font-weight:700;}
        .divider{height:1px;background:#f0f0f0;margin:10px 0;}
        .sec-label{font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
        .desc{font-size:13px;color:#555;line-height:1.7;}

        /* Seller section — free-flowing */
        .seller-section{background:#fff;border:0.5px solid #ececec;border-radius:14px;padding:14px;margin:0 12px 12px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 8px 20px -12px rgba(0,0,0,.16);}
        .seller-av-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .seller-av{width:44px;height:44px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;border:2.5px solid #F5C842;}
        .seller-av img{width:100%;height:100%;object-fit:cover;}
        .seller-name{font-size:14px;font-weight:700;color:#111;}
        .seller-sub{font-size:11px;color:#888;margin-top:2px;}
        .seller-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;}
        .schip{font-size:9.5px;font-weight:700;padding:3px 8px;border-radius:6px;}
        .sch-prem{background:linear-gradient(135deg,#F8D24E,#F5C842);color:#111;box-shadow:0 1px 4px rgba(245,200,66,.45);}
        .sch-shop{background:linear-gradient(135deg,#12c98a,#10B981);color:#fff;box-shadow:0 1px 4px rgba(16,185,129,.35);}
        .sch-admin{background:linear-gradient(135deg,#8b4bf0,#7C3AED);color:#fff;}
        .sch-priv{background:#EEF4FF;color:#185FA5;border:1px solid #C3DAFB;}
        .sch-seller{background:#EEF4FF;color:#185FA5;}
        .sch-new{background:#FFF4E5;color:#B45309;}
        .seller-stats{display:flex;gap:6px;margin-bottom:7px;flex-wrap:wrap;}
        .stat-chip{display:flex;align-items:center;gap:4px;background:#f8f6f0;border:0.5px solid #ececec;border-radius:10px;padding:5px 10px;font-size:11px;color:#555;}
        .stat-chip i{font-size:11px;color:#999;}
        .seller-bio{font-size:12px;color:#666;line-height:1.65;margin-bottom:8px;}
        .view-profile-btn{display:flex;align-items:center;justify-content:center;gap:6px;background:linear-gradient(135deg,#1a1a1a,#000);color:#F5C842;border:none;border-radius:12px;padding:10px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;box-shadow:0 2px 8px -2px rgba(0,0,0,.35);transition:transform .15s ease,box-shadow .15s ease;}
        .view-profile-btn:hover{transform:translateY(-1px);box-shadow:0 5px 14px -3px rgba(0,0,0,.45);}
        .shop-link-row{display:flex;align-items:center;gap:9px;background:#f8f6f0;border:0.5px solid #ececec;border-radius:12px;padding:9px 12px;margin-top:8px;cursor:pointer;text-decoration:none;transition:background .15s ease;}
        .shop-link-row:hover{background:#f2efe6;}
        .shop-link-row span{font-size:12px;font-weight:700;color:#111;}
        .shop-link-row small{font-size:10px;color:#aaa;display:block;margin-top:1px;}

        /* ── CHAT BOTTOM SHEET ── */
        .cs-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:190;animation:fadeIn .2s;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .cs-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:200;box-shadow:0 -4px 24px rgba(0,0,0,.15);display:flex;flex-direction:column;max-height:75vh;}
        .cs-handle-row{padding:8px 0 4px;display:flex;justify-content:center;flex-shrink:0;}
        .cs-handle{width:36px;height:4px;background:#ddd;border-radius:4px;}
        .cs-header{padding:0 13px 8px;display:flex;align-items:center;gap:9px;flex-shrink:0;border-bottom:1px solid #f0f0f0;}
        .cs-av{width:32px;height:32px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;}
        .cs-av img{width:100%;height:100%;object-fit:cover;}
        .cs-seller-name{font-size:13px;font-weight:700;color:#111;flex:1;}
        .cs-priv{font-size:9.5px;background:#EEF4FF;color:#185FA5;border:1px solid #C3DAFB;padding:2px 7px;border-radius:8px;font-weight:700;}
        .cs-close{width:28px;height:28px;background:#f5f5f5;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .cs-close i{font-size:14px;color:#888;}
        .cs-ref{background:#FFF8EE;border-bottom:1px solid #FFE8C4;padding:7px 13px;display:flex;align-items:center;gap:7px;flex-shrink:0;}
        .cs-ref i{font-size:12px;color:#E63312;flex-shrink:0;}
        .cs-ref-text{font-size:11px;color:#333;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .cs-ref-price{font-size:11px;font-weight:700;color:#E63312;white-space:nowrap;}
        .cs-msgs{flex:1;overflow-y:auto;padding:10px 12px 6px;display:flex;flex-direction:column;gap:2px;background:#f9f6ef;}
        .cs-msgs::-webkit-scrollbar{width:2px;}
        .cs-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}
        .day-sep{text-align:center;margin:6px 0 3px;pointer-events:none;}
        .day-sep span{background:rgba(0,0,0,.08);color:#777;font-size:10px;font-weight:600;padding:2px 9px;border-radius:10px;}
        .msg-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:1px;}
        .msg-row.mine{flex-direction:row-reverse;}
        .bubble-w{max-width:76%;}
        .mine .bubble-w{align-items:flex-end;display:flex;flex-direction:column;}
        .bubble{padding:7px 11px;font-size:13px;line-height:1.5;word-break:break-word;border-radius:14px;}
        .mine .bubble{background:linear-gradient(135deg,#F5C842,#e8b820);color:#111;border-bottom-right-radius:4px;box-shadow:0 2px 6px rgba(245,200,66,.3);}
        .theirs .bubble{background:#fff;color:#111;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
        .btime{font-size:9px;color:rgba(0,0,0,.3);margin-top:2px;text-align:right;}
        .theirs .btime{text-align:left;color:#bbb;}
        .empty-chat{text-align:center;padding:20px 16px;color:#bbb;}
        .empty-chat-icon{font-size:30px;margin-bottom:6px;}
        .empty-chat-txt{font-size:12px;line-height:1.6;}
        .typing-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:4px;}
        .typing-bbl{background:#fff;border-radius:14px 14px 14px 4px;padding:8px 12px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:3px;}
        .tdot{width:5px;height:5px;border-radius:50%;background:#bbb;animation:tdot .9s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .cs-input-bar{background:#fff;border-top:1px solid #eee;padding:9px 11px;display:flex;gap:7px;align-items:flex-end;flex-shrink:0;}
        .cs-input-wrap{flex:1;background:#f5f5f0;border-radius:20px;padding:0 12px;display:flex;align-items:flex-end;border:1.5px solid transparent;transition:border-color .15s;}
        .cs-input-wrap:focus-within{border-color:#E63312;background:#fff;}
        .cs-input-wrap textarea{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;resize:none;min-height:20px;max-height:80px;line-height:1.5;padding:9px 0;font-family:inherit;}
        .cs-input-wrap textarea::placeholder{color:#bbb;}
        .cs-send-btn{width:42px;height:42px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .cs-send-btn:disabled{opacity:.4;box-shadow:none;}
        .cs-send-btn i{color:#fff;font-size:18px;}
        .login-prompt{background:#FFF0EE;padding:18px;text-align:center;}
        .login-prompt p{font-size:13px;color:#555;margin-bottom:10px;font-weight:600;}
        .login-prompt-btn{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px -2px rgba(230,51,18,.4);transition:transform .15s ease,box-shadow .15s ease;}
        .login-prompt-btn:hover{transform:translateY(-1px);box-shadow:0 5px 14px -3px rgba(230,51,18,.5);}

        /* Bottom bar */
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:rgba(255,255,255,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-top:1px solid #eee;padding:10px 12px;display:flex;gap:8px;align-items:center;z-index:100;box-shadow:0 -6px 20px rgba(0,0,0,.06);}
        .bb-price{display:flex;flex-direction:column;justify-content:center;flex-shrink:0;max-width:112px;padding-right:2px;}
        .bb-price-l{font-size:9px;font-weight:600;color:#999;text-transform:uppercase;letter-spacing:.3px;line-height:1;}
        .bb-price-n{font-size:16px;font-weight:800;color:#E63312;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.3px;line-height:1.2;}
        .main-chat-btn{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .main-chat-btn i{font-size:16px;}
        .wa-btn{width:48px;height:48px;background:#25D366;border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(37,211,102,.3);text-decoration:none;}
        .wa-btn i{font-size:22px;color:#fff;}
        .viber-btn{width:48px;height:48px;background:#7360F2;border:none;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(115,96,242,.3);text-decoration:none;}
        .viber-btn i{font-size:22px;color:#fff;}

        /* Location section */
        .map-link{display:inline-flex;align-items:center;gap:6px;background:#EEF4FF;color:#185FA5;border:1px solid #C3DAFB;border-radius:9px;padding:7px 13px;font-size:12px;font-weight:600;text-decoration:none;margin-top:8px;}
        .map-link i{font-size:14px;}

        /* Price alert modal */
        .alert-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;animation:fadeIn .2s;}
        .alert-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:310;padding:20px 18px 36px;box-shadow:0 -4px 24px rgba(0,0,0,.15);}
        .alert-handle{width:36px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 16px;}
        .alert-title{font-size:16px;font-weight:800;color:#111;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
        .alert-sub{font-size:12px;color:#888;margin-bottom:16px;}
        .alert-input{width:100%;border:1.5px solid #ddd;border-radius:11px;padding:12px 14px;font-size:15px;font-weight:700;color:#111;box-sizing:border-box;font-family:inherit;outline:none;}
        .alert-input:focus{border-color:#E63312;}
        .alert-btn-row{display:flex;gap:8px;margin-top:14px;}
        .alert-save{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:11px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .alert-save:disabled{opacity:.5;cursor:not-allowed;}
        .alert-del{width:48px;background:#FFF0EE;color:#E63312;border:1.5px solid #FFCDD2;border-radius:11px;padding:13px;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .alert-msg{font-size:12px;text-align:center;margin-top:8px;font-weight:600;}

        @keyframes spin{to{transform:rotate(360deg);}}

        /* Report modal */
        .report-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;animation:fadeIn .2s;}
        .report-panel{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-radius:18px 18px 0 0;z-index:310;padding:18px 16px 32px;box-shadow:0 -4px 24px rgba(0,0,0,.15);}
        .report-handle{width:36px;height:4px;background:#ddd;border-radius:4px;margin:0 auto 14px;}
        .report-title{font-size:15px;font-weight:700;color:#111;margin-bottom:4px;}
        .report-sub{font-size:12px;color:#888;margin-bottom:14px;}
        .reason-list{display:flex;flex-direction:column;gap:7px;margin-bottom:16px;}
        .reason-btn{display:flex;align-items:center;gap:10px;border:1.5px solid #eee;border-radius:10px;padding:11px 13px;background:#fff;font-family:inherit;font-size:13px;color:#333;cursor:pointer;text-align:left;}
        .reason-btn.sel{border-color:#E63312;background:#FFF0EE;color:#E63312;font-weight:600;}
        .report-submit{width:100%;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:11px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}
        .report-submit:disabled{opacity:.5;cursor:not-allowed;}
        .report-success{text-align:center;padding:18px 0;}
        .report-link{display:block;text-align:center;font-size:11px;color:#bbb;margin-top:14px;cursor:pointer;}
        .report-link:hover{color:#E63312;}
        @keyframes ai-fade{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      ` }} />

      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu mbrapa" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
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
                style={{ fontSize: 17, color: liked ? '#E63312' : '#888' }} />
            </button>
          )}
        </div>

        {/* Social proof — shikues aktiv + total pamje */}
        <SocialProofBar viewsCount={listing.views_count || 0} listingId={params.id} />

        <div className="info">
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div className="price">{fmt(listing.price, listing.currency)}</div>
            {user && !isOwner && listing.is_active && (
              <button
                type="button"
                aria-label={priceAlert ? 'Ndrysho alarmin e çmimit' : 'Vendos alarm çmimi'}
                onClick={() => setAlertOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: priceAlert ? '#FFF8E1' : '#F0F7FF',
                  color: priceAlert ? '#856404' : '#185FA5',
                  border: `1.5px solid ${priceAlert ? '#FFE082' : '#C3DAFB'}`,
                  borderRadius: 9, padding: '5px 11px', fontSize: 12,
                  fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                <i className={`ti ti-bell${priceAlert ? '-ringing' : ''}`} style={{ fontSize: 14 }} aria-hidden="true" />
                {priceAlert ? <><span aria-hidden="true">🔔</span> {priceAlert.target_price} ALL</> : 'Njoftomë'}
              </button>
            )}
          </div>

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
            {(listing.views_count || 0) > 0 && <div className="meta-item"><i className="ti ti-eye" aria-hidden="true" />{listing.views_count}</div>}
          </div>

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
                  <span style={{ fontSize: 13, color: '#555' }}><span aria-hidden="true">📍</span> {listing.city}</span>
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

          {/* Business mini-card — shown when listing belongs to a business */}
          {listing.business_id && (
            <BusinessMiniCard bizId={listing.business_id} />
          )}

          {/* Marketing: upsell per pronarin jo-premium */}
          {isOwner && !seller?.is_premium && (
            <SellerPremiumUpsell isPremium={false} />
          )}

          {/* ── PROFILI I SHITËSIT — free-flowing ── */}
          {seller && (
            <>
              <div className="seller-section">
                <div className="sec-label" style={{ marginTop: 0 }}>Shitësi</div>

                {/* Avatar row */}
                <div role="link" tabIndex={0} className="seller-av-row" onClick={() => window.location.href = hasShop ? `/biznese/${seller.id}` : `/u/${seller.id}`} onKeyDown={e => { if (e.key === 'Enter') window.location.href = hasShop ? `/biznese/${seller.id}` : `/u/${seller.id}` }} style={{ cursor: 'pointer' }}>
                  <Avatar
                    src={seller.avatar_url}
                    name={seller.shop_name || seller.full_name || seller.username}
                    type={hasShop ? 'business' : (seller.is_premium ? 'premium' : 'user')}
                    verified={(seller.trust_score ?? 0) >= 60}
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

                {/* Badges */}
                <div className="seller-chips">
                  {seller.is_admin   && <span className="schip sch-admin"><span aria-hidden="true">🛡</span> Admin</span>}
                  {seller.is_premium && <span className="schip sch-prem"><span aria-hidden="true">👑</span> Premium</span>}
                  {seller.shop_name  && <span className="schip sch-shop"><span aria-hidden="true">🏢</span> Biznes</span>}
                  {(() => { const l = getLevel(seller.gamification_points || 0); return <span className="schip" style={{ background: l.bg, color: l.color }}>{l.icon} {l.name}</span> })()}
                  {sellerCount > 0 && <span className="schip sch-seller"><span aria-hidden="true">📦</span> Shitës aktiv</span>}
                  {isNewMember(seller.created_at) && <span className="schip sch-new"><span aria-hidden="true">🆕</span> Anëtar i ri</span>}
                  {!isOwner && <span className="schip sch-priv"><span aria-hidden="true">🔒</span> Bisedë private</span>}
                  {(seller.trust_score ?? 0) >= 60 && (
                    <span className="schip" style={{ background: '#dcfce7', color: '#16a34a', fontWeight: 700 }}><span aria-hidden="true">✓</span> I verifikuar</span>
                  )}
                  {(seller.trust_score ?? 0) >= 75 && (
                    <span className="schip" style={{ background: '#fef9c3', color: '#854d0e', fontWeight: 700 }}><span aria-hidden="true">⚡</span> Përgjigjet shpejt</span>
                  )}
                </div>

                {/* Stats */}
                <div className="seller-stats">
                  <span className="stat-chip"><i className="ti ti-package" aria-hidden="true" />{sellerCount} shpallje aktive</span>
                  {seller.username && <span className="stat-chip"><i className="ti ti-at" aria-hidden="true" />{seller.username}</span>}
                  {seller.gamification_points > 0 &&
                    <span className="stat-chip"><i className="ti ti-bolt" aria-hidden="true" />{seller.gamification_points} pikë</span>}
                </div>

                {/* Trust Score — respekto opt-out (Ligj 124/2024 n.19) */}
                {seller.created_at && seller.trust_score_visible !== false && (
                  <div style={{ marginBottom: 8 }}>
                    <TrustBadge
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

                {/* Profile / Business button */}
                {!isOwner && hasShop && (
                  <button type="button" className="view-profile-btn"
                    onClick={() => window.location.href = `/biznese/${seller.id}`}>
                    <i className="ti ti-building-store" aria-hidden="true" />
                    Shiko biznesin →
                  </button>
                )}
                {!isOwner && !hasShop && (
                  <button type="button" className="view-profile-btn"
                    onClick={() => window.location.href = `/u/${seller.id}`}>
                    <i className="ti ti-user" aria-hidden="true" />
                    Shiko profilin →
                  </button>
                )}

                {/* Shop link */}
                {hasShop && !isOwner && (
                  <a className="shop-link-row" href={`/biznese/${seller.id}`}>
                    <span style={{ fontSize: 20 }} aria-hidden="true">🏢</span>
                    <div>
                      <span>{seller.shop_name}</span>
                      <small>Shfleto të gjitha shpalljet e biznesit</small>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 13, color: '#aaa', marginLeft: 'auto' }} aria-hidden="true" />
                  </a>
                )}
              </div>
              <div style={{ height: 11 }} />
            </>
          )}

          {/* Owner actions */}
          {isOwner && (
            <div style={{ padding: '0 13px 14px' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: bumpMsg ? 8 : 0 }}>
                <button
                  type="button"
                  onClick={() => window.location.href = `/listing/${params.id}/edit`}
                  style={{ flex: 1, background: '#F5C842', color: '#111', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <i className="ti ti-pencil" style={{ fontSize: 14 }} aria-hidden="true" />Ndrysho
                </button>
                <button
                  type="button"
                  onClick={doBump}
                  disabled={bumpLoading || !canBump(listing.last_bumped_at)}
                  aria-label={canBump(listing.last_bumped_at) ? 'Ngrije shpalljen në krye' : 'Mund ta ngresh pas 7 ditësh'}
                  style={{ flex: 1, background: canBump(listing.last_bumped_at) ? '#E63312' : '#F0F0F0', color: canBump(listing.last_bumped_at) ? '#fff' : '#999', border: 'none', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: canBump(listing.last_bumped_at) ? 'pointer' : 'not-allowed', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: bumpLoading ? 0.7 : 1 }}>
                  <i className="ti ti-arrow-up" style={{ fontSize: 14 }} aria-hidden="true" />{canBump(listing.last_bumped_at) ? 'Ngrije' : 'Ngritur'}
                </button>
              </div>
              {bumpMsg && (
                <div role="alert" style={{ fontSize: 12, fontWeight: 600, color: bumpMsg.startsWith('ok:') ? '#1D9E75' : '#E63312', textAlign: 'center', padding: '4px 0' }}>
                  {bumpMsg.replace(/^(ok:|err:)/, '')}
                </div>
              )}
            </div>
          )}

          {/* Review section — vetëm vizitorë jo-pronar të loguar */}
          {!isOwner && user && seller && (
            <div style={{ padding: '0 13px 14px' }}>
              <div className="divider" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 10 }}>
                Vlerëso shitësin
              </div>

              {myReview ? (
                <div style={{ background: '#EAF3DE', border: '0.5px solid #97C459', borderRadius: 10, padding: '10px 13px', fontSize: 12 }}>
                  <div style={{ color: '#3B6D11', fontWeight: 700, marginBottom: 4 }}>
                    <><span aria-hidden='true'>{'⭐'.repeat(myReview.rating)}</span> Vlerësimi yt u ruajt</>
                    {myReview.purchase_verified && (
                      <span style={{ marginLeft: 6, background: '#0E7A35', color: '#fff', fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 6 }}><span aria-hidden="true">✅</span> Blerje e verifikuar</span>
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
                    style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 9, padding: '8px 11px', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'none', minHeight: 60, color: '#111', background: '#fff', boxSizing: 'border-box' }}
                  />
                  {reviewMsg && (
                    <div style={{ fontSize: 11, marginTop: 6, color: reviewMsg.startsWith('ok:') ? '#3B6D11' : '#E63312', fontWeight: 600 }}>
                      {reviewMsg.split(/:(.+)/)[1]}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={submitReview}
                    disabled={reviewStars === 0 || reviewSaving}
                    style={{ marginTop: 8, width: '100%', background: reviewStars ? '#E63312' : '#ccc', color: '#fff', border: 'none', borderRadius: 9, padding: '10px', fontSize: 12, fontWeight: 700, cursor: reviewStars ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                    {reviewSaving ? <><span aria-hidden='true'>⏳</span> Duke ruajtur...</> : <><span aria-hidden='true'>⭐</span> Dërgo vlerësimin</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Similar listings */}
          {similar.length > 0 && (
            <div style={{ padding: '0 13px 24px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#111', marginBottom: 12 }}>
                Shpallje të ngjashme
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {similar.map(s => {
                  const img = Array.isArray(s.images) && s.images.length ? s.images[0] : null
                  const priceStr = s.currency === 'EUR'
                    ? `€${nf(s.price)}`
                    : `${nf(s.price)} L`
                  return (
                    <div
                      key={s.id}
                      role="link" tabIndex={0}
                      onClick={() => { window.location.href = `/listing/${s.id}` }}
                      onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/listing/${s.id}` }}
                      style={{ borderRadius: 12, overflow: 'hidden', background: '#fff', border: '1px solid #F0F0F0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', cursor: 'pointer' }}
                    >
                      <div style={{ width: '100%', aspectRatio: '4/3', background: '#F6F6F6', overflow: 'hidden', position: 'relative' }}>
                        {img
                          ? <img src={img} alt={s.title} loading="lazy" width={400} height={300} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><i className="ti ti-photo" style={{ fontSize: 24, color: '#ccc' }} aria-hidden="true" /></div>
                        }
                        {s.is_premium && (
                          <div style={{ position: 'absolute', top: 5, left: 5, background: 'linear-gradient(90deg,#FFD700,#FFA500)', color: '#7B5000', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 5 }}>GOLD</div>
                        )}
                      </div>
                      <div style={{ padding: '7px 8px 9px' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#111', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.35, marginBottom: 4 }}>{s.title}</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#E63312' }}>{priceStr}</div>
                        {s.city && <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}><i className="ti ti-map-pin" style={{ fontSize: 10 }} aria-hidden="true" /> {s.city}</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Report link — only for non-owner visitors */}
          {!isOwner && (
            <div style={{ padding: '0 13px 20px', textAlign: 'center' }}>
              <button type="button" aria-label="Raporto shpalljen" aria-haspopup="dialog" onClick={() => setReportOpen(true)}
                style={{ background: 'none', border: 'none', color: '#ccc', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <i className="ti ti-flag" style={{ fontSize: 12 }} aria-hidden="true" />Raporto këtë shpallje
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── PRICE ALERT MODAL ── */}
      {alertOpen && (
        <>
          <div className="alert-overlay" onClick={() => { setAlertOpen(false); setAlertMsg('') }} />
          <div className="alert-panel" role="dialog" aria-modal="true" aria-label="Alarmi i Çmimit">
            <div className="alert-handle" />
            <div className="alert-title">
              <i className="ti ti-bell-ringing" style={{ color: '#E63312' }} aria-hidden="true" />
              Alarmi i Çmimit
            </div>
            <div className="alert-sub">
              Do të njoftohesh kur çmimi të bjerë poshtë kufirit që vendos.
              {priceAlert && !priceAlert.triggered && (
                <span style={{ color: '#856404', background: '#FFF8E1', border: '1px solid #FFE082', borderRadius: 7, padding: '2px 8px', marginLeft: 6, fontSize: 11 }}>
                  Aktiv: {priceAlert.target_price} ALL
                </span>
              )}
              {priceAlert?.triggered && (
                <span style={{ color: '#2e7d32', background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 7, padding: '2px 8px', marginLeft: 6, fontSize: 11 }}>
                  <><span aria-hidden="true">✅</span> U aktivizua</>
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
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
              <div role="alert" className="alert-msg" style={{ color: alertMsg.startsWith('ok:') ? '#2e7d32' : '#E63312' }}>
                {alertMsg.replace(/^(ok|err):/, '')}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── REPORT MODAL ── */}
      {reportOpen && (
        <>
          <div className="report-overlay" onClick={() => setReportOpen(false)} />
          <div className="report-panel" role="dialog" aria-modal="true" aria-label="Raporto këtë shpallje">
            <div className="report-handle" />
            {reportSent ? (
              <div className="report-success">
                <div style={{ fontSize: 40, marginBottom: 10 }} aria-hidden="true">✅</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#3B6D11' }}>Raporti u dërgua!</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Faleminderit. Ekipi ynë do ta shqyrtojë.</div>
              </div>
            ) : (
              <>
                <div className="report-title"><span aria-hidden="true">⚑</span> Raporto shpalljen</div>
                <div className="report-sub">Zgjidh arsyen e raportimit</div>
                <div role="group" aria-label="Arsyeja e raportimit" className="reason-list">
                  {REPORT_REASONS.map(r => (
                    <button key={r} type="button" aria-pressed={reportReason === r} className={`reason-btn ${reportReason === r ? 'sel' : ''}`}
                      onClick={() => setReportReason(r)}>
                      <><span aria-hidden='true'>{reportReason === r ? '●' : '○'}</span> {r}</>
                    </button>
                  ))}
                </div>
                {reportErr && <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', color: '#E63312', borderRadius: 10, padding: '9px 12px', margin: '0 0 10px', fontSize: 12, fontWeight: 600 }}>{reportErr}</div>}
                <button type="button" className="report-submit" onClick={submitReport}
                  disabled={!reportReason || reportLoading}>
                  {reportLoading ? <><span aria-hidden='true'>⏳</span> Duke dërguar...</> : 'Dërgo raportin'}
                </button>
                <button type="button" className="report-link" onClick={() => setReportOpen(false)}>Anulo</button>
              </>
            )}
          </div>
        </>
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
                type={hasShop ? 'business' : (seller.is_premium ? 'premium' : 'user')}
                verified={(seller.trust_score ?? 0) >= 60}
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
          {seller.phone && (
            <a
              href={`https://wa.me/${seller.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Përshëndetje! Jam i interesuar/e për: "${listing.title}"`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="wa-btn"
              aria-label="Kontakto me WhatsApp">
              <i className="ti ti-brand-whatsapp" aria-hidden="true" />
            </a>
          )}
          {seller.phone && (
            <a
              href={`viber://chat?number=%2B${seller.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="viber-btn"
              aria-label="Kontakto me Viber">
              <i className="ti ti-phone" aria-hidden="true" />
            </a>
          )}
        </div>
      )}

    </>
  )
}

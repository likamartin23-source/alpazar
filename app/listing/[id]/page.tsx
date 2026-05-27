'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const CATEGORY_LABELS: Record<string, string> = {
  elektronike: 'Elektronikë', makina: 'Makina', shtepi: 'Shtëpi & Mobilje',
  veshje: 'Veshje & Aksesore', sport: 'Sport & Hobi', sherbime: 'Shërbime',
  femije: 'Fëmijë', bukuri: 'Bukuri & Kujdes',
}

function fullTime(d: string) {
  return new Date(d).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })
}
function dayLabel(d: string) {
  const dt = new Date(d), now = new Date()
  if (dt.toDateString() === now.toDateString()) return 'Sot'
  const yes = new Date(); yes.setDate(now.getDate() - 1)
  if (dt.toDateString() === yes.toDateString()) return 'Dje'
  return dt.toLocaleDateString('sq-AL', { day: '2-digit', month: 'long' })
}
function pubDate(d: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ListingPage({ params }: { params: { id: string } }) {
  const [listing, setListing]         = useState<any>(null)
  const [seller, setSeller]           = useState<any>(null)
  const [sellerCount, setSellerCount] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [imgIdx, setImgIdx]           = useState(0)
  const [user, setUser]               = useState<any>(null)
  const [liked, setLiked]             = useState(false)
  const [albiTooltip, setAlbiTooltip] = useState(false)

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
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>()
  const userRef      = useRef<any>(null)
  const sellerRef    = useRef<any>(null)
  const listingRef   = useRef<any>(null)
  const autoOpenDone = useRef(false)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { sellerRef.current = seller }, [seller])
  useEffect(() => { listingRef.current = listing }, [listing])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      userRef.current = session?.user ?? null
    })
    fetchListing()
  }, [])

  useEffect(() => {
    if (!loading && listing) {
      tooltipTimer.current = setTimeout(() => setAlbiTooltip(true), 4000)
      return () => clearTimeout(tooltipTimer.current)
    }
  }, [loading, listing])

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

  async function fetchListing() {
    const { data } = await supabase.from('listings').select('*').eq('id', params.id).single()
    if (data) {
      setListing(data)
      listingRef.current = data
      supabase.rpc('increment_listing_views', { lid: data.id })
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
    setLoading(false)
  }

  async function loadChat(myId: string, otherId: string, lst: any) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true })

    setChatMsgs(data || [])
    setChatReady(true)

    if (!data || data.length === 0) {
      const fmt = (p: number, c: string) => !p ? '' : c === 'EUR' ? ` — ${p.toLocaleString('sq-AL')} €` : ` — ${p.toLocaleString('sq-AL')} L`
      setDraft(`Përshëndetje! Jam i interesuar/e për: "${lst.title}"${fmt(lst.price, lst.currency)}. A është ende në shitje?`)
    }

    supabase.from('messages').update({ read: true })
      .eq('receiver_id', myId).eq('sender_id', otherId).eq('read', false)

    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase
      .channel(`listing-chat-${[myId, otherId].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${myId}`,
      }, (payload) => {
        const m = payload.new as any
        if (m.sender_id !== otherId) return
        setChatMsgs(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m])
        supabase.from('messages').update({ read: true }).eq('id', m.id)
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
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  const memberSince = (d: string) =>
    d ? new Date(d).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' }) : ''

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

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ width: 28, height: 28, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite', margin: '0 auto 10px' }} />
    </div>
  )

  if (!listing) return (
    <div style={{ textAlign: 'center', padding: 60, fontFamily: "'Plus Jakarta Sans',system-ui" }}>
      <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
      <h2 style={{ color: '#111', marginBottom: 8 }}>Shpallja nuk u gjet</h2>
      <a href="/" style={{ color: '#E63312', fontSize: 13 }}>← Kthehu</a>
    </div>
  )

  const images  = listing.images?.length ? listing.images : []
  const isOwner = user?.id === listing.user_id
  const hasShop = seller?.is_premium && seller?.shop_name
  const initials  = (seller?.shop_name || seller?.full_name || '?').slice(0, 2).toUpperCase()
  const groups    = buildGroups(chatMsgs)
  const showChatSheet = !isOwner && (user || !user)
  const chatPanelOpen = chatOpen && showChatSheet

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:${chatPanelOpen ? '300px' : '70px'};}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .share-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:16px;color:#111;}

        /* Gallery */
        .img-wrap{width:100%;height:230px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-dots{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .img-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;}
        .img-dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:14px;}
        .like-btn{position:absolute;top:10px;right:10px;width:34px;height:34px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}

        /* Info */
        .info{padding:11px 13px 0;}
        .status-row{display:flex;align-items:center;gap:6px;margin-bottom:7px;}
        .status-chip{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;}
        .sc-active{background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A7;}
        .sc-sold{background:#F3F3F3;color:#555;border:1px solid #ccc;}
        h1{font-size:16px;font-weight:700;color:#111;margin-bottom:5px;line-height:1.35;}
        .price{font-size:21px;font-weight:800;color:#E63312;margin-bottom:9px;}
        .meta{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:9px;}
        .meta-item{display:flex;align-items:center;gap:3px;font-size:11px;color:#666;background:#f5f3eb;padding:3px 8px;border-radius:10px;}
        .meta-item i{font-size:12px;color:#999;}
        .cond-new{background:#FFF0EE;color:#E63312;font-weight:700;}
        .cond-used{background:#F0F0F0;color:#555;font-weight:700;}
        .divider{height:1px;background:#f0f0f0;margin:10px 0;}
        .sec-label{font-size:11px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
        .desc{font-size:13px;color:#555;line-height:1.7;}

        /* Seller section — free-flowing */
        .seller-section{padding:0 13px;}
        .seller-av-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;}
        .seller-av{width:44px;height:44px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;border:2.5px solid #F5C842;}
        .seller-av img{width:100%;height:100%;object-fit:cover;}
        .seller-name{font-size:14px;font-weight:700;color:#111;}
        .seller-sub{font-size:11px;color:#888;margin-top:2px;}
        .seller-chips{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:7px;}
        .schip{font-size:9.5px;font-weight:700;padding:2px 8px;border-radius:8px;}
        .sch-prem{background:#F5C842;color:#111;}
        .sch-shop{background:#10B981;color:#fff;}
        .sch-admin{background:#7C3AED;color:#fff;}
        .sch-priv{background:#EEF4FF;color:#185FA5;border:1px solid #C3DAFB;}
        .seller-stats{display:flex;gap:6px;margin-bottom:7px;flex-wrap:wrap;}
        .stat-chip{display:flex;align-items:center;gap:4px;background:#f8f6f0;border:0.5px solid #eee;border-radius:9px;padding:4px 9px;font-size:11px;color:#555;}
        .stat-chip i{font-size:11px;color:#999;}
        .seller-bio{font-size:12px;color:#666;line-height:1.65;margin-bottom:8px;}
        .view-profile-btn{display:flex;align-items:center;justify-content:center;gap:6px;background:#111;color:#F5C842;border:none;border-radius:10px;padding:9px 16px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;}
        .shop-link-row{display:flex;align-items:center;gap:9px;background:#f8f6f0;border-radius:10px;padding:8px 11px;margin-top:7px;cursor:pointer;text-decoration:none;}
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
        .login-prompt-btn{background:#E63312;color:#fff;border:none;border-radius:10px;padding:10px 22px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

        /* Bottom bar */
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-top:1px solid #eee;padding:9px 13px;display:flex;gap:8px;z-index:100;}
        .main-chat-btn{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .main-chat-btn i{font-size:16px;}

        /* Albi FAB */
        .albi-fab{position:fixed;bottom:${chatPanelOpen ? '310px' : '76px'};right:14px;z-index:210;display:flex;flex-direction:column;align-items:flex-end;gap:7px;transition:bottom .3s;}
        .albi-tooltip{background:#111;color:#fff;font-size:11px;font-weight:600;padding:7px 12px;border-radius:14px;border-bottom-right-radius:4px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.3);cursor:pointer;max-width:190px;text-align:right;}
        .albi-tooltip strong{color:#F5C842;display:block;font-size:11.5px;}
        .albi-btn{width:46px;height:46px;background:linear-gradient(135deg,#F5C842,#e0b030);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(245,200,66,.5);animation:pulse 2s infinite;}
        .albi-btn i{font-size:20px;color:#111;}
        @keyframes pulse{0%,100%{box-shadow:0 4px 14px rgba(245,200,66,.5)}50%{box-shadow:0 4px 22px rgba(245,200,66,.8),0 0 0 7px rgba(245,200,66,.12)}}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <button className="back" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" />
          </button>
          <span className="topbar-title">Shpallja</span>
          <button className="share-btn" onClick={() => navigator.share?.({ title: listing.title, url: window.location.href }).catch(() => {})}>
            <i className="ti ti-share" />
          </button>
        </div>

        {/* Gallery */}
        <div className="img-wrap">
          {images.length > 0 ? (
            <>
              <img src={images[imgIdx]} alt={listing.title} />
              {images.length > 1 && (
                <>
                  <button className="img-nav" style={{ left: 10 }} onClick={() => setImgIdx(i => Math.max(0, i - 1))}>
                    <i className="ti ti-chevron-left" />
                  </button>
                  <button className="img-nav" style={{ right: 10 }} onClick={() => setImgIdx(i => Math.min(images.length - 1, i + 1))}>
                    <i className="ti ti-chevron-right" />
                  </button>
                  <div className="img-dots">
                    {images.map((_: any, i: number) => (
                      <div key={i} className={`img-dot ${i === imgIdx ? 'on' : ''}`} onClick={() => setImgIdx(i)} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <span style={{ fontSize: 56 }}>📦</span>
          )}
          <button className="like-btn" onClick={() => setLiked(l => !l)}>
            <i className={`ti ti-heart${liked ? '-filled' : ''}`} style={{ fontSize: 17, color: liked ? '#E63312' : '#ddd' }} />
          </button>
        </div>

        <div className="info">
          {/* Status chip */}
          <div className="status-row">
            {listing.is_active
              ? <span className="status-chip sc-active">🟢 Në shitje</span>
              : <span className="status-chip sc-sold">✅ Shitur</span>}
            {listing.is_premium && (
              <span className="status-chip" style={{ background: '#FFF8E1', color: '#856404', border: '1px solid #FFE082' }}>⭐ Premium</span>
            )}
          </div>

          <h1>{listing.title}</h1>
          <div className="price">{fmt(listing.price, listing.currency)}</div>

          {/* Meta row: condition + city + date + category + views */}
          <div className="meta">
            {listing.condition === 'i_ri' && (
              <div className="meta-item cond-new">✨ I ri</div>
            )}
            {listing.condition === 'i_perdorur' && (
              <div className="meta-item cond-used">🔘 I përdorur</div>
            )}
            {listing.city && <div className="meta-item"><i className="ti ti-map-pin" />{listing.city}</div>}
            {listing.created_at && <div className="meta-item"><i className="ti ti-calendar" />{pubDate(listing.created_at)}</div>}
            {listing.category && <div className="meta-item"><i className="ti ti-tag" />{CATEGORY_LABELS[listing.category] || listing.category}</div>}
            {(listing.views_count || 0) > 0 && <div className="meta-item"><i className="ti ti-eye" />{listing.views_count}</div>}
          </div>

          {listing.description && (
            <>
              <div className="divider" />
              <div className="sec-label">Përshkrimi</div>
              <div className="desc">{listing.description}</div>
            </>
          )}

          {/* ── PROFILI I SHITËSIT — free-flowing ── */}
          {seller && (
            <>
              <div className="divider" />
              <div className="seller-section">
                <div className="sec-label">Shitësi</div>

                {/* Avatar row */}
                <div className="seller-av-row">
                  <div className="seller-av">
                    {seller.avatar_url
                      ? <img src={seller.avatar_url} alt={seller.full_name} />
                      : initials}
                  </div>
                  <div>
                    <div className="seller-name">
                      {seller.shop_name || seller.full_name || seller.username || 'Shitës'}
                    </div>
                    <div className="seller-sub">
                      {seller.city && `📍 ${seller.city}`}
                      {seller.city && seller.created_at && ' · '}
                      {seller.created_at && `Anëtar nga ${memberSince(seller.created_at)}`}
                    </div>
                  </div>
                </div>

                {/* Badges */}
                <div className="seller-chips">
                  {seller.is_premium && <span className="schip sch-prem">👑 Premium</span>}
                  {seller.shop_name  && <span className="schip sch-shop">🏪 Dyqan</span>}
                  {seller.is_admin   && <span className="schip sch-admin">🛡 Admin</span>}
                  {!isOwner && <span className="schip sch-priv">🔒 Bisedë private</span>}
                </div>

                {/* Stats */}
                <div className="seller-stats">
                  <span className="stat-chip"><i className="ti ti-package" />{sellerCount} shpallje aktive</span>
                  {seller.username && <span className="stat-chip"><i className="ti ti-at" />{seller.username}</span>}
                  {seller.gamification_points > 0 &&
                    <span className="stat-chip"><i className="ti ti-bolt" />{seller.gamification_points} pikë</span>}
                </div>

                {/* Bio */}
                {(seller.bio || seller.shop_description) && (
                  <div className="seller-bio">{seller.bio || seller.shop_description}</div>
                )}

                {/* Profile button — only for visitors with shops */}
                {!isOwner && seller.is_premium && seller.shop_name && (
                  <button className="view-profile-btn"
                    onClick={() => window.location.href = `/dyqane/${seller.id}`}>
                    <i className="ti ti-building-store" />
                    Shiko dyqanin
                  </button>
                )}

                {/* Shop link */}
                {hasShop && !isOwner && (
                  <a className="shop-link-row" href={`/dyqane/${seller.id}`}>
                    <span style={{ fontSize: 20 }}>🏪</span>
                    <div>
                      <span>{seller.shop_name}</span>
                      <small>Shfleto të gjitha produktet e dyqanit</small>
                    </div>
                    <i className="ti ti-chevron-right" style={{ fontSize: 13, color: '#aaa', marginLeft: 'auto' }} />
                  </a>
                )}
              </div>
              <div style={{ height: 11 }} />
            </>
          )}
        </div>
      </div>

      {/* ── CHAT BOTTOM SHEET ── */}
      {chatPanelOpen && seller && (
        <>
          <div className="cs-overlay" onClick={() => setChatOpen(false)} />
          <div className="cs-panel">
            <div className="cs-handle-row"><div className="cs-handle" /></div>

            {/* Header */}
            <div className="cs-header">
              <div className="cs-av">
                {seller.avatar_url
                  ? <img src={seller.avatar_url} alt={seller.full_name} />
                  : initials}
              </div>
              <span className="cs-seller-name">
                {seller.shop_name || seller.full_name || seller.username || 'Shitës'}
              </span>
              <span className="cs-priv">🔒 Private</span>
              <button className="cs-close" onClick={() => setChatOpen(false)}>
                <i className="ti ti-x" />
              </button>
            </div>

            {/* Listing reference */}
            <div className="cs-ref">
              <i className="ti ti-bookmark" />
              <span className="cs-ref-text">📌 {listing.title}</span>
              {listing.price > 0 && (
                <span className="cs-ref-price">{fmt(listing.price, listing.currency)}</span>
              )}
            </div>

            {/* Messages or login prompt */}
            {!user ? (
              <div className="login-prompt">
                <p>Hyr në llogarinë tënde për të biseduar me shitësin</p>
                <button className="login-prompt-btn"
                  onClick={() => window.location.href = '/auth/login'}>
                  🔑 Hyr / Regjistrohu
                </button>
              </div>
            ) : (
              <>
                <div className="cs-msgs">
                  {chatMsgs.length === 0 && chatReady ? (
                    <div className="empty-chat">
                      <div className="empty-chat-icon">👋</div>
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
                  <button className="cs-send-btn" onClick={sendMsg} disabled={!draft.trim() || sending}>
                    <i className={`ti ti-${sending ? 'loader-2' : 'send'}`}
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
          <button className="main-chat-btn" onClick={() => {
            if (!user) { window.location.href = '/auth/login'; return }
            setChatOpen(true)
            setTimeout(() => inputRef.current?.focus(), 350)
          }}>
            <i className="ti ti-messages" />
            {user ? '💬 Fillo bisedën' : '🔑 Hyr për të biseduar'}
          </button>
        </div>
      )}

      {/* Albi FAB */}
      <div className="albi-fab">
        {albiTooltip && (
          <div className="albi-tooltip" onClick={() => window.location.href = '/asistent'}>
            <strong>Albi 🤖 — AI Asistent</strong>
            Ke pyetje për këtë produkt?<br />Pyet Albin tani!
          </div>
        )}
        <button className="albi-btn" onClick={() => window.location.href = '/asistent'}>
          <i className="ti ti-robot" />
        </button>
      </div>
    </>
  )
}

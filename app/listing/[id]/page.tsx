'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const CATEGORY_COLORS: Record<string, string> = {
  elektronike: '#3B82F6', makina: '#EF4444', shtepi: '#10B981',
  veshje: '#8B5CF6', sport: '#F59E0B', sherbime: '#06B6D4',
  femije: '#EC4899', bukuri: '#F97316',
}
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

export default function ListingPage({ params }: { params: { id: string } }) {
  const [listing, setListing]         = useState<any>(null)
  const [seller, setSeller]           = useState<any>(null)
  const [sellerCount, setSellerCount] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [imgIdx, setImgIdx]           = useState(0)
  const [user, setUser]               = useState<any>(null)
  const [liked, setLiked]             = useState(false)
  const [albiTooltip, setAlbiTooltip] = useState(false)

  // Embedded chat
  const [chatMsgs, setChatMsgs]   = useState<any[]>([])
  const [draft, setDraft]         = useState('')
  const [sending, setSending]     = useState(false)
  const [typingVis, setTypingVis] = useState(false)
  const [chatReady, setChatReady] = useState(false)

  const chatRef      = useRef<HTMLDivElement>(null)
  const chatBottom   = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const channelRef   = useRef<any>(null)
  const typingTimer  = useRef<any>(null)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout>>()
  const userRef      = useRef<any>(null)
  const sellerRef    = useRef<any>(null)
  const listingRef   = useRef<any>(null)

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

    // Pre-fill draft if no messages yet
    if (!data || data.length === 0) {
      const fmt = (p: number, c: string) => !p ? '' : c === 'EUR' ? ` — ${p.toLocaleString('sq-AL')} €` : ` — ${p.toLocaleString('sq-AL')} L`
      setDraft(`Përshëndetje! Jam i interesuar/e për: "${lst.title}"${fmt(lst.price, lst.currency)}. A është ende në shitje?`)
    }

    // Mark as read
    supabase.from('messages').update({ read: true })
      .eq('receiver_id', myId).eq('sender_id', otherId).eq('read', false)

    // Realtime subscription
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

    // Auto-scroll to chat section
    setTimeout(() => {
      chatRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setTimeout(() => inputRef.current?.focus(), 400)
    }, 600)
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

    // Broadcast typing stop
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { userId: user.id } })
  }

  const fmt = (price: number, cur: string) =>
    !price ? 'Çmim me marrëveshje' :
    cur === 'EUR' ? `${price.toLocaleString('sq-AL')} €` : `${price.toLocaleString('sq-AL')} L`

  const memberSince = (d: string) =>
    d ? new Date(d).toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' }) : ''

  // Group messages by day
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
  const shopColor = CATEGORY_COLORS[seller?.shop_category] || '#E63312'
  const initials  = (seller?.shop_name || seller?.full_name || '?').slice(0, 2).toUpperCase()
  const groups    = buildGroups(chatMsgs)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#fff;min-height:100vh;padding-bottom:80px;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;flex:1;}
        .share-btn{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .share-btn i{font-size:16px;color:#111;}
        .img-wrap{width:100%;height:250px;background:#f9f5e0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;}
        .img-wrap img{width:100%;height:100%;object-fit:cover;}
        .img-dots{position:absolute;bottom:10px;left:50%;transform:translateX(-50%);display:flex;gap:5px;}
        .img-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.5);cursor:pointer;}
        .img-dot.on{background:#fff;}
        .img-nav{position:absolute;top:50%;transform:translateY(-50%);width:32px;height:32px;background:rgba(0,0,0,.4);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .img-nav i{color:#fff;font-size:16px;}
        .like-btn{position:absolute;top:12px;right:12px;width:36px;height:36px;background:#fff;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.15);}
        .info{padding:14px;}
        .badges{display:flex;gap:5px;margin-bottom:9px;}
        .badge{font-size:10px;padding:3px 8px;border-radius:4px;font-weight:700;}
        .b-new{background:#E63312;color:#fff;}
        .b-used{background:#111;color:#F5C842;}
        .b-prem{background:#F5C842;color:#111;}
        h1{font-size:17px;font-weight:700;color:#111;margin-bottom:7px;line-height:1.35;}
        .price{font-size:22px;font-weight:800;color:#E63312;margin-bottom:12px;}
        .meta{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px;}
        .meta-item{display:flex;align-items:center;gap:4px;font-size:11.5px;color:#666;}
        .meta-item i{font-size:13px;color:#999;}
        .divider{height:1px;background:#f0f0f0;margin:13px 0;}
        .desc-title{font-size:12px;font-weight:700;color:#111;margin-bottom:7px;text-transform:uppercase;letter-spacing:.4px;}
        .desc{font-size:13px;color:#555;line-height:1.75;}

        /* ── SELLER BLOCK ── */
        .seller-block{margin:14px 0;border:1.5px solid #e8e0cc;border-radius:14px;overflow:hidden;}
        .seller-header{background:linear-gradient(135deg,#111,#1c1c1c);padding:14px;display:flex;align-items:center;gap:12px;}
        .seller-av{width:54px;height:54px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;border:3px solid #F5C842;}
        .seller-av img{width:100%;height:100%;object-fit:cover;}
        .seller-hinfo{flex:1;min-width:0;}
        .seller-hname{font-size:15px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .seller-hsub{font-size:11px;color:#888;margin-top:3px;}
        .seller-badges{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap;}
        .sbadge{font-size:9px;font-weight:700;padding:2px 7px;border-radius:8px;}
        .sb-prem{background:#F5C842;color:#111;}
        .sb-shop{background:#10B981;color:#fff;}
        .sb-admin{background:#7C3AED;color:#fff;}
        .seller-body{padding:12px;background:#FFFBEA;}
        .seller-stats{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;}
        .stat-chip{display:flex;align-items:center;gap:5px;background:#fff;border:0.5px solid #ddd;border-radius:10px;padding:5px 10px;font-size:11px;color:#555;}
        .stat-chip i{font-size:12px;color:#888;}
        .seller-bio{font-size:12px;color:#555;line-height:1.65;margin-bottom:10px;padding:9px 11px;background:#fff;border-radius:10px;border:0.5px solid #eee;}
        .seller-actions{display:flex;gap:8px;}
        .view-profile-btn{flex:1;background:#111;color:#F5C842;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;font-family:inherit;}
        .call-btn{width:42px;height:42px;background:#EAF7ED;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .call-btn i{font-size:18px;color:#2E7D32;}
        .shop-link-row{margin-top:9px;background:#fff;border:0.5px solid #10B98144;border-radius:10px;padding:9px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;text-decoration:none;}
        .shop-link-row span{font-size:12px;font-weight:700;color:#111;}
        .shop-link-row small{font-size:10px;color:#aaa;display:block;margin-top:1px;}

        /* ── INLINE CHAT (nën profil, pa header shtesë) ── */
        .chat-inline{border-top:2px solid #E63312;}
        .sb-chat{background:#E63312;color:#fff;}
        .chat-ref{background:#FFF0EE;border-bottom:0.5px solid #fdd;padding:8px 14px;display:flex;align-items:center;gap:8px;}
        .chat-ref i{font-size:13px;color:#E63312;flex-shrink:0;}
        .chat-ref-text{font-size:11px;color:#333;font-weight:600;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .chat-ref-price{font-size:11px;font-weight:700;color:#E63312;white-space:nowrap;}
        .chat-msgs{background:#f5f0e0;padding:10px 12px;min-height:180px;max-height:340px;overflow-y:auto;display:flex;flex-direction:column;gap:2px;}
        .chat-msgs::-webkit-scrollbar{width:3px;}
        .chat-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}
        .day-sep{text-align:center;margin:8px 0 4px;pointer-events:none;}
        .day-sep span{background:rgba(0,0,0,.1);color:#666;font-size:10px;font-weight:600;padding:3px 10px;border-radius:10px;}
        .msg-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:1px;}
        .msg-row.mine{flex-direction:row-reverse;}
        .bubble-w{max-width:75%;}
        .mine .bubble-w{align-items:flex-end;display:flex;flex-direction:column;}
        .bubble{padding:8px 12px;font-size:13px;line-height:1.55;word-break:break-word;border-radius:14px;}
        .mine .bubble{background:linear-gradient(135deg,#F5C842,#e8b820);color:#111;border-bottom-right-radius:4px;box-shadow:0 2px 6px rgba(245,200,66,.3);}
        .theirs .bubble{background:#fff;color:#111;border-bottom-left-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,.07);}
        .btime{font-size:9px;color:rgba(0,0,0,.3);margin-top:3px;text-align:right;}
        .theirs .btime{text-align:left;color:#bbb;}
        .empty-chat{text-align:center;padding:24px 16px;color:#bbb;}
        .empty-chat-icon{font-size:36px;margin-bottom:8px;}
        .empty-chat-txt{font-size:12px;line-height:1.6;}
        .typing-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:4px;}
        .typing-bbl{background:#fff;border-radius:14px 14px 14px 4px;padding:9px 13px;box-shadow:0 1px 4px rgba(0,0,0,.07);display:flex;gap:4px;}
        .tdot{width:6px;height:6px;border-radius:50%;background:#bbb;animation:tdot .9s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        .chat-input-bar{background:#fff;border-top:1px solid #eee;padding:10px 12px;display:flex;gap:8px;align-items:flex-end;}
        .chat-input-wrap{flex:1;background:#f5f5f0;border-radius:20px;padding:0 12px;display:flex;align-items:flex-end;border:1.5px solid transparent;transition:border-color .15s;}
        .chat-input-wrap:focus-within{border-color:#E63312;background:#fff;}
        .chat-input-wrap textarea{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;resize:none;min-height:20px;max-height:80px;line-height:1.5;padding:9px 0;font-family:inherit;}
        .chat-input-wrap textarea::placeholder{color:#bbb;}
        .chat-send-btn{width:44px;height:44px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px rgba(230,51,18,.3);transition:transform .1s,opacity .15s;}
        .chat-send-btn:active{transform:scale(.9);}
        .chat-send-btn:disabled{opacity:.4;box-shadow:none;}
        .chat-send-btn i{color:#fff;font-size:19px;}
        .login-prompt{background:#FFF0EE;padding:20px;text-align:center;}
        .login-prompt p{font-size:13px;color:#555;margin-bottom:12px;font-weight:600;}
        .login-prompt-btn{background:#E63312;color:#fff;border:none;border-radius:10px;padding:11px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

        /* Bottom bar */
        .bottom-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;background:#fff;border-top:1px solid #eee;padding:10px 14px;display:flex;gap:8px;z-index:100;}
        .main-chat-btn{flex:1;background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 4px 12px rgba(230,51,18,.3);}
        .main-chat-btn i{font-size:17px;}

        /* Albi FAB */
        .albi-fab{position:fixed;bottom:82px;right:14px;z-index:200;display:flex;flex-direction:column;align-items:flex-end;gap:8px;}
        .albi-tooltip{background:#111;color:#fff;font-size:11px;font-weight:600;padding:8px 13px;border-radius:14px;border-bottom-right-radius:4px;white-space:nowrap;box-shadow:0 4px 16px rgba(0,0,0,.3);cursor:pointer;max-width:190px;text-align:right;}
        .albi-tooltip strong{color:#F5C842;display:block;font-size:12px;}
        .albi-btn{width:50px;height:50px;background:linear-gradient(135deg,#F5C842,#e0b030);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(245,200,66,.5);animation:pulse 2s infinite;}
        .albi-btn i{font-size:22px;color:#111;}
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
            <span style={{ fontSize: 60 }}>📦</span>
          )}
          <button className="like-btn" onClick={() => setLiked(l => !l)}>
            <i className={`ti ti-heart${liked ? '-filled' : ''}`} style={{ fontSize: 18, color: liked ? '#E63312' : '#ddd' }} />
          </button>
        </div>

        <div className="info">
          <div className="badges">
            {listing.condition === 'i_ri'       && <span className="badge b-new">I ri</span>}
            {listing.condition === 'i_perdorur' && <span className="badge b-used">I përdorur</span>}
            {listing.is_premium                 && <span className="badge b-prem">⭐ Premium</span>}
          </div>

          <h1>{listing.title}</h1>
          <div className="price">{fmt(listing.price, listing.currency)}</div>

          <div className="meta">
            {listing.city && <div className="meta-item"><i className="ti ti-map-pin" />{listing.city}</div>}
            {(listing.views_count || 0) > 0 && <div className="meta-item"><i className="ti ti-eye" />{listing.views_count} shikime</div>}
            {listing.category && <div className="meta-item"><i className="ti ti-tag" />{CATEGORY_LABELS[listing.category] || listing.category}</div>}
          </div>

          {listing.description && (
            <>
              <div className="divider" />
              <div className="desc-title">Përshkrimi</div>
              <div className="desc">{listing.description}</div>
            </>
          )}

          {/* ── PROFILI I SHPALLESIT + BISEDA ── */}
          {seller && (
            <>
              <div className="divider" />
              <div className="seller-block" ref={!isOwner ? chatRef : undefined}>
                {/* Header: info shitësi + nëse jo pronar, tregon "bisedë private" */}
                <div className="seller-header">
                  <div className="seller-av">
                    {seller.avatar_url
                      ? <img src={seller.avatar_url} alt={seller.full_name} />
                      : (seller.shop_name || seller.full_name || '?').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="seller-hinfo">
                    <div className="seller-hname">
                      {seller.shop_name || seller.full_name || seller.username || 'Shitës'}
                    </div>
                    <div className="seller-hsub">
                      {seller.city && `📍 ${seller.city}`}
                      {seller.city && seller.created_at && ' · '}
                      {seller.created_at && `Anëtar nga ${memberSince(seller.created_at)}`}
                    </div>
                    <div className="seller-badges">
                      {seller.is_premium && <span className="sbadge sb-prem">👑 Premium</span>}
                      {seller.shop_name  && <span className="sbadge sb-shop">🏪 Dyqan</span>}
                      {seller.is_admin   && <span className="sbadge sb-admin">🛡 Admin</span>}
                      {!isOwner && <span className="sbadge sb-chat">🔒 Bisedë private</span>}
                    </div>
                  </div>
                </div>

                {/* Stats + bio */}
                <div className="seller-body">
                  <div className="seller-stats">
                    <span className="stat-chip"><i className="ti ti-package" />{sellerCount} shpallje aktive</span>
                    {seller.username && <span className="stat-chip"><i className="ti ti-at" />{seller.username}</span>}
                    {seller.phone    && <span className="stat-chip"><i className="ti ti-phone" />Ka telefon</span>}
                    {seller.gamification_points > 0 &&
                      <span className="stat-chip"><i className="ti ti-bolt" />{seller.gamification_points} pikë</span>}
                  </div>
                  {(seller.bio || seller.shop_description) && (
                    <div className="seller-bio">{seller.bio || seller.shop_description}</div>
                  )}
                  {!isOwner && (
                    <div className="seller-actions">
                      <button className="view-profile-btn"
                        onClick={() => window.location.href = seller.shop_name ? `/dyqane/${seller.id}` : `/profile`}>
                        <i className="ti ti-user" />
                        {seller.shop_name ? 'Shiko dyqanin' : 'Shiko profilin'}
                      </button>
                      {seller.phone && (
                        <button className="call-btn" onClick={() => window.open(`tel:${seller.phone}`)}>
                          <i className="ti ti-phone" />
                        </button>
                      )}
                    </div>
                  )}
                  {hasShop && !isOwner && (
                    <a className="shop-link-row" href={`/dyqane/${seller.id}`}>
                      <span style={{ fontSize: 22 }}>🏪</span>
                      <div>
                        <span>{seller.shop_name}</span>
                        <small>Shfleto të gjitha produktet e dyqanit</small>
                      </div>
                      <i className="ti ti-chevron-right" style={{ fontSize: 14, color: '#aaa', marginLeft: 'auto' }} />
                    </a>
                  )}
                </div>

                {/* ── BISEDA E INTEGRUAR (direkt nën profil, pa seksion të ri) ── */}
                {!isOwner && (
                  <div className="chat-inline">
                    {/* Referenca e shpalljes */}
                    <div className="chat-ref">
                      <i className="ti ti-bookmark" />
                      <span className="chat-ref-text">📌 {listing.title}</span>
                      {listing.price > 0 && (
                        <span className="chat-ref-price">{fmt(listing.price, listing.currency)}</span>
                      )}
                    </div>

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
                        <div className="chat-msgs">
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

                        <div className="chat-input-bar">
                          <div className="chat-input-wrap">
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
                          <button className="chat-send-btn" onClick={sendMsg} disabled={!draft.trim() || sending}>
                            <i className={`ti ti-${sending ? 'loader-2' : 'send'}`}
                              style={sending ? { animation: 'spin .7s linear infinite' } : {}} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom bar — shko te biseda e plotë */}
      {!isOwner && user && seller && (
        <div className="bottom-bar">
          <button className="main-chat-btn"
            onClick={() => window.location.href = `/messages?with=${seller.id}`}>
            <i className="ti ti-messages" />
            Hap bisedën e plotë
          </button>
          {seller?.phone && (
            <button
              onClick={() => window.open(`tel:${seller.phone}`)}
              style={{ width: 50, height: 50, background: '#EAF7ED', border: 'none', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <i className="ti ti-phone" style={{ fontSize: 19, color: '#2E7D32' }} />
            </button>
          )}
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

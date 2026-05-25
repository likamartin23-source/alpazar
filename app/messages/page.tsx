'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [threads, setThreads] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { window.location.href = '/auth/login'; return }
      setUser(session.user)
      fetchThreads(session.user.id).then(() => {
        // Handle ?with= param to open a conversation directly
        const params = new URLSearchParams(window.location.search)
        const withId = params.get('with')
        if (withId) openThreadById(withId, session.user.id)
      })
    })
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Subscribe to real-time messages when a thread is open
  useEffect(() => {
    if (!selected || !user) return
    // Unsubscribe from previous channel
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`msgs-${user.id}-${selected.otherId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const m = payload.new as any
        if (m.sender_id === selected.otherId) {
          setMessages(prev => [...prev, m])
          // Mark as read immediately
          supabase.from('messages').update({ read: true }).eq('id', m.id)
        }
      })
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [selected, user])

  async function fetchThreads(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('*,sender:sender_id(id,full_name,username,avatar_url),receiver:receiver_id(id,full_name,username,avatar_url)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (data) {
      const threadMap = new Map<string, any>()
      for (const m of data) {
        const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id
        const other = m.sender_id === uid ? m.receiver : m.sender
        if (!threadMap.has(otherId)) {
          threadMap.set(otherId, { otherId, other, lastMsg: m, unread: 0 })
        }
        if (!m.read && m.receiver_id === uid) threadMap.get(otherId)!.unread++
      }
      setThreads(Array.from(threadMap.values()))
    }
    setLoading(false)
  }

  async function openThreadById(otherId: string, uid: string) {
    const { data: other } = await supabase
      .from('profiles')
      .select('id,full_name,username,avatar_url')
      .eq('id', otherId)
      .single()
    if (other) openThread({ otherId, other, lastMsg: null, unread: 0 }, uid)
  }

  async function openThread(thread: any, uid?: string) {
    const myId = uid || user?.id
    setSelected(thread)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${thread.otherId}),and(sender_id.eq.${thread.otherId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    // Mark all as read
    await supabase.from('messages').update({ read: true })
      .eq('receiver_id', myId).eq('sender_id', thread.otherId).eq('read', false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  async function send() {
    const text = newMsg.trim()
    if (!text || !selected || sending) return
    setSending(true)
    setNewMsg('')
    const optimistic = {
      id: `tmp-${Date.now()}`, sender_id: user.id, receiver_id: selected.otherId,
      content: text, created_at: new Date().toISOString(), read: false,
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selected.otherId,
      content: text,
    }).select().single()

    if (data) {
      setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
    } else if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id))
      setNewMsg(text)
    }
    setSending(false)
  }

  function back() {
    setSelected(null)
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    if (user) fetchThreads(user.id)
  }

  const displayName = (p: any) => p?.full_name || p?.username || 'Përdorues'
  const initials = (p: any) => (p?.full_name || p?.username || '?').slice(0, 2).toUpperCase()

  const timeStr = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    if (diff < 60000) return 'Tani'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    const dt = new Date(d)
    return `${dt.getDate()}/${dt.getMonth()+1}`
  }

  const filteredThreads = threads.filter(t =>
    !search.trim() ||
    displayName(t.other).toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;overflow:hidden;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;height:100dvh;display:flex;flex-direction:column;overflow:hidden;}

        /* Topbar */
        .topbar{background:linear-gradient(180deg,#F5C842,#f0bc30);padding:10px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.08);}
        .back-btn{width:34px;height:34px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .back-btn i{font-size:18px;color:#111;}
        .topbar-info{flex:1;min-width:0;}
        .topbar-name{font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .topbar-status{font-size:10px;color:#555;display:flex;align-items:center;gap:4px;margin-top:1px;}
        .online-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;}

        /* Thread list */
        .search-bar{padding:8px 12px;background:#F5C842;border-bottom:1px solid rgba(0,0,0,.06);}
        .search-inner{background:#fff;border-radius:10px;display:flex;align-items:center;padding:0 12px;gap:8px;border:1px solid rgba(0,0,0,.06);}
        .search-inner i{font-size:14px;color:#bbb;}
        .search-inner input{border:none;background:transparent;font-size:12px;color:#111;outline:none;flex:1;padding:8px 0;font-family:inherit;}
        .threads-scroll{flex:1;overflow-y:auto;}
        .thread{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:0.5px solid #f0ece0;transition:background .1s;}
        .thread:hover,.thread:active{background:#fff8e0;}
        .t-av{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#F5C842,#e0b030);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;position:relative;}
        .t-av img{width:100%;height:100%;object-fit:cover;}
        .t-online{position:absolute;bottom:2px;right:2px;width:10px;height:10px;background:#22c55e;border-radius:50%;border:2px solid #FFFBEA;}
        .t-info{flex:1;min-width:0;}
        .t-name{font-size:13px;font-weight:700;color:#111;margin-bottom:2px;}
        .t-preview{font-size:11px;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .t-preview.unread{color:#555;font-weight:600;}
        .t-right{text-align:right;flex-shrink:0;}
        .t-time{font-size:10px;color:#bbb;}
        .t-badge{background:#E63312;color:#fff;border-radius:10px;min-width:18px;height:18px;padding:0 5px;font-size:9px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-top:4px;}
        .new-msg-btn{margin:12px;background:#111;color:#F5C842;border:none;border-radius:12px;padding:13px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;}
        .new-msg-btn i{font-size:16px;}

        /* Empty states */
        .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 24px;text-align:center;}
        .empty-icon{font-size:56px;margin-bottom:16px;}
        .empty h3{font-size:15px;font-weight:700;color:#555;margin-bottom:8px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.7;margin-bottom:20px;}
        .empty-cta{background:#111;color:#F5C842;border:none;border-radius:10px;padding:12px 24px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

        /* Chat view */
        .chat-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .msgs-area{flex:1;overflow-y:auto;padding:12px 12px 6px;display:flex;flex-direction:column;gap:6px;background:#FFFBEA;}
        .day-sep{text-align:center;margin:8px 0;}
        .day-sep span{background:#e8e0c8;color:#999;font-size:9px;padding:3px 10px;border-radius:10px;font-weight:600;}
        .msg-group{display:flex;flex-direction:column;gap:2px;}
        .msg-row{display:flex;align-items:flex-end;gap:6px;}
        .msg-row.mine{flex-direction:row-reverse;}
        .msg-av{width:24px;height:24px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#111;flex-shrink:0;overflow:hidden;}
        .msg-av img{width:100%;height:100%;object-fit:cover;}
        .msg-av.spacer{visibility:hidden;}
        .bubble{max-width:72%;padding:9px 13px;border-radius:16px;font-size:13px;line-height:1.5;word-break:break-word;position:relative;}
        .bubble.mine{background:linear-gradient(135deg,#F5C842,#e8b820);color:#111;border-bottom-right-radius:4px;}
        .bubble.theirs{background:#fff;color:#111;border:0.5px solid #eee;border-bottom-left-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,.04);}
        .bubble.sending{opacity:.6;}
        .btime{font-size:9px;color:rgba(0,0,0,.35);margin-top:4px;text-align:right;display:flex;align-items:center;justify-content:flex-end;gap:3px;}
        .bubble.theirs .btime{color:#bbb;justify-content:flex-start;}
        .btime i{font-size:11px;}

        /* Input bar */
        .input-bar{background:#fff;border-top:1px solid #eee;padding:10px 12px;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;}
        .input-wrap{flex:1;background:#f5f5f0;border-radius:22px;display:flex;align-items:center;padding:0 14px;gap:8px;border:1.5px solid transparent;transition:border-color .15s;}
        .input-wrap:focus-within{border-color:#F5C842;background:#fff;}
        .input-wrap input{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;padding:11px 0;font-family:inherit;}
        .input-wrap input::placeholder{color:#bbb;}
        .send-btn{width:44px;height:44px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 3px 10px rgba(230,51,18,.3);transition:transform .1s,opacity .15s;}
        .send-btn:active{transform:scale(.92);}
        .send-btn:disabled{opacity:.5;}
        .send-btn i{color:#fff;font-size:18px;}

        .loading-center{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#888;font-size:13px;}
        .spinner{width:26px;height:26px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      <div className="wrap">
        {selected ? (
          /* ─── CHAT VIEW ─────────────────────────────── */
          <>
            <div className="topbar">
              <button className="back-btn" onClick={back}>
                <i className="ti ti-arrow-left" />
              </button>
              <div className="t-av" style={{ width: 36, height: 36, fontSize: 13 }}>
                {selected.other?.avatar_url
                  ? <img src={selected.other.avatar_url} alt="" />
                  : initials(selected.other)
                }
              </div>
              <div className="topbar-info">
                <div className="topbar-name">{displayName(selected.other)}</div>
                <div className="topbar-status">
                  <span className="online-dot" />
                  Aktiv
                </div>
              </div>
              <button
                style={{ background: 'rgba(0,0,0,.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#111', fontFamily: 'inherit' }}
                onClick={() => window.location.href = `/dyqane/${selected.otherId}`}
              >
                🏪 Dyqan
              </button>
            </div>

            <div className="chat-wrap">
              <div className="msgs-area">
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: '#bbb', fontSize: 12 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>👋</div>
                    Fillo bisedën me {displayName(selected.other)}
                  </div>
                )}
                {messages.map((m, i) => {
                  const mine = m.sender_id === user?.id
                  const prev = messages[i - 1]
                  const showAv = !mine && (!prev || prev.sender_id !== m.sender_id)
                  return (
                    <div key={m.id} className="msg-row" style={{ flexDirection: mine ? 'row-reverse' : 'row' }}>
                      {!mine && (
                        <div className={`msg-av ${showAv ? '' : 'spacer'}`}>
                          {showAv && (selected.other?.avatar_url
                            ? <img src={selected.other.avatar_url} alt="" />
                            : initials(selected.other)
                          )}
                        </div>
                      )}
                      <div className={`bubble ${mine ? 'mine' : 'theirs'} ${m.id?.startsWith?.('tmp') ? 'sending' : ''}`}>
                        {m.content}
                        <div className="btime">
                          {timeStr(m.created_at)}
                          {mine && <i className={`ti ti-check${m.read ? 's' : ''}`} style={{ color: m.read ? '#3B82F6' : 'inherit' }} />}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <div className="input-bar">
                <div className="input-wrap">
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={`Shkruaj mesazh...`}
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  />
                </div>
                <button className="send-btn" onClick={send} disabled={!newMsg.trim() || sending}>
                  <i className="ti ti-send" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ─── THREAD LIST ───────────────────────────── */
          <>
            <div className="topbar">
              <button className="back-btn" onClick={() => window.location.href = '/'}>
                <i className="ti ti-arrow-left" />
              </button>
              <div className="topbar-info">
                <div className="topbar-name">
                  💬 Mesazhet
                  {totalUnread > 0 && (
                    <span style={{ background: '#E63312', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 10, fontWeight: 700, marginLeft: 8 }}>
                      {totalUnread}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="search-bar">
              <div className="search-inner">
                <i className="ti ti-search" />
                <input
                  placeholder="Kërko bisedë..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-center">
                <span className="spinner" />
                Duke ngarkuar...
              </div>
            ) : filteredThreads.length === 0 && !search ? (
              <div className="empty">
                <div className="empty-icon">💬</div>
                <h3>Nuk ke mesazhe akoma</h3>
                <p>Kur kontaktosh shitës apo blerës,<br />bisedat shfaqen këtu.</p>
                <button className="empty-cta" onClick={() => window.location.href = '/'}>
                  Shfleto shpalljet →
                </button>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🔍</div>
                <h3>Nuk u gjet asgjë</h3>
                <p>Asnjë bisedë me "{search}"</p>
              </div>
            ) : (
              <div className="threads-scroll">
                {filteredThreads.map(t => (
                  <div key={t.otherId} className="thread" onClick={() => openThread(t)}>
                    <div className="t-av">
                      {t.other?.avatar_url ? <img src={t.other.avatar_url} alt="" /> : initials(t.other)}
                      <span className="t-online" />
                    </div>
                    <div className="t-info">
                      <div className="t-name">{displayName(t.other)}</div>
                      <div className={`t-preview ${t.unread > 0 ? 'unread' : ''}`}>
                        {t.lastMsg?.content?.slice(0, 50) || 'Fillo bisedën...'}
                      </div>
                    </div>
                    <div className="t-right">
                      <div className="t-time">{t.lastMsg ? timeStr(t.lastMsg.created_at) : ''}</div>
                      {t.unread > 0 && <div className="t-badge">{t.unread}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [threads, setThreads] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { window.location.href = '/auth/login'; return }
      setUser(data.user)
      fetchThreads(data.user.id)
    })
  }, [])

  async function fetchThreads(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('*,sender:sender_id(id,full_name,username,avatar_url),receiver:receiver_id(id,full_name,username,avatar_url),listing:listing_id(id,title,images)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .order('created_at', { ascending: false })

    if (data) {
      // Group by conversation partner
      const threadMap = new Map<string, any>()
      for (const m of data) {
        const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id
        const other = m.sender_id === uid ? m.receiver : m.sender
        if (!threadMap.has(otherId)) {
          threadMap.set(otherId, { otherId, other, lastMsg: m, unread: 0 })
        }
        if (!m.read && m.receiver_id === uid) threadMap.get(otherId).unread++
      }
      setThreads(Array.from(threadMap.values()))
    }
    setLoading(false)
  }

  async function openThread(thread: any) {
    setSelected(thread)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${thread.otherId}),and(sender_id.eq.${thread.otherId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    // Mark as read
    await supabase.from('messages').update({ read: true }).eq('receiver_id', user.id).eq('sender_id', thread.otherId)
  }

  async function send() {
    if (!newMsg.trim() || !selected) return
    setSending(true)
    const { data } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: selected.otherId,
      content: newMsg.trim(),
    }).select().single()
    if (data) setMessages(ms => [...ms, data])
    setNewMsg('')
    setSending(false)
  }

  const displayName = (p: any) => p?.full_name || p?.username || 'Përdorues'
  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    if (diff < 60000) return 'Tani'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
    return new Date(d).toLocaleDateString('sq-AL')
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FFFBEA;}
        .wrap{max-width:480px;margin:0 auto;background:#FFFBEA;min-height:100vh;}
        .topbar{background:#F5C842;padding:10px 14px;display:flex;align-items:center;gap:10px;position:sticky;top:0;z-index:50;}
        .back{width:32px;height:32px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;}
        .back i{font-size:18px;color:#111;}
        .topbar-title{font-size:15px;font-weight:700;color:#111;}
        .chat-view{display:flex;flex-direction:column;height:calc(100vh - 48px);}
        .chat-hdr{background:#fff;padding:12px 14px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:10px;}
        .chat-name{font-size:14px;font-weight:700;color:#111;}
        .msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#FFFBEA;}
        .bubble{max-width:75%;padding:9px 13px;border-radius:12px;font-size:13px;line-height:1.5;}
        .mine{background:#F5C842;color:#111;align-self:flex-end;border-bottom-right-radius:4px;}
        .theirs{background:#fff;color:#111;align-self:flex-start;border:0.5px solid #eee;border-bottom-left-radius:4px;}
        .bubble-time{font-size:9px;color:#aaa;margin-top:3px;text-align:right;}
        .theirs .bubble-time{text-align:left;}
        .msg-bar{background:#fff;border-top:1px solid #eee;padding:10px 12px;display:flex;gap:8px;align-items:center;}
        .msg-inp{flex:1;border:1.5px solid #ddd;border-radius:20px;padding:9px 14px;font-size:13px;font-family:inherit;outline:none;}
        .msg-inp:focus{border-color:#F5C842;}
        .msg-send{width:40px;height:40px;background:#E63312;border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .msg-send i{color:#fff;font-size:18px;}
        .thread-list{padding:8px 0;}
        .thread{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:0.5px solid #f0f0f0;transition:background .1s;}
        .thread:hover{background:#fff;}
        .t-avatar{width:46px;height:46px;border-radius:50%;background:#F5C842;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .t-info{flex:1;min-width:0;}
        .t-name{font-size:13px;font-weight:700;color:#111;}
        .t-preview{font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;}
        .t-right{text-align:right;flex-shrink:0;}
        .t-time{font-size:10px;color:#aaa;}
        .unread-badge{background:#E63312;color:#fff;border-radius:10px;padding:1px 6px;font-size:9px;font-weight:700;margin-top:3px;display:inline-block;}
        .empty{text-align:center;padding:50px 20px;}
        .empty i{font-size:50px;color:#e0b030;display:block;margin-bottom:12px;}
        .empty h3{font-size:14px;font-weight:700;color:#555;margin-bottom:6px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.7;}
      `}</style>

      <div className="wrap">
        {selected ? (
          <>
            <div className="topbar">
              <button className="back" onClick={() => setSelected(null)}>
                <i className="ti ti-arrow-left" />
              </button>
              <span className="topbar-title">{displayName(selected.other)}</span>
            </div>
            <div className="chat-view">
              <div className="msgs">
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_id === user?.id ? 'flex-end' : 'flex-start' }}>
                    <div className={`bubble ${m.sender_id === user?.id ? 'mine' : 'theirs'}`}>
                      {m.content}
                      <div className="bubble-time">{timeAgo(m.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="msg-bar">
                <input
                  className="msg-inp"
                  placeholder="Shkruaj mesazhin..."
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                />
                <button className="msg-send" onClick={send} disabled={sending}>
                  <i className="ti ti-send" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="topbar">
              <button className="back" onClick={() => window.location.href = '/'}>
                <i className="ti ti-arrow-left" />
              </button>
              <span className="topbar-title">💬 Mesazhet</span>
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Duke ngarkuar...</div>
            ) : threads.length === 0 ? (
              <div className="empty">
                <i className="ti ti-messages" />
                <h3>Nuk ke mesazhe akoma</h3>
                <p>Kur kontaktosh shitës<br />ose merr mesazhe, ato shfaqen këtu</p>
              </div>
            ) : (
              <div className="thread-list">
                {threads.map(t => (
                  <div key={t.otherId} className="thread" onClick={() => openThread(t)}>
                    <div className="t-avatar">
                      {t.other?.avatar_url ? <img src={t.other.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} alt="" /> : '👤'}
                    </div>
                    <div className="t-info">
                      <div className="t-name">{displayName(t.other)}</div>
                      <div className="t-preview">{t.lastMsg.content}</div>
                    </div>
                    <div className="t-right">
                      <div className="t-time">{timeAgo(t.lastMsg.created_at)}</div>
                      {t.unread > 0 && <div className="unread-badge">{t.unread}</div>}
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

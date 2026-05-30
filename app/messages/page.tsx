'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'

/* ─── helpers ─────────────────────────────────── */
const displayName = (p: any) => p?.full_name || p?.username || 'Përdorues'
const initials    = (p: any) => (p?.full_name || p?.username || '?').slice(0, 2).toUpperCase()

function timeStr(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000)    return 'Tani'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`
  const dt = new Date(d)
  return `${dt.getDate()}/${dt.getMonth()+1}`
}

function fullTime(d: string) {
  return new Date(d).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })
}

function dayLabel(d: string) {
  const dt  = new Date(d)
  const now = new Date()
  if (dt.toDateString() === now.toDateString()) return 'Sot'
  const yes = new Date(); yes.setDate(now.getDate()-1)
  if (dt.toDateString() === yes.toDateString()) return 'Dje'
  return dt.toLocaleDateString('sq-AL', { day: '2-digit', month: 'long' })
}

const EMOJI_LIST = ['❤️','👍','😂','😮','😢','🙏','🔥','👋']

/* ─── Avatar component ─────────────────────────── */
function Avatar({ profile, size = 46, online = false }: { profile: any; size?: number; online?: boolean }) {
  const s = { width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
    background: 'linear-gradient(135deg,#F5C842,#e0b030)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: size*0.35, fontWeight: 700, color: '#111', position: 'relative' as const }
  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <div style={s}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials(profile)}
      </div>
      {online && <span style={{
        position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%',
        background:'#22c55e', border:'2px solid #FFFBEA',
      }} />}
    </div>
  )
}

/* ─── Main component ────────────────────────────── */
export default function MessagesPage() {
  const { user: ctxUser } = useAlpazar()
  const [user,     setUser]     = useState<any>(null)
  const [threads,  setThreads]  = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [draft,    setDraft]    = useState('')
  const [sending,  setSending]  = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [typingVisible, setTypingVisible] = useState(false)
  const [onlineIds, setOnlineIds]  = useState<Set<string>>(new Set())
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [reactionMsg, setReactionMsg] = useState<string|null>(null)
  const [msgTimestamps, setMsgTimestamps] = useState<Set<string>>(new Set())

  const bottomRef    = useRef<HTMLDivElement>(null)
  const inputRef     = useRef<HTMLTextAreaElement>(null)
  const msgsRef      = useRef<HTMLDivElement>(null)
  const channelRef   = useRef<any>(null)
  const typingTimer  = useRef<any>(null)
  const typingBcast  = useRef<any>(null)
  const userRef      = useRef<any>(null)
  const selectedRef  = useRef<any>(null)
  const inboxRef     = useRef<any>(null)
  const pollRef      = useRef<any>(null)

  useEffect(() => { userRef.current = user },    [user])
  useEffect(() => { selectedRef.current = selected }, [selected])

  /* ── Init ─────────────────────────────── */
  useEffect(() => {
    if (ctxUser) {
      setUser(ctxUser)
      userRef.current = ctxUser
      fetchThreads(ctxUser.id).then(() => {
        const p = new URLSearchParams(window.location.search)
        const withId = p.get('with')
        if (withId) openThreadById(withId, ctxUser.id)
      })


      const myId = ctxUser.id
      // Poll threads çdo 5 sekonda — guaranteed refresh
      pollRef.current = setInterval(() => { fetchThreads(myId) }, 5000)
      // Visibility API — rifresko menjëherë kur kthehemi në tab
      const onVisible = () => {
        if (document.visibilityState === 'visible') fetchThreads(myId)
      }
      document.addEventListener('visibilitychange', onVisible)
      ;(pollRef as any)._onVisible = onVisible
      // Supabase Realtime si bonus
      const inbox = supabase
        .channel(`inbox-global-${myId}`)
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'messages',
          filter: `receiver_id=eq.${myId}`,
        }, (payload) => {
          const m = payload.new as any
          setThreads(prev => {
            const idx = prev.findIndex(t => t.otherId === m.sender_id)
            if (idx === -1) { fetchThreads(myId); return prev }
            const t = { ...prev[idx], lastMsg: m }
            if (selectedRef.current?.otherId !== m.sender_id) {
              t.unread = (t.unread || 0) + 1
            }
            const updated = [...prev]
            updated.splice(idx, 1)
            return [t, ...updated]
          })
        })
        .subscribe()
      inboxRef.current = inbox
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) { window.location.href = '/auth/login'; return }
        setUser(session.user)
        userRef.current = session.user
        fetchThreads(session.user.id).then(() => {
          const p = new URLSearchParams(window.location.search)
          const withId = p.get('with')
          if (withId) openThreadById(withId, session.user.id)
        })
        const myId = session.user.id
        pollRef.current = setInterval(() => { fetchThreads(myId) }, 5000)
        const onVisible = () => {
          if (document.visibilityState === 'visible') fetchThreads(myId)
        }
        document.addEventListener('visibilitychange', onVisible)
        ;(pollRef as any)._onVisible = onVisible
        const inbox = supabase
          .channel(`inbox-global-${myId}`)
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'messages',
            filter: `receiver_id=eq.${myId}`,
          }, (payload) => {
            const m = payload.new as any
            setThreads(prev => {
              const idx = prev.findIndex(t => t.otherId === m.sender_id)
              if (idx === -1) { fetchThreads(myId); return prev }
              const t = { ...prev[idx], lastMsg: m }
              if (selectedRef.current?.otherId !== m.sender_id) {
                t.unread = (t.unread || 0) + 1
              }
              const updated = [...prev]
              updated.splice(idx, 1)
              return [t, ...updated]
            })
          })
          .subscribe()
        inboxRef.current = inbox
      })
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) { window.location.href = '/auth/login' }
    })
    return () => {
      if (channelRef.current)  supabase.removeChannel(channelRef.current)
      if (typingBcast.current) supabase.removeChannel(typingBcast.current)
      if (inboxRef.current)    supabase.removeChannel(inboxRef.current)
      clearInterval(pollRef.current)
      if ((pollRef as any)._onVisible) document.removeEventListener('visibilitychange', (pollRef as any)._onVisible)
    }
  }, [ctxUser])

  /* ── Scroll detection ─────────────────── */
  useEffect(() => {
    const el = msgsRef.current
    if (!el) return
    const handler = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 120)
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [selected])

  /* ── Auto-scroll ──────────────────────── */
  const scrollBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => { if (messages.length) scrollBottom() }, [messages])

  /* ── Fetch threads ───────────────────── */
  async function fetchThreads(uid: string) {
    const { data } = await supabase
      .from('messages')
      .select('*,sender:sender_id(id,full_name,username,avatar_url),receiver:receiver_id(id,full_name,username,avatar_url)')
      .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (data) {
      const map = new Map<string, any>()
      for (const m of data) {
        const otherId = m.sender_id === uid ? m.receiver_id : m.sender_id
        const other   = m.sender_id === uid ? m.receiver   : m.sender
        if (!map.has(otherId)) map.set(otherId, { otherId, other, lastMsg: m, unread: 0 })
        if (!m.read && m.receiver_id === uid) map.get(otherId)!.unread++
      }
      setThreads(Array.from(map.values()))
    }
    setLoading(false)
  }

  /* ── Open thread ─────────────────────── */
  async function openThreadById(otherId: string, uid: string) {
    const { data: other } = await supabase.from('profiles')
      .select('id,full_name,username,avatar_url').eq('id', otherId).single()
    if (other) openThread({ otherId, other, lastMsg: null, unread: 0 }, uid)
  }

  async function openThread(thread: any, uid?: string) {
    const myId = uid || userRef.current?.id
    setSelected(thread)
    selectedRef.current = thread

    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${thread.otherId}),and(sender_id.eq.${thread.otherId},receiver_id.eq.${myId})`)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (data) {
      setMessages(data)
      setTimeout(() => scrollBottom(false), 50)
    }

    // Mark read (fire-and-forget — .then() triggers the lazy Supabase v2 query)
    supabase.from('messages').update({ read: true })
      .eq('receiver_id', myId).eq('sender_id', thread.otherId).eq('read', false)
      .then()

    // Subscribe to new messages + typing + presence
    subscribeToThread(thread.otherId, myId)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  /* ── Realtime subscriptions ──────────── */
  function subscribeToThread(otherId: string, myId: string) {
    if (channelRef.current)  supabase.removeChannel(channelRef.current)
    if (typingBcast.current) supabase.removeChannel(typingBcast.current)

    // Messages channel (Postgres changes)
    const msgChannel = supabase
      .channel(`chat-${[myId, otherId].sort().join('-')}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${myId}`,
      }, (payload) => {
        const m = payload.new as any
        if (m.sender_id !== selectedRef.current?.otherId) return
        setMessages(prev => {
          if (prev.find(x => x.id === m.id)) return prev
          return [...prev, m]
        })
        supabase.from('messages').update({ read: true }).eq('id', m.id).then()
      })
      // Broadcast: typing
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.userId !== otherId) return
        setTypingVisible(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingVisible(false), 2500)
      })
      // Presence: online status
      .on('presence', { event: 'sync' }, () => {
        const state = msgChannel.presenceState<{userId:string}>()
        const ids   = new Set(Object.values(state).flat().map((p: any) => p.userId))
        setOnlineIds(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await msgChannel.track({ userId: myId })
        }
      })

    channelRef.current = msgChannel
  }

  /* ── Send message ────────────────────── */
  async function send() {
    const text = draft.trim()
    if (!text || !selected || sending) return
    setSending(true)
    setDraft('')
    if (inputRef.current) { inputRef.current.style.height = 'auto' }

    const optimistic: any = {
      id: `tmp-${Date.now()}`, sender_id: userRef.current?.id,
      receiver_id: selected.otherId, content: text,
      created_at: new Date().toISOString(), read: false,
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase.from('messages')
      .insert({ sender_id: userRef.current?.id, receiver_id: selected.otherId, content: text })
      .select().single()

    if (data) setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
    else if (error) { setMessages(prev => prev.filter(m => m.id !== optimistic.id)); setDraft(text) }

    setSending(false)
    // Refresh thread list order
    fetchThreads(userRef.current?.id)
  }

  /* ── Typing broadcast ────────────────── */
  function onTyping() {
    if (!channelRef.current || !selected) return
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { userId: userRef.current?.id } })
  }

  /* ── Reactions ───────────────────────── */
  async function sendReaction(msgId: string, emoji: string) {
    setReactionMsg(null)
    // Store reaction in message metadata (optimistic update on UI)
    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, reaction: emoji } : m
    ))
    // Persist to DB if column exists, otherwise just UI-only
    await supabase.from('messages').update({ reaction: emoji }).eq('id', msgId)
  }

  /* ── Back ────────────────────────────── */
  function back() {
    setSelected(null)
    if (channelRef.current)  supabase.removeChannel(channelRef.current)
    if (typingBcast.current) supabase.removeChannel(typingBcast.current)
    setTypingVisible(false)
    fetchThreads(userRef.current?.id)
  }

  /* ── Message grouping ────────────────── */
  function buildGroups(msgs: any[]) {
    const groups: Array<{ date: string; items: any[] }> = []
    let curDate = ''
    for (const m of msgs) {
      const d = dayLabel(m.created_at)
      if (d !== curDate) { groups.push({ date: d, items: [] }); curDate = d }
      groups[groups.length-1].items.push(m)
    }
    return groups
  }

  const filteredThreads = threads.filter(t =>
    !search.trim() || displayName(t.other).toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)
  const isOtherOnline = selected ? onlineIds.has(selected.otherId) : false
  const groups = buildGroups(messages)

  /* ═══════════════════════════════════════ RENDER */
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;overflow:hidden;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0a0a0a;}
        .page{max-width:480px;margin:0 auto;height:100dvh;display:flex;flex-direction:column;background:#FFFBEA;overflow:hidden;position:relative;}

        /* ── Topbar ── */
        .topbar{background:linear-gradient(135deg,#F5C842 0%,#f0bc30 100%);padding:10px 12px;display:flex;align-items:center;gap:10px;flex-shrink:0;box-shadow:0 2px 12px rgba(0,0,0,.1);z-index:10;}
        .back-btn{width:36px;height:36px;background:rgba(0,0,0,.1);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s;}
        .back-btn:active{background:rgba(0,0,0,.2);}
        .back-btn i{font-size:19px;color:#111;}
        .t-meta{flex:1;min-width:0;}
        .t-name{font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .t-sub{font-size:10px;color:#555;margin-top:1px;display:flex;align-items:center;gap:4px;}
        .online-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;}
        .t-actions{display:flex;gap:6px;}
        .t-action-btn{width:34px;height:34px;background:rgba(0,0,0,.08);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;}
        .t-action-btn:hover{background:rgba(0,0,0,.15);}
        .t-action-btn i{font-size:17px;color:#111;}

        /* ── Search bar ── */
        .search-wrap{background:linear-gradient(180deg,#F5C842,#f0bc30);padding:6px 12px 10px;flex-shrink:0;}
        .search-inner{background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 12px;gap:8px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
        .search-inner i{font-size:14px;color:#bbb;}
        .search-inner input{border:none;background:transparent;font-size:12px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}

        /* ── Thread list ── */
        .threads-scroll{flex:1;overflow-y:auto;}
        .threads-scroll::-webkit-scrollbar{width:3px;}
        .threads-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}
        .thread{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;border-bottom:0.5px solid #f0ece0;transition:background .1s;position:relative;}
        .thread:hover,.thread:active{background:#fff8e0;}
        .t-info{flex:1;min-width:0;}
        .t-thread-name{font-size:13px;font-weight:700;color:#111;margin-bottom:2px;}
        .t-preview{font-size:11px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .t-preview.unread{color:#444;font-weight:600;}
        .t-right{text-align:right;flex-shrink:0;}
        .t-time{font-size:10px;color:#bbb;}
        .t-badge{background:#E63312;color:#fff;border-radius:12px;min-width:20px;height:20px;padding:0 6px;font-size:9px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;margin-top:4px;}

        /* ── New conversation ── */
        .fab{position:absolute;bottom:20px;right:16px;width:52px;height:52px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(230,51,18,.4);z-index:10;}
        .fab i{font-size:22px;color:#fff;}

        /* ── Empty ── */
        .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 24px;text-align:center;}
        .empty-emoji{font-size:62px;margin-bottom:16px;}
        .empty h3{font-size:16px;font-weight:700;color:#555;margin-bottom:8px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.8;margin-bottom:20px;}
        .empty-cta{background:#111;color:#F5C842;border:none;border-radius:12px;padding:13px 26px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

        /* ── Chat view ── */
        .chat-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;}
        .msgs-area{flex:1;overflow-y:auto;padding:10px 12px 6px;display:flex;flex-direction:column;gap:2px;background:#f5f0e0;}
        .msgs-area::-webkit-scrollbar{width:3px;}
        .msgs-area::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}

        /* ── Day separator ── */
        .day-sep{text-align:center;margin:10px 0 6px;pointer-events:none;}
        .day-sep span{background:rgba(0,0,0,.1);color:#666;font-size:10px;font-weight:600;padding:4px 12px;border-radius:12px;}

        /* ── Message rows ── */
        .msg-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:1px;position:relative;}
        .msg-row.mine{flex-direction:row-reverse;}
        .msg-row.mine .av-spacer,.msg-row.theirs .av-spacer{width:28px;flex-shrink:0;}

        /* ── Bubbles ── */
        .bubble-wrap{display:flex;flex-direction:column;max-width:74%;position:relative;}
        .mine .bubble-wrap{align-items:flex-end;}
        .bubble{padding:9px 13px;font-size:13.5px;line-height:1.55;word-break:break-word;position:relative;cursor:pointer;transition:opacity .1s;}
        .bubble:active{opacity:.8;}
        .mine .bubble{background:linear-gradient(135deg,#F5C842,#e8b820);color:#111;border-radius:18px 18px 4px 18px;box-shadow:0 2px 8px rgba(245,200,66,.3);}
        .theirs .bubble{background:#fff;color:#111;border-radius:18px 18px 18px 4px;box-shadow:0 2px 6px rgba(0,0,0,.06);}
        .bubble.tmp{opacity:.6;}

        /* Reaction badge on bubble */
        .reaction-badge{position:absolute;bottom:-8px;right:6px;background:#fff;border-radius:10px;padding:1px 5px;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.15);cursor:pointer;border:1px solid #eee;}
        .mine .reaction-badge{right:auto;left:6px;}

        /* Timestamp inside bubble */
        .btime{font-size:9px;color:rgba(0,0,0,.35);margin-top:4px;display:flex;align-items:center;justify-content:flex-end;gap:3px;}
        .theirs .btime{justify-content:flex-start;color:#bbb;}
        .btime i{font-size:11px;}
        .timestamp-popup{font-size:10px;color:#999;text-align:center;padding:3px 0;animation:fadeIn .15s;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}

        /* ── Typing indicator ── */
        .typing-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:4px;}
        .typing-bubble{background:#fff;border-radius:18px 18px 18px 4px;padding:10px 14px;box-shadow:0 2px 6px rgba(0,0,0,.06);display:flex;gap:4px;align-items:center;}
        .tdot{width:7px;height:7px;border-radius:50%;background:#bbb;animation:tdot .9s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

        /* ── Reaction picker ── */
        .reaction-overlay{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;animation:fadeIn .15s;}
        .reaction-picker{background:#fff;border-radius:18px;padding:12px 10px;display:flex;gap:6px;box-shadow:0 16px 40px rgba(0,0,0,.25);animation:popIn .15s;}
        @keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        .remo{font-size:26px;cursor:pointer;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .1s;}
        .remo:hover{background:#f5f0e0;}

        /* ── Scroll to bottom ── */
        .scroll-btn{position:absolute;bottom:74px;right:14px;width:36px;height:36px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.15);border:none;cursor:pointer;z-index:5;animation:fadeIn .2s;}
        .scroll-btn i{font-size:18px;color:#555;}

        /* ── Input bar ── */
        .input-bar{background:#fff;border-top:1px solid #eee;padding:10px 12px 12px;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;box-shadow:0 -2px 8px rgba(0,0,0,.05);}
        .input-wrap{flex:1;background:#f5f5f0;border-radius:22px;display:flex;align-items:flex-end;padding:0 14px;gap:8px;border:1.5px solid transparent;transition:border-color .15s;}
        .input-wrap:focus-within{border-color:#F5C842;background:#fff;}
        .input-wrap textarea{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;resize:none;min-height:20px;max-height:90px;line-height:1.5;padding:10px 0;font-family:inherit;}
        .input-wrap textarea::placeholder{color:#bbb;}
        .emoji-btn{width:28px;height:28px;border:none;background:none;cursor:pointer;font-size:20px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:6px;}
        .send-btn{width:46px;height:46px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(230,51,18,.35);transition:transform .1s,opacity .15s;}
        .send-btn:active{transform:scale(.9);}
        .send-btn:disabled{opacity:.4;box-shadow:none;}
        .send-btn i{color:#fff;font-size:20px;}

        /* ── Spinner ── */
        .spin-center{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#888;font-size:13px;}
        .spinner{width:26px;height:26px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
      `}</style>

      {/* Reaction picker overlay */}
      {reactionMsg && (
        <div className="reaction-overlay" onClick={() => setReactionMsg(null)}>
          <div className="reaction-picker" onClick={e => e.stopPropagation()}>
            {EMOJI_LIST.map(e => (
              <div key={e} className="remo" onClick={() => sendReaction(reactionMsg, e)}>{e}</div>
            ))}
          </div>
        </div>
      )}

      <div className="page">
        {selected ? (
          /* ════════════════════ CHAT VIEW ════════════════════ */
          <>
            <div className="topbar">
              <button className="back-btn" onClick={back}>
                <i className="ti ti-arrow-left" />
              </button>
              <Avatar profile={selected.other} size={38} online={isOtherOnline} />
              <div className="t-meta">
                <div className="t-name">{displayName(selected.other)}</div>
                <div className="t-sub">
                  {typingVisible ? (
                    <><span className="online-dot" style={{ background: '#F5C842' }} />Po shkruan...</>
                  ) : isOtherOnline ? (
                    <><span className="online-dot" />Online tani</>
                  ) : (
                    'I fjetur'
                  )}
                </div>
              </div>
              <div className="t-actions">
                <button className="t-action-btn" onClick={() => window.location.href = `/dyqane/${selected.otherId}`} title="Shiko dyqanin">
                  <i className="ti ti-building-store" />
                </button>
                <button className="t-action-btn" title="Info">
                  <i className="ti ti-info-circle" />
                </button>
              </div>
            </div>

            <div className="chat-wrap" style={{ position: 'relative' }}>
              <div className="msgs-area" ref={msgsRef}>
                {messages.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px 20px', color:'#bbb', fontSize:12 }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>👋</div>
                    <div style={{ fontWeight:700, color:'#999', marginBottom:4 }}>
                      Fillo bisedën me {displayName(selected.other)}
                    </div>
                    <div>Mesazhet janë private dhe të sigurta</div>
                  </div>
                )}

                {groups.map((g, gi) => (
                  <div key={gi}>
                    <div className="day-sep"><span>{g.date}</span></div>
                    {g.items.map((m, mi) => {
                      const mine    = m.sender_id === user?.id
                      const items   = g.items
                      const isFirst = mi === 0 || items[mi-1].sender_id !== m.sender_id
                      const isLast  = mi === items.length-1 || items[mi+1].sender_id !== m.sender_id
                      const showTs  = msgTimestamps.has(m.id)

                      return (
                        <div key={m.id}>
                          <div className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                            {!mine && (
                              isLast
                                ? <Avatar profile={selected.other} size={28} />
                                : <div className="av-spacer" />
                            )}

                            <div className="bubble-wrap">
                              <div
                                className={`bubble ${m.id?.toString().startsWith('tmp') ? 'tmp' : ''}`}
                                onClick={() => setMsgTimestamps(prev => {
                                  const n = new Set(prev)
                                  n.has(m.id) ? n.delete(m.id) : n.add(m.id)
                                  return n
                                })}
                                onDoubleClick={() => setReactionMsg(m.id)}
                                onContextMenu={e => { e.preventDefault(); setReactionMsg(m.id) }}
                              >
                                {m.content}
                                {isLast && (
                                  <div className="btime">
                                    {fullTime(m.created_at)}
                                    {mine && (
                                      <i className={`ti ti-check${m.read ? 's' : ''}`}
                                        style={{ color: m.read ? '#3B82F6' : 'rgba(0,0,0,.3)' }} />
                                    )}
                                  </div>
                                )}
                              </div>
                              {m.reaction && (
                                <div className="reaction-badge" onClick={() => setReactionMsg(m.id)}>
                                  {m.reaction}
                                </div>
                              )}
                            </div>
                          </div>
                          {showTs && (
                            <div className="timestamp-popup">{fullTime(m.created_at)}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}

                {/* Typing indicator */}
                {typingVisible && (
                  <div className="typing-row">
                    <Avatar profile={selected.other} size={28} online={isOtherOnline} />
                    <div className="typing-bubble">
                      <span className="tdot" /><span className="tdot" /><span className="tdot" />
                    </div>
                  </div>
                )}

                <div ref={bottomRef} style={{ height: 4 }} />
              </div>

              {showScrollBtn && (
                <button className="scroll-btn" onClick={() => scrollBottom()}>
                  <i className="ti ti-chevron-down" />
                </button>
              )}

              <div className="input-bar">
                <button className="emoji-btn" onClick={() => {
                  const emojis = ['😊','👍','❤️','😂','🔥','👋','✅','🙏']
                  const e = emojis[Math.floor(Math.random()*emojis.length)]
                  setDraft(d => d + e)
                  inputRef.current?.focus()
                }}>😊</button>

                <div className="input-wrap">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    placeholder={`Mesazh te ${displayName(selected.other)}...`}
                    value={draft}
                    onChange={e => {
                      setDraft(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'
                      onTyping()
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                    }}
                  />
                </div>

                <button className="send-btn" onClick={send} disabled={!draft.trim() || sending}>
                  <i className={`ti ti-${sending ? 'loader-2' : 'send'}`} style={sending ? {animation:'spin .7s linear infinite'} : {}} />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ════════════════════ THREAD LIST ════════════════════ */
          <>
            <div className="topbar">
              <button className="back-btn" onClick={() => window.location.href = '/'}>
                <i className="ti ti-arrow-left" />
              </button>
              <div className="t-meta">
                <div className="t-name">
                  Mesazhet
                  {totalUnread > 0 && (
                    <span style={{ background:'#E63312', color:'#fff', borderRadius:10,
                      padding:'1px 8px', fontSize:10, fontWeight:700, marginLeft:8 }}>
                      {totalUnread}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="search-wrap">
              <div className="search-inner">
                <i className="ti ti-search" />
                <input placeholder="Kërko bisedë..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="spin-center">
                <span className="spinner" />Duke ngarkuar...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="empty">
                <div className="empty-emoji">{search ? '🔍' : '💬'}</div>
                <h3>{search ? 'Nuk u gjet asgjë' : 'Nuk ke mesazhe akoma'}</h3>
                <p>{search
                  ? `Nuk ka bisedë me "${search}"`
                  : 'Kontakto shitësin nga ndonjë shpallje\nose dyqan dhe biseda shfaqet këtu.'}</p>
                {!search && (
                  <button className="empty-cta" onClick={() => window.location.href = '/'}>
                    Shfleto shpalljet →
                  </button>
                )}
              </div>
            ) : (
              <div className="threads-scroll" style={{ position:'relative' }}>
                {filteredThreads.map(t => (
                  <div key={t.otherId} className="thread" onClick={() => openThread(t)}>
                    <Avatar profile={t.other} size={48} online={onlineIds.has(t.otherId)} />
                    <div className="t-info">
                      <div className="t-thread-name">{displayName(t.other)}</div>
                      <div className={`t-preview ${t.unread > 0 ? 'unread' : ''}`}>
                        {t.lastMsg?.content?.slice(0, 55) || 'Fillo bisedën...'}
                      </div>
                    </div>
                    <div className="t-right">
                      <div className="t-time">{t.lastMsg ? timeStr(t.lastMsg.created_at) : ''}</div>
                      {t.unread > 0 && <div className="t-badge">{t.unread}</div>}
                    </div>
                  </div>
                ))}
                <div style={{ height: 80 }} />
              </div>
            )}

            <button className="fab" onClick={() => window.location.href = '/'} title="Bisedë e re">
              <i className="ti ti-edit" />
            </button>
          </>
        )}
      </div>
    </>
  )
}

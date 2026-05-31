'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'

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
  const dt = new Date(d), now = new Date()
  if (dt.toDateString() === now.toDateString()) return 'Sot'
  const yes = new Date(); yes.setDate(now.getDate()-1)
  if (dt.toDateString() === yes.toDateString()) return 'Dje'
  return dt.toLocaleDateString('sq-AL', { day: '2-digit', month: 'long' })
}

const EMOJI_LIST = ['❤️','👍','😂','😮','😢','🙏','🔥','👋']
const EMOJI_PICKER = [
  '😊','😂','❤️','👍','🔥','😍','🥺','😭','🙏','✅',
  '👋','😎','🤔','💯','🎉','🥰','😢','💪','👀','😁',
  '🤣','🙌','⭐','✨','💎','🚀','👑','💰','😀','🥳',
  '🤝','💙','😇','💫','🌟','🫶','😅','🤩','😜','🥹',
]

function Avatar({ profile, size = 46, online = false }: { profile: any; size?: number; online?: boolean }) {
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <div style={{
        width:size, height:size, borderRadius:'50%', overflow:'hidden', flexShrink:0,
        background:'linear-gradient(135deg,#F5C842,#e0b030)', display:'flex', alignItems:'center',
        justifyContent:'center', fontSize:size*0.35, fontWeight:700, color:'#111',
      }}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : initials(profile)}
      </div>
      {online && <span style={{
        position:'absolute', bottom:1, right:1, width:10, height:10, borderRadius:'50%',
        background:'#22c55e', border:'2px solid #FFFBEA',
      }} />}
    </div>
  )
}

export default function MessagesPage() {
  const { user: ctxUser } = useAlpazar()
  const [user,      setUser]      = useState<any>(null)
  const [threads,   setThreads]   = useState<any[]>([])
  const [selected,  setSelected]  = useState<any>(null)
  const [messages,  setMessages]  = useState<any[]>([])
  const [draft,     setDraft]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [typingVisible, setTypingVisible] = useState(false)
  const [onlineIds, setOnlineIds]  = useState<Set<string>>(new Set())
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [reactionMsg, setReactionMsg]   = useState<string|null>(null)
  const [otherPhone,   setOtherPhone]   = useState<string|null>(null)
  const [showInfo,     setShowInfo]     = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [blockedIds,   setBlockedIds]   = useState<Set<string>>(new Set())
  const [showBlockConfirm, setShowBlockConfirm] = useState(false)

  // NEW: reply, context menu, emoji picker
  const [replyTo,   setReplyTo]   = useState<any>(null)
  const [ctxMenu,   setCtxMenu]   = useState<any>(null)  // { msg, isOwn }
  const [emojiOpen, setEmojiOpen] = useState(false)

  const bottomRef      = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)
  const msgsRef        = useRef<HTMLDivElement>(null)
  const channelRef     = useRef<any>(null)
  const typingTimer    = useRef<any>(null)
  const userRef        = useRef<any>(null)
  const selectedRef    = useRef<any>(null)
  const inboxRef       = useRef<any>(null)
  const longPressTimer = useRef<any>(null)
  const userScrolledUp = useRef(false)
  const prevMsgCount   = useRef(0)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { selectedRef.current = selected }, [selected])

  /* ── Init ── */
  useEffect(() => {
    async function init(myId: string) {
      await Promise.all([fetchThreads(myId), fetchBlocked(myId)])
      const p = new URLSearchParams(window.location.search)
      const withId = p.get('with')
      if (withId) openThreadById(withId, myId)

      // Pure realtime inbox (no polling)
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
            if (selectedRef.current?.otherId !== m.sender_id) t.unread = (t.unread || 0) + 1
            const updated = [...prev]; updated.splice(idx, 1)
            return [t, ...updated]
          })
        })
        .subscribe()
      inboxRef.current = inbox
    }

    if (ctxUser) {
      setUser(ctxUser); userRef.current = ctxUser; init(ctxUser.id)
    } else {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) { window.location.href = '/auth/login'; return }
        setUser(session.user); userRef.current = session.user; init(session.user.id)
      })
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) window.location.href = '/auth/login'
    })
    return () => {
      subscription.unsubscribe()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (inboxRef.current)   supabase.removeChannel(inboxRef.current)
    }
  }, [ctxUser])

  /* ── Scroll detection ── */
  useEffect(() => {
    const el = msgsRef.current
    if (!el) return
    const handler = () => {
      const fromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(fromBottom > 120)
      userScrolledUp.current = fromBottom > 80
    }
    el.addEventListener('scroll', handler, { passive: true })
    return () => el.removeEventListener('scroll', handler)
  }, [selected])

  const scrollBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  useEffect(() => {
    const newCount = messages.length
    if (newCount > prevMsgCount.current && !userScrolledUp.current) {
      scrollBottom(newCount > prevMsgCount.current + 1 ? false : true)
    }
    prevMsgCount.current = newCount
  }, [messages, scrollBottom])

  /* ── Fetch threads ── */
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

  async function fetchBlocked(uid: string) {
    const { data } = await supabase.from('blocks').select('blocked_id').eq('blocker_id', uid)
    if (data) setBlockedIds(new Set(data.map((b: any) => b.blocked_id)))
  }

  async function openThreadById(otherId: string, uid: string) {
    const { data: other } = await supabase.from('profiles')
      .select('id,full_name,username,avatar_url').eq('id', otherId).single()
    if (other) openThread({ otherId, other, lastMsg: null, unread: 0 }, uid)
  }

  async function openThread(thread: any, uid?: string) {
    const myId = uid || userRef.current?.id
    setSelected(thread); selectedRef.current = thread
    setOtherPhone(null); setShowInfo(false); setReplyTo(null); setEmojiOpen(false)
    userScrolledUp.current = false; prevMsgCount.current = 0
    setThreads(prev => prev.map(t => t.otherId === thread.otherId ? { ...t, unread: 0 } : t))

    const [{ data: msgs }, { data: profileData }] = await Promise.all([
      supabase.from('messages')
        .select('*,reply_msg:reply_to_id(id,content,sender_id)')
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${thread.otherId}),and(sender_id.eq.${thread.otherId},receiver_id.eq.${myId})`)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('phone').eq('id', thread.otherId).single(),
    ])

    if (msgs) { setMessages(msgs); prevMsgCount.current = msgs.length; setTimeout(() => scrollBottom(false), 50) }
    if (profileData?.phone) setOtherPhone(profileData.phone)

    supabase.from('messages').update({ read: true })
      .eq('receiver_id', myId).eq('sender_id', thread.otherId).eq('read', false).then()

    subscribeToThread(thread.otherId, myId)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  /* ── Realtime subscriptions ── */
  function subscribeToThread(otherId: string, myId: string) {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const ch = supabase.channel(`chat-${[myId, otherId].sort().join('-')}`)
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
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `sender_id=eq.${myId}`,
      }, (payload) => {
        const m = payload.new as any
        if (m.receiver_id !== otherId) return
        setMessages(prev => prev.map(x =>
          x.id === m.id ? { ...x, read: m.read, reaction: m.reaction ?? x.reaction, deleted_at: m.deleted_at } : x
        ))
      })
      // UPDATE received messages (for delete + reaction by other)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${myId}`,
      }, (payload) => {
        const m = payload.new as any
        if (m.sender_id !== otherId) return
        setMessages(prev => prev.map(x =>
          x.id === m.id ? { ...x, reaction: m.reaction ?? x.reaction, deleted_at: m.deleted_at } : x
        ))
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: any) => {
        if (payload.userId !== otherId) return
        setTypingVisible(true)
        clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingVisible(false), 2500)
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<{userId:string}>()
        const ids = new Set(Object.values(state).flat().map((p: any) => p.userId))
        setOnlineIds(ids)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await ch.track({ userId: myId })
      })
    channelRef.current = ch
  }

  /* ── Send message ── */
  async function send() {
    const text = draft.trim()
    if (!text || !selected || sending) return
    const replyRef = replyTo
    setSending(true); setDraft(''); setReplyTo(null); setEmojiOpen(false)
    if (inputRef.current) inputRef.current.style.height = 'auto'
    userScrolledUp.current = false

    const optimistic: any = {
      id: `tmp-${Date.now()}`, sender_id: userRef.current?.id,
      receiver_id: selected.otherId, content: text,
      created_at: new Date().toISOString(), read: false,
      reply_msg: replyRef,
      reply_to_id: replyRef?.id ?? null,
    }
    setMessages(prev => [...prev, optimistic])

    const { data, error } = await supabase.from('messages')
      .insert({
        sender_id: userRef.current?.id,
        receiver_id: selected.otherId,
        content: text,
        ...(replyRef ? { reply_to_id: replyRef.id } : {}),
      })
      .select('*,reply_msg:reply_to_id(id,content,sender_id)').single()

    if (data) setMessages(prev => prev.map(m => m.id === optimistic.id ? data : m))
    else if (error) { setMessages(prev => prev.filter(m => m.id !== optimistic.id)); setDraft(text); setReplyTo(replyRef) }
    setSending(false)
    fetchThreads(userRef.current?.id)
  }

  /* ── Typing broadcast ── */
  function onTyping() {
    if (!channelRef.current || !selected) return
    channelRef.current.send({ type:'broadcast', event:'typing', payload:{ userId: userRef.current?.id } })
  }

  /* ── Reactions ── */
  async function sendReaction(msgId: string, emoji: string) {
    setReactionMsg(null); setCtxMenu(null)
    const prev_r = messages.find(m => m.id === msgId)?.reaction ?? null
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: emoji } : m))
    const { error } = await supabase.from('messages').update({ reaction: emoji }).eq('id', msgId)
    if (error) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: prev_r } : m))
  }

  /* ── Delete message ── */
  async function deleteMsg(msgId: string) {
    setCtxMenu(null)
    const ts = new Date().toISOString()
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at: ts } : m))
    await supabase.from('messages')
      .update({ deleted_at: ts })
      .eq('id', msgId)
      .eq('sender_id', userRef.current?.id)
  }

  /* ── Copy message ── */
  async function copyMsg(content: string) {
    setCtxMenu(null)
    try { await navigator.clipboard.writeText(content) } catch {}
  }

  /* ── Long press detection ── */
  function startPress(msg: any, isOwn: boolean) {
    clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      setCtxMenu({ msg, isOwn })
    }, 480)
  }
  function endPress() { clearTimeout(longPressTimer.current) }

  /* ── Block / Unblock ── */
  async function blockUser() {
    const myId = userRef.current?.id, otherId = selected?.otherId
    if (!myId || !otherId) return
    setShowBlockConfirm(false)
    const { error } = await supabase.from('blocks').upsert(
      { blocker_id: myId, blocked_id: otherId }, { onConflict: 'blocker_id,blocked_id' }
    )
    if (!error) { setBlockedIds(prev => new Set([...prev, otherId])); back() }
  }
  async function unblockUser(otherId: string) {
    const myId = userRef.current?.id
    if (!myId) return
    const { error } = await supabase.from('blocks').delete().eq('blocker_id', myId).eq('blocked_id', otherId)
    if (!error) { setBlockedIds(prev => { const s = new Set(prev); s.delete(otherId); return s }); fetchThreads(myId) }
  }

  /* ── Back ── */
  function back() {
    setSelected(null); setShowInfo(false); setOtherPhone(null); setReplyTo(null); setEmojiOpen(false)
    userScrolledUp.current = false; prevMsgCount.current = 0
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    setTypingVisible(false)
    fetchThreads(userRef.current?.id)
  }

  /* ── Message grouping ── */
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

  const isBlocked      = selected ? blockedIds.has(selected.otherId) : false
  const filteredThreads = threads.filter(t =>
    !search.trim() || displayName(t.other).toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread   = threads.reduce((s, t) => s + t.unread, 0)
  const isOtherOnline = selected ? onlineIds.has(selected.otherId) : false
  const groups        = buildGroups(messages)
  const waPhone       = otherPhone?.replace(/\D/g, '')
  const waLink        = waPhone ? `https://wa.me/${waPhone}` : null

  /* ══════════════════════════════ RENDER */
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{height:100%;overflow:hidden;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0a0a0a;}
        .page{max-width:480px;margin:0 auto;height:100dvh;display:flex;flex-direction:column;background:#FFFBEA;overflow:hidden;position:relative;}

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

        .search-wrap{background:linear-gradient(180deg,#F5C842,#f0bc30);padding:6px 12px 10px;flex-shrink:0;}
        .search-inner{background:#fff;border-radius:12px;display:flex;align-items:center;padding:0 12px;gap:8px;box-shadow:0 1px 4px rgba(0,0,0,.06);}
        .search-inner i{font-size:14px;color:#bbb;}
        .search-inner input{border:none;background:transparent;font-size:12px;color:#111;outline:none;flex:1;padding:9px 0;font-family:inherit;}

        .threads-scroll{flex:1;overflow-y:auto;min-height:0;}
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

        .fab{position:absolute;bottom:20px;right:16px;width:52px;height:52px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(230,51,18,.4);z-index:10;}
        .fab i{font-size:22px;color:#fff;}

        .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 24px;text-align:center;}
        .empty-emoji{font-size:62px;margin-bottom:16px;}
        .empty h3{font-size:16px;font-weight:700;color:#555;margin-bottom:8px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.8;margin-bottom:20px;}
        .empty-cta{background:#111;color:#F5C842;border:none;border-radius:12px;padding:13px 26px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

        .chat-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
        .msgs-area{flex:1;overflow-y:auto;padding:10px 12px 6px;display:flex;flex-direction:column;gap:2px;background:#f5f0e0;min-height:0;}
        .msgs-area::-webkit-scrollbar{width:3px;}
        .msgs-area::-webkit-scrollbar-thumb{background:#ccc;border-radius:10px;}

        .day-sep{text-align:center;margin:10px 0 6px;pointer-events:none;}
        .day-sep span{background:rgba(0,0,0,.1);color:#666;font-size:10px;font-weight:600;padding:4px 12px;border-radius:12px;}

        .msg-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:1px;position:relative;}
        .msg-row.mine{flex-direction:row-reverse;}
        .av-spacer{width:28px;flex-shrink:0;}

        .bubble-wrap{display:flex;flex-direction:column;max-width:76%;position:relative;}
        .mine .bubble-wrap{align-items:flex-end;}
        .bubble{padding:9px 13px;font-size:13.5px;line-height:1.55;word-break:break-word;position:relative;cursor:pointer;transition:opacity .1s;user-select:none;-webkit-user-select:none;}
        .bubble:active{opacity:.8;}
        .mine .bubble{background:linear-gradient(135deg,#F5C842,#e8b820);color:#111;border-radius:18px 18px 4px 18px;box-shadow:0 2px 8px rgba(245,200,66,.3);}
        .theirs .bubble{background:#fff;color:#111;border-radius:18px 18px 18px 4px;box-shadow:0 2px 6px rgba(0,0,0,.06);}
        .bubble.tmp{opacity:.6;}
        .bubble.deleted{opacity:.55;}

        /* Reply preview inside bubble */
        .reply-preview{border-left:3px solid rgba(0,0,0,.25);padding:5px 8px;margin-bottom:7px;border-radius:4px;background:rgba(0,0,0,.06);font-size:11px;max-width:100%;overflow:hidden;}
        .mine .reply-preview{border-color:rgba(0,0,0,.3);}
        .theirs .reply-preview{border-color:#F5C842;}
        .reply-preview-name{font-weight:700;font-size:10px;margin-bottom:2px;color:inherit;opacity:.7;}
        .reply-preview-text{overflow:hidden;white-space:nowrap;text-overflow:ellipsis;opacity:.65;}

        .reaction-badge{position:absolute;bottom:-8px;right:6px;background:#fff;border-radius:10px;padding:1px 5px;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.15);cursor:pointer;border:1px solid #eee;}
        .mine .reaction-badge{right:auto;left:6px;}

        .btime{font-size:9px;color:rgba(0,0,0,.35);margin-top:4px;display:flex;align-items:center;justify-content:flex-end;gap:3px;}
        .theirs .btime{justify-content:flex-start;color:#bbb;}
        .btime i{font-size:11px;}

        .typing-row{display:flex;align-items:flex-end;gap:6px;margin-bottom:4px;}
        .typing-bubble{background:#fff;border-radius:18px 18px 18px 4px;padding:10px 14px;box-shadow:0 2px 6px rgba(0,0,0,.06);display:flex;gap:4px;align-items:center;}
        .tdot{width:7px;height:7px;border-radius:50%;background:#bbb;animation:tdot .9s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

        .reaction-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;animation:fadeIn .15s;}
        .reaction-picker{background:#fff;border-radius:18px;padding:12px 10px;display:flex;gap:6px;box-shadow:0 16px 40px rgba(0,0,0,.25);animation:popIn .15s;}
        @keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        .remo{font-size:26px;cursor:pointer;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:background .1s;}
        .remo:hover{background:#f5f0e0;}

        .scroll-btn{position:absolute;bottom:74px;right:14px;width:36px;height:36px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.15);border:none;cursor:pointer;z-index:5;animation:fadeIn .2s;}
        .scroll-btn i{font-size:18px;color:#555;}

        /* Reply strip above input */
        .reply-strip{background:#fff;border-top:1px solid #eee;padding:8px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .reply-strip-bar{flex:1;border-left:3px solid #F5C842;padding-left:8px;min-width:0;}
        .reply-strip-name{font-size:11px;color:#E63312;font-weight:700;margin-bottom:2px;}
        .reply-strip-text{font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .reply-close{background:none;border:none;color:#ccc;font-size:18px;cursor:pointer;padding:0;line-height:1;flex-shrink:0;}

        /* Emoji picker panel */
        .emoji-panel{background:#fff;border-top:1px solid #eee;padding:8px 10px;display:flex;flex-wrap:wrap;gap:2px;max-height:130px;overflow-y:auto;flex-shrink:0;}
        .emoji-panel::-webkit-scrollbar{width:3px;}
        .emoji-panel::-webkit-scrollbar-thumb{background:#eee;border-radius:4px;}
        .ep-btn{background:none;border:none;font-size:22px;cursor:pointer;padding:4px;border-radius:8px;transition:background .1s;line-height:1;}
        .ep-btn:hover{background:#f5f0e0;}

        .input-bar{background:#fff;border-top:1px solid #eee;padding:10px 12px 12px;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;box-shadow:0 -2px 8px rgba(0,0,0,.05);}
        .input-wrap{flex:1;background:#f5f5f0;border-radius:22px;display:flex;align-items:flex-end;padding:0 14px;gap:8px;border:1.5px solid transparent;transition:border-color .15s;}
        .input-wrap:focus-within{border-color:#F5C842;background:#fff;}
        .input-wrap textarea{border:none;background:transparent;font-size:13px;color:#111;outline:none;flex:1;resize:none;min-height:20px;max-height:90px;line-height:1.5;padding:10px 0;font-family:inherit;}
        .input-wrap textarea::placeholder{color:#bbb;}
        .emoji-btn{width:30px;height:30px;border:none;background:none;cursor:pointer;font-size:21px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:8px;transition:transform .15s;}
        .emoji-btn:hover{transform:scale(1.15);}
        .send-btn{width:46px;height:46px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(230,51,18,.35);transition:transform .1s,opacity .15s;}
        .send-btn:active{transform:scale(.9);}
        .send-btn:disabled{opacity:.4;box-shadow:none;}
        .send-btn i{color:#fff;font-size:20px;}

        .blocked-bar{background:#fff3f0;border-top:1px solid #ffd5cc;padding:14px 16px;flex-shrink:0;text-align:center;}
        .blocked-bar p{font-size:12px;color:#E63312;margin-bottom:8px;}
        .unblock-btn{background:transparent;border:1.5px solid #E63312;color:#E63312;border-radius:10px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}

        .modal-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .15s;}
        .modal-center{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .15s;}
        .modal-sheet{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:16px 0 32px;animation:slideUp .2s;}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .modal-handle{width:36px;height:4px;background:#eee;border-radius:4px;margin:0 auto 16px;}
        .modal-sep{height:1px;background:#f0f0f0;margin:6px 0;}
        .modal-item{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;transition:background .1s;}
        .modal-item:hover{background:#f9f9f9;}
        .modal-item i{font-size:20px;width:24px;text-align:center;color:#555;}
        .modal-item span{font-size:14px;color:#111;}
        .modal-item.danger i,.modal-item.danger span{color:#E63312;}
        .modal-item.wa i{color:#25D366;}
        .modal-item.success i,.modal-item.success span{color:#22c55e;}

        .confirm-card{background:#fff;border-radius:20px;padding:24px;max-width:360px;width:100%;animation:popIn .15s;text-align:center;}
        .confirm-title{font-size:16px;font-weight:700;color:#111;margin-bottom:8px;}
        .confirm-desc{font-size:13px;color:#888;line-height:1.6;margin-bottom:20px;}
        .confirm-btns{display:flex;gap:10px;}
        .confirm-btn{flex:1;padding:13px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
        .confirm-btn.cancel{background:#f5f5f0;color:#555;}
        .confirm-btn.danger{background:#E63312;color:#fff;}

        .spin-center{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#888;font-size:13px;}
        .spinner{width:26px;height:26px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Reaction picker */}
      {reactionMsg && (
        <div className="reaction-overlay" onClick={() => setReactionMsg(null)}>
          <div className="reaction-picker" onClick={e => e.stopPropagation()}>
            {EMOJI_LIST.map(e => (
              <div key={e} className="remo" onClick={() => sendReaction(reactionMsg, e)}>{e}</div>
            ))}
          </div>
        </div>
      )}

      {/* Context menu */}
      {ctxMenu && (
        <div className="modal-overlay" onClick={() => setCtxMenu(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            {ctxMenu.msg.content && (
              <div style={{ padding:'4px 20px 10px', fontSize:13, color:'#333', fontStyle:'italic', borderBottom:'1px solid #f0f0f0', marginBottom:6 }}>
                "{ctxMenu.msg.content.slice(0,80)}{ctxMenu.msg.content.length > 80 ? '…' : ''}"
              </div>
            )}
            <div className="modal-item" onClick={() => {
              setReplyTo(ctxMenu.msg); setCtxMenu(null)
              setTimeout(() => inputRef.current?.focus(), 100)
            }}>
              <i className="ti ti-corner-up-left" style={{ color:'#F5C842' }} />
              <span>Përgjigju</span>
            </div>
            {!ctxMenu.msg.deleted_at && (
              <div className="modal-item" onClick={() => copyMsg(ctxMenu.msg.content)}>
                <i className="ti ti-copy" />
                <span>Kopjo</span>
              </div>
            )}
            <div className="modal-item" onClick={() => { setReactionMsg(ctxMenu.msg.id); setCtxMenu(null) }}>
              <i className="ti ti-mood-smile" style={{ color:'#888' }} />
              <span>Reagim</span>
            </div>
            {ctxMenu.isOwn && !ctxMenu.msg.deleted_at && (
              <>
                <div className="modal-sep" />
                <div className="modal-item danger" onClick={() => deleteMsg(ctxMenu.msg.id)}>
                  <i className="ti ti-trash" />
                  <span>Fshi mesazhin</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info / actions bottom sheet */}
      {showInfo && selected && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px 16px' }}>
              <Avatar profile={selected.other} size={50} online={isOtherOnline} />
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#111' }}>{displayName(selected.other)}</div>
                <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>
                  {isOtherOnline ? '🟢 Online tani' : 'I fjetur'}
                </div>
              </div>
            </div>
            <div className="modal-sep" />
            <div className="modal-item" onClick={() => { setShowInfo(false); window.location.href = `/dyqane/${selected.otherId}` }}>
              <i className="ti ti-building-store" style={{ color:'#F5C842' }} />
              <span>Shiko dyqanin</span>
            </div>
            {waLink && (
              <div className="modal-item wa" onClick={() => { setShowInfo(false); setShowWhatsApp(true) }}>
                <i className="ti ti-brand-whatsapp" />
                <span>Vazhdo në WhatsApp</span>
              </div>
            )}
            <div className="modal-item" onClick={() => { setShowInfo(false); window.location.href = `/notifications` }}>
              <i className="ti ti-bell" style={{ color:'#888' }} />
              <span>Njoftimet e mia</span>
            </div>
            <div className="modal-sep" />
            {isBlocked ? (
              <div className="modal-item success" onClick={() => { setShowInfo(false); unblockUser(selected.otherId) }}>
                <i className="ti ti-lock-open" />
                <span>Hiqe bllokimin</span>
              </div>
            ) : (
              <div className="modal-item danger" onClick={() => { setShowInfo(false); setShowBlockConfirm(true) }}>
                <i className="ti ti-ban" />
                <span>Blloko përdoruesin</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp handoff */}
      {showWhatsApp && selected && waLink && (
        <div className="modal-overlay" onClick={() => setShowWhatsApp(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ padding:'4px 20px 20px', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:12 }}>💬</div>
              <div style={{ fontWeight:700, fontSize:16, color:'#111', marginBottom:8 }}>Vazhdo në WhatsApp</div>
              <div style={{ fontSize:13, color:'#888', lineHeight:1.7, marginBottom:20 }}>
                Do të hapësh WhatsApp për të biseduar me <strong>{displayName(selected.other)}</strong>.
              </div>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                style={{ display:'block', background:'#25D366', color:'#fff', textDecoration:'none', padding:'14px', borderRadius:14, fontWeight:700, fontSize:15, marginBottom:12 }}
                onClick={() => setShowWhatsApp(false)}>
                <i className="ti ti-brand-whatsapp" style={{ marginRight:8 }} />Hap WhatsApp
              </a>
              <button style={{ width:'100%', padding:'13px', background:'#f5f5f0', border:'none', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', color:'#555', fontFamily:'inherit' }}
                onClick={() => setShowWhatsApp(false)}>Anulo</button>
            </div>
          </div>
        </div>
      )}

      {/* Block confirmation */}
      {showBlockConfirm && selected && (
        <div className="modal-center" onClick={() => setShowBlockConfirm(false)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:40, marginBottom:12 }}>🚫</div>
            <div className="confirm-title">Blloko {displayName(selected.other)}?</div>
            <div className="confirm-desc">Nëse bllokon, ai/ajo nuk mund t'ju dërgojë mesazhe.</div>
            <div className="confirm-btns">
              <button className="confirm-btn cancel" onClick={() => setShowBlockConfirm(false)}>Anulo</button>
              <button className="confirm-btn danger" onClick={blockUser}>Blloko</button>
            </div>
          </div>
        </div>
      )}

      <div className="page">
        {selected ? (
          /* ════ CHAT VIEW ════ */
          <>
            <div className="topbar">
              <button className="back-btn" onClick={back}><i className="ti ti-arrow-left" /></button>
              <Avatar profile={selected.other} size={38} online={isOtherOnline} />
              <div className="t-meta">
                <div className="t-name">{displayName(selected.other)}</div>
                <div className="t-sub">
                  {typingVisible
                    ? <><span className="online-dot" style={{ background:'#F5C842' }} />Po shkruan...</>
                    : isOtherOnline
                      ? <><span className="online-dot" />Online tani</>
                      : 'I fjetur'}
                </div>
              </div>
              <div className="t-actions">
                {waLink && (
                  <button className="t-action-btn" onClick={() => setShowWhatsApp(true)} title="WhatsApp">
                    <i className="ti ti-brand-whatsapp" style={{ color:'#25D366' }} />
                  </button>
                )}
                <button className="t-action-btn" onClick={() => setShowInfo(true)} title="Opsione">
                  <i className="ti ti-dots-vertical" />
                </button>
              </div>
            </div>

            <div className="chat-wrap" style={{ position:'relative' }}>
              <div className="msgs-area" ref={msgsRef}>
                {isBlocked && (
                  <div style={{ background:'#fff3f0', borderRadius:12, padding:'10px 14px', margin:'8px 0', textAlign:'center', fontSize:12, color:'#E63312' }}>
                    🚫 Ke bllokuar këtë përdorues
                  </div>
                )}
                {messages.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px 20px', color:'#bbb', fontSize:12 }}>
                    <div style={{ fontSize:44, marginBottom:12 }}>👋</div>
                    <div style={{ fontWeight:700, color:'#999', marginBottom:4 }}>Fillo bisedën me {displayName(selected.other)}</div>
                    <div>Mesazhet janë private dhe të sigurta</div>
                  </div>
                )}

                {groups.map((g, gi) => (
                  <div key={gi}>
                    <div className="day-sep"><span>{g.date}</span></div>
                    {g.items.map((m, mi) => {
                      const mine   = m.sender_id === user?.id
                      const items  = g.items
                      const isLast = mi === items.length-1 || items[mi+1].sender_id !== m.sender_id
                      const isDeleted = !!m.deleted_at

                      return (
                        <div key={m.id} className={`msg-row ${mine ? 'mine' : 'theirs'}`}>
                          {!mine && (isLast ? <Avatar profile={selected.other} size={28} /> : <div className="av-spacer" />)}
                          <div className="bubble-wrap">
                            <div
                              className={`bubble ${m.id?.toString().startsWith('tmp') ? 'tmp' : ''} ${isDeleted ? 'deleted' : ''}`}
                              onTouchStart={() => !isDeleted && startPress(m, mine)}
                              onTouchEnd={endPress}
                              onTouchMove={endPress}
                              onContextMenu={e => { e.preventDefault(); if (!isDeleted) setCtxMenu({ msg: m, isOwn: mine }) }}
                              onDoubleClick={() => !isDeleted && setReactionMsg(m.id)}
                            >
                              {/* Reply preview */}
                              {m.reply_msg && !isDeleted && (
                                <div className="reply-preview">
                                  <div className="reply-preview-name">
                                    {m.reply_msg.sender_id === user?.id ? 'Unë' : displayName(selected.other)}
                                  </div>
                                  <div className="reply-preview-text">{m.reply_msg.content?.slice(0,80)}</div>
                                </div>
                              )}

                              {isDeleted ? (
                                <span style={{ fontStyle:'italic', opacity:.6, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                                  <i className="ti ti-ban" style={{ fontSize:12 }} /> Mesazhi u fshi
                                </span>
                              ) : m.content}

                              {isLast && !isDeleted && (
                                <div className="btime">
                                  {fullTime(m.created_at)}
                                  {mine && (
                                    <i className={`ti ${m.read ? 'ti-checks' : 'ti-check'}`}
                                      style={{ color: m.read ? '#3B82F6' : 'rgba(0,0,0,.3)' }}
                                      title={m.read ? 'Lexuar' : 'Dërguar'} />
                                  )}
                                </div>
                              )}
                            </div>
                            {m.reaction && !isDeleted && (
                              <div className="reaction-badge" onClick={() => setReactionMsg(m.id)}>{m.reaction}</div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {typingVisible && (
                  <div className="typing-row">
                    <Avatar profile={selected.other} size={28} online={isOtherOnline} />
                    <div className="typing-bubble">
                      <span className="tdot" /><span className="tdot" /><span className="tdot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} style={{ height:4 }} />
              </div>

              {showScrollBtn && (
                <button className="scroll-btn" onClick={() => { userScrolledUp.current = false; scrollBottom() }}>
                  <i className="ti ti-chevron-down" />
                </button>
              )}

              {isBlocked ? (
                <div className="blocked-bar">
                  <p>Ke bllokuar këtë përdorues.</p>
                  <button className="unblock-btn" onClick={() => unblockUser(selected.otherId)}>Hiqe bllokimin</button>
                </div>
              ) : (
                <>
                  {/* Reply strip */}
                  {replyTo && (
                    <div className="reply-strip">
                      <i className="ti ti-corner-up-left" style={{ color:'#F5C842', fontSize:16, flexShrink:0 }} />
                      <div className="reply-strip-bar">
                        <div className="reply-strip-name">
                          {replyTo.sender_id === user?.id ? 'Unë' : displayName(selected.other)}
                        </div>
                        <div className="reply-strip-text">{replyTo.content?.slice(0,80)}</div>
                      </div>
                      <button className="reply-close" onClick={() => setReplyTo(null)}>✕</button>
                    </div>
                  )}

                  {/* Emoji picker panel */}
                  {emojiOpen && (
                    <div className="emoji-panel">
                      {EMOJI_PICKER.map(e => (
                        <button key={e} className="ep-btn"
                          onClick={() => { setDraft(d => d + e); inputRef.current?.focus() }}>
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input bar */}
                  <div className="input-bar">
                    <button className="emoji-btn" onClick={() => { setEmojiOpen(o => !o); inputRef.current?.focus() }}>
                      {emojiOpen ? '⌨️' : '😊'}
                    </button>
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
                        onFocus={() => setEmojiOpen(false)}
                      />
                    </div>
                    <button className="send-btn" onClick={send} disabled={!draft.trim() || sending}>
                      <i className={`ti ti-${sending ? 'loader-2' : 'send'}`}
                        style={sending ? { animation:'spin .7s linear infinite' } : {}} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        ) : (
          /* ════ THREAD LIST ════ */
          <>
            <div className="topbar">
              <button className="back-btn" onClick={() => window.location.href = '/'}><i className="ti ti-arrow-left" /></button>
              <div className="t-meta">
                <div className="t-name">
                  Mesazhet
                  {totalUnread > 0 && (
                    <span style={{ background:'#E63312', color:'#fff', borderRadius:10, padding:'1px 8px', fontSize:10, fontWeight:700, marginLeft:8 }}>{totalUnread}</span>
                  )}
                </div>
              </div>
              <button className="t-action-btn" onClick={() => window.location.href = '/notifications'} title="Njoftimet">
                <i className="ti ti-bell" />
              </button>
            </div>

            <div className="search-wrap">
              <div className="search-inner">
                <i className="ti ti-search" />
                <input placeholder="Kërko bisedë..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="spin-center"><span className="spinner" />Duke ngarkuar...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="empty">
                <div className="empty-emoji">{search ? '🔍' : '💬'}</div>
                <h3>{search ? 'Nuk u gjet asgjë' : 'Nuk ke mesazhe akoma'}</h3>
                <p>
                  {search
                    ? `Nuk ka bisedë me "${search}"`
                    : 'Kontakto shitësin nga ndonjë shpallje dhe biseda shfaqet këtu.'}
                </p>
                {!search && (
                  <button className="empty-cta" onClick={() => window.location.href = '/'}>Shfleto shpalljet →</button>
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
                        {t.lastMsg?.deleted_at
                          ? '🚫 Mesazhi u fshi'
                          : t.lastMsg?.content?.slice(0, 55) || 'Fillo bisedën...'}
                      </div>
                    </div>
                    <div className="t-right">
                      <div className="t-time">{t.lastMsg ? timeStr(t.lastMsg.created_at) : ''}</div>
                      {t.unread > 0 && <div className="t-badge">{t.unread}</div>}
                    </div>
                  </div>
                ))}
                <div style={{ height:80 }} />
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

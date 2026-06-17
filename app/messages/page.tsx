'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'
import AlpazarAvatar from '../components/Avatar'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const displayName = (p: any) => p?.full_name || p?.username || 'Përdorues'
const initials    = (p: any) => (p?.full_name || p?.username || '?').slice(0, 2).toUpperCase()

function timeStr(d: string) {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000)    return 'Tani'
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m`
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h`
  return `${new Date(d).getDate()}/${new Date(d).getMonth()+1}`
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
function fmtDur(s: number) {
  return `${Math.floor(s/60)}:${String(Math.floor(s % 60)).padStart(2,'0')}`
}

const EMOJI_QUICK = ['❤️','👍','😂','😮','😢','🙏','🔥','👋']
const EMOJI_FULL  = [
  '😊','😂','❤️','👍','🔥','😍','🥺','😭','🙏','✅',
  '👋','😎','🤔','💯','🎉','🥰','😢','💪','👀','😁',
  '🤣','🙌','⭐','✨','💎','🚀','👑','💰','😀','🥳',
  '🤝','💙','😇','💫','🌟','🫶','😅','🤩','😜','🥹',
]

// Decorative waveform heights for audio bubbles
const WAVE = [3,6,4,8,5,10,7,12,6,9,4,11,8,5,10,7,3,9,6,12,5,8,4,10,7,5,9,3,6,4]

// ─── AudioPlayer ──────────────────────────────────────────────────────────────

function AudioPlayer({ url, mine }: { url: string; mine: boolean }) {
  const [playing,  setPlaying]  = useState(false)
  const [progress, setProgress] = useState(0)
  const [dur,      setDur]      = useState(0)
  const [cur,      setCur]      = useState(0)
  const ref = useRef<HTMLAudioElement>(null)

  const toggle = () => {
    const a = ref.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().catch(() => {}); setPlaying(true) }
  }
  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = ref.current; if (!a || !a.duration) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration
  }

  const accent = mine ? '#F5C842' : '#E63312'
  const track  = mine ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.1)'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:200 }}>
      <button onClick={toggle} style={{
        width:40, height:40, borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:0,
        background: mine ? 'rgba(245,200,66,.22)' : 'rgba(230,51,18,.12)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <i className={`ti ti-${playing ? 'player-pause-filled' : 'player-play-filled'}`}
          style={{ fontSize:19, color: mine ? '#F5C842' : '#E63312' }} />
      </button>

      <div style={{ flex:1 }}>
        {/* Waveform */}
        <div style={{ display:'flex', alignItems:'center', gap:1.5, height:22, marginBottom:4 }}>
          {WAVE.map((h, i) => (
            <div key={i} style={{
              width:2.5, height: h * 1.5, borderRadius:3, flexShrink:0,
              background: dur > 0 && (i/WAVE.length) <= (cur/dur) ? accent : track,
            }} />
          ))}
        </div>
        {/* Seekbar */}
        <div onClick={seek} style={{ height:3, background:track, borderRadius:4, cursor:'pointer', overflow:'hidden' }}>
          <div style={{ width:`${progress}%`, height:'100%', background:accent, borderRadius:4 }} />
        </div>
        <div style={{ fontSize:9, marginTop:3, color: mine ? 'rgba(245,200,66,.7)' : '#999' }}>
          {playing ? fmtDur(cur) : (dur ? fmtDur(dur) : '0:00')}
        </div>
      </div>

      <audio ref={ref} src={url}
        onTimeUpdate={e => { const a = e.target as HTMLAudioElement; setCur(a.currentTime); setProgress((a.currentTime/a.duration)*100||0) }}
        onLoadedMetadata={e => setDur((e.target as HTMLAudioElement).duration)}
        onEnded={() => { setPlaying(false); setProgress(0); setCur(0) }}
      />
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ profile, size = 46, online = false }: { profile: any; size?: number; online?: boolean }) {
  const name = profile?.shop_name || profile?.full_name || profile?.username
  return (
    <div style={{ position:'relative', flexShrink:0 }}>
      <AlpazarAvatar
        src={profile?.avatar_url}
        name={name}
        type={profile?.shop_name ? 'business' : profile?.is_premium ? 'premium' : 'user'}
        verified={(profile?.trust_score ?? 0) >= 60}
        size={size}
      />
      {online && <span style={{ position:'absolute', bottom:1, right:1, width:Math.max(size*.22,8), height:Math.max(size*.22,8), borderRadius:'50%', background:'#22c55e', border:'2px solid #FFFBEA' }} />}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user: ctxUser, refreshUnread, decrementUnread } = useAlpazar()

  const [user,           setUser]           = useState<any>(null)
  const [threads,        setThreads]        = useState<any[]>([])
  const [selected,       setSelected]       = useState<any>(null)
  const [messages,       setMessages]       = useState<any[]>([])
  const [draft,          setDraft]          = useState('')
  const [sending,        setSending]        = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [loadError,      setLoadError]      = useState(false)
  const [search,         setSearch]         = useState('')
  const [typingVisible,  setTypingVisible]  = useState(false)
  const [onlineIds,      setOnlineIds]      = useState<Set<string>>(new Set())
  const [showScrollBtn,  setShowScrollBtn]  = useState(false)
  const [reactionMsg,    setReactionMsg]    = useState<string|null>(null)
  const [otherPhone,     setOtherPhone]     = useState<string|null>(null)
  const [showInfo,       setShowInfo]       = useState(false)
  const [showWhatsApp,   setShowWhatsApp]   = useState(false)
  const [showViber,      setShowViber]      = useState(false)
  const [blockedIds,     setBlockedIds]     = useState<Set<string>>(new Set())
  const [showBlockConf,  setShowBlockConf]  = useState(false)
  const [replyTo,        setReplyTo]        = useState<any>(null)
  const [ctxMenu,        setCtxMenu]        = useState<any>(null)
  const [emojiOpen,      setEmojiOpen]      = useState(false)

  // Multi-select
  const [selectMode,    setSelectMode]    = useState(false)
  const [selectedMsgs,  setSelectedMsgs]  = useState<Set<string>>(new Set())

  // Voice recording
  const [recording,     setRecording]     = useState(false)
  const [recTime,       setRecTime]       = useState(0)
  const [recCanceled,   setRecCanceled]   = useState(false)

  // Image attachment
  const [imgPreview,    setImgPreview]    = useState<{file:File; url:string}|null>(null)
  const [uploading,     setUploading]     = useState(false)
  const [uploadErr,     setUploadErr]     = useState('')

  // Lightbox
  const [lightbox, setLightbox] = useState<string|null>(null)

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
  const mediaRecRef    = useRef<MediaRecorder|null>(null)
  const audioChunks    = useRef<Blob[]>([])
  const recTimerRef    = useRef<any>(null)
  const fileInputRef   = useRef<HTMLInputElement>(null)
  const msgRefs        = useRef<Map<string, HTMLDivElement>>(new Map())
  const swipeState     = useRef<{sx:number; sy:number; id:string|null}>({ sx:0, sy:0, id:null })
  const recCanceledRef = useRef(false)

  useEffect(() => { userRef.current = user }, [user])
  useEffect(() => { selectedRef.current = selected }, [selected])

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function init(myId: string) {
      try {
        await Promise.all([fetchThreads(myId), fetchBlocked(myId)])
      } catch {
        setLoadError(true); setLoading(false); return
      }
      const withId = new URLSearchParams(window.location.search).get('with')
      if (withId) openThreadById(withId, myId)

      const inbox = supabase.channel(`inbox-${myId}`)
        .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${myId}` }, payload => {
          const m = payload.new as any
          setThreads(prev => {
            const idx = prev.findIndex(t => t.otherId === m.sender_id)
            if (idx === -1) { fetchThreads(myId); return prev }
            const t = { ...prev[idx], lastMsg: m }
            if (selectedRef.current?.otherId !== m.sender_id) t.unread = (t.unread || 0) + 1
            const up = [...prev]; up.splice(idx, 1)
            return [t, ...up]
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      if (!s) window.location.href = '/auth/login'
    })
    return () => {
      subscription.unsubscribe()
      if (channelRef.current) supabase.removeChannel(channelRef.current)
      if (inboxRef.current)   supabase.removeChannel(inboxRef.current)
    }
  }, [ctxUser])

  // ── Scroll detection ──────────────────────────────────────────────────────
  // Përdorim ref callback në vend të useEffect për të garantuar që el ekziston
  const attachScrollListener = useCallback((el: HTMLDivElement | null) => {
    (msgsRef as any).current = el
    if (!el) return
    const h = () => {
      const fb = el.scrollHeight - el.scrollTop - el.clientHeight
      setShowScrollBtn(fb > 120)
      userScrolledUp.current = fb > 80
    }
    el.addEventListener('scroll', h, { passive: true })
    // Cleanup ruhet si property e elementit
    ;(el as any)._scrollCleanup = () => el.removeEventListener('scroll', h)
  }, [])

  // Pastro listener-in kur elementi del
  useEffect(() => {
    return () => {
      const el = msgsRef.current as any
      if (el?._scrollCleanup) el._scrollCleanup()
    }
  }, [selected])

  // Scroll në fund direkt nëpërmjet ref (pa scrollIntoView)
  const scrollBottom = useCallback((smooth = true) => {
    const el = msgsRef.current
    if (!el) return
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  useEffect(() => {
    const n = messages.length
    if (n > prevMsgCount.current && !userScrolledUp.current)
      scrollBottom(n > prevMsgCount.current + 1 ? false : true)
    prevMsgCount.current = n
  }, [messages, scrollBottom])

  // ── Fetch threads ─────────────────────────────────────────────────────────
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
    const { data } = await supabase.from('profiles').select('id,full_name,username,avatar_url').eq('id', otherId).single()
    if (data) openThread({ otherId, other: data, lastMsg: null, unread: 0 }, uid)
  }

  async function openThread(thread: any, uid?: string) {
    const myId = uid || userRef.current?.id
    setSelected(thread); selectedRef.current = thread
    setOtherPhone(null); setShowInfo(false); setReplyTo(null); setEmojiOpen(false)
    setSelectMode(false); setSelectedMsgs(new Set())
    setImgPreview(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
    userScrolledUp.current = false; prevMsgCount.current = 0
    // Clear badge immediately — don't wait for DB roundtrip
    const threadUnread = thread.unread || 0
    decrementUnread(threadUnread)
    setThreads(prev => prev.map(t => t.otherId === thread.otherId ? { ...t, unread: 0 } : t))

    const [{ data: msgs }, { data: pData }] = await Promise.all([
      supabase.from('messages')
        .select('*,reply_msg:reply_to_id(id,content,sender_id,type,attachment_url)')
        .or(`and(sender_id.eq.${myId},receiver_id.eq.${thread.otherId}),and(sender_id.eq.${thread.otherId},receiver_id.eq.${myId})`)
        .order('created_at', { ascending: true }),
      supabase.from('profiles').select('phone').eq('id', thread.otherId).single(),
    ])

    if (msgs) { setMessages(msgs); prevMsgCount.current = msgs.length; setTimeout(() => scrollBottom(false), 50) }
    if (pData?.phone) setOtherPhone(pData.phone)
    const now = new Date().toISOString()
    await Promise.all([
      supabase.from('messages').update({ read: true })
        .eq('receiver_id', myId).eq('sender_id', thread.otherId).eq('read', false),
      // Mark both link formats (two different DB triggers create notifs with different links)
      supabase.from('notifications').update({ is_read: true, read_at: now })
        .eq('user_id', myId).eq('type', 'new_message').eq('is_read', false)
        .or(`link.eq./messages,link.eq./messages?with=${thread.otherId}`),
    ])
    if (myId) await refreshUnread(myId)
    subscribeToThread(thread.otherId, myId)
    setTimeout(() => inputRef.current?.focus(), 200)
  }

  // ── Realtime ──────────────────────────────────────────────────────────────
  function subscribeToThread(otherId: string, myId: string) {
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel(`chat-${[myId,otherId].sort().join('-')}`)
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'messages', filter:`receiver_id=eq.${myId}` }, p => {
        const m = p.new as any
        if (m.sender_id !== selectedRef.current?.otherId) return
        setMessages(prev => prev.find(x => x.id === m.id) ? prev : [...prev, m])
        // Mark read immediately & decrement badge (context INSERT handler already incremented it)
        decrementUnread(1)
        supabase.from('messages').update({ read: true }).eq('id', m.id).then()
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'messages', filter:`sender_id=eq.${myId}` }, p => {
        const m = p.new as any; if (m.receiver_id !== otherId) return
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, read: m.read, reaction: m.reaction, deleted_at: m.deleted_at, content: m.content } : x))
      })
      .on('postgres_changes', { event:'UPDATE', schema:'public', table:'messages', filter:`receiver_id=eq.${myId}` }, p => {
        const m = p.new as any; if (m.sender_id !== otherId) return
        setMessages(prev => prev.map(x => x.id === m.id ? { ...x, reaction: m.reaction, deleted_at: m.deleted_at } : x))
      })
      .on('broadcast', { event:'typing' }, ({ payload }: any) => {
        if (payload.userId !== otherId) return
        setTypingVisible(true); clearTimeout(typingTimer.current)
        typingTimer.current = setTimeout(() => setTypingVisible(false), 2500)
      })
      .on('presence', { event:'sync' }, () => {
        const state = ch.presenceState<{userId:string}>()
        setOnlineIds(new Set(Object.values(state).flat().map((p: any) => p.userId)))
      })
      .subscribe(async s => { if (s === 'SUBSCRIBED') await ch.track({ userId: myId }) })
    channelRef.current = ch
  }

  // ── Send text ─────────────────────────────────────────────────────────────
  async function send() {
    const text = draft.trim(); if (!text || !selected || sending) return
    const rep = replyTo
    setSending(true); setDraft(''); setReplyTo(null); setEmojiOpen(false)
    if (inputRef.current) inputRef.current.style.height = 'auto'
    userScrolledUp.current = false

    const opt: any = {
      id: `tmp-${Date.now()}`, sender_id: userRef.current?.id, receiver_id: selected.otherId,
      content: text, type: 'text', created_at: new Date().toISOString(), read: false,
      reply_msg: rep, reply_to_id: rep?.id ?? null,
    }
    setMessages(prev => [...prev, opt])

    const { data, error } = await supabase.from('messages')
      .insert({ sender_id: userRef.current?.id, receiver_id: selected.otherId, content: text, type: 'text', ...(rep ? { reply_to_id: rep.id } : {}) })
      .select('*,reply_msg:reply_to_id(id,content,sender_id,type,attachment_url)').single()

    if (data) setMessages(prev => prev.map(m => m.id === opt.id ? data : m))
    else if (error) { setMessages(prev => prev.filter(m => m.id !== opt.id)); setDraft(text); setReplyTo(rep) }
    setSending(false)
    fetchThreads(userRef.current?.id)
  }

  // ── Send image ────────────────────────────────────────────────────────────
  async function sendImage() {
    if (!imgPreview || !selected) return
    setUploading(true)
    const f    = imgPreview.file
    const ext  = f.name.split('.').pop() || 'jpg'
    const path = `images/${userRef.current?.id}/${Date.now()}.${ext}`
    const rep  = replyTo

    const { error } = await supabase.storage.from('message-attachments').upload(path, f, { contentType: f.type })
    if (error) { setUploading(false); setUploadErr('Nuk u ngarkua foto: ' + (error.message || 'gabim storage')); return }

    const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path)

    const opt: any = {
      id: `tmp-${Date.now()}`, sender_id: userRef.current?.id, receiver_id: selected.otherId,
      content: '', type: 'image', attachment_url: imgPreview.url,
      created_at: new Date().toISOString(), read: false,
      reply_msg: rep, reply_to_id: rep?.id ?? null,
    }
    setMessages(prev => [...prev, opt])
    URL.revokeObjectURL(imgPreview.url)
    setImgPreview(null); setReplyTo(null)

    await supabase.from('messages').insert({
      sender_id: userRef.current?.id, receiver_id: selected.otherId,
      content: '', type: 'image', attachment_url: urlData.publicUrl,
      ...(rep ? { reply_to_id: rep.id } : {}),
    })
    setUploading(false)
    fetchThreads(userRef.current?.id)
  }

  // ── Voice recording ───────────────────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime   = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const mr     = new MediaRecorder(stream, { mimeType: mime })
      audioChunks.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunks.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (!recCanceledRef.current) {
          const blob = new Blob(audioChunks.current, { type: mime })
          await uploadAudio(blob, mime)
        }
        recCanceledRef.current = false
        setRecCanceled(false)
      }
      mr.start(100)
      mediaRecRef.current = mr
      setRecording(true); setRecTime(0)
      recTimerRef.current = setInterval(() => setRecTime(t => t + 1), 1000)
    } catch { setUploadErr('Lejo aksesin te mikrofoni') }
  }

  function stopRecording(cancel = false) {
    clearInterval(recTimerRef.current)
    setRecording(false)
    recCanceledRef.current = cancel
    mediaRecRef.current?.stop()
  }

  async function uploadAudio(blob: Blob, mimeType: string) {
    if (!selected) return
    const ext  = mimeType.includes('webm') ? 'webm' : 'ogg'
    const path = `voices/${userRef.current?.id}/${Date.now()}.${ext}`
    const rep  = replyTo

    const { error } = await supabase.storage.from('message-attachments').upload(path, blob, { contentType: mimeType })
    if (error) { setUploadErr('Nuk u ngarkua audio: ' + (error.message || 'gabim storage')); return }

    const { data: urlData } = supabase.storage.from('message-attachments').getPublicUrl(path)

    const opt: any = {
      id: `tmp-${Date.now()}`, sender_id: userRef.current?.id, receiver_id: selected.otherId,
      content: '', type: 'audio', attachment_url: urlData.publicUrl,
      created_at: new Date().toISOString(), read: false,
      reply_msg: rep, reply_to_id: rep?.id ?? null,
    }
    setMessages(prev => [...prev, opt])
    setReplyTo(null)

    await supabase.from('messages').insert({
      sender_id: userRef.current?.id, receiver_id: selected.otherId,
      content: '', type: 'audio', attachment_url: urlData.publicUrl,
      ...(rep ? { reply_to_id: rep.id } : {}),
    })
    fetchThreads(userRef.current?.id)
  }

  // ── Reactions ─────────────────────────────────────────────────────────────
  async function sendReaction(msgId: string, emoji: string) {
    setReactionMsg(null); setCtxMenu(null)
    const prev_r = messages.find(m => m.id === msgId)?.reaction ?? null
    const newR   = prev_r === emoji ? null : emoji
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reaction: newR } : m))
    await supabase.from('messages').update({ reaction: newR }).eq('id', msgId)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteMsg(msgId: string) {
    setCtxMenu(null)
    const ts = new Date().toISOString()
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, deleted_at: ts } : m))
    await supabase.from('messages').update({ deleted_at: ts }).eq('id', msgId).eq('sender_id', userRef.current?.id)
  }

  async function deleteSelected() {
    const ids = Array.from(selectedMsgs)
    const ts  = new Date().toISOString()
    setMessages(prev => prev.map(m => ids.includes(m.id) && m.sender_id === userRef.current?.id ? { ...m, deleted_at: ts } : m))
    await Promise.all(ids.map(id =>
      supabase.from('messages').update({ deleted_at: ts }).eq('id', id).eq('sender_id', userRef.current?.id)
    ))
    setSelectMode(false); setSelectedMsgs(new Set())
  }

  async function copyMsg(content: string) {
    setCtxMenu(null); try { await navigator.clipboard.writeText(content) } catch {}
  }

  // ── Swipe-to-reply (direct DOM) ───────────────────────────────────────────
  function onMsgTouchStart(e: React.TouchEvent, msgId: string) {
    const t = e.touches[0]
    swipeState.current = { sx: t.clientX, sy: t.clientY, id: msgId }
    startPress(msgId)
  }

  function onMsgTouchMove(e: React.TouchEvent, msgId: string) {
    const { sx, sy, id } = swipeState.current; if (!id || id !== msgId) return
    const t  = e.touches[0]
    const dx = t.clientX - sx
    const dy = t.clientY - sy
    if (Math.abs(dy) > Math.abs(dx) * 1.3 || dx < 5) return
    clearTimeout(longPressTimer.current)
    const offset = Math.min(dx, 76)
    const el = msgRefs.current.get(msgId); if (!el) return
    el.style.transform = `translateX(${offset}px)`
    el.style.transition = 'none'
    const icon = el.querySelector('.swipe-icon') as HTMLElement
    if (icon) { icon.style.opacity = String(Math.min(offset/60, 1)); icon.style.transform = `scale(${Math.min(offset/60, 1)})` }
  }

  function onMsgTouchEnd(e: React.TouchEvent, msg: any) {
    clearTimeout(longPressTimer.current)
    const { id } = swipeState.current; if (!id) return
    const el = msgRefs.current.get(id)
    if (el) {
      const cur = parseFloat(el.style.transform.replace(/[^0-9.]/g, '') || '0')
      if (cur >= 60) {
        setReplyTo(msg)
        if ('vibrate' in navigator) navigator.vibrate(25)
        setTimeout(() => inputRef.current?.focus(), 120)
      }
      el.style.transition = 'transform .22s cubic-bezier(.4,0,.2,1)'
      el.style.transform  = 'translateX(0)'
      const icon = el.querySelector('.swipe-icon') as HTMLElement
      if (icon) { icon.style.opacity = '0'; icon.style.transform = 'scale(0)' }
    }
    swipeState.current = { sx:0, sy:0, id:null }
  }

  // ── Scroll to original message ────────────────────────────────────────────
  function scrollToMsg(msgId: string) {
    const el = document.getElementById(`msg-${msgId}`); if (!el) return
    el.scrollIntoView({ behavior:'smooth', block:'center' })
    el.style.transition = 'background .15s'
    el.style.background = 'rgba(245,200,66,.4)'
    el.style.borderRadius = '14px'
    setTimeout(() => { el.style.background = ''; el.style.borderRadius = '' }, 900)
  }

  // ── Long press ────────────────────────────────────────────────────────────
  function startPress(msgId: string) {
    clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      const msg    = messages.find(m => m.id === msgId); if (!msg) return
      const isOwn  = msg.sender_id === userRef.current?.id
      if (selectMode) { toggleSelect(msgId, isOwn) } else {
        if ('vibrate' in navigator) navigator.vibrate(30)
        setCtxMenu({ msg, isOwn })
      }
    }, 480)
  }
  function endPress() { clearTimeout(longPressTimer.current) }

  function toggleSelect(msgId: string, isOwn: boolean) {
    if (!isOwn) return
    setSelectedMsgs(prev => { const s = new Set(prev); s.has(msgId) ? s.delete(msgId) : s.add(msgId); return s })
  }

  // ── Typing ────────────────────────────────────────────────────────────────
  function onTyping() {
    if (!channelRef.current || !selected) return
    channelRef.current.send({ type:'broadcast', event:'typing', payload:{ userId: userRef.current?.id } })
  }

  // ── Block ─────────────────────────────────────────────────────────────────
  async function blockUser() {
    const myId = userRef.current?.id, otherId = selected?.otherId; if (!myId || !otherId) return
    setShowBlockConf(false)
    await supabase.from('blocks').upsert({ blocker_id: myId, blocked_id: otherId }, { onConflict: 'blocker_id,blocked_id' })
    setBlockedIds(prev => new Set([...prev, otherId])); back()
  }
  async function unblockUser(otherId: string) {
    const myId = userRef.current?.id; if (!myId) return
    await supabase.from('blocks').delete().eq('blocker_id', myId).eq('blocked_id', otherId)
    setBlockedIds(prev => { const s = new Set(prev); s.delete(otherId); return s })
    fetchThreads(myId)
  }

  // ── Back ──────────────────────────────────────────────────────────────────
  function back() {
    setSelected(null); setShowInfo(false); setOtherPhone(null)
    setReplyTo(null); setEmojiOpen(false); setSelectMode(false); setSelectedMsgs(new Set())
    setImgPreview(prev => { if (prev) URL.revokeObjectURL(prev.url); return null })
    setRecording(false); clearInterval(recTimerRef.current)
    userScrolledUp.current = false; prevMsgCount.current = 0
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    setTypingVisible(false); fetchThreads(userRef.current?.id)
  }

  // ── Build day groups ──────────────────────────────────────────────────────
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

  // ── Derived ───────────────────────────────────────────────────────────────
  const isBlocked       = selected ? blockedIds.has(selected.otherId) : false
  const filteredThreads = threads.filter(t => !search.trim() || displayName(t.other).toLowerCase().includes(search.toLowerCase()))
  const totalUnread     = threads.reduce((s, t) => s + t.unread, 0)
  const isOtherOnline   = selected ? onlineIds.has(selected.otherId) : false
  const groups          = buildGroups(messages)
  const waPhone         = otherPhone?.replace(/\D/g,'')
  const waLink          = waPhone ? `https://wa.me/${waPhone}` : null
  const viberLink       = waPhone ? `viber://chat?number=%2B${waPhone}` : null
  const canSend         = (draft.trim() || imgPreview) && !sending && !uploading

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
        /* Fixed overlay — qëndron brenda viewport pavarësisht nga prindërit */
        .page{position:fixed;inset:0;max-width:480px;margin:0 auto;display:flex;flex-direction:column;background:#FFFBEA;overflow:hidden;z-index:50;}

        /* Topbar */
        .topbar{background:#111;padding:0 10px;display:flex;align-items:center;gap:9px;height:58px;flex-shrink:0;border-bottom:1px solid #222;z-index:10;}
        .topbar.chat{background:linear-gradient(135deg,#1a1a1a 0%,#222 100%);}
        .back-btn{width:36px;height:36px;background:rgba(255,255,255,.06);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#F5C842;font-size:19px;}
        .t-meta{flex:1;min-width:0;}
        .t-name{font-size:15px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .t-sub{font-size:10px;color:#888;margin-top:1px;display:flex;align-items:center;gap:4px;}
        .online-dot{width:7px;height:7px;border-radius:50%;background:#22c55e;flex-shrink:0;}
        .t-actions{display:flex;gap:4px;}
        .t-action-btn{width:34px;height:34px;background:rgba(255,255,255,.06);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:17px;}
        .t-action-btn:hover{background:rgba(255,255,255,.12);}

        /* Search */
        .search-wrap{background:#111;padding:6px 12px 10px;flex-shrink:0;border-bottom:1px solid #1c1c1c;}
        .search-inner{background:#1c1c1c;border-radius:12px;display:flex;align-items:center;padding:0 12px;gap:8px;}
        .search-inner i{font-size:13px;color:#555;}
        .search-inner input{border:none;background:transparent;font-size:12px;color:#eee;outline:none;flex:1;padding:9px 0;font-family:inherit;}
        .search-inner input::placeholder{color:#444;}

        .threads-scroll::-webkit-scrollbar{width:3px;}
        .threads-scroll::-webkit-scrollbar-thumb{background:#ddd;border-radius:10px;}
        .thread{display:flex;align-items:center;gap:12px;padding:13px 14px;cursor:pointer;border-bottom:0.5px solid #f0ece0;transition:background .1s;position:relative;border-left:3px solid transparent;}
        .thread:active{background:#FFF8E0;}
        .thread.unread-thread{border-left-color:#E63312;background:#FFFAF5;}
        .t-info{flex:1;min-width:0;}
        .t-thread-name{font-size:13.5px;font-weight:700;color:#111;margin-bottom:3px;}
        .t-preview{font-size:11.5px;color:#aaa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .t-preview.unread{color:#333;font-weight:600;}
        .t-right{text-align:right;flex-shrink:0;}
        .t-time{font-size:10px;color:#bbb;}
        .t-badge{background:#E63312;color:#fff;border-radius:12px;min-width:20px;height:20px;padding:0 6px;font-size:9px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;margin-top:4px;}
        .fab{position:absolute;bottom:20px;right:16px;width:52px;height:52px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(230,51,18,.4);z-index:10;}
        .fab i{font-size:22px;color:#fff;}

        /* Empty */
        .empty{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px 24px;text-align:center;}
        .empty-emoji{font-size:62px;margin-bottom:16px;}
        .empty h3{font-size:16px;font-weight:700;color:#555;margin-bottom:8px;}
        .empty p{font-size:12px;color:#aaa;line-height:1.8;margin-bottom:20px;}
        .empty-cta{background:#111;color:#F5C842;border:none;border-radius:12px;padding:13px 26px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;}

        /* Chat area */
        .chat-wrap{flex:1;display:flex;flex-direction:column;overflow:hidden;min-height:0;}
        /* height:0 + flex:1 është mënyra e garantuar për scroll brenda flex */
        .msgs-area{
          flex:1;height:0;overflow-y:scroll;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;
          padding:8px 10px 6px;display:flex;flex-direction:column;gap:1px;
          background-color:#EDE6D0;
          background-image:url("data:image/svg+xml,%3Csvg width='44' height='44' viewBox='0 0 44 44' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M22 2 L42 22 L22 42 L2 22 Z' fill='none' stroke='%23b09a72' stroke-width='0.7' opacity='0.28'/%3E%3Cpath d='M22 12 L32 22 L22 32 L12 22 Z' fill='none' stroke='%23b09a72' stroke-width='0.4' opacity='0.18'/%3E%3C/svg%3E");
        }
        .msgs-area::-webkit-scrollbar{width:3px;}
        .msgs-area::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:10px;}

        /* Day separator */
        .day-sep{text-align:center;margin:10px 0 6px;pointer-events:none;}
        .day-sep span{background:rgba(30,20,5,.55);backdrop-filter:blur(6px);color:rgba(255,220,100,.9);font-size:10px;font-weight:700;padding:4px 14px;border-radius:12px;letter-spacing:.3px;}

        /* Message rows */
        .msg-row{display:flex;align-items:flex-end;gap:5px;margin-bottom:1px;position:relative;}
        .msg-row.mine{flex-direction:row-reverse;}
        .av-spacer{width:26px;flex-shrink:0;}

        /* Thread list — scrollable */
        .threads-scroll{flex:1;height:0;overflow-y:scroll;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;background:#FFFBEA;}

        /* Bubble wrap — touch-action:pan-y lejon scroll vertikal me gisht */
        .bwrap{display:flex;flex-direction:column;max-width:78%;position:relative;transform:translateX(0);transition:transform .22s cubic-bezier(.4,0,.2,1);touch-action:pan-y;}
        .mine .bwrap{align-items:flex-end;}
        .swipe-icon{position:absolute;left:-32px;bottom:6px;width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.18);display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0);transition:none;pointer-events:none;}
        .swipe-icon i{font-size:13px;color:#fff;}
        .mine .swipe-icon{left:auto;right:-32px;}

        /* Bubbles */
        .bubble{padding:8px 12px;font-size:13.5px;line-height:1.55;word-break:break-word;position:relative;cursor:pointer;user-select:none;-webkit-user-select:none;}
        .mine .bubble{
          background:linear-gradient(145deg,#1C1C2E,#111118);
          color:#fff;border-radius:18px 18px 2px 18px;
          box-shadow:0 3px 10px rgba(0,0,0,.28);
        }
        .theirs .bubble{
          background:#fff;color:#111;
          border-radius:18px 18px 18px 2px;
          box-shadow:0 1px 5px rgba(0,0,0,.09);
        }
        .bubble.tmp{opacity:.65;}
        .bubble.deleted{opacity:.6;}
        .bubble.sel{outline:3px solid #F5C842;outline-offset:1px;}

        /* Bubble tail */
        .mine .bubble::after{content:'';position:absolute;bottom:0;right:-7px;width:0;height:0;border-style:solid;border-width:8px 0 0 8px;border-color:transparent transparent transparent #111118;}
        .theirs .bubble::after{content:'';position:absolute;bottom:0;left:-7px;width:0;height:0;border-style:solid;border-width:8px 8px 0 0;border-color:transparent #fff transparent transparent;}
        .bubble.deleted::after{display:none;}

        /* Reply preview inside bubble */
        .rp{border-left:3px solid;padding:5px 8px 5px;margin-bottom:7px;border-radius:6px;cursor:pointer;}
        .mine .rp{border-color:rgba(245,200,66,.55);background:rgba(255,255,255,.08);}
        .theirs .rp{border-color:#E63312;background:rgba(230,51,18,.06);}
        .rp-name{font-size:10px;font-weight:700;margin-bottom:2px;opacity:.9;}
        .mine .rp-name{color:#F5C842;}
        .theirs .rp-name{color:#E63312;}
        .rp-text{font-size:11px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;opacity:.65;}
        .rp-img{width:40px;height:40px;border-radius:6px;object-fit:cover;flex-shrink:0;}

        /* Image in bubble */
        .bubble-img{border-radius:12px;max-width:100%;display:block;cursor:zoom-in;max-height:260px;object-fit:cover;width:100%;}

        /* Reaction */
        .rxn{position:absolute;bottom:-9px;right:8px;background:#fff;border:1px solid #eee;border-radius:10px;padding:1px 6px;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,.12);cursor:pointer;line-height:1.5;z-index:2;}
        .mine .rxn{right:auto;left:8px;}

        /* Timestamp + ticks */
        .btime{font-size:9.5px;color:rgba(255,255,255,.42);margin-top:4px;display:flex;align-items:center;justify-content:flex-end;gap:3px;}
        .theirs .btime{justify-content:flex-start;color:#bbb;}
        .tick{font-size:12px;}
        .tick.read{color:#F5C842;}

        /* Typing */
        .typing-row{display:flex;align-items:flex-end;gap:5px;margin-top:2px;}
        .typing-bubble{background:#fff;border-radius:16px 16px 16px 2px;padding:10px 14px;box-shadow:0 1px 4px rgba(0,0,0,.1);display:flex;gap:4px;align-items:center;}
        .tdot{width:7px;height:7px;border-radius:50%;background:#bbb;animation:tdot .9s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes tdot{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

        /* Scroll btn */
        .scroll-btn{position:absolute;bottom:68px;right:12px;width:36px;height:36px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.2);border:none;cursor:pointer;z-index:5;animation:fadeIn .2s;}
        .scroll-btn i{font-size:18px;color:#555;}

        /* Reply strip */
        .reply-strip{background:#fff;border-top:1.5px solid #EDE6D0;padding:8px 12px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .rs-bar{flex:1;border-left:3px solid #E63312;padding:0 0 0 8px;min-width:0;}
        .rs-name{font-size:11px;color:#E63312;font-weight:700;margin-bottom:1px;}
        .rs-text{font-size:11px;color:#888;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .rs-img{width:38px;height:38px;border-radius:6px;object-fit:cover;flex-shrink:0;}

        /* Image preview before send */
        .img-preview-bar{background:#fff;border-top:1.5px solid #EDE6D0;padding:8px 12px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .img-preview-thumb{width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0;}

        /* Emoji panel */
        .emoji-panel{background:#fff;border-top:1.5px solid #EDE6D0;padding:8px 10px;display:flex;flex-wrap:wrap;gap:1px;max-height:130px;overflow-y:auto;flex-shrink:0;}
        .emoji-panel::-webkit-scrollbar{width:3px;}
        .emoji-panel::-webkit-scrollbar-thumb{background:#eee;}
        .ep-btn{background:none;border:none;font-size:22px;cursor:pointer;padding:4px;border-radius:8px;line-height:1;}
        .ep-btn:hover{background:#eee;}

        /* Input bar */
        .input-bar{background:#fff;border-top:1.5px solid #EDE6D0;padding:8px 10px;display:flex;gap:8px;align-items:flex-end;flex-shrink:0;}
        .input-wrap{flex:1;background:#F5F0E6;border:1.5px solid transparent;border-radius:22px;display:flex;align-items:flex-end;padding:0 12px;gap:6px;transition:border-color .15s,background .15s;}
        .input-wrap:focus-within{border-color:#F5C842;background:#fff;}
        .input-wrap textarea{border:none;background:transparent;font-size:13.5px;color:#111;outline:none;flex:1;resize:none;min-height:20px;max-height:90px;line-height:1.5;padding:10px 0;font-family:inherit;}
        .input-wrap textarea::placeholder{color:#bbb;}
        .emoji-btn{width:30px;height:30px;border:none;background:none;cursor:pointer;font-size:21px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-bottom:8px;}
        .attach-btn{width:32px;height:32px;background:rgba(0,0,0,.06);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#555;font-size:17px;}
        .send-btn{width:46px;height:46px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(230,51,18,.4);}
        .send-btn:disabled{opacity:.4;box-shadow:none;}
        .send-btn i{color:#fff;font-size:20px;}
        .mic-btn{width:46px;height:46px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(230,51,18,.35);}
        .mic-btn.recording{background:linear-gradient(135deg,#111,#1C1C2E);box-shadow:0 3px 10px rgba(0,0,0,.3);animation:pulse .9s infinite;}
        .mic-btn i{color:#fff;font-size:20px;}

        /* Blocked bar */
        .blocked-bar{background:#fff3f0;border-top:1px solid #ffd5cc;padding:14px 16px;flex-shrink:0;text-align:center;}
        .blocked-bar p{font-size:12px;color:#E63312;margin-bottom:8px;}
        .unblock-btn{background:transparent;border:1.5px solid #E63312;color:#E63312;border-radius:10px;padding:7px 18px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;}

        /* Select mode bar */
        .select-bar{background:#111;padding:0 12px;height:52px;display:flex;align-items:center;gap:10px;flex-shrink:0;}
        .select-bar-text{flex:1;color:#fff;font-size:13px;font-weight:600;}
        .sel-delete{background:#E63312;border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;padding:8px 16px;cursor:pointer;font-family:inherit;}

        /* Recording bar */
        .rec-bar{flex:1;display:flex;align-items:center;gap:8px;background:#fff;border-radius:22px;padding:0 12px;min-height:46px;box-shadow:0 1px 3px rgba(0,0,0,.1);}
        .rec-dot{width:9px;height:9px;border-radius:50%;background:#E63312;flex-shrink:0;animation:pulse .9s infinite;}
        .rec-time{font-size:13px;font-weight:700;color:#E63312;font-variant-numeric:tabular-nums;white-space:nowrap;}
        .rec-wave{flex:1;display:flex;align-items:center;gap:2px;height:24px;overflow:hidden;}
        .rec-cancel{background:none;border:none;color:#E63312;font-size:22px;cursor:pointer;padding:2px;line-height:1;flex-shrink:0;}

        /* Modals */
        .overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;animation:fadeIn .15s;}
        .overlay-center{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .15s;}
        .sheet{background:#fff;border-radius:20px 20px 0 0;width:100%;max-width:480px;padding:16px 0 36px;animation:slideUp .2s;}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .handle{width:36px;height:4px;background:#e0e0e0;border-radius:4px;margin:0 auto 14px;}
        .sep{height:0.5px;background:#f0f0f0;margin:4px 0;}
        .mi{display:flex;align-items:center;gap:14px;padding:14px 20px;cursor:pointer;transition:background .1s;}
        .mi:hover{background:#f9f9f9;}
        .mi i{font-size:20px;width:24px;text-align:center;color:#555;}
        .mi span{font-size:14px;color:#111;}
        .mi.danger i,.mi.danger span{color:#E63312;}
        .mi.wa i{color:#25D366;}
        .mi.success i,.mi.success span{color:#22c55e;}

        /* Confirm */
        .confirm-card{background:#fff;border-radius:20px;padding:24px;max-width:340px;width:100%;animation:popIn .15s;text-align:center;}
        .confirm-title{font-size:16px;font-weight:700;color:#111;margin-bottom:8px;}
        .confirm-desc{font-size:13px;color:#888;line-height:1.6;margin-bottom:20px;}
        .confirm-btns{display:flex;gap:10px;}
        .confirm-btn{flex:1;padding:13px;border:none;border-radius:12px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;}
        .confirm-btn.cancel{background:#f5f5f0;color:#555;}
        .confirm-btn.danger{background:#E63312;color:#fff;}

        /* Reaction overlay */
        .rxn-overlay{position:fixed;inset:0;z-index:400;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;animation:fadeIn .15s;}
        .rxn-picker{background:#fff;border-radius:50px;padding:10px 14px;display:flex;gap:8px;box-shadow:0 16px 40px rgba(0,0,0,.3);animation:popIn .15s;}
        .rxn-btn{font-size:26px;cursor:pointer;width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;transition:transform .1s;}
        .rxn-btn:hover{transform:scale(1.3);}

        /* Lightbox */
        .lightbox{position:fixed;inset:0;z-index:500;background:rgba(0,0,0,.96);display:flex;align-items:center;justify-content:center;animation:fadeIn .2s;}
        .lightbox img{max-width:100%;max-height:90dvh;object-fit:contain;}

        /* Spinner */
        .spin-center{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;color:#888;font-size:12px;}
        .spinner{width:26px;height:26px;border:3px solid #F5C842;border-top-color:#E63312;border-radius:50%;animation:spin .7s linear infinite;}

        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes popIn{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:scale(1)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
        onChange={e => {
          const f = e.target.files?.[0]; if (!f) return
          const url = URL.createObjectURL(f)
          setImgPreview({ file: f, url })
          e.target.value = ''
        }}
      />

      {/* Reaction picker overlay */}
      {reactionMsg && (
        <div className="rxn-overlay" onClick={() => setReactionMsg(null)}>
          <div className="rxn-picker" onClick={e => e.stopPropagation()}>
            {EMOJI_QUICK.map(e => (
              <div key={e} className="rxn-btn" onClick={() => sendReaction(reactionMsg, e)}>{e}</div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Imazh i mesazhit" />
        </div>
      )}

      {/* Context menu sheet */}
      {ctxMenu && (
        <div className="overlay" onClick={() => setCtxMenu(null)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="handle" />
            {ctxMenu.msg.content && !ctxMenu.msg.deleted_at && (
              <div style={{ padding:'0 20px 12px', fontSize:12.5, color:'#555', fontStyle:'italic', borderBottom:'0.5px solid #f0f0f0', marginBottom:4, lineHeight:1.5 }}>
                "{ctxMenu.msg.content.slice(0,90)}{ctxMenu.msg.content.length>90?'…':''}"
              </div>
            )}

            {/* Quick reactions */}
            {!ctxMenu.msg.deleted_at && (
              <div style={{ display:'flex', gap:6, padding:'10px 20px 4px', borderBottom:'0.5px solid #f0f0f0' }}>
                {EMOJI_QUICK.map(e => (
                  <button key={e} onClick={() => { sendReaction(ctxMenu.msg.id, e) }}
                    style={{ background:ctxMenu.msg.reaction===e?'#fff3c0':'#f5f5f5', border: ctxMenu.msg.reaction===e?'2px solid #F5C842':'2px solid transparent', borderRadius:50, width:38, height:38, fontSize:20, cursor:'pointer', transition:'transform .1s' }}>
                    {e}
                  </button>
                ))}
              </div>
            )}

            <div className="mi" onClick={() => {
              setReplyTo(ctxMenu.msg); setCtxMenu(null)
              setTimeout(() => inputRef.current?.focus(), 120)
            }}>
              <i className="ti ti-corner-up-left" style={{ color:'#E63312' }} />
              <span>Përgjigju</span>
            </div>

            {!ctxMenu.msg.deleted_at && ctxMenu.msg.type !== 'audio' && (
              <div className="mi" onClick={() => copyMsg(ctxMenu.msg.content)}>
                <i className="ti ti-copy" />
                <span>Kopjo</span>
              </div>
            )}

            {ctxMenu.msg.type === 'image' && ctxMenu.msg.attachment_url && (
              <div className="mi" onClick={() => { setLightbox(ctxMenu.msg.attachment_url); setCtxMenu(null) }}>
                <i className="ti ti-photo" style={{ color:'#F5C842' }} />
                <span>Shiko foton</span>
              </div>
            )}

            {ctxMenu.isOwn && !ctxMenu.msg.deleted_at && (
              <>
                <div className="sep" />
                <div className="mi" onClick={() => { setSelectMode(true); setSelectedMsgs(new Set([ctxMenu.msg.id])); setCtxMenu(null) }}>
                  <i className="ti ti-select" />
                  <span>Zgjidh</span>
                </div>
                <div className="mi danger" onClick={() => deleteMsg(ctxMenu.msg.id)}>
                  <i className="ti ti-trash" />
                  <span>Fshi mesazhin</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Info / actions sheet */}
      {showInfo && selected && (
        <div className="overlay" onClick={() => setShowInfo(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="handle" />
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'0 20px 16px', borderBottom:'0.5px solid #f0f0f0', marginBottom:4 }}>
              <Avatar profile={selected.other} size={52} online={isOtherOnline} />
              <div>
                <div style={{ fontWeight:700, fontSize:15, color:'#111' }}>{displayName(selected.other)}</div>
                <div style={{ fontSize:11, color:isOtherOnline?'#22c55e':'#aaa', marginTop:2 }}>
                  {isOtherOnline ? '● Online tani' : 'I fjetur'}
                </div>
              </div>
            </div>
            <div className="mi" onClick={() => { setShowInfo(false); window.location.href=`/biznese/${selected.otherId}` }}>
              <i className="ti ti-building-store" style={{ color:'#F5C842' }} />
              <span>Shiko biznesin</span>
            </div>
            <div className="mi" onClick={() => { setShowInfo(false); window.location.href='/notifications' }}>
              <i className="ti ti-bell" />
              <span>Njoftimet e mia</span>
            </div>
            {waLink && (
              <div className="mi wa" onClick={() => { setShowInfo(false); setShowWhatsApp(true) }}>
                <i className="ti ti-brand-whatsapp" />
                <span>Vazhdo në WhatsApp</span>
              </div>
            )}
            {viberLink && (
              <div className="mi" style={{ '--mi-accent': '#7360F2' } as any} onClick={() => { setShowInfo(false); setShowViber(true) }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#7360F2" style={{display:'inline-block',verticalAlign:'middle',flexShrink:0}}><path d="M11.5 1C5.7 1.1 1.1 5.7 1 11.5c-.04 2.1.55 4 1.53 5.65L1 23l6.09-1.5c1.57.9 3.4 1.41 5.27 1.45C18.1 23.02 23 18.1 23 12c0-6.07-5.1-11.09-11.5-11zm4.55 15.9c-.31.85-1.5 1.58-2.26 1.6-.77.05-1.51-.16-4.45-1.4C6.08 15.6 3.83 12.17 3.63 11.9c-.2-.28-1.63-2.16-1.63-4.13 0-1.96.85-2.95 1.18-3.37.33-.42.64-.62.9-.64.32 0 .62 0 .9.02.3.02.7-.11.97.74.32.94 1.08 3.26 1.18 3.49.1.24.16.5.03.8-.12.3-.18.48-.36.74-.18.26-.38.57-.55.76-.18.2-.36.42-.16.83.2.4.9 1.48 1.93 2.4 1.33 1.19 2.45 1.56 2.8 1.74.34.18.55.15.75-.08.2-.22.87-1.02 1.1-1.37.23-.34.46-.28.78-.17.33.11 2.07.98 2.43 1.16.35.18.58.27.67.42.09.15.09.85-.22 1.62z"/></svg>
                <span>Vazhdo në Viber</span>
              </div>
            )}
            <div className="sep" />
            {isBlocked ? (
              <div className="mi success" onClick={() => { setShowInfo(false); unblockUser(selected.otherId) }}>
                <i className="ti ti-lock-open" /><span>Hiqe bllokimin</span>
              </div>
            ) : (
              <div className="mi danger" onClick={() => { setShowInfo(false); setShowBlockConf(true) }}>
                <i className="ti ti-ban" /><span>Blloko përdoruesin</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp handoff */}
      {showWhatsApp && selected && waLink && (
        <div className="overlay" onClick={() => setShowWhatsApp(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="handle" />
            <div style={{ padding:'4px 20px 20px', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:10 }}>💬</div>
              <div style={{ fontWeight:700, fontSize:16, color:'#111', marginBottom:8 }}>Vazhdo në WhatsApp</div>
              <div style={{ fontSize:13, color:'#888', lineHeight:1.7, marginBottom:20 }}>
                Do të hapësh WhatsApp me <strong>{displayName(selected.other)}</strong>.
              </div>
              <a href={waLink} target="_blank" rel="noopener noreferrer"
                style={{ display:'block', background:'#25D366', color:'#fff', textDecoration:'none', padding:'14px', borderRadius:14, fontWeight:700, fontSize:15, marginBottom:10 }}
                onClick={() => setShowWhatsApp(false)}>
                <i className="ti ti-brand-whatsapp" style={{ marginRight:8 }} />Hap WhatsApp
              </a>
              <button style={{ width:'100%', padding:'13px', background:'#f5f5f0', border:'none', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', color:'#555', fontFamily:'inherit' }}
                onClick={() => setShowWhatsApp(false)}>Anulo</button>
            </div>
          </div>
        </div>
      )}

      {/* Viber handoff */}
      {showViber && selected && viberLink && (
        <div className="overlay" onClick={() => setShowViber(false)}>
          <div className="sheet" onClick={e => e.stopPropagation()}>
            <div className="handle" />
            <div style={{ padding:'4px 20px 20px', textAlign:'center' }}>
              <div style={{ fontSize:52, marginBottom:10 }}>📲</div>
              <div style={{ fontWeight:700, fontSize:16, color:'#111', marginBottom:8 }}>Vazhdo në Viber</div>
              <div style={{ fontSize:13, color:'#888', lineHeight:1.7, marginBottom:20 }}>
                Do të hapësh Viber me <strong>{displayName(selected.other)}</strong>.
              </div>
              <a href={viberLink}
                style={{ display:'block', background:'#7360F2', color:'#fff', textDecoration:'none', padding:'14px', borderRadius:14, fontWeight:700, fontSize:15, marginBottom:10 }}
                onClick={() => setShowViber(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" style={{display:'inline-block',verticalAlign:'middle',marginRight:8}}><path d="M11.5 1C5.7 1.1 1.1 5.7 1 11.5c-.04 2.1.55 4 1.53 5.65L1 23l6.09-1.5c1.57.9 3.4 1.41 5.27 1.45C18.1 23.02 23 18.1 23 12c0-6.07-5.1-11.09-11.5-11zm4.55 15.9c-.31.85-1.5 1.58-2.26 1.6-.77.05-1.51-.16-4.45-1.4C6.08 15.6 3.83 12.17 3.63 11.9c-.2-.28-1.63-2.16-1.63-4.13 0-1.96.85-2.95 1.18-3.37.33-.42.64-.62.9-.64.32 0 .62 0 .9.02.3.02.7-.11.97.74.32.94 1.08 3.26 1.18 3.49.1.24.16.5.03.8-.12.3-.18.48-.36.74-.18.26-.38.57-.55.76-.18.2-.36.42-.16.83.2.4.9 1.48 1.93 2.4 1.33 1.19 2.45 1.56 2.8 1.74.34.18.55.15.75-.08.2-.22.87-1.02 1.1-1.37.23-.34.46-.28.78-.17.33.11 2.07.98 2.43 1.16.35.18.58.27.67.42.09.15.09.85-.22 1.62z"/></svg>Hap Viber
              </a>
              <button style={{ width:'100%', padding:'13px', background:'#f5f5f0', border:'none', borderRadius:14, fontWeight:600, fontSize:14, cursor:'pointer', color:'#555', fontFamily:'inherit' }}
                onClick={() => setShowViber(false)}>Anulo</button>
            </div>
          </div>
        </div>
      )}

      {/* Block confirm */}
      {showBlockConf && selected && (
        <div className="overlay-center" onClick={() => setShowBlockConf(false)}>
          <div className="confirm-card" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:40, marginBottom:12 }}>🚫</div>
            <div className="confirm-title">Blloko {displayName(selected.other)}?</div>
            <div className="confirm-desc">Ai/ajo nuk mund t'ju dërgojë mesazhe.</div>
            <div className="confirm-btns">
              <button className="confirm-btn cancel" onClick={() => setShowBlockConf(false)}>Anulo</button>
              <button className="confirm-btn danger" onClick={blockUser}>Blloko</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════ PAGE */}
      <div className="page">
        {selected ? (
          /* ══════════════ CHAT VIEW ══════════════ */
          <>
            {selectMode ? (
              <div className="select-bar">
                <button className="back-btn" aria-label="Anulo zgjedhjen" onClick={() => { setSelectMode(false); setSelectedMsgs(new Set()) }}>
                  <i className="ti ti-x" aria-hidden="true" />
                </button>
                <div className="select-bar-text">{selectedMsgs.size} të zgjedhura</div>
                {selectedMsgs.size > 0 && (
                  <button className="sel-delete" onClick={deleteSelected}>
                    <i className="ti ti-trash" style={{ marginRight:6 }} />Fshi
                  </button>
                )}
              </div>
            ) : (
              <div className="topbar chat">
                <button className="back-btn" aria-label="Kthehu në biseda" onClick={back}><i className="ti ti-arrow-left" aria-hidden="true" /></button>
                <Avatar profile={selected.other} size={36} online={isOtherOnline} />
                <div className="t-meta" style={{ cursor:'pointer' }} onClick={() => setShowInfo(true)}>
                  <div className="t-name">{displayName(selected.other)}</div>
                  <div className="t-sub">
                    {typingVisible
                      ? <><span className="online-dot" style={{ background:'#F5C842' }} />Po shkruan...</>
                      : isOtherOnline
                        ? <><span className="online-dot" />Online tani</>
                        : 'Trokit për info'}
                  </div>
                </div>
                <div className="t-actions">
                  {waLink && (
                    <button className="t-action-btn" aria-label="Hap WhatsApp" onClick={() => setShowWhatsApp(true)}>
                      <i className="ti ti-brand-whatsapp" style={{ color:'#25D366' }} aria-hidden="true" />
                    </button>
                  )}
                  {viberLink && (
                    <button className="t-action-btn" aria-label="Hap Viber" onClick={() => setShowViber(true)}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="#7360F2" style={{display:'block'}} aria-hidden="true"><path d="M11.5 1C5.7 1.1 1.1 5.7 1 11.5c-.04 2.1.55 4 1.53 5.65L1 23l6.09-1.5c1.57.9 3.4 1.41 5.27 1.45C18.1 23.02 23 18.1 23 12c0-6.07-5.1-11.09-11.5-11zm4.55 15.9c-.31.85-1.5 1.58-2.26 1.6-.77.05-1.51-.16-4.45-1.4C6.08 15.6 3.83 12.17 3.63 11.9c-.2-.28-1.63-2.16-1.63-4.13 0-1.96.85-2.95 1.18-3.37.33-.42.64-.62.9-.64.32 0 .62 0 .9.02.3.02.7-.11.97.74.32.94 1.08 3.26 1.18 3.49.1.24.16.5.03.8-.12.3-.18.48-.36.74-.18.26-.38.57-.55.76-.18.2-.36.42-.16.83.2.4.9 1.48 1.93 2.4 1.33 1.19 2.45 1.56 2.8 1.74.34.18.55.15.75-.08.2-.22.87-1.02 1.1-1.37.23-.34.46-.28.78-.17.33.11 2.07.98 2.43 1.16.35.18.58.27.67.42.09.15.09.85-.22 1.62z"/></svg>
                    </button>
                  )}
                  <button className="t-action-btn" aria-label="Më shumë veprime" onClick={() => setShowInfo(true)}>
                    <i className="ti ti-dots-vertical" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            <div className="chat-wrap" style={{ position:'relative' }}>
              <div className="msgs-area" ref={attachScrollListener}>
                {isBlocked && (
                  <div style={{ background:'rgba(230,51,18,.08)', borderRadius:12, padding:'10px 14px', margin:'8px 0', textAlign:'center', fontSize:12, color:'#E63312', border:'1px solid rgba(230,51,18,.15)' }}>
                    🚫 Ke bllokuar këtë përdorues
                  </div>
                )}

                {messages.length === 0 && (
                  <div style={{ textAlign:'center', padding:'40px 20px' }}>
                    <div style={{ background:'rgba(255,255,255,.8)', borderRadius:16, padding:'20px 24px', display:'inline-block', maxWidth:280 }}>
                      <Avatar profile={selected.other} size={60} online={isOtherOnline} />
                      <div style={{ fontWeight:700, fontSize:14, color:'#111', marginTop:10 }}>{displayName(selected.other)}</div>
                      <div style={{ fontSize:12, color:'#888', marginTop:4 }}>Mesazhet janë private dhe të sigurta 🔒</div>
                    </div>
                  </div>
                )}

                {groups.map((g, gi) => (
                  <div key={gi}>
                    <div className="day-sep"><span>{g.date}</span></div>
                    {g.items.map((m, mi) => {
                      const mine      = m.sender_id === user?.id
                      const isLast    = mi === g.items.length-1 || g.items[mi+1].sender_id !== m.sender_id
                      const isDeleted = !!m.deleted_at
                      const isSel     = selectedMsgs.has(m.id)
                      const isTmp     = String(m.id).startsWith('tmp')

                      return (
                        <div
                          key={m.id}
                          id={`msg-${m.id}`}
                          className={`msg-row ${mine ? 'mine' : 'theirs'}`}
                          style={{ paddingBottom: m.reaction ? 10 : 0 }}
                        >
                          {!mine && (isLast ? <Avatar profile={selected.other} size={26} /> : <div className="av-spacer" />)}

                          <div
                            className="bwrap"
                            ref={el => { if (el) msgRefs.current.set(m.id, el); else msgRefs.current.delete(m.id) }}
                            onTouchStart={e => onMsgTouchStart(e, m.id)}
                            onTouchMove={e => onMsgTouchMove(e, m.id)}
                            onTouchEnd={e => { endPress(); onMsgTouchEnd(e, m) }}
                            onTouchCancel={endPress}
                            onContextMenu={e => { e.preventDefault(); if (!isDeleted && !selectMode) { if ('vibrate' in navigator) navigator.vibrate(30); setCtxMenu({ msg:m, isOwn:mine }) } }}
                            onDoubleClick={() => { if (!isDeleted && !selectMode) setReactionMsg(m.id) }}
                            onClick={() => { if (selectMode && mine) toggleSelect(m.id, mine) }}
                          >
                            {/* Swipe reply icon */}
                            <div className="swipe-icon">
                              <i className="ti ti-corner-up-left" />
                            </div>

                            <div className={`bubble ${isTmp ? 'tmp' : ''} ${isDeleted ? 'deleted' : ''} ${isSel ? 'sel' : ''}`}>
                              {/* Reply preview */}
                              {m.reply_msg && !isDeleted && (
                                <div className="rp" onClick={() => scrollToMsg(m.reply_msg.id)}>
                                  <div style={{ display:'flex', gap:6, alignItems:'flex-start' }}>
                                    <div style={{ flex:1, minWidth:0 }}>
                                      <div className="rp-name">
                                        {m.reply_msg.sender_id === user?.id ? 'Unë' : displayName(selected.other)}
                                      </div>
                                      {m.reply_msg.type === 'audio' ? (
                                        <div className="rp-text">🎤 Mesazh zanor</div>
                                      ) : m.reply_msg.type === 'image' ? (
                                        <div className="rp-text">📷 Foto</div>
                                      ) : (
                                        <div className="rp-text">{m.reply_msg.content?.slice(0,60)}</div>
                                      )}
                                    </div>
                                    {m.reply_msg.type === 'image' && m.reply_msg.attachment_url && (
                                      <img className="rp-img" src={m.reply_msg.attachment_url} alt="Imazh i thënë" loading="lazy" />
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Content */}
                              {isDeleted ? (
                                <span style={{ fontStyle:'italic', opacity:.6, fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
                                  <i className="ti ti-ban" style={{ fontSize:12 }} /> Mesazhi u fshi
                                </span>
                              ) : m.type === 'image' && m.attachment_url ? (
                                <img
                                  className="bubble-img"
                                  src={m.attachment_url}
                                  alt="Imazh i mesazhit"
                                  loading="lazy"
                                  onClick={e => { e.stopPropagation(); setLightbox(m.attachment_url) }}
                                  style={{ marginBottom: m.content ? 6 : 0 }}
                                />
                              ) : m.type === 'audio' && m.attachment_url ? (
                                <AudioPlayer url={m.attachment_url} mine={mine} />
                              ) : (
                                <span style={{ whiteSpace:'pre-wrap' }}>{m.content}</span>
                              )}

                              {/* Timestamp + status */}
                              {isLast && !isDeleted && (
                                <div className="btime">
                                  {fullTime(m.created_at)}
                                  {mine && (
                                    <i className={`ti tick ${isTmp ? 'ti-clock' : m.read ? 'ti-checks read' : 'ti-check'}`} />
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Reaction badge */}
                            {m.reaction && !isDeleted && (
                              <div className="rxn" onClick={e => { e.stopPropagation(); setReactionMsg(m.id) }}>
                                {m.reaction}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}

                {typingVisible && (
                  <div className="typing-row">
                    <Avatar profile={selected.other} size={26} />
                    <div className="typing-bubble">
                      <span className="tdot" /><span className="tdot" /><span className="tdot" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} style={{ height:6 }} />
              </div>

              {showScrollBtn && (
                <button className="scroll-btn" onClick={() => { userScrolledUp.current = false; scrollBottom() }}>
                  <i className="ti ti-chevron-down" />
                </button>
              )}

              {/* ── Input zone ── */}
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
                      <i className="ti ti-corner-up-left" style={{ color:'#E63312', fontSize:16, flexShrink:0 }} />
                      <div className="rs-bar">
                        <div className="rs-name">{replyTo.sender_id === user?.id ? 'Unë' : displayName(selected.other)}</div>
                        {replyTo.type === 'audio' ? (
                          <div className="rs-text">🎤 Mesazh zanor</div>
                        ) : replyTo.type === 'image' ? (
                          <div className="rs-text">📷 Foto</div>
                        ) : (
                          <div className="rs-text">{replyTo.content?.slice(0,70)}</div>
                        )}
                      </div>
                      {replyTo.type === 'image' && replyTo.attachment_url && (
                        <img className="rs-img" src={replyTo.attachment_url} alt="Imazh i thënë" loading="lazy" width={40} height={40} />
                      )}
                      <button onClick={() => setReplyTo(null)} style={{ background:'none', border:'none', color:'#bbb', fontSize:20, cursor:'pointer', padding:0, lineHeight:1, flexShrink:0 }}>✕</button>
                    </div>
                  )}

                  {/* Upload error toast */}
                  {uploadErr && (
                    <div style={{ background:'#FFF0EE', border:'1px solid #f8c0b8', color:'#E63312', fontSize:11, fontWeight:600, padding:'6px 12px', display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ flex:1 }}>⚠️ {uploadErr}</span>
                      <button onClick={() => setUploadErr('')} style={{ background:'none', border:'none', color:'#E63312', cursor:'pointer', padding:0, fontSize:14, lineHeight:1 }}>✕</button>
                    </div>
                  )}

                  {/* Image preview bar */}
                  {imgPreview && (
                    <div className="img-preview-bar">
                      <img className="img-preview-thumb" src={imgPreview.url} alt="Pamje e imazhit për të dërguar" />
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:12, fontWeight:700, color:'#111', marginBottom:2 }}>Dërgo foton</div>
                        <div style={{ fontSize:11, color:'#888' }}>{imgPreview.file.name}</div>
                      </div>
                      <button onClick={() => { URL.revokeObjectURL(imgPreview.url); setImgPreview(null) }} style={{ background:'none', border:'none', color:'#bbb', fontSize:20, cursor:'pointer', flexShrink:0 }}>✕</button>
                      <button onClick={sendImage} disabled={uploading}
                        style={{ background:'linear-gradient(135deg,#E63312,#c42a0e)', border:'none', borderRadius:10, color:'#fff', fontWeight:700, fontSize:13, padding:'9px 16px', cursor:'pointer', flexShrink:0 }}>
                        {uploading ? '...' : 'Dërgo'}
                      </button>
                    </div>
                  )}

                  {/* Emoji panel */}
                  {emojiOpen && !imgPreview && (
                    <div className="emoji-panel">
                      {EMOJI_FULL.map(e => (
                        <button key={e} className="ep-btn"
                          onClick={() => { setDraft(d => d + e); inputRef.current?.focus() }}>{e}</button>
                      ))}
                    </div>
                  )}

                  {/* Input bar */}
                  {!imgPreview && (
                    <div className="input-bar">
                      {recording ? (
                        <>
                          <div className="rec-bar">
                            <div className="rec-dot" />
                            <div className="rec-time">{fmtDur(recTime)}</div>
                            <div className="rec-wave">
                              {WAVE.slice(0,20).map((h, i) => (
                                <div key={i} style={{ width:2.5, height: h * 1.4 + Math.sin(Date.now()/200+i)*3, borderRadius:3, background:'#E63312', opacity:.7, flexShrink:0 }} />
                              ))}
                            </div>
                            <button className="rec-cancel" onClick={() => stopRecording(true)}>
                              <i className="ti ti-x" />
                            </button>
                          </div>
                          <button className="mic-btn recording" onClick={() => stopRecording(false)}>
                            <i className="ti ti-send" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="emoji-btn" onClick={() => { setEmojiOpen(o => !o); inputRef.current?.focus() }}>
                            {emojiOpen ? '⌨️' : '😊'}
                          </button>
                          <div className="input-wrap">
                            <textarea
                              ref={inputRef} rows={1}
                              aria-label="Shkruaj mesazhin"
                              placeholder={`Mesazh...`}
                              value={draft}
                              maxLength={2000}
                              onChange={e => {
                                setDraft(e.target.value)
                                e.target.style.height = 'auto'
                                e.target.style.height = Math.min(e.target.scrollHeight, 90) + 'px'
                                onTyping()
                              }}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                              onFocus={() => setEmojiOpen(false)}
                            />
                            <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                              <i className="ti ti-paperclip" />
                            </button>
                          </div>
                          {draft.trim() ? (
                            <button className="send-btn" onClick={send} disabled={!canSend}>
                              <i className={`ti ti-${sending ? 'loader-2' : 'send'}`}
                                style={sending ? { animation:'spin .7s linear infinite' } : {}} />
                            </button>
                          ) : (
                            <button className="mic-btn" onTouchStart={() => startRecording()} onClick={() => startRecording()}>
                              <i className="ti ti-microphone" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          /* ══════════════ THREAD LIST ══════════════ */
          <>
            <div className="topbar">
              <button className="back-btn" aria-label="Kthehu në ballina" onClick={() => window.location.href = '/'}>
                <i className="ti ti-arrow-left" aria-hidden="true" />
              </button>
              <div className="t-meta">
                <div className="t-name" style={{ color:'#F5C842' }}>
                  Mesazhet
                  {totalUnread > 0 && (
                    <span style={{ background:'#E63312', color:'#fff', borderRadius:10, padding:'1px 8px', fontSize:10, fontWeight:800, marginLeft:8 }}>{totalUnread}</span>
                  )}
                </div>
              </div>
              <button className="t-action-btn" aria-label="Njoftimet" onClick={() => window.location.href = '/notifications'}>
                <i className="ti ti-bell" aria-hidden="true" />
              </button>
            </div>

            <div className="search-wrap">
              <div className="search-inner">
                <i className="ti ti-search" />
                <input placeholder="Kërko bisedë..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loadError ? (
              <div className="spin-center">
                <div style={{ fontSize: 32 }}>⚠️</div>
                <div style={{ fontWeight: 700, color: '#111' }}>Gabim gjatë ngarkimit</div>
                <button onClick={() => window.location.reload()} style={{ background: '#E63312', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
              </div>
            ) : loading ? (
              <div className="spin-center"><span className="spinner" />Duke ngarkuar...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="empty">
                <div className="empty-emoji">{search ? '🔍' : '💬'}</div>
                <h3>{search ? 'Nuk u gjet asnjë bisedë' : 'Nuk ke mesazhe akoma'}</h3>
                <p>{search ? `Nuk ka bisedë me "${search}"` : 'Kontakto shitësin nga ndonjë shpallje.'}</p>
                {!search && <button className="empty-cta" onClick={() => window.location.href='/'}>Shfleto shpalljet →</button>}
              </div>
            ) : (
              <div className="threads-scroll" style={{ position:'relative' }}>
                {filteredThreads.map(t => {
                  const lastIsDeleted = t.lastMsg?.deleted_at
                  const lastIsAudio   = !lastIsDeleted && t.lastMsg?.type === 'audio'
                  const lastIsImage   = !lastIsDeleted && t.lastMsg?.type === 'image'
                  return (
                    <div key={t.otherId} className={`thread ${t.unread > 0 ? 'unread-thread' : ''}`} onClick={() => openThread(t)}>
                      <Avatar profile={t.other} size={50} online={onlineIds.has(t.otherId)} />
                      <div className="t-info">
                        <div className="t-thread-name">{displayName(t.other)}</div>
                        <div className={`t-preview ${t.unread > 0 ? 'unread' : ''}`}>
                          {lastIsDeleted ? '🚫 Mesazhi u fshi'
                            : lastIsAudio   ? '🎤 Mesazh zanor'
                            : lastIsImage   ? '📷 Foto'
                            : t.lastMsg?.content?.slice(0,55) || 'Fillo bisedën...'}
                        </div>
                      </div>
                      <div className="t-right">
                        <div className="t-time">{t.lastMsg ? timeStr(t.lastMsg.created_at) : ''}</div>
                        {t.unread > 0 && <div className="t-badge">{t.unread}</div>}
                      </div>
                    </div>
                  )
                })}
                <div style={{ height:80 }} />
              </div>
            )}

            <button className="fab" onClick={() => window.location.href='/'} aria-label="Bisedë e re">
              <i className="ti ti-edit" />
            </button>
          </>
        )}
      </div>
    </>
  )
}

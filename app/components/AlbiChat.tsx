'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { ChatMessage } from '../../lib/types'

// Komponent i përbashkët i bisedës me Albin. Përdoret në DY vende:
//  - variant="page"  → faqja e plotë /asistent (100dvh)
//  - variant="panel" → panel lundrues (drawer) mbi homepage, hapur nga AiFloat
// Të gjitha klasat kanë prefiksin `albi-` që të mos përplasen me stilet globale
// të HomeClient (p.sh. `.header`, `.wrap`) — kolizioni do të prishte header-in verdhë.

const QUICK_ACTIONS = [
  { label: '🔍 Kërko produkt', msg: 'Dua të kërkoj një produkt specifik' },
  { label: '💰 Çmimet e tregut', msg: 'Cilat janë çmimet tipike të tregut shqiptar?' },
  { label: '📦 Si të shes?', msg: 'Si mund të shes në ALPAZAR?' },
  { label: '🏢 Biznes premium', msg: 'Si funksionon biznesi premium?' },
  { label: '🔒 Siguria', msg: 'Si të bëj transaksione të sigurta?' },
  { label: '📱 Si instaloj?', msg: 'Si ta instaloj ALPAZAR si app?' },
]

function renderContent(text: string, isStreaming = false): React.ReactNode {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 14, color: 'var(--az-yellow)', margin: '8px 0 3px' }}>{renderInline(line.slice(3))}</div>)
    } else if (line.startsWith('# ')) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 15, color: 'var(--az-yellow)', margin: '8px 0 3px' }}>{renderInline(line.slice(2))}</div>)
    } else if (/^[-*] /.test(line)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginLeft: 2, marginTop: 2 }}>
          <span style={{ color: 'var(--az-yellow)', flexShrink: 0 }}>•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (/^\d+\. /.test(line)) {
      const m = line.match(/^(\d+)\. /)!
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginLeft: 2, marginTop: 2 }}>
          <span style={{ color: 'var(--az-yellow)', flexShrink: 0, minWidth: 16 }}>{m[1]}.</span>
          <span>{renderInline(line.slice(m[0].length))}</span>
        </div>
      )
    } else if (!line.trim()) {
      nodes.push(<div key={i} style={{ height: 5 }} />)
    } else {
      nodes.push(<div key={i}>{renderInline(line)}</div>)
    }
  }

  if (isStreaming) {
    nodes.push(<span key="cursor" style={{ display: 'inline-block', width: 2, height: 13, background: 'var(--az-yellow)', marginLeft: 1, verticalAlign: 'middle', animation: 'albi-blink .7s step-end infinite' }} />)
  }

  return <>{nodes}</>
}

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let key = 0

  while (remaining.length > 0) {
    const boldIdx = remaining.indexOf('**')
    const codeIdx = remaining.indexOf('`')

    const hasCode = codeIdx !== -1
    const hasBold = boldIdx !== -1 && remaining.indexOf('**', boldIdx + 2) !== -1

    let first: 'bold' | 'code' | null = null
    if (hasBold && hasCode) first = boldIdx < codeIdx ? 'bold' : 'code'
    else if (hasBold) first = 'bold'
    else if (hasCode) first = 'code'

    if (!first) { parts.push(remaining); break }

    if (first === 'bold') {
      const end = remaining.indexOf('**', boldIdx + 2)
      if (boldIdx > 0) parts.push(remaining.slice(0, boldIdx))
      parts.push(<strong key={key++} style={{ color: 'var(--az-yellow)' }}>{remaining.slice(boldIdx + 2, end)}</strong>)
      remaining = remaining.slice(end + 2)
    } else {
      const end = remaining.indexOf('`', codeIdx + 1)
      if (end === -1) { parts.push(remaining); break }
      if (codeIdx > 0) parts.push(remaining.slice(0, codeIdx))
      parts.push(<code key={key++} style={{ background: '#2a2a2a', padding: '1px 5px', borderRadius: 3, fontSize: 11, fontFamily: 'monospace', color: '#4ade80' }}>{remaining.slice(codeIdx + 1, end)}</code>)
      remaining = remaining.slice(end + 1)
    }
  }

  return <>{parts}</>
}

const WELCOME: ChatMessage = {
  role: 'assistant',
  content: 'Mirë se erdhe! Unë jam **Albi** 🤖 — asistenti virtual i ALPAZAR.\n\nJam këtu të të ndihmoj të gjesh produktin tënd, të dish çmimet e tregut, ose çdo gjë tjetër rreth ALPAZAR. Çfarë dëshiron sot?',
}

export default function AlbiChat({ variant = 'page', onClose }: { variant?: 'page' | 'panel', onClose?: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null)
  const [isPWA, setIsPWA] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const msgsRef = useRef<HTMLDivElement>(null)
  const prevMsgCountRef = useRef(0)
  // True kur përdoruesi është pranë fundit. Vetëm atëherë bëjmë auto-scroll, që
  // token-at gjatë streaming të mos e tërheqin pamjen kur lexon historikun.
  const atBottomRef = useRef(true)

  const isPanel = variant === 'panel'

  const onMsgsScroll = useCallback(() => {
    const el = msgsRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  useEffect(() => {
    try { setIsPWA(window.matchMedia('(display-mode: standalone)').matches) } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    const count = messages.length
    if (count > prevMsgCountRef.current) {
      prevMsgCountRef.current = count
      if (!atBottomRef.current) return
      const el = msgsRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [messages.length])

  useEffect(() => {
    if (streamingIdx !== null && atBottomRef.current) {
      const el = msgsRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
  }, [messages, streamingIdx])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    setStreamingIdx(null)
    atBottomRef.current = true
    setTimeout(() => {
      const el = msgsRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 30)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 32000)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, lang: (document.cookie.match(/(?:^|; )alpazar_lang=([a-z]{2})/)?.[1]) || 'sq' }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Gabim ${res.status}`)
      }

      const ct = res.headers.get('content-type') || ''

      if (ct.includes('text/event-stream') && res.body) {
        const newIdx = updated.length
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        setLoading(false)
        setStreamingIdx(newIdx)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let done = false

        try {
          while (!done) {
            const { done: d, value } = await reader.read()
            if (d) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const raw = line.slice(6).trim()
              if (raw === '[DONE]') { done = true; break }
              try {
                const parsed = JSON.parse(raw)
                if (parsed.t) {
                  setMessages(prev => {
                    const copy = [...prev]
                    copy[newIdx] = { ...copy[newIdx], content: copy[newIdx].content + parsed.t }
                    return copy
                  })
                }
              } catch {}
            }
          }
        } finally {
          reader.cancel().catch(() => {})
          clearTimeout(timeout)
          setStreamingIdx(null)
        }
      } else {
        const data = await res.json()
        clearTimeout(timeout)
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply || data.error || 'Gabim i papritur. Provo përsëri.',
        }])
        setLoading(false)
      }
    } catch (err: any) {
      clearTimeout(timeout)
      setStreamingIdx(null)
      const msg = err?.name === 'AbortError'
        ? '⏱️ Kërkesa mori shumë kohë. Provo sërisht.'
        : '⚠️ Nuk mund të lidhesha. Kontrollo internetin dhe provo sërisht.'
      setMessages(prev => [...prev, { role: 'assistant', content: msg }])
      setLoading(false)
    }

    setTimeout(() => inputRef.current?.focus(), 100)
  }, [messages, input, loading])

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function clearChat() {
    setMessages([{ role: 'assistant', content: 'Biseda u pastrua! Si mund të të ndihmoj? 😊' }])
    setStreamingIdx(null)
  }

  // Header: te faqja butoni majtas kthen mbrapa; te paneli mbyll drawer-in.
  function headerLeftAction() {
    if (isPanel) { onClose?.(); return }
    if (window.history.length > 1) window.history.back()
    else window.location.href = '/'
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .albi-page{max-width:480px;margin:0 auto;height:100dvh;display:flex;flex-direction:column;background:#0e0e0e;position:relative;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}
        @media(min-width:768px){.albi-page{max-width:760px}}
        @media(min-width:1024px){.albi-page{max-width:900px}}
        .albi-panel-root{display:flex;flex-direction:column;height:100%;background:#0e0e0e;font-family:'Plus Jakarta Sans',system-ui,sans-serif;border-radius:16px;overflow:hidden;}
        .albi-header{background:linear-gradient(135deg,var(--az-red),#b02a0c);padding:${isPanel ? '12px' : (isPWA ? '44px' : '12px')} 14px 12px;flex-shrink:0;display:flex;align-items:center;gap:10px;}
        .albi-back-btn{width:44px;height:44px;background:rgba(255,255,255,.15);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .albi-back-btn i{font-size:18px;color:#fff;}
        .albi-ai-avatar{width:40px;height:40px;background:var(--az-yellow);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 3px rgba(245,200,66,.3);}
        .albi-ai-avatar i{font-size:20px;color:#111;}
        .albi-header-info{flex:1;min-width:0;}
        .albi-header-name{color:#fff;font-weight:700;font-size:15px;}
        .albi-header-status{color:rgba(255,255,255,.7);font-size:10px;display:flex;align-items:center;gap:5px;margin-top:2px;}
        .albi-online-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;}
        .albi-clear-btn{background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:7px 12px;min-height:44px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;}
        .albi-msgs{flex:1;overflow-y:auto;padding:14px 12px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;}
        .albi-msgs::-webkit-scrollbar{width:3px;}
        .albi-msgs::-webkit-scrollbar-track{background:transparent;}
        .albi-msgs::-webkit-scrollbar-thumb{background:#333;border-radius:10px;}
        .albi-msg-row{display:flex;gap:8px;align-items:flex-end;max-width:100%;}
        .albi-msg-row.user{flex-direction:row-reverse;}
        .albi-bot-av{width:30px;height:30px;background:var(--az-yellow);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .albi-bot-av i{font-size:15px;color:#111;}
        .albi-bot-av.spacer{visibility:hidden;}
        .albi-bubble{padding:10px 14px;border-radius:18px;font-size:13px;line-height:1.6;max-width:82%;word-break:break-word;}
        .albi-bubble.bot{background:#1e1e1e;color:#e8e8e8;border:0.5px solid #2a2a2a;border-bottom-left-radius:4px;}
        .albi-bubble.user{background:linear-gradient(135deg,var(--az-red),#c42a0e);color:#fff;border-bottom-right-radius:4px;box-shadow:0 3px 10px rgba(230,51,18,.3);}
        .albi-bubble.user strong{color:#fff;text-decoration:underline;}
        .albi-typing{display:flex;gap:5px;align-items:center;padding:12px 16px;background:#1e1e1e;border-radius:18px;border-bottom-left-radius:4px;width:fit-content;border:0.5px solid #2a2a2a;}
        .albi-dot{width:7px;height:7px;border-radius:50%;background:var(--az-yellow);animation:albi-bounce .9s infinite;}
        .albi-dot:nth-child(2){animation-delay:.2s;}
        .albi-dot:nth-child(3){animation-delay:.4s;}
        @keyframes albi-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes albi-blink{0%,100%{opacity:1}50%{opacity:0}}
        .albi-quick-section{flex-shrink:0;padding:0 12px 8px;}
        .albi-quick-label{color:#555;font-size:10px;font-weight:600;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;}
        .albi-quick-grid{display:flex;flex-wrap:wrap;gap:6px;}
        .albi-quick-btn{background:var(--az-ink);border:0.5px solid #2a2a2a;border-radius:20px;padding:7px 13px;min-height:44px;font-size:11px;color:#ccc;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;display:inline-flex;align-items:center;}
        .albi-quick-btn:hover,.albi-quick-btn:active{background:var(--az-yellow);color:#111;border-color:var(--az-yellow);font-weight:700;}
        .albi-input-area{background:#111;border-top:1px solid #1e1e1e;padding:10px 12px ${isPanel ? '12px' : (isPWA ? '28px' : '12px')};flex-shrink:0;}
        .albi-input-row{display:flex;gap:8px;align-items:flex-end;}
        .albi-input-wrap{flex:1;background:var(--az-ink);border:1.5px solid #2a2a2a;border-radius:22px;padding:10px 16px;display:flex;align-items:flex-end;gap:8px;transition:border-color .15s;}
        .albi-input-wrap:focus-within{border-color:var(--az-red);}
        .albi-input-wrap textarea{border:none;background:transparent;color:#e8e8e8;font-size:13px;font-family:inherit;outline:none;flex:1;resize:none;min-height:20px;max-height:100px;line-height:1.5;}
        .albi-input-wrap textarea::placeholder{color:#444;}
        .albi-send-btn{width:46px;height:46px;background:linear-gradient(135deg,var(--az-red),#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(230,51,18,.4);transition:transform .1s,opacity .15s;}
        .albi-send-btn:active{transform:scale(.9);}
        .albi-send-btn:disabled{opacity:.4;}
        .albi-send-btn i{color:#fff;font-size:20px;}
      ` }} />

      <div className={isPanel ? 'albi-panel-root' : 'albi-page'}>
        <div className="albi-header">
          <button type="button" className="albi-back-btn" aria-label={isPanel ? 'Mbyll bisedën' : 'Kthehu mbrapa'} onClick={headerLeftAction}>
            <i className={`ti ${isPanel ? 'ti-x' : 'ti-arrow-left'}`} aria-hidden="true" />
          </button>
          <div className="albi-ai-avatar" aria-hidden="true"><i className="ti ti-robot" /></div>
          <div className="albi-header-info">
            <div className="albi-header-name">Albi — AI Asistent <span aria-hidden="true">🤖</span></div>
            <div className="albi-header-status">
              <span className="albi-online-dot" />
              {loading || streamingIdx !== null ? 'Duke shkruar...' : 'Online 24/7 · ALPAZAR'}
            </div>
          </div>
          <button type="button" className="albi-clear-btn" aria-label="Pastro bisedën" onClick={clearChat}>🗑 Pastro</button>
        </div>

        <div className="albi-msgs" ref={msgsRef} onScroll={onMsgsScroll}>
          {messages.map((m, i) => {
            const isBot = m.role === 'assistant'
            const prevSameRole = i > 0 && messages[i - 1].role === m.role
            const isCurrentlyStreaming = streamingIdx === i

            return (
              <div key={i} className={`albi-msg-row ${isBot ? 'bot' : 'user'}`}>
                {isBot && (
                  <div className={`albi-bot-av${prevSameRole ? ' spacer' : ''}`}>
                    {!prevSameRole && <i className="ti ti-robot" aria-hidden="true" />}
                  </div>
                )}
                <div className={`albi-bubble ${isBot ? 'bot' : 'user'}`}>
                  {renderContent(m.content, isCurrentlyStreaming)}
                </div>
              </div>
            )
          })}

          {loading && streamingIdx === null && (
            <div className="albi-msg-row bot">
              <div className="albi-bot-av" aria-hidden="true"><i className="ti ti-robot" /></div>
              <div className="albi-typing">
                <span className="albi-dot" /><span className="albi-dot" /><span className="albi-dot" />
              </div>
            </div>
          )}
        </div>

        {messages.length <= 2 && !loading && streamingIdx === null && (
          <div className="albi-quick-section">
            <div className="albi-quick-label">Pyetje të shpejta</div>
            <div className="albi-quick-grid">
              {QUICK_ACTIONS.map(q => {
                const m = q.label.match(/^([^ ]+) (.+)/)
                return (
                  <button key={q.label} type="button" className="albi-quick-btn" onClick={() => sendMessage(q.msg)}>
                    {m ? <><span aria-hidden="true">{m[1]}</span> {m[2]}</> : q.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="albi-input-area">
          <div className="albi-input-row">
            <div className="albi-input-wrap">
              <textarea
                ref={inputRef}
                aria-label="Dërgo mesazh tek Albi"
                rows={1}
                placeholder="Pyet Albin çdo gjë..."
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
                }}
                onKeyDown={handleKey}
              />
            </div>
            <button type="button" className="albi-send-btn" aria-label="Dërgo mesazhin" onClick={() => sendMessage()} disabled={!input.trim() || loading || streamingIdx !== null}>
              <i className="ti ti-send" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

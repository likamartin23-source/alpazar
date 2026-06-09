'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef, useCallback } from 'react'
import type { ChatMessage } from '../../lib/types'

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
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 14, color: '#F5C842', margin: '8px 0 3px' }}>{renderInline(line.slice(3))}</div>)
    } else if (line.startsWith('# ')) {
      nodes.push(<div key={i} style={{ fontWeight: 700, fontSize: 15, color: '#F5C842', margin: '8px 0 3px' }}>{renderInline(line.slice(2))}</div>)
    } else if (/^[-*] /.test(line)) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginLeft: 2, marginTop: 2 }}>
          <span style={{ color: '#F5C842', flexShrink: 0 }}>•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (/^\d+\. /.test(line)) {
      const m = line.match(/^(\d+)\. /)!
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginLeft: 2, marginTop: 2 }}>
          <span style={{ color: '#F5C842', flexShrink: 0, minWidth: 16 }}>{m[1]}.</span>
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
    nodes.push(<span key="cursor" style={{ display: 'inline-block', width: 2, height: 13, background: '#F5C842', marginLeft: 1, verticalAlign: 'middle', animation: 'blink .7s step-end infinite' }} />)
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
      parts.push(<strong key={key++} style={{ color: '#F5C842' }}>{remaining.slice(boldIdx + 2, end)}</strong>)
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

export default function AsistentPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Mirë se erdhe! Unë jam **Albi** 🤖 — asistenti virtual i ALPAZAR.\n\nJam këtu të të ndihmoj të gjesh produktin tënd, të dish çmimet e tregut, ose çdo gjë tjetër rreth ALPAZAR. Çfarë dëshiron sot?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingIdx, setStreamingIdx] = useState<number | null>(null)
  const [isPWA, setIsPWA] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text?: string) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)
    setStreamingIdx(null)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 25000)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `Gabim ${res.status}`)
      }

      const ct = res.headers.get('content-type') || ''

      if (ct.includes('text/event-stream') && res.body) {
        // Streaming path
        const newIdx = updated.length
        setMessages(prev => [...prev, { role: 'assistant', content: '' }])
        setLoading(false)
        setStreamingIdx(newIdx)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        let done = false

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
        setStreamingIdx(null)
      } else {
        // Non-streaming fallback (FAQ)
        const data = await res.json()
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

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0e0e0e;overflow:hidden;}
        .page{max-width:480px;margin:0 auto;height:100dvh;display:flex;flex-direction:column;background:#0e0e0e;position:relative;}
        .header{background:linear-gradient(135deg,#E63312,#b02a0c);padding:${isPWA ? '44px' : '12px'} 14px 12px;flex-shrink:0;display:flex;align-items:center;gap:10px;}
        .back-btn{width:34px;height:34px;background:rgba(255,255,255,.15);border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .back-btn i{font-size:18px;color:#fff;}
        .ai-avatar{width:40px;height:40px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 0 3px rgba(245,200,66,.3);}
        .ai-avatar i{font-size:20px;color:#111;}
        .header-info{flex:1;}
        .header-name{color:#fff;font-weight:700;font-size:15px;}
        .header-status{color:rgba(255,255,255,.7);font-size:10px;display:flex;align-items:center;gap:5px;margin-top:2px;}
        .online-dot{width:6px;height:6px;border-radius:50%;background:#4ade80;flex-shrink:0;}
        .clear-btn{background:rgba(255,255,255,.15);border:none;border-radius:8px;padding:7px 12px;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;}
        .msgs{flex:1;overflow-y:auto;padding:14px 12px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;}
        .msgs::-webkit-scrollbar{width:3px;}
        .msgs::-webkit-scrollbar-track{background:transparent;}
        .msgs::-webkit-scrollbar-thumb{background:#333;border-radius:10px;}
        .msg-row{display:flex;gap:8px;align-items:flex-end;max-width:100%;}
        .msg-row.user{flex-direction:row-reverse;}
        .bot-av{width:30px;height:30px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .bot-av i{font-size:15px;color:#111;}
        .bot-av.spacer{visibility:hidden;}
        .bubble{padding:10px 14px;border-radius:18px;font-size:13px;line-height:1.6;max-width:82%;word-break:break-word;}
        .bubble.bot{background:#1e1e1e;color:#e8e8e8;border:0.5px solid #2a2a2a;border-bottom-left-radius:4px;}
        .bubble.user{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border-bottom-right-radius:4px;box-shadow:0 3px 10px rgba(230,51,18,.3);}
        .bubble.user strong{color:#fff;text-decoration:underline;}
        .typing{display:flex;gap:5px;align-items:center;padding:12px 16px;background:#1e1e1e;border-radius:18px;border-bottom-left-radius:4px;width:fit-content;border:0.5px solid #2a2a2a;}
        .dot{width:7px;height:7px;border-radius:50%;background:#F5C842;animation:bounce .9s infinite;}
        .dot:nth-child(2){animation-delay:.2s;}
        .dot:nth-child(3){animation-delay:.4s;}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .quick-section{flex-shrink:0;padding:0 12px 8px;}
        .quick-label{color:#555;font-size:10px;font-weight:600;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;}
        .quick-grid{display:flex;flex-wrap:wrap;gap:6px;}
        .quick-btn{background:#1a1a1a;border:0.5px solid #2a2a2a;border-radius:20px;padding:7px 13px;font-size:11px;color:#ccc;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;}
        .quick-btn:hover,.quick-btn:active{background:#F5C842;color:#111;border-color:#F5C842;font-weight:700;}
        .input-area{background:#111;border-top:1px solid #1e1e1e;padding:10px 12px ${isPWA ? '28px' : '12px'};flex-shrink:0;}
        .input-row{display:flex;gap:8px;align-items:flex-end;}
        .input-wrap{flex:1;background:#1a1a1a;border:1.5px solid #2a2a2a;border-radius:22px;padding:10px 16px;display:flex;align-items:flex-end;gap:8px;transition:border-color .15s;}
        .input-wrap:focus-within{border-color:#E63312;}
        .input-wrap textarea{border:none;background:transparent;color:#e8e8e8;font-size:13px;font-family:inherit;outline:none;flex:1;resize:none;min-height:20px;max-height:100px;line-height:1.5;}
        .input-wrap textarea::placeholder{color:#444;}
        .send-btn{width:46px;height:46px;background:linear-gradient(135deg,#E63312,#c42a0e);border:none;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 14px rgba(230,51,18,.4);transition:transform .1s,opacity .15s;}
        .send-btn:active{transform:scale(.9);}
        .send-btn:disabled{opacity:.4;}
        .send-btn i{color:#fff;font-size:20px;}
        .web-banner{background:linear-gradient(135deg,#1a1a1a,#111);border:0.5px solid #2a2a2a;border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:10px;}
        .wb-icon{width:34px;height:34px;background:#F5C842;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .wb-icon i{font-size:17px;color:#111;}
        .wb-text{flex:1;}
        .wb-text strong{color:#F5C842;font-size:11px;font-weight:700;display:block;}
        .wb-text span{color:#666;font-size:9.5px;}
        .wb-btn{background:#F5C842;color:#111;border:none;border-radius:8px;padding:7px 12px;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;font-family:inherit;}
      `}</style>

      <div className="page">
        <div className="header">
          <button className="back-btn" onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}>
            <i className="ti ti-arrow-left" />
          </button>
          <div className="ai-avatar"><i className="ti ti-robot" /></div>
          <div className="header-info">
            <div className="header-name">Albi — AI Asistent 🤖</div>
            <div className="header-status">
              <span className="online-dot" />
              {loading || streamingIdx !== null ? 'Duke shkruar...' : 'Online 24/7 · ALPAZAR'}
            </div>
          </div>
          <button className="clear-btn" onClick={clearChat}>🗑 Pastro</button>
        </div>

        <div className="msgs">
          {!isPWA && messages.length <= 2 && (
            <div className="web-banner">
              <div className="wb-icon"><i className="ti ti-device-mobile" /></div>
              <div className="wb-text">
                <strong>📲 Instalo si App</strong>
                <span>Akses më i shpejtë · Pa browser · Offline</span>
              </div>
              <button className="wb-btn" onClick={() => window.location.href = '/'}>Shko →</button>
            </div>
          )}

          {messages.map((m, i) => {
            const isBot = m.role === 'assistant'
            const prevSameRole = i > 0 && messages[i - 1].role === m.role
            const isCurrentlyStreaming = streamingIdx === i

            return (
              <div key={i} className={`msg-row ${isBot ? 'bot' : 'user'}`}>
                {isBot && (
                  <div className={`bot-av${prevSameRole ? ' spacer' : ''}`}>
                    {!prevSameRole && <i className="ti ti-robot" />}
                  </div>
                )}
                <div className={`bubble ${isBot ? 'bot' : 'user'}`}>
                  {renderContent(m.content, isCurrentlyStreaming)}
                </div>
              </div>
            )
          })}

          {loading && streamingIdx === null && (
            <div className="msg-row bot">
              <div className="bot-av"><i className="ti ti-robot" /></div>
              <div className="typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 2 && !loading && streamingIdx === null && (
          <div className="quick-section">
            <div className="quick-label">Pyetje të shpejta</div>
            <div className="quick-grid">
              {QUICK_ACTIONS.map(q => (
                <button key={q.label} className="quick-btn" onClick={() => sendMessage(q.msg)}>
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="input-area">
          <div className="input-row">
            <div className="input-wrap">
              <textarea
                ref={inputRef}
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
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading || streamingIdx !== null}>
              <i className="ti ti-send" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import type { ChatMessage } from '../../lib/types'

const QUICK_ACTIONS = [
  { label: '🔍 Kërko produkt', msg: 'Dua të kërkoj një produkt specifik' },
  { label: '💰 Çmimet e tregut', msg: 'Cilat janë çmimet tipike të tregut shqiptar?' },
  { label: '📦 Si të shes?', msg: 'Si mund të shes në ALPAZAR?' },
  { label: '🏢 Biznes premium', msg: 'Si funksionon biznesi premium?' },
  { label: '🔒 Siguria', msg: 'Si të bëj transaksione të sigurta?' },
  { label: '📱 Si instaloj?', msg: 'Si ta instaloj ALPAZAR si app?' },
]

const SUGGESTIONS: Record<string, string[]> = {
  'elektr': ['iPhone', 'Samsung Galaxy', 'Laptop', 'TV 55"', 'Frigorifer'],
  'makin': ['BMW', 'Mercedes', 'Golf 6', 'Benz C200', 'Toyota Corolla'],
  'shtëpi': ['Apartament', 'Vilë', 'Mobilje', 'Kuzhinë'],
  'veshj': ['Xhinse', 'Këpucë Nike', 'Çantë lëkure'],
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
  const [isPWA, setIsPWA] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setIsPWA(window.matchMedia('(display-mode: standalone)').matches)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg: ChatMessage = { role: 'user', content }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setLoading(true)

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.error || 'Gabim i papritur. Provo përsëri.'
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Nuk mund të lidhesha me serverin. Kontrollo internetin dhe provo përsëri.'
      }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function clearChat() {
    setMessages([{
      role: 'assistant',
      content: 'Biseda u pastrua! Si mund të të ndihmoj? 😊'
    }])
  }

  // Render message content with basic markdown bold support
  function renderContent(text: string) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0e0e0e;overflow:hidden;}
        .page{max-width:480px;margin:0 auto;height:100dvh;display:flex;flex-direction:column;background:#0e0e0e;position:relative;}

        /* Header */
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

        /* Messages */
        .msgs{flex:1;overflow-y:auto;padding:14px 12px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;}
        .msgs::-webkit-scrollbar{width:3px;}
        .msgs::-webkit-scrollbar-track{background:transparent;}
        .msgs::-webkit-scrollbar-thumb{background:#333;border-radius:10px;}

        /* Message rows */
        .msg-row{display:flex;gap:8px;align-items:flex-end;max-width:100%;}
        .msg-row.user{flex-direction:row-reverse;}
        .bot-av{width:30px;height:30px;background:#F5C842;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .bot-av i{font-size:15px;color:#111;}
        .bot-av.spacer{visibility:hidden;}

        /* Bubbles */
        .bubble{padding:10px 14px;border-radius:18px;font-size:13px;line-height:1.6;max-width:82%;word-break:break-word;}
        .bubble.bot{background:#1e1e1e;color:#e8e8e8;border:0.5px solid #2a2a2a;border-bottom-left-radius:4px;}
        .bubble.user{background:linear-gradient(135deg,#E63312,#c42a0e);color:#fff;border-bottom-right-radius:4px;box-shadow:0 3px 10px rgba(230,51,18,.3);}
        .bubble strong{color:#F5C842;}
        .bubble.user strong{color:#fff;text-decoration:underline;}

        /* Typing indicator */
        .typing{display:flex;gap:5px;align-items:center;padding:12px 16px;background:#1e1e1e;border-radius:18px;border-bottom-left-radius:4px;width:fit-content;border:0.5px solid #2a2a2a;}
        .dot{width:7px;height:7px;border-radius:50%;background:#F5C842;animation:bounce .9s infinite;}
        .dot:nth-child(2){animation-delay:.2s;}
        .dot:nth-child(3){animation-delay:.4s;}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}

        /* Quick actions */
        .quick-section{flex-shrink:0;padding:0 12px 8px;}
        .quick-label{color:#555;font-size:10px;font-weight:600;margin-bottom:7px;text-transform:uppercase;letter-spacing:.5px;}
        .quick-grid{display:flex;flex-wrap:wrap;gap:6px;}
        .quick-btn{background:#1a1a1a;border:0.5px solid #2a2a2a;border-radius:20px;padding:7px 13px;font-size:11px;color:#ccc;cursor:pointer;font-family:inherit;transition:all .15s;white-space:nowrap;}
        .quick-btn:hover,.quick-btn:active{background:#F5C842;color:#111;border-color:#F5C842;font-weight:700;}

        /* Input */
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

        /* Web version banner */
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
              Online 24/7 · ALPAZAR
            </div>
          </div>
          <button className="clear-btn" onClick={clearChat}>🗑 Pastro</button>
        </div>

        <div className="msgs">
          {/* Install app banner — only in web browser, not PWA */}
          {!isPWA && messages.length <= 2 && (
            <div className="web-banner">
              <div className="wb-icon"><i className="ti ti-device-mobile" /></div>
              <div className="wb-text">
                <strong>📲 Instalo si App</strong>
                <span>Akses më i shpejtë · Pa browser · Offline</span>
              </div>
              <button className="wb-btn" onClick={() => window.location.href = '/'}>
                Shko →
              </button>
            </div>
          )}

          {messages.map((m, i) => {
            const isBot = m.role === 'assistant'
            const prevBot = i > 0 && messages[i - 1].role === 'assistant'
            return (
              <div key={i} className={`msg-row ${isBot ? 'bot' : 'user'}`}>
                {isBot && (
                  <div className={`bot-av ${prevBot && i > 0 && messages[i-1].role === 'assistant' ? 'spacer' : ''}`}>
                    {!(prevBot && i > 0 && messages[i-1].role === 'assistant') && <i className="ti ti-robot" />}
                  </div>
                )}
                <div className={`bubble ${isBot ? 'bot' : 'user'}`}>
                  {renderContent(m.content)}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="msg-row bot">
              <div className="bot-av"><i className="ti ti-robot" /></div>
              <div className="typing">
                <span className="dot" /><span className="dot" /><span className="dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick action chips — show only at start */}
        {messages.length <= 2 && !loading && (
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
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading}>
              <i className="ti ti-send" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

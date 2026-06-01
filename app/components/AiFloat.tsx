'use client'
import { useState, useEffect } from 'react'

const OWN_ASSISTANT = ['/asistent']

export default function AiFloat() {
  const [showTip, setShowTip] = useState(false)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    if (OWN_ASSISTANT.some(p => path.startsWith(p))) { setHidden(true); return }
    const t = setTimeout(() => setShowTip(true), 2500)
    return () => clearTimeout(t)
  }, [])

  if (hidden) return null

  return (
    <>
      <style>{`
        .ai-float-wrap{position:fixed;bottom:95px;right:12px;z-index:200;display:flex;flex-direction:column;align-items:flex-end;gap:7px;}
        .ai-bubble{background:#111;color:#F5C842;font-size:10px;font-weight:700;padding:7px 11px;border-radius:12px 12px 0 12px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.3);animation:ai-fade .35s ease;display:flex;align-items:center;gap:6px;}
        @keyframes ai-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ai-close-btn{background:none;border:none;color:#666;cursor:pointer;font-size:11px;padding:0 2px;line-height:1;flex-shrink:0;}
        .ai-close-btn:hover{color:#aaa;}
        .ai-float-btn{width:52px;height:52px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:pointer;box-shadow:0 6px 20px rgba(230,51,18,.45);animation:ai-pulse 2s infinite;transition:transform .15s;}
        .ai-float-btn:active{transform:scale(.92);}
        @keyframes ai-pulse{0%,100%{box-shadow:0 6px 20px rgba(230,51,18,.4);transform:scale(1)}50%{box-shadow:0 8px 28px rgba(230,51,18,.65);transform:scale(1.06)}}
        .ai-float-btn i{font-size:24px;color:#fff;}
      `}</style>
      <div className="ai-float-wrap">
        {showTip && (
          <div className="ai-bubble">
            💬 Keni nevojë për ndihmë?
            <button className="ai-close-btn" onClick={() => setShowTip(false)}>✕</button>
          </div>
        )}
        <button
          className="ai-float-btn"
          onClick={() => { window.location.href = '/asistent' }}
          title="Albi — Asistenti Virtual"
        >
          <i className="ti ti-robot" />
        </button>
      </div>
    </>
  )
}

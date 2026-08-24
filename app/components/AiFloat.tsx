'use client'
import { useState, useEffect } from 'react'
import { useDraggable } from '../../hooks/useDraggable'

const OWN_ASSISTANT = ['/asistent']

export default function AiFloat() {
  const [showTip, setShowTip] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Pozicioni fillestar: djathtas-poshtë, i llogaritur mbi madhësinë e butonit
  // Mobile: butoni 52px + 12px margin djathtas
  // Desktop ≥768: butoni 64px + 24px margin djathtas
  const { pos, dragging, onPointerDown } = useDraggable(
    '_alpz_pos_ai',
    () => window.innerWidth >= 768
      ? { left: window.innerWidth - 64 - 24, bottom: 24 }
      : { left: window.innerWidth - 52 - 12, bottom: 95 },
    64
  )

  useEffect(() => {
    const path = window.location.pathname
    if (OWN_ASSISTANT.some(p => path.startsWith(p))) { setHidden(true); return }
    const t = setTimeout(() => setShowTip(true), 2500)
    return () => clearTimeout(t)
  }, [])

  if (hidden) return null

  // Fallback fillestar para mount-it (SSR): pozicioni i majtë
  const initLeft = typeof window !== 'undefined'
    ? (window.innerWidth >= 768 ? window.innerWidth - 88 : window.innerWidth - 64)
    : 12

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ai-bubble{background:#111;color:#F5C842;font-size:10px;font-weight:700;padding:7px 11px;border-radius:12px 12px 0 12px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.3);animation:ai-fade .35s ease;display:flex;align-items:center;gap:6px;}
        @keyframes ai-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ai-close-btn{background:none;border:none;color:#666;cursor:pointer;font-size:11px;padding:0 2px;line-height:1;flex-shrink:0;}
        .ai-close-btn:hover{color:#aaa;}
        .ai-float-btn{width:52px;height:52px;background:linear-gradient(135deg,#E63312,#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:inherit;box-shadow:0 6px 20px rgba(230,51,18,.45);animation:ai-pulse 2s infinite;transition:transform .15s;}
        .ai-float-btn:active{transform:scale(.92);}
        @keyframes ai-pulse{0%,100%{box-shadow:0 6px 20px rgba(230,51,18,.4);transform:scale(1)}50%{box-shadow:0 8px 28px rgba(230,51,18,.65);transform:scale(1.06)}}
        .ai-float-btn i{font-size:24px;color:#fff;}
        @media(min-width:768px){
          .ai-float-btn{width:64px !important;height:64px !important;}
          .ai-float-btn i{font-size:28px !important;}
        }
      ` }} />
      {/* Kontejneri ka gjerësi fikse = butoni, kështu left=left-edge e butonit */}
      <div
        style={{
          position: 'fixed',
          bottom: pos?.bottom ?? 95,
          left: pos?.left ?? initLeft,
          right: 'auto',
          zIndex: 200,
          width: 52,  /* madhësia mobile; desktop zgjerohet nga .ai-float-btn */
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
        onPointerDown={onPointerDown}
      >
        {/* Flluska — absolute mbi buton, e ankoruar djathtas */}
        {showTip && (
          <div
            className="ai-bubble"
            style={{
              position: 'absolute',
              bottom: '110%',
              right: 0,
              marginBottom: 4,
              whiteSpace: 'nowrap',
            }}
          >
            <span aria-hidden="true">💬</span> Keni nevojë për ndihmë?
            <button
              type="button"
              className="ai-close-btn"
              aria-label="Mbyll sugjerimin"
              onClick={() => setShowTip(false)}
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        )}
        <button
          type="button"
          className="ai-float-btn"
          onClick={() => { window.location.href = '/asistent' }}
          aria-label="Albi — Asistenti Virtual"
          style={{ display: 'flex', width: '100%' }}
        >
          <i className="ti ti-robot" aria-hidden="true" />
        </button>
      </div>
    </>
  )
}

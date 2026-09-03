'use client'
import { useState, useEffect } from 'react'
import { useDraggable } from '../../hooks/useDraggable'
import AlbiChat from './AlbiChat'

// Rruget ku butoni lundrues i Albit nuk shfaqet:
//  /asistent — faqja e ka asistentin e vet, dy do te ishin dyfishim;
//  /admin    — paneli eshte mjet pune i brendshem; asistenti konsumator
//              rri mbi butonat e veprimit dhe s'i sherben asnje pyetjeje
//              te operatorit (pare me sy me 31 gusht 2026).
const PA_ALBI = ['/asistent', '/admin']

export default function AiFloat() {
  const [showTip, setShowTip] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

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
    if (PA_ALBI.some(p => path.startsWith(p))) { setHidden(true); return }
    const t = setTimeout(() => setShowTip(true), 2500)
    return () => clearTimeout(t)
  }, [])

  // Mbyll me Escape kur paneli është hapur.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (hidden) return null

  // Fallback fillestar para mount-it (SSR): pozicioni i majtë
  const initLeft = typeof window !== 'undefined'
    ? (window.innerWidth >= 768 ? window.innerWidth - 88 : window.innerWidth - 64)
    : 12

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ai-bubble{background:#111;color:var(--az-yellow);font-size:10px;font-weight:700;padding:7px 11px;border-radius:12px 12px 0 12px;white-space:nowrap;box-shadow:0 4px 14px rgba(0,0,0,.3);animation:ai-fade .35s ease;display:flex;align-items:center;gap:6px;}
        @keyframes ai-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .ai-close-btn{background:none;border:none;color:#666;cursor:pointer;font-size:13px;line-height:1;flex-shrink:0;min-width:44px;min-height:44px;display:inline-flex;align-items:center;justify-content:center;margin:-8px -8px -8px 0;}
        .ai-close-btn:hover{color:#aaa;}
        .ai-float-btn{width:52px;height:52px;background:linear-gradient(135deg,var(--az-red),#c42a0e);border-radius:50%;display:flex;align-items:center;justify-content:center;border:none;cursor:inherit;box-shadow:0 6px 20px rgba(230,51,18,.45);animation:ai-pulse 2s infinite;transition:transform .15s;}
        .ai-float-btn:active{transform:scale(.92);}
        @keyframes ai-pulse{0%,100%{box-shadow:0 6px 20px rgba(230,51,18,.4);transform:scale(1)}50%{box-shadow:0 8px 28px rgba(230,51,18,.65);transform:scale(1.06)}}
        .ai-float-btn i{font-size:24px;color:#fff;}
        @media(min-width:768px){
          .ai-float-btn{width:64px !important;height:64px !important;}
          .ai-float-btn i{font-size:28px !important;}
        }
        /* Paneli lundrues i bisedës me Albin (drawer) */
        .ai-chat-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:1400;animation:ai-fade .2s ease;}
        .ai-chat-panel{position:fixed;z-index:1401;left:8px;right:8px;bottom:8px;top:auto;height:min(80dvh,600px);
          box-shadow:0 18px 50px rgba(0,0,0,.5);border-radius:16px;overflow:hidden;animation:ai-panel-in .28s cubic-bezier(.2,.8,.2,1);}
        @keyframes ai-panel-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @media(min-width:768px){
          .ai-chat-panel{left:auto;right:24px;bottom:24px;width:390px;height:min(78dvh,620px);}
        }
      ` }} />

      {/* Butoni lundrues — fshihet kur paneli është hapur */}
      {!open && (
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
                onClick={(e) => { e.stopPropagation(); setShowTip(false) }}
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          )}
          <button
            type="button"
            className="ai-float-btn"
            onClick={() => { setShowTip(false); setOpen(true) }}
            aria-label="Albi — Asistenti Virtual"
            style={{ display: 'flex', width: '100%' }}
          >
            <i className="ti ti-robot" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Paneli inline i bisedës — hapet mbi homepage (pa navigim) */}
      {open && (
        <>
          <div className="ai-chat-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="ai-chat-panel" role="dialog" aria-modal="true" aria-label="Bisedë me Albin">
            <AlbiChat variant="panel" onClose={() => setOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}

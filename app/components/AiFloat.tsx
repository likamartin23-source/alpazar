'use client'
import { useState, useEffect } from 'react'
import AlbiChat from './AlbiChat'

// Rrugët ku butoni lundrues i Albit nuk shfaqet:
//  /asistent — faqja e ka asistentin e vet, dy do të ishin dyfishim;
//  /admin    — paneli është mjet pune i brendshëm; asistenti konsumator
//              rri mbi butonat e veprimit dhe s'i shërben asnjë pyetjeje
//              të operatorit (parë me sy më 31 gusht 2026).
const PA_ALBI = ['/asistent', '/admin']

export default function AiFloat() {
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const path = window.location.pathname
    if (PA_ALBI.some(p => path.startsWith(p))) setHidden(true)
  }, [])

  // Mbyll me Escape kur paneli është hapur.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (hidden) return null

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .fab-albi {
          position: fixed;
          right: 12px;
          bottom: 84px;
          z-index: 200;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        @media (min-width: 768px) {
          .fab-albi {
            right: 24px;
            bottom: 24px;
          }
        }
        /* Kur cookie banneri është i hapur — ngrit FAB-in */
        body[data-cookie] .fab-albi {
          bottom: 224px;
        }
        @media (min-width: 768px) {
          body[data-cookie] .fab-albi {
            bottom: 24px;
          }
        }

        .fab-albi-btn {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, var(--az-red), #c42a0e);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(0,0,0,.28);
          animation: fab-albi-pulse 2s infinite;
          transition: transform .15s;
          min-width: 44px;
          min-height: 44px;
        }
        .fab-albi-btn:active { transform: scale(.92); }
        .fab-albi-btn:focus-visible {
          outline: 2px solid var(--az-yellow);
          outline-offset: 3px;
        }
        @keyframes fab-albi-pulse {
          0%,100% { box-shadow: 0 4px 16px rgba(230,51,18,.35); transform: scale(1); }
          50%      { box-shadow: 0 6px 22px rgba(230,51,18,.6); transform: scale(1.06); }
        }
        .fab-albi-btn i {
          font-size: 24px;
          color: #fff;
        }
        @media (min-width: 768px) {
          .fab-albi-btn {
            width: 60px;
            height: 60px;
          }
          .fab-albi-btn i { font-size: 28px; }
        }

        /* Etiketa = pill i errët MAJTAS rrethit → e lexueshme mbi çdo sfond
           (kontrast i lartë), e kuptueshme, dhe s'e ngjesh pirgun vertikalisht. */
        .fab-label {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          background: rgba(17,17,17,.82);
          padding: 5px 10px;
          border-radius: 9px;
          letter-spacing: .02em;
          pointer-events: none;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,.22);
        }
        @keyframes fab-albi-fade {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Paneli i bisedës me Albin */
        .ai-chat-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.45);
          z-index: 1400;
          animation: fab-albi-fade .2s ease;
        }
        .ai-chat-panel {
          position: fixed;
          z-index: 1401;
          left: 8px;
          right: 8px;
          bottom: 8px;
          top: auto;
          height: min(80dvh, 600px);
          box-shadow: 0 18px 50px rgba(0,0,0,.5);
          border-radius: 16px;
          overflow: hidden;
          animation: ai-panel-in .28s cubic-bezier(.2,.8,.2,1);
        }
        @keyframes ai-panel-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          .ai-chat-panel {
            left: auto;
            right: 24px;
            bottom: 24px;
            width: 390px;
            height: min(78dvh, 620px);
          }
        }
      ` }} />

      {/* Butoni FAB i Albit — fshihet kur paneli është hapur */}
      {!open && (
        <div className="fab-albi">
          <span className="fab-label">Albi</span>
          <button
            type="button"
            className="fab-albi-btn"
            onClick={() => setOpen(true)}
            aria-label="Albi — Asistenti Virtual"
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

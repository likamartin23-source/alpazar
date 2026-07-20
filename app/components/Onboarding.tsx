'use client'

import { useState, useEffect } from 'react'

export function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('alpazar_onboarded')) setVisible(true)
  }, [])

  function close() {
    localStorage.setItem('alpazar_onboarded', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mirë se erdhe në Alpazar"
      onClick={(e) => { if (e.target === e.currentTarget) close() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(17,17,17,.55)', zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 16px',
        animation: 'ob-fade .2s ease',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ob-fade { from { opacity:0 } to { opacity:1 } }
        @keyframes ob-up   { from { transform:translateY(16px);opacity:0 } to { transform:none;opacity:1 } }
      ` }} />
      <div style={{
        background: '#fff', borderRadius: 16, maxWidth: 380, width: '100%',
        padding: '28px 24px 24px', boxShadow: '0 8px 40px rgba(0,0,0,.18)',
        animation: 'ob-up .2s ease',
      }}>
        {/* Dots */}
        <div aria-hidden="true" style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? '#E63312' : '#e0e0e0',
              transition: 'all .2s',
            }} />
          ))}
        </div>

        {step === 0 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <span style={{ background: '#111', color: '#F5C842', fontSize: 13, fontWeight: 800, letterSpacing: 2, padding: '4px 12px', borderRadius: 8, display: 'inline-block' }}><img src="/icons/eagle.svg" alt="" aria-hidden="true" style={{ height: '0.9em', verticalAlign: '-0.12em', display: 'inline-block' }} /> ALPAZAR</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>Mirë se erdhe!</div>
            <div style={{ fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 1.6, marginBottom: 28 }}>Shit, bli dhe bëj pazarin tënd — falas, pa komision.</div>
            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}>Vazhdo →</button>
            <button type="button" onClick={close} style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>Anashkalo</button>
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 20 }}>Si funksionon</div>
            {[
              { icon: '🔍', text: 'Kërko mes mijëra shpalljeve' },
              { icon: '💬', text: 'Shkruaj shitësit direkt' },
              { icon: '❤️', text: 'Ruaj çfarë të pëlqen' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 22, width: 32, textAlign: 'center' }} aria-hidden="true">{icon}</span>
                <span style={{ fontSize: 14, color: '#333', fontWeight: 500 }}>{text}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button type="button" onClick={() => setStep(0)} style={{ flex: 1, background: '#fff', color: '#111', border: '1.5px solid #ddd', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>← Mbrapa</button>
              <button type="button" onClick={() => setStep(2)} style={{ flex: 1, background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Vazhdo →</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>Gati? <span aria-hidden="true">🚀</span></div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 }}>Zgjidh si dëshiron të fillosh</div>
            <button type="button" onClick={() => { close(); window.location.href = '/listing/new' }} style={{ width: '100%', background: 'linear-gradient(135deg,#E63312,#c42a0e)', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}><span aria-hidden="true">➕</span> Shto shpalljen e parë</button>
            <button type="button" onClick={() => { close(); window.location.href = '/search' }} style={{ width: '100%', background: 'linear-gradient(135deg,#F8D24E,#F5C842)', color: '#111', border: 'none', borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 10 }}><span aria-hidden="true">🔍</span> Eksploro</button>
            <button type="button" onClick={() => setStep(1)} style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>← Mbrapa</button>
          </>
        )}
      </div>
    </div>
  )
}

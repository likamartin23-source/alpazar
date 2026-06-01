'use client'

import { useState, useEffect } from 'react'

const STEPS = [
  {
    emoji: '👋',
    title: 'Mirë se erdhe te ALPAZAR!',
    text: 'Platforma #1 shqiptare për blerje dhe shitje online. Gjej gjithçka ke nevojë — nga elektronika te makinat.',
    cta: 'Vazhdo →',
  },
  {
    emoji: '🛍️',
    title: 'Si të shesësh?',
    text: 'Kliko "+ Shpallje e Re", shto foto dhe çmim, dhe publiko. Shpallja jote del menjëherë para mijëra blerësve.',
    cta: 'Vazhdo →',
  },
  {
    emoji: '🔍',
    title: 'Si të blesh?',
    text: 'Këdo produktin, kliko "Kontakto Shitësin" dhe bisedo direkt. Shiko Trust Score para çdo transaksioni.',
    cta: 'Fillojmë! 🚀',
  },
]

export function Onboarding() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('alpazar_onboarded')) {
      setVisible(true)
    }
  }, [])

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      localStorage.setItem('alpazar_onboarded', '1')
      setVisible(false)
    }
  }

  function skip() {
    localStorage.setItem('alpazar_onboarded', '1')
    setVisible(false)
  }

  if (!visible) return null

  const s = STEPS[step]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 9999,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes ob-up{from{transform:translateY(100%)}to{transform:none}}
        .ob-sheet{background:#FFFBEA;border-radius:24px 24px 0 0;padding:28px 24px 40px;width:100%;max-width:480px;animation:ob-up .3s ease;}
        .ob-dots{display:flex;justify-content:center;gap:6px;margin-bottom:20px;}
        .ob-dot{width:8px;height:8px;border-radius:50%;background:#ddd;transition:background .2s;}
        .ob-dot.active{background:#E63312;width:20px;border-radius:4px;}
        .ob-emoji{font-size:52px;text-align:center;display:block;margin-bottom:14px;}
        .ob-title{font-size:20px;font-weight:800;color:#111;text-align:center;margin-bottom:10px;}
        .ob-text{font-size:13px;color:#555;text-align:center;line-height:1.7;margin-bottom:28px;}
        .ob-cta{width:100%;background:#E63312;color:#fff;border:none;border-radius:12px;padding:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;margin-bottom:10px;}
        .ob-skip{width:100%;background:none;border:none;color:#aaa;font-size:12px;cursor:pointer;font-family:inherit;}
      `}</style>
      <div className="ob-sheet">
        <div className="ob-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`ob-dot${i === step ? ' active' : ''}`} />
          ))}
        </div>
        <span className="ob-emoji">{s.emoji}</span>
        <div className="ob-title">{s.title}</div>
        <div className="ob-text">{s.text}</div>
        <button className="ob-cta" onClick={next}>{s.cta}</button>
        {step < STEPS.length - 1 && (
          <button className="ob-skip" onClick={skip}>Kalo →</button>
        )}
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const TYPES = [
  { value: 'trademark', label: '™ Shkelje e markës tregtare / Mallra të falsifikuara (L.52/2025)' },
  { value: 'copyright', label: '© Shkelje e të drejtave të autorit' },
  { value: 'illegal_content', label: '🚫 Përmbajtje e paligjshme' },
  { value: 'privacy', label: '🔒 Shkelje e privatësisë' },
  { value: 'defamation', label: '⚠️ Shpifje / denigrim' },
  { value: 'other', label: '📝 Tjetër' },
]

export default function TakedownPage() {
  const [type, setType] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  // Trademark-specific fields
  const [trademark, setTrademark] = useState('')
  const [dppiReg, setDppiReg] = useState('')
  const [proof, setProof] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !description.trim()) { setError('Plotëso fushat e detyrueshme!'); return }
    if (type === 'trademark' && !trademark.trim()) { setError('Emri i markës tregtare është i detyrueshëm!'); return }
    setSubmitting(true); setError('')

    const fullDescription = type === 'trademark'
      ? `[MARKA: ${trademark}] [DPPI: ${dppiReg || 'N/A'}] [DËSHMI: ${proof || 'N/A'}]\n\n${description.trim()}`
      : description.trim()

    const { error: err } = await supabase.from('takedown_requests').insert({
      type, content_url: contentUrl.trim() || null,
      description: fullDescription,
      contact_email: contactEmail.trim() || null,
    })
    if (err) { setError(err.message); setSubmitting(false); return }
    setDone(true)
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <button type="button" aria-label="Kthehu" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Kthehu
        </button>
        <div style={{ background: '#fff', border: '1.5px solid #f0e6b0', borderRadius: 16, padding: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}><span aria-hidden="true">⚖️</span> Kërkesë Heqje Përmbajtjeje / IP</h1>
          <p style={{ fontSize: 12, color: '#888', lineHeight: 1.6, marginBottom: 24 }}>
            Nëse besoni se ndonjë përmbajtje në Alpazar shkel të drejtat tuaja të pronësisë intelektuale ose ligjin, plotësoni këtë formular. Mbrojmë të drejtat e markave tregtare sipas Ligjit L.52/2025 nenet 130–133. Do t'ju përgjigjemi brenda 72 orëve.
          </p>

          {done ? (
            <div style={{ background: '#EAF3DE', border: '1px solid #97C459', borderRadius: 10, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">✅</div>
              <div style={{ fontWeight: 700, color: '#3B6D11', fontSize: 15 }}>Kërkesa u dërgua!</div>
              <div style={{ color: '#888', fontSize: 12, marginTop: 6 }}>Do t'ju kontaktojmë brenda 72 orëve.</div>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="td-type" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Lloji i shkeljes *</label>
                <select id="td-type" value={type} onChange={e => setType(e.target.value)} required style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff', outline: 'none' }}>
                  <option value="">Zgjidh llojin...</option>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {type === 'trademark' && (
                <>
                  <div>
                    <label htmlFor="td-trademark" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Emri i markës tregtare *</label>
                    <input id="td-trademark" type="text" value={trademark} onChange={e => setTrademark(e.target.value)} placeholder="p.sh. ALPAZAR" style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label htmlFor="td-dppi" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Nr. regjistrimit DPPI (opsionale)</label>
                    <input id="td-dppi" type="text" value={dppiReg} onChange={e => setDppiReg(e.target.value)} placeholder="p.sh. 12345/2024" style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                  <div>
                    <label htmlFor="td-proof" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Dëshmi pronësie (përshkrim ose link)</label>
                    <input id="td-proof" type="text" value={proof} onChange={e => setProof(e.target.value)} placeholder="p.sh. certifikatë DPPI, regjistrim ndërkombëtar..." style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="td-url" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>URL e përmbajtjes (opsionale)</label>
                <input id="td-url" type="url" value={contentUrl} onChange={e => setContentUrl(e.target.value)} placeholder="https://alpazar.vercel.app/listing/..." style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label htmlFor="td-desc" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Përshkrimi i çështjes *</label>
                <textarea id="td-desc" value={description} onChange={e => setDescription(e.target.value)} required rows={4} placeholder="Shpjegoni arsyen dhe çfarë duhet të hiqet..." style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <div>
                <label htmlFor="td-email" style={{ fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4 }}>Email kontakti (opsionale)</label>
                <input id="td-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="juaj@email.com" autoComplete="email" style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              {error && <div role="alert" style={{ background: '#FFF0EE', color: '#E63312', border: '1px solid #F09595', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{error}</div>}
              <button type="submit" disabled={submitting} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Duke dërguar...' : 'Dërgo Kërkesën'}
              </button>
            </form>
          )}
        </div>
        <p style={{ fontSize: 10, color: '#aaa', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          Alpazar respekton të drejtat e pronësisë intelektuale dhe ligjet e zbatueshme, përfshirë L.52/2025. Shih <a href="/terms" style={{ color: '#888' }}>Kushtet e Shërbimit</a>.
        </p>
      </div>
    </div>
  )
}

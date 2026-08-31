'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

/* Llojet duhet te perputhen SAKTESISHT me kufizimin
   `takedown_requests_type_check` ne baze. Shtimi i nje lloji te ri ketu pa e
   shtuar edhe atje e prish formularin ne heshtje — pikerisht gabimi qe kishte
   `trademark` me pare. */
const TYPES = [
  { value: 'trademark',       label: '™ Shkelje e markes tregtare / Mallra te falsifikuara (L.52/2025)', legal: false },
  { value: 'copyright',       label: '© Shkelje e te drejtave te autorit', legal: false },
  { value: 'illegal_content', label: '🚫 Permbajtje e paligjshme', legal: true },
  { value: 'privacy',         label: '🔒 Shkelje e privatesise', legal: true },
  { value: 'defamation',      label: '⚠️ Shpifje / denigrim', legal: false },
  { value: 'other',           label: '📝 Tjeter', legal: false },
]

const inputStyle = {
  width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px',
  fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' as const,
}
const labelStyle = {
  fontSize: 11, fontWeight: 700, color: '#555', display: 'block', marginBottom: 4,
}

export default function TakedownPage() {
  const [type, setType] = useState('')
  const [contentUrl, setContentUrl] = useState('')
  const [description, setDescription] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [goodFaith, setGoodFaith] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const [trademark, setTrademark] = useState('')
  const [dppiReg, setDppiReg] = useState('')
  const [proof, setProof] = useState('')

  const chosen = TYPES.find(t => t.value === type)
  const isLegal = !!chosen?.legal

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    if (!type) { setError('Zgjidh llojin e shkeljes.'); return }

    /* URL-ja eshte e detyrueshme: trigeri `tg_takedown_to_queue` e nxjerr
       identifikuesin e shpalljes VETEM prej saj. Pa URL, njoftimi hyn ne radhe
       pa u lidhur me asgje dhe moderatori nuk ka cfare te heqe. */
    if (!contentUrl.trim()) {
      setError('Vendos adresen e sakte te permbajtjes. Pa te nuk e gjejme dot cfare duhet hequr.')
      return
    }
    if (description.trim().length < 20) {
      setError('Pershkruaje problemin me te pakten nje fjali (20 shkronja).')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contactEmail.trim())) {
      setError('Vendos nje email te vlefshem — aty te dergojme pergjigjen e shqyrtimit.')
      return
    }
    if (type === 'trademark' && !trademark.trim()) {
      setError('Emri i markes tregtare eshte i detyrueshem.')
      return
    }
    if (!goodFaith) {
      setError('Duhet te deklarosh se njoftimi jepet ne mirebesim.')
      return
    }

    setSubmitting(true); setError('')

    const fullDescription = type === 'trademark'
      ? `[MARKA: ${trademark}] [DPPI: ${dppiReg || 'N/A'}] [DESHMI: ${proof || 'N/A'}]\n\n${description.trim()}`
      : description.trim()

    const { error: err } = await supabase.from('takedown_requests').insert({
      type,
      content_url: contentUrl.trim(),
      description: fullDescription,
      contact_email: contactEmail.trim(),
    })

    if (err) {
      /* Mesazh i kuptueshem ne vend te tekstit te papërpunuar te bazes. */
      setError(
        err.message.includes('row-level security')
          ? 'Njoftimi nuk u pranua. Kontrollo qe email-i te jete i vlefshem dhe pershkrimi te jete i plote.'
          : err.message.includes('type_check')
            ? 'Lloji i zgjedhur nuk njihet. Provo perseri ose zgjidh "Tjeter".'
            : 'Nuk u dergua dot njoftimi. Provo perseri ose shkruaj te faqja e kontaktit.'
      )
      setSubmitting(false)
      return
    }

    setDone(true)
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <button type="button" aria-label="Kthehu" onClick={() => window.history.back()} style={{ background: 'none', border: 'none', color: '#6E6E6E', cursor: 'pointer', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
          ← Kthehu
        </button>
        <div style={{ background: '#fff', border: '1.5px solid #f0e6b0', borderRadius: 16, padding: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 6 }}><span aria-hidden="true">⚖️</span> Kerkese Heqje Permbajtjeje / IP</h1>
          <p style={{ fontSize: 12, color: '#6E6E6E', lineHeight: 1.6, marginBottom: 20 }}>
            Nese beson se ndonje permbajtje ne Alpazar shkel te drejtat e tua ose ligjin, plotesoje kete formular.
            Nuk te duhet llogari. Permbajtja qartesisht e paligjshme shqyrtohet <strong>menjehere</strong>;
            rastet e pronesise intelektuale brenda <strong>72 oreve</strong>.
          </p>

          {done ? (
            <div style={{ background: '#EAF3DE', border: '1px solid #97C459', borderRadius: 10, padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }} aria-hidden="true">✅</div>
              <div style={{ fontWeight: 700, color: '#3B6D11', fontSize: 15 }}>Njoftimi u regjistrua</div>
              <div style={{ color: '#6E6E6E', fontSize: 12, marginTop: 6, lineHeight: 1.6 }}>
                Pergjigjen do ta marresh te <strong>{contactEmail.trim()}</strong>.
                {isLegal
                  ? ' Rasti u shenua si prioritar dhe shqyrtohet menjehere.'
                  : ' Rasti shqyrtohet brenda 72 oreve.'}
              </div>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label htmlFor="td-type" style={labelStyle}>Lloji i shkeljes *</label>
                <select id="td-type" value={type} onChange={e => setType(e.target.value)} required style={{ ...inputStyle, background: '#fff' }}>
                  <option value="">Zgjidh llojin...</option>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {isLegal && (
                  <div style={{ fontSize: 11, color: '#B8260D', marginTop: 6, lineHeight: 1.5 }}>
                    Po pretendon permbajtje te paligjshme. Kur ligji e kerkon, njoftimi i percillet
                    edhe autoriteteve kompetente. Njoftimet e rreme te qellimshme kane pasoja.
                  </div>
                )}
              </div>

              {type === 'trademark' && (
                <>
                  <div>
                    <label htmlFor="td-trademark" style={labelStyle}>Emri i markes tregtare *</label>
                    <input id="td-trademark" type="text" value={trademark} onChange={e => setTrademark(e.target.value)} placeholder="p.sh. ALPAZAR" style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="td-dppi" style={labelStyle}>Nr. regjistrimit DPPI (opsionale)</label>
                    <input id="td-dppi" type="text" value={dppiReg} onChange={e => setDppiReg(e.target.value)} placeholder="p.sh. 12345/2024" style={inputStyle} />
                  </div>
                  <div>
                    <label htmlFor="td-proof" style={labelStyle}>Deshmi pronesie (pershkrim ose link)</label>
                    <input id="td-proof" type="text" value={proof} onChange={e => setProof(e.target.value)} placeholder="p.sh. certifikate DPPI, regjistrim nderkombetar..." style={inputStyle} />
                  </div>
                </>
              )}

              <div>
                <label htmlFor="td-url" style={labelStyle}>Adresa e permbajtjes *</label>
                <input id="td-url" type="url" required value={contentUrl} onChange={e => setContentUrl(e.target.value)} placeholder="https://alpazar.vercel.app/listing/..." style={inputStyle} />
                <div style={{ fontSize: 10.5, color: '#6E6E6E', marginTop: 4, lineHeight: 1.5 }}>
                  Kopjoje adresen e sakte te shpalljes. Pa te nuk e identifikojme dot permbajtjen.
                </div>
              </div>

              <div>
                <label htmlFor="td-desc" style={labelStyle}>Pershkrimi i ceshtjes *</label>
                <textarea id="td-desc" value={description} onChange={e => setDescription(e.target.value)} required rows={4} placeholder="Shpjego cfare pe, ku, dhe pse mendon se eshte shkelje..." style={{ ...inputStyle, resize: 'vertical' }} />
                <div style={{ fontSize: 10.5, color: description.trim().length >= 20 ? '#6E6E6E' : '#8A6400', marginTop: 4 }}>
                  {description.trim().length}/20 shkronja minimumi
                </div>
              </div>

              <div>
                <label htmlFor="td-email" style={labelStyle}>Email kontakti *</label>
                <input id="td-email" type="email" required value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="juaj@email.com" autoComplete="email" style={inputStyle} />
                <div style={{ fontSize: 10.5, color: '#6E6E6E', marginTop: 4, lineHeight: 1.5 }}>
                  Aty te dergojme rezultatin e shqyrtimit. Pergjigjja eshte pjese e procedures.
                </div>
              </div>

              <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 11.5, color: '#444', lineHeight: 1.55, cursor: 'pointer' }}>
                <input type="checkbox" checked={goodFaith} onChange={e => setGoodFaith(e.target.checked)} style={{ marginTop: 2, width: 15, height: 15, flexShrink: 0, accentColor: '#111' }} />
                <span>Deklaroj me <strong>mirebesim</strong> se informacioni qe dhashe eshte i sakte dhe i plote sipas dijenise sime.</span>
              </label>

              {error && <div role="alert" style={{ background: '#FFF0EE', color: '#C42B0F', border: '1px solid #F09595', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>{error}</div>}

              <button type="submit" disabled={submitting} style={{ background: '#111', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Duke derguar...' : 'Dergo Njoftimin'}
              </button>
            </form>
          )}
        </div>
        <p style={{ fontSize: 10, color: '#6E6E6E', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
          Te dhenat e njoftimit perpunohen per shqyrtimin e tij dhe per permbushjen e detyrimeve ligjore
          te platformes, sipas ligjit nr. 124/2024. Shih <a href="/kushtet" style={{ color: '#6E6E6E' }}>Kushtet</a> dhe{' '}
          <a href="/privatesia" style={{ color: '#6E6E6E' }}>Privatesine</a>.
        </p>
      </div>
    </div>
  )
}

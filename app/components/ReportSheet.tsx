'use client'

/**
 * FLETA E RAPORTIMIT MBI NJE SHPALLJE
 *
 * PSE U RINDERTUA — prova qe e zbuloi:
 *   mod_priority_for('report', 'Produkt i ndaluar')  ->  prioritet 2  ->  7 DITE
 *
 * Lista e arsyeve ne shpallje ishte shkruar me dore, ndersa prioriteti ne baze
 * hamendesohej duke gjuajtur fjale ('drog', 'arm', 'municion'). Asnjera prej
 * tyre nuk ndodhej ne etiketat e nderfaqes, ndaj nje produkt i ndaluar merrte
 * afatin me te gjate te mundshem. Neni 17/1/b i ligjit 10128 kerkon veprim me
 * njohje — jo brenda shtate ditesh.
 *
 * Tani arsyet vijne nga report_reasons(), i njejti katalog qe cakton
 * prioritetin. Nese shtohet nje arsye e re, prioriteti vjen bashke me te.
 *
 * DY RRUGE, SEPSE JANE DY REGJIME TE NDRYSHME LIGJORE:
 *
 *   Raport perdoruesi  -> tabela `reports`
 *     cilesi, mashtrim, permbajtje e ndaluar. Kerkon llogari.
 *
 *   Njoftim ligjor     -> tabela `takedown_requests`
 *     e drejta e autorit, marka, privatesia, shpifja. Email dhe arsyetim te
 *     detyrueshem; lejohet edhe pa llogari, sepse mbajtesi i nje te drejte
 *     rrallë ka profil ne nje treg online (neni 17/1/b — dijenia).
 */

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Arsye = {
  kodi: string; etiketa: string; prioriteti: number
  kerkon_detaje: boolean; ligjor: boolean; ndihme: string | null
}

export function ReportSheet({
  listingId, listingTitle, userId, onClose,
}: {
  listingId: string
  listingTitle?: string
  userId?: string | null
  onClose: () => void
}) {
  const [arsyet, setArsyet] = useState<Arsye[]>([])
  const [kodi, setKodi] = useState('')
  const [detaje, setDetaje] = useState('')
  const [email, setEmail] = useState('')
  const [mirebesim, setMirebesim] = useState(false)
  const [duke, setDuke] = useState(false)
  const [gabim, setGabim] = useState('')
  const [mbaroi, setMbaroi] = useState<'raport' | 'ligjor' | ''>('')

  useEffect(() => {
    supabase.rpc('report_reasons').then(({ data, error }) => {
      if (!error && Array.isArray(data)) setArsyet(data as Arsye[])
    })
  }, [])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  const zgjedhur = arsyet.find(a => a.kodi === kodi)
  const eshteLigjor = !!zgjedhur?.ligjor
  const duhenDetaje = !!zgjedhur?.kerkon_detaje

  // Cfare i mungon perdoruesit para se te dergoje
  const mangesia = (): string => {
    if (!zgjedhur) return 'Zgjidh një arsye.'
    if (duhenDetaje && detaje.trim().length < 20)
      return 'Përshkruaj problemin me të paktën 20 shkronja — moderatori duhet të kuptojë çfarë të shohë.'
    if (eshteLigjor) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
        return 'Email-i është i detyrueshëm — përgjigjja ndaj njoftimit ligjor është pjesë e procedurës.'
      if (!mirebesim) return 'Konfirmo deklaratën e mirëbesimit.'
    } else if (!userId) {
      return 'Duhet të kyçesh për të raportuar. Për një njoftim ligjor mund të vazhdosh pa llogari.'
    }
    return ''
  }

  async function dergo() {
    const m = mangesia()
    if (m) { setGabim(m); return }
    setDuke(true); setGabim('')

    if (eshteLigjor) {
      // Njoftim ligjor — regjim tjeter, tabele tjeter, afat tjeter.
      const url = typeof window !== 'undefined' ? window.location.href : `/listing/${listingId}`
      const { error } = await supabase.from('takedown_requests').insert({
        type: kodi,
        content_url: url,
        listing_id: listingId,
        description: detaje.trim(),
        contact_email: email.trim(),
        status: 'pending',
      })
      setDuke(false)
      if (error) {
        setGabim('Njoftimi nuk u dërgua. Provo sërish ose shkruaj te faqja e njoftimeve ligjore.')
        return
      }
      setMbaroi('ligjor')
    } else {
      const { error } = await supabase.from('reports').insert({
        listing_id: listingId,
        reporter_id: userId ?? null,
        reason: kodi,
        details: detaje.trim() || null,
        status: 'pending',
      })
      setDuke(false)
      if (error) {
        setGabim(/row-level security|permission|denied/i.test(error.message)
          ? 'Duhet të kyçesh për të raportuar. Hyr dhe provo sërish.'
          : 'Raporti nuk u dërgua. Provo sërish.')
        return
      }
      setMbaroi('raport')
    }
    setTimeout(onClose, 2600)
  }

  const ligjore = arsyet.filter(a => a.ligjor)
  const tjerat = arsyet.filter(a => !a.ligjor)

  return (
    <>
      <div className="report-overlay" onClick={onClose} aria-hidden="true" />
      <div className="report-panel" role="dialog" aria-modal="true" aria-label="Raporto shpalljen">
        <div className="report-handle" />

        {mbaroi ? (
          <div className="report-success">
            <div style={{ fontSize: 30 }} aria-hidden="true">✓</div>
            <div style={{ fontWeight: 700, marginTop: 6 }}>
              {mbaroi === 'ligjor' ? 'Njoftimi u regjistrua' : 'Faleminderit'}
            </div>
            <div style={{ fontSize: 12, color: '#555', marginTop: 6, lineHeight: 1.6 }}>
              {mbaroi === 'ligjor'
                ? 'Do të marrësh përgjigje me shkrim në email-in që dhe. Përmbajtja e paligjshme trajtohet menjëherë.'
                : 'Raporti shkoi te moderimi. Nuk i tregohet shitësit se kush raportoi.'}
            </div>
          </div>
        ) : (
          <>
            <div className="report-title">Raporto këtë shpallje</div>
            <div className="report-sub">
              {listingTitle ? `„${listingTitle}"` : 'Zgjidh arsyen që përshkruan më saktë problemin.'}
            </div>

            <div className="reason-list">
              {tjerat.map(a => (
                <button type="button" key={a.kodi}
                  className={`reason-btn ${kodi === a.kodi ? 'sel' : ''}`}
                  aria-pressed={kodi === a.kodi}
                  onClick={() => { setKodi(a.kodi); setGabim('') }}>
                  <span style={{ flex: 1 }}>
                    {a.etiketa}
                    {a.ndihme && (
                      <span style={{ display: 'block', fontSize: 10.5, color: '#555', marginTop: 2 }}>
                        {a.ndihme}
                      </span>
                    )}
                  </span>
                  {a.prioriteti >= 5 && (
                    <span style={{ fontSize: 9.5, color: '#C42B0F', fontWeight: 700 }}>URGJENTE</span>
                  )}
                </button>
              ))}
            </div>

            {ligjore.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#555', margin: '2px 0 7px', fontWeight: 600 }}>
                  Njoftim ligjor — për mbajtësit e një të drejte
                </div>
                <div className="reason-list">
                  {ligjore.map(a => (
                    <button type="button" key={a.kodi}
                      className={`reason-btn ${kodi === a.kodi ? 'sel' : ''}`}
                      aria-pressed={kodi === a.kodi}
                      onClick={() => { setKodi(a.kodi); setGabim('') }}>
                      <span style={{ flex: 1 }}>{a.etiketa}</span>
                      <span style={{ fontSize: 9.5, color: '#888' }}>ligjor</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {zgjedhur && (
              <div style={{ marginBottom: 12 }}>
                <textarea
                  aria-label="Përshkrimi i problemit"
                  placeholder={duhenDetaje
                    ? 'Përshkruaj saktë çfarë është problemi dhe ku shihet (e detyrueshme)…'
                    : 'Shto detaje (opsionale)…'}
                  value={detaje}
                  onChange={e => { setDetaje(e.target.value); setGabim('') }}
                  rows={3}
                  style={{
                    width: '100%', border: '1.5px solid #eee', borderRadius: 10,
                    padding: '10px 12px', fontSize: 13, fontFamily: 'inherit',
                    resize: 'vertical', outline: 'none',
                  }} />

                {eshteLigjor && (
                  <>
                    <input type="email" aria-label="Email-i yt" value={email}
                      placeholder="Email-i yt — për përgjigjen zyrtare"
                      onChange={e => { setEmail(e.target.value); setGabim('') }}
                      style={{
                        width: '100%', marginTop: 8, border: '1.5px solid #eee',
                        borderRadius: 10, padding: '10px 12px', fontSize: 13,
                        fontFamily: 'inherit', outline: 'none',
                      }} />
                    <label style={{
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                      marginTop: 10, fontSize: 11.5, color: '#666', lineHeight: 1.5,
                    }}>
                      <input type="checkbox" checked={mirebesim}
                        onChange={e => { setMirebesim(e.target.checked); setGabim('') }} />
                      <span>
                        Deklaroj në mirëbesim se përmbajtja shkel të drejtën që përfaqësoj dhe se
                        të dhënat e mësipërme janë të vërteta.
                      </span>
                    </label>
                  </>
                )}
              </div>
            )}

            {gabim && (
              <div role="alert" style={{
                fontSize: 11.5, color: '#C42B0F', background: '#FFF0EE',
                border: '1px solid #F09595', borderRadius: 9, padding: '8px 10px', marginBottom: 10,
              }}>{gabim}</div>
            )}

            <button type="button" className="report-submit" disabled={duke || !kodi} onClick={dergo}>
              {duke ? 'Duke dërguar…' : eshteLigjor ? 'Dërgo njoftimin ligjor' : 'Dërgo raportin'}
            </button>

            <div style={{ fontSize: 10.5, color: '#555', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
              {eshteLigjor
                ? 'Njoftimet për përmbajtje të paligjshme trajtohen brenda një ore.'
                : 'Raportet shqyrtohen sipas rëndësisë. Identiteti yt nuk i tregohet shitësit.'}
            </div>
          </>
        )}
      </div>
    </>
  )
}

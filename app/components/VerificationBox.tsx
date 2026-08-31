'use client'

/*  KËRKESA PËR VERIFIKIM — pjesa e përdoruesit.
 *
 *  Gjendja e gjetur më 31 gusht 2026: `verification_requests` ekzistonte me
 *  politikat e sakta, enum-et e dokumenteve dhe `admin_review_verification()`
 *  të shkruar plotësisht. Asnjë rresht i ndërfaqes nuk e prekte — as rrugë për
 *  të kërkuar, as ekran për të shqyrtuar. Kjo e mbyll gjysmën e përdoruesit.
 *
 *  PSE PA NGARKIM SKEDARI: në Shqipëri NIPT-i është publik dhe kontrollohet te
 *  QKB. Verifikimi real bëhet duke e krahasuar NIPT-in e deklaruar me regjistrin —
 *  jo duke mbajtur një kopje dokumenti. Kështu platforma nuk grumbullon dokumente
 *  identiteti që s'i duhen (minimizim, neni 5/1/c i ligjit 124/2024), dhe
 *  `doc_storage_path` mbetet për rastet kur admini kërkon diçka shtesë.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

const LLOJET: [string, string][] = [
  ['business_registration', 'Ekstrakt QKB / regjistrim biznesi'],
  ['tax_certificate',       'Vërtetim tatimor (NIPT)'],
  ['national_id',           'Kartë identiteti (person fizik)'],
  ['passport',              'Pasaportë (person fizik)'],
  ['other',                 'Tjetër'],
]

const kutia: React.CSSProperties = {
  background: '#fff', border: '1.5px solid #f0e6b0', borderRadius: 14,
  padding: 16, marginTop: 16,
}

export default function VerificationBox({ businessId, nipt }: { businessId?: string; nipt?: string | null }) {
  const [gjendja, setGjendja] = useState<any>(null)
  const [lloji, setLloji]     = useState('business_registration')
  const [duke, setDuke]       = useState(true)
  const [dergon, setDergon]   = useState('')

  const ngarko = useCallback(async () => {
    const { data } = await supabase.rpc('my_verification_status', {
      p_business_id: businessId ?? null,
    })
    setGjendja(data ?? null)
    setDuke(false)
  }, [businessId])

  useEffect(() => { ngarko() }, [ngarko])

  async function dergo() {
    setDergon('duke')
    const { error } = await supabase.from('verification_requests').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      business_id: businessId ?? null,
      doc_type: lloji,
      status: 'pending',
    })
    if (error) { setDergon(error.message); return }
    setDergon(''); ngarko()
  }

  if (duke) return null
  if (gjendja?.error) return null

  const k = gjendja?.kerkesa

  return (
    <div style={kutia}>
      <div style={{ fontSize: 13, fontWeight: 800, color: '#111', marginBottom: 6 }}>
        <span aria-hidden="true">✓</span> Verifikimi
      </div>

      {gjendja?.i_verifikuar ? (
        <div style={{ fontSize: 12.5, color: '#3B6D11', lineHeight: 1.6 }}>
          Ky profil është <strong>i verifikuar</strong>. Distinktivi shfaqet te shpalljet
          dhe te faqja e biznesit.
        </div>
      ) : k && k.status === 'pending' ? (
        <div style={{ fontSize: 12.5, color: '#555', lineHeight: 1.6 }}>
          Kërkesa jote është <strong>në shqyrtim</strong>. E dërguar më{' '}
          {new Date(k.derguar_me).toLocaleDateString('sq-AL')}. Do të marrësh njoftim
          me vendimin dhe arsyen.
        </div>
      ) : (
        <>
          {k?.status === 'rejected' && (
            <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', borderRadius: 8, padding: '9px 11px', fontSize: 12, color: '#C42B0F', marginBottom: 10, lineHeight: 1.55 }}>
              Kërkesa e mëparshme nuk u miratua.{k.shenimi ? ` „${k.shenimi}"` : ''} Mund të dërgosh një të re.
            </div>
          )}

          <p style={{ fontSize: 12, color: '#555', lineHeight: 1.6, margin: '0 0 10px' }}>
            Verifikimi krahason të dhënat e deklaruara me regjistrin publik të QKB-së.
            {businessId
              ? nipt
                ? <> NIPT-i i deklaruar: <strong>{nipt}</strong>.</>
                : <> <strong>Shto NIPT-in</strong> te të dhënat e biznesit para se të kërkosh.</>
              : null}
          </p>

          <label htmlFor="lloji-dok" style={{ fontSize: 11.5, color: '#555', display: 'block', marginBottom: 4 }}>
            Baza e verifikimit
          </label>
          <select id="lloji-dok" value={lloji} onChange={e => setLloji(e.target.value)}
            style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#111' }}>
            {LLOJET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          {dergon && dergon !== 'duke' && (
            <div role="alert" style={{ background: '#FFF0EE', color: '#C42B0F', border: '1px solid #F09595', borderRadius: 8, padding: '9px 11px', fontSize: 12, marginTop: 10 }}>{dergon}</div>
          )}

          <button type="button" onClick={dergo}
            disabled={dergon === 'duke' || (!!businessId && !nipt)}
            style={{ width: '100%', marginTop: 12, background: (!!businessId && !nipt) ? '#ddd' : '#111', color: '#fff', border: 'none', borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: (!!businessId && !nipt) ? 'not-allowed' : 'pointer' }}>
            {dergon === 'duke' ? 'Duke dërguar…' : 'Kërko verifikimin'}
          </button>

          <div style={{ fontSize: 10.5, color: '#555', marginTop: 8, lineHeight: 1.55 }}>
            Vendimin e merr një person dhe shoqërohet gjithmonë me arsye.
          </div>
        </>
      )}
    </div>
  )
}

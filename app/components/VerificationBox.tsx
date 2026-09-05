'use client'

/*  KËRKESA PËR VERIFIKIM — pjesa e përdoruesit.
 *
 *  Gjendja e gjetur më 31 gusht 2026: `verification_requests` ekzistonte me
 *  politikat e sakta, enum-et e dokumenteve dhe `admin_review_verification()`
 *  të shkruar plotësisht. Asnjë rresht i ndërfaqes nuk e prekte — as rrugë për
 *  të kërkuar, as ekran për ta shqyrtuar. Kjo e mbyll gjysmën e përdoruesit.
 *
 *  HARMONIA: ky bllok rri brenda faqes së të dhënave të biznesit dhe përdor
 *  SAKTËSISHT fjalorin pamor të `BusinessForm` — e njëjta kokë seksioni
 *  (`#C42B0F`, uppercase), e njëjta etiketë, e njëjta `.bf-input`, i njëjti
 *  buton `.bf-save`, e njëjta kuti alarmi. Asnjë stil i shpikur nga e para:
 *  përndryshe do të dukej si diçka e ngjitur, jo si pjesë e formularit.
 *
 *  PSE PA NGARKIM SKEDARI: në Shqipëri NIPT-i është publik dhe kontrollohet te
 *  QKB. Verifikimi real bëhet duke e krahasuar NIPT-in e deklaruar me regjistrin —
 *  jo duke mbajtur një kopje dokumenti identiteti që platformës nuk i duhet
 *  (minimizim, neni 5/1/c i ligjit 124/2024). `doc_storage_path` mbetet për
 *  rastet kur administrata kërkon diçka shtesë.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { dateShort } from '../../lib/format'

const LLOJET: [string, string][] = [
  ['business_registration', 'Ekstrakt QKB / regjistrim biznesi'],
  ['tax_certificate',       'Vërtetim tatimor (NIPT)'],
  ['national_id',           'Kartë identiteti (person fizik)'],
  ['passport',              'Pasaportë (person fizik)'],
  ['other',                 'Tjetër'],
]

export default function VerificationBox({ businessId, nipt }: { businessId?: string; nipt?: string | null }) {
  const [gjendja, setGjendja] = useState<any>(null)
  const [lloji, setLloji]     = useState('business_registration')
  const [duke, setDuke]       = useState(true)
  const [dergon, setDergon]   = useState('')

  // I njëjti fjalor si BusinessForm — kopjuar me qëllim, jo i përafërt.
  const sec: React.CSSProperties = { fontSize: 'var(--fs-dysheme)', fontWeight: 800, color: '#C42B0F', textTransform: 'uppercase', letterSpacing: 0.5, margin: '18px 0 10px' }
  const lbl: React.CSSProperties = { fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }

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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setDergon('Hyr në llogari për të kërkuar verifikimin.'); return }
    const { error } = await supabase.from('verification_requests').insert({
      user_id: user.id,
      business_id: businessId ?? null,
      doc_type: lloji,
      status: 'pending',
    })
    if (error) { setDergon(error.message); return }
    setDergon(''); ngarko()
  }

  if (duke || gjendja?.error) return null

  const k = gjendja?.kerkesa
  const pengesa = !!businessId && !nipt

  return (
    /*  KARTE E VECANTE, jo nje seksion i tete i formularit.
        Blloku render-ohet pas `BusinessForm`, pra pas butonit "Fshij biznesin".
        Pa nje kufi te vetin do te dukej si nje seksion i mbetur pas nje veprimi
        shkaterrues — hierarki e gabuar. Karta e ndan qarte: formulari mbaron,
        ky eshte nje veprim tjeter mbi te njejtat te dhena.  */
    <div style={{ background: '#fff', border: '1.5px solid #f0e6b0', borderRadius: 14, padding: '4px 16px 18px', marginTop: 28 }}>
      <div style={sec}>Verifikimi</div>

      {gjendja?.i_verifikuar ? (
        <div role="status" style={{ background: '#F0FFF4', border: '1px solid #86efac', borderRadius: 10, padding: '10px 14px', fontSize: 'var(--fs-dysheme)', color: '#166534', fontWeight: 600 }}>
          Ky profil është i verifikuar. Distinktivi shfaqet te shpalljet dhe te faqja e biznesit.
        </div>
      ) : k && k.status === 'pending' ? (
        <div role="status" style={{ background: '#FFF8E1', border: '1px solid #FFB74D', borderRadius: 10, padding: '10px 14px', fontSize: 'var(--fs-dysheme)', color: '#8A6D00', lineHeight: 1.6 }}>
          Kërkesa jote është <strong>në shqyrtim</strong> — dërguar më{' '}
          {dateShort(k.derguar_me)}. Do të marrësh njoftim me vendimin dhe arsyen.
        </div>
      ) : (
        <>
          {k?.status === 'rejected' && (
            <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 'var(--fs-dysheme)', color: 'var(--az-red-deep)', lineHeight: 1.6 }}>
              Kërkesa e mëparshme nuk u miratua.{k.shenimi ? ` „${k.shenimi}"` : ''} Mund të dërgosh një të re.
            </div>
          )}

          <p style={{ fontSize: 'var(--fs-dysheme)', color: '#555', lineHeight: 1.6, margin: '0 0 12px' }}>
            Verifikimi krahason të dhënat e deklaruara me regjistrin publik të QKB-së.
            {businessId && (nipt
              ? <> NIPT-i i deklaruar: <strong style={{ color: '#111' }}>{nipt}</strong>.</>
              : <> Shto <strong style={{ color: '#111' }}>NIPT-in</strong> më sipër dhe ruaje, para se ta kërkosh.</>)}
          </p>

          <label htmlFor="lloji-dok" style={lbl}>Baza e verifikimit</label>
          <select id="lloji-dok" className="bf-input" value={lloji} onChange={e => setLloji(e.target.value)}>
            {LLOJET.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          {dergon && dergon !== 'duke' && (
            <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', borderRadius: 10, padding: '10px 14px', marginTop: 12, fontSize: 'var(--fs-dysheme)', color: 'var(--az-red-deep)', fontWeight: 600 }}>
              {dergon}
            </div>
          )}

          {/*  Buton DYTESOR me qellim. Veprimi kryesor i kesaj faqeje eshte
               "Ruaj ndryshimet"; dy butona identike te kuq do te konkurronin
               per te njejten vemendje dhe do ta benin te paqarte se cili eshte
               hapi i pritur.  */}
          <button type="button" onClick={dergo} disabled={dergon === 'duke' || pengesa}
            style={{
              width: '100%', marginTop: 16, background: '#fff', color: '#111',
              border: '1.5px solid #ddd', borderRadius: 13, padding: 14,
              fontSize: 'var(--fs-dysheme)', fontWeight: 700, fontFamily: 'inherit',
              cursor: (dergon === 'duke' || pengesa) ? 'not-allowed' : 'pointer',
              opacity: (dergon === 'duke' || pengesa) ? 0.55 : 1,
            }}>
            {dergon === 'duke' ? 'Duke dërguar…' : 'Kërko verifikimin'}
          </button>

          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#555', marginTop: 8, lineHeight: 1.55, textAlign: 'center' }}>
            Vendimin e merr një person dhe shoqërohet gjithmonë me arsye.
          </div>
        </>
      )}
    </div>
  )
}

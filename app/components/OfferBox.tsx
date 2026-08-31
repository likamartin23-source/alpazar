'use client'

/*  OFERTA — pjesa e blerësit, brenda faqes së shpalljes.
 *
 *  GJENDJA E GJETUR (31 gusht 2026): tabela `offers` ekzistonte me 4 politika
 *  RLS dhe 0 rreshta; `notifications.type` përmbante tashmë `offer_received`,
 *  `offer_accepted`, `offer_rejected`. Asnjë rresht kodi nuk e prekte. Kjo e
 *  mbyll gjysmën e blerësit; gjysma e shitësit është te `/oferta`.
 *
 *  HARMONIA: blloku rri brenda trupit të faqes dhe përdor klasat GLOBALE që
 *  `ListingPageClient` deklaron tashmë (`.divider`, `.sec-label`) — të njëjtat
 *  që përdorin "Përshkrimi" dhe "Vendndodhja". Pra lexohet si seksioni i radhës
 *  i së njëjtës faqe, jo si një kuti e ngjitur.
 *
 *  HIERARKIA: butoni është DYTËSOR me qëllim. Veprimi kryesor i faqes mbetet
 *  "Fillo bisedën" te shiriti i poshtëm; një buton i dytë me të njëjtin gradient
 *  të kuq do t'i ndante vëmendjen dhe do ta bënte të paqartë hapin e pritur.
 *
 *  ASNJË KUFI I NGURTËSUAR (§2.9): pragu minimal dhe ndezja/fikja lexohen nga
 *  `listing_offer_state()`, që i merr nga `app_config`.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { priceLabel, dateShort } from '../../lib/format'

const ETIKETA: Record<string, { tekst: string; sfond: string; kufi: string; ngjyre: string }> = {
  pending:   { tekst: 'Në pritje',  sfond: '#FFF8E1', kufi: '#FFB74D', ngjyre: '#8A6D00' },
  accepted:  { tekst: 'E pranuar',  sfond: '#F0FFF4', kufi: '#86efac', ngjyre: '#166534' },
  rejected:  { tekst: 'Nuk u pranua', sfond: '#FFF0EE', kufi: '#F09595', ngjyre: '#C42305' },
  withdrawn: { tekst: 'E tërhequr', sfond: '#F3F3F3', kufi: '#ddd',    ngjyre: '#555' },
  expired:   { tekst: 'Skaduar',    sfond: '#F3F3F3', kufi: '#ddd',    ngjyre: '#555' },
}

export default function OfferBox({ listingId, isOwner, initial }:
  { listingId: string; isOwner: boolean; initial?: any }) {
  /*  `initial` vjen nga faqja prind, e marre NE TE NJEJTIN hap me shpalljen.
   *  Pa te, blloku shfaqej pas nje thirrjeje te dyte dhe i shtynte 244px poshte
   *  seksionet nen te (CLS 0,076 i matur). Thirrja e brendshme mbetet per
   *  rifreskim pas nje veprimi, dhe si rezerve nese prindi s'e jep.  */
  const [gj, setGj]         = useState<any>(initial ?? null)
  const [duke, setDuke]     = useState(!initial)
  const [shuma, setShuma]   = useState('')
  const [mesazhi, setMesazhi] = useState('')
  const [pune, setPune]     = useState('')
  const [gabim, setGabim]   = useState('')

  const ngarko = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('listing_offer_state', { p_listing_id: listingId })
      setGj(data ?? null)
    } catch { setGj(null) }
    setDuke(false)
  }, [listingId])

  /*  Prindi e sjell gjendjen pak pas montimit (thirrja niset paralel me
   *  shpalljen). Kur mberrin, e marrim ate dhe NUK bejme kerkese te dyte.
   *  Vetem nese prindi nuk e jep fare — p.sh. nje perdorim tjeter i
   *  komponentit — bie ne thirrjen e vet si rezerve.  */
  useEffect(() => {
    if (initial) { setGj(initial); setDuke(false); return }
    const t = setTimeout(() => { if (duke) ngarko() }, 1200)
    return () => clearTimeout(t)
  }, [initial, ngarko, duke])

  async function dergo() {
    setGabim(''); setPune('dergon')
    const vlera = Number(String(shuma).replace(/[^\d.]/g, ''))
    if (!Number.isFinite(vlera) || vlera <= 0) {
      setGabim('Shkruaj një shumë të vlefshme.'); setPune(''); return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/auth/login'; return }

    // `seller_id` dhe `currency` dërgohen për plotësi, POR triggeri
    // `tg_offer_before_insert` i mbishkruan nga vetë shpallja — klienti nuk
    // vendos dot kundër kujt bëhet oferta.
    const { error } = await supabase.from('offers').insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: user.id,
      amount: vlera,
      message: mesazhi.trim() || null,
    })
    if (error) { setGabim(error.message); setPune(''); return }
    setShuma(''); setMesazhi(''); setPune(''); ngarko()
  }

  async function terhiq(id: string) {
    setGabim(''); setPune('terheq')
    const { error } = await supabase.from('offers').update({ status: 'withdrawn' }).eq('id', id)
    if (error) setGabim(error.message)
    setPune(''); ngarko()
  }

  /*  HAPESIRE E REZERVUAR — me lartesine e MATUR, jo te hamendesuar.
   *
   *  Vlera e pare qe provova ketu ishte 244px, marre nga zhvendosja qe
   *  raportonte `layout-shift`. Ishte e gabuar: ajo zhvendosje vinte nga folea
   *  e hartes me siper (0 → 235px), dhe textarea e ketij blloku ishte thjesht
   *  nje element I ZHVENDOSUR, jo shkaktari. Pasi harta mori vend-mbajtesin e
   *  vet, u rimat pa asnje rezervim ketu: CLS 0,014, me nje zhvendosje 576→895
   *  = 319px. AJO eshte lartesia reale e ketij blloku. Me 319px: CLS 0,008.
   *
   *  Rezervohet VETEM per jo-pronaret: pronari sheh ose asgje ose nje shirit
   *  te vogel, ndaj nje bllok bosh do te ishte vrime ne faqen e vet.  */
  if (duke && !isOwner) {
    return <div aria-hidden="true" style={{ height: 319 }} />
  }
  if (duke || !gj || gj.error) return null
  if (!gj.aktive) return null

  // Pronari nuk bën ofertë për veten; sheh vetëm sa ka në pritje.
  if (isOwner || gj.jam_pronari) {
    if (!gj.ne_pritje) return null
    return (
      <>
        <div className="divider" />
        <div className="sec-label">Oferta</div>
        <a href="/oferta" style={{
          display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
          background: '#FFF8E1', border: '1px solid #FFB74D', borderRadius: 12, padding: '11px 14px',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#8A6D00' }}>
            {gj.ne_pritje} ofertë{Number(gj.ne_pritje) === 1 ? '' : 'a'} në pritje të përgjigjes
          </span>
          <i className="ti ti-chevron-right" aria-hidden="true" style={{ fontSize: 13, color: '#8A6D00', marginLeft: 'auto' }} />
        </a>
      </>
    )
  }

  if (!gj.shpallja_aktive) return null

  const o = gj.oferta_ime
  const eHapur = o && o.status === 'pending'
  const prag = Number(gj.kufi_perqind) > 0 && Number(gj.cmimi) > 0
    ? Math.ceil(Number(gj.cmimi) * Number(gj.kufi_perqind) / 100) : 0

  return (
    <>
      <div className="divider" />
      <div className="sec-label">Bëj një ofertë</div>

      {o && (
        <div role="status" style={{
          background: ETIKETA[o.status]?.sfond || '#F3F3F3',
          border: `1px solid ${ETIKETA[o.status]?.kufi || '#ddd'}`,
          borderRadius: 12, padding: '11px 14px', marginBottom: eHapur ? 10 : 12,
          fontSize: 12.5, color: ETIKETA[o.status]?.ngjyre || '#555', lineHeight: 1.6,
        }}>
          Oferta jote: <strong>{priceLabel(o.shuma, gj.monedha)}</strong> — {ETIKETA[o.status]?.tekst || o.status}.
          {eHapur && o.skadon && <> Skadon më {dateShort(o.skadon)}.</>}
        </div>
      )}

      {eHapur ? (
        <button type="button" onClick={() => terhiq(o.id)} disabled={pune === 'terheq'}
          style={{
            width: '100%', background: '#fff', color: '#111', border: '1.5px solid #ddd',
            borderRadius: 12, padding: 12, fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
            cursor: pune === 'terheq' ? 'not-allowed' : 'pointer', opacity: pune === 'terheq' ? 0.55 : 1,
          }}>
          {pune === 'terheq' ? 'Duke tërhequr…' : 'Tërhiq ofertën'}
        </button>
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: '#555', lineHeight: 1.65, margin: '0 0 10px' }}>
            Shitësi merr njoftim dhe përgjigjet brenda afatit. Oferta nuk është pagesë dhe
            nuk e detyron asnjë palë — Alpazar mbetet ndërmjetës.
            {prag > 0 && <> Pranohen oferta nga <strong style={{ color: '#111' }}>{priceLabel(prag, gj.monedha)}</strong> e lart.</>}
          </p>

          <label htmlFor="oferta-shuma" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>
            Shuma {gj.cmimi ? `(kërkohet ${priceLabel(gj.cmimi, gj.monedha)})` : ''}
          </label>
          <input id="oferta-shuma" inputMode="numeric" value={shuma}
            onChange={e => setShuma(e.target.value)} placeholder="p.sh. 12000"
            style={{
              width: '100%', border: '1.5px solid #e8e0c8', borderRadius: 12, padding: '11px 13px',
              fontSize: 14, fontFamily: 'inherit', background: '#fff', color: '#111', marginBottom: 10,
            }} />

          <label htmlFor="oferta-mesazhi" style={{ fontSize: 12, fontWeight: 700, color: '#555', marginBottom: 5, display: 'block' }}>
            Mesazh për shitësin (opsional)
          </label>
          <textarea id="oferta-mesazhi" value={mesazhi} onChange={e => setMesazhi(e.target.value)}
            rows={2} maxLength={300} placeholder="p.sh. Mund ta marr sot në Tiranë."
            style={{
              width: '100%', border: '1.5px solid #e8e0c8', borderRadius: 12, padding: '11px 13px',
              fontSize: 13.5, fontFamily: 'inherit', background: '#fff', color: '#111', resize: 'vertical',
            }} />

          {gabim && (
            <div role="alert" style={{
              background: '#FFF0EE', border: '1px solid #F09595', borderRadius: 10,
              padding: '10px 13px', marginTop: 10, fontSize: 12, color: '#C42305', fontWeight: 600,
            }}>{gabim}</div>
          )}

          {/*  DYTËSOR me qëllim: veprimi kryesor i faqes është "Fillo bisedën". */}
          <button type="button" onClick={dergo} disabled={pune === 'dergon'}
            style={{
              width: '100%', marginTop: 12, background: '#fff', color: '#111',
              border: '1.5px solid #ddd', borderRadius: 12, padding: 12,
              fontSize: 13.5, fontWeight: 700, fontFamily: 'inherit',
              cursor: pune === 'dergon' ? 'not-allowed' : 'pointer', opacity: pune === 'dergon' ? 0.55 : 1,
            }}>
            {pune === 'dergon' ? 'Duke dërguar…' : 'Dërgo ofertën'}
          </button>
          {/*  Frymëmarrje para seksionit pasues ("Shpallje të ngjashme"), i cili
               nuk sjell ndarës të vetin. Pa këtë, butoni ngjitet me titullin
               pasues dhe blloku duket se rrjedh brenda tij.  */}
          <div style={{ height: 14 }} />
        </>
      )}
    </>
  )
}

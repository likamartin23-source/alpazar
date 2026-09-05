'use client'

export const dynamic = 'force-dynamic'

/*  OFERTAT E MIA — gjysma e shitësit.
 *
 *  Një ekran për një pyetje: "çfarë ndodh me ofertat e mia?" — të marra dhe të
 *  dërguara në të njëjtin vend, sepse i njëjti person është herë blerës e herë
 *  shitës. Dy ekrane do t'i përgjigjeshin së njëjtës pyetje.
 *
 *  Leximi bëhet me `my_offers()` — një thirrje e vetme që sjell edhe shpalljen
 *  edhe palën tjetër. Pa N+1 mbi `listings`/`profiles`.
 *
 *  Veprimet shkruhen DREJTPËRDREJT te tabela: RLS-ja lejon vetëm palët, dhe
 *  triggeri `tg_offer_before_update` zbaton makinën e gjendjeve (shitësi vetëm
 *  pranon/refuzon, blerësi vetëm tërheq, gjendja terminale mbetet terminale).
 *  Prandaj mesazhet e gabimit nga baza janë të shkruara për t'u lexuar nga
 *  përdoruesi, jo nga zhvilluesi.
 */

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import Avatar from '../components/Avatar'
import { priceLabel, dateShort } from '../../lib/format'

const ETIKETA: Record<string, { tekst: string; sfond: string; kufi: string; ngjyre: string }> = {
  pending:   { tekst: 'Në pritje',    sfond: '#FFF8E1', kufi: '#FFB74D', ngjyre: '#8A6D00' },
  accepted:  { tekst: 'E pranuar',    sfond: '#F0FFF4', kufi: '#86efac', ngjyre: '#166534' },
  rejected:  { tekst: 'Nuk u pranua', sfond: '#FFF0EE', kufi: '#F09595', ngjyre: 'var(--az-red-deep)' },
  withdrawn: { tekst: 'E tërhequr',   sfond: '#F3F3F3', kufi: '#e0e0e0', ngjyre: '#555' },
  expired:   { tekst: 'Skaduar',      sfond: '#F3F3F3', kufi: '#e0e0e0', ngjyre: '#555' },
}

// Formatimi vjen nga `lib/format.ts` — i njëjti burim si karta, faqja e
// shpalljes dhe SEO-ja. `Intl` NUK përdoret: varet nga ICU-ja e mjedisit dhe
// jep `12,000` në vend të `12.000`, plus rrezik mospërputhjeje hidratimi.

export default function OfertatPage() {
  const [drejtimi, setDrejtimi] = useState<'marra' | 'derguara'>('marra')
  const [teDhena, setTeDhena]   = useState<any>(null)
  const [duke, setDuke]         = useState(true)
  const [gabimNgarkimi, setGabimNgarkimi] = useState(false)
  const [pune, setPune]         = useState<string>('')
  const [gabim, setGabim]       = useState('')

  const ngarko = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { window.location.href = '/auth/login'; return }
    try {
      const { data, error } = await supabase.rpc('my_offers', { p_limit: 60 })
      if (error) throw error
      setTeDhena(data ?? { marra: [], derguara: [] })
    } catch { setGabimNgarkimi(true) }
    setDuke(false)
  }, [])

  useEffect(() => { ngarko() }, [ngarko])

  /*  KOHË REALE. `offers` është në publikimin `supabase_realtime` me
   *  `replica identity full` — plumbing-u ekzistonte, por kjo faqe nuk
   *  abonohej: një shitës me faqen hapur nuk e shihte ofertën e re derisa ta
   *  rifreskonte. Pikërisht modeli që kujtesa e projektit e quan "tabelë me
   *  politika pa veçori të gjallë" — dhe sapo e kisha krijuar vetë.
   *
   *  KANALI NUK KA FILTER me qëllim: RLS-ja e `offers` lejon vetëm blerësin,
   *  shitësin dhe adminin, ndaj realtime-i dërgon VETËM rreshtat që kam të
   *  drejtë t'i shoh. Një filter i vetëm `eq` nuk do t'i mbulonte dot të dy
   *  drejtimet; filtrimi në server është edhe më i saktë, edhe më i sigurt.  */
  useEffect(() => {
    const kanali = supabase
      .channel('oferta-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => ngarko())
      .subscribe()
    return () => { supabase.removeChannel(kanali) }
  }, [ngarko])

  async function vendos(id: string, status: 'accepted' | 'rejected' | 'withdrawn') {
    setGabim(''); setPune(id)
    const { error } = await supabase.from('offers').update({ status }).eq('id', id)
    if (error) setGabim(error.message)
    setPune(''); ngarko()
  }

  const lista: any[] = (teDhena?.[drejtimi] as any[]) || []
  const nrMarra    = (teDhena?.marra as any[] || []).filter(o => o.status === 'pending').length
  const nrDerguara = (teDhena?.derguara as any[] || []).filter(o => o.status === 'pending').length

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: `.az-wrap{max-width:480px;margin:0 auto;padding:16px 0 80px}@media(min-width:768px){.az-wrap{max-width:760px}}@media(min-width:1024px){.az-wrap{max-width:100%;padding-left:clamp(32px,4vw,72px);padding-right:clamp(32px,4vw,72px)}}` }} />
    <div className="az-wrap">
      <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" aria-label="Kthehu mbrapa" onClick={() => window.history.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="ti ti-arrow-left" aria-hidden="true" style={{ fontSize: 22, color: '#111' }} />
        </button>
        <h1 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, color: '#111', margin: 0 }}>Ofertat <span aria-hidden="true">🤝</span></h1>
      </div>

      {/* Dy drejtimet e së njëjtës marrëdhënie, jo dy ekrane */}
      <div role="tablist" aria-label="Drejtimi i ofertave"
        style={{ display: 'flex', gap: 8, padding: '14px 16px 0' }}>
        {([['marra', 'Të marra', nrMarra], ['derguara', 'Të dërguara', nrDerguara]] as const).map(([kod, etiketë, nr]) => (
          <button key={kod} role="tab" type="button" aria-selected={drejtimi === kod}
            onClick={() => setDrejtimi(kod as any)}
            style={{
              flex: 1, padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 'var(--fs-dysheme)', fontWeight: 700, minHeight: 44,
              background: drejtimi === kod ? '#111' : '#fff',
              color: drejtimi === kod ? '#fff' : '#555',
              border: `1.5px solid ${drejtimi === kod ? '#111' : '#e8e0c8'}`,
            }}>
            {etiketë}{nr > 0 ? ` (${nr})` : ''}
          </button>
        ))}
      </div>

      {gabim && (
        <div role="alert" style={{
          margin: '12px 16px 0', background: '#FFF0EE', border: '1px solid #F09595',
          borderRadius: 10, padding: '10px 14px', fontSize: 'var(--fs-dysheme)', color: 'var(--az-red-deep)', fontWeight: 600,
        }}>{gabim}</div>
      )}

      {gabimNgarkimi ? (
        <div style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }} aria-hidden="true">⚠️</div>
          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#C42B0F', marginBottom: 16 }}>Nuk u ngarkuan ofertat. Kontrollo lidhjen dhe provo sërish.</div>
          <button type="button" onClick={() => window.location.reload()}
            style={{ background: 'linear-gradient(135deg,var(--az-red),#c42a0e)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', minHeight: 44, boxSizing: 'border-box', fontSize: 'var(--fs-dysheme)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Rifresko</button>
        </div>
      ) : duke ? (
        /*  Lartesia e skeletit NUK eshte e zgjedhur me sy: karta reale u mat
            ne shfletues (~268px me kokën, shiritin e shpalljes, cmimin dhe
            butonat). Me 96px, CLS-ja e matur ishte 0,148 ne telefon — mbi
            pragun 0,1 — sepse cdo karte qe mberrinte e shtynte faqen poshte.  */
        <div style={{ padding: '14px 16px 0' }}>
          {[0, 1].map(i => (
            <div key={i} style={{ height: 268, borderRadius: 14, background: '#f2ead0', opacity: 0.45, marginBottom: 12 }} />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }} aria-hidden="true">🤝</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 8 }}>
            {drejtimi === 'marra' ? 'Ende s’ke marrë oferta' : 'Ende s’ke dërguar oferta'}
          </div>
          <div style={{ fontSize: 'var(--fs-dysheme)', color: '#555', marginBottom: 24 }}>
            {drejtimi === 'marra'
              ? 'Kur dikush ofron një çmim për shpalljet e tua, do ta shohësh këtu.'
              : 'Hap një shpallje që të pëlqen dhe propozo çmimin tënd.'}
          </div>
          <a href={drejtimi === 'marra' ? '/profile' : '/'}
            style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg,var(--az-red),#c42a0e)', color: '#fff', textDecoration: 'none', borderRadius: 10, padding: '11px 24px', minHeight: 44, boxSizing: 'border-box', fontSize: 'var(--fs-dysheme)', fontWeight: 700 }}>
            {drejtimi === 'marra' ? 'Shpalljet e mia' : 'Shfleto shpalljet'}
          </a>
        </div>
      ) : (
        <div style={{ padding: '14px 16px 0' }}>
          {lista.map((o: any) => {
            const e = ETIKETA[o.status] || ETIKETA.expired
            const iHapur = o.status === 'pending'
            return (
              <div key={o.id} style={{
                background: '#fff', border: '1px solid #ececec', borderRadius: 14, padding: 14, marginBottom: 12,
                boxShadow: '0 1px 2px rgba(0,0,0,.04),0 8px 20px -12px rgba(0,0,0,.16)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Avatar src={o.pala?.avatar} name={o.pala?.emri} size={34} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.pala?.emri || 'Përdorues'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-dysheme)', color: '#6B6B6B' }}>{dateShort(o.krijuar)}</div>
                  </div>
                  <span style={{
                    fontSize: 'var(--fs-dysheme)', fontWeight: 700, padding: '4px 10px', borderRadius: 999,
                    background: e.sfond, border: `1px solid ${e.kufi}`, color: e.ngjyre, whiteSpace: 'nowrap',
                  }}>{e.tekst}</span>
                </div>

                <a href={`/listing/${o.shpallja?.id}`} style={{
                  display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                  background: '#f5f3eb', borderRadius: 10, padding: 9, marginBottom: 10,
                }}>
                  {o.shpallja?.foto
                    ? <img src={o.shpallja.foto} alt="" width={40} height={40} loading="lazy"
                        style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, flex: '0 0 auto' }} />
                    : <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: 8, background: '#e8e0c8', flex: '0 0 auto' }} />}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {o.shpallja?.titulli || 'Shpallje'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-dysheme)', color: '#6B6B6B' }}>Kërkohet {priceLabel(o.shpallja?.cmimi, o.monedha)}</div>
                  </div>
                </a>

                <div style={{ fontSize: 19, fontWeight: 800, color: '#C42B0F', letterSpacing: '-.3px' }}>
                  {priceLabel(o.shuma, o.monedha)}
                </div>
                {o.mesazhi && (
                  <div style={{ fontSize: 'var(--fs-dysheme)', color: '#555', lineHeight: 1.6, marginTop: 6 }}>„{o.mesazhi}"</div>
                )}
                {iHapur && o.skadon && (
                  <div style={{ fontSize: 'var(--fs-dysheme)', color: '#6B6B6B', marginTop: 6 }}>Skadon më {dateShort(o.skadon)}</div>
                )}

                {iHapur && drejtimi === 'marra' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button type="button" onClick={() => vendos(o.id, 'accepted')} disabled={pune === o.id}
                      style={{
                        flex: 1, minHeight: 44, background: 'linear-gradient(135deg,var(--az-red),#c42a0e)', color: '#fff',
                        border: 'none', borderRadius: 12, fontSize: 'var(--fs-dysheme)', fontWeight: 700, fontFamily: 'inherit',
                        cursor: pune === o.id ? 'not-allowed' : 'pointer', opacity: pune === o.id ? 0.55 : 1,
                      }}>Prano</button>
                    <button type="button" onClick={() => vendos(o.id, 'rejected')} disabled={pune === o.id}
                      style={{
                        flex: 1, minHeight: 44, background: '#fff', color: '#111', border: '1.5px solid #ddd',
                        borderRadius: 12, fontSize: 'var(--fs-dysheme)', fontWeight: 700, fontFamily: 'inherit',
                        cursor: pune === o.id ? 'not-allowed' : 'pointer', opacity: pune === o.id ? 0.55 : 1,
                      }}>Refuzo</button>
                  </div>
                )}

                {iHapur && drejtimi === 'derguara' && (
                  <button type="button" onClick={() => vendos(o.id, 'withdrawn')} disabled={pune === o.id}
                    style={{
                      width: '100%', minHeight: 44, marginTop: 12, background: '#fff', color: '#111',
                      border: '1.5px solid #ddd', borderRadius: 12, fontSize: 'var(--fs-dysheme)', fontWeight: 700,
                      fontFamily: 'inherit', cursor: pune === o.id ? 'not-allowed' : 'pointer',
                      opacity: pune === o.id ? 0.55 : 1,
                    }}>Tërhiq ofertën</button>
                )}

                {o.status === 'accepted' && (
                  <a href="/messages" style={{
                    display: 'block', textAlign: 'center', marginTop: 12, minHeight: 44, lineHeight: '44px',
                    background: '#F0FFF4', border: '1px solid #86efac', borderRadius: 12,
                    fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: '#166534', textDecoration: 'none',
                  }}>Vazhdo bisedën</a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}

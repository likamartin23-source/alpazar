'use client'
/**
 * DOSJA LIGJORE — verifiko · administro · shkarko · denonco · fshi
 *
 * Denoncimin e bën admini, jo sistemi. Detyra e këtij ekrani është t'i japë
 * atij provën e plotë dhe të pandryshuar, në formë të printueshme dhe të
 * dërgueshme, para se ta bëjë. Prova ngrihet në bazë (`_snapshot_listing`)
 * përpara se shpallja të hiqet — pas heqjes ajo nuk rikuperohet dot.
 */
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { dateShort, clockTime } from '../../../lib/format'

/* Autoritetet reale shqiptare, sipas natyrës së shkeljes. Lista nuk është
   dekorative: secili zë çon te një ligj i ndryshëm dhe te një afat i ndryshëm. */
export const AUTORITETET = [
  { v: 'Prokuroria e Rrethit Gjyqësor',
    p: 'Vepra penale — mashtrim, falsifikim, mallra të ndaluara' },
  { v: 'Drejtoria e Përgjithshme e Pronësisë Industriale (DPPI)',
    p: 'Markë tregtare, patentë, dizajn industrial' },
  { v: 'Komisioneri për Mbrojtjen e të Dhënave Personale',
    p: 'Të dhëna personale të publikuara pa pëlqim' },
  { v: 'Policia e Shtetit — Krimi Kibernetik',
    p: 'Mashtrim online, identitet i vjedhur, përmbajtje e paligjshme' },
  { v: 'Komisioni i Mbrojtjes së Konsumatorit',
    p: 'Praktika tregtare të padrejta, reklamë mashtruese' },
  { v: 'Drejtoria e Përgjithshme e Tatimeve',
    p: 'Tregti e padeklaruar, mungesë fature' },
  { v: 'Autoriteti i Mediave Audiovizive (AMA)',
    p: 'Përmbajtje audiovizive në kundërshtim me ligjin' },
]

const LLOJI: Record<string, string> = {
  trademark: 'Markë tregtare', copyright: 'E drejtë autori',
  illegal_content: 'Përmbajtje e paligjshme', privacy: 'Privatësi',
  defamation: 'Shpifje', other: 'Tjetër',
}

const dt = (s?: string | null) =>
  s ? `${dateShort(s)} · ${clockTime(s)}` : '—'  // determinist (dosje ligjore e printueshme)

export function DosjaLigjore({ id, onClose }: { id: string; onClose: () => void }) {
  const [d, setD] = useState<any>(null)
  const [gabim, setGabim] = useState('')
  const [duke, setDuke] = useState(true)
  const [autoriteti, setAutoriteti] = useState('')
  const [referenca, setReferenca] = useState('')
  const [shenim, setShenim] = useState('')
  const [dukeDerguar, setDukeDerguar] = useState(false)
  const [mesazh, setMesazh] = useState('')

  const ngarko = useCallback(async () => {
    setDuke(true); setGabim('')
    const { data, error } = await supabase.rpc('admin_takedown_dossier', { p_id: id })
    if (error) setGabim(error.message)
    else if (data?.error) setGabim(data.error)
    else setD(data)
    setDuke(false)
  }, [id])

  useEffect(() => { ngarko() }, [ngarko])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onClose])

  async function denonco() {
    if (!autoriteti) { setGabim('Zgjidh autoritetin.'); return }
    setDukeDerguar(true); setGabim(''); setMesazh('')
    const { data, error } = await supabase.rpc('admin_report_to_authority', {
      p_id: id, p_authority: autoriteti,
      p_ref: referenca.trim() || null, p_note: shenim.trim() || null,
    })
    setDukeDerguar(false)
    if (error) { setGabim(error.message); return }
    if (data?.error) { setGabim(data.error); return }
    setMesazh('U regjistrua denoncimi te ' + autoriteti + '.')
    ngarko()
  }

  /* Shkarkimi: një skedar i vetëm, i pavarur, që hapet dhe printohet kudo —
     pa varësi nga interneti, nga fontet, apo nga ky panel. Autoriteti e merr
     ashtu siç e sheh admini. */
  function shkarko() {
    if (!d) return
    const esc = (s: any) => String(s ?? '—')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const sh = d.prova_e_ngrire?.shpallja || {}
    const shi = d.prova_e_ngrire?.shitesi || {}
    const rr = (a: string, b: any) =>
      '<tr><th>' + esc(a) + '</th><td>' + esc(b) + '</td></tr>'
    const fotot: string[] = Array.isArray(sh.images) ? sh.images : []
    const html =
'<!doctype html><html lang="sq"><meta charset="utf-8">' +
'<title>Dosje ' + esc(d.dosja_nr) + '</title><style>' +
'*{box-sizing:border-box}body{font:13px/1.65 Georgia,"Times New Roman",serif;color:#111;max-width:820px;margin:36px auto;padding:0 28px}' +
'h1{font-size:19px;margin:0 0 2px;letter-spacing:.3px}h2{font-size:var(--fs-dysheme);text-transform:uppercase;letter-spacing:1.1px;color:#5a5a5a;border-bottom:1.5px solid #111;padding-bottom:5px;margin:26px 0 10px}' +
'.krye{border-bottom:2.5px solid #111;padding-bottom:14px;margin-bottom:8px}' +
'.nr{font:600 12px/1.4 monospace;color:#8a6a00;letter-spacing:.5px}' +
'table{width:100%;border-collapse:collapse;margin:6px 0 4px}' +
'th{text-align:left;width:31%;vertical-align:top;padding:6px 10px 6px 0;color:#444;font-weight:600}' +
'td{padding:6px 0;vertical-align:top;border-bottom:1px solid #eee}' +
'.cit{background:#faf8f2;border-left:3px solid #c9a227;padding:10px 14px;margin:8px 0;font-style:italic}' +
'.fund{margin-top:34px;padding-top:12px;border-top:1px solid #ccc;font-size:var(--fs-dysheme);color:#666}' +
'.nsh{margin-top:40px;display:flex;justify-content:space-between;gap:40px}' +
'.nsh div{flex:1;border-top:1px solid #111;padding-top:6px;font-size:var(--fs-dysheme);text-align:center}' +
'img{max-width:150px;max-height:150px;border:1px solid #ddd;margin:4px 6px 0 0;object-fit:cover}' +
'@media print{body{margin:0;max-width:none}h2{page-break-after:avoid}}' +
'</style><body>' +
'<div class="krye"><div class="nr">DOSJE Nr. ' + esc(d.dosja_nr) + '</div>' +
'<h1>Njoftim për përmbajtje të paligjshme</h1>' +
'<div style="font-size:var(--fs-dysheme);color:#666">Nxjerrë më ' + esc(dt(new Date().toISOString())) + '</div></div>' +

'<h2>1 · Platforma njoftuese</h2><table>' +
rr('Subjekti', d.platforma?.company_name) + rr('NIPT', d.platforma?.company_nipt) +
rr('Adresa', d.platforma?.company_address) + rr('Kontakt', d.platforma?.company_email) +
'</table>' +

'<h2>2 · Paraqitësi i njoftimit</h2><table>' +
rr('Emri', d.paraqitesi?.emri) + rr('Dokument identifikimi', d.paraqitesi?.dokument) +
rr('Email', d.paraqitesi?.email) + rr('Paraqitur më', dt(d.krijuar)) +
'</table>' +

'<h2>3 · Pretendimi</h2><table>' +
rr('Natyra', LLOJI[d.pretendimi?.lloji] || d.pretendimi?.lloji) +
rr('Baza ligjore', d.pretendimi?.baza_ligjore) +
rr('Adresa e përmbajtjes', d.pretendimi?.adresa) +
'</table><div class="cit">' + esc(d.pretendimi?.pershkrimi) + '</div>' +
(Array.isArray(d.pretendimi?.provat) && d.pretendimi.provat.length
  ? '<table>' + rr('Provat e paraqitura', d.pretendimi.provat.join('  ·  ')) + '</table>' : '') +

'<h2>4 · Përmbajtja e njoftuar — gjendja e ngrirë</h2>' +
'<div style="font-size:var(--fs-dysheme);color:#666;margin-bottom:6px">Regjistruar automatikisht ' +
esc(dt(d.prova_e_ngrire?.ngrire_me)) + ', para heqjes. Nuk është modifikuar.</div>' +
'<table>' + rr('Titulli', sh.title) + rr('Çmimi', (sh.price ?? '—') + ' ' + (sh.currency || '')) +
rr('Qyteti', sh.city) + rr('Publikuar', dt(sh.created_at)) +
rr('Identifikues', sh.id) + '</table>' +
(sh.description ? '<div class="cit">' + esc(sh.description) + '</div>' : '') +
(fotot.length ? '<div>' + fotot.slice(0, 6).map(u =>
  '<img src="' + esc(u) + '" alt="">').join('') + '</div>' : '') +

'<h2>5 · Shitësi</h2><table>' +
rr('Përdoruesi', shi.username) + rr('Emri', shi.full_name) +
rr('Telefon', shi.phone) + rr('Regjistruar', dt(shi.created_at)) +
rr('Identifikues', shi.id) + '</table>' +

'<h2>6 · Vendimi i platformës</h2><table>' +
rr('Vendimi', d.vendimi?.statusi === 'resolved' ? 'Njoftimi u pranua — përmbajtja u hoq'
   : d.vendimi?.statusi === 'rejected' ? 'Njoftimi u refuzua' : 'Në shqyrtim') +
rr('Marrë më', dt(d.vendimi?.marre_me)) +
rr('Koha e reagimit', (d.vendimi?.afati_ne_ore ?? '—') + ' orë nga paraqitja') +
'</table><div class="cit">' + esc(d.vendimi?.arsyetimi) + '</div>' +

'<h2>7 · Denoncimi te autoriteti</h2><table>' +
rr('Autoriteti', d.denoncimi?.autoriteti) + rr('Referenca', d.denoncimi?.referenca) +
rr('Dërguar më', dt(d.denoncimi?.derguar)) + rr('Shënim', d.denoncimi?.shenim) +
'</table>' +

'<div class="nsh"><div>Vendi dhe data</div><div>Përfaqësuesi ligjor — nënshkrimi dhe vula</div></div>' +
'<div class="fund">Kjo dosje u nxor automatikisht nga regjistri i platformës. ' +
'Prova e përmbajtjes është ngrirë në çastin e vendimit dhe ruhet e pandryshuar. ' +
'Dosja Nr. ' + esc(d.dosja_nr) + '.</div></body></html>'

    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    a.download = 'Dosje-' + (d.dosja_nr || id) + '.html'
    document.body.appendChild(a); a.click()
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 800)
  }

  const sh = d?.prova_e_ngrire?.shpallja || {}
  const shi = d?.prova_e_ngrire?.shitesi || {}
  const mungon: string[] = Array.isArray(d?.mungon) ? d.mungon : []
  const denoncuar = !!d?.denoncimi?.derguar

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,.5)', zIndex: 400 }} />
      <div role="dialog" aria-modal="true" aria-label="Dosja ligjore"
        style={{
          position: 'fixed', top: '3vh', left: '50%', transform: 'translateX(-50%)',
          width: 'min(760px, 94vw)', maxHeight: '94vh', overflow: 'auto', zIndex: 410,
          background: '#fff', borderRadius: 14, boxShadow: '0 24px 70px rgba(0,0,0,.34)',
        }}>
        <div style={{
          position: 'sticky', top: 0, background: '#111', color: '#fff',
          padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12,
          borderRadius: '14px 14px 0 0', zIndex: 2,
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: .2 }}>Dosja ligjore</div>
            <div style={{ fontSize: 'var(--fs-dysheme)', color: 'var(--az-yellow)', fontFamily: 'monospace', marginTop: 2 }}>
              {d?.dosja_nr || '…'}
            </div>
          </div>
          <button type="button" onClick={shkarko} disabled={!d}
            style={{ background: 'var(--az-yellow)', color: '#111', border: 'none', borderRadius: 9, padding: '8px 15px', fontSize: 'var(--fs-dysheme)', fontWeight: 800, cursor: 'pointer' }}>
            Shkarko dosjen
          </button>
          <button type="button" onClick={onClose} aria-label="Mbyll"
            style={{ background: 'transparent', color: '#aaa', border: 'none', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: '18px 20px 26px' }}>
          {duke && <p style={{ color: '#999', fontSize: 'var(--fs-dysheme)' }}>Duke hapur dosjen…</p>}
          {gabim && <div role="alert" style={{ background: '#FFF0EE', border: '1px solid #F09595', color: '#B4230C', borderRadius: 9, padding: '9px 12px', fontSize: 'var(--fs-dysheme)', marginBottom: 12 }}>{gabim}</div>}
          {mesazh && <div style={{ background: '#EAF3DE', border: '1px solid #B9D89A', color: '#2C6B18', borderRadius: 9, padding: '9px 12px', fontSize: 'var(--fs-dysheme)', marginBottom: 12 }}>{mesazh}</div>}

          {d && (
            <>
              {mungon.length > 0 ? (
                <div style={{ background: '#FFF9E6', border: '1px solid #F0C36D', borderRadius: 10, padding: '11px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 800, color: '#8A6D1F' }}>Dosja nuk është ende e plotë</div>
                  <div style={{ fontSize: 'var(--fs-dysheme)', color: '#7a6320', marginTop: 4 }}>
                    Mungon: {mungon.join(' · ')}. Autoriteti mund ta kthejë të paplotë.
                  </div>
                </div>
              ) : (
                <div style={{ background: '#EAF3DE', border: '1px solid #B9D89A', borderRadius: 10, padding: '11px 14px', marginBottom: 16, fontSize: 'var(--fs-dysheme)', color: '#2C6B18', fontWeight: 700 }}>
                  Dosja është e plotë dhe gati për dorëzim.
                </div>
              )}

              <Seksioni titull="Përmbajtja e ngrirë">
                <div style={{ fontSize: 'var(--fs-dysheme)', color: '#999', marginBottom: 8 }}>
                  Regjistruar {dt(d.prova_e_ngrire?.ngrire_me)} — para heqjes, e pandryshuar.
                </div>
                <Rresht e="Titulli" v={sh.title} />
                <Rresht e="Çmimi" v={sh.price != null ? `${sh.price} ${sh.currency || ''}` : null} />
                <Rresht e="Qyteti" v={sh.city} />
                <Rresht e="Publikuar" v={dt(sh.created_at)} />
                {sh.description && (
                  <div style={{ background: '#FAF8F2', borderLeft: '3px solid #C9A227', padding: '9px 12px', margin: '8px 0 0', fontSize: 'var(--fs-dysheme)', color: '#444', fontStyle: 'italic' }}>
                    {String(sh.description).slice(0, 400)}
                  </div>
                )}
                {Array.isArray(sh.images) && sh.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                    {sh.images.slice(0, 5).map((u: string, i: number) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={u} alt="" style={{ width: 74, height: 74, objectFit: 'cover', borderRadius: 7, border: '1px solid #eee' }} />
                    ))}
                  </div>
                )}
              </Seksioni>

              <Seksioni titull="Shitësi">
                <Rresht e="Përdoruesi" v={shi.username} />
                <Rresht e="Emri" v={shi.full_name} />
                <Rresht e="Telefon" v={shi.phone} />
                <Rresht e="Regjistruar" v={dt(shi.created_at)} />
              </Seksioni>

              <Seksioni titull="Paraqitësi dhe pretendimi">
                <Rresht e="Emri" v={d.paraqitesi?.emri} />
                <Rresht e="Dokument" v={d.paraqitesi?.dokument} />
                <Rresht e="Email" v={d.paraqitesi?.email} />
                <Rresht e="Natyra" v={LLOJI[d.pretendimi?.lloji] || d.pretendimi?.lloji} />
                <Rresht e="Baza ligjore" v={d.pretendimi?.baza_ligjore} />
              </Seksioni>

              <Seksioni titull="Vendimi">
                <Rresht e="Statusi" v={d.vendimi?.statusi} />
                <Rresht e="Marrë më" v={dt(d.vendimi?.marre_me)} />
                <Rresht e="Koha e reagimit" v={d.vendimi?.afati_ne_ore != null ? `${d.vendimi.afati_ne_ore} orë` : null} />
                <Rresht e="Arsyetimi" v={d.vendimi?.arsyetimi} />
              </Seksioni>

              <Seksioni titull="Denoncimi te autoriteti">
                {denoncuar ? (
                  <>
                    <Rresht e="Autoriteti" v={d.denoncimi.autoriteti} />
                    <Rresht e="Referenca" v={d.denoncimi.referenca} />
                    <Rresht e="Dërguar" v={dt(d.denoncimi.derguar)} />
                    <div style={{ fontSize: 'var(--fs-dysheme)', color: '#999', marginTop: 8 }}>
                      Regjistruar në gjurmë. Për ta dërguar sërish, shkarko dosjen.
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 'var(--fs-dysheme)', color: '#666', marginBottom: 10, lineHeight: 1.6 }}>
                      Denoncimin e bën ti. Këtu regjistrohet se ku shkoi dhe me çfarë reference,
                      që dosja të mbetet e plotë dhe e gjurmueshme.
                    </div>
                    <label style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 700, color: '#444', display: 'block', marginBottom: 4 }}>Autoriteti</label>
                    <select className="finput" value={autoriteti} aria-label="Autoriteti"
                      onChange={e => { setAutoriteti(e.target.value); setGabim('') }}>
                      <option value="">— zgjidh —</option>
                      {AUTORITETET.map(a => <option key={a.v} value={a.v}>{a.v}</option>)}
                    </select>
                    {autoriteti && (
                      <div style={{ fontSize: 'var(--fs-dysheme)', color: '#8A6D1F', marginTop: 5 }}>
                        {AUTORITETET.find(a => a.v === autoriteti)?.p}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <input className="finput" value={referenca} aria-label="Referenca e protokollit"
                        placeholder="Nr. i protokollit (opsional)"
                        onChange={e => setReferenca(e.target.value)} />
                      <input className="finput" value={shenim} aria-label="Shënim"
                        placeholder="Shënim (opsional)"
                        onChange={e => setShenim(e.target.value)} />
                    </div>
                    <button type="button" className="btn btn-red" disabled={dukeDerguar || !autoriteti}
                      style={{ marginTop: 10 }} onClick={denonco}>
                      {dukeDerguar ? 'Duke regjistruar…' : 'Regjistro denoncimin'}
                    </button>
                  </>
                )}
              </Seksioni>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function Seksioni({ titull, children }: { titull: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 'var(--fs-dysheme)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: '#999', borderBottom: '1px solid #eee', paddingBottom: 5, marginBottom: 9 }}>
        {titull}
      </div>
      {children}
    </div>
  )
}

function Rresht({ e, v }: { e: string; v: any }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '4px 0', fontSize: 'var(--fs-dysheme)' }}>
      <div style={{ width: 132, flexShrink: 0, color: '#888' }}>{e}</div>
      <div style={{ flex: 1, color: v ? '#111' : '#bbb', fontWeight: v ? 600 : 400, wordBreak: 'break-word' }}>
        {v || '—'}
      </div>
    </div>
  )
}

'use client'

/**
 * PARATË — nga pagesa te fatura tatimore te inbox-i i klientit
 *
 * RRJEDHA REALE NE SHQIPERI (jo integrim automatik me DPT-ne):
 *   1. Klienti paguan            -> fatura krijohet ketu (referencë e brendshme)
 *   2. Fatura leshohet NE APLIKACIONIN E TATIMEVE, jashte platformes
 *   3. Shkarkohet PDF-ja
 *   4. Ngarkohet ketu me numrin tatimor + NIVF/NSLF
 *   5. I shkon klientit ne inbox
 *
 * Me pare kjo skede kerkonte nje URL te gatshme — pra hapi 4 duhej bere diku
 * tjeter dhe pastaj ngjitur me dore. Tani PDF-ja ngarkohet drejtperdrejt ne
 * bucket-in PRIVAT 'invoices' (lexohet vetem nga pronari i fatures dhe stafi
 * i faturimit), dhe nje veprim i vetem e regjistron e dergon.
 *
 * NDERLIDHJET REALE:
 *   admin_awaiting_invoice()   -> kush pret, dhe ne c'faze
 *   admin_deliver_tax_invoice() -> ngarkim + numer tatimor + dergim, ne nje hap
 *   admin_send_invoice()        -> ridergim
 *   admin_refund_invoice()      -> note krediti (perdor te njejten berthame si
 *                                  e drejta e heqjes dore, neni 37/9902)
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../../lib/supabase'
import { exportCsv } from './exportCsv'
import { dateShort, moneyDec } from '../../../lib/format'

const L = (n: any) => moneyDec(n)  // determinist (1.234,56), pa ICU — si /billing
const d = (x: any) => (x ? dateShort(x) : '—')

const FILTRA: [string, string][] = [['', 'Të gjitha'], ['invoice', 'Fatura'], ['credit_note', 'Nota krediti']]

const STATUS: Record<string, [string, string]> = {
  paid: ['Paguar', 'ba'], gifted: ['Dhuruar', 'bp'], issued: ['Lëshuar', 'bp'],
  sent: ['Dërguar', 'ba'], partially_refunded: ['Rimbursuar pjesërisht', 'bd'],
  refunded: ['Rimbursuar', 'bd'], void: ['Anuluar', 'bd'],
}

type Pret = {
  invoice_id: string; reference: string; numri_tatimor: string | null
  perdoruesi: { id: string; emri: string; telefon: string | null; email: string | null }
  plani: string; shuma: number; monedha: string; paguar_me: string
  ka_skedar: boolean; derguar: boolean; gjendja: string
}

export function InvoicesTab() {
  const [rows, setRows] = useState<any[]>([])
  const [pret, setPret] = useState<Pret[]>([])
  const [permbledhje, setPermbledhje] = useState<any>({})
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')

  // dorezimi i fatures tatimore
  const [hap, setHap] = useState('')
  const [skedari, setSkedari] = useState<File | null>(null)
  const [nrTatimor, setNrTatimor] = useState('')
  const [nivf, setNivf] = useState('')
  const [nslf, setNslf] = useState('')
  const [mesazhi, setMesazhi] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // rimbursimi
  const [rimb, setRimb] = useState('')
  const [shuma, setShuma] = useState('')
  const [arsyeja, setArsyeja] = useState('')
  const [hiqAbonimin, setHiqAbonimin] = useState(false)
  const [konfirmo, setKonfirmo] = useState(false)

  const load = useCallback(async (search = '', k = '') => {
    const [a, b] = await Promise.all([
      supabase.rpc('admin_list_invoices', { p_search: search || null, p_limit: 300, p_kind: k || null }),
      supabase.rpc('admin_awaiting_invoice', { p_limit: 100 }),
    ])
    if (a.error || (a.data as any)?.error) { setErr(a.error?.message || (a.data as any)?.error); return }
    setRows((a.data as any)?.invoices || []); setErr('')
    if (!b.error && !(b.data as any)?.error) {
      setPret(((b.data as any)?.pret_fature || []) as Pret[])
      setPermbledhje((b.data as any)?.permbledhje || {})
    }
  }, [])

  useEffect(() => { load('', kind) }, [load, kind])

  // Nje pagese e re duhet te shfaqet pa rifreskim — ky ekran vendos para.
  useEffect(() => {
    const ch = supabase.channel('adm-invoices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => load(q, kind))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [load, q, kind])

  const mesazhOk = (t: string) => { setOk(t); setTimeout(() => setOk(''), 5000) }

  function hapDorezimin(invoiceId: string, ref: string) {
    const i = hap === invoiceId ? '' : invoiceId
    setHap(i); setSkedari(null); setNrTatimor(''); setNivf(''); setNslf(''); setMesazhi(''); setErr('')
    if (inputRef.current) inputRef.current.value = ''
  }

  /** Ngarkon PDF-në në bucket-in privat, pastaj regjistron dhe dërgon — një veprim. */
  async function dorezo(r: any) {
    if (!skedari) { setErr('Zgjidh fillimisht faturën e shkarkuar nga aplikacioni i tatimeve.'); return }
    if (!nrTatimor.trim()) { setErr('Numri i faturës nga aplikacioni i tatimeve është i detyrueshëm.'); return }

    setBusy(r.id); setErr('')

    // Rruga duhet të nisë me id-në e përdoruesit — RLS e bucket-it e lejon
    // pronarin të lexojë vetëm dosjen e vet.
    const emri = skedari.name.replace(/[^\w.\-]/g, '_')
    const rruga = `${r.user_id}/${Date.now()}-${emri}`

    const up = await supabase.storage.from('invoices').upload(rruga, skedari, {
      upsert: false, contentType: skedari.type || 'application/pdf',
    })
    if (up.error) { setBusy(''); setErr(`Ngarkimi dështoi: ${up.error.message}`); return }

    const { data, error } = await supabase.rpc('admin_deliver_tax_invoice', {
      p_invoice_id: r.id,
      p_file_url: rruga,
      p_fiscal_number: nrTatimor.trim(),
      p_nivf: nivf.trim() || null,
      p_nslf: nslf.trim() || null,
      p_file_name: emri,
      p_message: mesazhi.trim() || null,
    })
    setBusy('')
    if (error || (data as any)?.error) {
      setErr(error?.message || (data as any)?.error)
      // fshij skedarin e ngarkuar që të mos mbetet jetim
      await supabase.storage.from('invoices').remove([rruga])
      return
    }
    setHap('')
    mesazhOk(`Fatura ${(data as any)?.numri_tatimor} shkoi në inbox të klientit.`)
    load(q, kind)
  }

  /** Bucket-i është privat — hapja kërkon një lidhje të nënshkruar. */
  async function shihSkedarin(path: string) {
    if (/^https?:\/\//.test(path)) { window.open(path, '_blank', 'noopener'); return }
    const { data, error } = await supabase.storage.from('invoices').createSignedUrl(path, 300)
    if (error) { setErr(`Skedari nuk u hap: ${error.message}`); return }
    window.open(data.signedUrl, '_blank', 'noopener')
  }

  async function send(id: string) {
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_send_invoice', { p_invoice_id: id, p_message: null })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    mesazhOk(`${(data as any)?.reference || ''} u dërgua sërish.`)
    load(q, kind)
  }

  function hapRimbursimin(r: any) {
    setRimb(rimb === r.id ? '' : r.id)
    setShuma(String(r.mbetja ?? '')); setArsyeja(''); setHiqAbonimin(false); setKonfirmo(false); setErr('')
  }

  async function rimburso(r: any) {
    const v = Number(String(shuma).replace(',', '.'))
    if (!v || v <= 0) { setErr('Shuma duhet të jetë numër më i madh se zero.'); return }
    if (v > Number(r.mbetja)) { setErr(`Shuma e kalon mbetjen prej ${L(r.mbetja)} ${r.currency}.`); return }
    if (!arsyeja.trim()) { setErr('Arsyeja është e detyrueshme — mbetet përgjithmonë në gjurmë.'); return }
    setBusy(r.id); setErr('')
    const { data, error } = await supabase.rpc('admin_refund_invoice', {
      p_invoice_id: r.id, p_amount: v, p_reason: arsyeja.trim(), p_revoke: hiqAbonimin,
    })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    const res = data as any
    setRimb(''); setKonfirmo(false)
    mesazhOk(`Nota e kreditit ${res.credit_note} — ${L(res.amount)} ${r.currency}`
      + (res.abonimi_u_hoq ? ' · abonimi u ndërpre' : '')
      + (res.e_plote ? ' · rimbursim i plotë' : ` · mbeten ${L(res.mbetja)}`))
    load(q, kind)
  }

  const fat = rows.filter(r => r.kind !== 'credit_note')
  const st = {
    pret: (permbledhje.pa_skedar || 0) + (permbledhje.pa_derguar || 0),
    sent: rows.filter(r => r.sent_at).length,
    bruto: fat.reduce((a, r) => a + Number(r.total || 0), 0),
    rimb: rows.filter(r => r.kind === 'credit_note').reduce((a, r) => a + Math.abs(Number(r.total || 0)), 0),
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🧾</span> Paratë</div>
        {ok && <div className="live-dot">{ok}</div>}
      </div>

      <div className="stats">
        <div className="sc">
          <div className="sn" style={{ color: st.pret > 0 ? '#BA7517' : undefined }}>{st.pret}</div>
          <div className="sl">Presin veprim</div>
        </div>
        <div className="sc"><div className="sn">{st.sent}</div><div className="sl">Dërguar</div></div>
        <div className="sc"><div className="sn">{L(st.bruto)}</div><div className="sl">Faturuar bruto</div></div>
        <div className="sc">
          {/* Shenja minus vetem kur ka vertet rimbursim — perndryshe kutia
              shfaqte "−0", qe e ben operatorin te ndalet e te pyese pa arsye. */}
          <div className="sn" style={{ color: st.rimb > 0 ? 'var(--az-red)' : undefined }}>{st.rimb > 0 ? '−' : ''}{L(st.rimb)}</div>
          <div className="sl">Rimbursuar</div>
        </div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#C42B0F', fontSize: 12 }}>{err}</div>
      )}

      {/* ── HAPI QE MUNGONTE: kush pret, dhe ne c'faze ───────────────────── */}
      <div className="card" style={pret.length ? { borderColor: '#F0C36D', background: '#FFFDF6' } : undefined}>
        <div className="ct">Presin veprim</div>
        {pret.length === 0 ? (
          <div style={{ fontSize: 11.5, color: '#7A9A5B' }}>
            Asnjë pagesë nuk pret. Çdo faturë është ngarkuar dhe dërguar.
          </div>
        ) : (
          <table>
            <thead><tr><th>Klienti</th><th>Vlera</th><th>Faza</th><th style={{ width: 200 }} /></tr></thead>
            <tbody>
              {pret.map(p => {
                const r = rows.find(x => x.id === p.invoice_id)
                const gati = p.ka_skedar && !p.derguar
                return (
                  <tr key={p.invoice_id}>
                    <td style={{ fontSize: 11 }}>
                      <strong>{p.perdoruesi.emri}</strong>
                      <div style={{ color: '#aaa', fontSize: 9.5 }}>
                        {p.perdoruesi.telefon || p.perdoruesi.email || '—'} · {p.reference}
                      </div>
                    </td>
                    <td><strong>{L(p.shuma)} {p.monedha}</strong>
                      <div style={{ color: '#aaa', fontSize: 9.5 }}>{d(p.paguar_me)}</div>
                    </td>
                    <td style={{ fontSize: 10.5, color: gati ? '#7A9A5B' : '#BA7517' }}>{p.gjendja}</td>
                    <td>
                      {gati ? (
                        <button type="button" className="btn btn-green"
                          disabled={busy === p.invoice_id} onClick={() => send(p.invoice_id)}>
                          {busy === p.invoice_id ? '…' : 'Dërgo në inbox'}
                        </button>
                      ) : (
                        <button type="button" className="btn btn-orange"
                          onClick={() => r && hapDorezimin(p.invoice_id, p.reference)}>
                          Ngarko faturën tatimore
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <div className="ct">
          Kërko dhe filtro
          <input className="finput" style={{ width: 250 }} value={q}
            placeholder="Numër, emër ose email…" aria-label="Kërko fatura"
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load(q, kind) }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {FILTRA.map(([k, l]) => (
            <button type="button" key={k || 'all'} className="btn" aria-pressed={kind === k}
              style={{ background: kind === k ? '#111' : '#f0f0f0', color: kind === k ? '#fff' : '#555' }}
              onClick={() => setKind(k)}>{l}</button>
          ))}
          <button type="button" className="btn btn-orange" onClick={() => load(q, kind)}>Kërko</button>
          <button type="button" className="edit-btn" onClick={() => exportCsv('fatura', rows)}>Shkarko CSV</button>
        </div>
      </div>

      <div className="card">
        <div className="ct">Lista</div>
        <table>
          <thead>
            <tr><th>Dokumenti</th><th>Klienti</th><th>Vlera</th><th>Statusi</th><th style={{ width: 250 }} /></tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const kredit = r.kind === 'credit_note'
              const [se, sc] = STATUS[r.status] || [r.status, 'bp']
              return (
                <tr key={r.id} style={kredit ? { background: '#FFFAF9' } : undefined}>
                  <td>
                    <strong style={{ fontSize: 11.5, color: kredit ? 'var(--az-red-deep)' : undefined }}>
                      {r.fiscal_number || r.number}
                    </strong>
                    {kredit && <> <span className="badge bd">notë krediti</span></>}
                    {r.fiscal_number && <> <span className="badge ba">tatimore</span></>}
                    <div style={{ color: '#aaa', fontSize: 9.5 }}>
                      {r.plan_name} · {d(r.issued_at)}
                      {r.fiscal_number && <> · ref. {r.number}</>}
                      {kredit && r.parent_number && <> · për {r.parent_number}</>}
                    </div>
                    {r.nivf && <div style={{ color: '#999', fontSize: 9 }}>NIVF {r.nivf}</div>}
                    {r.refund_reason && (
                      <div style={{ color: '#BA7517', fontSize: 9.5, marginTop: 2 }}>“{r.refund_reason}”</div>
                    )}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {r.full_name || '—'}
                    <div style={{ color: '#aaa', fontSize: 9.5 }}>{r.email}</div>
                  </td>
                  <td>
                    <strong style={{ color: kredit ? 'var(--az-red-deep)' : undefined }}>{L(r.total)} {r.currency}</strong>
                    {!kredit && Number(r.refunded_total) > 0 && (
                      <div style={{ color: '#C42B0F', fontSize: 9.5 }}>
                        −{L(r.refunded_total)} rimbursuar · mbetet {L(r.mbetja)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${sc}`}>{se}</span>
                    {r.sent_at && <div style={{ color: '#aaa', fontSize: 9.5 }}>{d(r.sent_at)} · {r.send_count}×</div>}
                  </td>
                  <td>
                    {!kredit && !r.file_url && (
                      <button type="button" className="btn btn-orange"
                        onClick={() => hapDorezimin(r.id, r.number)}>
                        {hap === r.id ? 'Mbyll' : 'Ngarko faturën tatimore'}
                      </button>
                    )}

                    {(kredit || r.file_url) && (
                      <button type="button" className="btn btn-green" disabled={busy === r.id}
                        onClick={() => send(r.id)}>
                        {busy === r.id ? '…' : r.sent_at ? 'Dërgo sërish' : 'Dërgo në inbox'}
                      </button>
                    )}

                    {r.file_url && (
                      <div style={{ marginTop: 4, fontSize: 10 }}>
                        <button type="button" className="edit-btn" style={{ color: '#C42B0F' }}
                          onClick={() => shihSkedarin(r.file_url)}>
                          {r.file_name || 'shiko faturën'}
                        </button>
                      </div>
                    )}

                    {!kredit && Number(r.mbetja) > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <button type="button" className="edit-btn" style={{ color: '#C42B0F' }}
                          onClick={() => hapRimbursimin(r)}>
                          {rimb === r.id ? 'Mbyll' : 'Rimburso'}
                        </button>
                      </div>
                    )}

                    {/* ── Dorëzimi i faturës tatimore ────────────────────── */}
                    {hap === r.id && (
                      <div style={{ marginTop: 8, borderTop: '2px solid #F0C36D', paddingTop: 8 }}>
                        <div style={{ fontSize: 10, color: '#999', marginBottom: 6 }}>
                          Ngarko PDF-në e lëshuar në aplikacionin e tatimeve.
                        </div>
                        <input ref={inputRef} type="file" accept="application/pdf,image/jpeg,image/png"
                          aria-label="Fatura tatimore" style={{ fontSize: 10.5, width: '100%' }}
                          onChange={e => setSkedari(e.target.files?.[0] || null)} />
                        <input className="finput" style={{ marginTop: 6 }} value={nrTatimor}
                          aria-label="Numri i faturës nga tatimet"
                          placeholder="Numri i faturës nga tatimet (i detyrueshëm)"
                          onChange={e => setNrTatimor(e.target.value)} />
                        <input className="finput" style={{ marginTop: 6 }} value={nivf}
                          aria-label="NIVF" placeholder="NIVF (opsional)"
                          onChange={e => setNivf(e.target.value)} />
                        <input className="finput" style={{ marginTop: 6 }} value={nslf}
                          aria-label="NSLF" placeholder="NSLF (opsional)"
                          onChange={e => setNslf(e.target.value)} />
                        <input className="finput" style={{ marginTop: 6 }} value={mesazhi}
                          aria-label="Mesazh për klientin" placeholder="Mesazh për klientin (opsional)"
                          onChange={e => setMesazhi(e.target.value)} />
                        <button type="button" className="save-btn" style={{ marginTop: 8 }}
                          disabled={busy === r.id || !skedari || !nrTatimor.trim()}
                          onClick={() => dorezo(r)}>
                          {busy === r.id ? 'Duke ngarkuar…' : 'Ngarko dhe dërgo në inbox'}
                        </button>
                      </div>
                    )}

                    {/* ── Rimbursimi ─────────────────────────────────────── */}
                    {rimb === r.id && (
                      <div style={{ marginTop: 8, borderTop: '2px solid #F09595', paddingTop: 8 }}>
                        <div style={{ fontSize: 10, color: '#999', marginBottom: 4 }}>
                          Mbetet për rimbursim: <strong>{L(r.mbetja)} {r.currency}</strong>
                        </div>
                        <input className="finput" type="number" step="0.01" value={shuma}
                          aria-label="Shuma për rimbursim" placeholder="Shuma"
                          onChange={e => { setShuma(e.target.value); setKonfirmo(false) }} />
                        <input className="finput" style={{ marginTop: 6 }} value={arsyeja}
                          aria-label="Arsyeja e rimbursimit" placeholder="Arsyeja (e detyrueshme)"
                          onChange={e => { setArsyeja(e.target.value); setKonfirmo(false) }} />
                        <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8, fontSize: 10.5, color: '#555' }}>
                          <input type="checkbox" checked={hiqAbonimin}
                            onChange={e => { setHiqAbonimin(e.target.checked); setKonfirmo(false) }} />
                          Ndërprit edhe abonimin menjëherë
                        </label>
                        <div style={{ marginTop: 8 }}>
                          {konfirmo ? (
                            <>
                              <button type="button" className="btn btn-red" disabled={busy === r.id}
                                onClick={() => rimburso(r)}>
                                {busy === r.id ? '…' : 'Po, lësho notën e kreditit'}
                              </button>{' '}
                              <button type="button" className="edit-btn" onClick={() => setKonfirmo(false)}>Anulo</button>
                            </>
                          ) : (
                            <button type="button" className="btn btn-red"
                              disabled={!shuma || !arsyeja.trim()}
                              onClick={() => setKonfirmo(true)}>Vazhdo</button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 22 }}>Asnjë dokument.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="ct">Si funksionon</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Kur aprovohet një pagesë, këtu krijohet një <strong>referencë e brendshme</strong>
          (ALP-…). Numri fiskal nuk gjenerohet nga platforma — ai vjen nga
          <strong> aplikacioni i tatimeve</strong>, ku lëshohet fatura e vërtetë.
          <br />
          Ngarko PDF-në e shkarkuar prej andej bashkë me numrin tatimor. Skedari ruhet në një
          hapësirë <strong>private</strong> — e lexon vetëm klienti i tij dhe stafi i faturimit —
          dhe i shkon klientit në inbox me një veprim të vetëm.
          <br />
          Një faturë e lëshuar nuk fshihet dhe nuk ndryshohet kurrë. Rimbursimi krijon një
          <strong> notë krediti</strong> me shenjë negative që i referohet origjinalit — e njëjta
          bërthamë që përdor edhe e drejta e heqjes dorë brenda 14 ditëve (neni 37, ligji 9902/2008).
        </div>
      </div>
    </>
  )
}

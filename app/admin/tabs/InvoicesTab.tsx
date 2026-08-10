'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { exportCsv } from './exportCsv'

const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })
const d = (x: any) => (x ? new Date(x).toLocaleDateString('sq-AL') : '—')

const FILTRA: [string, string][] = [['', 'Të gjitha'], ['invoice', 'Fatura'], ['credit_note', 'Nota krediti']]

const STATUS: Record<string, [string, string]> = {
  paid:               ['Paguar', 'ba'],
  gifted:             ['Dhuruar', 'bp'],
  issued:             ['Lëshuar', 'bp'],
  sent:               ['Dërguar', 'ba'],
  partially_refunded: ['Rimbursuar pjesërisht', 'bd'],
  refunded:           ['Rimbursuar', 'bd'],
  void:               ['Anuluar', 'bd'],
}

export function InvoicesTab() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [kind, setKind] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState('')
  const [file, setFile] = useState('')
  const [note, setNote] = useState('')
  const [rimb, setRimb] = useState('')
  const [shuma, setShuma] = useState('')
  const [arsyeja, setArsyeja] = useState('')
  const [hiqAbonimin, setHiqAbonimin] = useState(false)
  const [konfirmo, setKonfirmo] = useState(false)

  const load = useCallback(async (search = '', k = '') => {
    const { data, error } = await supabase.rpc('admin_list_invoices',
      { p_search: search || null, p_limit: 300, p_kind: k || null })
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setRows((data as any)?.invoices || []); setErr('')
  }, [])

  useEffect(() => { load('', kind) }, [load, kind])

  const mesazh = (t: string) => { setOk(t); setTimeout(() => setOk(''), 4000) }

  async function send(id: string) {
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_send_invoice', { p_invoice_id: id, p_message: null })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    mesazh(`${(data as any)?.number} shkoi në inbox të klientit.`)
    load(q, kind)
  }

  async function attach(id: string) {
    if (!file.trim()) { setErr('Vendos URL-në e skedarit.'); return }
    setBusy(id); setErr('')
    const { data, error } = await supabase.rpc('admin_attach_invoice_file', {
      p_invoice_id: id, p_file_url: file.trim(), p_file_name: null, p_kind: 'fiscal', p_note: note || null,
    })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setFile(''); setNote(''); setOpen('')
    mesazh('Fatura tatimore u bashkëngjit — tani mund ta dërgosh.')
    load(q, kind)
  }

  function hapRimbursimin(r: any) {
    setRimb(rimb === r.id ? '' : r.id)
    setShuma(String(r.mbetja ?? ''))
    setArsyeja(''); setHiqAbonimin(false); setKonfirmo(false); setErr('')
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
    mesazh(`Nota e kreditit ${res.credit_note} — ${L(res.amount)} ${r.currency}`
      + (res.abonimi_u_hoq ? ' · abonimi u ndërpre' : '')
      + (res.e_plote ? ' · rimbursim i plotë' : ` · mbeten ${L(res.mbetja)}`))
    load(q, kind)
  }

  const fat = rows.filter(r => r.kind !== 'credit_note')
  const st = {
    total: rows.length,
    sent: rows.filter(r => r.sent_at).length,
    bruto: fat.reduce((a, r) => a + Number(r.total || 0), 0),
    rimb: rows.filter(r => r.kind === 'credit_note').reduce((a, r) => a + Math.abs(Number(r.total || 0)), 0),
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🧾</span> Faturat</div>
        {ok && <div className="live-dot">{ok}</div>}
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{st.total}</div><div className="sl">Dokumente</div></div>
        <div className="sc"><div className="sn">{st.sent}</div><div className="sl">Dërguar</div></div>
        <div className="sc"><div className="sn">{L(st.bruto)}</div><div className="sl">Faturuar bruto</div></div>
        <div className="sc"><div className="sn" style={{ color: st.rimb > 0 ? '#E63312' : undefined }}>−{L(st.rimb)}</div><div className="sl">Rimbursuar</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }}>{err}</div>
      )}

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
            <tr>
              <th>Dokumenti</th><th>Klienti</th><th>Vlera</th><th>Statusi</th><th style={{ width: 240 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const kredit = r.kind === 'credit_note'
              const [se, sc] = STATUS[r.status] || [r.status, 'bp']
              return (
                <tr key={r.id} style={kredit ? { background: '#FFFAF9' } : undefined}>
                  <td>
                    <strong style={{ fontSize: 11.5, color: kredit ? '#E63312' : undefined }}>{r.number}</strong>
                    {kredit && <> <span className="badge bd">notë krediti</span></>}
                    {r.file_kind === 'fiscal' && <> <span className="badge ba">tatimore</span></>}
                    <div style={{ color: '#aaa', fontSize: 9.5 }}>
                      {r.plan_name} · {d(r.issued_at)}
                      {kredit && r.parent_number && <> · për {r.parent_number}</>}
                    </div>
                    {r.refund_reason && (
                      <div style={{ color: '#BA7517', fontSize: 9.5, marginTop: 2 }}>“{r.refund_reason}”</div>
                    )}
                  </td>
                  <td style={{ fontSize: 11 }}>
                    {r.full_name || '—'}
                    <div style={{ color: '#aaa', fontSize: 9.5 }}>{r.email}</div>
                  </td>
                  <td>
                    <strong style={{ color: kredit ? '#E63312' : undefined }}>{L(r.total)} {r.currency}</strong>
                    {!kredit && Number(r.refunded_total) > 0 && (
                      <div style={{ color: '#E63312', fontSize: 9.5 }}>
                        −{L(r.refunded_total)} rimbursuar · mbetet {L(r.mbetja)}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${sc}`}>{se}</span>
                    {r.sent_at && <div style={{ color: '#aaa', fontSize: 9.5 }}>{d(r.sent_at)} · {r.send_count}×</div>}
                  </td>
                  <td>
                    <button type="button" className="btn btn-green" disabled={busy === r.id} onClick={() => send(r.id)}>
                      {busy === r.id ? '…' : r.sent_at ? 'Dërgo sërish' : 'Dërgo në inbox'}
                    </button>

                    {!kredit && Number(r.mbetja) > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <button type="button" className="edit-btn" style={{ color: '#E63312' }}
                          onClick={() => hapRimbursimin(r)}>
                          {rimb === r.id ? 'Mbyll' : 'Rimburso'}
                        </button>
                      </div>
                    )}

                    <div style={{ marginTop: 6 }}>
                      <button type="button" className="edit-btn" onClick={() => setOpen(open === r.id ? '' : r.id)}>
                        {open === r.id ? 'Mbyll' : 'Ngarko faturë tatimore'}
                      </button>
                    </div>

                    {r.file_url && (
                      <div style={{ marginTop: 4, fontSize: 10 }}>
                        <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#E63312' }}>
                          {r.file_name || 'shiko skedarin'}
                        </a>
                      </div>
                    )}

                    {open === r.id && (
                      <div style={{ marginTop: 8, borderTop: '1px solid #eee', paddingTop: 8 }}>
                        <input className="finput" value={file} placeholder="https://…/fatura.pdf"
                          aria-label="URL e faturës tatimore" onChange={e => setFile(e.target.value)} />
                        <input className="finput" style={{ marginTop: 6 }} value={note} placeholder="Shënim (opsional)"
                          aria-label="Shënim" onChange={e => setNote(e.target.value)} />
                        <button type="button" className="save-btn" style={{ marginTop: 6 }}
                          disabled={busy === r.id} onClick={() => attach(r.id)}>Bashkëngjit</button>
                      </div>
                    )}

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
                                {busy === r.id ? '…' : `Po, lësho notën e kreditit`}
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
          Faturat lëshohen automatikisht kur aprovohet një pagesë. “Dërgo në inbox” i shfaq klientit
          njoftimin dhe faturën te <strong>Plani im</strong>.
          <br />
          Një faturë e lëshuar nuk fshihet dhe nuk ndryshohet kurrë. Rimbursimi krijon një
          <strong> notë krediti</strong> të veçantë me shenjë negative, që i referohet faturës origjinale —
          kështu e kërkon kontabiliteti dhe kështu mbetet gjurma e plotë.
          <br />
          Rimbursimet e pjesshme lejohen deri sa mbetja të bëhet zero.
        </div>
      </div>
    </>
  )
}

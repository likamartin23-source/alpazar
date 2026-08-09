'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })
const d = (x: any) => (x ? new Date(x).toLocaleDateString('sq-AL') : '—')

export function InvoicesTab() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [open, setOpen] = useState('')
  const [file, setFile] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async (search = '') => {
    const { data, error } = await supabase.rpc('admin_list_invoices',
      { p_search: search || null, p_limit: 300 })
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setRows((data as any)?.invoices || []); setErr('')
  }, [])

  useEffect(() => { load() }, [load])

  async function send(id: string) {
    setBusy(id); setErr(''); setOk('')
    const { data, error } = await supabase.rpc('admin_send_invoice', { p_invoice_id: id, p_message: null })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setOk(`Fatura ${(data as any)?.number} shkoi në inbox të klientit.`)
    setTimeout(() => setOk(''), 3500)
    load(q)
  }

  async function attach(id: string) {
    if (!file.trim()) { setErr('Vendos URL-në e skedarit të faturës.'); return }
    setBusy(id); setErr(''); setOk('')
    const { data, error } = await supabase.rpc('admin_attach_invoice_file', {
      p_invoice_id: id, p_file_url: file.trim(), p_file_name: null, p_kind: 'fiscal', p_note: note || null,
    })
    setBusy('')
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setFile(''); setNote(''); setOpen('')
    setOk('Fatura tatimore u bashkëngjit — tani mund ta dërgosh.')
    setTimeout(() => setOk(''), 3500)
    load(q)
  }

  const st = {
    total: rows.length,
    sent: rows.filter(r => r.sent_at).length,
    fiscal: rows.filter(r => r.file_kind === 'fiscal').length,
    sum: rows.reduce((a, r) => a + Number(r.total || 0), 0),
  }

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🧾</span> Faturat</div>
        {ok && <div className="live-dot">{ok}</div>}
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{st.total}</div><div className="sl">Fatura</div></div>
        <div className="sc"><div className="sn">{st.sent}</div><div className="sl">Dërguar</div></div>
        <div className="sc"><div className="sn">{st.fiscal}</div><div className="sl">Tatimore</div></div>
        <div className="sc"><div className="sn">{L(st.sum)}</div><div className="sl">Vlera totale</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">
          Kërko
          <input className="finput" style={{ width: 260 }} value={q}
            placeholder="Numër fature ose emër…" aria-label="Kërko fatura"
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') load(q) }} />
        </div>
        <button type="button" className="btn btn-orange" onClick={() => load(q)}>Kërko</button>
      </div>

      <div className="card">
        <div className="ct">Lista</div>
        <table>
          <thead>
            <tr>
              <th>Fatura</th><th>Klienti</th><th>Vlera</th><th>Dërgimi</th><th style={{ width: 230 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>
                  <strong style={{ fontSize: 11.5 }}>{r.number}</strong>
                  {r.file_kind === 'fiscal' && <> <span className="badge ba">Tatimore</span></>}
                  <div style={{ color: '#aaa', fontSize: 9.5 }}>{r.plan_name} · {d(r.issued_at)}</div>
                </td>
                <td style={{ fontSize: 11 }}>{r.full_name || r.email || String(r.user_id).slice(0, 8)}</td>
                <td><strong>{L(r.total)} {r.currency}</strong></td>
                <td>
                  {r.sent_at
                    ? <><span className="badge ba">Dërguar</span><div style={{ color: '#aaa', fontSize: 9.5 }}>{d(r.sent_at)} · {r.send_count}×</div></>
                    : <span className="badge bp">Pa dërguar</span>}
                </td>
                <td>
                  <button type="button" className="btn btn-green" disabled={busy === r.id} onClick={() => send(r.id)}>
                    {busy === r.id ? '…' : r.sent_at ? 'Dërgo sërish' : 'Dërgo në inbox'}
                  </button>
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
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 22 }}>Asnjë faturë.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="ct">Si funksionon</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Faturat lëshohen automatikisht kur aprovohet një pagesë. “Dërgo në inbox” i shfaq klientit
          njoftimin dhe faturen te <strong>Plani im</strong>.
          <br />
          Kur të kesh faturat tatimore reale, ngarkoji këtu dhe dërgoji — klienti merr lidhjen e shkarkimit.
        </div>
      </div>
    </>
  )
}

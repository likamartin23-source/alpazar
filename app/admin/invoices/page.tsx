'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { ADMIN_BILLING_CSS } from '../billing/shared'

const L = (n: any) => Number(n || 0).toLocaleString('sq-AL', { maximumFractionDigits: 2 })

export default function AdminInvoices() {
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState('')
  const [open, setOpen] = useState('')
  const [file, setFile] = useState('')
  const [note, setNote] = useState('')

  const load = useCallback(async (search = '') => {
    const { data, error } = await supabase.rpc('admin_list_invoices', { p_search: search || null, p_limit: 200 })
    if (error || (data as any)?.error) { setMsg(`err:${error?.message || (data as any)?.error}`); return }
    setRows((data as any)?.invoices || [])
  }, [])

  useEffect(() => { load() }, [load])

  async function send(id: string) {
    setBusy(id); setMsg('')
    const { data, error } = await supabase.rpc('admin_send_invoice', { p_invoice_id: id, p_message: null })
    setBusy('')
    if (error || (data as any)?.error) { setMsg(`err:${error?.message || (data as any)?.error}`); return }
    setMsg(`ok:Fatura ${(data as any)?.number} u dërgua në inbox të klientit.`)
    load(q)
  }

  async function attach(id: string) {
    if (!file.trim()) { setMsg('err:Vendos URL-në e skedarit të faturës.'); return }
    setBusy(id); setMsg('')
    const { data, error } = await supabase.rpc('admin_attach_invoice_file', {
      p_invoice_id: id, p_file_url: file.trim(), p_file_name: null, p_kind: 'fiscal', p_note: note || null,
    })
    setBusy('')
    if (error || (data as any)?.error) { setMsg(`err:${error?.message || (data as any)?.error}`); return }
    setMsg('ok:Fatura tatimore u bashkëngjit. Tani mund ta dërgosh.')
    setFile(''); setNote(''); setOpen('')
    load(q)
  }

  const [mt, mm] = msg.split(/:(.+)/)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => window.history.back()}>
            <i className="ti ti-arrow-left" aria-hidden="true" />
          </button>
          <h1 className="tt">Faturat</h1>
        </div>

        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}

          <div className="search">
            <input value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') load(q) }}
              placeholder="Kërko me numër fature, email ose emër…" aria-label="Kërko fatura" />
            <button type="button" className="btn" onClick={() => load(q)}>Kërko</button>
          </div>

          <div className="stats">
            <div className="st"><b>{rows.length}</b><span>Fatura</span></div>
            <div className="st"><b>{rows.filter(r => r.sent_at).length}</b><span>Dërguar</span></div>
            <div className="st"><b>{rows.filter(r => r.file_kind === 'fiscal').length}</b><span>Tatimore</span></div>
          </div>

          {rows.length === 0 && <div className="panel center muted">Asnjë faturë.</div>}

          {rows.map(r => (
            <div key={r.id} className="panel">
              <div className="sub-t">
                <b>{r.number}</b>
                {r.file_kind === 'fiscal' && <span className="pill">TATIMORE</span>}
                {r.sent_at && <span className="pill">Dërguar {r.send_count}×</span>}
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 8 }}>
                {r.full_name || r.email || r.user_id} · {r.plan_name} · {L(r.total)} {r.currency}
                {r.issued_at ? ` · ${new Date(r.issued_at).toLocaleDateString('sq-AL')}` : ''}
              </div>

              {r.file_url && (
                <div className="muted" style={{ fontSize: 11, marginBottom: 8 }}>
                  Skedari: <a href={r.file_url} target="_blank" rel="noopener noreferrer">{r.file_name || 'shiko'}</a>
                </div>
              )}

              <div className="btns">
                <button type="button" className="btn primary" disabled={busy === r.id} onClick={() => send(r.id)}>
                  {busy === r.id ? 'Duke dërguar…' : r.sent_at ? 'Dërgo sërish' : 'Dërgo në inbox'}
                </button>
                <button type="button" className="btn" onClick={() => setOpen(open === r.id ? '' : r.id)}>
                  {open === r.id ? 'Mbyll' : 'Ngarko faturë tatimore'}
                </button>
              </div>

              {open === r.id && (
                <div style={{ marginTop: 10, borderTop: '.5px solid #eee', paddingTop: 10 }}>
                  <label>URL e skedarit (PDF i faturës tatimore)</label>
                  <input value={file} onChange={e => setFile(e.target.value)} placeholder="https://…/fatura.pdf" />
                  <label style={{ marginTop: 8 }}>Shënim (opsional)</label>
                  <input value={note} onChange={e => setNote(e.target.value)} placeholder="p.sh. Faturë tatimore e rregjistruar" />
                  <button type="button" className="btn primary" style={{ marginTop: 8 }}
                    disabled={busy === r.id} onClick={() => attach(r.id)}>Bashkëngjit</button>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 6 }}>
                    Pasi bashkëngjitet, kliko “Dërgo në inbox” — klienti e merr njoftimin me lidhjen e shkarkimit.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

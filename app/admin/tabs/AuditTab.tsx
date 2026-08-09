'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

const LABELS: Record<string, string> = {
  approve_payment: 'Aprovoi pagesen',
  reject_payment: 'Refuzoi pagesen',
  gift_subscription: 'Dhuroi abonim',
  set_user_flag: 'Ndryshoi statusin e perdoruesit',
  delete_user: 'Fshiu perdoruesin',
  send_invoice: 'Dergoi faturen',
  subscription_status: 'Ndryshoi abonimin',
}
const d = (x: any) => (x ? new Date(x).toLocaleString('sq-AL') : '—')

export function AuditTab() {
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState('')
  const [q, setQ] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_recent_actions', { p_limit: 300 })
    if (error || (data as any)?.error) { setErr(error?.message || (data as any)?.error); return }
    setRows((data as any)?.actions || []); setErr('')
  }, [])

  useEffect(() => { load() }, [load])

  const shown = q.trim()
    ? rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.trim().toLowerCase()))
    : rows

  return (
    <>
      <div className="ph">
        <div className="pt"><span aria-hidden="true">🧭</span> Gjurma e veprimeve</div>
        <div className="live-dot">Pergjegjshmeri</div>
      </div>

      <div className="stats">
        <div className="sc"><div className="sn">{rows.length}</div><div className="sl">Veprime</div></div>
        <div className="sc"><div className="sn">{new Set(rows.map(r => r.admin_name)).size}</div><div className="sl">Administratore</div></div>
        <div className="sc"><div className="sn">{rows.filter(r => r.action === 'approve_payment').length}</div><div className="sl">Aprovime</div></div>
        <div className="sc"><div className="sn">{rows.filter(r => String(r.action).includes('delete')).length}</div><div className="sl">Fshirje</div></div>
      </div>

      {err && (
        <div className="card" role="alert"
          style={{ borderColor: '#F09595', background: '#FFF0EE', color: '#E63312', fontSize: 12 }}>{err}</div>
      )}

      <div className="card">
        <div className="ct">
          Historiku
          <input className="finput" style={{ width: 240 }} value={q}
            placeholder="Kerko ne gjurme…" aria-label="Kerko" onChange={e => setQ(e.target.value)} />
        </div>
        <table>
          <thead>
            <tr><th>Kur</th><th>Kush</th><th>Veprimi</th><th>Objekti</th><th>Detaje</th></tr>
          </thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.id}>
                <td style={{ whiteSpace: 'nowrap', color: '#888' }}>{d(r.created_at)}</td>
                <td><strong style={{ fontSize: 11.5 }}>{r.admin_name || '—'}</strong></td>
                <td><span className="badge bp">{LABELS[r.action] || r.action}</span></td>
                <td style={{ color: '#666', fontSize: 10.5 }}>
                  {r.target_type || '—'}
                  {r.target_id && <div style={{ color: '#bbb' }}>{String(r.target_id).slice(0, 8)}</div>}
                </td>
                <td style={{ fontSize: 10, color: '#888', maxWidth: 260, wordBreak: 'break-word' }}>
                  {r.new_value ? JSON.stringify(r.new_value) : '—'}
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#aaa', padding: 22 }}>
                Asnje veprim i regjistruar ende.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="ct">Pse ekziston</div>
        <div style={{ fontSize: 11, color: '#666', lineHeight: 1.8 }}>
          Cdo veprim i ndjeshem — aprovim pagese, dhurate, pezullim, fshirje, dergim fature —
          regjistrohet me kohen, autorin dhe objektin. Gjurma nuk mund te bllokoje kurre nje veprim:
          nese regjistrimi deshton, veprimi kryhet gjithsesi.
        </div>
      </div>
    </>
  )
}

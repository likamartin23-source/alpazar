'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import { ADMIN_BILLING_CSS } from '../billing/shared'

export default function AdminUsersPage() {
  const { user, profile, authReady } = useAlpazar()
  const [rows, setRows] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  const load = useCallback(async (query: string) => {
    let qb = supabase.from('profiles')
      .select('id,username,full_name,is_premium,is_admin,is_suspended,is_verified,premium_expires_at,created_at')
      .order('created_at', { ascending: false }).limit(50)
    if (query.trim()) qb = qb.or(`username.ilike.%${query.trim()}%,full_name.ilike.%${query.trim()}%`)
    const { data } = await qb
    setRows(data || [])
  }, [])

  useEffect(() => { if (authReady && user) load('') }, [authReady, user, load])

  function flash(ok: boolean, t: string) { setMsg(`${ok ? 'ok' : 'err'}:${t}`); setTimeout(() => setMsg(''), 3000) }

  async function toggle(id: string, field: 'is_suspended' | 'is_verified', val: boolean) {
    const { error } = await supabase.from('profiles').update({ [field]: val }).eq('id', id)
    if (error) { flash(false, error.message); return }
    flash(true, 'U ruajt.'); load(q)
  }

  if (!authReady) return null
  if (!profile?.is_admin) return (
    <><style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
    <div className="wrap"><div className="body"><div className="card center">Vetím për administratën.</div></div></div></>
  )

  const [mt, mm] = msg.split(/:(.+)/)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => { window.location.href = '/admin' }}><i className="ti ti-arrow-left" aria-hidden="true" /></button>
          <h1 className="tt">Përdoruesit — Administrata</h1>
        </div>
        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}
          <div className="card">
            <input placeholder="Kërko me emër ose username…" value={q}
              onChange={e => { setQ(e.target.value); load(e.target.value) }}
              style={{ width: '100%', border: '1.5px solid #e0e0e0', borderRadius: 8, padding: '9px 11px', fontSize: 13, fontFamily: 'inherit' }} />
          </div>
          {rows.map(r => (
            <div key={r.id} className="card">
              <div className="row">
                <div>
                  <b>{r.full_name || r.username || r.id.slice(0, 8)}</b> <span className="muted">@{r.username || '—'}</span>
                  <div className="muted">
                    {r.is_admin && 'Admin · '}{r.is_premium ? `Premium deri ${r.premium_expires_at ? new Date(r.premium_expires_at).toLocaleDateString('sq-AL') : '—'}` : 'Falas'}
                    {r.is_suspended && ' · PEZULLUAR'}{r.is_verified && ' · ✔ Verifikuar'}
                  </div>
                </div>
                <div className="row-r">
                  <button type="button" className="btn small" onClick={() => toggle(r.id, 'is_verified', !r.is_verified)}>{r.is_verified ? 'Hiq ✔' : 'Verifiko'}</button>
                  <button type="button" className="btn small" style={r.is_suspended ? {} : { color: '#E63312', borderColor: '#E63312' }}
                    onClick={() => { if (r.is_suspended || confirm('Pezullo këtë përdorues? (bllokohet nga platforma)')) toggle(r.id, 'is_suspended', !r.is_suspended) }}>
                    {r.is_suspended ? 'Aktivizo' : 'Pezullo'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          <div className="muted" style={{ fontSize: 11 }}>Dhurimi/çaktivizimi i abonimeve: te /admin/billing → Abonimet. Fshirja përfundimtare e llogarisë bëhet vetëm me kërkesë të përdoruesit (GDPR) te të-dhënat-e-mia.</div>
        </div>
      </div>
    </>
  )
}

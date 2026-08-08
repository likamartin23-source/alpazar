'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAlpazar } from '../../../lib/context'
import { ADMIN_BILLING_CSS } from '../billing/shared'
import { UserRow } from './row'

const FILTERS = [
  ['all', 'Të gjithë'], ['premium', 'Premium'], ['verified', 'Verifikuar'],
  ['suspended', 'Pezulluar'], ['admins', 'Admin'],
] as const

export default function AdminUsersPage() {
  const { user, profile, authReady } = useAlpazar()
  const [users, setUsers] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [u, p, s] = await Promise.all([
      supabase.rpc('admin_list_users', { p_q: q, p_filter: filter, p_limit: 100 }),
      supabase.from('premium_plans').select('id,name,slug,billing_period,duration_days').eq('is_active', true).order('billing_period').order('price_eur'),
      supabase.rpc('admin_stats'),
    ])
    setUsers(u.data?.users || [])
    setPlans(p.data || [])
    setStats(s.data && !s.data.error ? s.data : null)
    setLoading(false)
  }, [q, filter])

  useEffect(() => { if (authReady && user) load() }, [authReady, user, load])

  // Rifreskim live kur ndryshon dikush
  useEffect(() => {
    if (!authReady || !user) return
    const ch = supabase.channel('admin-users-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [authReady, user, load])

  function flash(ok: boolean, text: string) {
    setMsg(`${ok ? 'ok' : 'err'}:${text}`)
    setTimeout(() => setMsg(''), 3500)
  }

  async function act(fn: string, args: any, okText: string) {
    const { data, error } = await supabase.rpc(fn, args)
    if (error || data?.error) { flash(false, error?.message || data?.error); return }
    flash(true, okText); load()
  }

  if (!authReady) return null
  if (!profile?.is_admin) {
    return (<><style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
      <div className="wrap"><div className="body"><div className="card center">Vetëm për administratën.</div></div></div></>)
  }

  const [mt, mm] = msg.split(/:(.+)/)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ADMIN_BILLING_CSS }} />
      <div className="wrap">
        <div className="topbar">
          <button type="button" className="back" aria-label="Kthehu" onClick={() => { window.location.href = '/admin' }}><i className="ti ti-arrow-left" aria-hidden="true" /></button>
          <h1 className="tt">Përdoruesit</h1>
        </div>

        <div className="body">
          {msg && <div className={`msg ${mt}`} role="alert">{mm}</div>}

          {stats && (
            <div className="stats">
              <div className="st"><b>{stats.users_total}</b><span>Përdorues</span></div>
              <div className="st"><b>{stats.users_premium}</b><span>Premium</span></div>
              <div className="st"><b>{stats.users_new_7d}</b><span>Të rinj (7d)</span></div>
              <div className="st"><b>{stats.users_suspended}</b><span>Pezulluar</span></div>
            </div>
          )}

          <input className="search" placeholder="Kërko me emër ose username…" value={q} onChange={e => setQ(e.target.value)} aria-label="Kërko përdorues" />
          <div className="tabs" style={{ padding: '8px 0' }}>
            {FILTERS.map(([id, label]) => (
              <button key={id} type="button" className={`tab ${filter === id ? 'on' : ''}`} onClick={() => setFilter(id)}>{label}</button>
            ))}
          </div>

          {loading && <div className="card center muted">Duke ngarkuar…</div>}
          {!loading && users.length === 0 && <div className="card center muted">Asnjë përdorues.</div>}
          {users.map(u => <UserRow key={u.id} u={u} plans={plans} act={act} />)}
        </div>
      </div>
    </>
  )
}

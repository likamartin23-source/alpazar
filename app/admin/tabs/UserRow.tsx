'use client'

const d = (x: any) => (x ? new Date(x).toLocaleDateString('sq-AL') : '')

export function UserRow({ u, plans, pick, setPick, busy, confirmDel, setConfirmDel, call }: any) {
  const subs = u.subscriptions || []
  return (
    <tr>
      <td>
        <strong style={{ fontSize: 11.5 }}>{u.full_name || u.username || '—'}</strong>
        <div style={{ color: '#999', fontSize: 10 }}>
          {u.username ? '@' + u.username : String(u.id).slice(0, 8)} · {u.listings} shpallje
        </div>
      </td>

      <td>
        {u.is_admin && <span className="badge bp">Admin</span>}{' '}
        {u.is_verified && <span className="badge ba">Verifikuar</span>}{' '}
        {u.is_suspended && <span className="badge bd">Pezulluar</span>}
      </td>

      <td>
        {subs.length === 0 && <span style={{ color: '#bbb' }}>—</span>}
        {subs.map((s: any, i: number) => (
          <div key={i} style={{ marginBottom: 3 }}>
            <span className={`badge ${s.status === 'active' ? 'ba' : 'bp'}`}>
              {s.tier === 'boost' ? 'VIP' : 'Premium'}
            </span>{' '}
            <span style={{ fontSize: 10, color: '#666' }}>{s.plan}</span>
            {s.period_end && <div style={{ color: '#aaa', fontSize: 9.5 }}>deri {d(s.period_end)}</div>}
          </div>
        ))}
      </td>

      <td>
        <button type="button" className="edit-btn" disabled={busy === u.id}
          onClick={() => call('admin_set_user_flag', { p_user_id: u.id, p_flag: 'is_suspended', p_value: !u.is_suspended }, u.id)}>
          {u.is_suspended ? 'Aktivizo' : 'Pezullo'}
        </button>{' '}
        <button type="button" className="edit-btn" disabled={busy === u.id}
          onClick={() => call('admin_set_user_flag', { p_user_id: u.id, p_flag: 'is_verified', p_value: !u.is_verified }, u.id)}>
          {u.is_verified ? 'Hiq ✓' : 'Verifiko'}
        </button>

        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          <select className="finput" style={{ width: 128 }} aria-label="Plani për dhuratë"
            value={pick[u.id] || ''} onChange={e => setPick((p: any) => ({ ...p, [u.id]: e.target.value }))}>
            <option value="">Dhuro plan…</option>
            {plans.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button type="button" className="btn btn-green" disabled={!pick[u.id] || busy === u.id}
            onClick={() => call('admin_gift_subscription', { p_user_id: u.id, p_plan_id: pick[u.id], p_days: null }, u.id)}>
            Dhuro
          </button>
        </div>

        <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
          {subs.length > 0 && (
            <button type="button" className="edit-btn" disabled={busy === u.id}
              onClick={() => call('admin_deactivate_subscription', { p_user_id: u.id, p_reason: 'Nga paneli' }, u.id)}>
              Çaktivizo
            </button>
          )}
          {confirmDel === u.id ? (
            <>
              <button type="button" className="btn btn-red" disabled={busy === u.id}
                onClick={() => call('admin_delete_user', { p_user_id: u.id }, u.id)}>Po, fshi</button>
              <button type="button" className="edit-btn" onClick={() => setConfirmDel('')}>Jo</button>
            </>
          ) : (
            <button type="button" className="edit-btn" style={{ color: '#E63312' }}
              onClick={() => setConfirmDel(u.id)}>Fshi</button>
          )}
        </div>
      </td>
    </tr>
  )
}

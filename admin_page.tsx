'use client'

import { useEffect, useState } from 'react'
import { supabaseAdmin } from '../../lib/supabase-admin'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, premium: 0, revenue: 0, listings: 0, pending: 0 })
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const [
      { count: users },
      { count: premium },
      { count: listings },
      { count: pending },
      { data: payments },
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true),
      supabaseAdmin.from('listings').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabaseAdmin.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('premium_subscriptions')
        .select('*, profiles(full_name, username)')
        .order('created_at', { ascending: false })
        .limit(10),
    ])

    // Llogarit te ardhurat e muajit
    const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0)
    const { data: monthPayments } = await supabaseAdmin
      .from('premium_subscriptions')
      .select('amount_eur')
      .eq('status', 'active')
      .gte('created_at', thisMonth.toISOString())

    const revenue = monthPayments?.reduce((sum, p) => sum + (p.amount_eur || 0), 0) || 0

    setStats({ users: users||0, premium: premium||0, revenue, listings: listings||0, pending: pending||0 })
    setRecentPayments(payments || [])
    setLoading(false)
  }

  async function handlePaymentAction(id: string, action: 'active'|'suspended'|'cancelled') {
    await supabaseAdmin.from('premium_subscriptions').update({ status: action }).eq('id', id)
    fetchStats()
  }

  const statusColor: Record<string, string> = {
    active: '#1D9E75', pending: '#BA7517', suspended: '#E63312', cancelled: '#888'
  }
  const statusLabel: Record<string, string> = {
    active: 'Aktiv', pending: 'Në pritje', suspended: 'Pezulluar', cancelled: 'Anuluar'
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;font-family:system-ui,sans-serif;}
        .admin-wrap{display:flex;min-height:100vh;background:var(--color-background-secondary,#f5f5f5);}
        .sidebar{width:200px;background:#111;padding:0;display:flex;flex-direction:column;flex-shrink:0;}
        .sidebar-logo{padding:16px 16px 12px;border-bottom:0.5px solid #222;}
        .sidebar-logo .name{font-size:14px;font-weight:700;color:#F5C842;letter-spacing:1px;}
        .sidebar-logo .role{font-size:10px;color:#888;margin-top:2px;}
        .nav-item{padding:10px 16px;display:flex;align-items:center;gap:9px;cursor:pointer;border-left:3px solid transparent;text-decoration:none;}
        .nav-item:hover{background:#1a1a1a;}
        .nav-item.active{background:#1a1a1a;border-left-color:#F5C842;}
        .nav-item i{font-size:16px;color:#666;}
        .nav-item.active i{color:#F5C842;}
        .nav-item span{font-size:11px;color:#666;}
        .nav-item.active span{color:#F5C842;font-weight:700;}
        .content{flex:1;padding:20px;}
        .page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
        .page-title{font-size:18px;font-weight:700;color:#111;}
        .live-badge{background:#1D9E75;color:#fff;border-radius:5px;padding:4px 10px;font-size:11px;font-weight:700;}
        .stats-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px;}
        .stat-card{background:#fff;border:0.5px solid #eee;border-radius:10px;padding:14px;}
        .stat-num{font-size:22px;font-weight:700;color:#111;}
        .stat-lbl{font-size:10px;color:#888;margin-top:2px;}
        .stat-sub{font-size:10px;margin-top:4px;font-weight:600;}
        .green{color:#1D9E75;} .red{color:#E63312;} .amber{color:#BA7517;}
        .card{background:#fff;border:0.5px solid #eee;border-radius:10px;padding:16px;margin-bottom:16px;}
        .card-title{font-size:13px;font-weight:700;color:#111;margin-bottom:12px;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th{background:#f5f5f5;color:#888;font-weight:700;padding:8px 10px;text-align:left;border-bottom:0.5px solid #eee;font-size:10px;text-transform:uppercase;}
        td{padding:9px 10px;border-bottom:0.5px solid #f5f5f5;color:#333;vertical-align:middle;}
        tr:last-child td{border:none;}
        tr:hover td{background:#fafafa;}
        .status-badge{border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;}
        .action-btn{border:none;border-radius:4px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;margin-right:3px;}
        .btn-edit{background:#EEF4FF;color:#185FA5;}
        .btn-pause{background:#FAEEDA;color:#BA7517;}
        .btn-activate{background:#EAF3DE;color:#1D9E75;}
        .btn-delete{background:#FFF0EE;color:#E63312;}
        .empty-row td{text-align:center;color:#aaa;padding:20px;}
      `}</style>

      <div className="admin-wrap">
        {/* SIDEBAR */}
        <div className="sidebar">
          <div className="sidebar-logo">
            <div className="name">🦅 ALPAZAR</div>
            <div className="role">Admin Panel</div>
          </div>
          <a href="/admin" className="nav-item active"><i className="ti ti-layout-dashboard"/><span>Dashboard</span></a>
          <a href="/admin/users" className="nav-item"><i className="ti ti-users"/><span>Përdoruesit</span></a>
          <a href="/admin/payments" className="nav-item"><i className="ti ti-credit-card"/><span>Pagesat</span></a>
          <a href="/admin/categories" className="nav-item"><i className="ti ti-layout-grid"/><span>Kategorite</span></a>
          <a href="/admin/listings" className="nav-item"><i className="ti ti-list"/><span>Shpalljet</span></a>
          <a href="/admin/reports" className="nav-item"><i className="ti ti-flag"/><span>Raportimet</span></a>
          <a href="/admin/settings" className="nav-item"><i className="ti ti-settings"/><span>Konfigurime</span></a>
          <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '0.5px solid #222' }}>
            <a href="/" style={{ color: '#888', fontSize: 11, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="ti ti-arrow-left" style={{ fontSize: 13 }} />
              Kthehu te faqja
            </a>
          </div>
        </div>

        {/* CONTENT */}
        <div className="content">
          <div className="page-header">
            <div className="page-title">📊 Dashboard</div>
            <div className="live-badge">● Live</div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>Duke ngarkuar...</div>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-num">{stats.users}</div>
                  <div className="stat-lbl">Përdorues total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{stats.premium}</div>
                  <div className="stat-lbl">Premium aktiv</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{stats.revenue.toFixed(2)}€</div>
                  <div className="stat-lbl">Të ardhura (ky muaj)</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num">{stats.listings}</div>
                  <div className="stat-lbl">Shpallje aktive</div>
                </div>
                <div className="stat-card">
                  <div className="stat-num" style={{ color: stats.pending > 0 ? '#E63312' : '#111' }}>{stats.pending}</div>
                  <div className="stat-lbl">Raporte në pritje</div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Pagesat e fundit</div>
                <table>
                  <thead>
                    <tr>
                      <th>Përdoruesi</th>
                      <th>Plan</th>
                      <th>Shuma</th>
                      <th>Metoda</th>
                      <th>Statusi</th>
                      <th>Veprime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPayments.length === 0 ? (
                      <tr className="empty-row"><td colSpan={6}>Nuk ka pagesa aktualisht</td></tr>
                    ) : (
                      recentPayments.map((p: any) => (
                        <tr key={p.id}>
                          <td>{p.profiles?.full_name || p.profiles?.username || '—'}</td>
                          <td>{p.plan === 'monthly' ? 'Premium Mujor' : 'Premium Vjetor'}</td>
                          <td style={{ fontWeight: 700, color: '#1D9E75' }}>{p.amount_eur}€</td>
                          <td>{p.payment_method}</td>
                          <td>
                            <span className="status-badge" style={{ background: `${statusColor[p.status]}20`, color: statusColor[p.status] }}>
                              {statusLabel[p.status]}
                            </span>
                          </td>
                          <td>
                            {p.status !== 'active' && (
                              <button className="action-btn btn-activate" onClick={() => handlePaymentAction(p.id, 'active')}>
                                Aktivizo
                              </button>
                            )}
                            {p.status === 'active' && (
                              <button className="action-btn btn-pause" onClick={() => handlePaymentAction(p.id, 'suspended')}>
                                Pezullo
                              </button>
                            )}
                            <button className="action-btn btn-delete" onClick={() => handlePaymentAction(p.id, 'cancelled')}>
                              Anulo
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

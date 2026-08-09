'use client'

import { useAlpazar } from '../../lib/context'

const LEVELS: Record<string, { bg: string; bd: string; fg: string; icon: string }> = {
  info:    { bg: '#EAF2FF', bd: '#9CC3FF', fg: '#14448C', icon: 'ℹ️' },
  sukses:  { bg: '#EAF3DE', bd: '#97C459', fg: '#3B6D11', icon: '✅' },
  kujdes:  { bg: '#FFF8E1', bd: '#FFE082', fg: '#856404', icon: '⚠️' },
}

// Njoftim i platformes — i redaktueshem nga Paneli, i dukshem per te gjithe.
export function AnnouncementBar() {
  const { cfgBool, cfg } = useAlpazar()
  if (!cfgBool('announcement_active')) return null
  const text = cfg('announcement_text', '').trim()
  if (!text) return null
  const lv = LEVELS[cfg('announcement_level', 'info')] || LEVELS.info
  return (
    <div role="status" aria-live="polite" style={{
      background: lv.bg, borderBottom: `1px solid ${lv.bd}`, color: lv.fg,
      padding: '9px 14px', fontSize: 12.5, fontWeight: 600, textAlign: 'center',
      lineHeight: 1.5, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    }}>
      <span aria-hidden="true">{lv.icon}</span> {text}
    </div>
  )
}

export function MaintenanceBanner() {
  const { cfgBool, cfg, profile } = useAlpazar()

  // Admins always pass through
  if (profile?.is_admin) return null
  if (!cfgBool('maintenance_mode')) return null

  const msg = cfg('maintenance_message', 'Platforma është duke u mirëmbajtur. Kthehuni së shpejti.')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#111',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, textAlign: 'center',
    }} role="alert" aria-live="assertive">
      <div style={{ fontSize: 56, marginBottom: 16 }} aria-hidden="true">🔧</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#F5C842', marginBottom: 10 }}>
        Mirëmbajtje
      </div>
      <div style={{ fontSize: 14, color: '#aaa', maxWidth: 300, lineHeight: 1.6 }}>
        {msg}
      </div>
      <div style={{ marginTop: 24, fontSize: 11, color: '#444' }}>
        alpazar.vercel.app
      </div>
    </div>
  )
}

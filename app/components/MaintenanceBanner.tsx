'use client'

import { useAlpazar } from '../../lib/context'

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
    }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>🔧</div>
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

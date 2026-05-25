'use client'

import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Ensure a profile row exists (may be a new OTP user with no profile yet)
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', session.user.id)
          .single()

        if (!existing) {
          const email = session.user.email || ''
          await supabase.from('profiles').upsert({
            id: session.user.id,
            username: email ? email.split('@')[0].replace(/[^a-z0-9_]/gi, '') : null,
            full_name: session.user.user_metadata?.full_name || null,
            phone: session.user.phone || null,
          }, { onConflict: 'id' })
        }
        window.location.href = '/'
      } else {
        window.location.href = '/auth/login'
      }
    })
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 14,
      fontFamily: "'Plus Jakarta Sans', system-ui", background: '#FFFBEA'
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{
        width: 32, height: 32,
        border: '3px solid #F5C842', borderTopColor: '#E63312',
        borderRadius: '50%', animation: 'spin .7s linear infinite'
      }} />
      <p style={{ color: '#888', fontSize: 13 }}>Duke u autentikuar...</p>
    </div>
  )
}

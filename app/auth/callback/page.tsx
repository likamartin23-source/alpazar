'use client'

import { useEffect } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/'
      } else {
        window.location.href = '/auth/login'
      }
    })
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: 14, fontFamily: "'Plus Jakarta Sans', system-ui" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      <div style={{ width: 32, height: 32, border: '3px solid #F5C842', borderTopColor: '#E63312', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      <p style={{ color: '#888', fontSize: 13 }}>Duke u autentikuar...</p>
    </div>
  )
}

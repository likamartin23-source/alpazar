'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

export default function AuthCallback() {
  const [err, setErr] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const errorDesc = url.searchParams.get('error_description')

        if (errorDesc) {
          setErr(decodeURIComponent(errorDesc))
          setTimeout(() => { window.location.href = '/auth/login' }, 2500)
          return
        }

        // PKCE flow: exchange the ?code=... for a session.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            setErr('Linku ka skaduar ose është përdorur. Provo sërish.')
            setTimeout(() => { window.location.href = '/auth/login' }, 2500)
            return
          }
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          window.location.href = '/auth/login'
          return
        }

        // Ensure a profile row exists, populated from registration metadata.
        const u = session.user
        const meta = u.user_metadata || {}
        const { data: existing } = await supabase
          .from('profiles').select('id, full_name').eq('id', u.id).single()

        if (!existing) {
          await supabase.from('profiles').upsert({
            id: u.id,
            full_name: meta.full_name || null,
            age: meta.age ?? null,
            phone: u.phone || null,
            username: u.email ? u.email.split('@')[0].replace(/[^a-z0-9_]/gi, '') : null,
          }, { onConflict: 'id' })
        } else if (!existing.full_name && meta.full_name) {
          // Fill in name/age if missing from a previously-created row.
          await supabase.from('profiles').update({
            full_name: meta.full_name, age: meta.age ?? null,
          }).eq('id', u.id)
        }

        window.location.href = '/'
      } catch {
        window.location.href = '/auth/login'
      }
    })()
  }, [])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', flexDirection: 'column', gap: 14,
      fontFamily: "'Plus Jakarta Sans', system-ui", background: '#FFFBEA', padding: 20, textAlign: 'center'
    }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
      {err ? (
        <>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <p style={{ color: '#E63312', fontSize: 13, fontWeight: 600, maxWidth: 320 }}>{err}</p>
          <p style={{ color: '#aaa', fontSize: 11 }}>Duke të kthyer te hyrja...</p>
        </>
      ) : (
        <>
          <div style={{
            width: 32, height: 32,
            border: '3px solid #F5C842', borderTopColor: '#E63312',
            borderRadius: '50%', animation: 'spin .7s linear infinite'
          }} />
          <p style={{ color: '#888', fontSize: 13 }}>Duke u autentikuar...</p>
        </>
      )}
    </div>
  )
}

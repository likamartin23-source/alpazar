'use client'

export const dynamic = 'force-dynamic'

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

        // Recovery magic link → redirect to password reset UI
        const isRecovery = url.searchParams.get('recovery')
        if (isRecovery === '1') {
          window.location.href = '/auth/login?reset=1'
          return
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
          window.location.href = '/auth/login'
          return
        }

        // Referral code: passed as ?ref= when Google OAuth redirects back
        const refCode = url.searchParams.get('ref') ||
          document.cookie.match(/alpazar_ref=([^;]+)/)?.[1] || null

        // Ensure a profile row exists, populated from OAuth / registration metadata.
        const u = session.user
        const meta = u.user_metadata || {}
        const avatarUrl = meta.avatar_url || meta.picture || null
        const { data: existing } = await supabase
          .from('profiles').select('id, full_name').eq('id', u.id).single()

        if (!existing) {
          const baseUsername = (u.email || '').split('@')[0].replace(/[^a-z0-9_]/gi, '').slice(0, 20) || null
          await supabase.from('profiles').upsert({
            id: u.id,
            full_name: meta.full_name || meta.name || null,
            age: meta.age ?? null,
            phone: u.phone || null,
            username: baseUsername,
            avatar_url: avatarUrl,
            referred_by: refCode || null,
          }, { onConflict: 'id' })
        } else if (!existing.full_name && (meta.full_name || meta.name)) {
          await supabase.from('profiles').update({
            full_name: meta.full_name || meta.name,
            age: meta.age ?? null,
            ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          }).eq('id', u.id)
        }

        // Apply pending registration data from magic link flow (Option A)
        const regPendingRaw = localStorage.getItem('alpazar_reg_pending')
        if (regPendingRaw) {
          try {
            const rd = JSON.parse(regPendingRaw)
            const upd: Record<string, unknown> = {}
            if (rd.full_name && !existing?.full_name) upd.full_name = rd.full_name
            if (rd.age) upd.age = rd.age
            if (Object.keys(upd).length) await supabase.from('profiles').update(upd).eq('id', u.id)
            if (rd.password) await supabase.auth.updateUser({ password: rd.password })
            localStorage.removeItem('alpazar_reg_pending')
          } catch {}
        }

        // Clear referral cookie after use
        if (refCode) document.cookie = 'alpazar_ref=; Max-Age=0; path=/'

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
      fontFamily: "'Plus Jakarta Sans', system-ui", background: 'var(--az-cream)', padding: 20, textAlign: 'center'
    }}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{to{transform:rotate(360deg);}}` }} />
      {err ? (
        <>
          <div style={{ fontSize: 40 }} aria-hidden="true">⚠️</div>
          <p style={{ color: '#C42B0F', fontSize: 13, fontWeight: 600, maxWidth: 320 }}>{err}</p>
          <p style={{ color: '#555', fontSize: 11 }}>Duke të kthyer te hyrja...</p>
        </>
      ) : (
        <>
          <div style={{
            width: 32, height: 32,
            border: '3px solid var(--az-yellow)', borderTopColor: 'var(--az-red)',
            borderRadius: '50%', animation: 'spin .7s linear infinite'
          }} />
          <p style={{ color: '#555', fontSize: 13 }}>Duke u autentikuar...</p>
        </>
      )}
    </div>
  )
}

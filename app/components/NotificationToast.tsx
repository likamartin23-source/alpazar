'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'

interface ToastItem {
  id: string
  title: string
  body: string | null
  type: string
  link: string | null
  at: number
}

const TYPE_ICON: Record<string, string> = {
  new_message:      '💬',
  new_review:       '⭐',
  listing_sold:     '🎉',
  listing_expired:  '⏰',
  price_drop:       '📉',
  follow:           '👤',
  badge_earned:     '🏅',
  referral_reward:  '🎁',
  premium_expiring: '👑',
  offer_received:   '💰',
  offer_accepted:   '✅',
  system:           '🔔',
}

export function NotificationToast() {
  const { user } = useAlpazar()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const t = timers.current.get(id)
    if (t) { clearTimeout(t); timers.current.delete(id) }
  }

  useEffect(() => {
    if (!user) return

    const ch = supabase.channel(`notif_toast:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        const n = payload.new as any
        const toast: ToastItem = {
          id: n.id, title: n.title, body: n.body,
          type: n.type, link: n.link, at: Date.now(),
        }
        setToasts(prev => [toast, ...prev].slice(0, 4))
        // auto-dismiss after 5 s
        const timer = setTimeout(() => dismiss(toast.id), 5000)
        timers.current.set(toast.id, timer)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
      timers.current.forEach(t => clearTimeout(t))
    }
  }, [user])

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed', top: 16, right: 0, left: 0,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 8, pointerEvents: 'none',
      padding: '0 12px',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          role="button" tabIndex={0}
          onClick={() => { dismiss(t.id); if (t.link?.startsWith('/')) window.location.href = t.link }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { dismiss(t.id); if (t.link?.startsWith('/')) window.location.href = t.link } }}
          style={{
            pointerEvents: 'all',
            maxWidth: 420, width: '100%',
            background: '#111',
            border: '1px solid #F5C84233',
            borderRadius: 14,
            padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.45)',
            cursor: t.link ? 'pointer' : 'default',
            animation: 'toast-in .25s ease',
          }}
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>{TYPE_ICON[t.type] ?? '🔔'}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.title}
            </div>
            {t.body && (
              <div style={{ fontSize: 11, color: '#888', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.body}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Mbyll njoftimin"
            onClick={e => { e.stopPropagation(); dismiss(t.id) }}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 16, cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >✕</button>
        </div>
      ))}
      <style>{`
        @keyframes toast-in {
          from { opacity:0; transform:translateY(-12px) scale(.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

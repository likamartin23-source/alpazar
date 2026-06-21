'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAlpazar } from '../../lib/context'

interface Notif {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  image_url: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
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

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return 'tani'
  if (diff < 3600) return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return new Date(iso).toLocaleDateString('sq-AL', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const { user, authReady, refreshUnread } = useAlpazar()
  const [notifs, setNotifs]   = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const userRef = useRef<any>(null)

  useEffect(() => { userRef.current = user }, [user])

  const unreadCount = notifs.filter(n => !n.is_read).length

  const loadNotifs = useCallback(async (uid: string) => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('id,type,title,body,link,image_url,is_read,read_at,created_at')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(60)
      if (data) setNotifs(data as Notif[])
    } catch { /* network error — notifs stay empty, user can retry by refreshing */ } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!user) { setLoading(false); return }
    loadNotifs(user.id)
  }, [user, authReady, loadNotifs])

  // Real-time subscription
  useEffect(() => {
    if (!user) return

    const ch = supabase.channel(`notifs_page:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifs(prev => [payload.new as Notif, ...prev])
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifs(prev => prev.map(n => n.id === payload.new.id ? { ...n, ...(payload.new as Notif) } : n))
      })
      .on('postgres_changes', {
        event: 'DELETE', schema: 'public', table: 'notifications',
      }, payload => {
        setNotifs(prev => prev.filter(n => n.id !== (payload.old as any).id))
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
      }, payload => {
        setNotifs(prev => prev.map(n => n.id === (payload.new as any).id ? { ...n, ...(payload.new as any) } : n))
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user])

  const dismiss = useCallback(async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (!error) setNotifs(prev => prev.filter(n => n.id !== id))
  }, [])

  const markRead = useCallback(async (id: string) => {
    const { error } = await supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    if (!error) setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }, [])

  const markAllRead = useCallback(async () => {
    if (!user) return
    const { error } = await supabase.from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)
    if (!error) { setNotifs(prev => prev.map(n => ({ ...n, is_read: true }))); refreshUnread(user.id) }
  }, [user, refreshUnread])

  const handleClick = useCallback((n: Notif) => {
    if (!n.is_read) markRead(n.id)
    if (n.link?.startsWith('/')) window.location.href = n.link
  }, [markRead])

  // Not logged in
  if (authReady && !user) {
    return (
      <div style={{ minHeight: '100dvh', background: '#FFFBEA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
        <div style={{ fontSize: 48 }} aria-hidden="true">🔔</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Kyçu për të parë njoftimet</div>
        <button type="button" onClick={() => window.location.href = '/auth/login'} style={{ background: '#F5C842', border: 'none', borderRadius: 12, padding: '12px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
          Kyçu
        </button>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Topbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#111', padding: '0 16px',
        display: 'flex', alignItems: 'center', gap: 10,
        height: 56,
        borderBottom: '1px solid #222',
      }}>
        <button
          type="button"
          aria-label="Kthehu mbrapa"
          onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/'}
          style={{ background: 'none', border: 'none', color: '#F5C842', fontSize: 22, cursor: 'pointer', padding: '0 4px', lineHeight: 1, display: 'flex', alignItems: 'center' }}
        >
          <i className="ti ti-arrow-left" style={{ fontSize: 22 }} aria-hidden="true" />
        </button>
        <h1 style={{ flex: 1, fontWeight: 700, fontSize: 16, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          Njoftimet
          {unreadCount > 0 && (
            <span style={{ background: '#F5C842', color: '#111', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 800 }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            style={{ background: 'none', border: '1px solid #333', borderRadius: 8, color: '#aaa', fontSize: 11, fontWeight: 600, padding: '5px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            ✓ Gjitha lexuar
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div role="status" aria-label="Duke ngarkuar njoftimet..." style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 16px', background: '#fff', borderBottom: '1px solid #f0e6b0' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#f0ead0', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 13, background: '#f0ead0', borderRadius: 6, width: '60%' }} />
                <div style={{ height: 11, background: '#f0ead0', borderRadius: 6, width: '85%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && notifs.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
          <div style={{ fontSize: 56 }} aria-hidden="true">🔕</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111', textAlign: 'center' }}>Nuk ke njoftime ende</div>
          <div style={{ fontSize: 13, color: '#888', textAlign: 'center', maxWidth: 260 }}>Kur dikush të dërgojë mesazh ose lë koment, do të shfaqet këtu.</div>
        </div>
      )}

      {/* Notification list */}
      {!loading && notifs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {notifs.map((n, idx) => (
            <NotifRow key={n.id} n={n} onClick={handleClick} onDismiss={dismiss} isLast={idx === notifs.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function NotifRow({ n, onClick, onDismiss, isLast }: { n: Notif; onClick: (n: Notif) => void; onDismiss: (id: string) => void; isLast: boolean }) {
  const icon = TYPE_ICON[n.type] ?? '🔔'
  const isClickable = !!n.link

  return (
    <div
      onClick={() => onClick(n)}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(n) } : undefined}
      style={{
        display: 'flex', gap: 14, padding: '14px 16px',
        background: n.is_read ? '#fff' : '#FFFBEA',
        borderBottom: isLast ? 'none' : '1px solid #f0e6b0',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'background .15s',
        position: 'relative',
      }}
    >
      {/* Unread dot */}
      {!n.is_read && (
        <div style={{
          position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
          width: 6, height: 6, borderRadius: '50%', background: '#F5C842',
        }} />
      )}

      {/* Avatar / icon */}
      <div style={{ flexShrink: 0, position: 'relative' }}>
        {n.image_url ? (
          <img
            src={n.image_url}
            alt=""
            loading="lazy"
            width={46}
            height={46}
            style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f0e6b0' }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, border: '2px solid #f0e6b0',
          }}>
            {icon}
          </div>
        )}
        {n.image_url && (
          <div style={{
            position: 'absolute', bottom: -2, right: -2,
            width: 20, height: 20, borderRadius: '50%',
            background: '#111', border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10,
          }}>
            {icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{
            fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: '#111',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {n.title}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: 1 }}>
            {timeAgo(n.created_at)}
          </div>
        </div>
        {n.body && (
          <div style={{
            fontSize: 12, color: n.is_read ? '#888' : '#555',
            marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.4,
          }}>
            {n.body}
          </div>
        )}
      </div>

      {/* Dismiss / Chevron */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
        {isClickable && (
          <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#ccc' }} aria-hidden="true" />
        )}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDismiss(n.id) }}
          style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', padding: '2px 4px', fontSize: 14, lineHeight: 1, display: 'flex', alignItems: 'center' }}
          aria-label="Fshij njoftimin"
        >
          <i className="ti ti-x" style={{ fontSize: 14 }} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

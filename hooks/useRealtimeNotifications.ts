'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)

  useEffect(() => {
    if (!userId) return

    // Initial load
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.is_read).length)
        }
      })

    // Real-time subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        const n = payload.new as Notification
        setNotifications(prev => [n, ...prev])
        if (!n.is_read) setUnreadCount(c => c + 1)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        const updated = payload.new as Notification
        setNotifications(prev => prev.map(n => n.id === updated.id ? updated : n))
        setUnreadCount(prev => {
          const wasUnread = (payload.old as Notification).is_read === false
          const nowRead   = updated.is_read === true
          if (wasUnread && nowRead) return Math.max(prev - 1, 0)
          return prev
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id)
  }

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', userId).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markRead, markAllRead }
}

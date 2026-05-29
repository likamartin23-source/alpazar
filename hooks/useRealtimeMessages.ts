'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

export type Message = {
  id: string
  conversation_id: string | null
  sender_id: string
  recipient_id: string | null
  receiver_id: string | null
  content: string | null
  type: string
  read: boolean
  read_at: string | null
  created_at: string
  deleted_at: string | null
  reaction: string | null
}

export function useRealtimeMessages(conversationId: string | null, userId: string | null) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [loading, setLoading]     = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!conversationId || !userId) return

    setLoading(true)

    supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data ?? [])
        setLoading(false)
      })

    channelRef.current = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message])
        // Auto-mark as read if we're the recipient
        const msg = payload.new as Message
        if (msg.recipient_id === userId || msg.receiver_id === userId) {
          supabase.from('messages').update({ read: true, read_at: new Date().toISOString() }).eq('id', msg.id)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => {
        const updated = payload.new as Message
        if (updated.deleted_at) {
          setMessages(prev => prev.filter(m => m.id !== updated.id))
        } else {
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m))
        }
      })
      .subscribe()

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [conversationId, userId])

  return { messages, loading }
}

export function useUnreadCount(userId: string | null) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    supabase.rpc('get_unread_count', { p_user_id: userId }).then(({ data }) => {
      if (typeof data === 'number') setCount(data)
    })

    const channel = supabase
      .channel(`unread:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, () => setCount(c => c + 1))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${userId}`,
      }, payload => {
        const prev = payload.old as { read_at: string | null }
        const next = payload.new as { read_at: string | null }
        if (!prev.read_at && next.read_at) setCount(c => Math.max(c - 1, 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return count
}

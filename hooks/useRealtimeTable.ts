'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

type Event = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

export function useRealtimeTable<T extends { id: string }>(
  table: string,
  filter: string | null,
  onInsert?: (row: T) => void,
  onUpdate?: (row: T) => void,
  onDelete?: (row: Partial<T>) => void,
  event: Event = '*'
) {
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>

    function subscribe() {
      channel = supabase
        .channel(`rt:${table}:${filter ?? 'all'}`)
        .on(
          'postgres_changes',
          {
            event,
            schema: 'public',
            table,
            ...(filter ? { filter } : {}),
          },
          (payload: any) => {
            if (payload.eventType === 'INSERT' && onInsert) onInsert(payload.new as T)
            if (payload.eventType === 'UPDATE' && onUpdate) onUpdate(payload.new as T)
            if (payload.eventType === 'DELETE' && onDelete) onDelete(payload.old)
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            supabase.removeChannel(channel)
            retryRef.current = setTimeout(subscribe, 5000)
          }
        })
    }

    subscribe()

    return () => {
      if (retryRef.current) clearTimeout(retryRef.current)
      supabase.removeChannel(channel)
    }
  }, [table, filter])
}

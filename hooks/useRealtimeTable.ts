'use client'

import { useEffect } from 'react'
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
  useEffect(() => {
    const channel = supabase
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [table, filter])
}

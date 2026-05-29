'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type AppConfig = Record<string, string>

let _cache: AppConfig = {}
let _loaded = false
const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach(fn => fn())
}

async function loadConfig() {
  const { data } = await supabase.from('app_config').select('key,value')
  if (data) {
    _cache = Object.fromEntries(data.map(r => [r.key, r.value]))
    _loaded = true
    notify()
  }
}

// Subscribe once at module level — all hook instances share one channel
let _channel: ReturnType<typeof supabase.channel> | null = null

function ensureChannel() {
  if (_channel) return
  _channel = supabase
    .channel('app_config_realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, payload => {
      if (payload.eventType === 'DELETE') {
        const key = (payload.old as { key: string }).key
        delete _cache[key]
      } else {
        const row = payload.new as { key: string; value: string }
        _cache[row.key] = row.value
      }
      notify()
    })
    .subscribe()
}

/**
 * Returns the live app_config table as a key→value map.
 * Admin changes in the DB propagate to every open client
 * within milliseconds via Supabase Realtime — no code deploy needed.
 */
export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>({ ..._cache })

  const refresh = useCallback(() => setConfig({ ..._cache }), [])

  useEffect(() => {
    _listeners.add(refresh)
    ensureChannel()
    if (!_loaded) loadConfig()
    else refresh()
    return () => { _listeners.delete(refresh) }
  }, [refresh])

  const get = useCallback((key: string, fallback = '') => config[key] ?? fallback, [config])
  const getBool  = useCallback((key: string, fallback = false) => {
    const v = config[key]; return v === undefined ? fallback : v === 'true'
  }, [config])
  const getInt   = useCallback((key: string, fallback = 0) => {
    const v = parseInt(config[key]); return isNaN(v) ? fallback : v
  }, [config])
  const getFloat = useCallback((key: string, fallback = 0) => {
    const v = parseFloat(config[key]); return isNaN(v) ? fallback : v
  }, [config])

  return { config, get, getBool, getInt, getFloat }
}

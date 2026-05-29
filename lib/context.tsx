'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from './supabase'

// ─── Types ─────────────────────────────────────────────────
export interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  is_premium: boolean
  is_admin: boolean
  is_verified: boolean
  is_suspended: boolean
  gamification_points: number
  gamification_level: string
  shop_name?: string
  shop_banner_url?: string
  seller_rating?: number
  reviews_count?: number
  referral_code?: string
}

interface AlpazarCtx {
  user: any | null
  profile: Profile | null
  authReady: boolean
  // live counts shown in bottom nav
  unreadMessages: number
  unreadNotifications: number
  // app_config in real-time
  config: Record<string, string>
  cfg:    (key: string, fallback?: string)  => string
  cfgBool:(key: string, fallback?: boolean) => boolean
  cfgInt: (key: string, fallback?: number)  => number
  // actions
  refreshProfile: () => Promise<void>
}

const defaultCtx: AlpazarCtx = {
  user: null, profile: null, authReady: false,
  unreadMessages: 0, unreadNotifications: 0,
  config: {},
  cfg:     (_, f = '') => f,
  cfgBool: (_, f = false) => f,
  cfgInt:  (_, f = 0) => f,
  refreshProfile: async () => {},
}

const AlpazarContext = createContext<AlpazarCtx>(defaultCtx)

export function useAlpazar() {
  return useContext(AlpazarContext)
}

// ─── Provider ──────────────────────────────────────────────
export function AlpazarProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [config, setConfig] = useState<Record<string, string>>({})

  // ── app_config: load + real-time ──────────────────────────
  useEffect(() => {
    supabase.from('app_config').select('key,value').then(({ data }) => {
      if (data) setConfig(Object.fromEntries(data.map(r => [r.key, r.value])))
    })

    const ch = supabase.channel('app_config_ctx')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_config' }, payload => {
        setConfig(prev => {
          const next = { ...prev }
          if (payload.eventType === 'DELETE') {
            delete next[(payload.old as any).key]
          } else {
            next[(payload.new as any).key] = (payload.new as any).value
          }
          return next
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [])

  // ── auth ──────────────────────────────────────────────────
  const loadProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('id,username,full_name,avatar_url,is_premium,is_admin,is_verified,is_suspended,gamification_points,gamification_level,shop_name,shop_banner_url,seller_rating,reviews_count,referral_code')
      .eq('id', uid)
      .single()
    if (data) setProfile(data as Profile)
    // heartbeat last_seen
    await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', uid)
  }, [])

  const loadUnread = useCallback(async (uid: string) => {
    const [{ count: msgs }, { count: notifs }] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true })
        .eq('receiver_id', uid).eq('read', false),
      supabase.from('notifications').select('*', { count: 'exact', head: true })
        .eq('user_id', uid).eq('is_read', false),
    ])
    setUnreadMessages(msgs || 0)
    setUnreadNotifications(notifs || 0)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
      if (session?.user) {
        loadProfile(session.user.id)
        loadUnread(session.user.id)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id)
        loadUnread(session.user.id)
      } else {
        setProfile(null)
        setUnreadMessages(0)
        setUnreadNotifications(0)
      }
    })

    return () => { subscription.unsubscribe() }
  }, [loadProfile, loadUnread])

  // ── real-time unread subscriptions ───────────────────────
  useEffect(() => {
    if (!user) return

    const ch = supabase.channel(`global_unread:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, () => setUnreadMessages(c => c + 1))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, p => {
        const prev = p.old as any; const next = p.new as any
        if (prev.read === false && next.read === true)
          setUnreadMessages(c => Math.max(c - 1, 0))
      })
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, () => setUnreadNotifications(c => c + 1))
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, p => {
        const prev = p.old as any; const next = p.new as any
        if (!prev.is_read && next.is_read)
          setUnreadNotifications(c => Math.max(c - 1, 0))
      })
      .subscribe()

    return () => { supabase.removeChannel(ch) }
  }, [user])

  const cfg     = useCallback((k: string, f = '')  => config[k] ?? f,       [config])
  const cfgBool = useCallback((k: string, f = false) => {
    const v = config[k]; return v === undefined ? f : v === 'true'
  }, [config])
  const cfgInt  = useCallback((k: string, f = 0) => {
    const v = parseInt(config[k]); return isNaN(v) ? f : v
  }, [config])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  return (
    <AlpazarContext.Provider value={{
      user, profile, authReady,
      unreadMessages, unreadNotifications,
      config, cfg, cfgBool, cfgInt,
      refreshProfile,
    }}>
      {children}
    </AlpazarContext.Provider>
  )
}

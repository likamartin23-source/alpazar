'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * PRANIA LIVE E PËRDORUESVE (BLLOKU Imazhi 1/2 — "online/offline te avatari").
 *
 * Një grup i VETËM Supabase Realtime *presence* për të gjithë përdoruesit e kyçur.
 * Nga çdo skedë e kyçur bëjmë `track` me çelës = uid; nga çdo skedë (edhe anonime)
 * lexojmë `presenceState()` → grupi i id-ve online. Kështu një kanal i vetëm mban
 * gjendjen online për të gjithë avatarët e faqes (pa N kanale).
 *
 * FAIL-SOFT: çdo gabim → grup bosh → thjesht asnjë pikë jeshile; faqja s'preket.
 * PRIVATËSI: shfaqen online VETËM përdoruesit e kyçur që e bëjnë `track` vetë;
 * vizitorët anonimë e lexojnë por nuk gjurmohen (çelës `anon-*`, i përjashtuar).
 */
const OnlineCtx = createContext<Set<string>>(new Set())

export function OnlinePresenceProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    let alive = true
    let ch: ReturnType<typeof supabase.channel> | null = null

    ;(async () => {
      try {
        let uid: string | null = null
        try {
          const { data } = await supabase.auth.getUser()
          uid = data?.user?.id ?? null
        } catch { /* vizitor anonim */ }

        const key = uid || ('anon-' + Math.random().toString(36).slice(2))
        ch = supabase.channel('online-users', { config: { presence: { key } } })

        ch.on('presence', { event: 'sync' }, () => {
          if (!alive || !ch) return
          try {
            const st = ch.presenceState() as Record<string, unknown>
            const next = new Set<string>()
            for (const k of Object.keys(st)) {
              if (k && !k.startsWith('anon-')) next.add(k)
            }
            setIds(next)
          } catch { /* fail-soft */ }
        })

        ch.subscribe((status: string) => {
          // Track VETËM përdoruesit e kyçur → vetëm ata shfaqen "online".
          if (status === 'SUBSCRIBED' && uid && ch) {
            ch.track({ at: Date.now() }).catch(() => { /* fail-soft */ })
          }
        })
      } catch { /* pa presence → thjesht pa pika online */ }
    })()

    return () => {
      alive = false
      try { if (ch) supabase.removeChannel(ch) } catch { /* fail-soft */ }
    }
  }, [])

  return <OnlineCtx.Provider value={ids}>{children}</OnlineCtx.Provider>
}

/** Grupi i plotë i id-ve online (për listat: kontrollo `set.has(id)`). */
export function useOnlineUsers(): Set<string> {
  return useContext(OnlineCtx)
}

/** A është online një përdorues i caktuar (fail-soft: false kur s'dihet). */
export function useIsOnline(id?: string | null): boolean {
  const s = useContext(OnlineCtx)
  return !!id && s.has(id)
}

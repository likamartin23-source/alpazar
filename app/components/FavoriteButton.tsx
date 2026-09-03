'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  listingId: string
  size?: number
  style?: React.CSSProperties
  onUnfavorite?: () => void
}

export function FavoriteButton({ listingId, size = 32, style, onUnfavorite }: Props) {
  const [saved, setSaved]   = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [busy, setBusy]     = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      setUserId(session.user.id)
      supabase.from('favorites').select('listing_id', { count: 'exact', head: true })
        .eq('user_id', session.user.id).eq('listing_id', listingId)
        .then(({ count }) => setSaved((count ?? 0) > 0))
    })
  }, [listingId])

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!userId) { window.location.href = '/auth/login'; return }
    if (busy) return
    setBusy(true)
    const prev = saved
    setSaved(!prev)
    if (prev) {
      const { error } = await supabase.from('favorites').delete()
        .eq('user_id', userId).eq('listing_id', listingId)
      if (error) { setSaved(prev) } else { onUnfavorite?.() }
    } else {
      const { error } = await supabase.from('favorites').insert({ user_id: userId, listing_id: listingId })
      if (error) setSaved(prev)
    }
    setBusy(false)
  }, [userId, listingId, saved, busy])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={saved ? 'Hiq nga të preferuarat' : 'Ruaj në të preferuara'}
      style={{
        // Zonë prekjeje ≥44px (Vendimi 8) e TEJDUKSHME; rrethi i bardhë i dukshëm mbetet `size`
        // (p.sh. 30) brenda saj → prekja e madhe pa e fryrë pamjen te cepi i kartës.
        width: Math.max(size, 44), height: Math.max(size, 44), borderRadius: '50%',
        background: 'transparent', border: 'none', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'transform .15s',
        ...style,
      }}
    >
      <span style={{
        width: size, height: size, borderRadius: '50%', background: 'rgba(255,255,255,.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        // Hije + unazë e hollë: zemra të mos humbasë mbi foto të ndritshme (O24).
        boxShadow: '0 1px 6px rgba(0,0,0,.28)', border: '1px solid rgba(0,0,0,.08)',
      }}>
        {saved
          ? <svg aria-hidden="true" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="var(--az-red)"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          : <svg aria-hidden="true" width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        }
      </span>
    </button>
  )
}

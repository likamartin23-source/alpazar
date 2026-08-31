'use client'

// Vercel Analytics VETËM pas pëlqimit.
//
// Më parë `<Analytics />` rrinte drejtpërdrejt te layout-i, ndaj ngarkohej për
// çdo vizitor pavarësisht se ç'kishte zgjedhur te banneri. Tani montohet vetëm
// kur pëlqimi është 'accepted', dhe çmontohet menjëherë nëse tërhiqet — pa
// rifreskim faqeje, sepse dëgjon eventin e modulit të pëlqimit.

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { CONSENT_EVENT, hasAnalyticsConsent } from '../../lib/consent'

export function ConsentedAnalytics() {
  // Fillon FALSE edhe në server edhe në klient: pa pëlqim të lexuar, nuk ngarkohet.
  // (Kjo shmang edhe mospërputhjen e hidratimit — serveri s'e sheh localStorage.)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    const sync = () => setOk(hasAnalyticsConsent())
    sync()
    window.addEventListener(CONSENT_EVENT, sync)
    // `storage` kap ndryshimin e bërë në një skedë tjetër të së njëjtës origjinë.
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  if (!ok) return null
  return <Analytics />
}

'use client'

// Next 15 nuk e lejon `ssr: false` te `next/dynamic` brenda nje Server
// Component, dhe `app/layout.tsx` eshte server. Ndaj keto ngarkime rrine
// ketu, ne nje modul klient. Sjellja mbetet e njejta si me pare:
// komponentet ngarkohen vetem ne shfletues, jo gjate renderimit ne server.
//
// Te gjithe keta komponente jane vete 'use client'; `ssr: false` sherben
// qe te mos dalin fare ne HTML-ne e serverit (banderola mirembajtjeje,
// njoftime, pelqimi i cookie-ve — asnje prej tyre s'ka kuptim para
// hidratimit).

import dynamic from 'next/dynamic'

export const AiFloat = dynamic(
  () => import('./AiFloat'),
  { ssr: false },
)

export const UpdatePrompt = dynamic(
  () => import('./UpdatePrompt'),
  { ssr: false },
)

export const NotificationToast = dynamic(
  () => import('./NotificationToast').then(m => ({ default: m.NotificationToast })),
  { ssr: false },
)

export const MaintenanceBanner = dynamic(
  () => import('./MaintenanceBanner').then(m => ({ default: m.MaintenanceBanner })),
  { ssr: false },
)

export const AnnouncementBar = dynamic(
  () => import('./MaintenanceBanner').then(m => ({ default: m.AnnouncementBar })),
  { ssr: false },
)

export const CookieBanner = dynamic(
  () => import('./CookieBanner').then(m => ({ default: m.CookieBanner })),
  { ssr: false },
)

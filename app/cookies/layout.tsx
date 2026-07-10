import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politika e Cookies — ALPAZAR',
  description: 'Si i përdorim cookies në ALPAZAR dhe si mund t\'i menaxhosh.',
  alternates: { canonical: 'https://alpazar.vercel.app/cookies' },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

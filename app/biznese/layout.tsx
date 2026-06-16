import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bizneset & Dyqanet — ALPAZAR',
  description: 'Zbuloni bizneset dhe dyqanet shqiptare online. Blini direkt nga pronarët lokalë në platformën #1 të tregtisë elektronike shqiptare.',
  openGraph: {
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Bizneset & Dyqanet — ALPAZAR',
    description: 'Zbuloni bizneset dhe dyqanet shqiptare online. Blini direkt nga pronarët lokalë.',
  },
  twitter: {
    card: 'summary',
    title: 'Bizneset & Dyqanet — ALPAZAR',
    description: 'Zbuloni bizneset dhe dyqanet shqiptare online.',
  },
}

export default function BizneseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Bizneset & Dyqanet — ALPAZAR',
  description: 'Zbuloni bizneset dhe dyqanet shqiptare online. Blini direkt nga pronarët lokalë në platformën #1 të tregtisë elektronike shqiptare.',
  alternates: { canonical: '/biznese' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
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

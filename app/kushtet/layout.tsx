import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kushtet e Shërbimit — ALPAZAR',
  description: 'Lexoni kushtet e shërbimit të ALPAZAR. Mësoni të drejtat dhe detyrimet tuaja si përdorues i platformës sonë të tregtisë elektronike.',
  alternates: { canonical: '/kushtet' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Kushtet e Shërbimit — ALPAZAR',
    description: 'Kushtet e shërbimit të ALPAZAR — platforma shqiptare e tregtisë elektronike.',
  },
}

export default function KushtetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

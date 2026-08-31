import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rreth Nesh — ALPAZAR',
  description: 'Njihuni me ALPAZAR — platforma shqiptare #1 e tregtisë elektronike. Misioni ynë: lidhja e blerësve dhe shitësve shqiptarë në mënyrën më të lehtë dhe të sigurt.',
  alternates: { canonical: '/rreth-nesh' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Rreth Nesh — ALPAZAR',
    description: 'Njihuni me ALPAZAR — platforma shqiptare #1 e tregtisë elektronike.',
  },
}

export default function RrethNeshLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

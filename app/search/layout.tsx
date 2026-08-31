import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kërko Shpallje — ALPAZAR',
  description: 'Kërko midis mijëra shpalljeve shqiptare. Filtro sipas kategorisë, çmimit, gjendjes dhe qytetit. Platforma #1 e tregtisë elektronike shqiptare.',
  alternates: { canonical: '/search' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Kërko Shpallje — ALPAZAR',
    description: 'Kërko midis mijëra shpalljeve shqiptare. Filtro sipas kategorisë, çmimit dhe qytetit.',
  },
  twitter: {
    card: 'summary',
    title: 'Kërko Shpallje — ALPAZAR',
    description: 'Kërko midis mijëra shpalljeve shqiptare.',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

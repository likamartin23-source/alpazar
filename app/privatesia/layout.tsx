import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politika e Privatësisë — ALPAZAR',
  description: 'Mësoni si ALPAZAR mbledh, përdor dhe mbron të dhënat tuaja personale. Transparenca dhe siguria janë prioritetet tona.',
  alternates: { canonical: '/privatesia' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Politika e Privatësisë — ALPAZAR',
    description: 'Si ALPAZAR mbron të dhënat tuaja personale — transparencë e plotë.',
  },
}

export default function PrivatesiaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

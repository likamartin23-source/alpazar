import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kontakt — ALPAZAR',
  description: 'Na kontaktoni për çdo pyetje, sugjerim apo problem. Ekipi i ALPAZAR është këtu për t\'ju ndihmuar.',
  alternates: { canonical: '/kontakt' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Kontakt — ALPAZAR',
    description: 'Na kontaktoni për çdo pyetje, sugjerim apo problem.',
  },
}

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

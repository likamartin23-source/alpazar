import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Albi — Asistent AI i ALPAZAR',
  description: 'Albi është asistenti juaj inteligjent për shitje dhe blerje në ALPAZAR. Pyesni çfarë të doni — çmime, këshilla, trende — dhe merrni përgjigje në çast.',
  alternates: { canonical: '/asistent' },
  openGraph: {
    images: [{ url: '/api/og', width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'Albi — Asistent AI i ALPAZAR',
    description: 'Asistenti juaj inteligjent për shitje dhe blerje. Pyesni çfarë të doni dhe merrni përgjigje në çast.',
  },
  twitter: {
    card: 'summary',
    title: 'Albi — Asistent AI i ALPAZAR',
    description: 'Asistenti juaj inteligjent për shitje dhe blerje në ALPAZAR.',
  },
}

export default function AsistentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

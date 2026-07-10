import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ALPAZAR Premium — Abonim',
  description: 'Aktivizo ALPAZAR Premium dhe shit më shumë, më shpejt. Shpallje të pakufizuara, badge verifikimi, statistika të avancuara dhe mbështetje prioritare.',
  openGraph: {
    type: 'website',
    siteName: 'ALPAZAR',
    locale: 'sq_AL',
    title: 'ALPAZAR Premium — Abonim',
    description: 'Aktivizo ALPAZAR Premium dhe shit më shumë, më shpejt. Shpallje të pakufizuara dhe statistika të avancuara.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALPAZAR Premium — Abonim',
    description: 'Aktivizo ALPAZAR Premium dhe shit më shumë, më shpejt.',
  },
}

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

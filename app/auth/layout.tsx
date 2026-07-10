import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Hyrje / Regjistrim — ALPAZAR',
  description: 'Kyçu ose regjistrohu në ALPAZAR — platforma #1 shqiptare e tregtisë online.',
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

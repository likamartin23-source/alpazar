import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analitika — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function ProfileAnalyticsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

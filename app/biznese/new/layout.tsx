import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Krijo biznes — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function BiznesNewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Të dhënat mia — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function TeDhenaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

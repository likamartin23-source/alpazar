import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ndrysho shpalljen — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function ListingEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

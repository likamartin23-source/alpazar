import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shpallë tani — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function ListingNewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

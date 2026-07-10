import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Rezultate kërkimi — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function SearchResultsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

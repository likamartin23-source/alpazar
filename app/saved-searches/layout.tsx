import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kërkim i ruajtur — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function SavedSearchesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

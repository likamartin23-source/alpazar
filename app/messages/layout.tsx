import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mesazhet — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

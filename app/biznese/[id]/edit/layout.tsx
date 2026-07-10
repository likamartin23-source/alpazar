import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ndrysho biznesin — ALPAZAR',
  robots: { index: false, follow: false },
}

export default function BiznesEditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

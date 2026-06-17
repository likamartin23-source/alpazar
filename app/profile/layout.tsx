import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Profili im — ALPAZAR',
  description: 'Menaxho llogarinë tënde, shpalljet dhe preferencat në ALPAZAR.',
  robots: { index: false, follow: false },
}

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

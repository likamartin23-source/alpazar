import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Siguria & Privatësia — ALPAZAR',
  description: 'Si mbrojmë të dhënat tuaja dhe angazhimet tona për privatësinë në ALPAZAR.',
  alternates: { canonical: 'https://alpazar.vercel.app/siguria' },
}

export default function SiguriaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

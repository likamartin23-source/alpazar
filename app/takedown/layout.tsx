import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kërkesë Heqjeje — ALPAZAR',
  description: 'Dërgoni një kërkesë DMCA ose heqjeje të përmbajtjes së paligjshme në ALPAZAR.',
  alternates: { canonical: 'https://alpazar.vercel.app/takedown' },
}

export default function TakedownLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import type { Metadata } from 'next'

// `/oferta` = komponent klienti; ky layout server i jep titullin SSR (T-010).
export const metadata: Metadata = { title: 'Ofertat — ALPAZAR' }

export default function OfertaLayout({ children }: { children: React.ReactNode }) {
  return children
}

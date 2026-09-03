import type { Metadata } from 'next'

// Faqja `/billing` është komponent klienti (s'eksporton dot metadata). Ky layout
// server i jep titullin SSR — përndryshe trashëgonte titullin global të layout-it
// rrënjë (T-010).
export const metadata: Metadata = { title: 'Faturimi — ALPAZAR' }

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return children
}

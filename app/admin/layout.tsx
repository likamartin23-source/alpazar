import type { Metadata } from 'next'

// `/admin` = komponent klienti; ky layout server i jep titullin SSR (T-010).
// noindex tashmë vjen nga robots te layout-i rrënjë për `/admin*`.
export const metadata: Metadata = { title: 'Paneli i Adminit — ALPAZAR' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}

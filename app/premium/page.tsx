'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'

// Harmonizim: oferta e vetme e pageses eshte /billing (lexon LIVE nga baza).
// Kjo faqe ruhet vetem si ridrejtim per linqet e vjetra.
export default function PremiumRedirect() {
  useEffect(() => { window.location.replace('/billing') }, [])
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", background: '#FFFBEA', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 13 }}>
      Duke ju çuar te Plani im…
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { getConsent, setConsent, revokeConsent, CONSENT_EVENT, type Consent } from '../../lib/consent'

/**
 * Kontrolli i pëlqimit te faqja /cookies — TËRHEQJA aq e lehtë sa DHËNIA (neni 123/6,
 * ligji 9918/2008). Gjendja e gjetur (2 shtator 2026): `revokeConsent()` ekzistonte te
 * lib/consent.ts por s'e thërriste asnjë rresht; /cookies premtonte "opsionalet mund të
 * çaktivizohen" pa asnjë kontroll. Pra dhënia = një klik te banneri, tërheqja = e pamundur.
 * Ky komponent e mbyll boshllëkun: një klik për të pranuar, një klik për të tërhequr.
 *
 * Burimi i vetëm i së vërtetës mbetet lib/consent.ts; ky vetëm e lexon dhe e ndryshon,
 * dhe dëgjon CONSENT_EVENT që gjendja të pasqyrohet edhe kur ndryshon nga banneri.
 */
export function CookieConsentControl() {
  const [consent, setConsentState] = useState<Consent>(null)
  const [gati, setGati] = useState(false)

  useEffect(() => {
    setConsentState(getConsent())
    setGati(true)
    const f = () => setConsentState(getConsent())
    window.addEventListener(CONSENT_EVENT, f)
    return () => window.removeEventListener(CONSENT_EVENT, f)
  }, [])

  // Para hidratimit s'dimë gjendjen (localStorage) — mos rendero asgjë që ndryshon SSR↔klient.
  if (!gati) return null

  const etiketa = consent === 'accepted' ? 'Të pranuara' : consent === 'declined' ? 'Të refuzuara' : 'Të pavendosura'
  const ngjyra  = consent === 'accepted' ? '#3B6D11' : consent === 'declined' ? 'var(--az-red-deep)' : '#6E6E6E'
  const sfond   = consent === 'accepted' ? '#EAF3DE' : consent === 'declined' ? '#FDECEA' : '#F1F1F1'

  const btn = (primar: boolean): React.CSSProperties => ({
    minHeight: 44, padding: '0 16px', borderRadius: 'var(--r-btn)', fontSize: 13, fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer', border: primar ? 'none' : '1.5px solid var(--az-red-deep)',
    background: primar ? '#3B6D11' : '#fff', color: primar ? '#fff' : 'var(--az-red-deep)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  })

  return (
    <div style={{ background: '#f9f9f9', border: '1px solid #eee', borderRadius: 'var(--r-btn)', padding: 16, margin: '12px 0' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#111', marginBottom: 8 }}>
        Cookie-t opsionale (analitika){' '}
        <span style={{ background: sfond, color: ngjyra, borderRadius: 'var(--r-btn)', padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>
          {etiketa}
        </span>
      </div>
      <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 12 }}>
        Mund ta ndryshosh vendimin këtu në çdo çast — tërheqja është aq e lehtë sa dhënia.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {consent !== 'accepted' && (
          <button type="button" style={btn(true)} onClick={() => setConsent('accepted')}>
            <span aria-hidden="true">✓</span> Prano opsionalet
          </button>
        )}
        {consent === 'accepted' && (
          <button type="button" style={btn(false)} onClick={() => revokeConsent()}>
            <span aria-hidden="true">✕</span> Tërhiq pëlqimin
          </button>
        )}
        {consent !== 'declined' && consent !== null && (
          <button type="button" style={btn(false)} onClick={() => setConsent('declined')}>
            Vetëm thelbësoret
          </button>
        )}
      </div>
    </div>
  )
}

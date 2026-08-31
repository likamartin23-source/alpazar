// Gjendja e pëlqimit — burim i VETËM i së vërtetës për cookie/analytics.
//
// PSE ekziston: më parë `CookieBanner` shkruante një varg te localStorage dhe
// fshihte div-in — asgjë tjetër në kod nuk e lexonte atë varg. "Prano" dhe
// "Vetëm thelbësoret" bënin saktësisht të njëjtën gjë, ndërsa Vercel Analytics
// dhe Sentry Session Replay niseshin pa kusht. Ky ishte njoftim, jo pëlqim
// (neni 123/6, ligji 9918/2008 — pëlqimi duhet të jetë veprim me pasojë).
//
// Tani gjendja lexohet nga tre vende (banneri, Analytics, Sentry) dhe ndryshimi
// përhapet MENJËHERË me një event, pa rifreskim faqeje.

export const CONSENT_KEY = 'alpazar_cookie_consent'
export const CONSENT_EVENT = 'alpazar:consent'

export type Consent = 'accepted' | 'declined' | null

/** Lexon pëlqimin. Kthen null kur s'është vendosur ende (pra: pa pëlqim). */
export function getConsent(): Consent {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'accepted' || v === 'declined' ? v : null
  } catch {
    // Modalitet privat / cookies të bllokuara: trajtohet si PA pëlqim, kurrë si po.
    return null
  }
}

/** E vërtetë vetëm kur përdoruesi ka pranuar shprehimisht. Mungesa ≠ pranim. */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'accepted'
}

/** Ruan vendimin dhe njofton dëgjuesit që ta zbatojnë pa rifreskim. */
export function setConsent(v: Exclude<Consent, null>): void {
  try { localStorage.setItem(CONSENT_KEY, v) } catch {}
  try { window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v })) } catch {}
}

/** Tërheqje e pëlqimit — kërkesë e nenit 123/6: aq e lehtë sa dhënia. */
export function revokeConsent(): void {
  try { localStorage.removeItem(CONSENT_KEY) } catch {}
  try { window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null })) } catch {}
}

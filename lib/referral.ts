const COOKIE = 'alpazar_ref'
const DAYS   = 30

/** Reads ?ref= from current URL and stores in cookie (30 days). Call on every page mount. */
export function saveRefFromUrl(): void {
  if (typeof window === 'undefined') return
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (ref && ref.trim()) {
    const exp = new Date(Date.now() + DAYS * 864e5).toUTCString()
    document.cookie = `${COOKIE}=${encodeURIComponent(ref.trim())}; expires=${exp}; path=/; SameSite=Lax`
  }
}

/** Returns the stored referral code from cookie, or null. */
export function getStoredRef(): string | null {
  if (typeof window === 'undefined') return null
  return document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`))?.[1]
    ? decodeURIComponent(document.cookie.match(new RegExp(`${COOKIE}=([^;]+)`))![1])
    : null
}

/** Builds a shareable URL with the user's referral code appended. */
export function buildShareUrl(path: string, refCode?: string | null): string {
  const base = 'https://alpazar.vercel.app'
  const url  = path.startsWith('http') ? path : `${base}${path}`
  if (!refCode) return url
  const u = new URL(url)
  u.searchParams.set('ref', refCode)
  return u.toString()
}

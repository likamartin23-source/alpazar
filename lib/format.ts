// Formatues DETERMINISTIK — të pavarur nga ICU dhe nga timezone-i.
//
// PSE ekziston ky skedar:
// `toLocaleString('sq-AL')` / `toLocaleDateString('sq-AL')` mbështeten te të
// dhënat ICU të mjedisit. Serveri (Node në Vercel) dhe shfletuesi kanë ICU të
// ndryshëm për shqipen, ndaj i njëjti çmim/datë renderohej NDRYSHE në SSR dhe në
// klient. Meqë faqet janë SSR (initialListing / initialListings), kjo prodhonte
// React #418 / #422 / #425 — mospërputhje hidratimi, të raportuara nga AI Health.
//
// Po ashtu `getMonth()/getDate()` varen nga timezone-i lokal: serveri punon në
// UTC, klienti në Europe/Tirane (+1/+2). Për data pranë mesnatës kjo jep ditë të
// ndryshme. Prandaj përdorim metodat UTC — rezultat identik kudo.

/** Numër me ndarës mijësh sipas konventës shqipe (1.234.567). */
export function nf(n: number | null | undefined): string {
  const v = Number(n)
  if (!isFinite(v)) return '0'
  const neg = v < 0
  const s = Math.round(Math.abs(v)).toString()
  return (neg ? '-' : '') + s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Çmim i plotë me monedhë. Bosh/0 → "Me marrëveshje". */
export function priceLabel(price: number | null | undefined, currency?: string | null): string {
  if (!price) return 'Me marrëveshje'
  return currency === 'EUR' ? `${nf(price)} €` : `${nf(price)} L`
}

/**
 * Çmim PLANI me GJITHMONË 2 shifra dhjetore, konventë shqipe (1.999,90) — pa ICU.
 * PSE: charm "999.90"/"1.999,90" duhet të shfaqet me dy shifra (EAA — çmim i qartë),
 * pa ndryshuar vlerën e brendshme. `toLocaleString('sq-AL', {maximumFractionDigits:2})`
 * i heq zerot fundorë (999,90 → "999,9") dhe varet nga ICU (mospërputhje SSR/klient,
 * shkaku i React #418 që `nf`/këtu shmangim). Ky formatues është determinist kudo.
 */
export function moneyDec(n: number | null | undefined): string {
  const v = Number(n)
  if (!isFinite(v)) return '0,00'
  const neg = v < 0
  const cents = Math.round(Math.abs(v) * 100)
  const whole = Math.floor(cents / 100).toString()
  const frac = (cents % 100).toString().padStart(2, '0')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (neg ? '-' : '') + grouped + ',' + frac
}

const MONTHS_SHORT = ['jan', 'shk', 'mar', 'pri', 'maj', 'qer', 'korr', 'gush', 'sht', 'tet', 'nën', 'dhj']
const MONTHS_LONG = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor']

function toDate(d: string | number | Date | null | undefined): Date | null {
  if (!d) return null
  const dt = new Date(d as any)
  return isNaN(dt.getTime()) ? null : dt
}

/** "09 gush 2026" */
export function dateShort(d: string | number | Date | null | undefined): string {
  const dt = toDate(d)
  if (!dt) return ''
  return `${String(dt.getUTCDate()).padStart(2, '0')} ${MONTHS_SHORT[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`
}

/** "09 gusht" */
export function dayMonth(d: string | number | Date | null | undefined): string {
  const dt = toDate(d)
  if (!dt) return ''
  return `${String(dt.getUTCDate()).padStart(2, '0')} ${MONTHS_LONG[dt.getUTCMonth()]}`
}

/** "gusht 2026" */
export function monthYear(d: string | number | Date | null | undefined): string {
  const dt = toDate(d)
  if (!dt) return ''
  return `${MONTHS_LONG[dt.getUTCMonth()]} ${dt.getUTCFullYear()}`
}

/** "14:05" — ora lokale e klientit; përdore VETËM pas mount-it. */
export function clockTime(d: string | number | Date | null | undefined): string {
  const dt = toDate(d)
  if (!dt) return ''
  return `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
}

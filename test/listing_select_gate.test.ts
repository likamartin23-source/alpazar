import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

// PORTA §4-bis (mësimi i kthyer në mekanizëm): çdo query që ushqen `ListingCard` DUHET të
// përdorë `LISTING_SELECT` (lib/listingSelect.ts) — burimi i vetëm i identitetit të kartës.
// Gjashtë projeksione me dorë e kishin cunguar kartën sipas faqes (video/çip-shitësi/vula
// mungonin). Ky test dështon nëse rilind një projeksion i formës së kartës (title+images+
// rank_tier) i shkruar me dorë, që s'është shënuar shprehimisht `listing-select-exempt`.

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (/\.(ts|tsx)$/.test(name)) out.push(p)
  }
  return out
}

// Literal i "formës së kartës": string me title + images + rank_tier të gjitha brenda.
const CARD_SHAPED = /\.select\(\s*'([^']*\btitle\b[^']*\bimages\b[^']*\brank_tier\b[^']*)'\s*\)/g

describe('LISTING_SELECT gate (§4-bis)', () => {
  const files = walk(join(process.cwd(), 'app'))
  const violations: string[] = []

  for (const f of files) {
    const src = readFileSync(f, 'utf8')
    let m: RegExpExecArray | null
    CARD_SHAPED.lastIndex = 0
    while ((m = CARD_SHAPED.exec(src))) {
      // Lejohet nëse brenda 400 karaktereve para tij ka shenjën e përjashtimit.
      const before = src.slice(Math.max(0, m.index - 400), m.index)
      if (!before.includes('listing-select-exempt')) {
        violations.push(`${f.replace(process.cwd() + '/', '')}: projeksion karte me dorë — përdor LISTING_SELECT (ose shëno // listing-select-exempt nëse s'ushqen ListingCard)`)
      }
    }
  }

  it('asnjë projeksion karte me dorë jashtë LISTING_SELECT', () => {
    expect(violations, violations.join('\n')).toEqual([])
  })
})

#!/usr/bin/env node
/**
 * VETEM HYRJA — asgje tjeter. Makina ka 4GB; nje shfletues qe mban 19 faqe e
 * nje matje njekohesisht vritet nga sistemi. Ky hap dritaren, pret sesionin,
 * e ruan ne profil dhe del. Matja behet me pas, pa koke, ne grupe te vogla.
 */
import { chromium } from 'playwright'
const BAZA = 'https://alpazar.vercel.app'
const sh = await chromium.launchPersistentContext(process.env.PROFIL || '.ops/.profil-chrome',
  { headless: false, channel: 'chrome', viewport: { width: 1100, height: 800 }, locale: 'sq-AL' })
const f = sh.pages()[0] || await sh.newPage()
await f.goto(BAZA + '/auth/login', { waitUntil: 'domcontentloaded' })
console.log('>>> HYR ME GOOGLE NE KETE DRITARE. Mos e mbyll. Pres 20 min.')
let ok = false
for (let i = 0; i < 240; i++) {
  await f.waitForTimeout(5000)
  try {
    const shenja = await f.evaluate(() => {
      try { return Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k) && (localStorage.getItem(k) || '').length > 40) }
      catch { return false }
    })
    if (shenja) { ok = true; break }
  } catch {}
  if (i % 12 === 0) console.log('   ...pa sesion ende (' + (i * 5) + 's)')
}
if (ok) { await f.waitForTimeout(3000); console.log('>>> SESIONI U RUAJT ne profil. Mund ta mbyllesh.') }
else console.log('NUK U KYC brenda afatit.')
await sh.close()
process.exit(ok ? 0 : 2)

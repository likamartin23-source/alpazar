#!/usr/bin/env node
/**
 * HYRJA + FOTO DIAGNOSTIKE — dritare e vogel, e lehte, qe kap sesionin shpejt.
 *
 * PSE ndryshe: xhirot e meparshme ranE jo nga Google por nga (a) kujtesa — dritarja
 * rrinte pa mbikeqyrje dhe sistemi e vriste; (b) mbyllja e dritares nga pronari.
 * Ky: pak kujtese, kontrollon cdo 3s, ben foto cdo 15s (qe agjenti te SHOHE nese
 * del ekrani "browser not secure"), dhe DEL sapo kap sesionin — jo pas.
 */
import { chromium } from 'playwright'
const BAZA = 'https://alpazar.vercel.app'
const PROFIL = process.env.PROFIL || '.ops/.profil-chrome'

const sh = await chromium.launchPersistentContext(PROFIL, {
  headless: false, channel: 'chrome',
  viewport: { width: 1024, height: 720 }, locale: 'sq-AL',
  args: ['--disable-extensions', '--disable-background-networking', '--disable-dev-shm-usage', '--disable-gpu'],
})
// KRITIKE: faqja ka porte-moshe + banner cookie qe MBULOJNE butonin "Vazhdo me
// Google". Pa keta flamuj, pronari nuk arrin dot te login-i — ky ishte fajtori i
// vertete i "autorizimit qe s'punonte", jo Google.
await sh.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})
const f = sh.pages()[0] || await sh.newPage()
await f.goto(BAZA + '/auth/login', { waitUntil: 'domcontentloaded' })
await f.waitForTimeout(1500)
// nese porta rri ende (flamuri lexohet vetem pas nje ringarkimi), shtyp butonin
try {
  await f.getByRole('button', { name: /Po, jam 16|vjeç/i }).click({ timeout: 2500 })
} catch {}
try {
  await f.getByRole('button', { name: /Prano të gjitha|Vetëm thelbësoret/i }).click({ timeout: 2500 })
} catch {}
await f.reload({ waitUntil: 'domcontentloaded' }).catch(() => {})
console.log('>>> HYR ME GOOGLE (porta e moshes u hoq). Foto te .ops/hyrje/*.png')

let ok = false
for (let i = 0; i < 400; i++) {          // deri 20 min, cdo 3s
  await f.waitForTimeout(3000)
  try {
    const shenja = await f.evaluate(() => {
      try { return Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k) && (localStorage.getItem(k) || '').length > 40) }
      catch { return false }
    })
    if (shenja) { ok = true; break }
    if (i % 5 === 0) { // foto cdo ~15s
      try { await f.screenshot({ path: `.ops/hyrje/gjendja.png` }) } catch {}
      const url = f.url().slice(0, 70)
      console.log('   ' + (i * 3) + 's · ' + url)
    }
  } catch (e) { console.log('   (gabim i perkohshem: ' + String(e.message).slice(0, 40) + ')') }
}
if (ok) { await f.waitForTimeout(2500); console.log('>>> SESIONI U RUAJT. Po dal.') }
else console.log('NUK U KYC brenda afatit.')
await sh.close()
process.exit(ok ? 0 : 2)

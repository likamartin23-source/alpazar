#!/usr/bin/env node
/**
 * AUTOPSIA ME AXE-CORE
 *
 * PSE: matesi im i kontrastit ka genjyer TRI here ne kete projekt —
 *   [O52] nuk lexonte sfondet me gradient;
 *   sot     raportoi cr=1.00 mbi butonat ari (i njejti shkak);
 *   sot     raportoi emoji dhe etiketa jashte ekranit si deshtime.
 * Cdo here e rregullova dhe cdo here doli edhe nje klase tjeter gabimi.
 *
 * axe-core eshte motori i deqinuar i Deque — i njejti qe perdorin Lighthouse,
 * Chrome DevTools dhe testet e aksesueshmerise ne industri. Ai i zgjidh vete
 * gradientet, elementet e fshehura, emoji-t dhe tekstin e mbivendosur, dhe
 * shenon si "incomplete" (jo "violation") cdo rast qe nuk e percakton dot me
 * siguri — pikerisht disiplina qe i mungonte mateses tim.
 *
 * Ky skedar NUK e zevendeson matjen topografike (prekja, ritmi, tipografia
 * nuk maten nga axe). E zevendeson vetem gjykimin per WCAG.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const DALJA = '.ops/autopsi'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'

const RRUGET = [
  '/', '/search', '/search/results', '/kategori', '/kategori/automjete',
  '/kategori/automjete/tirane', '/listing/' + LID, '/listing/new',
  '/biznese', '/biznese/' + BID, '/biznese/new', '/u/' + UID,
  '/profile', '/favorites', '/saved-searches', '/messages', '/notifications',
  '/asistent', '/billing', '/premium', '/oferta', '/referral', '/te-dhenat-mia',
  '/auth/login', '/kontakt', '/rreth-nesh', '/kushtet', '/privatesia',
  '/cookies', '/siguria', '/takedown', '/profile/analytics',
  '/biznese/' + BID + '/analytics', '/biznese/' + BID + '/edit',
  '/listing/' + LID + '/edit', '/admin',
]

const GJERESITE = [
  { g: 390, l: 844, mobile: true },
  { g: 1280, l: 900, mobile: false },
]

mkdirSync(DALJA, { recursive: true })
const gjithcka = []
const shfletuesi = await chromium.launch()

for (const gj of GJERESITE) {
  const kontekst = await shfletuesi.newContext({
    viewport: { width: gj.g, height: gj.l },
    isMobile: gj.mobile, hasTouch: gj.mobile, locale: 'sq-AL',
  })
  // Pelqimi vendoset qe axe te shohe FAQEN, jo tri shtresat e pelqimit.
  await kontekst.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })

  for (const rruga of RRUGET) {
    const faqja = await kontekst.newPage()
    const rez = { rruga, gjeresi: gj.g }
    try {
      await faqja.goto(BAZA + rruga, { waitUntil: 'networkidle', timeout: 45000 })
      await faqja.waitForTimeout(1200)
      const r = await new AxeBuilder({ page: faqja })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
        .analyze()
      rez.shkelje = r.violations.map((v) => ({
        id: v.id, ndikimi: v.impact, sa: v.nodes.length,
        pershkrimi: v.help,
        mostra: v.nodes.slice(0, 2).map((n) => (n.html || '').slice(0, 110)),
      }))
      rez.paperfunduara = r.incomplete.map((v) => ({ id: v.id, sa: v.nodes.length }))
      rez.kaluan = r.passes.length
    } catch (e) {
      rez.gabim = String(e.message).slice(0, 120)
    }
    await faqja.close()
    gjithcka.push(rez)
    const n = rez.gabim ? 'GABIM' : rez.shkelje.reduce((a, v) => a + v.sa, 0)
    console.log(String(gj.g).padStart(4) + ' ' + rruga.padEnd(46) + ' shkelje: ' + n)
  }
  await kontekst.close()
}
await shfletuesi.close()
writeFileSync(DALJA + '/axe.json', JSON.stringify(gjithcka, null, 1))

// Permbledhje sipas rregullit
const sipas = {}
for (const r of gjithcka) {
  for (const v of r.shkelje || []) {
    const k = v.id
    sipas[k] = sipas[k] || { ndikimi: v.ndikimi, pershkrimi: v.pershkrimi, nyje: 0, faqe: new Set(), mostra: v.mostra[0] }
    sipas[k].nyje += v.sa
    sipas[k].faqe.add(r.rruga)
  }
}
const rend = { critical: 0, serious: 1, moderate: 2, minor: 3 }
console.log('\n═══ PERMBLEDHJE AXE-CORE — WCAG 2.1 A + AA ═══')
for (const [id, v] of Object.entries(sipas).sort((a, b) =>
  (rend[a[1].ndikimi] ?? 9) - (rend[b[1].ndikimi] ?? 9) || b[1].nyje - a[1].nyje)) {
  console.log('\n  [' + (v.ndikimi || '?').toUpperCase() + '] ' + id +
    '  —  ' + v.nyje + ' nyje ne ' + v.faqe.size + ' faqe')
  console.log('     ' + v.pershkrimi)
  console.log('     p.sh. ' + v.mostra)
}
console.log('\n→ ' + DALJA + '/axe.json')

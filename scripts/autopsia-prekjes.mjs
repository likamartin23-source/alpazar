#!/usr/bin/env node
/**
 * AUTOPSIA E PIKAVE TE PREKJES — dy kufij, jo nje
 *
 * Numri "34% nen 44px" pa kontekst eshte mashtrues. Ka DY standarde:
 *
 *   WCAG 2.5.5 (AAA, 44x44) — synimi i brendshem i ketij projekti.
 *   WCAG 2.5.8 (AA,  24x24) — kufiri i pranuar nderkombetarisht, me perjashtime te qarta:
 *        objektet ne nje rresht teksti, objektet me hapesire >=24px rreth
 *        tyre, dhe ato qe kane nje ekuivalent tjeter ne faqe NUK numerohen.
 *
 * axe-core e zbaton 2.5.8 me te gjitha perjashtimet. Ky skedar e pyet ate,
 * qe raporti te thote sa jane shkelje te standardit dhe sa jane thjesht larg
 * synimit te larte — dy gjera krejt te ndryshme.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
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

const shf = await chromium.launch()
const ktx = await shf.newContext({
  viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'sq-AL',
})
await ktx.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})

const dalja = []
let totAA = 0, tot44 = 0, totGj = 0
for (const rruga of RRUGET) {
  const f = await ktx.newPage()
  const rez = { rruga }
  try {
    await f.goto(BAZA + rruga, { waitUntil: 'networkidle', timeout: 45000 })
    await f.waitForTimeout(1000)
    // (a) Kufiri WCAG 2.5.8 AA, me perjashtimet e tij
    const r = await new AxeBuilder({ page: f })
      .withTags(['wcag22aa']).withRules(['target-size']).analyze()
    rez.aa = (r.violations.find((v) => v.id === 'target-size')?.nodes.length) || 0
    rez.aa_mostra = (r.violations.find((v) => v.id === 'target-size')?.nodes || [])
      .slice(0, 2).map((n) => (n.html || '').slice(0, 80))
    // (b) Synimi i brendshem AAA 44x44
    const s = await f.evaluate(() => {
      const D = document, W = window
      const duket = (e) => {
        const b = e.getBoundingClientRect(), st = W.getComputedStyle(e)
        return b.width > 4 && b.height > 4 && st.visibility !== 'hidden' && st.display !== 'none' && st.opacity !== '0'
      }
      const el = [...D.querySelectorAll('button,a[href],[role=link],[role=button]')]
        .filter(duket).filter((e) => (e.textContent || '').trim().indexOf('Kalo tek') !== 0)
      const vogel = el.filter((e) => {
        const b = e.getBoundingClientRect()
        return b.height < 44 || b.width < 44
      })
      return {
        gjithsej: el.length, nen44: vogel.length,
        mostra: vogel.slice(0, 3).map((e) => {
          const b = e.getBoundingClientRect()
          return ((e.getAttribute('aria-label') || (e.textContent || '').trim() || e.tagName).slice(0, 16)) +
            ' ' + Math.round(b.width) + 'x' + Math.round(b.height)
        }),
      }
    })
    Object.assign(rez, s)
    totAA += rez.aa; tot44 += s.nen44; totGj += s.gjithsej
  } catch (e) { rez.gabim = String(e.message).slice(0, 90) }
  await f.close()
  dalja.push(rez)
  console.log(rruga.padEnd(46) +
    'AA(24px, WCAG): ' + String(rez.aa ?? '-').padStart(3) +
    '   AAA(44px, synim): ' + String(rez.nen44 ?? '-').padStart(3) + '/' + (rez.gjithsej ?? '-'))
}
await shf.close()
writeFileSync('.ops/autopsi/prekja.json', JSON.stringify(dalja, null, 1))

console.log('\n═══ PERFUNDIM (390px, telefon, 36 faqe) ═══')
console.log('  Shkelje te standardit WCAG 2.5.8 AA (24x24, me perjashtime): ' + totAA)
console.log('  Larg synimit te brendshem (44x44, AAA):                 ' + tot44 + '/' + totGj +
  ' = ' + (100 * tot44 / totGj).toFixed(1) + '%')
const meKeq = dalja.filter((r) => r.aa > 0).sort((a, b) => b.aa - a.aa)
if (meKeq.length) {
  console.log('\n  Faqet me shkelje te WCAG 2.5.8 AA:')
  for (const r of meKeq) console.log('    ' + String(r.aa).padStart(3) + '  ' + r.rruga + '  →  ' + (r.aa_mostra || []).join(' | '))
} else {
  console.log('\n  Asnje shkelje e WCAG 2.5.8 AA.')
}

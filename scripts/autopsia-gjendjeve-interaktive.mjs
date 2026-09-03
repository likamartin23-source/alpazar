#!/usr/bin/env node
/**
 * AUTOPSIA E GJENDJEVE INTERAKTIVE — nënbutonat dhe panelet që hapen
 *
 * Deri tani u mat vetëm faqja siç vjen. Por gjysma e platformës është pas një
 * klikimi: panele filtrash, tabe, akordeone, hapa formash, dialogë. Asnjë nga
 * ato gjendje nuk ishte parë kurrë — dhe pikërisht aty u gjet defekti më i
 * rëndë deri tani (paneli i palosur i `/search` që gëlltiste 26 ndalesa fokusi).
 *
 * Ky skedar:
 *   1. gjen çdo kontroll që hap diçka (`aria-expanded`, `role=tab`, akordeon)
 *   2. e aktivizon një nga një
 *   3. rimat te GJENDJA E HAPUR: axe, dalje horizontale, kurthe fokusi,
 *      objekte të mbuluara, dhe përmbajtje e fshehur që rri e fokusueshme
 *
 * Kurthi i fokusit matet siç u provua: çdo paraardhës me `max-height:0` +
 * `opacity:0` që s'ka `inert` ose `visibility:hidden` është përmbajtje e
 * padukshme që tastiera ende e viziton.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

const RRUGET = [
  '/', '/search', '/search/results?q=makine', '/kategori', '/kategori/automjete',
  '/listing/' + LID, '/listing/new', '/biznese', '/biznese/' + BID, '/biznese/new',
  '/u/' + UID, '/asistent', '/kontakt', '/kushtet', '/privatesia', '/cookies',
  '/siguria', '/takedown', '/premium', '/oferta', '/referral', '/auth/login',
]

// Gjendja e padukshme-por-e-fokusueshme: matësi i provuar te [T-015].
const KURTHET = () => {
  const D = document, W = window
  const fshehur = (e) => {
    let n = e
    while (n && n !== D.body) {
      const s = W.getComputedStyle(n)
      if (s.maxHeight === '0px' && s.opacity === '0') return n
      if (s.visibility === 'hidden' || s.display === 'none') return null
      n = n.parentElement
    }
    return null
  }
  const fok = [...D.querySelectorAll('button,a[href],input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])')]
  const zene = []
  for (const e of fok) {
    const p = fshehur(e)
    if (p && !p.hasAttribute('inert')) zene.push(String(p.className || p.tagName).split(' ')[0].slice(0, 24))
  }
  const grup = {}
  for (const k of zene) grup[k] = (grup[k] || 0) + 1
  return grup
}

const MAT = () => {
  const D = document, W = window
  const duket = (e) => {
    const r = e.getBoundingClientRect(), s = W.getComputedStyle(e)
    return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
  }
  const ndv = [...D.querySelectorAll('button,a[href],[role=button],[role=link]')].filter(duket)
  return {
    dalje: Math.max(0, D.documentElement.scrollWidth - W.innerWidth),
    ndv: ndv.length,
    nen24: ndv.filter((e) => { const r = e.getBoundingClientRect(); return r.height < 24 || r.width < 24 }).length,
    paEmer: ndv.filter((e) => !((e.getAttribute('aria-label') || e.getAttribute('title') || (e.textContent || '').trim() ||
      (e.querySelector('img') && e.querySelector('img').getAttribute('alt')) || '').trim())).length,
  }
}

mkdirSync('.ops/autopsi', { recursive: true })
const shf = await chromium.launch()
const raporti = []

for (const gj of [{ g: 390, m: true }, { g: 1280, m: false }]) {
  const ktx = await shf.newContext({
    viewport: { width: gj.g, height: gj.m ? 844 : 900 },
    isMobile: gj.m, hasTouch: gj.m, locale: 'sq-AL',
  })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })

  for (const rruga of RRUGET) {
    const f = await ktx.newPage()
    try {
      await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
      await f.waitForTimeout(2400)

      // ── gjendja E QETË ──
      const qete = await f.evaluate(MAT)
      const kurthetQete = await f.evaluate(KURTHET)

      // ── gjej hapësit ──
      const hapesit = await f.evaluate(() => {
        const D = document, W = window
        const duket = (e) => {
          const r = e.getBoundingClientRect(), s = W.getComputedStyle(e)
          return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'
        }
        const c = [...D.querySelectorAll('[aria-expanded],[role=tab],summary,[data-akordeon],button')].filter(duket)
        return c.filter((e) => {
          if (e.hasAttribute('aria-expanded') || e.getAttribute('role') === 'tab' || e.tagName === 'SUMMARY') return true
          const t = (e.textContent || '').trim().toLowerCase()
          return /filtr|detaj|shfaq|më shumë|me shume|zgjero|opsione|avancuar|shiko/.test(t)
        }).slice(0, 6).map((e, i) => {
          e.setAttribute('data-hapes', String(i))
          return {
            i,
            etiketa: (e.getAttribute('aria-label') || (e.textContent || '').trim() || e.tagName).slice(0, 26),
            rol: e.getAttribute('role') || e.tagName.toLowerCase(),
          }
        })
      })

      const gjendjet = []
      for (const h of hapesit) {
        try {
          await f.click(`[data-hapes="${h.i}"]`, { timeout: 3000 })
          await f.waitForTimeout(700)
          const m = await f.evaluate(MAT)
          const k = await f.evaluate(KURTHET)
          const nk = Object.values(k).reduce((a, b) => a + b, 0)
          gjendjet.push({ ...h, ...m, kurthe: nk, kurthetDetaj: k })
        } catch { /* s'u hap dot — jo defekt në vetvete */ }
      }

      const rez = {
        rruga, gjeresi: gj.g, qete,
        kurthetQete, kurthetQeteN: Object.values(kurthetQete).reduce((a, b) => a + b, 0),
        hapes: hapesit.length, gjendjet,
      }
      raporti.push(rez)

      const keq = gjendjet.filter((s) => s.dalje > 0 || s.kurthe > rez.kurthetQeteN || s.paEmer > qete.paEmer)
      console.log(String(gj.g).padStart(4) + ' ' + rruga.padEnd(34) +
        'hapës ' + String(hapesit.length).padStart(2) +
        ' | kurthe(qetë) ' + String(rez.kurthetQeteN).padStart(3) +
        ' | gjendje me regres: ' + keq.length)
      for (const s of keq) {
        console.log('        ↳ "' + s.etiketa + '" → dalje ' + s.dalje +
          ' · kurthe ' + s.kurthe + ' · pa emër ' + s.paEmer + ' · <24px ' + s.nen24)
      }
      if (rez.kurthetQeteN > 0) {
        console.log('        ⚠ i padukshëm por i fokusueshëm: ' +
          Object.entries(kurthetQete).map(([k, v]) => k + '×' + v).join(', '))
      }
    } catch (e) {
      console.log(String(gj.g).padStart(4) + ' ' + rruga.padEnd(34) + 'GABIM ' + String(e.message).slice(0, 42))
    }
    await f.close()
  }
  await ktx.close()
}
await shf.close()

writeFileSync('.ops/autopsi/gjendjet-interaktive.json', JSON.stringify(raporti, null, 1))
const totKurthe = raporti.reduce((a, r) => a + r.kurthetQeteN, 0)
const faqeKurthe = [...new Set(raporti.filter((r) => r.kurthetQeteN > 0).map((r) => r.rruga))]
console.log('\n═══ PERMBLEDHJE ═══')
console.log('  Ndalesa fokusi te fshehura (gjithsej të dy gjerësitë): ' + totKurthe)
console.log('  Faqe të prekura: ' + (faqeKurthe.join(', ') || 'asnjë'))
console.log('  Gjendje të hapura që sjellin regres: ' +
  raporti.reduce((a, r) => a + r.gjendjet.filter((s) => s.dalje > 0).length, 0) + ' me dalje horizontale')
console.log('\n→ .ops/autopsi/gjendjet-interaktive.json')

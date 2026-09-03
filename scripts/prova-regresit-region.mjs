#!/usr/bin/env node
/**
 * PROVA E REGRESIT `region` DHE E RREGULLIMIT TE PROPOZUAR
 *
 * GJETJA: pas Grupit C, rregulli axe `region` u rrit nga 33 nyje / 19 faqe
 * ne **70 nyje / 35 faqe** — dhe TE GJITHA 70-at jane e njejta gje:
 *     <span class="fab-label">Albi</span>
 *
 * SHKAKU: `app/layout.tsx:264` e monton `<AiFloat />` si MOTER te
 * `<main id="main-content">`, pra jashte cdo landmark-u. Etiketa e tij eshte
 * tekst i lire ne asnje rajon. (`Instalo`/`Ndaj` te HomeClient NUK shenohen,
 * sepse ato vijne si `children` dhe rrine BRENDA `<main>`-it — kjo e vertetohet
 * vete diagnozen.)
 *
 * RREGULLIMI I PROPOZUAR: `aria-hidden="true"` mbi etiketen. Teksti mbetet i
 * dukshem; hiqet vetem dublimi ne pemen e aksesueshmerise — butoni ngjitur e
 * ka tashme `aria-label="Albi — Asistenti Virtual"`, pra asgje nuk humbet per
 * lexuesin e ekranit.
 *
 * Kjo prove e zbaton rregullimin NE DOM mbi prodhimin dhe mat perpara/pas me
 * te njejtin motor. Asgje nuk shtyhet pa kete prove.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const RRUGET = ['/', '/search', '/biznese', '/biznese/' + BID, '/kushtet', '/asistent', '/notifications']

async function mat(ktx, rruga, rregullo) {
  const f = await ktx.newPage()
  await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await f.waitForTimeout(2500)
  let prekur = 0
  if (rregullo) {
    prekur = await f.evaluate(() => {
      const el = document.querySelectorAll('.fab-label')
      el.forEach((e) => e.setAttribute('aria-hidden', 'true'))
      return el.length
    })
  }
  const r = await new AxeBuilder({ page: f })
    .withTags(['best-practice']).withRules(['region']).analyze()
  const v = r.violations.find((x) => x.id === 'region')
  const dalje = {
    nyje: v ? v.nodes.length : 0,
    mostra: v ? [...new Set(v.nodes.map((n) => (n.html || '').slice(0, 56)))] : [],
    prekur,
  }
  await f.close()
  return dalje
}

const shf = await chromium.launch()
let P = 0, Q = 0
console.log('rruga'.padEnd(30) + 'gjer'.padEnd(6) + 'para  pas   etiketa te prekura')
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
    let a, b
    try { a = await mat(ktx, rruga, false); b = await mat(ktx, rruga, true) }
    catch (e) { console.log(rruga.padEnd(30) + String(gj.g).padEnd(6) + 'KAPERCEHET ' + String(e.message).slice(0, 40)); continue }
    P += a.nyje; Q += b.nyje
    console.log(rruga.padEnd(30) + String(gj.g).padEnd(6) +
      String(a.nyje).padStart(4) + String(b.nyje).padStart(5) + '   ' + b.prekur +
      (a.mostra.length ? '   ' + a.mostra[0] : ''))
  }
  await ktx.close()
}
await shf.close()

console.log('\n═══ PERFUNDIM ═══')
console.log('  Nyje `region` PARA rregullimit : ' + P)
console.log('  Nyje `region` PAS rregullimit  : ' + Q)
console.log(Q < P
  ? '\n  → aria-hidden mbi .fab-label e mbyll regresin (' + (P - Q) + ' nyje).'
  : '\n  → Rregullimi NUK mjafton. Duhet landmark i vertete, jo aria-hidden.')

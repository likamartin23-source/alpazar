#!/usr/bin/env node
/**
 * AUTOPSIA E PERFORMANCES — Lighthouse
 *
 * Faza 5 e PLANI-100-WEB-APP.md: CLS < 0.1.
 *
 * Matet me mbytje reale (4G e ngadalte + CPU 4x me e ngadalte), sepse "100%
 * e disponueshme ne telefon" nuk do te thote "shpejt ne telefonin tim" — do
 * te thote e perdorshme ne rrjetin qe ka vendi.
 *
 * Vetem faqet me te ngarkuara: nese keto kalojne, te tjerat kalojne.
 */
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const DALJA = '.ops/autopsi'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'

const RRUGET = [
  '/', '/search', '/kategori/automjete',
  '/listing/' + LID, '/biznese', '/biznese/' + BID, '/asistent', '/kushtet',
]

mkdirSync(DALJA, { recursive: true })
const krom = await launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
const rezultatet = []

for (const pajisja of ['mobile', 'desktop']) {
  for (const rruga of RRUGET) {
    let r
    try {
      r = await lighthouse(BAZA + rruga, {
        port: krom.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: pajisja,
        screenEmulation: pajisja === 'mobile'
          ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
        throttling: pajisja === 'mobile'
          ? { rttMs: 150, throughputKbps: 1638, cpuSlowdownMultiplier: 4,
              requestLatencyMs: 562, downloadThroughputKbps: 1474, uploadThroughputKbps: 675 }
          : { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1,
              requestLatencyMs: 0, downloadThroughputKbps: 0, uploadThroughputKbps: 0 },
      })
    } catch (e) {
      console.log(pajisja.padEnd(8) + rruga.padEnd(46) + 'GABIM ' + String(e.message).slice(0, 60))
      continue
    }
    const l = r.lhr
    const v = (k) => (l.audits[k] ? l.audits[k].numericValue : null)
    const rez = {
      rruga, pajisja,
      performanca: Math.round((l.categories.performance?.score ?? 0) * 100),
      aksesueshmeria: Math.round((l.categories.accessibility?.score ?? 0) * 100),
      praktikat: Math.round((l.categories['best-practices']?.score ?? 0) * 100),
      seo: Math.round((l.categories.seo?.score ?? 0) * 100),
      LCP: v('largest-contentful-paint'),
      CLS: l.audits['cumulative-layout-shift']?.numericValue ?? null,
      TBT: v('total-blocking-time'),
      FCP: v('first-contentful-paint'),
      SI: v('speed-index'),
      pesha: v('total-byte-weight'),
    }
    rezultatet.push(rez)
    console.log(pajisja.padEnd(8) + rruga.padEnd(44) +
      'perf ' + String(rez.performanca).padStart(3) +
      ' | LCP ' + (rez.LCP / 1000).toFixed(1) + 's' +
      ' | CLS ' + (rez.CLS ?? 0).toFixed(3) +
      ' | TBT ' + Math.round(rez.TBT) + 'ms' +
      ' | ' + (rez.pesha / 1024 / 1024).toFixed(2) + 'MB')
  }
}
// Shkruaj PARA se te mbyllet Chrome: `krom.kill()` deshton me EPERM ne Windows
// kur dosja e perkohshme eshte ende e zene, dhe e humbte gjithe matjen.
writeFileSync(DALJA + '/performanca.json', JSON.stringify(rezultatet, null, 1))
try { await krom.kill() } catch { /* pastrimi i Chrome-it nuk e prish matjen */ }

console.log('\n═══ KUFIJTE (Core Web Vitals) ═══')
const keq = rezultatet.filter((r) => r.CLS > 0.1 || r.LCP > 2500 || r.TBT > 200)
if (!keq.length) console.log('  Te gjitha brenda kufijve.')
for (const r of keq) {
  const shk = []
  if (r.CLS > 0.1) shk.push('CLS ' + r.CLS.toFixed(3) + ' > 0.1')
  if (r.LCP > 2500) shk.push('LCP ' + (r.LCP / 1000).toFixed(1) + 's > 2.5s')
  if (r.TBT > 200) shk.push('TBT ' + Math.round(r.TBT) + 'ms > 200ms')
  console.log('  ' + r.pajisja.padEnd(8) + r.rruga.padEnd(44) + shk.join(' | '))
}
console.log('\n→ ' + DALJA + '/performanca.json')

#!/usr/bin/env node
/**
 * KUSH E KAP FAQEN — matje live e zinxhirit te prinderve.
 *
 * Kodi thote qe `.wrap` e /listing/[id] eshte 100% ne 1920px, por syri dhe te dy
 * instrumentet thone ~1140px. Njeri prej tyre genjen. Ky nuk lexon kod: merr nje
 * element permbajtjeje ne faqen e gjalle dhe ngjitet lart nga prindi ne prind,
 * duke shtypur gjeresine e vertete dhe max-width-in e llogaritur te secilit.
 * Aty ku gjeresia bie nen ekranin, aty eshte kapja — me emer klase.
 */
import { chromium } from 'playwright'

const BAZA = 'https://alpazar.vercel.app'
const RRUGET = process.env.RRUGET
  ? process.env.RRUGET.split(',')
  : ['/listing/dcc29dcc-ad56-4297-b299-5fb7e4ea6349']

const sh = await chromium.launch()
const k = await sh.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'sq-AL' })
await k.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})

for (const rruga of RRUGET) {
  const f = await k.newPage()
  await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await f.waitForTimeout(6000)
  const zinxhiri = await f.evaluate(() => {
    const D = document
    // nis nga nje nyje teksti e vertete brenda <main>
    const m = D.querySelector('main') || D.body
    const ec = D.createTreeWalker(m, NodeFilter.SHOW_TEXT)
    let n, nis = null
    while ((n = ec.nextNode())) {
      const t = (n.textContent || '').trim()
      const pr = n.parentElement
      if (t.length < 12 || !pr) continue
      // nje <script> permban tekst por nuk eshte permbajtje e dukshme
      if (pr.closest('script,style,noscript')) continue
      const r = pr.getBoundingClientRect()
      if (r.width < 40 || r.height < 8) continue
      nis = pr
      break
    }
    if (!nis) return []
    const rez = []
    let e = nis
    while (e && e !== D.documentElement) {
      const r = e.getBoundingClientRect(), s = getComputedStyle(e)
      rez.push({
        etiketa: e.tagName.toLowerCase(),
        klasa: String(e.className || '').split(' ').filter(Boolean).slice(0, 2).join('.') || '—',
        gjeresia: Math.round(r.width),
        majtas: Math.round(r.left),
        maxWidth: s.maxWidth,
        padding: s.paddingLeft + ' / ' + s.paddingRight,
        margin: s.marginLeft + ' / ' + s.marginRight,
      })
      e = e.parentElement
    }
    return rez.reverse()
  })
  console.log('\n══════ ' + rruga + ' @1920px ══════')
  console.log('  GJERESI  MAJTAS  MAX-WIDTH        PADDING            ELEMENTI')
  for (const z of zinxhiri) {
    console.log('  ' + String(z.gjeresia).padStart(7) + String(z.majtas).padStart(8) + '  ' +
      String(z.maxWidth).padEnd(16) + String(z.padding).padEnd(19) +
      z.etiketa + '.' + z.klasa)
  }
  await f.close()
}
await sh.close()

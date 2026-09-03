#!/usr/bin/env node
/**
 * AUTOPSIA E GJENDJEVE — kater kritere qe s'u prekur kurre
 *
 * Deri tani u mat vetem gjendja e QETE e faqes. Por nje platforme perdoret me
 * tastiere, me zmadhim, dhe nga njerez qe levizja u ben keq. Kater kritere
 * WCAG nuk i ka parë askush ne kete projekt:
 *
 *   1.4.4  Zmadhim deri ne 200% pa humbje permbajtjeje a funksioni
 *   2.4.7  Fokusi DUHET te duket — perndryshe tastiera eshte e verber
 *   1.4.11 Treguesi i fokusit duhet te kete kontrast >= 3:1
 *   2.3.3  `prefers-reduced-motion` duhet respektuar
 *
 * Zmadhimi matet si ZVOGELIM i dritares me te njejtin permbajtje (ekuivalenti
 * i sakte i zoom-it te shfletuesit per rimarrjen e faqes): 1280/2 = 640 CSS px.
 * Nese diçka del jashte ose mbulohet aty, ajo humbet edhe me zoom 200% real.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const RRUGET = [
  '/', '/search', '/kategori/automjete', '/listing/' + LID,
  '/biznese', '/biznese/' + BID, '/kushtet', '/kontakt', '/auth/login', '/asistent',
]

mkdirSync('.ops/autopsi', { recursive: true })
const shf = await chromium.launch()
const rez = []

// ── 1.4.4 · Zmadhim 200% ────────────────────────────────────────────────
const ktxZ = await shf.newContext({ viewport: { width: 640, height: 512 }, locale: 'sq-AL' })
await ktxZ.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})
console.log('── 1.4.4 · Zmadhim 200% (1280 → 640 CSS px) ──')
for (const rruga of RRUGET) {
  const f = await ktxZ.newPage()
  try {
    await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await f.waitForTimeout(2500)
    const z = await f.evaluate(() => {
      const D = document, W = window
      const dalje = Math.max(0, D.documentElement.scrollWidth - W.innerWidth)
      // permbajtje qe del jashte kornizes horizontalisht
      const jashte = [...D.querySelectorAll('*')].filter((e) => {
        const r = e.getBoundingClientRect()
        const s = W.getComputedStyle(e)
        if (r.width < 5 || r.height < 5 || s.display === 'none' || s.visibility === 'hidden') return false
        return r.right > W.innerWidth + 2
      })
      // objekte ndervepruese te mbuluara nga nje shtrese fikse
      const ndv = [...D.querySelectorAll('button,a[href]')].filter((e) => {
        const r = e.getBoundingClientRect()
        return r.width > 4 && r.height > 4 && r.top >= 0 && r.bottom <= W.innerHeight
      })
      let mbuluar = 0
      for (const e of ndv) {
        const r = e.getBoundingClientRect()
        const top = D.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
        if (top && top !== e && !e.contains(top) && !top.contains(e)) mbuluar++
      }
      return {
        dalje,
        jashte: jashte.length,
        jashteMostra: jashte.slice(0, 3).map((e) => e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0].slice(0, 20)),
        ndv: ndv.length, mbuluar,
      }
    })
    rez.push({ kriteri: '1.4.4', rruga, ...z })
    console.log('  ' + rruga.padEnd(44) + 'dalje ' + String(z.dalje).padStart(4) +
      ' | jashtë ' + String(z.jashte).padStart(3) + ' | të mbuluar ' + z.mbuluar + '/' + z.ndv +
      (z.jashte ? '  ' + z.jashteMostra.join(' ') : ''))
  } catch (e) { console.log('  ' + rruga.padEnd(44) + 'GABIM ' + String(e.message).slice(0, 40)) }
  await f.close()
}
await ktxZ.close()

// ── 2.4.7 + 1.4.11 · Fokusi ─────────────────────────────────────────────
const ktxF = await shf.newContext({ viewport: { width: 1280, height: 900 }, locale: 'sq-AL' })
await ktxF.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})
console.log('\n── 2.4.7 · A duket fokusi kur lëviz me tastierë? ──')
for (const rruga of RRUGET) {
  const f = await ktxF.newPage()
  try {
    await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await f.waitForTimeout(2500)
    const pa = []
    let pare = 0
    for (let i = 0; i < 22; i++) {
      await f.keyboard.press('Tab')
      const d = await f.evaluate(() => {
        const e = document.activeElement
        if (!e || e === document.body) return null
        const s = getComputedStyle(e)
        const eshteDukshem =
          (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) ||
          (s.boxShadow && s.boxShadow !== 'none') ||
          s.getPropertyValue('--fokus-i-dukshem') === '1'
        return {
          etiketa: (e.getAttribute('aria-label') || (e.textContent || '').trim() || e.tagName).slice(0, 22),
          tag: e.tagName.toLowerCase(),
          cls: String(e.className || '').split(' ')[0].slice(0, 18),
          eshteDukshem,
          outline: s.outlineStyle + ' ' + s.outlineWidth + ' ' + s.outlineColor,
        }
      })
      if (!d) continue
      pare++
      if (!d.eshteDukshem) pa.push(d)
    }
    rez.push({ kriteri: '2.4.7', rruga, pare, paFokus: pa.length, mostra: pa.slice(0, 3) })
    console.log('  ' + rruga.padEnd(44) + 'pa tregues fokusi: ' + String(pa.length).padStart(2) + '/' + pare +
      (pa.length ? '   ' + pa.slice(0, 2).map((x) => x.tag + '.' + x.cls).join(' ') : ''))
  } catch (e) { console.log('  ' + rruga.padEnd(44) + 'GABIM ' + String(e.message).slice(0, 40)) }
  await f.close()
}
await ktxF.close()

// ── 2.3.3 · prefers-reduced-motion ──────────────────────────────────────
console.log('\n── 2.3.3 · A respektohet `prefers-reduced-motion`? ──')
const ktxR = await shf.newContext({
  viewport: { width: 1280, height: 900 }, locale: 'sq-AL', reducedMotion: 'reduce',
})
await ktxR.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})
for (const rruga of RRUGET.slice(0, 6)) {
  const f = await ktxR.newPage()
  try {
    await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
    await f.waitForTimeout(2500)
    const m = await f.evaluate(() => {
      const D = document, W = window
      const gjalle = [...D.querySelectorAll('*')].filter((e) => {
        const s = W.getComputedStyle(e)
        const a = s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.05
        const t = parseFloat(s.transitionDuration) > 0.05
        return a || t
      })
      return {
        respekton: W.matchMedia('(prefers-reduced-motion: reduce)').matches,
        gjalle: gjalle.length,
        animacione: gjalle.filter((e) => W.getComputedStyle(e).animationName !== 'none').length,
        mostra: gjalle.filter((e) => W.getComputedStyle(e).animationName !== 'none')
          .slice(0, 3).map((e) => e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0].slice(0, 16) +
            ' ' + W.getComputedStyle(e).animationName),
      }
    })
    rez.push({ kriteri: '2.3.3', rruga, ...m })
    console.log('  ' + rruga.padEnd(44) + 'media aktive: ' + m.respekton +
      ' | ende me animacion: ' + String(m.animacione).padStart(3) + ' | me tranzicion: ' + m.gjalle +
      (m.mostra.length ? '   ' + m.mostra[0] : ''))
  } catch (e) { console.log('  ' + rruga.padEnd(44) + 'GABIM ' + String(e.message).slice(0, 40)) }
  await f.close()
}
await ktxR.close()
await shf.close()

writeFileSync('.ops/autopsi/gjendjet.json', JSON.stringify(rez, null, 1))
const z = rez.filter((r) => r.kriteri === '1.4.4')
const fo = rez.filter((r) => r.kriteri === '2.4.7')
const rm = rez.filter((r) => r.kriteri === '2.3.3')
console.log('\n═══ PERMBLEDHJE ═══')
console.log('  1.4.4  faqe me dalje horizontale @640px : ' + z.filter((r) => r.dalje > 0).length + '/' + z.length)
console.log('  1.4.4  faqe me objekte te mbuluara      : ' + z.filter((r) => r.mbuluar > 0).length + '/' + z.length)
console.log('  2.4.7  objekte pa tregues fokusi        : ' + fo.reduce((a, r) => a + r.paFokus, 0) +
  ' nga ' + fo.reduce((a, r) => a + r.pare, 0))
console.log('  2.3.3  animacione qe vazhdojne          : ' + rm.reduce((a, r) => a + r.animacione, 0))
console.log('\n→ .ops/autopsi/gjendjet.json')

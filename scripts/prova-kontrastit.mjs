#!/usr/bin/env node
/**
 * PROVA E INSTRUMENTIT TE KONTRASTIT
 *
 * Instrumenti i kontrastit ka genjyer dy here ne kete projekt ([O52], dhe
 * serish sot me cr=1.00 mbi butonat me gradient). Asnje numer kontrasti nuk
 * raportohet me pa e kaluar kete prove.
 *
 * Prova krahason matjen e drejtperdrejte te faqes me VLERA TE LLOGARITURA ME
 * DORE per raste te njohura. Nese nje rast nuk perputhet, instrumenti eshte
 * i prishur dhe numrat nuk vlejne.
 */
import { chromium } from 'playwright'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'

// Referenca e pavarur: WCAG 2.x, e shkruar nga e para, jo e kopjuar nga matesi.
const ndricim = (r, g, b) => {
  const k = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]
}
const cr = (a, b) => {
  const x = ndricim(...a), y = ndricim(...b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Raste me pergjigje te njohur, te llogaritura nga referenca me siper.
const RASTET = [
  { emri: '#555 mbi #111 (teksti shpjegues i portes)', fg: [85, 85, 85], bg: [17, 17, 17] },
  { emri: '#666 mbi #111 (butoni "Jo, largohem")', fg: [102, 102, 102], bg: [17, 17, 17] },
  { emri: '#111 mbi #F5C842 (teksti i butonit ari)', fg: [17, 17, 17], bg: [245, 200, 66] },
  { emri: '#fff mbi #111 (titulli i portes)', fg: [255, 255, 255], bg: [17, 17, 17] },
  { emri: '#A0A0A0 mbi #1A1A1A (etiketa e rripit)', fg: [160, 160, 160], bg: [26, 26, 26] },
]

console.log('── 1. Referenca e pavarur ───────────────────────────────')
for (const r of RASTET) {
  const v = cr(r.fg, r.bg)
  console.log('  ' + String(v.toFixed(2)).padStart(6) + ':1  ' +
    (v >= 4.5 ? 'KALON' : v >= 3 ? 'vetëm-i-madh' : 'DËSHTON') + '  ' + r.emri)
}

// 2. A e riprodhon matesi i faqes te njejten gje?
const shf = await chromium.launch()
const faqja = await shf.newPage({ viewport: { width: 390, height: 844 } })
await faqja.goto(BAZA + '/', { waitUntil: 'networkidle' })
await faqja.waitForTimeout(1500)

const prova = await faqja.evaluate(() => {
  const W = window, D = document
  const st = (e) => W.getComputedStyle(e)
  const parsePer = (c) => {
    const m = String(c).match(/[\d.]+/g)
    if (!m) return null
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }
  }
  const ndalesatEGradientit = (bi) => {
    if (!bi || bi === 'none' || bi.indexOf('gradient') < 0) return []
    const out = []
    for (const m of bi.match(/rgba?\([^)]*\)/g) || []) {
      const c = parsePer(m)
      if (c && c.a > 0.5) out.push({ r: c.r, g: c.g, b: c.b, a: 1 })
    }
    return out
  }
  const sipas = (mbi) => {
    if (!mbi.length || mbi[mbi.length - 1].a < 1) mbi = mbi.concat([{ r: 255, g: 255, b: 255, a: 1 }])
    let out = mbi[mbi.length - 1]
    for (let i = mbi.length - 2; i >= 0; i--) {
      const f = mbi[i]
      out = { r: f.r * f.a + out.r * (1 - f.a), g: f.g * f.a + out.g * (1 - f.a), b: f.b * f.a + out.b * (1 - f.a), a: 1 }
    }
    return out
  }
  const sfondet = (e) => {
    let n = e
    const mbi = []
    while (n && n.nodeType === 1) {
      const s = st(n)
      const nd = ndalesatEGradientit(s.backgroundImage)
      if (nd.length) return nd.map((g) => sipas(mbi.concat([g])))
      const c = parsePer(s.backgroundColor)
      if (c && c.a > 0) { mbi.push(c); if (c.a === 1) break }
      n = n.parentElement
    }
    return [sipas(mbi)]
  }
  const nd2 = (c) => {
    const k = [c.r, c.g, c.b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) })
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]
  }
  const kontrast = (a, b) => {
    const x = nd2(a), y = nd2(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }
  // gjej butonin e portes se moshes dhe tekstin e saj
  const gjej = (t) => [...D.querySelectorAll('button,div,a')]
    .find((e) => (e.textContent || '').trim() === t)
  const dalje = []
  for (const t of ['Po, jam 16+ vjeç', 'Jo, largohem', 'Para se të vazhdosh, konfirmo moshën tënde']) {
    const e = gjej(t)
    if (!e) { dalje.push({ t, gjendet: false }); continue }
    const s = st(e), fg = parsePer(s.color)
    const bgs = sfondet(e)
    let best = 0
    for (const bg of bgs) best = Math.max(best, kontrast(fg, bg))
    dalje.push({
      t, gjendet: true, ngjyra: s.color, bgImg: s.backgroundImage.slice(0, 60),
      sfondet: bgs.map((b) => 'rgb(' + Math.round(b.r) + ',' + Math.round(b.g) + ',' + Math.round(b.b) + ')'),
      cr: +best.toFixed(2), px: Math.round(parseFloat(s.fontSize)),
    })
  }
  return dalje
})
await shf.close()

console.log('\n── 2. Matesi mbi faqen e vertete ────────────────────────')
for (const d of prova) {
  if (!d.gjendet) { console.log('  ??  nuk u gjet: ' + d.t); continue }
  console.log('  ' + String(d.cr).padStart(6) + ':1  ' + d.px + 'px  "' + d.t.slice(0, 34) + '"')
  console.log('          ngjyra=' + d.ngjyra + '  sfondet=' + d.sfondet.join(' / '))
  if (d.bgImg && d.bgImg !== 'none') console.log('          gradient=' + d.bgImg)
}
console.log('\nPROVA KALON vetëm nëse butoni ari NUK jep 1.00 dhe teksti #555 jep ~2.5.')

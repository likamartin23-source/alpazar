#!/usr/bin/env node
/**
 * ANALIZA ERGONOMIKE — kthen matjet e papërpunuara (.ops/autopsi/optika.json) në numra
 * që flasin për SYRIN, jo për pikselin.
 *
 * ISO 9241-303 §5.2: lartësia e karakterit (madhësia e shkronjës së madhe) duhet të jetë
 *   ≥ 16 harqe minutë (kufiri absolut), 20–22′ për punë të zgjatur.
 *   lartesi_mm ≥ distanca_mm × 0.00465 (16′) ose × 0.00582…0.0064 (20–22′)
 * Këtu bëjmë rrugën e kundërt: nga px → mm → arcmin, dhe pastaj sa px DUHEN për 20′.
 */
import { readFileSync } from 'node:fs'

// MATUR LIVE me canvas mbi fontin e vertete te aplikacionit (Plus Jakarta Sans):
// cap=0.750 · x-height=0.540 · gjeresi mesatare karakteri=0.5606em. Jo hamendje nga Inter.
const CAP = Number(process.env.CAP || 0.750)
const EKRANET = {
  'telefon-390': { mmPerPx: 71.4 / 390, dist: 350, w: 390 },
  'laptop-1280': { mmPerPx: 286 / 1280, dist: 550, w: 1280 },
  'desktop-1920': { mmPerPx: 531 / 1920, dist: 600, w: 1920 },
  'i-madh-2560': { mmPerPx: 597 / 2560, dist: 700, w: 2560 },
}
const arcmin = (mm, dist) => 2 * Math.atan(mm / (2 * dist)) * (180 / Math.PI) * 60
const pxPer = (targetArcmin, e) => {
  const mm = 2 * e.dist * Math.tan((targetArcmin / 60 / 2) * (Math.PI / 180))
  return mm / e.mmPerPx / CAP
}

const d = JSON.parse(readFileSync('.ops/autopsi/optika.json', 'utf8'))

console.log('\n═══ 1. SA E MADHE DUHET TE JETE SHKRONJA (nga syri, jo nga moda) ═══')
console.log('ekrani          mm/px   dist   px per 16\'(min)   px per 20\'(rehat)   px per 22\'')
for (const [emri, e] of Object.entries(EKRANET)) {
  console.log(
    emri.padEnd(15) + e.mmPerPx.toFixed(4).padStart(6) + String(e.dist).padStart(7) + 'mm' +
    pxPer(16, e).toFixed(1).padStart(14) + pxPer(20, e).toFixed(1).padStart(20) + pxPer(22, e).toFixed(1).padStart(13)
  )
}

console.log('\n═══ 2. CFARE KA VERTET NE PLATFORME (matje live) ═══')
console.log('faqja            ' + Object.keys(EKRANET).map((x) => x.padEnd(17)).join(''))
console.log('                 ' + Object.keys(EKRANET).map(() => 'px    arcmin  vlera'.padEnd(17)).join(''))
const rreshtat = []
for (const [faqja, matjet] of Object.entries(d.faqet)) {
  let rr = faqja.padEnd(17)
  for (const [emri, e] of Object.entries(EKRANET)) {
    const m = matjet[emri]
    if (!m || !m.trupPx) { rr += '—'.padEnd(17); continue }
    const am = arcmin(m.trupPx * CAP * e.mmPerPx, e.dist)
    const v = am >= 20 ? 'OK ' : am >= 16 ? 'kuf' : 'DOB'
    rreshtat.push({ faqja, ekrani: emri, px: m.trupPx, arcmin: am, verdikt: v })
    rr += (String(m.trupPx) + 'px').padEnd(6) + am.toFixed(1).padStart(5) + "'  " + v.padEnd(4)
  }
  console.log(rr)
}
const nenMin = rreshtat.filter((r) => r.arcmin < 16).length
const rehat = rreshtat.filter((r) => r.arcmin >= 20).length
console.log('\nPERMBLEDHJE: ' + rreshtat.length + ' matje · nen kufirin ISO 16\': ' + nenMin +
  ' (' + Math.round((nenMin / rreshtat.length) * 100) + '%) · ne brezin e rehatise 20\'+: ' + rehat)

console.log('\n═══ 3. A SHKALLEZOHET TIPOGRAFIA ME EKRANIN? (px @390 → @2560) ═══')
for (const [faqja, m] of Object.entries(d.faqet)) {
  const a = m['telefon-390']?.trupPx, b = m['laptop-1280']?.trupPx
  const c = m['desktop-1920']?.trupPx, e = m['i-madh-2560']?.trupPx
  if (!a && !c) continue
  const rritja = a && e ? ((e / a - 1) * 100).toFixed(0) + '%' : '—'
  console.log(faqja.padEnd(17) + [a, b, c, e].map((x) => String(x ?? '—').padStart(6)).join('') + '   rritje 390→2560: ' + rritja)
}

console.log('\n═══ 4. MASA (karaktere/rresht) — optimale 45–75 ═══')
for (const [faqja, m] of Object.entries(d.faqet)) {
  const rr = Object.keys(EKRANET).map((k) => {
    const ch = m[k]?.masa?.ch
    return ch ? (String(ch) + (ch > 75 ? '!' : ch < 45 ? '·' : ' ')).padStart(6) : '     —'
  })
  if (rr.every((x) => x.trim() === '—')) continue
  console.log(faqja.padEnd(17) + rr.join('') + '   (! = mbi 75, · = nen 45)')
}

console.log('\n═══ 5. CAQET E PREKJES — WCAG 2.5.8 AA kerkon 24px, AAA 44px ═══')
for (const [faqja, m] of Object.entries(d.faqet)) {
  const rr = Object.keys(EKRANET).map((k) => {
    const c = m[k]?.caqe
    return c ? (c.nen24 + '/' + c.n).padStart(9) : '        —'
  })
  console.log(faqja.padEnd(17) + rr.join('') + '   (nen24/gjithsej)')
}

console.log('\n═══ 6. SHFRYTEZIMI I GJERESISE — glifet kundrejt ekranit ═══')
console.log('(kujdes: >100% do te thote permbajtje qe rreshket horizontalisht, jo mbushje)')
for (const [faqja, m] of Object.entries(d.faqet)) {
  const rr = Object.keys(EKRANET).map((k) => (m[k] ? (m[k].shfrytezimi + '%').padStart(9) : '        —'))
  console.log(faqja.padEnd(17) + rr.join(''))
}

console.log('\n═══ 7. KONI I REHATISE VIZUALE (±15° foveal, ±30° kufi) ═══')
for (const [emri, e] of Object.entries(EKRANET)) {
  const mm15 = 2 * e.dist * Math.tan((15 * Math.PI) / 180)
  const mm30 = 2 * e.dist * Math.tan((30 * Math.PI) / 180)
  console.log(
    emri.padEnd(15) + 'ekrani=' + String(Math.round(e.w * e.mmPerPx)).padStart(4) + 'mm' +
    '  koni ±15° = ' + String(Math.round(mm15)).padStart(4) + 'mm = ' + String(Math.round(mm15 / e.mmPerPx)).padStart(4) + 'px' +
    '  ±30° = ' + String(Math.round(mm30)).padStart(4) + 'mm = ' + String(Math.round(mm30 / e.mmPerPx)).padStart(4) + 'px' +
    '  → ekrani zë ' + (2 * Math.atan((e.w * e.mmPerPx) / 2 / e.dist) * 180 / Math.PI).toFixed(0) + '°'
  )
}

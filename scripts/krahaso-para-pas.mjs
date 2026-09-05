#!/usr/bin/env node
/**
 * KRAHASIMI PARA/PAS — a lëvizën vërtet kriteret e pranimit, apo vetëm skedarët?
 *
 * Rregulli i planit: një urdhër pune mbyllet vetëm kur mbyllet EFEKTI i matur live.
 * Ky skript e jep atë numër, faqe për faqe dhe në total.
 *
 *   PARA=.ops/autopsi/totale-PARA-xxx.json PAS=.ops/autopsi/totale-PAS.json node scripts/krahaso-para-pas.mjs
 */
import { readFileSync } from 'node:fs'

const para = JSON.parse(readFileSync(process.env.PARA || '.ops/autopsi/totale-PARA-3c21976.json', 'utf8'))
const pas = JSON.parse(readFileSync(process.env.PAS || '.ops/autopsi/totale-PAS.json', 'utf8'))
const EKR = ['telefon-390', 'laptop-1280', 'desktop-1920']
const shkurt = (u) => u.replace(/dcc29dcc-ad56-4297-b299-5fb7e4ea6349/, ':shpallja')
  .replace(/49745b08-ba0a-488e-b731-7fd19ee6a0bb/, ':biznesi')
  .replace(/af3e3d5b-0f49-4ad5-a83d-281733fed433/, ':perdoruesi')

const mat = (m) => ({
  nen16: m.shkeljet.filter((x) => x.lloj === 'tekst' && x.arcmin && x.arcmin < 16).length,
  nen20: m.shkeljet.filter((x) => x.lloj === 'tekst' && x.arcmin && x.arcmin < 20).length,
  tekste: m.shkeljet.filter((x) => x.lloj === 'tekst').length,
  cak24: m.shkeljet.filter((x) => x.lloj === 'cak<24').length,
  cak44: m.shkeljet.filter((x) => x.lloj === 'cak<44').length,
  masa75: m.shkeljet.filter((x) => x.masa && x.masa > 75).length,
  butona: m.butonat.length,
})
const zero = { nen16: 0, nen20: 0, tekste: 0, cak24: 0, cak44: 0, masa75: 0, butona: 0 }
const mbledh = (d, vetemKeto) => {
  const t = { ...zero }
  for (const [u, ek] of Object.entries(d.faqet)) {
    if (vetemKeto && !vetemKeto.has(u)) continue
    for (const e of EKR) { const m = ek[e]; if (!m) continue
      const n = mat(m); for (const k of Object.keys(t)) t[k] += n[k] }
  }
  return t
}

// krahaso VETEM rruget qe ekzistojne ne te dyja matjet — ndryshe numri genjen
const bashkeperkuese = new Set(Object.keys(para.faqet).filter((u) => pas.faqet[u]))
const a = mbledh(para, bashkeperkuese)
const b = mbledh(pas, bashkeperkuese)

const shigjeta = (v) => (v < 0 ? '↓' : v > 0 ? '↑' : '=')
const rresht = (emri, x, y, synimi) => {
  const d = y - x
  const perq = x ? Math.round((d / x) * 100) : 0
  console.log('  ' + emri.padEnd(30) + String(x).padStart(7) + ' → ' + String(y).padStart(7) +
    '   ' + (shigjeta(d) + String(Math.abs(d))).padStart(7) + ' (' + String(perq) + '%)' +
    (synimi !== undefined ? '   synimi: ' + synimi + (y <= synimi ? '  ✅ ARRITUR' : '  ⏳') : ''))
}

console.log('═══ KRAHASIMI PARA → PAS ═══')
console.log('rrugë të krahasuara: ' + bashkeperkuese.size + ' (vetëm ato që ekzistojnë në të dyja matjet)\n')
rresht('Tekste nën 16′ (ISO min)', a.nen16, b.nen16, 0)
rresht('Tekste nën 20′ (rehatia)', a.nen20, b.nen20, Math.round(a.tekste * 0.1))
rresht('Caqe nën 24px (WCAG AA)', a.cak24, b.cak24, 0)
rresht('Caqe nën 44px (WCAG AAA)', a.cak44, b.cak44, 50)
rresht('Rreshta mbi 75 karaktere', a.masa75, b.masa75, 0)
rresht('Tekste të matura gjithsej', a.tekste, b.tekste)
rresht('Butona të matur gjithsej', a.butona, b.butona)

console.log('\n═══ FAQE PËR FAQE (vetëm ato që lëvizën) ═══')
console.log('  rruga'.padEnd(40) + 'nën16'.padStart(16) + 'cak24'.padStart(14) + 'cak44'.padStart(14))
const rreshtat = []
for (const u of bashkeperkuese) {
  const x = mbledh({ faqet: { [u]: para.faqet[u] } })
  const y = mbledh({ faqet: { [u]: pas.faqet[u] } })
  const delta = (y.nen16 - x.nen16) + (y.cak24 - x.cak24) + (y.cak44 - x.cak44)
  if (delta === 0 && x.nen16 === y.nen16) continue
  rreshtat.push({ u: shkurt(u), x, y, delta })
}
for (const r of rreshtat.sort((p, q) => p.delta - q.delta)) {
  console.log('  ' + r.u.slice(0, 37).padEnd(38) +
    (r.x.nen16 + '→' + r.y.nen16).padStart(14) + '  ' +
    (r.x.cak24 + '→' + r.y.cak24).padStart(12) + '  ' +
    (r.x.cak44 + '→' + r.y.cak44).padStart(12) +
    (r.delta > 0 ? '   ⚠ PËRKEQËSIM' : ''))
}

console.log('\n═══ REGRESE: faqe ku ndonjë numër u rrit ═══')
const regrese = rreshtat.filter((r) => r.y.nen16 > r.x.nen16 || r.y.cak24 > r.x.cak24 || r.y.cak44 > r.x.cak44)
console.log(regrese.length ? regrese.map((r) => '  ' + r.u).join('\n') : '  (asnjë)')

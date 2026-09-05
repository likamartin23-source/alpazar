#!/usr/bin/env node
/**
 * ANALIZA E AUTOPSISË TOTALE — nga elementët e papërpunuar te verdikti faqe-për-faqe,
 * buton-për-buton, plus raport i veçantë për pesë zonat që citoi pronari.
 */
import { readFileSync } from 'node:fs'

const d = JSON.parse(readFileSync(process.env.HYRJA || '.ops/autopsi/totale.json', 'utf8'))
const EKR = ['telefon-390', 'laptop-1280', 'desktop-1920']
const shkurt = (u) => u.replace(/dcc29dcc-ad56-4297-b299-5fb7e4ea6349/, ':shpallja')
  .replace(/49745b08-ba0a-488e-b731-7fd19ee6a0bb/, ':biznesi')
  .replace(/af3e3d5b-0f49-4ad5-a83d-281733fed433/, ':perdoruesi')

const numra = (m) => ({
  elem: m.nrElemente,
  butona: m.butonat.length,
  // vetem tekste (jo butona) qe te mos numerohet i njejti element dy here
  nen16: m.shkeljet.filter((x) => x.lloj === 'tekst' && x.arcmin && x.arcmin < 16).length,
  nen20: m.shkeljet.filter((x) => x.lloj === 'tekst' && x.arcmin && x.arcmin < 20).length,
  butonaTeVegjel: m.butonat.filter((x) => x.arcmin && x.arcmin < 16).length,
  tekste: m.shkeljet.filter((x) => x.lloj === 'tekst').length,
  cak24: m.shkeljet.filter((x) => x.lloj === 'cak<24').length,
  cak44: m.shkeljet.filter((x) => x.lloj === 'cak<44').length,
  masa75: m.shkeljet.filter((x) => x.masa && x.masa > 75).length,
  dalje: m.dalje,
})

console.log('═══ 1. VERDIKTI FAQE-PËR-FAQE ═══')
console.log('(nën16 = tekste nën minimumin ISO · cak24/44 = caqe prekjeje nën WCAG AA/AAA · masa = rreshta mbi 75 karaktere)\n')
console.log('rruga'.padEnd(40) + EKR.map((e) => e.split('-')[0].padEnd(28)).join(''))
console.log(''.padEnd(40) + EKR.map(() => 'nën16 cak24 cak44 masa'.padEnd(28)).join(''))
const totali = { nen16: 0, nen20: 0, tekste: 0, cak24: 0, cak44: 0, masa75: 0, butona: 0, faqe: 0, butonaTeVegjel: 0 }
const perFaqe = []
for (const [u, ekranet] of Object.entries(d.faqet)) {
  let rr = shkurt(u).slice(0, 39).padEnd(40)
  let keq = 0
  for (const e of EKR) {
    const m = ekranet[e]
    if (!m) { rr += ''.padEnd(28); continue }
    const n = numra(m)
    rr += String(n.nen16).padStart(5) + String(n.cak24).padStart(6) + String(n.cak44).padStart(6) + String(n.masa75).padStart(5) + '   ' + (m.dalje ? 'DALJE' : '     ')
    keq += n.nen16 + n.cak24 * 3 + n.cak44 + n.masa75 * 2
    totali.nen16 += n.nen16; totali.nen20 += n.nen20; totali.tekste += n.tekste; totali.butonaTeVegjel += (n.butonaTeVegjel||0)
    totali.cak24 += n.cak24; totali.cak44 += n.cak44; totali.masa75 += n.masa75; totali.butona += n.butona
  }
  totali.faqe++
  perFaqe.push({ u: shkurt(u), keq })
  console.log(rr)
}
console.log('\nTOTALI: ' + totali.faqe + ' rrugë · ' + totali.butona + ' butona të matur · ' +
  totali.tekste + ' tekste të matura')
console.log('  tekste nën 16′ (ISO minimum): ' + totali.nen16)
console.log('  tekste nën 20′ (rehatia):     ' + totali.nen20)
console.log('  caqe nën 24px (WCAG AA):      ' + totali.cak24)
console.log('  caqe nën 44px (WCAG AAA):     ' + totali.cak44)
console.log('  rreshta mbi 75 karaktere:     ' + totali.masa75)
console.log('  butona me tekst nën 16′:      ' + totali.butonaTeVegjel + ' nga ' + totali.butona)
console.log('  → pjesa e teksteve nën ISO:   ' + Math.round(totali.nen16 / totali.tekste * 100) + '%')

console.log('\n═══ 2. RENDITJA E DËMIT (nën16 + 3×cak24 + cak44 + 2×masa) ═══')
for (const f of perFaqe.sort((a, b) => b.keq - a.keq).slice(0, 12)) {
  console.log('  ' + String(f.keq).padStart(5) + '  ' + f.u)
}

console.log('\n═══ 3. CAQET MË TË VOGLA NË GJITHË PLATFORMËN (top 20) ═══')
const caqe = []
for (const [u, ekranet] of Object.entries(d.faqet)) {
  for (const e of EKR) {
    const m = ekranet[e]; if (!m) continue
    for (const b of m.butonat) if (b.cak < 24) caqe.push({ u: shkurt(u), e, ...b })
  }
}
caqe.sort((a, b) => a.cak - b.cak)
for (const c of caqe.slice(0, 20)) {
  console.log('  ' + String(c.cak).padStart(3) + 'px  ' + c.e.split('-')[0].padEnd(8) +
    (c.etiketa || '(pa etiketë)').slice(0, 26).padEnd(28) + c.emri.slice(0, 24).padEnd(26) + c.u.slice(0, 30))
}

console.log('\n═══ 4. TEKSTET MË TË VOGLA (top 20 sipas arcmin) ═══')
const tekste = []
for (const [u, ekranet] of Object.entries(d.faqet)) {
  for (const e of EKR) {
    const m = ekranet[e]; if (!m) continue
    for (const s of m.shkeljet) if (s.lloj === 'tekst' && s.arcmin) tekste.push({ u: shkurt(u), e, ...s })
  }
}
tekste.sort((a, b) => a.arcmin - b.arcmin)
for (const t of tekste.slice(0, 20)) {
  console.log('  ' + String(t.fs).padStart(5) + 'px ' + String(t.arcmin).padStart(5) + "'  " +
    t.e.split('-')[0].padEnd(8) + (t.etiketa || '').slice(0, 30).padEnd(32) + t.u.slice(0, 34))
}

console.log('\n═══ 5. PESË ZONAT QË CITOI PRONARI ═══')
const ZONAT = [
  ['Faqja e ngarkimit të shpalljes', (u) => u === '/listing/new'],
  ['Karta e shpalljes (ballina/kërkimi)', (u) => u === '/' || u.startsWith('/search')],
  ['Profili i JASHTËM i biznesit', (u) => u.includes('/biznese/') && u.includes('public=1')],
  ['Nënfaqet e butonave të biznesit', (u) => /\/biznese\/[^/]+\/(analytics|edit)/.test(u)],
  ['Butonat në fund të platformës', null],
]
for (const [emri, filtri] of ZONAT) {
  console.log('\n── ' + emri + ' ──')
  if (!filtri) {
    // fundi i platformes: butonat me y me te madh se 70% e faqes
    const f = []
    for (const [u, ekranet] of Object.entries(d.faqet)) {
      const m = ekranet['desktop-1920']; if (!m) continue
      for (const b of m.butonat) if (b.fs && b.fs < 14 && /gjuh|©|Kushtet|Privatesia|Cookies|Siguria|Kontakt|Rreth/i.test(b.etiketa || '')) f.push({ u: shkurt(u), ...b })
    }
    const pare = new Set()
    for (const b of f) { const kyc = b.etiketa + b.fs; if (pare.has(kyc)) continue; pare.add(kyc)
      console.log('  ' + String(b.fs).padStart(5) + 'px ' + String(b.arcmin).padStart(5) + "'  cak=" + String(b.cak).padStart(3) + 'px  ' + (b.etiketa || '').slice(0, 34)) }
    if (!f.length) console.log('  (asnjë element i gjetur me këtë filtër)')
    continue
  }
  for (const [u, ekranet] of Object.entries(d.faqet)) {
    if (!filtri(u)) continue
    for (const e of EKR) {
      const m = ekranet[e]; if (!m) continue
      const n = numra(m)
      console.log('  ' + shkurt(u).slice(0, 34).padEnd(36) + e.padEnd(14) +
        'butona=' + String(n.butona).padStart(3) + ' nën16=' + String(n.nen16).padStart(3) +
        ' nën20=' + String(n.nen20).padStart(3) + ' cak24=' + String(n.cak24).padStart(2) +
        ' cak44=' + String(n.cak44).padStart(3))
    }
  }
}

console.log('\n═══ 6. HARTA E BUTONAVE TË PROFILIT TË JASHTËM TË BIZNESIT (nënfaqet) ═══')
for (const [u, ekranet] of Object.entries(d.faqet)) {
  if (!(u.includes('/biznese/') && u.includes('public=1'))) continue
  const m = ekranet['desktop-1920']; if (!m) continue
  const pare = new Set()
  for (const b of m.butonat) {
    const kyc = (b.etiketa || '') + b.dest
    if (pare.has(kyc) || !b.etiketa) continue
    pare.add(kyc)
    console.log('  ' + (b.etiketa || '').slice(0, 30).padEnd(32) + 'cak=' + String(b.cak).padStart(3) + 'px  ' +
      String(b.fs).padStart(5) + 'px ' + String(b.arcmin ?? '—').padStart(5) + "'  → " + (b.dest || '(veprim në faqe)'))
  }
  if (m.tabat.length) console.log('  TABAT: ' + m.tabat.map((t) => t.etiketa + (t.zgjedhur ? '*' : '')).join(' · '))
}

console.log('\n═══ 7. RRUGË TË ZBULUARA QË S\'U MATËN ═══')
const matura = new Set(Object.keys(d.faqet).map((u) => u.split('?')[0]))
const teReja = (d.hrefsTeZbuluara || []).filter((h) => {
  const b = h.split('?')[0]
  if (matura.has(b)) return false
  for (const m of matura) { const rr = m.replace(/[a-f0-9-]{36}/g, '[id]'); if (b.replace(/[a-f0-9-]{36}/g, '[id]') === rr) return false }
  return true
})
console.log(teReja.length ? teReja.map((x) => '  ' + x).join('\n') : '  (asnjë — mbulimi është i plotë)')

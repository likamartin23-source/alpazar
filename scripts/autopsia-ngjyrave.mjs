#!/usr/bin/env node
/**
 * AUTOPSIA E NGJYRAVE
 *
 * Pyetja: a eshte kjo nje palete, apo drift?
 *
 * Nje palete ka ngjyra qe SYRI I NJERIUT i dallon. Dy heksadecimale qe ndryshojne
 * me 1 njesi ne nje kanal nuk jane dy ngjyra — jane e njejta ngjyre e shkruar
 * dy here. Kjo matje i grupon ngjyrat sipas distances perceptuale CIE76 (Lab):
 *
 *   dE < 1.0  → syri i njeriut NUK i dallon fare
 *   dE < 2.3  → kufiri "sapo i dallueshem" (JND)
 *   dE < 5    → dallohen vetem krah per krah
 *
 * Cdo grup me shume se nje heksadecimal eshte borxh: e njejta ngjyre e
 * shkruar disa here, qe do te shperndahet me kohen.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const dalja = execSync(
  'grep -rohE "#[0-9A-Fa-f]{6}\\b" app lib --include=*.tsx --include=*.ts --include=*.css',
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
)
const numerimi = {}
for (const rr of dalja.split(/\r?\n/)) {
  const h = rr.trim().toUpperCase()
  if (h.length === 7) numerimi[h] = (numerimi[h] || 0) + 1
}

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const lab = (h) => {
  let [r, g, b] = rgb(h).map((v) => {
    v /= 255
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  })
  let x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
  let y = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 1.0
  let z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  ;[x, y, z] = [f(x), f(y), f(z)]
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
const dE = (a, b) => {
  const A = lab(a), B = lab(b)
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2])
}

const hexet = Object.keys(numerimi).sort((a, b) => numerimi[b] - numerimi[a])
console.log('Heksadecimale unike te shkruara me dore: ' + hexet.length)
console.log('Perdorime gjithsej: ' + Object.values(numerimi).reduce((a, b) => a + b, 0))

// Grupim lakmitar rreth ngjyres me te perdorur
const KUFIRI = Number(process.env.DE || 2.3)
const grupet = []
const zene = new Set()
for (const h of hexet) {
  if (zene.has(h)) continue
  const g = [h]
  zene.add(h)
  for (const k of hexet) {
    if (zene.has(k)) continue
    if (dE(h, k) < KUFIRI) { g.push(k); zene.add(k) }
  }
  grupet.push(g)
}

const dyfishet = grupet.filter((g) => g.length > 1)
  .map((g) => ({ g, perdorime: g.reduce((a, h) => a + numerimi[h], 0) }))
  .sort((a, b) => b.perdorime - a.perdorime)

console.log('\nGrupe ngjyrash qe SYRI NUK I DALLON (dE < ' + KUFIRI + '): ' + dyfishet.length)
console.log('Perdorime te bllokuara ne keto grupe: ' +
  dyfishet.reduce((a, d) => a + d.perdorime, 0) + '\n')

for (const { g, perdorime } of dyfishet.slice(0, 14)) {
  const kryesorja = g[0]
  console.log('  ' + String(perdorime).padStart(4) + ' perdorime  →  ' + kryesorja +
    '  (' + g.length + ' shkrime)')
  for (const h of g.slice(1)) {
    console.log('           ' + String(numerimi[h]).padStart(4) + '  ' + h +
      '   dE=' + dE(kryesorja, h).toFixed(2) +
      '   Δrgb=' + rgb(kryesorja).map((v, i) => (rgb(h)[i] - v)).join(','))
  }
}

// Sa prej tyre jane vertet ne token?
try {
  const css = readFileSync('app/ui-refine.css', 'utf8')
  const tok = new Set((css.match(/--[a-z0-9-]+\s*:\s*#[0-9A-Fa-f]{6}/g) || [])
    .map((s) => s.split(':')[1].trim().toUpperCase()))
  console.log('\nNgjyra te deklaruara si token ne CSS: ' + tok.size)
  console.log('Ngjyra te shkruara me dore qe NUK jane token: ' +
    hexet.filter((h) => !tok.has(h)).length + ' / ' + hexet.length)
} catch (e) {
  console.log('\n(tokenet nuk u lexuan: ' + e.message.slice(0, 60) + ')')
}

#!/usr/bin/env node
/**
 * INVENTARI I BURIMEVE — çdo vend nga ku vjen një madhësi, një cak ose një kufi gjerësie.
 *
 * PSE ekziston: dyshemeja e fontit u zbatua në TRI valë (inline → CSS → tokenë të vjetër),
 * sepse fusha u përcaktua me regex e jo me inventar. Çdo valë ndreqi një burim dhe zbuloi
 * tjetrin. Ky skript e ndalon atë model: para çdo ndreqjeje, lista e PLOTË e burimeve.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, extname } from 'node:path'

const RRENJET = ['app', 'lib', 'components'].filter((d) => { try { statSync(d); return true } catch { return false } })
const skedaret = []
const ec = (d) => {
  for (const f of readdirSync(d)) {
    if (f === 'node_modules' || f.startsWith('.')) continue
    const p = join(d, f)
    const s = statSync(p)
    if (s.isDirectory()) ec(p)
    else if (['.tsx', '.ts', '.css', '.jsx', '.js'].includes(extname(f))) skedaret.push(p)
  }
}
for (const r of RRENJET) ec(r)

const KATEGORITE = [
  // [emri, regex, çfarë do të thotë]
  ['fontSize inline numerik', /fontSize:\s*\d+(\.\d+)?\b/g, 'stil inline me numër — mbizotëron çdo CSS'],
  ['fontSize inline me var()', /fontSize:\s*['"`]?var\(--[a-z0-9-]+\)/g, 'stil inline me token'],
  ['fontSize inline me shprehje', /fontSize:\s*[A-Za-z_$][\w$]*/g, 'stil inline me variabël — kodmodi s\'e prek dot'],
  ['font-size CSS px', /font-size:\s*\d+(\.\d+)?px/g, 'rregull CSS me px të ngurtë'],
  ['font-size CSS rem/em', /font-size:\s*\d*\.?\d+(rem|em)\b/g, 'rregull CSS relativ'],
  ['font-size CSS me var()', /font-size:\s*var\(--[a-z0-9-]+\)/g, 'rregull CSS me token'],
  ['font-size CSS me clamp()', /font-size:\s*clamp\(/g, 'i lëngshëm'],
  ['PËRKUFIZIM tokeni --fs-*', /--fs-[a-z0-9-]+:\s*[^;]+/g, 'burimi i vërtetë i madhësive'],
  ['max-width px', /max-width:\s*\d+px/g, 'kapës i ngurtë gjerësie'],
  ['maxWidth inline px', /maxWidth:\s*\d+\b/g, 'kapës i ngurtë inline'],
  ['max-width em/rem', /max-width:\s*\d*\.?\d+(em|rem)\b/g, 'kapës relativ (shkallëzohet)'],
  ['max-width % ose vw', /max-width:\s*\d+(%|vw)/g, 'kapës proporcional'],
  ['min-height cak', /min-height:\s*\d+px/g, 'lartësi minimale (caqe prekjeje)'],
  ['minHeight inline', /minHeight:\s*\d+\b/g, 'lartësi minimale inline'],
  ['width/height fikse inline', /(width|height):\s*\d+,/g, 'përmasë fikse inline'],
  ['!important', /!important/g, 'mbizotërim i fortë — rrezik konflikti'],
]

const tot = {}
const perSkedar = {}
for (const f of skedaret) {
  let t
  try { t = readFileSync(f, 'utf8') } catch { continue }
  for (const [emri, rx] of KATEGORITE) {
    const m = t.match(rx)
    if (!m || !m.length) continue
    tot[emri] = (tot[emri] || 0) + m.length
    perSkedar[emri] = perSkedar[emri] || {}
    perSkedar[emri][f] = m.length
  }
}

console.log('═══ INVENTARI I BURIMEVE — ' + skedaret.length + ' skedarë të skanuar ═══\n')
for (const [emri, , kuptimi] of KATEGORITE) {
  const n = tot[emri] || 0
  console.log(String(n).padStart(5) + '  ' + emri.padEnd(30) + kuptimi)
}

console.log('\n═══ KU JANË TË PËRQENDRUARA (5 skedarët kryesorë për secilën) ═══')
for (const [emri] of KATEGORITE) {
  const p = perSkedar[emri]
  if (!p) continue
  const top = Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 5)
  if (!top.length) continue
  console.log('\n── ' + emri + ' (' + tot[emri] + ')')
  for (const [f, n] of top) console.log('   ' + String(n).padStart(4) + '  ' + f)
}

console.log('\n═══ PËRKUFIZIMET E TOKENËVE (burimi i së vërtetës) ═══')
for (const f of skedaret) {
  let t; try { t = readFileSync(f, 'utf8') } catch { continue }
  const m = t.match(/--fs-[a-z0-9-]+:\s*[^;]+/g)
  if (!m) continue
  console.log('\n── ' + f)
  for (const x of [...new Set(m)]) console.log('   ' + x.trim())
}

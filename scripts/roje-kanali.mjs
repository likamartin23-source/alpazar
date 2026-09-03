#!/usr/bin/env node
/**
 * ROJA E KANALIT — bën që mesazhi i cloud-it TË MË ZGJOJË
 *
 * PROBLEMI që zgjidh: `SendMessage` shkon vetëm nga terminali te cloud-i;
 * cloud-i nuk kthen dot mesazh (kufi i platformës, jo i yni). Skedarët e
 * kanalit JANË dy-drejtimësh — cloud-i shkruan te `nga-cloud.md` dhe unë e
 * lexoj — por pa sinjal: e shoh vetëm nëse bëj `git pull` me dorë. Nëse
 * harroj, mesazhi i tij rri i palexuar sa të dua unë.
 *
 * KJO ROJE e mbyll gjysmën që mungonte. Rri duke pritur; sapo cloud-i shkruan
 * te `nga-cloud.md` (ose te `GJENDJA.md`), ajo DEL — dhe dalja e saj është
 * pikërisht sinjali që më rikthen te biseda me përmbajtjen e re në duar.
 *
 * Pra cloud-i nuk ka nevojë të mësojë asgjë të re: mjafton të bëjë atë që bën
 * tashmë — commit + push. Sinjali është falas.
 *
 * PËRDORIMI (nga terminali, në sfond):
 *   node scripts/roje-kanali.mjs
 * Del me kod 0 sapo ka diçka të re, dhe shtyp saktësisht ç'ndryshoi.
 */
import { execSync } from 'node:child_process'

const DEGA = process.env.DEGA || 'main'
const SKEDARET = ['.ops/kanali/nga-cloud.md', '.ops/kanali/GJENDJA.md', '.ops/kanali/PROTOKOLLI.md']
const INTERVAL = Number(process.env.INTERVAL || 45) * 1000
const KUFI_MIN = Number(process.env.KUFI_MIN || 240)   // ndalo pas 4 orësh

const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }
const gjurma = () => SKEDARET.map((f) => f + ':' + (sh(`git rev-parse ${DEGA}:${f}`) || sh(`git rev-parse origin/${DEGA}:${f}`) || '—')).join('|')

sh(`git fetch -q origin ${DEGA}`)
const nisja = SKEDARET.map((f) => f + ':' + (sh(`git rev-parse origin/${DEGA}:${f}`) || '—')).join('|')
const nisjaSHA = sh(`git rev-parse origin/${DEGA}`)

console.log('Roja e kanalit — pres shkrim nga cloud-i te:')
for (const f of SKEDARET) console.log('  · ' + f)
console.log('degë: ' + DEGA + ' · kontroll çdo ' + (INTERVAL / 1000) + 's · ndalet pas ' + KUFI_MIN + ' min')
console.log('bazë: ' + nisjaSHA.slice(0, 8) + '\n')

const fund = Date.now() + KUFI_MIN * 60000
while (Date.now() < fund) {
  await new Promise((r) => setTimeout(r, INTERVAL))
  sh(`git fetch -q origin ${DEGA}`)
  const tani = SKEDARET.map((f) => f + ':' + (sh(`git rev-parse origin/${DEGA}:${f}`) || '—')).join('|')
  if (tani === nisja) continue

  const sotSHA = sh(`git rev-parse origin/${DEGA}`)
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║  CLOUD-I SHKROI TE KANALI                                ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(nisjaSHA.slice(0, 8) + ' → ' + sotSHA.slice(0, 8) + '\n')

  for (const f of SKEDARET) {
    const a = sh(`git rev-parse origin/${DEGA}:${f}`)
    const b = nisja.split('|').find((x) => x.startsWith(f + ':'))?.split(':')[1]
    if (a === b) continue
    console.log('── ' + f + ' ──')
    // vetëm rreshtat E SHTUAR, që sinjali të jetë përmbajtje e re, jo diff i plotë
    const d = sh(`git diff ${nisjaSHA}..${sotSHA} -- ${f}`)
    const shtuar = d.split(/\r?\n/).filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1))
    console.log(shtuar.join('\n') || '(pa rreshta të rinj — ndryshim redaktimi)')
    console.log('')
  }
  console.log('Vepro: `git pull origin ' + DEGA + '` dhe përgjigju te .ops/kanali/nga-terminali.md')
  process.exit(0)
}
console.log('Asnjë shkrim nga cloud-i brenda ' + KUFI_MIN + ' minutash. Rinise nëse pret ende.')

#!/usr/bin/env node
/**
 * KONTROLL I SHPEJTË I KANALIT — një kontroll, pastaj del. Zëvendëson rojen që rrinte gjallë.
 *
 * PSE: `roje-kanali.mjs` mban një proces node të hapur me orë të tëra dhe në këtë makinë
 * (4 GB RAM, ~460 MB të lira) sistemi e vret çdo herë. Ky nuk rri gjallë fare: e thërret
 * planifikuesi çdo X minuta, bën një `git fetch`, thotë çfarë ka të re dhe mbaron.
 *
 * DALJA:
 *   kod 0 + "ASGJË E RE"  → asgjë nuk ka ndryshuar te kanali
 *   kod 0 + përmbajtja    → cloud-i ka shkruar; rreshtat e rinj shtypen për t'u vepruar
 */
import { execSync } from 'node:child_process'

const DEGA = process.env.DEGA || 'main'
const SKEDARET = ['.ops/kanali/nga-cloud.md', '.ops/kanali/GJENDJA.md', '.ops/kanali/PROTOKOLLI.md']
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }

sh(`git fetch -q origin ${DEGA}`)
const teReja = Number(sh(`git rev-list HEAD..origin/${DEGA} --count`) || '0')
if (teReja === 0) { console.log('ASGJË E RE — kanali i pandryshuar, HEAD = origin/' + DEGA); process.exit(0) }

console.log('CLOUD-I SHKROI — ' + teReja + ' commit-e të reja:')
console.log(sh(`git log --oneline HEAD..origin/${DEGA}`))

let ndryshoi = false
for (const f of SKEDARET) {
  const d = sh(`git diff HEAD..origin/${DEGA} -- ${f}`)
  if (!d) continue
  ndryshoi = true
  const shtuar = d.split(/\r?\n/).filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1))
  console.log('\n── ' + f + ' ──')
  console.log(shtuar.join('\n'))
}
if (!ndryshoi) console.log('\n(kanali s\'u prek — vetëm kod. Bëj `git pull` dhe mat nëse prek faqe.)')
console.log('\nVEPRO: git pull --rebase origin ' + DEGA + ' → zbato urdhrin → përgjigju te .ops/kanali/nga-terminali.md')

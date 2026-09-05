#!/usr/bin/env node
/**
 * PORTA E DEPLOY-IT — hapi i parë i çdo matjeje.
 *
 * PSE ekziston: më 5 shtator mata prodhimin ndërsa puna e cloud-it rrinte te dega, dhe
 * raportova "s'është bërë" për punë që ishte bërë. Rregulli i ri: asnjë matje pa e ditur
 * SE CILIN KOD po mat.
 *
 * DALJA: kod 0 nëse prodhimi == main (matja e vlefshme).
 *        kod 1 nëse prodhimi është prapa — dhe thotë saktësisht sa dhe çfarë mungon.
 */
import { execSync } from 'node:child_process'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const sh = (c) => { try { return execSync(c, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { return '' } }

sh('git fetch -q origin main')
const main = sh('git rev-parse origin/main')
let prod = ''
try {
  const r = execSync(`curl -s ${BAZA}/api/version`, { encoding: 'utf8' })
  prod = (JSON.parse(r).build || '').trim()
} catch { prod = '' }

const shk = (x) => (x || '').slice(0, 8)
console.log('main:     ' + shk(main))
console.log('prodhimi: ' + shk(prod))

if (!prod) { console.log('\n⚠ NUK U LEXUA prodhimi — matja NUK është e vlefshme.'); process.exit(1) }
if (prod === main) { console.log('\n✅ PORTA E HAPUR — prodhimi është identik me main. Matja e vlefshme.'); process.exit(0) }

const prapa = sh(`git rev-list ${prod}..${main} --count`)
const perpara = sh(`git rev-list ${main}..${prod} --count`)
console.log('\n⚠ PORTA E MBYLLUR — prodhimi NUK është main.')
if (prapa && Number(prapa) > 0) {
  console.log('Prodhimi është ' + prapa + ' commit-e PRAPA. Nuk janë live:')
  console.log(sh(`git log --oneline ${prod}..${main}`))
}
if (perpara && Number(perpara) > 0) console.log('Prodhimi është ' + perpara + ' commit-e PËRPARA main-it (deploy nga degë tjetër?).')
console.log('\nÇdo matje tani flet për një kod tjetër nga ai që sheh git-i. Shënoje në raport.')
process.exit(1)

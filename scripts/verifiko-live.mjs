#!/usr/bin/env node
/**
 * ROJTARI I PRODHIMIT
 *
 * PSE EKZISTON — mesimi me i shtrenjte i ketij projekti:
 *
 * Nga 10 gushti deri me 12 gusht, ASNJE shtytje nuk u vendos. GitHub-i i
 * merrte commit-et, Actions ekzekutoheshin, ndertimet e meparshme dukeshin
 * te gjelbra — dhe faqja mbeti e ngrire te commit-i 269c2415 per dy dite.
 *
 * Shkaku ishte nje rresht i vetem ne vercel.json:
 *     "schedule": "0 *\/6 * * *"
 * Plani Hobby lejon cron vetem NJE here ne dite. Vercel refuzonte te krijonte
 * cdo deployment me gabimin cron_jobs_limits_reached — pa e treguar askund ne
 * nderfaqe. Edhe deploy hook-u pranohej dhe vdiste ne heshtje.
 *
 * Asnje kontroll nuk e kapi, sepse te gjithe verifikonin ndertimin e FUNDIT,
 * jo nese ekzistonte nje i ri. Ky rojtar ben pikerisht kete: krahason commit-in
 * qe sherbehet LIVE me kokën e degës main. Nese ngecin larg njeri-tjetrit,
 * berret.
 */
import { readFileSync } from 'node:fs'

const BAZA = process.env.URL_PRODHIMI || 'https://alpazar.vercel.app'
const REPO = process.env.GITHUB_REPOSITORY || 'likamartin23-source/alpazar'
const DEGA = 'main'
// Sa gjate lejohet te mbetet prapa prodhimi para se te konsiderohet i ngecur.
const TOLERANCA_MIN = Number(process.env.TOLERANCA_MIN || 20)

const probleme = []

// ── 1. Cron-et: kapi PARA se te bllokojne vendosjet ───────────────────────
try {
  const v = JSON.parse(readFileSync('vercel.json', 'utf8'))
  for (const c of v.crons || []) {
    const [min, ore] = String(c.schedule || '').trim().split(/\s+/)
    const shpeshHere = ore?.includes('*/') || ore === '*' || min?.includes('*/') || min === '*'
    if (shpeshHere) {
      probleme.push(
        `vercel.json: cron "${c.schedule}" per ${c.path} ekzekutohet me shume se nje here ne dite. ` +
        'Plani Hobby nuk e lejon dhe Vercel do te REFUZOJE CDO VENDOSJE ' +
        '(cron_jobs_limits_reached). Perdor nje ore fikse, p.sh. "0 3 * * *".'
      )
    }
  }
} catch { /* pa vercel.json — asgje per te kontrolluar */ }

// ── 2. A eshte prodhimi i njejte me main? ─────────────────────────────────
async function json(url, opts) {
  const p = await fetch(url, { ...opts, headers: { 'cache-control': 'no-cache', ...(opts?.headers || {}) } })
  if (!p.ok) throw new Error(`${url} -> ${p.status}`)
  return p.json()
}

let live = null, kokaMain = null

try {
  const v = await json(`${BAZA}/api/version?t=${Date.now()}`)
  live = v.build
} catch (e) {
  probleme.push(`Prodhimi nuk u arrit: ${e.message}`)
}

// Gjej commit-in e fundit TE VENDOSSHEM ne main: jo cdo commit zbret ne prodhim.
// Push-et vetem-transport (.github/patches/**) i kalon qellimisht guard-i
// (paths-ignore te deploy.yml + ignoreCommand te vercel.json), ndaj prodhimi
// mbetet — me te drejte — te commit-i real i fundit. Po ta krahasonim live-in
// me koken e papershtatur te main, do te binte nje alarm i RREME sa here shtohej
// nje chunk transporti. Prandaj krahasojme me koken e fundit qe prek kod real.
var kohaKokes = Date.now()
try {
  const h = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  const lista = await json(`https://api.github.com/repos/${REPO}/commits?sha=${DEGA}&per_page=20`, { headers: h })
  let zgjedhur = null
  for (const c of lista) {
    let files = []
    try {
      const d = await json(`https://api.github.com/repos/${REPO}/commits/${c.sha}`, { headers: h })
      files = (d.files || []).map(f => f.filename)
    } catch { /* nese s'lexohen skedaret, trajtoje si te vendosshem */ }
    const vetemTransport = files.length > 0 && files.every(f => f.startsWith('.github/patches/'))
    if (!vetemTransport) { zgjedhur = c; break }
  }
  const c = zgjedhur || lista[0]
  kokaMain = c?.sha || null
  kohaKokes = new Date(c?.commit?.committer?.date || Date.now()).getTime()
} catch (e) {
  probleme.push(`GitHub nuk u arrit: ${e.message}`)
}

console.log(`Prodhimi          : ${live ?? '—'}`)
console.log(`main (i vendosshem): ${kokaMain ?? '—'}`)

if (live && kokaMain && live !== kokaMain) {
  const minutaPrapa = Math.round((Date.now() - kohaKokes) / 60000)
  const msg =
    `Prodhimi sherben ${live.slice(0, 12)} ndersa main eshte te ${kokaMain.slice(0, 12)} ` +
    `(${minutaPrapa} minuta i vjeter).`
  if (minutaPrapa > TOLERANCA_MIN) {
    probleme.push(
      msg + ' Vendosja nuk po ndodh. Kontrollo: (a) cron-et ne vercel.json, ' +
      '(b) lidhjen Git te projektit ne Vercel, (c) kufijte e planit.'
    )
  } else {
    console.log(`⏳ ${msg} Ende brenda tolerances prej ${TOLERANCA_MIN} min.`)
  }
}

if (probleme.length) {
  console.error('\n❌ PRODHIMI NUK PASQYRON MAIN:\n')
  for (const p of probleme) {
    console.error(`  • ${p}`)
    console.log(`::error::${p}`)
  }
  process.exit(1)
}

console.log('\n✅ Prodhimi eshte i njejte me main. Cron-et jane brenda kufijve.')

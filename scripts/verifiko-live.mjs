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
 * jo nese ekzistonte nje i ri. Ky rojtar ben pikerisht kete: verifikon qe
 * prodhimi sherben KODIN E APLIKACIONIT me te fundit qe eshte ne main.
 *
 * PSE KRAHASIM me compare, JO SHA-ekzakt (mesimi i 20 gushtit):
 * Jo cdo commit prek aplikacionin. Push-et vetem-transport (.github/patches),
 * ndryshimet e CI-se (.github, scripts), dokumentet (docs, *.md) NUK ndryshojne
 * app-in dhe Vercel me te drejte mund te mos krijoje deployment te ri per to.
 * Prodhimi atehere mbetet — saktesisht — nje PASARDHES qe i permban te gjitha
 * ndryshimet e app-it. Nje krahasim SHA-ekzakt do te jepte alarm te RREME.
 * Prandaj: prodhimi eshte i shendetshem nese midis commit-it LIVE dhe main HEAD
 * nuk ka asnje ndryshim ne skedar APLIKATIV. Kap driftin real, kurre te rremen.
 */
import { readFileSync } from 'node:fs'

const BAZA = process.env.URL_PRODHIMI || 'https://alpazar.vercel.app'
const REPO = process.env.GITHUB_REPOSITORY || 'likamartin23-source/alpazar'
const DEGA = 'main'
// Sa gjate lejohet te mbetet prapa prodhimi para se te konsiderohet i ngecur.
const TOLERANCA_MIN = Number(process.env.TOLERANCA_MIN || 20)

// Skedaret qe NUK ndryshojne aplikacionin e vendosur (nuk kerkojne deployment te ri).
function eshteAplikativ(path) {
  if (!path) return false
  if (path.startsWith('.github/')) return false   // workflow-e, patch-e transporti
  if (path.startsWith('scripts/')) return false   // ndihmesa CI, jo runtime
  if (path.startsWith('docs/')) return false       // dokumentim
  if (path.endsWith('.md')) return false           // README/dokumente
  if (path === 'LICENSE' || path === '.gitignore') return false
  return true                                       // app/, lib/, middleware.ts, vercel.json, package.json, ...
}

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

// ── 2. A pasqyron prodhimi kodin e fundit te aplikacionit? ────────────────
async function json(url, opts) {
  const p = await fetch(url, { ...opts, headers: { 'cache-control': 'no-cache', ...(opts?.headers || {}) } })
  if (!p.ok) throw new Error(`${url} -> ${p.status}`)
  return p.json()
}

const gh = { Accept: 'application/vnd.github+json' }
if (process.env.GITHUB_TOKEN) gh.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`

let live = null, kokaMain = null

try {
  const v = await json(`${BAZA}/api/version?t=${Date.now()}`)
  live = v.build
} catch (e) {
  probleme.push(`Prodhimi nuk u arrit: ${e.message}`)
}

try {
  const c = await json(`https://api.github.com/repos/${REPO}/commits/${DEGA}`, { headers: gh })
  kokaMain = c.sha
} catch (e) {
  probleme.push(`GitHub nuk u arrit: ${e.message}`)
}

console.log(`Prodhimi  : ${live ?? '—'}`)
console.log(`main HEAD : ${kokaMain ?? '—'}`)

if (live && kokaMain && live !== kokaMain) {
  // Cfare ka ndryshuar midis commit-it LIVE dhe main HEAD? Nese asgje aplikative,
  // prodhimi eshte i shendetshem (pasardhes qe permban tere kodin e app-it).
  try {
    const cmp = await json(`https://api.github.com/repos/${REPO}/compare/${live}...${kokaMain}`, { headers: gh })
    const ndrApp = (cmp.files || []).map(f => f.filename).filter(eshteAplikativ)
    const kohaMain = new Date(cmp.commits?.[cmp.commits.length - 1]?.commit?.committer?.date || Date.now()).getTime()
    const minutaPrapa = Math.round((Date.now() - kohaMain) / 60000)

    if (cmp.status === 'behind' || cmp.status === 'diverged') {
      // Prodhimi eshte PARA main-it (rollback?) ose degjuar — jo ngecje kodesh.
      console.log(`ℹ️ Prodhimi (${live.slice(0, 12)}) nuk eshte prapa main-it (status: ${cmp.status}).`)
    } else if (ndrApp.length === 0) {
      console.log(
        `✔️ Prodhimi (${live.slice(0, 12)}) permban tere kodin e app-it. ` +
        `${cmp.ahead_by} commit jo-aplikativ perpara (CI/docs/transport) — s'kerkojne vendosje.`
      )
    } else {
      const msg =
        `Prodhimi sherben ${live.slice(0, 12)} ndersa main ka ${ndrApp.length} ndryshim(e) APLIKATIV te pavendosur ` +
        `(p.sh. ${ndrApp.slice(0, 3).join(', ')}${ndrApp.length > 3 ? '…' : ''}; ${minutaPrapa} min i vjeter).`
      if (minutaPrapa > TOLERANCA_MIN) {
        probleme.push(
          msg + ' Vendosja nuk po ndodh. Kontrollo: (a) cron-et ne vercel.json, ' +
          '(b) lidhjen Git te projektit ne Vercel, (c) kufijte e planit, (d) deploy.yml/hook.'
        )
      } else {
        console.log(`⏳ ${msg} Ende brenda tolerances prej ${TOLERANCA_MIN} min.`)
      }
    }
  } catch (e) {
    probleme.push(`Krahasimi i commit-eve deshtoi: ${e.message}`)
  }
}

if (probleme.length) {
  console.error('\n❌ PRODHIMI NUK PASQYRON KODIN E APP-IT NE MAIN:\n')
  for (const p of probleme) {
    console.error(`  • ${p}`)
    console.log(`::error::${p}`)
  }
  process.exit(1)
}

console.log('\n✅ Prodhimi pasqyron kodin e fundit te app-it. Cron-et jane brenda kufijve.')

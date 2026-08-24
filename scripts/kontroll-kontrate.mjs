#!/usr/bin/env node
/**
 * KONTRATA KOD ↔ BAZË ↔ VETË KODI
 *
 * Çdo kontroll këtu ekziston sepse defekti përkatës ka ndodhur vërtet:
 *
 *   1. `.rpc('emer')` që nuk ekziston
 *   2. `.from('tabele')` që nuk ekziston
 *   3. kolonë e ndërvarur që nuk ekziston — `.select('*,listings(...,seller_id)')`
 *      PostgREST kthen 42703, `data` mbetet null, dhe skeda shfaq përherë
 *      "asnjë rezultat". Skeda e Moderimit ra në këtë dhe nuk punoi kurrë.
 *   4. komponent në depo që nuk e thërret asgjë — punë e padukshme
 *   5. funksion i privilegjuar i hapur për vizitorët — `_issue_invoice`
 *   6. SECURITY DEFINER pa `search_path` — rrezik injektimi skeme
 *
 * TypeScript-i nuk e kap asnjërin: të gjitha ndodhin në SQL ose në lidhje.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, extname, basename } from 'node:path'

const URL_BAZA = process.env.NEXT_PUBLIC_SUPABASE_URL
const CELESI = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!URL_BAZA || !CELESI) {
  console.log('::notice::Mungojnë kredencialet e bazës — kontrolli anashkalohet.')
  process.exit(0)
}

const SHPERFILL = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.vercel', 'scripts', '.claude'])
const SHTESA = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs'])

function skedaret(rrenja, mbledhur = []) {
  for (const emri of readdirSync(rrenja)) {
    if (SHPERFILL.has(emri)) continue
    const rruga = join(rrenja, emri)
    if (statSync(rruga).isDirectory()) skedaret(rruga, mbledhur)
    else if (SHTESA.has(extname(emri))) mbledhur.push(rruga)
  }
  return mbledhur
}

async function thirr(fn) {
  const p = await fetch(`${URL_BAZA}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: CELESI, Authorization: `Bearer ${CELESI}`, 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!p.ok) throw new Error(`${fn}: ${p.status} ${await p.text()}`)
  return p.json()
}

const manifesti = await thirr('contract_manifest')
const vetekontrolli = await thirr('contract_self_check')

const rpcEkzistuese = new Set(manifesti.rpc || [])
const tabela = manifesti.tabela || {}
const tabelaEkzistuese = new Set(Object.keys(tabela))

const gjithe = skedaret(process.cwd())
const gabime = []

// Emra jashtë skemës sonë (Supabase auth/storage) — nuk i kontrollojmë.
const PERJASHTIME = new Set(['objects', 'buckets', 'users'])

for (const skedari of gjithe) {
  const rreshtat = readFileSync(skedari, 'utf8').split('\n')
  const rel = skedari.replace(process.cwd() + '/', '')

  rreshtat.forEach((rreshti, i) => {
    // 1 — RPC
    for (const m of rreshti.matchAll(/\.rpc\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g))
      if (!rpcEkzistuese.has(m[1]))
        gabime.push({ rel, n: i + 1, lloji: 'RPC', emri: m[1] })

    // 2 — tabela
    for (const m of rreshti.matchAll(/\.from\(\s*['"`]([a-z_][a-z0-9_]*)['"`]/g))
      if (!tabelaEkzistuese.has(m[1]) && !PERJASHTIME.has(m[1]))
        gabime.push({ rel, n: i + 1, lloji: 'TABELË', emri: m[1] })

    // 3 — kolona të ndërvarura: select('...,tabela(kol1,kol2)')
    for (const m of rreshti.matchAll(/([a-z_][a-z0-9_]*)\s*\(([^()]*)\)/g)) {
      const t = m[1]
      if (!tabelaEkzistuese.has(t) || PERJASHTIME.has(t)) continue
      if (!/\.select\(|select\s*:/.test(rreshti)) continue
      const kolonat = new Set(tabela[t] || [])
      for (const k of m[2].split(',').map(x => x.trim().split(':').pop().trim()))
        if (k && /^[a-z_][a-z0-9_]*$/.test(k) && k !== '*' && !kolonat.has(k))
          gabime.push({ rel, n: i + 1, lloji: `KOLONË ${t}.`, emri: k })
    }
  })
}

// 4 — komponentë në depo që nuk i thërret askush
const permbajtja = new Map(gjithe.map(f => [f, readFileSync(f, 'utf8')]))
const tePathirrur = []
for (const f of gjithe) {
  if (!/\/(components|tabs)\//.test(f)) continue
  const emri = basename(f, extname(f))
  if (!/^[A-Z]/.test(emri)) continue
  let perdorur = false
  for (const [tjetri, txt] of permbajtja) {
    if (tjetri === f) continue
    if (txt.includes(`/${emri}'`) || txt.includes(`/${emri}"`) || txt.includes(`<${emri}`)) { perdorur = true; break }
  }
  if (!perdorur) tePathirrur.push(f.replace(process.cwd() + '/', ''))
}

console.log(`Skedarë: ${gjithe.length} | RPC në bazë: ${rpcEkzistuese.size} | Tabela: ${tabelaEkzistuese.size}`)

let deshtoi = false

if (gabime.length) {
  deshtoi = true
  console.error(`\n❌ ${gabime.length} referenca që NUK ekzistojnë në bazë:\n`)
  for (const g of gabime) {
    console.error(`  ${g.rel}:${g.n} — ${g.lloji}'${g.emri}'`)
    console.log(`::error file=${g.rel},line=${g.n}::${g.lloji}'${g.emri}' nuk ekziston në bazë`)
  }
}

if (!vetekontrolli.ne_rregull) {
  deshtoi = true
  console.error('\n❌ Baza ka probleme strukturore:\n')
  const rap = (celesi, teksti) => {
    for (const x of vetekontrolli[celesi] || []) {
      const v = typeof x === 'string' ? x : JSON.stringify(x)
      console.error(`  ${teksti}: ${v}`)
      console.log(`::error::${teksti}: ${v}`)
    }
  }
  rap('prefiks_i_dyfishuar', 'Prefiks i dyfishuar public.public.')
  rap('objekte_qe_mungojne', 'Referencë ndaj objekti joekzistues')
  rap('te_privilegjuar_per_anon', 'Funksion i privilegjuar i hapur për vizitorët')
  rap('secdef_pa_search_path', 'SECURITY DEFINER pa search_path')
}

if (tePathirrur.length) {
  // Paralajmërim, jo dështim: një komponent i ri mund të pritet për lidhje.
  console.log(`\n⚠️  ${tePathirrur.length} komponentë që nuk i thërret asgjë:`)
  for (const f of tePathirrur) {
    console.log(`  ${f}`)
    console.log(`::warning file=${f}::Ky komponent nuk thirret nga asnjë skedar — punë e padukshme.`)
  }
}

if (deshtoi) process.exit(1)
console.log('\n✅ Kontrata është e plotë. Asnjë referencë e thyer, asnjë ekspozim i pambrojtur.')

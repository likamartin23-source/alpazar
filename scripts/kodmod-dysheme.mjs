#!/usr/bin/env node
// KODMOD U-00 (Faza 0): ngri çdo `fontSize: N` me N<15 te dyshemeja `var(--fs-dysheme)`.
// Mekanik, i shqyrtueshëm, I KTHYESHËM. Prek VETËM literale numerike <15 te .tsx.
// PËRJASHTON: Avatar.tsx (inicialet 5px → trajtim me dorë, rrit rrethin), node_modules,
// app/verifikim-vizual (harness i pakomituar). Shprehjet (fontSize: x*y) s'preken.
// Përdorim: node scripts/kodmod-dysheme.mjs           (dry-run: numëron)
//          node scripts/kodmod-dysheme.mjs --apply    (shkruan)
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const APPLY = process.argv.includes('--apply')
const ROOTS = ['app', 'lib', 'components']
const SKIP_FILES = ['Avatar.tsx']
const SKIP_DIRS = ['node_modules', '.next', 'verifikim-vizual']

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir) } catch { return out }
  for (const e of entries) {
    const p = join(dir, e)
    let st
    try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) { if (!SKIP_DIRS.includes(e)) walk(p, out) }
    else if (e.endsWith('.tsx') && !SKIP_FILES.includes(e)) out.push(p)
  }
  return out
}

const files = ROOTS.flatMap(r => walk(r))
const RE = /fontSize:\s*(\d+(?:\.\d+)?)(?=[\s,}\)\];])/g
let totalHits = 0, totalFiles = 0
const perFile = []

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  let hits = 0
  const next = src.replace(RE, (m, num) => {
    const n = parseFloat(num)
    if (n < 15) { hits++; return "fontSize: 'var(--fs-dysheme)'" }
    return m
  })
  if (hits > 0) {
    totalHits += hits; totalFiles++
    perFile.push(`${hits}\t${f}`)
    if (APPLY) writeFileSync(f, next)
  }
}

perFile.sort((a, b) => parseInt(b) - parseInt(a))
console.log(perFile.join('\n'))
console.log(`\n${APPLY ? 'APLIKUAR' : 'DRY-RUN'}: ${totalHits} zëvendësime në ${totalFiles} skedarë (fontSize<15 → var(--fs-dysheme)). Avatar.tsx i përjashtuar.`)

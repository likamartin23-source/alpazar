#!/usr/bin/env node
// KODMOD U-00b: `font-size:<15px` te CSS/styled-jsx (dhe .css) → `var(--fs-dysheme)`.
// Plotëson Fazën 0: kodmodi i parë preku vetëm stilet JSX inline (`fontSize:N`);
// këto janë deklaratat CSS `font-size:Npx` brenda `<style>`-ve dhe skedarëve .css.
// Mekanik, i kthyeshëm. Prek VETËM vlera literale px <15; token/≥15 s'preken.
// Përdorim: node scripts/kodmod-dysheme-css.mjs [--apply]
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const APPLY = process.argv.includes('--apply')
const ROOTS = ['app', 'lib', 'components']
const SKIP_DIRS = ['node_modules', '.next', 'verifikim-vizual']
const EXT = ['.tsx', '.css']

function walk(dir, out = []) {
  let entries; try { entries = readdirSync(dir) } catch { return out }
  for (const e of entries) {
    const p = join(dir, e); let st; try { st = statSync(p) } catch { continue }
    if (st.isDirectory()) { if (!SKIP_DIRS.includes(e)) walk(p, out) }
    else if (EXT.some(x => e.endsWith(x))) out.push(p)
  }
  return out
}

const RE = /font-size:\s*(\d+(?:\.\d+)?)px/g
let total = 0, filesN = 0
const per = []
for (const f of ROOTS.flatMap(r => walk(r))) {
  const src = readFileSync(f, 'utf8'); let hits = 0
  const next = src.replace(RE, (m, num) => {
    if (parseFloat(num) < 15) { hits++; return 'font-size:var(--fs-dysheme)' }
    return m
  })
  if (hits > 0) { total += hits; filesN++; per.push(`${hits}\t${f}`); if (APPLY) writeFileSync(f, next) }
}
per.sort((a, b) => parseInt(b) - parseInt(a))
console.log(per.join('\n'))
console.log(`\n${APPLY ? 'APLIKUAR' : 'DRY-RUN'}: ${total} zëvendësime në ${filesN} skedarë (font-size<15px → var(--fs-dysheme)).`)

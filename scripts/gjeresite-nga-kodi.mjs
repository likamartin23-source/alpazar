#!/usr/bin/env node
/**
 * GJERESIA E KONTEJNERIT NGA KODI — per faqet qe s'i mat dot live (pas hyrjes).
 *
 * KUJDES: nje version i mepareshem i ketij mendimi mori `min(cdo max-width)` dhe
 * ngaterroi kufirin e nje AVATARI me kufirin e FAQES. Ketu merret VETEM klasa e
 * kontejnerit kryesor (.wrap ose e ngjashme) dhe zgjidhen media-query per 1920px.
 * Metoda nuk besohet: fillimisht kalibrohet kunder faqeve te matura live sot.
 */
import { readFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const faqet = execSync('find app -name "page.tsx"', { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean).sort()

// max-width qe vlen ne 1920px: rregulli baze, i mbishkruar nga media-query qe kapin 1920
function efektive(tekst, klasa) {
  const esc = klasa.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let vlera = null
  const baze = new RegExp('(^|[^@\\w])\\.' + esc + '\\s*\\{[^}]*?max-width\\s*:\\s*([^;}]+)', 'g')
  let m
  while ((m = baze.exec(tekst))) vlera = m[2].trim()
  // CSS-ja ketu shkruhet ne nje rresht: @media(min-width:1024px){.wrap{...}}
  // Prandaj trupi i media-se gjendet me numerim kllapash, jo me rresht te ri.
  const med = /@media\s*\(min-width:\s*(\d+)px\)\s*\{/g
  const gjetje = []
  while ((m = med.exec(tekst))) {
    const kufi = Number(m[1])
    let thellesi = 1, i = m.index + m[0].length
    const nis = i
    while (i < tekst.length && thellesi > 0) {
      if (tekst[i] === '{') thellesi++
      else if (tekst[i] === '}') thellesi--
      i++
    }
    if (kufi > 1920) continue
    const trupi = tekst.slice(nis, i - 1)
    const brenda = new RegExp('\\.' + esc + '\\s*\\{[^}]*?max-width\\s*:\\s*([^;}]+)')
    const g = brenda.exec(trupi)
    if (g) gjetje.push([kufi, g[1].trim()])
  }
  gjetje.sort((a, b) => a[0] - b[0])
  for (const [, v] of gjetje) vlera = v
  return vlera
}

// Kontejneri i vertete shpesh rri te komponenti fqinj *Client.tsx, jo te page.tsx.
// Versioni i pare lexonte vetem page.tsx dhe gjysma e faqeve dilnin "pa kufi".
import { readdirSync } from 'node:fs'
const fqinjet = (skedar) => {
  const dir = skedar.replace(/\/page\.tsx$/, '')
  try {
    return readdirSync(dir).filter((x) => x.endsWith('.tsx') && x !== 'page.tsx')
      .map((x) => readFileSync(dir + '/' + x, 'utf8')).join('\n')
  } catch { return '' }
}

const rezultat = []
for (const skedar of faqet) {
  const t = readFileSync(skedar, 'utf8') + '\n' + fqinjet(skedar)
  const rruga = skedar.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/'
  const kandidatet = [...new Set([...t.matchAll(/\.([a-zA-Z][-a-zA-Z0-9_]*)\s*\{[^}]*max-width/g)].map((x) => x[1]))]
  const kryesore = kandidatet.find((k) => /^(wrap|shell|page|kontejner|container)$/.test(k))
    || kandidatet.find((k) => /wrap|shell|container/.test(k))
  rezultat.push({
    rruga,
    klasa: kryesore || '—',
    maxWidth: kryesore ? efektive(t, kryesore) : null,
    teGjitha: kandidatet.length,
  })
}

console.log('GJERESIA E KONTEJNERIT NE 1920px, SIPAS KODIT\n')
console.log('  RRUGA'.padEnd(32) + 'KLASA'.padEnd(14) + 'MAX-WIDTH @1920')
for (const r of rezultat) {
  console.log('  ' + r.rruga.padEnd(30) + String(r.klasa).padEnd(14) + (r.maxWidth || '(pa kufi te deklaruar)'))
}

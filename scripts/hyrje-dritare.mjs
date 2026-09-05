#!/usr/bin/env node
/**
 * DRITARJA E HYRJES — hap Chrome-in e vertete me profilin e auditit dhe pret qe pronari
 * te hyje me Google. Del vetem kur sesioni eshte VERTET aty (biskota + faqe e vertete).
 *
 * PSE keshtu:
 *  · Shtesa Claude in Chrome nuk lidhet ne kete projekt (provuar disa here).
 *  · Chromium i Playwright-it refuzohet nga Google → duhet `channel: 'chrome'`.
 *  · Porta e moshes + banderola e biskotave MBULOJNE butonin "Identifikohu me Google";
 *    prandaj i heqim me localStorage PARA se te ngarkohet faqja.
 *  · Cache-i i profilit mban here-here nje 404 te ruajtur per chunk-et e Next.js →
 *    faqja nuk hidratohet dhe matjet dalin false. Prandaj e pastrojme para nisjes.
 */
import { chromium } from 'playwright'
import { rmSync, existsSync } from 'node:fs'

const PROFIL = process.env.PROFIL || '.ops/.profil-chrome'
const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const PRIT_MIN = Number(process.env.PRIT_MIN || 20)

// 1) pastro VETEM cache-in, jo biskotat/preferencat
for (const d of ['Cache', 'Code Cache', 'GPUCache', 'Service Worker']) {
  const rr = `${PROFIL}/Default/${d}`
  if (existsSync(rr)) { try { rmSync(rr, { recursive: true, force: true }); console.log('u pastrua ' + rr) } catch (e) { console.log('s\'u pastrua ' + rr + ': ' + e.message) } }
}

const k = await chromium.launchPersistentContext(PROFIL, {
  headless: false, channel: 'chrome',
  viewport: { width: 1280, height: 900 }, locale: 'sq-AL',
  args: ['--window-position=80,60'],
})
await k.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})

const f = k.pages()[0] || (await k.newPage())
await f.goto(BAZA + '/auth/login', { waitUntil: 'domcontentloaded', timeout: 45000 })
console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║  DRITARJA ESHTE HAPUR — hyr me Google ne te                  ║')
console.log('║  Porta e moshes dhe banderola e biskotave jane hequr paraprakisht ║')
console.log('╚══════════════════════════════════════════════════════════════╝')
console.log('pres deri ' + PRIT_MIN + ' minuta...\n')

const fund = Date.now() + PRIT_MIN * 60000
let hyri = false
while (Date.now() < fund) {
  await new Promise((r) => setTimeout(r, 5000))
  const b = await k.cookies()
  const auth = b.find((c) => /^sb-.*-auth-token/.test(c.name) && c.value && c.value.length > 40)
  if (!auth) continue
  // biskota ekziston — provoje me nje faqe te vertete pas hyrjes
  const p = await k.newPage()
  try {
    await p.goto(BAZA + '/profile', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await p.waitForTimeout(6000)
    const rr = await p.evaluate(() => ({ u: location.pathname, h1: (document.querySelector('h1') || {}).innerText || '' }))
    if (!/\/auth\/login/.test(rr.u) && !/Autentikimi/i.test(rr.h1)) {
      console.log('SESIONI ESHTE AKTIV → /profile u hap si faqe e vertete ("' + rr.h1.slice(0, 40) + '")')
      hyri = true
    } else {
      console.log('biskota u shfaq por /profile ende ridrejton — pres edhe pak')
    }
  } catch (e) { console.log('kontroll i deshtuar: ' + e.message.slice(0, 60)) }
  await p.close()
  if (hyri) break
}

await k.close()
if (!hyri) { console.log('\nNUK u konfirmua hyrja brenda ' + PRIT_MIN + ' minutash.'); process.exit(2) }
console.log('\nDritarja u mbyll. Profili e mban sesionin — matjet vazhdojne pa koke.')

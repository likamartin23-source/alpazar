#!/usr/bin/env node
/**
 * AUTOPSIA E HAPËSIRËS — sa e mbush faqja ekranin, dhe a ka shtresë bazë nën të.
 *
 * URDHËR PRONARI (§17): 100% e platformës në ekran. Nëse faqja nuk mund të zmadhohet,
 * në sfond kalon 100% një guaskë e pastër ("tavolinë") dhe faqja mbivendoset mbi të,
 * proporcionalisht. Asnjë ekran nuk mbetet bosh.
 *
 * Ky instrument mat VETËM atë — i lehtë, që të kalojë të gjitha rrugët me pak RAM.
 */
import { chromium } from 'playwright'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const L = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const B = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

const TE_GJITHA = [
  '/', '/admin', '/asistent', '/billing', '/biznese', `/biznese/${B}`, `/biznese/${B}?public=1`,
  `/biznese/${B}/analytics`, `/biznese/${B}/edit`, '/cookies', '/favorites', '/kategori',
  '/kategori/automjete', '/kategori/automjete/tirane', '/kontakt', '/kushtet', `/listing/${L}`,
  `/listing/${L}/edit`, '/listing/new', '/messages', '/notifications', '/oferta', '/premium',
  '/privatesia', '/profile', '/profile/analytics', '/referral', '/rreth-nesh', '/saved-searches',
  '/search', '/search/results?q=makina', '/siguria', '/takedown', '/te-dhenat-mia', `/u/${UID}`,
]
const RRUGET = process.env.RRUGET ? process.env.RRUGET.split(',') : TE_GJITHA
const GJER = Number(process.env.GJER || 1920)

function mat() {
  const D = document, W = window
  const vw = W.innerWidth
  const st = (e) => W.getComputedStyle(e)
  const duket = (e) => {
    const r = e.getBoundingClientRect(), s = st(e)
    return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05
  }

  // 1. Ku bie vërtet boja: kufijtë e glifeve
  const m = D.querySelector('main') || D.body
  const ec = D.createTreeWalker(m, NodeFilter.SHOW_TEXT)
  let gl = Infinity, gr = -Infinity, n
  while ((n = ec.nextNode())) {
    const t = (n.textContent || '').trim(); const p = n.parentElement
    if (t.length < 2 || !p || !duket(p) || p.closest('script,style,noscript')) continue
    const rg = D.createRange(); rg.selectNodeContents(n)
    const b = rg.getBoundingClientRect()
    if (b.width < 2 || b.height < 2 || b.top > 6000) continue
    gl = Math.min(gl, b.left); gr = Math.max(gr, b.right)
  }
  if (gl === Infinity) { gl = 0; gr = 0 }

  // 2. A ekziston SHTRESË BAZË: element me sfond jo-transparent që mbulon ≥98% të gjerësisë
  let baza = null
  for (const e of D.querySelectorAll('body, body *')) {
    if (!duket(e)) continue
    const r = e.getBoundingClientRect()
    if (r.width < vw * 0.98) continue
    const s = st(e)
    const bg = s.backgroundColor
    const kaSfond = bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent'
    const kaImazh = s.backgroundImage && s.backgroundImage !== 'none'
    if (!kaSfond && !kaImazh) continue
    baza = { emri: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(/\s+/)[0] : ''), bg, gj: Math.round(r.width), la: Math.round(r.height) }
    break
  }

  // 3. Paneli: blloku më i gjerë që mban tekstin
  let panel = null
  for (const e of D.querySelectorAll('main > *, main > * > *')) {
    if (!duket(e)) continue
    const r = e.getBoundingClientRect()
    if (r.width > (panel ? panel.gj : 0) && r.height > 80) panel = { gj: Math.round(r.width), x: Math.round(r.left), emri: e.tagName.toLowerCase() + (e.className ? '.' + String(e.className).split(/\s+/)[0] : '') }
  }

  return {
    vw, glifetMajtas: Math.round(gl), glifetDjathtas: Math.round(gr),
    gjeresiaTekstit: Math.round(gr - gl),
    marzhiMajtas: Math.round(gl), marzhiDjathtas: Math.round(vw - gr),
    shfrytezimi: Math.round(((gr - gl) / vw) * 1000) / 10,
    baza, panel,
    rruga: location.pathname + location.search,
    guaske: location.pathname.indexOf('/auth/login') === 0,
  }
}

mkdirSync('.ops/autopsi', { recursive: true })
const DALJA = process.env.DALJA || `.ops/autopsi/hapesira-${GJER}.json`
const rez = { baza: BAZA, gjeresia: GJER, kur: new Date().toISOString(), faqet: {} }

const k = await chromium.launchPersistentContext(process.env.PROFIL || '.ops/.profil-chrome', {
  headless: true, channel: process.env.KANAL || 'chrome',
  viewport: { width: GJER, height: 1000 }, locale: 'sq-AL',
})
await k.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1'); localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})

for (const u of RRUGET) {
  const f = await k.newPage()
  try {
    await f.goto(BAZA + u, { waitUntil: 'domcontentloaded', timeout: 45000 })
    let para = -1, njesoj = 0
    for (let i = 0; i < 14 && njesoj < 3; i++) {
      await f.waitForTimeout(500)
      const t = await f.evaluate(() => (document.body.innerText || '').length)
      njesoj = t === para ? njesoj + 1 : 0; para = t
    }
    const r = await f.evaluate(mat)
    rez.faqet[u] = r
    const flag = r.shfrytezimi < 85 ? (r.shfrytezimi < 60 ? ' ⚠⚠ ISHULL' : ' ⚠ i ngushtë') : ' ✓'
    console.log(
      u.slice(0, 40).padEnd(41) + 'shfryt=' + String(r.shfrytezimi).padStart(5) + '%' +
      '  tekst=' + String(r.gjeresiaTekstit).padStart(4) + 'px' +
      '  marzhe ' + String(r.marzhiMajtas).padStart(4) + '/' + String(r.marzhiDjathtas).padStart(4) +
      '  bazë=' + (r.baza ? 'po' : 'JO') + flag + (r.guaske ? ' [GUASKË]' : '')
    )
  } catch (e) {
    console.log(u.slice(0, 40).padEnd(41) + 'GABIM ' + String(e.message).slice(0, 40))
  }
  await f.close()
}
await k.close()

try {
  const vjetra = JSON.parse(readFileSync(DALJA, 'utf8'))
  for (const [u, v] of Object.entries(vjetra.faqet || {})) if (!rez.faqet[u]) rez.faqet[u] = v
} catch {}
writeFileSync(DALJA, JSON.stringify(rez, null, 1))
console.log('\n→ ' + DALJA)

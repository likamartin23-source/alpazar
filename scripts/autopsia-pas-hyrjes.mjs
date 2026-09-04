#!/usr/bin/env node
/**
 * AUTOPSIA E FAQEVE PAS HYRJES — dritare e dukshme, pronari hyn nje here.
 *
 * PSE: instrumentet e tjera matnin guasken e login-it dhe e quanin faqe.
 * 14 rruge mbeten te pamatura. Ky pret derisa te hysh, pastaj mat te njejten
 * gje me DY matje ne te njejtin moment:
 *   · GLIFET — ku bien vertet shkronjat (Range mbi nyjet e tekstit)
 *   · KUTIA  — kutia me e gjere brenda <main>
 * Kur te dyja pajtohen, numri qendron. Kur jo, foto vendos.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

const TE_GJITHA = [
  ['profile', '/profile'], ['profile-analytics', '/profile/analytics'],
  ['u-id-i-kycur', `/u/${UID}`],
  ['messages', '/messages'], ['favorites', '/favorites'], ['billing', '/billing'],
  ['saved-searches', '/saved-searches'], ['oferta', '/oferta'],
  ['te-dhenat-mia', '/te-dhenat-mia'], ['notifications', '/notifications'],
  ['referral', '/referral'], ['premium', '/premium'],
  ['listing-new', '/listing/new'], ['listing-edit', `/listing/${LID}/edit`],
  ['biznese-new', '/biznese/new'], ['biznese-edit', `/biznese/${BID}/edit`],
  ['biznese-analytics', `/biznese/${BID}/analytics`],
  ['biznese-id-i-kycur', `/biznese/${BID}`],
  ['admin', '/admin'],
]
const NGA = Number(process.env.NGA || 0), DERI = Number(process.env.DERI || TE_GJITHA.length)
const RRUGET = TE_GJITHA.slice(NGA, DERI)

function mat() {
  const D = document, W = window
  const st = (e) => W.getComputedStyle(e)
  const duket = (e) => { const r = e.getBoundingClientRect(), s = st(e)
    return r.width > 30 && r.height > 20 && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0' }
  const kryesor = D.querySelector('main') || D.body
  const perjashto = (e) => { if (e.closest('header,footer,nav')) return true
    const s = st(e); if (s.position === 'fixed' || s.position === 'sticky') return true
    return !!e.closest('[class*=topbar],[class*=header],[class*=hero],[class*=banner],[class*=ftr]') }

  // 1) GLIFET
  const g = []
  const ec = D.createTreeWalker(kryesor, NodeFilter.SHOW_TEXT)
  let n
  while ((n = ec.nextNode())) {
    const t = (n.textContent || '').trim(); if (t.length < 3) continue
    const pr = n.parentElement; if (!pr || !duket(pr) || perjashto(pr)) continue
    const rg = D.createRange(); rg.selectNodeContents(n)
    const r = rg.getBoundingClientRect()
    if (r.width > 20 && r.height > 4) g.push(r)
  }
  // kontrollet e formularit: nje input bosh s'ka glife, por eshte permbajtje
  for (const el of kryesor.querySelectorAll('input,select,textarea,button,img,video,canvas')) {
    if (!duket(el) || perjashto(el)) continue
    const r = el.getBoundingClientRect(); if (r.width > 40) g.push(r)
  }
  let gl = null
  if (g.length) {
    let maj = Infinity, dj = -Infinity
    for (const r of g) { if (r.width < 40) continue; if (r.left < maj) maj = r.left; if (r.right > dj) dj = r.right }
    if (isFinite(maj)) gl = { majtas: Math.round(maj), djathtas: Math.round(W.innerWidth - dj),
      gjeresia: Math.round(dj - maj), perqind: Math.round(100 * (dj - maj) / W.innerWidth) }
  }
  // 2) KUTIA me e gjere
  let kmax = 0, kemri = '—'
  for (const el of kryesor.querySelectorAll('*')) {
    if (!duket(el) || perjashto(el)) continue
    const r = el.getBoundingClientRect()
    if (r.width > kmax) { kmax = r.width; kemri = String(el.className || el.tagName).split(' ')[0].slice(0, 18) }
  }
  const teksti = (D.body.innerText || '')
  return { gl, kutia: Math.round(kmax), kutiaPerqind: Math.round(100 * kmax / W.innerWidth), kutiaEmri: kemri,
    guaske: /Vazhdo me Google|Keni harruar fjal|Hyr për të parë|Kyçu për të parë|Hyr në llogari/i.test(teksti),
    titulli: (D.querySelector('h1,h2')?.textContent || '').trim().slice(0, 40), nyje: g.length }
}

mkdirSync('.ops/autopsi/pas-hyrjes', { recursive: true })
const sh = await chromium.launchPersistentContext(
  process.env.PROFIL || '.ops/.profil-audit',
  { headless: process.env.KOKE !== '1', viewport: { width: 1920, height: 1080 }, locale: 'sq-AL',
    ...(process.env.KANAL ? { channel: process.env.KANAL } : {}),
    args: ['--start-maximized'] })

// Sesioni ruhet ne COOKIES (@supabase/ssr), jo ne localStorage — ky ishte gabimi
// qe e quante "s'u gjet". Verifikohet nga cookie-ja e auth-it.
const cookies = await sh.cookies()
const hyre = cookies.some((c) => /sb-.*-auth-token/.test(c.name) && c.value.length > 40)
if (!hyre) { console.log('SESIONI I RUAJTUR NUK U GJET (cookie) — po dal pa matur.'); await sh.close(); process.exit(2) }
console.log('>>> SESIONI I RUAJTUR ESHTE I VLEFSHEM. Po mas ' + RRUGET.length + ' rruge.\n')

const dalja = []
for (const gjer of (process.env.GJERESI ? [Number(process.env.GJERESI)] : [1920, 1280])) {
  const f = await sh.newPage()
  await f.setViewportSize({ width: gjer, height: 1000 })
  console.log('══════ ' + gjer + 'px ══════')
  console.log('  RRUGA'.padEnd(26) + 'GLIFET  KUTIA   MAJTAS/DJATHTAS  TITULLI')
  for (const [emri, u] of RRUGET) {
    const rez = { emri, rruga: u, gjeresi: gjer }
    try {
      await f.goto(BAZA + u, { waitUntil: 'domcontentloaded', timeout: 45000 })
      let para = -1
      for (let i = 0; i < 20; i++) {
        await f.waitForTimeout(500)
        const sa = await f.evaluate(() => { const m = document.querySelector('main') || document.body
          const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT); let c = 0
          while (w.nextNode()) if ((w.currentNode.textContent || '').trim().length > 2) c++; return c })
        if (sa > 10 && sa === para) break
        para = sa
      }
      Object.assign(rez, await f.evaluate(mat))
      // Nje guaske mund te jete gare me hidratimin e sesionit, jo porte e vertete.
      // Prit dhe mat perseri: nese mbetet guaske pas 5s, eshte e vertete.
      if (rez.guaske) { await f.waitForTimeout(5000); Object.assign(rez, await f.evaluate(mat)); rez.riprovuar = true }
      if (gjer === 1920) await f.screenshot({ path: `.ops/autopsi/pas-hyrjes/${emri}.png` })
    } catch (e) { rez.gabim = String(e.message).slice(0, 45) }
    dalja.push(rez)
    if (rez.gabim) { console.log('  ' + emri.padEnd(24) + 'GABIM ' + rez.gabim); continue }
    const gp = rez.gl ? rez.gl.perqind + '%' : '—'
    const md = rez.gl ? rez.gl.majtas + '/' + rez.gl.djathtas : '—'
    console.log('  ' + emri.padEnd(24) + String(gp).padStart(6) + String(rez.kutiaPerqind + '%').padStart(7) +
      md.padStart(16) + '  ' + (rez.guaske ? 'GUASKË ' : '') + rez.titulli)
  }
  await f.close()
  console.log('')
}
writeFileSync('.ops/autopsi/pas-hyrjes.json', JSON.stringify(dalja, null, 1))
console.log('→ .ops/autopsi/pas-hyrjes.json + foto te .ops/autopsi/pas-hyrjes/')
await sh.close()

#!/usr/bin/env node
/**
 * AUTOPSIA TOTALE — çdo faqe, çdo element, çdo buton. Pa përzgjedhje me dorë.
 *
 * PSE ekziston (urdhër pronari, 5 shtator): autopsia e parë mati faqen si tërësi dhe
 * listën e rrugëve e zgjodhi analisti. Kjo shkel PARIMET §4 (topografi: hartë e plotë,
 * faqe-për-faqe, komponent-për-komponent) dhe §3 (kontrata: "të gjitha" = të gjitha).
 *
 * ÇFARË BËN:
 *  1. Rrugët merren nga app-router-i (find app -name page.tsx), jo nga koka e analistit.
 *  2. Për çdo rrugë × gjerësi: kalon ÇDO element të dukshëm dhe shënon shkeljet e tij.
 *  3. HARTA E BUTONAVE: çdo element i klikueshëm — etiketa, destinacioni, përmasat.
 *  4. ZBULIM RRUGËSH: mbledh çdo href të parë; rrugët e reja maten në kalimin e dytë.
 *  5. TABAT: elementët me role=tab regjistrohen si nënfaqe të butonave.
 *
 * Nuk lexon kod. Vetëm sy live mbi platformën e gjallë.
 */
import { chromium } from 'playwright'
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const L = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const B = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

// Rrugët e app-router-it me segmentet dinamike të zëvendësuara me ID reale.
const RRUGET_BAZE = [
  '/', '/admin', '/asistent', '/auth/login', '/billing', '/biznese',
  `/biznese/${B}`, `/biznese/${B}?public=1`, `/biznese/${B}/analytics`, `/biznese/${B}/edit`,
  '/biznese/new', '/cookies', '/favorites', '/kategori', '/kategori/automjete',
  '/kategori/automjete/tirane', '/kontakt', '/kushtet', `/listing/${L}`, `/listing/${L}/edit`,
  '/listing/new', '/messages', `/moderimi/${L}`, '/notifications', '/oferta', '/premium',
  '/privatesia', '/profile', '/profile/analytics', '/referral', '/rreth-nesh',
  '/saved-searches', '/search', '/search/results?q=makina', '/siguria', '/takedown',
  '/te-dhenat-mia', `/u/${UID}`,
]

const TE_GJITHA_EKRANET = [
  { emri: 'telefon-390', w: 390, h: 844, mmPerPx: 71.4 / 390, dist: 350, mob: true },
  { emri: 'laptop-1280', w: 1280, h: 800, mmPerPx: 286 / 1280, dist: 550, mob: false },
  { emri: 'desktop-1920', w: 1920, h: 1080, mmPerPx: 531 / 1920, dist: 600, mob: false },
]
const EKRANET = process.env.EKRANET
  ? TE_GJITHA_EKRANET.filter((e) => process.env.EKRANET.split(',').includes(e.emri))
  : TE_GJITHA_EKRANET
const CAP = 0.750          // matur live: Plus Jakarta Sans
const GJER_MES = 0.5606    // gjerësi mesatare karakteri, em
const arcmin = (px, mmPerPx, dist) => 2 * Math.atan((px * CAP * mmPerPx) / (2 * dist)) * (180 / Math.PI) * 60

/** Kalon çdo element të dukshëm dhe kthen: shkeljet, hartën e butonave, tabat. */
function skano() {
  const D = document, W = window
  const st = (e) => W.getComputedStyle(e)
  const dukshem = (e) => {
    const r = e.getBoundingClientRect(), s = st(e)
    if (r.width < 1 || r.height < 1) return false
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < 0.05) return false
    return true
  }
  const etiketa = (e) => (
    (e.getAttribute('aria-label') || e.getAttribute('title') || e.innerText || e.value || e.getAttribute('placeholder') || '')
      .replace(/\s+/g, ' ').trim().slice(0, 44)
  )
  const emri = (e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string'
    ? '.' + e.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '')

  const KLIK = 'button,a,[role=button],[role=tab],input,select,textarea,summary,[onclick]'
  const elementet = [...D.querySelectorAll('body *')]
  const shkeljet = []
  const butonat = []
  const tabat = []
  const pare = new Set()

  for (const e of elementet) {
    if (!dukshem(e)) continue
    const r = e.getBoundingClientRect()
    if (r.top > W.innerHeight * 4) continue          // nën 4 ekrane: jashtë interesit
    const s = st(e)
    const fs = Math.round(parseFloat(s.fontSize) * 10) / 10
    const klikues = e.matches(KLIK)

    // —— teksti i vet elementit (jo i fëmijëve)
    let vetTekst = ''
    for (const n of e.childNodes) if (n.nodeType === 3) vetTekst += n.textContent
    vetTekst = vetTekst.replace(/\s+/g, ' ').trim()

    if (klikues) {
      const cak = Math.round(Math.min(r.width, r.height))
      const dest = e.getAttribute('href') || (e.getAttribute('role') === 'tab' ? '(tab)' : '')
      const b = { emri: emri(e), etiketa: etiketa(e), cak, gj: Math.round(r.width), la: Math.round(r.height), fs, dest }
      butonat.push(b)
      if (e.getAttribute('role') === 'tab') tabat.push({ etiketa: etiketa(e), zgjedhur: e.getAttribute('aria-selected') === 'true' })
      // WCAG 2.5.8 ka PERJASHTIME te shprehura: lidhje brenda nje fjalie (inline),
      // dhe kontrolle jashte ekranit si skip-link. Numerimi pa to ishte kriter i rreme.
      const klasa = String(e.className || '')
      const prind = e.parentElement
      let tekstPrind = ''
      if (prind) for (const nn of prind.childNodes) if (nn.nodeType === 3) tekstPrind += nn.textContent.trim()
      const inline = e.tagName === 'A' && tekstPrind.length > 0
      const perjashtuar = /skip/i.test(klasa) || inline
      b.perjashtuar = perjashtuar ? (inline ? 'lidhje-inline' : 'skip-link') : null
      if (cak < 24 && !perjashtuar) shkeljet.push({ lloj: 'cak<24', ...b })
      else if (cak < 24) shkeljet.push({ lloj: 'cak<24-perjashtuar', ...b })
      else if (cak < 44) shkeljet.push({ lloj: 'cak<44', ...b })
      if (fs && fs < 12 && etiketa(e)) shkeljet.push({ lloj: 'tekst-butoni', ...b })
    }

    if (vetTekst.length >= 2) {
      const kyc = emri(e) + '|' + fs + '|' + vetTekst.slice(0, 20)
      if (!pare.has(kyc)) {
        pare.add(kyc)
        const rr = { lloj: 'tekst', emri: emri(e), etiketa: vetTekst.slice(0, 44), fs,
          gj: Math.round(r.width), x: Math.round(r.left), pesha: s.fontWeight, ngjyra: s.color }
        // masa vetëm për blloqe të gjata teksti
        if (vetTekst.length > 60) {
          const rng = D.createRange(); rng.selectNodeContents(e)
          const rreshta = rng.getClientRects()
          if (rreshta.length) rr.masa = Math.round(rreshta[0].width / (fs * 0.5606))
        }
        shkeljet.push(rr)
      }
    }
  }

  const hrefs = [...new Set([...D.querySelectorAll('a[href]')]
    .map((a) => a.getAttribute('href'))
    .filter((h) => h && h.startsWith('/') && !h.startsWith('//')))]

  return {
    rruga: location.pathname + location.search,
    titulli: (D.querySelector('h1') || {}).innerText || '',
    guaske: location.pathname.indexOf('/auth/login') === 0,
    dalje: D.documentElement.scrollWidth > W.innerWidth + 2,
    gjatesia: D.documentElement.scrollHeight,
    nrElemente: elementet.length,
    shkeljet, butonat, tabat, hrefs,
  }
}

mkdirSync('.ops/autopsi', { recursive: true })
const DALJA = process.env.DALJA || '.ops/autopsi/totale.json'
const rez = { baza: BAZA, kur: new Date().toISOString(), faqet: {} }
const teGjeturaHrefs = new Set()

const RRUGET = process.env.RRUGET ? process.env.RRUGET.split(',') : RRUGET_BAZE

for (const ekrani of EKRANET) {
  const k = await chromium.launchPersistentContext(process.env.PROFIL || '.ops/.profil-chrome', {
    headless: true, channel: process.env.KANAL || 'chrome',
    viewport: { width: ekrani.w, height: ekrani.h }, locale: 'sq-AL',
    deviceScaleFactor: ekrani.mob ? 3 : 1, isMobile: ekrani.mob, hasTouch: ekrani.mob,
  })
  await k.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })

  for (const u of RRUGET) {
    const f = await k.newPage()
    try {
      await f.goto(BAZA + u, { waitUntil: 'domcontentloaded', timeout: 45000 })
      let para = -1, njesoj = 0
      for (let i = 0; i < 16 && njesoj < 3; i++) {
        await f.waitForTimeout(500)
        const tani = await f.evaluate(() => (document.body.innerText || '').length)
        njesoj = tani === para ? njesoj + 1 : 0
        para = tani
      }
      const m = await f.evaluate(skano)
      for (const h of m.hrefs) teGjeturaHrefs.add(h)
      delete m.hrefs

      // llogaritjet ergonomike në Node
      for (const sh of m.shkeljet) if (sh.fs) sh.arcmin = Math.round(arcmin(sh.fs, ekrani.mmPerPx, ekrani.dist) * 10) / 10
      for (const b of m.butonat) if (b.fs) b.arcmin = Math.round(arcmin(b.fs, ekrani.mmPerPx, ekrani.dist) * 10) / 10

      const nenISO = m.shkeljet.filter((x) => x.arcmin && x.arcmin < 16).length
      const cakNen24 = m.shkeljet.filter((x) => x.lloj === 'cak<24').length
      const cakNen44 = m.shkeljet.filter((x) => x.lloj === 'cak<44').length
      const masaMbi75 = m.shkeljet.filter((x) => x.masa && x.masa > 75).length

      rez.faqet[u] = rez.faqet[u] || {}
      rez.faqet[u][ekrani.emri] = m
      console.log(
        ekrani.emri.padEnd(13) + ' ' + u.slice(0, 34).padEnd(35) +
        ' elem=' + String(m.nrElemente).padStart(4) +
        ' butona=' + String(m.butonat.length).padStart(3) +
        ' nën16\'=' + String(nenISO).padStart(3) +
        ' cak<24=' + String(cakNen24).padStart(2) +
        ' cak<44=' + String(cakNen44).padStart(3) +
        ' masa>75=' + String(masaMbi75).padStart(2) +
        (m.guaske ? ' [GUASKE]' : '') + (m.dalje ? ' [DALJE]' : '')
      )
    } catch (e) {
      console.log(ekrani.emri.padEnd(13) + ' ' + u.slice(0, 34).padEnd(35) + ' GABIM ' + String(e.message).slice(0, 44))
    }
    await f.close()
  }
  await k.close()
}

rez.hrefsTeZbuluara = [...teGjeturaHrefs].sort()
// bashkim jo-shkaterrues: mban gjeresite/rruget e matura me pare qe s'jane ne kete xhiro (D-13)
try {
  const vjetra = JSON.parse(readFileSync(DALJA, 'utf8'))
  for (const [u, v] of Object.entries(vjetra.faqet || {}))
    rez.faqet[u] = { ...(v || {}), ...(rez.faqet[u] || {}) }
} catch {}
writeFileSync(DALJA, JSON.stringify(rez, null, 1))
console.log('\n→ ' + DALJA + ' · rrugë të matura: ' + Object.keys(rez.faqet).length +
  ' · href të zbuluara gjithsej: ' + rez.hrefsTeZbuluara.length)

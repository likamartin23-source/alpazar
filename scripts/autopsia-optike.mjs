#!/usr/bin/env node
/**
 * AUTOPSIA OPTIKE — matje shkencore e lexueshmerise dhe e shkallezimit, me sy live.
 *
 * PYETJA E PRONARIT: kur ekrani zmadhohet, a zmadhohen edhe shkronjat/butonat/kartat
 * ne menyre PROPORCIONALE, apo faqja shtrihet dhe permbajtja mbetet e vogel?
 *
 * NUK lexon kod. Hap faqen e gjalle ne disa gjeresi dhe mat:
 *  1. SHFRYTEZIMI — ku bien vertet glifet (Range mbi nyjet e tekstit) kundrejt ekranit.
 *  2. TIPOGRAFIA  — madhesia e shkronjes e peshuar me numrin e karaktereve.
 *  3. KENDI VIZUAL — shkronja ne HARQE MINUTE (arcmin): metrika qe lidh pikselet me syrin.
 *     ISO 9241-303: lartesia e x 20-22 arcmin e rehatshme, 16 arcmin minimumi.
 *  4. MASA (measure) — karaktere per rresht. Bringhurst: 45-75 optimale.
 *  5. CAKU I PREKJES — min(gjeresi,lartesi) e cdo elementi te klikueshem (WCAG 2.5.8).
 *  6. HIGJENA — sa madhesi shkronjash dhe sa rreze te ndryshme ne te njejtin ekran.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const L = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const B = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'

const TE_GJITHA = [
  ['ballina', '/'],
  ['kategori', '/kategori'],
  ['kategori-slug', '/kategori/automjete'],
  ['kategori-qytet', '/kategori/automjete/tirane'],
  ['search', '/search'],
  ['search-results', '/search/results?q=makina'],
  ['listing', '/listing/' + L],
  ['biznese-lista', '/biznese'],
  ['biznes-publik', '/biznese/' + B + '?public=1'],
  ['biznes-edit', '/biznese/' + B + '/edit'],
  ['premium', '/premium'],
  ['asistent', '/asistent'],
  ['kushtet', '/kushtet'],
  ['rreth-nesh', '/rreth-nesh'],
  ['profile', '/profile'],
  ['messages', '/messages'],
  ['notifications', '/notifications'],
  ['favorites', '/favorites'],
  ['oferta', '/oferta'],
  ['listing-new', '/listing/new'],
]
const RRUGET = process.env.RRUGET
  ? TE_GJITHA.filter((r) => process.env.RRUGET.split(',').includes(r[0]))
  : TE_GJITHA

// gjeresi CSS + mm/px reale te pajisjes tipike + distanca e shikimit (mm)
const TE_GJITHA_EKRANET = [
  { emri: 'telefon-390', w: 390, h: 844, mmPerPx: 71.4 / 390, dist: 350, mob: true },
  { emri: 'laptop-1280', w: 1280, h: 800, mmPerPx: 286 / 1280, dist: 550, mob: false },
  { emri: 'desktop-1920', w: 1920, h: 1080, mmPerPx: 531 / 1920, dist: 600, mob: false },
  { emri: 'i-madh-2560', w: 2560, h: 1440, mmPerPx: 597 / 2560, dist: 700, mob: false },
]
const EKRANET = process.env.EKRANET
  ? TE_GJITHA_EKRANET.filter((e) => process.env.EKRANET.split(',').includes(e.emri))
  : TE_GJITHA_EKRANET

const arcmin = (px, mmPerPx, dist) => 2 * Math.atan((px * mmPerPx) / (2 * dist)) * (180 / Math.PI) * 60

function mat() {
  const D = document, W = window
  const st = (e) => W.getComputedStyle(e)
  const dukshem = (e) => {
    const r = e.getBoundingClientRect(), s = st(e)
    return r.width > 1 && r.height > 1 && s.display !== 'none' && s.visibility !== 'hidden' && Number(s.opacity) > 0.05
  }
  const kryesor = D.querySelector('main') || D.body

  let majtas = Infinity, djathtas = -Infinity, nyje = 0
  const peshaFS = new Map()
  const rrezet = new Set()
  let masaMax = 0, masaRresht = null
  let lhSum = 0, lhN = 0
  const ec = D.createTreeWalker(kryesor, NodeFilter.SHOW_TEXT)
  let n
  while ((n = ec.nextNode())) {
    const t = (n.textContent || '').replace(/\s+/g, ' ').trim()
    const pr = n.parentElement
    if (!t || !pr || pr.closest('script,style,noscript')) continue
    if (!dukshem(pr)) continue
    const rng = D.createRange(); rng.selectNodeContents(n)
    const r = rng.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (r.bottom < 0 || r.top > W.innerHeight * 3) continue
    nyje++
    majtas = Math.min(majtas, r.left); djathtas = Math.max(djathtas, r.right)
    const s = st(pr)
    const fs = Math.round(parseFloat(s.fontSize) * 10) / 10
    peshaFS.set(fs, (peshaFS.get(fs) || 0) + t.length)
    const lh = parseFloat(s.lineHeight)
    if (lh > 0) { lhSum += lh / parseFloat(s.fontSize); lhN++ }
    const rreshta = rng.getClientRects()
    if (rreshta.length && t.length > 60 && rreshta[0].width > masaMax) {
      const gjKar = (r.width * rreshta.length) / Math.max(t.length, 1)
      masaMax = rreshta[0].width
      masaRresht = { ch: Math.round(rreshta[0].width / Math.max(gjKar, 1)), px: Math.round(rreshta[0].width), fs }
    }
  }
  const renditur = [...peshaFS.entries()].sort((a, b) => b[1] - a[1])
  const trupPx = renditur.length ? renditur[0][0] : null
  const titullPx = peshaFS.size ? Math.max(...peshaFS.keys()) : null

  const caqe = []
  for (const e of D.querySelectorAll('button,a,[role=button],input,select,textarea,summary')) {
    if (!dukshem(e)) continue
    const r = e.getBoundingClientRect()
    if (r.top > W.innerHeight * 2) continue
    caqe.push(Math.round(Math.min(r.width, r.height)))
  }
  caqe.sort((a, b) => a - b)
  const pct = (p) => (caqe.length ? caqe[Math.min(caqe.length - 1, Math.floor(caqe.length * p))] : null)

  for (const e of D.querySelectorAll('*')) {
    if (!dukshem(e)) continue
    const br = st(e).borderTopLeftRadius
    if (br && br !== '0px') rrezet.add(br)
  }

  return {
    nyjeTeksti: nyje,
    tekstiMajtas: Math.round(majtas === Infinity ? 0 : majtas),
    tekstiDjathtas: Math.round(djathtas === -Infinity ? 0 : djathtas),
    tekstiGjeresi: Math.round(djathtas - majtas),
    trupPx, titullPx,
    madhesiTeNdryshme: peshaFS.size,
    shperndarjaFS: renditur.slice(0, 8).map(([px, kar]) => ({ px, kar })),
    lhMesatar: lhN ? Math.round((lhSum / lhN) * 100) / 100 : null,
    masa: masaRresht,
    caqe: {
      n: caqe.length, min: caqe[0] ?? null, p10: pct(0.1), mesi: pct(0.5),
      nen24: caqe.filter((x) => x < 24).length, nen44: caqe.filter((x) => x < 44).length,
    },
    rrezeTeNdryshme: rrezet.size,
    gjatesiaFaqes: D.documentElement.scrollHeight,
    titulli: (D.querySelector('h1')?.innerText || '').slice(0, 60),
    guaske: /Vazhdo me Google|Keni harruar fjal|Identifikohu me Google|Kyçu për të|Hyr për të/i.test(D.body.innerText),
  }
}

mkdirSync('.ops/autopsi', { recursive: true })
const rezultati = { baza: BAZA, kur: new Date().toISOString(), faqet: {} }

for (const ekrani of EKRANET) {
  // PROFIL=pa  -> shfletues i paster (pa sesion, pa cache te ndotur). Ndryshe: profili i ruajtur.
  const njesia = { viewport: { width: ekrani.w, height: ekrani.h }, locale: 'sq-AL',
    deviceScaleFactor: ekrani.mob ? 3 : 1, isMobile: ekrani.mob, hasTouch: ekrani.mob }
  let shfletuesi = null
  const k = process.env.PROFIL === 'pa'
    ? await (shfletuesi = await chromium.launch()).newContext(njesia)
    : await chromium.launchPersistentContext(process.env.PROFIL || '.ops/.profil-chrome', {
        headless: true, channel: process.env.KANAL || 'chrome', ...njesia,
      })
  await k.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })

  for (const [emri, u] of RRUGET) {
    const f = await k.newPage()
    try {
      await f.goto(BAZA + u, { waitUntil: 'domcontentloaded', timeout: 45000 })
      let para = -1, njesoj = 0
      for (let i = 0; i < 20 && njesoj < 3; i++) {
        await f.waitForTimeout(500)
        const tani = await f.evaluate(() => (document.body.innerText || '').length)
        njesoj = tani === para ? njesoj + 1 : 0
        para = tani
      }
      const m = await f.evaluate(mat)
      m.trupArcmin = m.trupPx ? Math.round(arcmin(m.trupPx * 0.52, ekrani.mmPerPx, ekrani.dist) * 10) / 10 : null
      m.shfrytezimi = Math.round((m.tekstiGjeresi / ekrani.w) * 1000) / 10
      m.caqeMm = m.caqe.mesi ? Math.round(m.caqe.mesi * ekrani.mmPerPx * 10) / 10 : null
      rezultati.faqet[emri] = rezultati.faqet[emri] || {}
      rezultati.faqet[emri][ekrani.emri] = m
      console.log(
        ekrani.emri.padEnd(13) + ' ' + emri.padEnd(16) +
        ' trup=' + String(m.trupPx).padStart(5) + 'px ' + String(m.trupArcmin).padStart(5) + "'" +
        ' shfryt=' + String(m.shfrytezimi).padStart(5) + '%' +
        ' masa=' + String(m.masa ? m.masa.ch : '—').padStart(4) + 'ch' +
        ' caq50=' + String(m.caqe.mesi).padStart(3) + 'px' +
        ' nen24=' + String(m.caqe.nen24).padStart(2) +
        (m.guaske ? ' [GUASKE]' : '')
      )
    } catch (e) {
      console.log(ekrani.emri.padEnd(13) + ' ' + emri.padEnd(16) + ' GABIM ' + String(e.message).slice(0, 50))
    }
    await f.close()
  }
  await k.close()
  if (shfletuesi) await shfletuesi.close()
}
writeFileSync('.ops/autopsi/optika.json', JSON.stringify(rezultati, null, 1))
console.log('\n→ .ops/autopsi/optika.json')

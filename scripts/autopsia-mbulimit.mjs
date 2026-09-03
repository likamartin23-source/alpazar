#!/usr/bin/env node
/**
 * AUTOPSIA E MBULIMIT — a mbeti ndonjë faqe pa u parë, dhe a është "web" secila?
 *
 * DY PYETJE TË NDARA, që deri tani ishin ngatërruar:
 *
 *  A. MBULIMI — cila rrugë e `app/` nuk u matë kurrë? Përgjigja merret nga
 *     vetë skedarët, jo nga kujtesa ime: çdo `page.tsx` numërohet, edhe faqja
 *     404 dhe faqet e gabimit, që s'i kishte parë askush.
 *
 *  B. "100% WEB" — një faqe mund të kthejë 200 dhe prapë të mos jetë web:
 *     nëse në një ekran 1920px përmbajtja rri si kolonë telefoni në mes, ajo
 *     faqe u konvertua vetëm formalisht. Matet SHFRYTËZIMI: sa nga gjerësia e
 *     dobishme e ekranit e zë vërtet përmbajtja, në 1280 dhe 1920.
 *
 * Kufiri i gjykimit: nën ~55% shfrytëzim në 1920px me përmbajtje jo-tekstuale
 * është kolonë telefoni e zgjeruar, jo faqe web. Për tekst të gjatë (kushtet,
 * privatësia) një kolonë e ngushtë është E DREJTË — 45–75 karaktere për rresht.
 * Prandaj faqet e tekstit ndahen dhe gjykohen ndryshe.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

// Faqet ku nje kolone e ngushte eshte E DREJTE (tekst i gjate per lexim).
const TEKST = new Set(['/kushtet', '/privatesia', '/cookies', '/siguria', '/takedown', '/rreth-nesh'])

// Inventari merret nga skedaret, jo nga kujtesa.
const nga_kodi = execSync('find app -name "page.tsx"', { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean)
  .map((p) => p.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/')
  .sort()

const zevendeso = (r) => r
  .replace('[id]', r.startsWith('/listing') ? LID : r.startsWith('/biznese') ? BID : r.startsWith('/u') ? UID : '00000000-0000-0000-0000-000000000000')
  .replace('[slug]', 'automjete')
  .replace('[qytet]', 'tirane')

const RRUGET = nga_kodi.map((r) => ({ shabllon: r, url: zevendeso(r) }))
// Faqet e vecanta qe s'jane `page.tsx` — askush s'i kishte parë.
RRUGET.push({ shabllon: 'not-found (404)', url: '/kjo-rruge-nuk-ekziston-' + Date.now() })

console.log('Rrugë të gjetura te app/: ' + nga_kodi.length + ' (+1 faqe 404) = ' + RRUGET.length + '\n')

mkdirSync('.ops/autopsi', { recursive: true })
const shf = await chromium.launch()
const dalja = []

for (const gj of [390, 1280, 1920]) {
  const ktx = await shf.newContext({
    viewport: { width: gj, height: gj === 390 ? 844 : 1000 },
    isMobile: gj === 390, hasTouch: gj === 390, locale: 'sq-AL',
  })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })
  console.log('══════ ' + gj + 'px ══════')
  for (const { shabllon, url } of RRUGET) {
    const f = await ktx.newPage()
    const rez = { shabllon, url, gjeresi: gj }
    try {
      const p = await f.goto(BAZA + url, { waitUntil: 'domcontentloaded', timeout: 45000 })
      rez.status = p ? p.status() : 0
      await f.waitForTimeout(2200)
      rez.titull = (await f.title()).slice(0, 34)
      Object.assign(rez, await f.evaluate(() => {
        const D = document, W = window
        const m = D.querySelector('main') || D.body
        // gjeresia e VERTETE e permbajtjes: kutia me e gjere e femijeve me tekst/media
        const femijet = [...m.querySelectorAll('*')].filter((e) => {
          const r = e.getBoundingClientRect()
          const s = W.getComputedStyle(e)
          return r.width > 40 && r.height > 20 && s.display !== 'none' && s.visibility !== 'hidden'
        })
        const maxW = femijet.reduce((a, e) => Math.max(a, e.getBoundingClientRect().width), 0)
        const T = (D.body.innerText || '').trim()
        return {
          mainW: Math.round(m.getBoundingClientRect().width),
          permbajtjeW: Math.round(maxW),
          vw: W.innerWidth,
          tekst: T.length,
          bosh: T.length < 40,
          fillimi: T.slice(0, 46).replace(/\s+/g, ' '),
          dalje: Math.max(0, D.documentElement.scrollWidth - W.innerWidth),
          h1: D.querySelectorAll('h1').length,
        }
      }))
      rez.shfrytezim = Math.round(100 * rez.permbajtjeW / rez.vw)
      dalja.push(rez)
      const flamur = []
      if (rez.status >= 400) flamur.push('STATUS ' + rez.status)
      if (rez.bosh) flamur.push('BOSH')
      if (rez.dalje > 0) flamur.push('DALJE ' + rez.dalje)
      if (gj >= 1280 && !TEKST.has(shabllon) && rez.shfrytezim < 55 && !rez.bosh) flamur.push('KOLONË TELEFONI ' + rez.shfrytezim + '%')
      console.log('  ' + shabllon.padEnd(34) + String(rez.status).padStart(3) +
        ' · shfrytëzim ' + String(rez.shfrytezim).padStart(3) + '%' +
        ' · tekst ' + String(rez.tekst).padStart(5) +
        (flamur.length ? '   ⚠ ' + flamur.join(' | ') : ''))
    } catch (e) {
      rez.gabim = String(e.message).slice(0, 60)
      dalja.push(rez)
      console.log('  ' + shabllon.padEnd(34) + 'GABIM ' + rez.gabim)
    }
    await f.close()
  }
  await ktx.close()
  console.log('')
}
await shf.close()
writeFileSync('.ops/autopsi/mbulimi.json', JSON.stringify(dalja, null, 1))

const d19 = dalja.filter((r) => r.gjeresi === 1920 && !r.gabim)
const ngushta = d19.filter((r) => !TEKST.has(r.shabllon) && !r.bosh && r.shfrytezim < 55)
console.log('═══ PERFUNDIM ═══')
console.log('  Rrugë të matura : ' + nga_kodi.length + ' faqe app/ + faqja 404')
console.log('  Me status ≥400  : ' + [...new Set(dalja.filter((r) => r.status >= 400).map((r) => r.shabllon))].join(', ') || 'asnjë')
console.log('  Bosh            : ' + ([...new Set(dalja.filter((r) => r.bosh).map((r) => r.shabllon))].join(', ') || 'asnjë'))
console.log('  Dalje horizont. : ' + ([...new Set(dalja.filter((r) => r.dalje > 0).map((r) => r.shabllon + '@' + r.gjeresi))].join(', ') || 'asnjë'))
console.log('\n  @1920px — kolonë telefoni (<55% shfrytëzim, jo faqe teksti): ' + ngushta.length)
for (const r of ngushta.sort((a, b) => a.shfrytezim - b.shfrytezim)) {
  console.log('     ' + String(r.shfrytezim).padStart(3) + '%  ' + r.shabllon.padEnd(32) + r.permbajtjeW + 'px nga ' + r.vw + 'px')
}
console.log('\n→ .ops/autopsi/mbulimi.json')

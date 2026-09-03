#!/usr/bin/env node
/**
 * NGA VJEN PESHA?
 *
 * Lighthouse tregoi 7.18 MB ne /kategori/automjete dhe 5.60 MB te faqja e
 * biznesit, ndersa faqet e tjera rrine te 0.45 MB. Nje ndryshim 15-fish nuk
 * eshte "faqe me e rende" — eshte nje skedar i vetem qe s'duhej te ishte aty.
 *
 * Ky skedar rendit CDO kerkese sipas byte-ve te transferuar.
 */
import { chromium } from 'playwright'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const RRUGET = ['/kategori/automjete', '/biznese/' + BID, '/']

const shf = await chromium.launch()
for (const rruga of RRUGET) {
  const ktx = await shf.newContext({ viewport: { width: 390, height: 844 }, isMobile: true })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })
  const f = await ktx.newPage()
  const kerkesat = []
  f.on('response', async (p) => {
    try {
      const h = p.headers()
      const gjat = Number(h['content-length'] || 0)
      kerkesat.push({
        url: p.url(), lloji: h['content-type'] || '?', bajte: gjat,
        status: p.status(),
      })
    } catch {}
  })
  await f.goto(BAZA + rruga, { waitUntil: 'networkidle', timeout: 60000 })
  await f.waitForTimeout(2500)

  // Per ato pa content-length, mat vertet permasat e imazheve te ngarkuara.
  const imazhet = await f.evaluate(() => [...document.images].map((i) => ({
    src: i.currentSrc || i.src,
    natyrale: i.naturalWidth + 'x' + i.naturalHeight,
    shfaqur: Math.round(i.getBoundingClientRect().width) + 'x' + Math.round(i.getBoundingClientRect().height),
  })))

  const gjithsej = kerkesat.reduce((a, k) => a + k.bajte, 0)
  console.log('\n═══ ' + rruga + '  —  ' + (gjithsej / 1048576).toFixed(2) + ' MB ne ' + kerkesat.length + ' kerkesa')
  for (const k of kerkesat.sort((a, b) => b.bajte - a.bajte).slice(0, 8)) {
    if (k.bajte < 20000) break
    console.log('  ' + String((k.bajte / 1048576).toFixed(2)).padStart(6) + ' MB  ' +
      k.lloji.split(';')[0].padEnd(16) + k.url.replace(BAZA, '').slice(0, 78))
  }
  console.log('  — imazhet e ngarkuara —')
  for (const i of imazhet.slice(0, 6)) {
    console.log('     natyrale ' + i.natyrale.padEnd(12) + ' shfaqur ' + i.shfaqur.padEnd(10) +
      ' ' + i.src.replace(BAZA, '').slice(0, 62))
  }
  await ktx.close()
}
await shf.close()

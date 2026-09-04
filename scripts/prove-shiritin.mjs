import { chromium } from 'playwright'
const BAZA = 'https://alpazar.vercel.app'
const rruga = process.env.RRUGA || '/'
const sh = await chromium.launch()
const k = await sh.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'sq-AL' })
await k.addInitScript(() => { try {
  localStorage.setItem('alpazar_age_ok', '1'); localStorage.setItem('alpazar_onboarded', '1'); localStorage.setItem('alpazar_cookie_consent', 'accepted')
} catch {} })
const f = await k.newPage()
await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
await f.waitForTimeout(6000)
const r = await f.evaluate(() => {
  const sb = document.querySelector('.desk-sidebar')
  const b = document.body
  const sr = sb ? sb.getBoundingClientRect() : null
  const cs = sb ? getComputedStyle(sb) : null
  // gjej kontejnerin kryesor te permbajtjes dhe marzhin e vertete majtas
  const main = document.querySelector('main')
  const mr = main ? main.getBoundingClientRect() : null
  return {
    shiriti: sb ? { gjeresia: Math.round(sr.width), majtas: Math.round(sr.left), dukshem: cs.display + '/' + cs.position + ' vw=' + window.innerWidth } : 'MUNGON',
    bodyPadding: getComputedStyle(b).paddingLeft,
    desknav: b.getAttribute('data-desknav'),
    mainMajtas: mr ? Math.round(mr.left) : null,
    mainGjeresia: mr ? Math.round(mr.width) : null,
  }
})
console.log(rruga + ' →', JSON.stringify(r))
await f.screenshot({ path: `.ops/autopsi/shirit-${rruga.replace(/\W/g, '_') || 'home'}.png` })
await sh.close()

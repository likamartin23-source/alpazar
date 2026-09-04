import { chromium } from 'playwright'
const sh = await chromium.launch()
const k = await sh.newContext({ viewport: { width: 390, height: 844 }, locale: 'sq-AL', isMobile: true })
await k.addInitScript(() => { try {
  localStorage.setItem('alpazar_age_ok','1'); localStorage.setItem('alpazar_onboarded','1'); localStorage.setItem('alpazar_cookie_consent','accepted')
} catch {} })
const f = await k.newPage()
await f.goto('https://alpazar.vercel.app/', { waitUntil: 'domcontentloaded', timeout: 45000 })
await f.waitForTimeout(5000)
const r = await f.evaluate(() => {
  const sb = document.querySelector('.desk-sidebar')
  return { shiritiDukshem: sb ? getComputedStyle(sb).display : 'MUNGON ne DOM',
    bodyPadding: getComputedStyle(document.body).paddingLeft,
    desknav: document.body.getAttribute('data-desknav') }
})
console.log('TELEFON 390px → ' + JSON.stringify(r))
await f.screenshot({ path: '.ops/autopsi/shirit-telefon.png' })
await sh.close()

import { chromium } from 'playwright'
const sh = await chromium.launchPersistentContext(process.env.PROFIL || '.ops/.profil-chrome',
  { headless: true, channel: 'chrome', viewport: { width: 1280, height: 800 }, locale: 'sq-AL' })
const f = sh.pages()[0] || await sh.newPage()
await f.goto('https://alpazar.vercel.app/', { waitUntil: 'domcontentloaded' })
await f.waitForTimeout(6000)
const info = await f.evaluate(() => {
  const k = Object.keys(localStorage)
  return {
    celesat: k,
    gjatesite: k.map((x) => x + ' = ' + (localStorage.getItem(x) || '').length + ' char'),
    url: location.href,
    titulli: (document.querySelector('h1,h2')?.textContent || '').trim().slice(0, 40),
  }
})
console.log(JSON.stringify(info, null, 1))
await sh.close()

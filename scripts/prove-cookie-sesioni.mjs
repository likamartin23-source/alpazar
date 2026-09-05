import { chromium } from 'playwright'
const sh = await chromium.launchPersistentContext(process.env.PROFIL || '.ops/.profil-chrome',
  { headless: true, channel: 'chrome', viewport: { width: 1920, height: 1080 }, locale: 'sq-AL' })
const cookies = await sh.cookies()
const auth = cookies.filter((c) => /sb-.*-auth-token/.test(c.name))
console.log('COOKIES sesioni: ' + auth.map((c) => c.name + '(' + c.value.length + ')').join(', ') || '(asnje)')

const f = sh.pages()[0] || await sh.newPage()
for (const rruga of ['/profile', '/messages', '/favorites']) {
  await f.goto('https://alpazar.vercel.app' + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await f.waitForTimeout(7000)
  const r = await f.evaluate(() => ({
    titulli: (document.querySelector('h1,h2')?.textContent || '').trim().slice(0, 45),
    guaske: /Vazhdo me Google|Keni harruar fjal|Identifikohu me Google|Hyr për të parë|Kyçu për të parë/i.test(document.body.innerText || ''),
  }))
  console.log(rruga.padEnd(12) + (r.guaske ? 'GUASKË ' : 'FAQJA  ') + r.titulli)
}
await sh.close()

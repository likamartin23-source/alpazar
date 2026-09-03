#!/usr/bin/env node
/**
 * A ËSHTË SECILA FAQE "100% WEB"? — matje LIVE, me guaskën e login-it të shënuar
 *
 * KORRIGJIM I NJË GABIMI TIMIN: versioni i parë e nxirrte kufirin nga kodi si
 * `min(çdo max-width në skedar)`. Ai numër ngatërron kufirin e një AVATARI me
 * kufirin e FAQES — prandaj jepte "/listing/[id] 112px", që s'ka kuptim.
 * Numrat e nxjerrë ashtu u hodhën.
 *
 * Tani matet vetëm ajo që shihet: gjerësia e VËRTETË e përmbajtjes në 1920px,
 * marrë nga kutia më e gjerë brenda `<main>`. Dhe — pikërisht ajo që e prishi
 * raportin e parë — çdo faqe që kthen GUASKËN E HYRJES shënohet si e pamatur,
 * jo si "100%". Pronari e kapi këtë: numrat "100%" për `/profile` e `/billing`
 * ishin faqja e login-it, jo faqja.
 *
 * Guaska njihet nga titulli dhe nga teksti i hyrjes — jo nga gjatësia, që
 * ndryshon.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'
const TEKST = new Set(['/kushtet', '/privatesia', '/cookies', '/siguria', '/takedown', '/rreth-nesh'])

const rruget = execSync('find app -name "page.tsx"', { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean)
  .map((p) => p.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/').sort()

const url = (r) => r
  .replace('[id]', r.startsWith('/listing') ? LID : r.startsWith('/biznese') ? BID : r.startsWith('/u') ? UID : '00000000-0000-0000-0000-000000000000')
  .replace('[slug]', 'automjete').replace('[qytet]', 'tirane')

mkdirSync('.ops/autopsi', { recursive: true })
const shf = await chromium.launch()
const ktx = await shf.newContext({ viewport: { width: 1920, height: 1080 }, locale: 'sq-AL' })
await ktx.addInitScript(() => {
  try {
    localStorage.setItem('alpazar_age_ok', '1')
    localStorage.setItem('alpazar_onboarded', '1')
    localStorage.setItem('alpazar_cookie_consent', 'accepted')
  } catch {}
})

const dalja = []
for (const rruga of rruget) {
  const f = await ktx.newPage()
  const rez = { rruga }
  try {
    await f.goto(BAZA + url(rruga), { waitUntil: 'domcontentloaded', timeout: 45000 })
    await f.waitForTimeout(2400)
    Object.assign(rez, await f.evaluate(() => {
      const D = document, W = window
      const m = D.querySelector('main') || D.body
      const gjere = [...m.querySelectorAll('*')].reduce((a, e) => {
        const r = e.getBoundingClientRect(), s = W.getComputedStyle(e)
        if (r.width < 40 || r.height < 20 || s.display === 'none' || s.visibility === 'hidden') return a
        return Math.max(a, r.width)
      }, 0)
      const T = (D.body.innerText || '')
      return {
        permbajtjeW: Math.round(gjere), vw: W.innerWidth, titull: D.title,
        // Guaska e hyrjes: e njohur nga PËRMBAJTJA, jo nga gjatësia.
        guaske: /Hyr|Regjistrohu|Vazhdo me Google/i.test(T) && /Keni harruar fjalëkalimin/i.test(T),
      }
    }))
    rez.shfrytezim = Math.round(100 * rez.permbajtjeW / rez.vw)
  } catch (e) { rez.gabim = String(e.message).slice(0, 50) }
  await f.close()
  dalja.push(rez)
}
await ktx.close(); await shf.close()
writeFileSync('.ops/autopsi/verdikti-100-web.json', JSON.stringify(dalja, null, 1))

const verdikt = (r) => {
  if (r.gabim) return 'GABIM'
  if (r.guaske) return 'S’U MAT (guaskë hyrjeje)'
  if (TEKST.has(r.rruga)) return r.shfrytezim < 30 ? 'TEKST — tepër i ngushtë' : 'TEKST — në rregull'
  if (r.shfrytezim >= 85) return 'MBUSH'
  if (r.shfrytezim >= 55) return 'PJESËRISHT'
  return 'KOLONË TELEFONI'
}
console.log('SECILA FAQE @1920px — a mbush ekranin?\n')
console.log('  ' + 'RRUGA'.padEnd(30) + 'SHFRYT.'.padEnd(9) + 'GJERËSIA'.padEnd(11) + 'VERDIKT')
const rend = { 'KOLONË TELEFONI': 0, 'PJESËRISHT': 1, 'TEKST — tepër i ngushtë': 2, 'TEKST — në rregull': 3, 'MBUSH': 4, 'S’U MAT (guaskë hyrjeje)': 5, 'GABIM': 6 }
for (const r of dalja.sort((a, b) => rend[verdikt(a)] - rend[verdikt(b)] || (a.shfrytezim || 0) - (b.shfrytezim || 0))) {
  console.log('  ' + r.rruga.padEnd(30) +
    (r.shfrytezim != null ? (r.shfrytezim + '%').padEnd(9) : '—'.padEnd(9)) +
    (r.permbajtjeW ? (r.permbajtjeW + 'px').padEnd(11) : '—'.padEnd(11)) + verdikt(r))
}
const g = (v) => dalja.filter((r) => verdikt(r) === v).length
console.log('\n═══ PERFUNDIM (38 faqe) ═══')
console.log('  MBUSHIN ekranin (≥85%)          : ' + g('MBUSH'))
console.log('  PJESËRISHT (55–84%)             : ' + g('PJESËRISHT'))
console.log('  KOLONË TELEFONI (<55%)          : ' + g('KOLONË TELEFONI'))
console.log('  Faqe teksti — në rregull        : ' + g('TEKST — në rregull'))
console.log('  Faqe teksti — tepër të ngushta  : ' + g('TEKST — tepër i ngushtë'))
console.log('  S’U MATËN (kërkojnë sesion)     : ' + g('S’U MAT (guaskë hyrjeje)'))
console.log('\n  → Vetëm ' + (g('MBUSH')) + ' nga ' + (dalja.length - g('S’U MAT (guaskë hyrjeje)')) +
  ' faqe të matshme e mbushin vërtet ekranin.')

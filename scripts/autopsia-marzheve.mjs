#!/usr/bin/env node
/**
 * AUTOPSIA E MARZHEVE — sa bosh mbetet vërtet majtas e djathtas
 *
 * PSE nje instrument i dyte: matja e meparshme jepte "shfrytezim 100%" duke
 * marre elementin ME TE GJERE brenda `<main>`. Por nje kokë me ngjyre qe shkon
 * skaj-me-skaj eshte 100%, ndersa kartat poshte saj rrine ne mes me marzhe bosh.
 * Pronari e sheh ate boshllek; matja ime e fshihte. Numri ishte i sakte per
 * pyetjen e gabuar.
 *
 * KY INSTRUMENT mat PERMBAJTJEN, jo kutine:
 *   · gjen kartat, rrjetat, paragrafet dhe formularet — jo kokat e ngjitura,
 *     jo banderolat plot-gjeresi, jo fundin e faqes
 *   · mat sa piksel bosh mbeten MAJTAS dhe DJATHTAS tyre
 *   · e krahason me ballinen, qe eshte etalon: aty ku ajo arrin, duhet te
 *     arrijne edhe te tjerat
 *
 * Marzhi i shendetshem ne 1920px eshte ~48-72px per krah (clamp-i i cloud-it).
 * Cdo gje mbi ~15% per krah do te thote qe permbajtja rri kolone ne mes.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

const rruget = execSync('find app -name "page.tsx"', { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean)
  .map((p) => p.replace(/^app/, '').replace(/\/page\.tsx$/, '') || '/').sort()

const url = (r) => r
  .replace('[id]', r.startsWith('/listing') ? LID : r.startsWith('/biznese') ? BID : r.startsWith('/u') ? UID : '00000000-0000-0000-0000-000000000000')
  .replace('[slug]', 'automjete').replace('[qytet]', 'tirane')

function mates() {
  const D = document, W = window
  const st = (e) => W.getComputedStyle(e)
  const duket = (e) => {
    const r = e.getBoundingClientRect(), s = st(e)
    return r.width > 30 && r.height > 20 && s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0'
  }
  const kryesor = D.querySelector('main') || D.body

  // Perjashto ato qe NUK jane permbajtje: kokat e ngjitura, banderolat, fundi.
  const perjashto = (e) => {
    if (e.closest('header,footer,nav')) return true
    const s = st(e)
    if (s.position === 'fixed' || s.position === 'sticky') return true
    if (e.closest('[class*=topbar],[class*=header],[class*=hero],[class*=banner],[class*=ftr]')) return true
    return false
  }

  // PERMBAJTJA matet mbi GLIFET, jo mbi kutite. Nje kuti mund te jete
  // plot-gjeresi me sfond, ndersa shkronjat brenda saj rrine ne mes. Range mbi
  // nyjet e tekstit jep saktesisht ku bien shkronjat — ajo qe sheh syri.
  // (Versioni i pare perzgjidhte klasa si [class*=card]; humbiste permbajtjen
  //  qe rri ne DIV pa klase — jepte 20% per /listing/[id] qe eshte 59%.)
  const kuti = []
  const ec = D.createTreeWalker(kryesor, NodeFilter.SHOW_TEXT)
  let n
  while ((n = ec.nextNode())) {
    const t = (n.textContent || '').trim()
    if (t.length < 3) continue
    const pr = n.parentElement
    if (!pr || !duket(pr) || perjashto(pr)) continue
    const rg = D.createRange(); rg.selectNodeContents(n)
    const r = rg.getBoundingClientRect()
    if (r.width > 20 && r.height > 4) kuti.push({ r, k: String(pr.className || pr.tagName).split(' ')[0].slice(0, 20) })
  }
  for (const im of kryesor.querySelectorAll('img,video,canvas')) {
    if (!duket(im) || perjashto(im)) continue
    const r = im.getBoundingClientRect()
    if (r.width > 40) kuti.push({ r, k: im.tagName })
  }
  const perm = kuti
  if (!perm.length) return { pa: true }

  let majtas = Infinity, djathtas = -Infinity
  const gjere = []
  for (const o of perm) {
    const r = o.r
    if (r.width < 40) continue
    if (r.left < majtas) majtas = r.left
    if (r.right > djathtas) djathtas = r.right
    gjere.push({ w: Math.round(r.width), k: o.k })
  }
  const gjeresiaPerm = Math.round(djathtas - majtas)
  const bosh = Math.round(W.innerWidth - gjeresiaPerm)

  // Elementi më i gjerë i PËRMBAJTJES — ai e vendos kufirin real
  gjere.sort((a, b) => b.w - a.w)

  return {
    vw: W.innerWidth,
    majtas: Math.round(majtas),
    djathtas: Math.round(W.innerWidth - djathtas),
    gjeresiaPerm,
    bosh,
    shfrytezim: Math.round(100 * gjeresiaPerm / W.innerWidth),
    boshPerqind: Math.round(100 * bosh / W.innerWidth),
    meGjeri: gjere[0] ? gjere[0].k + ' ' + gjere[0].w + 'px' : '—',
    njesi: perm.length,
    guaske: /Vazhdo me Google|Keni harruar fjalëkalimin/i.test(D.body.innerText || ''),
  }
}

mkdirSync('.ops/autopsi', { recursive: true })
const shf = await chromium.launch()
const dalja = []

for (const gjer of [1280, 1920]) {
  const ktx = await shf.newContext({ viewport: { width: gjer, height: 1000 }, locale: 'sq-AL' })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })
  console.log('══════ ' + gjer + 'px ══════')
  console.log('  RRUGA'.padEnd(30) + 'MAJTAS DJATHTAS  PËRMBAJTJA  SHFRYT.  BOSH   më i gjeri')
  for (const rruga of rruget) {
    const f = await ktx.newPage()
    const rez = { rruga, gjeresi: gjer }
    try {
      await f.goto(BAZA + url(rruga), { waitUntil: 'domcontentloaded', timeout: 45000 })
      // Prit derisa faqja te kete VERTET permbajtje: matja e glifeve eshte e
      // ndjeshme ndaj momentit — nje faqe qe ende po ngarkohet jep 2% dhe te
      // genjen. Presim qe numri i nyjeve te tekstit te qetesohet.
      let iPara = -1
      for (let i = 0; i < 24; i++) {
        await f.waitForTimeout(500)
        const sa = await f.evaluate(() => {
          const m = document.querySelector('main') || document.body
          const w = document.createTreeWalker(m, NodeFilter.SHOW_TEXT)
          let c = 0
          while (w.nextNode()) if ((w.currentNode.textContent || '').trim().length > 2) c++
          return c
        })
        if (sa > 12 && sa === iPara) break
        iPara = sa
      }
      Object.assign(rez, await f.evaluate(mates))
    } catch (e) { rez.gabim = String(e.message).slice(0, 40) }
    await f.close()
    dalja.push(rez)
    if (rez.gabim) { console.log('  ' + rruga.padEnd(28) + 'GABIM ' + rez.gabim); continue }
    if (rez.pa) { console.log('  ' + rruga.padEnd(28) + '(pa përmbajtje të matshme)'); continue }
    const sh = rez.guaske ? ' GUASKË' : ''
    console.log('  ' + rruga.padEnd(28) +
      String(rez.majtas).padStart(5) + String(rez.djathtas).padStart(8) +
      String(rez.gjeresiaPerm).padStart(11) + 'px' +
      String(rez.shfrytezim).padStart(7) + '%' +
      String(rez.boshPerqind).padStart(6) + '%  ' + rez.meGjeri + sh)
  }
  await ktx.close()
  console.log('')
}
await shf.close()
writeFileSync('.ops/autopsi/marzhet.json', JSON.stringify(dalja, null, 1))

const d = dalja.filter((r) => r.gjeresi === 1920 && !r.gabim && !r.pa && !r.guaske)
const bal = d.find((r) => r.rruga === '/')
console.log('═══ KRAHASIM ME BALLINËN (etalon) ═══')
if (bal) console.log('  ballina: ' + bal.shfrytezim + '% shfrytëzim · ' + bal.majtas + 'px majtas · ' + bal.djathtas + 'px djathtas\n')
const prapa = d.filter((r) => r.rruga !== '/' && bal && r.shfrytezim < bal.shfrytezim - 5)
  .sort((a, b) => a.shfrytezim - b.shfrytezim)
console.log('  Faqe që MBETEN PRAPA ballinës: ' + prapa.length + ' nga ' + (d.length - 1))
for (const r of prapa) {
  console.log('    ' + String(r.shfrytezim).padStart(3) + '%  ' + r.rruga.padEnd(28) +
    'bosh ' + r.bosh + 'px (' + r.boshPerqind + '%)  ← ' + r.meGjeri)
}
console.log('\n→ .ops/autopsi/marzhet.json')

#!/usr/bin/env node
/**
 * AUTOPSIA E PROPORCIONIT — matja që i paraprin projektit "100% web"
 *
 * PYETJA që s'ka pasur përgjigje deri tani: për ÇDO faqe, në ÇDO gjerësi,
 * sa nga ekrani zë përmbajtja, dhe — kryesorja — CILI ELEMENT e ngushton?
 * Pa emrin e atij elementi, çdo propozim është hamendje.
 *
 * METODA: nga nyja më e thellë me tekst, ngjitemi drejt `<body>` dhe gjejmë
 * paraardhësin e PARË që vendos një kufi real (`max-width` jo-`none`, ose
 * gjerësi dukshëm më e vogël se prindi). Ai është "fyti" i faqes. Kthejmë
 * emrin e klasës së tij, kufirin dhe gjerësinë e prindit — pra saktësisht
 * ç'duhet ndryshuar.
 *
 * MAT EDHE PROPORCIONIN, jo vetëm gjerësinë:
 *   · karaktere për rresht — rehatia e leximit është 45–75; mbi 90 lodh syrin
 *   · sa kolona ka rrjeta dhe sa e gjerë del një kartë
 *   · madhësia e kokës kundrejt tekstit — a ka hierarki apo gjithçka njësoj
 * Këto janë ato që e bëjnë një faqe "të bukur dhe komode", dhe maten, jo shijohen.
 *
 * KUFI I DEKLARUAR: faqet pas hyrjes kthejnë guaskën e login-it për një vizitor
 * të dalogur. Ato SHËNOHEN si të tilla dhe NUK numërohen si të matura — gabimi
 * që pronari kapi më parë.
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'
import { execSync } from 'node:child_process'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'

const GJERESITE = [
  { g: 390, l: 844, e: 'telefon', m: true },
  { g: 768, l: 1024, e: 'tablet', m: false },
  { g: 1280, l: 900, e: 'laptop', m: false },
  { g: 1920, l: 1080, e: 'desktop', m: false },
]

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
    return r.width > 4 && r.height > 4 && s.display !== 'none' && s.visibility !== 'hidden'
  }

  // ── FYTI: paraardhësi i parë që vendos kufi real ────────────────────
  const kryesor = D.querySelector('main') || D.body
  const permbajtja = [...kryesor.querySelectorAll('*')].filter(duket)
  const meGjere = permbajtja.reduce((a, e) => {
    const r = e.getBoundingClientRect()
    return r.width > (a ? a.getBoundingClientRect().width : 0) ? e : a
  }, null)

  const fyti = (() => {
    let n = meGjere || kryesor
    while (n && n !== D.documentElement) {
      const s = st(n), r = n.getBoundingClientRect()
      const p = n.parentElement
      const pw = p ? p.getBoundingClientRect().width : W.innerWidth
      const kufi = s.maxWidth !== 'none' ? parseFloat(s.maxWidth) : null
      // fyt = ka max-width real, OSE është dukshëm më i ngushtë se prindi pa qenë kolonë e rrjetës
      if ((kufi && kufi < W.innerWidth - 2) || (pw - r.width > 24 && s.display !== 'inline')) {
        return {
          tag: n.tagName.toLowerCase(),
          kls: String(n.className || '').split(' ').slice(0, 2).join('.').slice(0, 30),
          id: n.id || '',
          maxWidth: s.maxWidth,
          gjeresia: Math.round(r.width),
          prindi: Math.round(pw),
          margin: s.marginLeft + '/' + s.marginRight,
        }
      }
      n = p
    }
    return null
  })()

  // ── PROPORCIONI I LEXIMIT ───────────────────────────────────────────
  const paragrafe = [...kryesor.querySelectorAll('p,li,dd')].filter((e) => {
    if (!duket(e)) return false
    const t = (e.textContent || '').trim()
    return t.length > 60
  })
  const karaktere = paragrafe.map((e) => {
    const r = e.getBoundingClientRect(), px = parseFloat(st(e).fontSize)
    return Math.round(r.width / (px * 0.5))
  })
  const mesatarja = karaktere.length ? Math.round(karaktere.reduce((a, b) => a + b, 0) / karaktere.length) : null

  // ── RRJETA: sa kolona, sa e gjerë një kartë ─────────────────────────
  const rrjeta = [...kryesor.querySelectorAll('*')].filter((e) => {
    const s = st(e)
    return duket(e) && (s.display === 'grid' || s.display === 'flex') && e.children.length >= 2
  }).map((e) => {
    const s = st(e), femijet = [...e.children].filter(duket)
    const gjer = femijet.map((c) => c.getBoundingClientRect().width)
    const rreshti = new Set(femijet.map((c) => Math.round(c.getBoundingClientRect().top)))
    return {
      kls: String(e.className || '').split(' ')[0].slice(0, 22),
      kolona: s.gridTemplateColumns !== 'none' ? s.gridTemplateColumns.split(' ').length : Math.round(femijet.length / Math.max(1, rreshti.size)),
      kartaW: gjer.length ? Math.round(Math.max(...gjer)) : 0,
      femije: femijet.length,
    }
  }).filter((x) => x.kartaW > 90 && x.femije >= 2).slice(0, 3)

  // ── HIERARKIA TIPOGRAFIKE ───────────────────────────────────────────
  const h1 = D.querySelector('h1')
  const trupi = paragrafe[0] || kryesor.querySelector('p')
  const px = (e) => (e ? Math.round(parseFloat(st(e).fontSize)) : null)

  const T = (D.body.innerText || '')
  return {
    fyti,
    permbajtjeW: meGjere ? Math.round(meGjere.getBoundingClientRect().width) : 0,
    vw: W.innerWidth,
    karaktereMes: mesatarja, paragrafe: paragrafe.length,
    karaktereMbi90: karaktere.filter((c) => c > 90).length,
    karaktereNen40: karaktere.filter((c) => c < 40).length,
    rrjeta,
    h1px: px(h1), trupiPx: px(trupi),
    raporti: px(h1) && px(trupi) ? +(px(h1) / px(trupi)).toFixed(2) : null,
    guaske: /Vazhdo me Google|Keni harruar fjalëkalimin/i.test(T),
    dalje: Math.max(0, D.documentElement.scrollWidth - W.innerWidth),
  }
}

mkdirSync('.ops/autopsi', { recursive: true })
const shf = await chromium.launch()
const dalja = []

for (const gj of GJERESITE) {
  const ktx = await shf.newContext({
    viewport: { width: gj.g, height: gj.l }, isMobile: gj.m, hasTouch: gj.m, locale: 'sq-AL',
  })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })
  console.log('═════ ' + gj.g + 'px · ' + gj.e + ' ═════')
  for (const rruga of rruget) {
    const f = await ktx.newPage()
    const rez = { rruga, gjeresi: gj.g, pajisje: gj.e }
    try {
      await f.goto(BAZA + url(rruga), { waitUntil: 'domcontentloaded', timeout: 45000 })
      await f.waitForTimeout(2300)
      Object.assign(rez, await f.evaluate(mates))
      rez.shfrytezim = Math.round(100 * rez.permbajtjeW / rez.vw)
    } catch (e) { rez.gabim = String(e.message).slice(0, 44) }
    await f.close()
    dalja.push(rez)
    if (rez.gabim) { console.log('  ' + rruga.padEnd(28) + 'GABIM ' + rez.gabim); continue }
    const fy = rez.fyti ? (rez.fyti.kls || rez.fyti.id || rez.fyti.tag) + ' ' + rez.fyti.maxWidth : '—'
    console.log('  ' + rruga.padEnd(28) + String(rez.shfrytezim).padStart(3) + '%  ' +
      String(rez.permbajtjeW).padStart(4) + 'px  ' +
      (rez.karaktereMes ? (rez.karaktereMes + 'ch').padStart(5) : '  — ') + '  ' +
      (rez.guaske ? 'GUASKË  ' : '        ') + fy.slice(0, 30))
  }
  await ktx.close()
  console.log('')
}
await shf.close()
writeFileSync('.ops/autopsi/proporcioni.json', JSON.stringify(dalja, null, 1))
console.log('→ .ops/autopsi/proporcioni.json  (' + dalja.length + ' matje)')

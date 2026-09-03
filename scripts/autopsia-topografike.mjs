#!/usr/bin/env node
/**
 * AUTOPSIA TOPOGRAFIKE E ALPAZAR
 *
 * PSE EKZISTON: matjet e meparshme u bene me nje iframe te vetem qe ndryshonte
 * src-in. f.onload kishte shkrepur tashme per faqen e meparshme, keshtu qe
 * matjet lexonin DOM-in E VJETER. Numrat dolen te rreme (41-79% ne vend te
 * 4-9%) dhe u terhoqen ne [O65].
 *
 * KY INSTRUMENT: nje kontekst i paster faqeje per cdo matje, ne nje shfletues
 * te vertete (Chromium), me dy gjeresi reale - 390px (telefon) dhe 1280px
 * (kompjuter). Asnje gjendje nuk kalon nga nje faqe ne tjetren.
 *
 * MAT KATER DIMENSIONE, sepse kerkesa ishte: "e lexushme, kuptushme, komode
 * dhe e aksesushme 100%" + "komoditetit dhe bukurise ... per syrin e njeriut".
 *
 *   A. AKSESUESHMERIA - WCAG 2.1 AA
 *   B. LEXUESHMERIA    - madhesi, gjatesi rreshti, hapesire rreshtash
 *   C. KOMODITETI      - prekje, hapesira, dalje jashte ekranit
 *   D. BUKURIA         - harmoni ritmi, disipline e shkalles tipografike
 */
import { chromium } from 'playwright'
import { writeFileSync, mkdirSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
// PELQIM=1 → mat pas pëlqimit (përvoja reale e shfletimit).
// Pa të → mat vizitën E PARË, ku tri shtresa bllokuese dalin njëherësh.
const PELQIM = process.env.PELQIM === '1'
const DALJA = PELQIM ? '.ops/autopsi/pas-pelqimit' : '.ops/autopsi'
const LID = 'dcc29dcc-ad56-4297-b299-5fb7e4ea6349'
const UID = 'af3e3d5b-0f49-4ad5-a83d-281733fed433'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'

const RRUGET = [
  ['/', 'Ballina'],
  ['/search', 'Kerkimi'],
  ['/search/results', 'Rezultatet'],
  ['/kategori', 'Kategorite'],
  ['/kategori/automjete', 'Kategori e vetme'],
  ['/kategori/automjete/tirane', 'Kategori + qytet'],
  ['/listing/' + LID, 'Shpallja'],
  ['/listing/new', 'Shpallje e re'],
  ['/biznese', 'Bizneset'],
  ['/biznese/' + BID, 'Biznesi'],
  ['/biznese/new', 'Biznes i ri'],
  ['/u/' + UID, 'Profili i jashtem'],
  ['/profile', 'Profili i brendshem'],
  ['/favorites', 'Te preferuarat'],
  ['/saved-searches', 'Kerkimet e ruajtura'],
  ['/messages', 'Mesazhet'],
  ['/notifications', 'Njoftimet'],
  ['/asistent', 'Asistenti'],
  ['/billing', 'Faturimi'],
  ['/premium', 'Premium'],
  ['/oferta', 'Ofertat'],
  ['/referral', 'Referimi'],
  ['/te-dhenat-mia', 'Te dhenat e mia'],
  ['/auth/login', 'Hyrja'],
  ['/kontakt', 'Kontakti'],
  ['/rreth-nesh', 'Rreth nesh'],
  ['/kushtet', 'Kushtet'],
  ['/privatesia', 'Privatesia'],
  ['/cookies', 'Cookies'],
  ['/siguria', 'Siguria'],
  ['/takedown', 'Heqja e permbajtjes'],
  ['/profile/analytics', 'Analitika e profilit'],
  ['/biznese/' + BID + '/analytics', 'Analitika e biznesit'],
  ['/biznese/' + BID + '/edit', 'Redakto biznesin'],
  ['/listing/' + LID + '/edit', 'Redakto shpalljen'],
  ['/admin', 'Administrimi'],
]

const GJERESITE = [
  { g: 390, l: 844, e: 'telefon', dpr: 3, mobile: true },
  { g: 1280, l: 900, e: 'kompjuter', dpr: 1, mobile: false },
]

// Matesi: ekzekutohet BRENDA faqes
function mates() {
  const W = window, D = document
  const st = (e) => W.getComputedStyle(e)
  const duket = (e) => {
    const r = e.getBoundingClientRect(), s = st(e)
    return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' &&
           s.display !== 'none' && s.opacity !== '0'
  }
  const emri = (e) => {
    const im = e.querySelector && e.querySelector('img')
    return (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') ||
            e.getAttribute('title') || (e.textContent || '').trim() ||
            (im && im.getAttribute('alt')) || '').trim()
  }
  const eshteKalim = (e) => (e.textContent || '').trim().indexOf('Kalo tek') === 0

  // ngjyra: kompozim i vertete alfa mbi prinderit
  const parsePer = (c) => {
    const m = String(c).match(/[\d.]+/g)
    if (!m) return null
    return { r: +m[0], g: +m[1], b: +m[2], a: m.length > 3 ? +m[3] : 1 }
  }
  // PSE eshte i ndertuar keshtu: versioni i meparshem lexonte VETEM
  // backgroundColor. Nje buton me `background: linear-gradient(...)` ka
  // backgroundColor = rgba(0,0,0,0), ndaj matesi e kapercente butonin dhe
  // maste tekstin e erret te butonit kunder faqes se erret prapa tij — duke
  // raportuar cr=1.00 per butona ari krejtesisht te lexueshem. Ishte i njejti
  // gabim i terhequr ne [O52]. Tani gradientet lexohen dhe secili ndalese
  // ngjyre trajtohet si sfond i mundshem.
  const ndalesatEGradientit = (bi) => {
    if (!bi || bi === 'none' || bi.indexOf('gradient') < 0) return []
    const out = []
    for (const m of bi.match(/rgba?\([^)]*\)/g) || []) {
      const c = parsePer(m)
      if (c && c.a > 0.5) out.push({ r: c.r, g: c.g, b: c.b, a: 1 })
    }
    return out
  }
  const sipas = (mbi) => {
    if (!mbi.length || mbi[mbi.length - 1].a < 1) mbi = mbi.concat([{ r: 255, g: 255, b: 255, a: 1 }])
    let out = mbi[mbi.length - 1]
    for (let i = mbi.length - 2; i >= 0; i--) {
      const f = mbi[i]
      out = {
        r: f.r * f.a + out.r * (1 - f.a),
        g: f.g * f.a + out.g * (1 - f.a),
        b: f.b * f.a + out.b * (1 - f.a), a: 1,
      }
    }
    return out
  }
  /** Kthen TE GJITHA sfondet e mundshme (nje per cdo ndalese gradienti). */
  const sfondet = (e) => {
    let n = e
    const mbi = []
    while (n && n.nodeType === 1) {
      const s = st(n)
      const nd = ndalesatEGradientit(s.backgroundImage)
      if (nd.length) return nd.map((g) => sipas(mbi.concat([g])))
      const c = parsePer(s.backgroundColor)
      if (c && c.a > 0) { mbi.push(c); if (c.a === 1) break }
      n = n.parentElement
    }
    return [sipas(mbi)]
  }
  const ndricim = (c) => {
    const k = [c.r, c.g, c.b].map((v) => {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]
  }
  const kontrast = (a, b) => {
    const x = ndricim(a), y = ndricim(b)
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
  }

  const ndv = [...D.querySelectorAll('button,a[href],[role=link],[role=button],input[type=submit],input[type=button]')]
    .filter(duket).filter((e) => !eshteKalim(e))
  const img = [...D.querySelectorAll('img')].filter(duket)
  const inp = [...D.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(duket)
  const krer = [...D.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter(duket)

  const tekstet = [...D.querySelectorAll('p,span,div,li,a,button,label,td,th,h1,h2,h3,h4,h5,h6,strong,em,small')]
    .filter((e) => {
      if (!duket(e)) return false
      const t = (e.textContent || '').trim()
      if (!t || t.length < 2) return false
      return [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    })

  // A. AKSESUESHMERIA
  const nen44 = ndv.filter((e) => {
    const r = e.getBoundingClientRect()
    return r.height < 44 || r.width < 44
  })
  const paEmer = ndv.filter((e) => !emri(e))
  const imgPaAlt = img.filter((e) => !e.hasAttribute('alt'))
  const inpPaEtik = inp.filter((e) => !emri(e) && !e.getAttribute('placeholder') &&
    !(e.id && D.querySelector('label[for="' + CSS.escape(e.id) + '"]')) && !e.closest('label'))

  const nivelet = krer.map((e) => +e.tagName[1])
  let kercime = 0
  for (let i = 1; i < nivelet.length; i++) if (nivelet[i] - nivelet[i - 1] > 1) kercime++

  // Anshmeri e qellimshme: kur nje tekst bie mbi disa sfonde te mundshme
  // (gradient), merret rasti me I MIRE. Kjo nenvlereson deshtimet e verteta,
  // por kurrë nuk shpik nje deshtim qe nuk ekziston — dhe pikerisht shpikja
  // ishte gabimi i [O52].
  // Dy klasa pozitivesh te rreme, te kapura duke i pare rezultatet nje nga nje:
  //  (1) etiketat vetem-per-lexues-ekrani (`position:absolute; left:-9999`) —
  //      nuk i sheh askush, ndaj kontrasti i tyre nuk ekziston si problem;
  //  (2) emoji — glifi ka ngjyrat e veta dhe NUK e ndjek `color` te CSS-se,
  //      ndaj "📬 me ngjyre te zeze" eshte matje pa kuptim.
  const jashteEkranit = (e) => {
    const r = e.getBoundingClientRect()
    return r.right < 0 || r.bottom < 0 || r.left > W.innerWidth + 2000
  }
  const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/u
  const vetemEmoji = (t) => t.length > 0 && !/[\p{L}\p{N}]/u.test(t)

  const kont = []
  for (const e of tekstet) {
    const s = st(e), fg = parsePer(s.color)
    if (!fg || fg.a < 0.1) continue
    if (jashteEkranit(e)) continue
    const vet = [...e.childNodes].filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim()).join('')
    if (vetemEmoji(vet) || (EMOJI.test(vet) && vet.replace(EMOJI, '').trim().length < 2)) continue
    const px = parseFloat(s.fontSize), w = parseInt(s.fontWeight) || 400
    const madh = px >= 24 || (px >= 18.66 && w >= 700)
    const kufi = madh ? 3.0 : 4.5
    let meMira = 0
    for (const bg of sfondet(e)) {
      const perzier = {
        r: fg.r * fg.a + bg.r * (1 - fg.a),
        g: fg.g * fg.a + bg.g * (1 - fg.a),
        b: fg.b * fg.a + bg.b * (1 - fg.a),
      }
      const cr = kontrast(perzier, bg)
      if (cr > meMira) meMira = cr
    }
    if (meMira < kufi) {
      kont.push({
        t: (e.textContent || '').trim().slice(0, 26),
        cr: +meMira.toFixed(2), px: Math.round(px), kufi,
        ngj: s.color, cls: String(e.className || '').split(' ')[0].slice(0, 20),
      })
    }
  }

  // B. LEXUESHMERIA
  const nen12 = tekstet.filter((e) => parseFloat(st(e).fontSize) < 12)
  const madhesite = {}
  tekstet.forEach((e) => {
    const p = Math.round(parseFloat(st(e).fontSize))
    madhesite[p] = (madhesite[p] || 0) + 1
  })
  const familjet = new Set(tekstet.map((e) => st(e).fontFamily.split(',')[0].replace(/["']/g, '').trim()))

  const paragrafe = tekstet.filter((e) => (e.textContent || '').trim().length > 80)
  const rreshtaGjate = [], rreshtaShkurter = []
  for (const e of paragrafe) {
    const r = e.getBoundingClientRect(), px = parseFloat(st(e).fontSize)
    const kar = Math.round(r.width / (px * 0.5))
    if (kar > 90) rreshtaGjate.push({ t: (e.textContent || '').trim().slice(0, 22), kar })
    else if (kar < 40) rreshtaShkurter.push({ t: (e.textContent || '').trim().slice(0, 22), kar })
  }

  const rreshtNgushte = paragrafe.filter((e) => {
    const s = st(e), lh = parseFloat(s.lineHeight), px = parseFloat(s.fontSize)
    return lh && px && lh / px < 1.4
  })

  // C. KOMODITETI
  const dalje = Math.max(0, D.documentElement.scrollWidth - W.innerWidth)
  const jashte = [...D.querySelectorAll('*')].filter((e) => {
    if (!duket(e)) return false
    const r = e.getBoundingClientRect()
    return r.right > W.innerWidth + 1 || r.left < -1
  }).slice(0, 5).map((e) => e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0].slice(0, 18))

  let ngjitur = 0
  const kutit = ndv.map((e) => ({ e, r: e.getBoundingClientRect() }))
  for (let i = 0; i < kutit.length; i++) {
    for (let j = i + 1; j < kutit.length; j++) {
      const a = kutit[i].r, b = kutit[j].r
      if (kutit[i].e.contains(kutit[j].e) || kutit[j].e.contains(kutit[i].e)) continue
      const dx = Math.max(0, Math.max(a.left - b.right, b.left - a.right))
      const dy = Math.max(0, Math.max(a.top - b.bottom, b.top - a.bottom))
      if (dx === 0 && dy === 0) continue
      if (Math.hypot(dx, dy) < 8 && (a.height < 44 || b.height < 44)) { ngjitur++; break }
    }
  }

  // D. BUKURIA / HARMONIA
  const kuti = [...D.querySelectorAll('div,section,article,button,a,input,img')].filter(duket)
  const rrezet = {}, ngjyrat = {}, hapesirat = {}
  kuti.forEach((e) => {
    const s = st(e)
    const rr = parseFloat(s.borderTopLeftRadius) || 0
    if (rr > 0) rrezet[Math.round(rr)] = (rrezet[Math.round(rr)] || 0) + 1
    const bg = s.backgroundColor
    if (bg && bg !== 'rgba(0, 0, 0, 0)') ngjyrat[bg] = (ngjyrat[bg] || 0) + 1
    for (const p of ['paddingTop', 'paddingLeft', 'marginBottom', 'gap']) {
      const v = Math.round(parseFloat(s[p]) || 0)
      if (v > 0) hapesirat[v] = (hapesirat[v] || 0) + 1
    }
  })
  const jashteShkalles = Object.keys(hapesirat).map(Number).filter((v) => v % 4 !== 0)

  return {
    ndv: ndv.length,
    nen44: nen44.length,
    nen44_shemb: nen44.slice(0, 4).map((e) => {
      const r = e.getBoundingClientRect()
      return (emri(e) || e.tagName).slice(0, 14) + ':' + Math.round(r.width) + 'x' + Math.round(r.height)
    }),
    paEmer: paEmer.length,
    paEmer_shemb: paEmer.slice(0, 3).map((e) => e.tagName.toLowerCase() + '.' + String(e.className || '').split(' ')[0].slice(0, 16)),
    img: img.length, imgPaAlt: imgPaAlt.length,
    inp: inp.length, inpPaEtik: inpPaEtik.length,
    h1: D.querySelectorAll('h1').length,
    h1px: D.querySelector('h1') ? Math.round(parseFloat(st(D.querySelector('h1')).fontSize)) : 0,
    krer: krer.length, kercime,
    lang: D.documentElement.lang || 'MUNGON',
    lm: ['main', 'nav', 'header', 'footer'].filter((t) => !!D.querySelector(t)),
    kontraste: kont.length,
    kontraste_shemb: kont.sort((a, b) => a.cr - b.cr).slice(0, 4),
    tekste: tekstet.length,
    nen12: nen12.length,
    nen12_shemb: nen12.slice(0, 3).map((e) => (e.textContent || '').trim().slice(0, 18) + ':' + parseFloat(st(e).fontSize).toFixed(1)),
    madhesiTeDallueshme: Object.keys(madhesite).length,
    madhesite: Object.entries(madhesite).sort((a, b) => b[1] - a[1]).slice(0, 8),
    familje: [...familjet],
    paragrafe: paragrafe.length,
    rreshtaGjate: rreshtaGjate.length,
    rreshtaGjate_shemb: rreshtaGjate.slice(0, 3),
    rreshtaShkurter: rreshtaShkurter.length,
    rreshtNgushte: rreshtNgushte.length,
    dalje, jashte, ngjitur,
    rrezeTeDallueshme: Object.keys(rrezet).length,
    rrezet: Object.entries(rrezet).sort((a, b) => b[1] - a[1]).slice(0, 6),
    ngjyraTeDallueshme: Object.keys(ngjyrat).length,
    hapesiraTeDallueshme: Object.keys(hapesirat).length,
    jashteShkalles: jashteShkalles.length,
    jashteShkalles_shemb: jashteShkalles.sort((a, b) => a - b).slice(0, 8),
  }
}

// Drejtuesi
mkdirSync(DALJA, { recursive: true })
const rezultatet = []
const shfletuesi = await chromium.launch()

for (const gj of GJERESITE) {
  const kontekst = await shfletuesi.newContext({
    viewport: { width: gj.g, height: gj.l },
    deviceScaleFactor: gj.dpr,
    isMobile: gj.mobile,
    hasTouch: gj.mobile,
    locale: 'sq-AL',
  })
  if (PELQIM) {
    // Vendos pëlqimin PARA se të ngarkohet ndonjë skript i faqes, që asnjë
    // shtresë bllokuese të mos hyjë mes matësit dhe faqes.
    await kontekst.addInitScript(() => {
      try {
        localStorage.setItem('alpazar_age_ok', '1')
        localStorage.setItem('alpazar_onboarded', '1')
        localStorage.setItem('alpazar_cookie_consent', 'accepted')
      } catch {}
    })
  }
  for (const [rruga, titulli] of RRUGET) {
    const faqja = await kontekst.newPage()   // faqe E RE per cdo matje
    const rez = { rruga, titulli, gjeresi: gj.g, pajisje: gj.e }
    try {
      const pergj = await faqja.goto(BAZA + rruga, { waitUntil: 'networkidle', timeout: 45000 })
      rez.status = pergj ? pergj.status() : 0
      await faqja.waitForTimeout(1200)
      rez.titull = await faqja.title()
      Object.assign(rez, await faqja.evaluate(mates))
      const emerFoto = DALJA + '/' + gj.g + '-' + (rruga.replace(/[^a-z0-9]+/gi, '_') || 'ballina') + '.png'
      await faqja.screenshot({ path: emerFoto, fullPage: false })
      rez.foto = emerFoto
    } catch (e) {
      rez.gabim = String(e.message).slice(0, 140)
    }
    await faqja.close()                       // asnje gjendje nuk kalon
    rezultatet.push(rez)
    const sh = rez.gabim
      ? '/ ' + rez.gabim
      : rez.status + ' | prekje ' + rez.nen44 + '/' + rez.ndv +
        ' | kontrast ' + rez.kontraste + ' | <12px ' + rez.nen12 + ' | dalje ' + rez.dalje
    console.log(String(gj.g).padStart(4) + ' ' + rruga.padEnd(46) + ' ' + sh)
  }
  await kontekst.close()
}
await shfletuesi.close()

writeFileSync(DALJA + '/matjet.json', JSON.stringify(rezultatet, null, 1))
console.log('\nOK ' + rezultatet.length + ' matje -> ' + DALJA + '/matjet.json')

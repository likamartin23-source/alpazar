#!/usr/bin/env node
/**
 * PROVA E BASHKIMIT TE TE KUQEVE (§4 e HANDOFF-it)
 *
 * Cloud-i kerkoi: "Mos i bashko pa prove axe ne sfondin konkret — perndryshe
 * rrezikohet kontrasti i grupit B."
 *
 * Kjo eshte ajo prova, dhe behet EMPIRIKISHT, jo me aritmetike:
 *   1. axe mbi prodhimin ashtu si eshte  → numri bazë i shkeljeve te kontrastit
 *   2. injektohet nje mbivendosje CSS qe i detyron TE GJITHA te kuqet te behen
 *      nje e vetme, ne pikerisht te njejtat faqe
 *   3. axe serish → nese numri nuk levize, bashkimi eshte i padukshem per
 *      kontrastin; nese levize, tregohet saktesisht ku
 *
 * PSE empirikisht: aritmetika ime e kontrastit ka gabuar kater here ne kete
 * projekt. Nje krahasim para/pas me te njejtin motor nuk varet nga saktesia
 * ime — varet vetem nga axe, ne te dyja anet.
 */
import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'
import { writeFileSync } from 'node:fs'

const BAZA = process.env.BAZA || 'https://alpazar.vercel.app'
const BID = '49745b08-ba0a-488e-b731-7fd19ee6a0bb'

// Faqet ku te kuqet dalin vertet (nga grep mbi burimin).
const RRUGET = [
  '/', '/biznese', '/biznese/' + BID, '/favorites', '/auth/login',
  '/premium', '/oferta', '/asistent', '/kontakt',
]

// Kandidati i bashkimit: me i perdoruri.
const CAK = '#C42B0F'
const BURIMET = ['#c42a0e', '#C42A0E', '#c42305', '#C42305', '#e63312', '#E63312']

// Mbivendosja: cdo shfaqje e te kuqeve behet CAK, edhe brenda gradienteve.
const MBIVENDOSJA = `
  :root{ --az-red:${CAK} !important; --az-red-deep:${CAK} !important; }
`

async function mat(ktx, rruga, meMbivendosje) {
  const f = await ktx.newPage()
  await f.goto(BAZA + rruga, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await f.waitForTimeout(2500)
  if (meMbivendosje) {
    await f.addStyleTag({ content: MBIVENDOSJA })
    // Gradientet e shkruar inline nuk i prek `:root`. I rishkruajme drejtperdrejt.
    await f.evaluate(({ cak, burimet }) => {
      for (const e of document.querySelectorAll('*')) {
        const s = e.getAttribute('style')
        if (!s) continue
        let n = s
        for (const b of burimet) n = n.split(b).join(cak)
        if (n !== s) e.setAttribute('style', n)
      }
    }, { cak: CAK, burimet: BURIMET })
  }
  await f.waitForTimeout(900)
  const r = await new AxeBuilder({ page: f })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).withRules(['color-contrast']).analyze()
  const v = r.violations.find((x) => x.id === 'color-contrast')
  const dalje = {
    nyje: v ? v.nodes.length : 0,
    mostra: v ? v.nodes.slice(0, 3).map((n) => (n.html || '').slice(0, 70)) : [],
    paperfunduara: (r.incomplete.find((x) => x.id === 'color-contrast')?.nodes.length) || 0,
  }
  await f.close()
  return dalje
}

const shf = await chromium.launch()
const raporti = []
for (const gj of [{ g: 390, m: true }, { g: 1280, m: false }]) {
  const ktx = await shf.newContext({
    viewport: { width: gj.g, height: gj.m ? 844 : 900 },
    isMobile: gj.m, hasTouch: gj.m, locale: 'sq-AL',
  })
  await ktx.addInitScript(() => {
    try {
      localStorage.setItem('alpazar_age_ok', '1')
      localStorage.setItem('alpazar_onboarded', '1')
      localStorage.setItem('alpazar_cookie_consent', 'accepted')
    } catch {}
  })
  for (const rruga of RRUGET) {
    let para, pas
    try { para = await mat(ktx, rruga, false); pas = await mat(ktx, rruga, true) }
    catch (e) { console.log(String(gj.g).padStart(4)+" "+rruga.padEnd(42)+"KAPERCEHET: "+String(e.message).slice(0,50)); continue }
    const rez = { gjeresi: gj.g, rruga, para: para.nyje, pas: pas.nyje, delta: pas.nyje - para.nyje,
      paraPap: para.paperfunduara, pasPap: pas.paperfunduara, mostraPas: pas.mostra }
    raporti.push(rez)
    const shenja = rez.delta === 0 ? 'e njejte' : (rez.delta > 0 ? 'MË KEQ +' + rez.delta : 'më mirë ' + rez.delta)
    console.log(String(gj.g).padStart(4) + ' ' + rruga.padEnd(42) +
      'para ' + String(para.nyje).padStart(2) + '  pas ' + String(pas.nyje).padStart(2) + '   ' + shenja)
  }
  await ktx.close()
}
await shf.close()
writeFileSync('.ops/autopsi/prova-te-kuqeve.json', JSON.stringify(raporti, null, 1))

const P = raporti.reduce((a, r) => a + r.para, 0)
const Q = raporti.reduce((a, r) => a + r.pas, 0)
console.log('\n═══ PERFUNDIM ═══')
console.log('  Shkelje kontrasti PARA bashkimit : ' + P)
console.log('  Shkelje kontrasti PAS bashkimit  : ' + Q)
if (Q === P) {
  console.log('\n  → Bashkimi NUK e prek kontrastin. I sigurt nga ana e axe-it.')
} else if (Q > P) {
  console.log('\n  → Bashkimi E PRISH kontrastin (+' + (Q - P) + '). MOS e bej. Ku:')
  for (const r of raporti.filter((x) => x.delta > 0)) {
    console.log('     ' + r.gjeresi + 'px ' + r.rruga + '  +' + r.delta)
    for (const m of r.mostraPas) console.log('        ' + m)
  }
} else {
  console.log('\n  → Bashkimi e PERMIRESON kontrastin (' + (Q - P) + ').')
}
console.log('\n  Shenim: gradientet axe i shenon shpesh si "te paperfunduara",')
console.log('  jo si shkelje. Prandaj raportohen te dyja kolonat.')

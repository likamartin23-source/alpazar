#!/usr/bin/env node
/**
 * ROJA E UNIFIKIMIT
 *
 * PSE EKZISTON — mësimi i 1–2 shtatorit 2026:
 *
 * Pronari raportoi tri ditë rresht se "ndryshimet kthehen tek e vjetra" dhe se
 * "asgjë nuk harmonizohet". Nuk ishte cache, nuk ishte vendosje, nuk ishte SW.
 * Shkaku ishte STRUKTURA e vetë kodit — një fjalor i mbingarkuar:
 *
 *   `.card-title` përdorej 37 herë. Vetëm 2 ishin tituj kartash; 35 ishin koka
 *   seksioni në 7 skedarë. Kush rregullonte kartën deformonte 35 koka; kush
 *   rregullonte kokat deformonte kartat. Dy sesione paralele e kthenin njëri
 *   -tjetrin pafundësisht. Nga jashtë kjo duket saktësisht si "reflektim që
 *   kthehet tek e vjetra" — dhe u audituar nëntë herë si problem cache-i.
 *
 * E njëjta sëmundje, pesë raste të matura:
 *   · `.card-title`      — një klasë, dy kuptime ([O41])
 *   · `.card-price`      — klasë e përbashkët, e mbishkruar inline ([O41])
 *   · vulat e identitetit — PESË fjalorë paralelë për të njëjtat vula ([O43])
 *   · `LISTING_SELECT`   — projeksioni i vetëm, dikur i kopjuar me dorë ([O19])
 *   · `onError` që fsheh imazhin pa vendosur vend-mbajtës ([O41])
 *
 * TypeScript-i nuk e kap asnjërin: të gjitha janë të vlefshme si kod. Prandaj
 * duhet një rojë që numëron.
 *
 * SI PUNON — BAZË-RAKETË, jo ndalim absolut.
 * Borxhi ekziston sot; ndalimi absolut do ta bllokonte depon. Prandaj roja mban
 * një bazë të matur dhe:
 *   · numri RRITET  → dështon (borxh i ri — pikërisht ajo që duam të ndalim)
 *   · numri BIE     → dështon me udhëzim "ule bazën" (që përmirësimi të mbyllet
 *                     me çelës dhe të mos rikthehet pa u vënë re)
 *   · numri i njëjtë → kalon
 * Kështu numri lëviz vetëm poshtë, dhe kurrë pa vendim të shprehur.
 *
 * KUJDES me matjen (mësim i vetë kësaj roje, 2 shtator 2026): kalimi i parë
 * numëroi 1 projeksion të dyfishuar dhe 9 imazhe pa vend-mbajtës. Të dyja
 * ishin pjesërisht të rreme — e para ishte një KOMENT që e përmendte
 * projeksionin, e dyta kapte edhe `onError` që bën gjënë e SAKTË
 * (`setBroken(true)`). "Mat pohimin, mos e lexo" vlen edhe për instrumentin.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const RRENJA = ['app', 'lib']
const BAZA = 'scripts/lib/baza-unifikimit.json'
// Vendet ku klasat e kartës janë LEGJITIME — ato JANË karta.
const KARTAT = ['app/components/ListingCard.tsx', 'app/components/BusinessCard.tsx']
const BURIMI_I_PROJEKSIONIT = 'lib/listingSelect.ts'
const NDARESI = String.fromCharCode(92) // '\' — pa e shkruar si literal
const RRESHT = String.fromCharCode(10)

function skedaret(dir, jashte = []) {
  for (const emri of readdirSync(dir)) {
    const p = join(dir, emri)
    if (statSync(p).isDirectory()) { skedaret(p, jashte); continue }
    if (['.ts', '.tsx'].includes(extname(p))) jashte.push(p.split(NDARESI).join('/'))
  }
  return jashte
}

const gjithe = RRENJA.flatMap(r => skedaret(r))
const perm = new Map(gjithe.map(f => [f, readFileSync(f, 'utf8')]))
const numero = (teksti, re) => (teksti.match(re) || []).length
const eshteKoment = r => /^\s*(\/\/|\*|\/\*)/.test(r)

const matjet = {}
const deshmite = {}

function mat(celesi, pershkrimi, ndreqja, fn) {
  let total = 0
  const gjetur = []
  for (const [f, t] of perm) {
    const n = fn(f, t)
    if (n > 0) { total += n; gjetur.push(`${f} (${n})`) }
  }
  matjet[celesi] = total
  deshmite[celesi] = { pershkrimi, ndreqja, gjetur }
}

mat('card_title_jashte_kartave',
  '`.card-title` përdoret si KOKË SEKSIONI — e njëjta klasë, dy kuptime',
  'Zëvendëso me `.section-title` (klasë e vet për koka seksioni).',
  (f, t) => KARTAT.includes(f) ? 0 : numero(t, /className="card-title"/g))

mat('klasa_e_perbashket_e_mbishkruar_inline',
  'Klasë e përbashkët karte e mbishkruar me `style={{…}}` — e njëjta klasë, dy pamje',
  'Hiq mbishkrimin; nëse duhet variant, bëje klasë modifikuese (p.sh. `.card-price--biz`).',
  (_f, t) => numero(t, /className="card-(?:title|price|meta|loc|stats|img|body)"\s+style=/g))

mat('fjalore_vulash_paralele',
  'Vula identiteti të ndërtuara me dorë krahas `IdentityBadges`',
  'Migro te `<IdentityBadges …/>` — një fjalor i vetëm ([O43]).',
  (_f, t) => numero(t, /className="schip sch-|className="badge b-|className="bdg"/g))

mat('projeksione_te_dyfishuara',
  'Projeksioni i shpalljes i shkruar me dorë në vend të `LISTING_SELECT`',
  'Importo `LISTING_SELECT` nga `lib/listingSelect.ts` — burimi i vetëm i së vërtetës.',
  (f, t) => f.endsWith(BURIMI_I_PROJEKSIONIT) ? 0
    : t.split(RRESHT).filter(r => !eshteKoment(r) && /business:business_id\(/.test(r)).length)

mat('imazh_qe_deshton_pa_vendmbajtes',
  '`onError` e fsheh imazhin me `display=none` pa vendosur vend-mbajtës — mbetet kuti bosh',
  'Mbaj një gjendje `imgFailed` dhe rendero vend-mbajtësin, mos përdor `display=none`.',
  (_f, t) => numero(t, /onError=\{[^}]{0,240}?\.style\.display\s*=\s*'none'/g))

let baza
try { baza = JSON.parse(readFileSync(BAZA, 'utf8')) } catch { baza = null }

if (process.argv.includes('--shkruaj-bazen') || baza === null) {
  writeFileSync(BAZA, JSON.stringify(matjet, null, 2) + RRESHT)
  console.log(`✍️  Baza u shkrua te ${BAZA}:`)
  for (const [k, v] of Object.entries(matjet)) {
    console.log(`   ${k} = ${v}`)
    for (const g of deshmite[k].gjetur) console.log(`        ${g}`)
  }
  process.exit(0)
}

let deshtoi = false
console.log('ROJA E UNIFIKIMIT — matje kundrejt bazës' + RRESHT)

for (const [celesi, tani] of Object.entries(matjet)) {
  const pritur = baza[celesi] ?? 0
  const d = deshmite[celesi]
  console.log(`${tani === pritur ? '=' : (tani > pritur ? '▲' : '▼')} ${celesi}: ${tani} (bazë ${pritur})`)
  if (tani > pritur) {
    deshtoi = true
    console.error(`::error::${d.pershkrimi}. U shtuan ${tani - pritur} raste të reja (${pritur}→${tani}). ${d.ndreqja}`)
    for (const g of d.gjetur.slice(0, 8)) console.error(`    ${g}`)
  } else if (tani < pritur) {
    deshtoi = true
    console.error(`::error::${celesi} ra ${pritur}→${tani}. Ule bazën: node scripts/roja-unifikimit.mjs --shkruaj-bazen — që përmirësimi të mbyllet me çelës dhe të mos rikthehet pa u vënë re.`)
  }
}

if (deshtoi) {
  console.error(RRESHT + '❌ Unifikimi lëvizi. Numrat lëvizin VETËM poshtë, dhe kurrë pa vendim të shprehur.')
  process.exit(1)
}
console.log(RRESHT + '✅ Asnjë borxh i ri unifikimi. Fjalori mbetet i vetëm.')

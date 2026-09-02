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

// SHTRESA E FORMES ([O59]/[O60], 2 shtator 2026): border-radius i shkruar me dore inline,
// jo permes token-it var(--r-*). Matur: qindra vlera inline kundrejt pak perdorimesh token —
// prandaj "butonat/kartat duken te crregullt" edhe kur secili eshte i sakte: askush s'zgjedh
// nga e njejta liste. Kjo porte e numeron; cdo migrim ne token e ul bazen dhe mbyllet me celes,
// njesoj si vulat (16->0). Numeron borderRadius INLINE me vlere qe NUK eshte var(...).
mat('radiuse_inline',
  'border-radius i shkruar me dore inline (jo token var(--r-*)) — shtresa e formes e paunifikuar',
  'Perdor token-in: borderRadius: var(--r-btn|--r-card|--r-panel|--r-pill). Shto token te ui-refine.css nese mungon.',
  // Total i borderRadius inline MINUS ata që përdorin token (var), me/pa thonjëza.
  // (Lookahead-i i thjeshtë dështon: \s* bën backtracking dhe kalon te hapësira — §9.2.)
  (_f, t) => numero(t, /borderRadius:/g) - numero(t, /borderRadius:\s*['"]?var\(/g))

// NGJYRA INLINE ([O60], 2 shtator 2026): ngjyra hex #RRGGBB/#RGB të shkruara me dorë në rreshta
// jo-koment, në vend të token-ave (var(--az-*)). Terminali mati katër të kuqe marke të përdorura
// si literale në qindra vende (#C42B0F, #E63312, #C42305, #C42A0E) sepse s'kishte nga çfarë të
// zgjidhej. Kjo porte e numeron; zëvendësimi me token e ul bazën — njësoj si vulat/radiuset.
mat('ngjyra_hex_inline',
  'ngjyrë hex e shkruar me dorë (#RRGGBB/#RGB) në vend të token-it var(--az-*) — paleta e paunifikuar',
  'Përdor token-in: var(--az-red|--az-red-deep|--az-yellow|--az-black|…). Shto te ui-refine.css nëse mungon.',
  (_f, t) => t.split(RRESHT).filter(r => !eshteKoment(r))
    .reduce((n, r) => n + (r.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || []).length, 0))

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

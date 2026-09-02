# AUTOPSIA E BLLOKUT IDENTITET — pse transplanti ka plagë

> Kërkuar nga Martinel më 2 shtator 2026, pas dhjetëra kalimesh që nuk e mbyllën problemin.
> Pyetja e tij: *"pse transplanti i bllokut ka kaq shumë plagë, pse nuk po mbyllen planet dhe
> pse nuk u harmonizua si një trup i vetëm."*
>
> Ky dokument nuk liston defekte. **Defektet janë simptoma.** Këtu matet MEKANIZMI që i prodhon,
> dhe pse tetë kalime të njëpasnjëshme nuk e mbyllën.

---

## 0. Përmbledhje në një paragraf

Blloku i identitetit (kartë → shpallje → shitës → biznes → pronar) **nuk ka pasur kurrë një
burim të vetëm të së vërtetës.** Çdo sipërfaqe vendos VETË cilat vula shfaq, si i quan, si i
stilon dhe cilin numër tregon. Kur dikush harmonizon, ai shton një shtresë të re pranë të
vjetrave në vend që t'i zëvendësojë — sepse asgjë nuk e detyron zëvendësimin. Rezultati janë
**pesë fjalorë paralelë** për të njëjtat gjashtë vula, **dy topologji navigimi** për të njëjtin
veprim, dhe **numra që nuk përputhen mes faqeve për të njëjtin subjekt.** Asnjë portë s'e ka
ndalur kurrë këtë, dhe asnjë audit — as i imi — nuk e ka matur të renderuarën.

---

## 1. PSE — gjashtë shkaqe strukturore, secili i matur

### 1.1 Fjalor i mbingarkuar: një klasë, dy kuptime
`.card-title` përdoret **37 herë**. Vetëm **2** janë tituj kartash; **35 janë koka seksioni**
në 7 skedarë (`/profile` 13, `/biznese` 6, `/referral` 6, `/listing/new` x3, `/listing/edit` 5).
CSS-ja u imponon të gjithëve `-webkit-line-clamp:1` dhe `overflow:hidden`.

**Pasoja mekanike:** kush rregullon kartën deformon 35 koka; kush rregullon kokat deformon
kartat. Dy punëtorë paralelë e kthejnë njëri-tjetrin **pafundësisht**. Nga jashtë kjo duket
saktësisht si *"ndryshimet kthehen tek e vjetra"* — dhe u audituar nëntë herë si problem cache-i.

**Ky është shkaku kryesor i planeve që nuk mbyllen.**

### 1.2 Zgjidhja shtohet PRANË problemit, kurrë NË VEND të tij
`IdentityBadges` u ndërtua si fjalori i vetëm. U lidh te **një sipërfaqe nga pesë**.
Commit-i e quajti veten **1/n** — dhe `n` nuk u përcaktua kurrë, ndaj nuk u mbyll kurrë.
Katër fjalorët e vjetër mbetën të gjallë krah tij:

| # | Sipërfaqja | Sistemi | Vula |
|---|---|---|---|
| 1 | `/listing` | `.schip .sch-*` | 6 |
| 2 | `/profile` | `.badge .b-*` | 7 |
| 3 | `/biznese/[id]` panel | `.bdg` + inline | 3 |
| 4 | `/biznese/[id]` publik | inline i pastër | 5 |
| 5 | `/u` | `chip()` te IdentityBadges | 6 |

Të pestët prodhojnë pothuajse të njëjtën pamje (`radius 9`, `padding 4px 10px`, `12.5px/700`)
— **të riprodhuar nga e para pesë herë.**

### 1.3 Asnjë portë s'e ka ndalur borxhin
Deri më 2 shtator 2026 nuk ekzistonte asnjë kontroll që ta numëronte këtë. `tsc`, testet dhe
build-i i shohin të pesta fjalorët si kod krejtësisht të vlefshëm. Roja u ndërtua vetëm tani
(`scripts/roja-unifikimit.mjs`) — dhe **edhe ajo numëronte vetëm 2 nga 5 fjalorët** derisa
fotot e pronarit nxorën të tretin.

Dhe porta as nuk mbyll: çdo shtytje te `main` kthen
`Bypassed rule violations — Required status check "TypeScript + Build" is expected`.
CI **raporton**, nuk **bllokon**.

### 1.4 Dy punëtorë mbi të njëjtat skedarë, pa kontratë
Sesioni në re shkruan kodin; ky terminal verifikon. Të dy shtyjnë **drejtpërdrejt te `main`,
pa PR**. Kur të dy prekin `profile/page.tsx` ose `BiznesPageClient.tsx` — dhe të dy i prekin,
sepse aty janë të gjitha vulat — fitimtari është i fundit që shtyu. Nuk ka konflikt që të
kapet; ka mbishkrim të heshtur.

### 1.5 Auditet lexuan BURIMIN, jo të renderuarën
Ky është faji im, dhe e kam përsëritur. Nga një `import` plus JSX nxora *"është i vendosur"*.
Rregullorja e kërkon të kundërtën (Rregulli 11: **sy live → kod → tjetër**); unë e ktheva
mbrapsht. Tri gjetje dolën vetëm kur e mata të renderuarën, dhe asnjë audit kodi s'do t'i
kishte kapur — sepse **në kod të dyja anët janë të sakta**:
- i njëjti person: `/profile` **2 Shpallje**, `/u` **0 Shpallje**
- tri formate për të njëjtën fushë: `qershor 2026 · Anëtar` / `2026 · Anëtar` / `2026 · Anëtar prej`
- dy topologji URL-je për "shiko publikun"

### 1.6 Organigrama nuk u transpozua kurrë si model
Modeli është **rrjet social**: tri entitete (person · biznes · shpallje), dy pamje (e brendshme
· e jashtme), tre shikues (pronar · vizitor · admin) — pra **18 kombinime**.
Nuk ekziston asnjë vend në kod ku ky model të jetë shkruar. Secila faqe e ka rizbuluar vetë —
dhe secila e rizbuloi ndryshe. Pa modelin e shkruar, harmonizim do të thotë vetëm
*"bëji të ngjashme me sy"*, që zgjat deri te ndryshimi tjetër.

---

## 2. ORGANIGRAMA — çfarë duhet të jetë, dhe ku është e këputur

### 2.1 Entitetet dhe pamjet
| Entiteti | Pamja e brendshme (paneli) | Pamja e jashtme (publike) |
|---|---|---|
| Personi | `/profile` | `/u/{id}` |
| Biznesi | `/biznese/{id}` | `/biznese/{id}?public=1` |
| Shpallja | `/listing/{id}/edit` | `/listing/{id}` |

### 2.2 Këputja e parë — dy topologji për të njëjtin veprim
- **Personi:** paneli dhe publiku janë **DY URL të ndryshme**. Banderola "Po e shikon profilin
  tënd publik" del me kushtin `isOwnProfile` — pra **sa herë** pronari bie te `/u/{id}`, edhe
  kur ka ardhur nga kërkimi ose nga "Profili yt". Nuk është parapamje; është etiketë e ngjitur.
- **Biznesi:** paneli dhe publiku janë **E NJËJTA URL**, me `?public=1`. Banderola del me
  `isOwner && asVisitor` — pra **vetëm pas klikimit**. Është parapamje e vërtetë, me dalje.

Dy modele mendore. Prandaj pronari e ndjen rrugën si të paharmonizuar edhe kur të dyja punojnë.

### 2.3 Këputja e dytë — i njëjti subjekt, numra të ndryshëm
| Sipërfaqja | "Shpallje" |
|---|---|
| `/profile` (paneli i personit) | **2** |
| `/u/{id}` (publiku i personit) | **0** |
| `/biznese/{id}` (paneli i biznesit) | **2** |
| çipi te `/listing` | **2 shpallje aktive** |

`/u` e shpjegon me *"Ky përdorues shet përmes biznesit të tij"*, pra është me qëllim. Por
pasoja është që **profili publik i pronarit i shfaqet vizitorit si i pazënë me punë.**

---

## 3. MATRICA LIVE — pronar kundrejt vizitori (matur, jo lexuar)

Pronari: shfletues i kyçur. Vizitori: kërkesë pa sesion ndaj prodhimit.

| Vula | `/profile` | `/u` pronar | `/u` vizitor | `/listing` | `/biznese` panel | `/biznese` publik |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Premium | po | po | po | po | po | po |
| Biznes | po | po | po | po | po | po |
| pikë | po | po | po | po | po | po |
| Nivel "Tregtar" | po | po | po | JO | JO | JO |
| Shitës aktiv | po | JO | JO | po | JO | po |
| Admin | po | JO | JO | JO | JO | JO |
| Bisedë private | JO | JO | JO | po | JO | JO |
| **Besueshmëria X/100** | JO | JO | JO | JO | JO | **PO — rrjedhje** |

**Asnjë kolonë nuk përputhet me një tjetër.** Gjashtë sipërfaqe, gjashtë përgjigje për pyetjen
"kush është ky shitës".

---

## 4. P0 — OPT-OUT-I I TRUST SCORE-IT DËSHTON TE `/biznese`

Gjetur nga instrumenti "pamja e vizitorit", i papërdorur më parë.

**Fakti:** llogaria ka `profiles.trust_score_visible = false`. HTML-ja që merr një vizitor
i pakyçur nga `/biznese/{id}` përmban:

    … Shitës aktiv 1  I ri  Besueshmëria 1 /100  2 Shpallje …

**Shkaku:** `BiznesPageClient.tsx:580` dhe `:878`

    {pronari?.trust_score_visible !== false && ( <TrustBadge …/> )}

`pronari` mbushet në një efekt (`:294`). Në renderimin e serverit ai është **null**, ndaj
`undefined !== false` jep **TRUE** dhe vula shfaqet. Roja **dështon e HAPUR**.

**Krahasim — të tjerat e bëjnë saktë**, sepse rojtojnë mbi objekt jo-null:
- `/u` `:433` → `profile.trust_score_visible !== false`
- `/listing` `:967` → `seller.trust_score_visible !== false`
- `IdentityBadges` `:50` → `subject.trust_score_visible !== false`

**Pasoja:** vlera del në **burimin e HTML-së** — pra e lexon çdo scraper, çdo view-source, çdo
`curl`, përgjithmonë — dhe çdo vizitor e sheh për çastin para hidratimit. Opt-out-i lidhet me
**Ligjin 124/2024 neni 19** (CLAUDE.md §2.1).

**Ndreqja:** `pronari != null && pronari.trust_score_visible !== false` — dështo i MBYLLUR
derisa e vërteta të dihet. Klasa **F7**: rrjeta e sigurisë fsheh defektin që duhet të kapte.

---

## 5. RENDI PËRFUNDIMTAR — dhe pse pikërisht ky rend

Çdo hap e bën të mundur të pasmin. Nis nga fundi dhe kthehesh mbrapsht.

**0 · P0 tani:** mbyll rrjedhjen e Trust Score-it te `/biznese` (§4). E pavarur nga gjithçka.

**1 · Ndaj fjalorin e mbingarkuar.** `.card-title` (2 karta) ndahet nga `.section-title`
(35 koka). *Pa këtë, çdo hap tjetër kthehet mbrapsht — §1.1.*

**2 · Shkruaj modelin, pastaj kodin.** Një skedar i vetëm që deklaron tri entitetet x dy pamjet
x tre shikuesit, dhe për secilën qelizë **cilat vula, cilat statistika, cilat veprime**. Pa këtë,
hapi 3 është përsëri "bëji të ngjashme me sy" — §1.6.

**3 · Zgjero `IdentityBadges` derisa të mbulojë GRUPIN REFERENCË.**
Referenca është `/profile` (urdhër i pronarit: *"profili i adminit pothuajse i ka të gjithë"*).
Mungojnë: `isAdmin`, `isVerified`, `isNewMember`, `rating`, `isPrivateChat`.
**Mos migro asgjë para këtij hapi** — përndryshe `/profile` humbet tri vula, pra regres.

**4 · Migro të pesta sipërfaqet** te komponenti i vetëm, dhe **fshi** `.schip .sch-*`,
`.badge .b-*` dhe `.bdg` në të njëjtin commit. Nëse mbeten, sëmundja rikthehet.

**5 · Unifiko rrugën publike.** Një etiketë, një pozicion, një mekanizëm. Rekomandim: modeli i
biznesit (parapamje me `?public=1`), sepse "Profili yt" duhet të të çojë te profili publik REAL,
jo te një faqe me banderolë të ngjitur.

**6 · Unifiko numrat dhe etiketat.** Një përkufizim i vetëm për "Shpallje" (personale kundrejt
biznesit — zgjidh dhe shkruaje), dhe një format i vetëm për "Anëtar".

**7 · Ul bazën e rojës** në të njëjtin commit me çdo hap:
`node scripts/roja-unifikimit.mjs --shkruaj-bazen`. Kështu përmirësimi mbyllet me çelës.

---

## 6. Kufijtë e kësaj autopsie — çfarë NUK e mata

- **Vizitorin e kyçur si përdorues TJETËR.** Kam vetëm pronarin dhe anonimin; vizitori i kyçur
  mund të ndryshojë (RLS mbi `profiles`).
- **Pamjen vizuale të vizitorit** — mata HTML-në e servuar, jo pikselët. Kontrasti, prekja
  dhe zhvendosja te pamja e vizitorit mbeten të pamatura.
- **`/messages`, `/favorites`, `/kategori/*`** — jashtë bllokut kartë-profil, pa matje.
- **Instrumenti gënjeu një herë gjatë kësaj matjeje:** kërkimi për tekstin `Admin` te `/u`
  përputhi emrin *"Administratori Alpazar"*. E kapa dhe e hoqa nga matrica; e shënoj që
  lexuesi tjetër të mos e besojë tabelën verbërisht.

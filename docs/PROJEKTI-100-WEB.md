# PROJEKTI "100% WEB" — specifikim i gatshëm për zbatim
### Matur live · prodhimi `614a91b` · 156 matje (39 faqe × 4 gjerësi) · rimatur pas punës së cloud-it

> Ky dokument nuk propozon shije. Çdo numër këtu është matur mbi prodhimin me
> Playwright + Chromium, në 390 / 768 / 1280 / 1920 px. Artefakti i papërpunuar:
> `.ops/autopsi/proporcioni.json`. Instrumenti: `scripts/autopsia-proporcionit.mjs`.

---

## 0. Puna e cloud-it (C-016) — e matur, jo e besuar

Cloud-i gjeti shkakun rrënjë dhe e rregulloi: vetëm ballina ishte ngritur në
`max-width:100%` mbi 1024px; çdo nënfaqe kapej te 1080px. E ngriti te tetë
kontejnerë. **Rimatja e vërteton — dhe tregon një pasojë të dytë.**

| Faqja | Shfrytëzimi @1920 | Karaktere / rresht |
|---|---|---|
| `/biznese` | 56% → **100%** ✅ | — |
| `/search/results` | 56% → **100%** ✅ | — |
| `/kategori` | 52% → **100%** ✅ | 137 → **254** ⚠ |
| `/kategori/[slug]` | 56% → **100%** ✅ | 149 → **254** ⚠ |
| `/kategori/[slug]/[qytet]` | 56% → **100%** ✅ | 149 → **254** ⚠ |
| `/listing/[id]` | 59% | 71 → **61** ✅ |

**Kjo është prova empirike e tezës së §1:** zgjerimi i guaskës pa e ndarë kolonën
e tekstit e bën leximin më të keq. Cloud-i e bëri gjysmën e saktë; gjysma tjetër
është pikërisht ky dokument.

**Të jem i drejtë për ashpërsinë:** te `/kategori` numri 254 vjen nga **një
nënititull i vetëm** (`.seo-sub`, 1776px @14px) — i shëmtuar, por jo mur teksti.
Barra e vërtetë e leximit është gjetkë (§1.1).

**Mbetën të pandryshuara** (cloud-i i la me qëllim, dhe pati të drejtë që nuk i
zgjeroi): `/referral` 56%, `/search` 56%, `/asistent` 47%, `/premium` 47%,
`/notifications/[id]` 40%, dhe të gjitha faqet e tekstit.

---

## 1. Zbulimi që e ndryshon detyrën

Deri tani problemi quhej "faqet nuk zgjerohen në desktop". **Matja tregon se
janë DY probleme të kundërta, në të njëjtën platformë:**

| Faqja | Shfrytëzimi @1920 | Karaktere për rresht |
|---|---|---|
| `/referral` | 56% | **190** |
| `/search` | 56% | **169** |
| `/kategori/[slug]` | 56% | **149** |
| `/takedown` | **100%** | **142** |
| `/kategori` | 52% | **137** |
| `/rreth-nesh` | 42% | **120** |
| `/cookies` | 42% | **119** |
| `/privatesia` | 42% | **117** |
| `/siguria` | 42% | **113** |
| `/moderimi/[id]` | **100%** | **107** |
| `/kushtet` | 33% | **92** |
| `/listing/[id]` | 59% | **71** ✅ |

Brezi i rehatshëm i leximit është **45–75 karaktere**; mbi 90 syri e humb
rreshtin kur kthehet majtas. **Vetëm një faqe nga dymbëdhjetë është brenda tij.**

### 1.1 Ku është barra e VËRTETË e leximit

Një numër i madh mbi një nënititull të vetëm nuk është njësoj me një numër mesatar
mbi tridhjetë paragrafë. Renditur sipas **sa paragrafë** e kalojnë kufirin 90ch:

| Faqja | ch | Paragrafë | **Mbi 90ch** |
|---|---|---|---|
| `/privatesia` | 117 | 31 | **31 — të gjithë** |
| `/kushtet` | 92 | 33 | **17** |
| `/cookies` | 119 | 15 | **15 — të gjithë** |
| `/rreth-nesh` | 120 | 5 | 5 |
| `/referral` · `/takedown` | 190 · 142 | 2 | 2 |
| `/kategori` × 3 | 254 | **1** | 1 *(nënititull)* |
| `/search` · `/siguria` · `/moderimi/[id]` | 169 · 113 · 107 | 1 | 1 |
| `/listing/[id]` | **61** | 1 | **0** ✅ |

**Tri faqet ligjore mbajnë 63 nga 79 paragrafët problematikë** — dhe janë
pikërisht ato që përdoruesi duhet t'i lexojë vërtet. Aty duhet nisur.

Dhe vini re `/takedown` dhe `/moderimi/[id]`: **mbushin 100% të ekranit dhe
pikërisht prandaj lexohen keq** — 142ch dhe 107ch. Të zgjerosh çdo faqe do t'i
përkeqësonte.

### Shkaku i përbashkët i të dyja problemeve

Sot **guaska e faqes ËSHTË kolona e tekstit**. Një `max-width` i vetëm në piksel
duhet të bëjë dy punë që përjashtojnë njëra-tjetrën: të mbushë ekranin për
rrjetat, dhe të ngushtojë rreshtin për leximin. S'i bën dot të dyja.

Prandaj `800px` jep **119ch** te `/privatesia` (fonti i vogël), ndërsa `640px`
jep **92ch** te `/kushtet` — i njëjti qëllim, dy rezultate, sepse pikseli nuk
di gjë për madhësinë e shkronjës.

---

## 2. Parimi i propozuar — dy shtresa, jo një

```
┌─ .wrap ─────────────────── guaska: e gjerë, mbush ekranin ─┐
│                                                             │
│   ┌─ .lexim ───────── kolona e tekstit: max-width: 68ch ─┐   │
│   │  paragrafë, lista, kushte, politika                  │   │
│   └──────────────────────────────────────────────────────┘   │
│                                                             │
│   ┌─ .rrjete ──── mbush guaskën, kartat 200–300px ───────┐   │
│   │  karta shpalljesh, bizneset, kategoritë              │   │
│   └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Rregulla 1 — teksti kufizohet me `ch`, kurrë me `px`.**
`max-width: 68ch` jep 45–75 karaktere në çdo madhësi fonti dhe çdo ekran,
automatikisht. Kjo është e vetmja njësi që e di se çfarë po kufizon.

**Rregulla 2 — rrjetat mbushin guaskën.**
`repeat(auto-fill, minmax(220px, 1fr))`. Matja e sotme e vërteton se funksionon:
`/kategori/[slug]` jep karta 171px në telefon dhe 329px në desktop — rritje
natyrale, pa asnjë pikë thyerjeje të shkruar me dorë.

**Rregulla 3 — guaska ka një kufi të vetëm, të përbashkët.**
`--gjeresia-max: 1280px` te `:root`. Një vend, jo tetëmbëdhjetë.

**Pse `68ch` e jo `65` a `72`:** 68 e vendos mesataren e matur të gjerësisë së
shkronjës sonë (Plus Jakarta Sans) në mesin e brezit 45–75, me hapësirë për
gjuhët me fjalë të gjata (gjermanisht te përkthimet).

---

## 3. Gjendja e matur — të 39 faqet

Kolonat: shfrytëzimi i ekranit në secilën gjerësi · karaktere për rresht @1920 ·
elementi që e ngushton (**fyti**) me skedar dhe rresht.

### 3.1 Faqe TEKSTI — problemi është rreshti tepër i gjatë

| # | Faqja | 390 | 768 | 1280 | 1920 | ch | Fyti — skedar:rresht | Veprimi |
|---|---|---|---|---|---|---|---|---|
| 1 | `/kushtet` | 100% | 83% | 50% | 33% | **92** | `.wrap` 640px — `kushtet/page.tsx:7` | guaskë 1280 + `.lexim{68ch}` |
| 2 | `/privatesia` | 100% | 100% | 63% | 42% | **117** | `.wrap` 800px — `privatesia/page.tsx:7` | idem |
| 3 | `/cookies` | 107%¹ | 100% | 63% | 42% | **119** | `.wrap` 800px — `cookies/page.tsx:9` | idem |
| 4 | `/siguria` | 100% | 100% | 63% | 42% | **113** | `.wrap` 800px — `siguria/page.tsx:7` | idem |
| 5 | `/rreth-nesh` | 100% | 100% | 63% | 42% | **120** | `.wrap` 800px — `rreth-nesh/page.tsx:7` | idem |
| 6 | `/takedown` | 100% | 100% | 100% | 100% | **142** | — (pa kufi) | **shto** `.lexim{68ch}`; guaska rri |
| 7 | `/moderimi/[id]` | 100% | 100% | 100% | 100% | **107** | — (pa kufi) | idem |
| 8 | `/kontakt` | 100% | 100% | 63% | 42% | — | `.wrap` 800px — `kontakt/page.tsx:50` | guaskë 1280; formulari `.lexim` |

¹ `/cookies` @390 = 107% është një tabelë që rrëshqet brenda. **`dalje-dokumenti = 0`** — jo defekt.

### 3.2 Faqe RRJETE — problemi është guaska e ngushtë

| # | Faqja | 390 | 768 | 1280 | 1920 | Fyti — skedar:rresht | Veprimi |
|---|---|---|---|---|---|---|---|
| 9 | `/search` | 100% | 99% | 84% | **56%** | `.wrap` 480→760→1080 — `search/page.tsx:132-134` | guaskë 1280; rreshtin e ndihmës `.lexim` (**169ch**) |
| 10 | `/search/results` | 100% | 99% | 84% | **56%** | `.wrap` 1080px — `search/results/page.tsx` | guaskë 1280 |
| 11 | `/biznese` | 100% | 99% | 84% | **56%** | `.biz-wrap` 480→760→1080 — `biznese/page.tsx:101` | guaskë 1280 |
| 12 | `/kategori` | 100% | 100% | 78% | **52%** | `.seo-wrap` 960px — `kategori/page.tsx:77` | guaskë 1280; teksti SEO `.lexim` (**137ch**) |
| 13 | `/kategori/[slug]` | 100% | 100% | 84% | **56%** | `.seo-wrap` 1040px — `kategori/_shared.tsx:7` | idem (**149ch**) |
| 14 | `/kategori/[slug]/[qytet]` | 100% | 100% | 84% | **56%** | `.seo-wrap` 1040px — `kategori/_shared.tsx:7` | idem (**149ch**) |
| 15 | `/referral` | 100% | 99% | 84% | **56%** | `.wrap` 480px — `referral/page.tsx:25` | guaskë 1280; teksti `.lexim` (**190ch — më i keqi**) |

**Dëshmi se rrjetat funksionojnë kur u jepet vend:** `/kategori/[slug]` →
`listing-card` **171px @390** dhe **329px @1920**; `seo-cat-grid` → **2 kolona
@390**, **6 kolona @1920**. Mekanizmi është i shëndetshëm; i mungon vetëm hapësira.

### 3.3 Faqe që MBUSHIN tashmë — mos i prek guaskën

| # | Faqja | 1920 | Shënim |
|---|---|---|---|
| 16 | `/` | 100% | `.wrap` me tri pika thyerjeje te `HomeClient.tsx:518,666,683` — **modeli i saktë** |
| 17 | `/biznese/[id]` | 100% | ka `@media` të vetën |
| 18 | `/u/[id]` | 100% | mbush |
| 19 | `/notifications` | 100% | mbush |

### 3.4 Faqe të VEÇANTA

| # | Faqja | 390 | 1280 | 1920 | Fyti | Veprimi |
|---|---|---|---|---|---|---|
| 20 | `/asistent` | 100% | 70% | **47%** | `.albi-page` 480→760 — `AlbiChat.tsx:259-260` | bisedë: **68ch është E DREJTË**; shto vetëm `@media≥1280 → 900px` |
| 21 | `/notifications/[id]` | 100% | 59% | **40%** | `.nd-wrap` 760px — `notifications/[id]/page.tsx:54` | detaj njoftimi: 760px **e drejtë**; mos e zgjero |
| 22 | `/listing/[id]` | 125%¹ | 89% | 59% | `.wrap` 1140px | **71ch — i vetmi i saktë.** Mos e prek kolonën; zgjero vetëm rrjetën e ngjashme |
| 23 | `/premium` | 100% | 70% | **47%** | `.wrap` 900px | planet janë karta → guaskë 1280, rrjetë 3 kolona |
| 24 | `not-found` | 100% | 100% | 100% | — | mbush; kthen saktë `404` |

¹ `/listing/[id]` @390 = 125% është karuseli i fotove që rrëshqet brenda. **`dalje = 0`** — jo defekt.

### 3.5 Faqe që NUK U MATËN — kërkojnë sesion (15)

Këto kthejnë guaskën e hyrjes për një vizitor të dalogur. **Nuk i shënoj as si
të mira as si të këqija** — kjo ishte pikërisht gabimi që pronari kapi. Kufiri
i tyre është marrë nga KODI, i shënuar si i tillë:

| # | Faqja | Kufiri nga kodi | `@media` | Veprimi i propozuar |
|---|---|---|---|---|
| 25 | `/profile` | `.wrap` **480px** — `profile/page.tsx:486` | **0** | guaskë 1280; tabet rrjetë |
| 26 | `/messages` | `.page` **480px** — `messages/page.tsx:747` | **0** | dy kolona ≥1024 (lista + biseda) |
| 27 | `/listing/new` | `.wrap` **480px** — `listing/new/styles.ts:4` | **0** | formulari `.lexim`; parapamja krah tij ≥1280 |
| 28 | `/billing` | `.wrap` (nga `HomeClient`) | 0 | guaskë 1280; planet rrjetë |
| 29 | `/oferta` | — | 0 | guaskë 1280 |
| 30 | `/favorites` | — | 0 | rrjetë si feed-i |
| 31 | `/saved-searches` | — | 0 | rrjetë |
| 32 | `/te-dhenat-mia` | — | 0 | `.lexim` (tekst ligjor) |
| 33 | `/profile/analytics` | — | 0 | guaskë 1280; grafikët zgjerohen |
| 34 | `/biznese/new` | — | 0 | formular `.lexim` |
| 35 | `/biznese/[id]/edit` | — | 0 | formular `.lexim` |
| 36 | `/biznese/[id]/analytics` | — | 0 | guaskë 1280 |
| 37 | `/listing/[id]/edit` | — | 0 | formular `.lexim` |
| 38 | `/auth/login` | — | 0 | qendër, `.lexim` |
| 39 | `/auth/callback` | — | 0 | vetëm ridrejtim — pa punë |
| 40 | `/admin` | `.wrap` 700px+ — `admin/page.tsx` | **1** | **shih §4** |

---

## 4. Nënfaqet — 24 sipërfaqe që nuk janë rrugë

Pronari kërkoi shprehimisht: *"çdo nënfaqe, çdo gjë që doli ose nuk doli"*.

### 4.1 Paneli i administrimit — 13 tabe, asnjëra me URL

`dash · njerez · broadcast · referrals · payments · invoices · plans · methods ·
radha · config · roles · health · preq`

**Matur:** `admin/page.tsx:260` → `useState('dash')`; **zero** `pushState`,
`useSearchParams`, `useRouter`.

**Pasoja, për një panel që është VETËM web:**
- asnjë tab nuk ruhet dot si faqeshënues
- "prapa" e nxjerr nga paneli, jo te tabi i mëparshëm
- rifreskimi kthen gjithmonë te `dash`
- një tab nuk i dërgohet dot kolegut me lidhje

**Veprimi:** `?tab=` te URL-ja, me `useSearchParams` + `replaceState`. 13 nënfaqe
bëhen 13 adresa.

### 4.2 Tabet e tjera — i njëjti defekt

| Sipërfaqja | Tabe | URL |
|---|---|---|
| `/profile` | 5 — `profile · listings · saved · messages · shop` | **JO** |
| `/biznese/[id]` | 3 — `home · listings · reviews` | **JO** |

**Gjithsej 21 nënfaqe pa adresë.**

### 4.3 Modalet dhe fletët — 14 skedarë

`AgeGate` · `CookieBanner` · `Onboarding` · `AiFloat` · `ImageCarousel` ·
`PremiumUpsell` · `ReportSheet` · `admin/page` · `DosjaLigjore` · `auth/login` ·
`HomeClient` · `ListingPageClient` · `messages/page` · `search/results/page`

**Kërkesa për secilin:** `role="dialog"` + `aria-modal="true"` + Escape +
fokusi kthehet te butoni që e hapi + **`visibility:hidden` kur mbyllet**.
Modeli i saktë ekziston tashmë te `search/results/page.tsx:714` — `{filtersOpen && (…)}`,
pra as nuk montohet kur mbyllet. Kjo duhet të jetë rregulli për të gjithë.

### 4.4 Gjendjet e faqes

`app/error.tsx` · `app/global-error.tsx` · `app/not-found.tsx`
**Vetëm `not-found` u matë** (mbush, kthen `404`). Dy të tjerat nuk u nxitën dot
— **shih §6**.

---

## 5. Ç'nuk lidhet me gjerësinë, por doli nga auditet

Këto nuk janë punë "100% web", por janë të hapura dhe do të humbnin po të mos
shkruheshin këtu.

| # | Gjetja | Dëshmia | Kujt i takon |
|---|---|---|---|
| A | **`.listings-grid{padding-bottom:104px}`** hap **113px vrimë NË MES** të ballinës në ≤430px | matur: kuti 433px / përmbajtje 320px @390 e @430; **0px @431** | cloud — `ui-refine.css:342` |
| B | Rreshtat e njoftimeve janë `<div>` pa `href` → rruga e re `/notifications/[id]` **nuk ndahet dot me lidhje** | `read_page` mbi prodhim | cloud |
| C | **X/Twitter → 404** në fund të çdo faqeje | `curl -L`; pesë rrjetet e tjera 200 | pronari |
| D | **15 `toLocaleDateString` + ~14 `toLocaleString`** ende varen nga ICU | lista te T-031 | cloud (`admin`, `billing`) |
| E | **NIPT "(në regjistrim)"** shfaqet publikisht në çdo faqe | `read_page` × 3 faqe | pronari |
| F | **`admin_pin = 000000`** në prodhim | vetë paneli e paralajmëron | pronari |
| G | Citimi ligjor **9887/2008 vs 124/2024** | 6 vende kundër 1 | pronari + jurist |
| H | `color-contrast` — **19 nyje / 7 faqe** | axe-core, matje e freskët | cloud |
| I | **257 hex me dorë / 14 tokene**; **35 grupe** që syri s'i dallon, 887 përdorime | CIE76 | cloud |
| J | **20 madhësi shkronjash**, 14 rreze qoshesh | matur | cloud |
| K | **TBT 2–15s** në telefon | Lighthouse me mbytje | i pandarë |

---

## 6. Ç'NUK u matë — deklaruar, jo fshehur

| Fusha | Pse |
|---|---|
| 15 faqet pas hyrjes, si vetvete | Playwright s'ka sesion; kopjimi i profilit u bllokua nga klasifikuesi |
| Klikimi i nënbutonave pas hyrjes | `javascript_tool` i ekstensionit ngrin renderuesin |
| `app/error.tsx`, `global-error.tsx` | s'u nxitën dot pa shkaktuar gabim real |
| Gjendjet `:hover` / `:focus-visible` të ngjyrave | kërkon skenar ndërveprimi për secilën |
| Lexues ekrani real (NVDA / VoiceOver) | gjykim njerëzor, jo matje |
| Zmadhim 400% (WCAG 1.4.10 reflow) | u matë 200%; 400% jo |
| Shtypja (print CSS) | nuk u prek fare |
| Gjuhët e tjera (29 opsione te ndërprerësi) | u matë vetëm shqipja |

---

## 7. Rendi i zbatimit

Renditur sipas **fitimit për orë pune**, jo sipas radhës në dokument.

| Faza | Puna | Prek | Kosto |
|---|---|---|---|
| **F1** | `:root{--gjeresia-max:1280px}` + klasat `.lexim{max-width:68ch}` dhe `.rrjete` te `ui-refine.css` | 1 skedar | e vogël |
| **F2** | Hiq vrimën: `.listings-grid` → `.listings-grid:last-of-type` | 1 rresht | **një rresht** |
| **F3** | 8 faqet e tekstit (§3.1): guaska → `--gjeresia-max`, teksti → `.lexim` | 8 skedarë | e mesme |
| **F4** | 7 faqet e rrjetës (§3.2): guaska → `--gjeresia-max` | 7 skedarë | e mesme |
| **F5** | 13 tabet e adminit → `?tab=` | 1 skedar | e mesme |
| **F6** | 8 tabet e profilit dhe biznesit → `?tab=` | 2 skedarë | e vogël |
| **F7** | 15 faqet pas hyrjes (§3.5) | 15 skedarë | e madhe |
| **F8** | Modalet: `visibility:hidden` + Escape + kthim fokusi | 14 skedarë | e madhe |

**F1+F2 janë një skedar dhe një rresht, dhe hapin rrugën për gjithçka tjetër.**

---

## 8. Si provohet secila fazë — pa "e verifikova"

Çdo fazë ka një komandë që e provon. Pa numër, puna nuk quhet e mbyllur.

```bash
# Guaska dhe rreshti — për ÇDO faqe, në 4 gjerësi
node scripts/autopsia-proporcionit.mjs
#   pritet: asnjë faqe teksti mbi 75ch; asnjë faqe rrjete nën 85% @1920

# Aksesueshmëria — motori i Deque, jo matësi i shtëpisë
node scripts/autopsia-axe.mjs
#   pritet: color-contrast 19 → 0; asnjë rregull tjetër

# Kurthet e fokusit dhe gjendjet e hapura
node scripts/autopsia-gjendjeve-interaktive.mjs
#   pritet: 0 ndalesa fokusi te përmbajtje e fshehur

# Zmadhim 200%, fokusi, prefers-reduced-motion
node scripts/autopsia-gjendjeve.mjs

# Prekja — dy kufijtë, AA dhe AAA veç e veç
node scripts/autopsia-prekjes.mjs

# Roja e unifikimit — numrat lëvizin VETËM poshtë
node scripts/roja-unifikimit.mjs
```

**Kufi i instrumentit, i thënë hapur:** `autopsia-proporcionit.mjs` i shënon
15 faqet pas hyrjes si `GUASKË` dhe **nuk i numëron**. Derisa të zgjidhet sesioni,
ato provohen vetëm me sy nga pronari.

---

## 9. Tri gabime të miat në këtë matje — që të mos përsëriten

1. **`/cookies` 107%, `/listing/[id]` 125% dhe 124%** dukeshin dalje jashtë
   ekranit. **`dalje-dokumenti = 0`** në të treja — janë rripa që rrëshqasin
   brenda. Nuk u raportuan.
2. Një version i mëparshëm i nxirrte kufijtë si `min(çdo max-width në skedar)` —
   ngatërronte kufirin e një avatari me atë të faqes dhe jepte "112px". U hodh.
3. Skriptet ishin vetëm në degë; kur kalova te `main` ata u fshinë dhe unë lexoja
   një `axe.json` **trforë të vjetër**. Për pak sa nuk raportova një regres të
   rremë. Tani janë te `main`, dhe matja dështon me zë.

---

*Artefaktet: `.ops/autopsi/proporcioni.json` (156 matje) · `axe.json` ·
`prekja.json` · `gjendjet.json` · `gjendjet-interaktive.json` · `mbulimi.json` ·
144 screenshot.*

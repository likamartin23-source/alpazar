# PLANI OPTIK — Alpazar 100% web-app, i ndërtuar për syrin e njeriut

> Autor: TERMINAL · 5 shtator 2026 · për zbatim nga CLOUD (code)
> Baza: matje live në prodhim (`alpazar.vercel.app`), shfletues i pastër, 4 gjerësi ekrani.
> Instrumentet: `scripts/autopsia-optike.mjs` (matja) + `scripts/optika-analiza.mjs` (analiza).
> Të dhënat e papërpunuara: `.ops/autopsi/optika.json`.

---

## 0. PSE KY PLAN EKZISTON — porosia e pronarit, e përkthyer në inxhinieri

Pronari e formuloi kështu (5 shtator, pas auditit të tij vizual):

> «Nëse tabelat nuk mund të zmadhohen, atëherë në sfond zmadhohet faqja bazë, ndërsa tabelat
> dhe shkrimet (butonat, gjithçka) zmadhohen në mënyrë profesionale dhe proporcionale, që të
> jenë të dukshme dhe të kuptueshme. Ndërsa te disa vende zmadhimi ka qenë joproporcional,
> sepse syri i njeriut nuk mund ta kapë gjithë pamjen kur është e madhe.»

Kjo NUK është kërkesë shijeje. Është, fjalë për fjalë, formulimi popullor i dy ligjeve optike
që kanë numra dhe standarde:

1. **Ligji i këndit vizual.** Syri nuk sheh piksele — sheh KËNDE. I njëjti 12px është i
   lexueshëm në telefon (afër, piksel i vogël) dhe i vogël në monitor 24" (larg, piksel i madh).
   Prandaj "zmadhohet gjithçka proporcionalisht" = madhësia në pikselë duhet të ndjekë
   gjerësinë e ekranit, që KËNDI të mbetet konstant.
2. **Ligji i konit të rehatisë.** Vetja qendrore e shikimit (±15°) është ajo që lexon; përtej
   ±30° kërkohet rrotullim koke. Prandaj një kolonë teksti që shtrihet 1900px NUK lexohet dot
   — pikërisht ajo që pronari e quajti "syri nuk e kap dot".

Të dyja bashkë japin doktrinën e këtij plani: **guaska mbush ekranin, përmbajtja shkallëzohet,
kolona e leximit rri brenda konit.**

---

## 1. METODA — si u mat, që kushdo ta përsërisë

Çdo numër këtu është marrë **live nga platforma në prodhim**, jo nga leximi i kodit.

| Element | Si matet | Pse kështu |
|---|---|---|
| Madhësia e shkronjës | `getComputedStyle` mbi ÇDO nyje teksti, e peshuar me numrin e karaktereve | Një `<h1>` me 3 fjalë s'duhet të peshojë sa 400 fjalë trup |
| Shtrirja e tekstit | `Range.getBoundingClientRect()` mbi glifet | Kutitë gënjejnë; glifet jo (kurthi #2 i autopsisë së marzheve) |
| Këndi vizual | px → mm (nga mm/px i pajisjes reale) → arcmin, në distancën tipike të shikimit | E vetmja metrikë që lidh ekranin me retinën |
| Masa | gjerësia e rreshtit / gjerësia mesatare e karakterit | Karaktere për rresht, jo pikselë |
| Caqet e prekjes | `min(width,height)` e çdo elementi të klikueshëm | Përkufizimi i WCAG 2.5.8 |

**Pajisjet e modeluara** (mm/px real, jo hamendje):

| Ekrani | CSS px | Gjerësi fizike | mm/px | Distanca e shikimit |
|---|---|---|---|---|
| Telefon | 390 | 71.4 mm | 0.1831 | 350 mm |
| Laptop 13" | 1280 | 286 mm | 0.2234 | 550 mm |
| Desktop 24" | 1920 | 531 mm | 0.2766 | 600 mm |
| Monitor 27" | 2560 | 597 mm | 0.2332 | 700 mm |

**Kurthi që kapa te vetja ime** (dhe pse numrat e parë u hodhën poshtë): xhiroja e parë përdori
profilin e ruajtur të auditit. Ai profil kishte (a) sesion të skaduar → 6 rrugë matën guaskën e
login-it, dhe (b) një **404 të ruajtur në cache për `/_next/static/chunks/webpack-*.js`** → në
ato faqe JS-ja nuk ekzekutohej fare dhe faqja s'hidratohej. E zbulova sepse `/biznese` dukej
bosh; me shfletues të pastër faqja rendërohet normalisht (biznesi "Makina" është aty, 8 karta).
**Mësim për protokollin: çdo matje referencë bëhet me shfletues të pastër (`PROFIL=pa`); profili
i ruajtur përdoret VETËM për rrugët pas hyrjes, dhe cache-i i tij pastrohet para çdo xhiroje.**

### Burimet shkencore
- **ISO 9241-303** (ergonomia e ekraneve): lartësia e karakterit ≥ **16′** absolut, **20–22′** për
  punë të zgjatur; formula `lartësi_mm ≥ distancë_mm × 0.00582` për 20′.
- **WCAG 2.2 SC 2.5.8** (AA): cak ≥ **24×24 px**; **SC 2.5.5** (AAA): **44×44 px**.
- **WCAG 2.2 SC 1.4.4 / 1.4.12**: teksti duhet të zmadhohet 200% pa u thyer; lartësi rreshti ≥1.5.
- **Bringhurst / Dyson & Haselgrove**: masa **45–75 karaktere**, optimum ~66; sakadat 6–9 karaktere.
- **Ergonomia e fushës pamore**: koni parësor i rehatisë **±15°**, kufiri pa lëvizje koke **±30°**.

---

## 2. DIAGNOZA — çfarë tregoi matja

### 2.0 Verdikti në një rresht

**52 matje (13 faqe × 4 ekrane). 43 prej tyre — 83% — janë NËN kufirin absolut 16′ të ISO 9241-303.
NË BREZIN E REHATISË 20′+ NUK BIE ASNJË E VETME. Rritja e shkronjës nga 390px në 2560px është 0%
në 10 nga 13 faqe.** Platforma nuk ka defekt tipografik të vogël — ajo thjesht nuk shkallëzohet fare.

### 2.1 Gjetja qendrore: tipografia është E NGRIRË

Madhësia e trupit të tekstit është **e njëjtë në 390px dhe në 2560px**. Faqja zgjerohet, shkronja jo.
Kjo është, saktësisht, ankesa e pronarit — e matur.

Pasoja në kënd vizual (lartësia e shkronjës së madhe = **0.750 × font-size**, e MATUR live me canvas mbi fontin e vërtetë të aplikacionit — Plus Jakarta Sans: cap 0.750, x-height 0.540, gjerësi mesatare karakteri 0.5606em):

| Ekrani | 12px real | Kërkesa ISO 16′ | Kërkesa ISO 20′ | Verdikti |
|---|---|---|---|---|
| Telefon 390 | **15.5′** | 12.4 px | 15.4 px | në kufi |
| Laptop 1280 | **12.1′** | 15.9 px | 19.9 px | nën minimum |
| Desktop 1920 | **13.7′** | 14.0 px | 17.5 px | nën minimum |
| Monitor 2560 | **9.9′** | 19.4 px | 24.2 px | **gjysma e minimumit** |

Teksti më i vogël në platformë është **8px** (`ListingCard.tsx`, 2 vende) → **9.5′ në 1920**:
më pak se gjysma e brezit të rehatisë. Për krahasim, 8px në desktop është si të lexoje
një shkronjë 2mm nga 60cm larg.

### 2.2 Pse ndodhi: nuk ka shtresë tokenësh

- **931 `fontSize` të ngurta inline** në `.tsx` (dukuri, jo rreshta — `grep -rno`; 930 është numri i rreshtave).
- **0 përdorime të `clamp()`** në CSS-in e aplikacionit.
- Prandaj asnjë ndryshim qendror nuk mund ta shkallëzojë platformën: çdo madhësi është e
  ngulitur në komponentin e vet.

Kjo shpjegon edhe pse pikërisht KATËR zonat që përmendi pronari janë më të prekurat — ato janë
komponentët me tekstin më të vogël në gjithë bazën:

| Zona e ankuar | Skedari | Madhësitë reale |
|---|---|---|
| Karta/koka e shpalljes | `app/components/ListingCard.tsx` | **8px ×2**, 11, 12, 18, 26 |
| Butonat në fund të platformës | `app/components/SiteFooter.tsx` | **10px**, 11 ×2, 13, 19 |
| Profili i jashtëm i biznesit | `app/biznese/[id]/BiznesPageClient.tsx` | **10px ×4**, 11 ×9, 12 ×15, 13 ×15 |
| Faqja e detajit të shpalljes | `app/listing/[id]/ListingPageClient.tsx` | **10px ×2**, 11 ×8, 12 ×10, 13 ×11 |

### 2.3 Masa: kolona e leximit shpërthen në ekran të madh

Në 1920 dhe 2560: `/premium` **118 karaktere/rresht**, `/kushtet` **99 ch** — kundrejt kufirit
75. Kjo është ana tjetër e së njëjtës monedhë: guaska u zgjerua (mirë), por teksti brenda saj
nuk u kufizua në kolonë leximi (keq). Është saktësisht "joproporcionale" e pronarit.

### 2.4 Caqet e prekjes nën standard
`/kushtet` dhe `/rreth-nesh` në 1920: **caku mesatar 15–16px**, me 5–8 caqe nën 24px.
Nën AA-në e WCAG 2.2.

### 2.5 Defekt i veçantë, i pavarur nga optika: ikonat e kategorive dalin si TEKST
Në `/kategori` (faqe publike, e indeksueshme nga Google) HTML-i i shërbyer përmban:
`<span class="seo-cat-ico">device-mobile</span>` — pra emri i ikonës shtypet si tekst.
**Shkaku i saktë:** `app/kategori/page.tsx:57` → `{c.icon || '🏷️'}`, ku `c.icon` mban një
slug Tabler (`device-mobile`), jo emoji.
**Kurth i dyti:** edhe pas ndreqjes së rendërimit, **12 nga 16 glifet mungojnë** te fonti i
subsetuar (`app/tabler-icons-subset.css`, 86 glife): mungojnë `car, home, shirt, armchair, paw,
tools, briefcase, salad, plane, ball, book, device-gamepad, dots`. Pra ndreqja ka DY hapa.

---

## 3. DOKTRINA — tri shtresat

Çdo pjesë e platformës i përket njërës shtresë. Kjo zgjidh kontradiktën e dukshme mes
"mbush ekranin" dhe "syri nuk e kap dot".

### Shtresa A — SKANIM (rrjeta kartash, lista, panele)
Syri i skanon me shikim periferik; nuk lexon rresht pas rreshti.
- Guaska: `width:100%` + padding i lëngshëm `clamp(16px, 4vw, 72px)`.
- **Qelizat rriten, nuk shumohen pafund:**
  `grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 18vw, 420px), 1fr))`
  → në 2560 merr ~6 karta 420px, jo 9 karta të vogla.
- Tipografia brenda kartës: nga shkalla e lëngshme (§4), jo px të ngurta.

### Shtresa B — LEXIM (detaj, ligjore, bisedë, formularë)
- Kolona: `max-width: 66ch` — jo px. Sepse `ch` rritet vetë bashkë me shkronjën:
  në 1280 ≈ 660px, në 1920 ≈ 760px, në 2560 ≈ 860px. Gjithnjë 66 karaktere, gjithnjë brenda
  konit ±15° (që në 1920 është 1163px).
- Formularët: gjerësia e fushës sipas përmbajtjes së pritur (kod postar ≠ përshkrim), jo 100%.

### Shtresa C — KONTROLL (butona, çipa, fusha, ikona)
- Lartësia: `clamp(44px, 2.6vw, 56px)`; kurrë nën 24px (AA), 44px në prekje (AAA).
- Ikona: `1em` (ndjek shkronjën), jo px fikse.
- Distanca mes caqeve ≥ 8px, që rrethi 24px i WCAG-ut të mos përplaset.

---

## 4. SHKALLA E LËNGSHME — derivimi, jo shija

Kërkesa minimale nga §2.1 (px që japin 20′ në secilin ekran): **15.4 @390 · 19.9 @1280 ·
17.5 @1920 · 24.2 @2560**.

Kërkojmë një drejtëz `f(vw)` që i plotëson të gjitha. Duke kaluar nga (390, 16) te (2560, 26):
pjerrësia = 10/2170 = 0.004608 px/px = **0.4608vw**; ndërprerja = 16 − 0.004608×390 = **14.2px**.

Kontrolli: f(390)=16.0 ✓ · f(768)=17.7 · f(1280)=**20.1** ✓ · f(1920)=**23.0** ✓ · f(2560)=**26.0** ✓
— të katër mbi kërkesën 20′.

```css
:root{
  /* baza: 16px në telefon → 26px në monitor 27". Rrënja mbetet rem → zoom-i i shfletuesit punon (WCAG 1.4.4) */
  --fs-baza: clamp(1rem, 0.8875rem + 0.461vw, 1.75rem);   /* maksimumi 28px — ultrawide 3440 kërkon 26.7px për 20′ */

  /* shkallë modulare 1.2 (Minor Third — e ngjeshur, e përshtatshme për UI me shumë të dhëna) */
  --fs-meta:  calc(var(--fs-baza) / 1.2);    /* etiketa, meta — një hap poshtë, ende ≥16′ */
  --fs-trup:  var(--fs-baza);
  --fs-tit-s: calc(var(--fs-baza) * 1.2);
  --fs-tit-m: calc(var(--fs-baza) * 1.44);
  --fs-tit-l: calc(var(--fs-baza) * 1.728);
  --fs-tit-xl:calc(var(--fs-baza) * 2.074);

  /* hapësira e lëngshme — e njëjta logjikë */
  --hap-1: clamp(4px,  0.30vw,  8px);
  --hap-2: clamp(8px,  0.60vw, 14px);
  --hap-3: clamp(12px, 0.90vw, 22px);
  --hap-4: clamp(16px, 1.40vw, 34px);
  --hap-5: clamp(24px, 2.20vw, 52px);
  --marzhi-faqes: clamp(16px, 4vw, 72px);

  /* kontrolli */
  --kontroll-h: clamp(44px, 2.6vw, 56px);
  --kolona-lexim: 66ch;
}
```

**RREGULLI I HEKURT (i testueshëm):** asnjë tekst i vërtetë nuk zbret më poshtë se `--fs-meta`.
Dy hapa poshtë (`/1.44`) jep 11.1px @390 dhe 13.9px @1280 → nën 16′ → **lejohet vetëm për
stoli jo-informative** (p.sh. numër i vogël te distinktivi), kurrë për tekst që duhet lexuar.

---

## 5. URDHRAT E PUNËS — faqe për faqe

Renditur sipas dëmit të matur. Secili ka: skedarin, numrin e sotëm, numrin e synuar, provën.

### U-01 · Shtresa e tokenëve (parakusht i të gjithave)
- **Skedari:** `app/ui-refine.css` (zona [O41] — e jotja) — shto bllokun `:root` të §4.
- **Prova:** `--fs-baza` e llogaritur në 1280 = 20.1px ±0.3.

### U-02 · Karta e shpalljes — ankesa #1 e pronarit
- **Skedari:** `app/components/ListingCard.tsx`
- **Sot:** 8px ×2, 11, 12, 18, 26 (të ngurta).
- **Synimi:** 8px→`--fs-meta`, 11/12→`--fs-meta`, 18→`--fs-tit-s`, 26→`--fs-tit-m`.
  Karta vetë: `minmax(clamp(260px,18vw,420px),1fr)`.
- **Prova:** në 1920 asnjë tekst i kartës < 17.5px; karta ≥ 380px.

### U-03 · Detaji i shpalljes
- **Skedarët:** `app/listing/[id]/ListingPageClient.tsx` (44 inline + 51 CSS),
  `app/components/ListingMediaContext.tsx` (kapja `max-width:1140px !important`).
- **Sot:** 10px ×2, 11 ×8, 12 ×10, 13 ×11; guaska e kapur 1140px me `!important`.
- **Synimi:** kolona e informacionit → `--kolona-lexim` (66ch); media → pjesa tjetër.
  Hiq `!important`-in; guaska bëhet `min(100%, 1400px)` dhe kolona e tekstit 66ch brenda saj.
- **Prova:** masa 45–75ch në 1280/1920/2560; asnjë tekst nën 17.5px @1920.

### U-04 · Profili i jashtëm i biznesit — ankesa #3
- **Skedari:** `app/biznese/[id]/BiznesPageClient.tsx` (75 inline + 21 CSS).
- **Sot:** 10px ×4, 11 ×9, 12 ×15, 13 ×15. Në 1920 shfrytëzim 77% por me tekst 12px.
- **Synimi:** të gjitha → shkalla; butonat e veprimit → `--kontroll-h`; kolona "Rreth" → 66ch.
- **Prova:** 0 tekste < `--fs-meta`; caqet ≥44px; masa ≤75ch.

### U-05 · Fundi i platformës — ankesa #2
- **Skedari:** `app/components/SiteFooter.tsx`
- **Sot:** 10, 11 ×2, 13, 19 — dhe në foto lidhjet e gjuhëve dalin si tekst i imët.
- **Synimi:** `--fs-meta` minimum; lidhjet e gjuhëve me cak ≥24px dhe hapësirë ≥8px mes tyre.
- **Prova:** `nen24 = 0` te faqet ligjore (sot 5–8).

### U-06 · Butoni "Shpall/Shto" — ankesa #4
- **Sot:** i matur si pjesë e shiritit të ballinës; lartësi jo e shkallëzuar.
- **Synimi:** `--kontroll-h` + `--fs-tit-s`, gjithnjë veprim parësor vizualisht (kontrast + peshë).
- **Prova:** në 2560 butoni ≥52px lartësi dhe teksti ≥23px.

### U-07 · Faqet e leximit (`/kushtet`, `/privatesia`, `/cookies`, `/rreth-nesh`, `/premium`)
- **Sot:** masa 99–118ch @1920+; caqe 15–16px.
- **Synimi:** `max-width:66ch` + `--fs-trup`; caqet ≥24px.

### U-08 · Ikonat e kategorive (defekt i dukshëm, faqe publike SEO)
- `app/kategori/page.tsx:57` → `<i className={'ti ti-' + c.icon} aria-hidden="true" />` me rezervë emoji.
- `scripts/subset-icons.py` → shto 12 glifet që mungojnë; verifiko emrat realë Tabler
  (p.sh. `ball` → `ball-football`, `dots` → `dots`).
- **Prova:** `curl /kategori | grep -c 'seo-cat-ico">[a-z-]*<'` = 0.

---

## 6. SI PROVOHET SE U ARRIT (kriteret e pranimit)

Xhiro `PROFIL=pa node scripts/autopsia-optike.mjs && node scripts/optika-analiza.mjs` dhe kërko:

| Kriteri | Sot | Pranohet |
|---|---|---|
| Matje nën 16′ (ISO minimum) | shumica | **0** |
| Matje në brezin 20′+ | ~0 | **≥90%** |
| Masa mbi 75ch | `/premium` 118, `/kushtet` 99 | **0 faqe** |
| Caqe nën 24px | 5–8 në faqet ligjore | **0** |
| `fontSize` inline në `.tsx` | 931 | **≤ 100** (ratchet, jo big-bang) |
| `clamp()` në CSS | 0 | shkalla e plotë |

Shtoje te `scripts/roja-unifikimit.mjs` numëruesin `font_px_inline` me bazë **931** që vetëm
zbret — njësoj si `radiuse_inline 384` dhe `ngjyra_hex_inline 2721`.

---

## 7. RENDI I ZBATIMIT (që të mos prishet gjë)

0. **FAZA 0 — DYSHEMETË, jo shkalla e plotë** (shtuar nga auditimi, §9-A4). Para se të preket
   ndonjë madhësi tjetër: ngri vetëm dyshemetë — asnjë tekst nën 12px në telefon, asnjë nën 15px
   në desktop. Kjo heq 100% të shkeljeve më të rënda me rrezikun më të vogël, dhe jep një pikë
   kthimi të sigurt. Mat para/pas. Vetëm pastaj kalo te hapi 1.
1. **U-01** tokenët (asnjë ndryshim pamor — vetëm shtresa).
2. **U-08** ikonat (defekt i dukshëm, i pavarur, 20 minuta).
3. **U-02 + U-03** karta dhe detaji (prek shumicën e trafikut).
4. **U-04 + U-05 + U-06** biznesi, fundi, butoni parësor.
5. **U-07** faqet e leximit.
6. Rixhiro instrumentin; krahaso me §6.

Pas çdo hapi: `tsc` · roja · testet · `next build` · deploy · **rimatje live** (jo lexim kodi).

---

## 8. NDARJA E PUNËS DHE ÇFARË PRET PRONARIN

- **CLOUD (code):** të gjitha ndryshimet e kodit (U-01…U-08) — skedarët [O41] janë të tijat.
- **TERMINAL:** matja para/pas, prova live, raportimi te kanali. Nuk prek [O41].
- **PRONARI, dy gjëra:**
  1. **Një hyrje e re me Google** në dritaren e auditit (~90s) — sesioni i profilit skadoi, ndaj
     11 rrugë pas hyrjes (profil, mesazhe, oferta, faturimi, favoritet…) nuk u matën dot sot.
  2. Vendimi për `/asistent` dhe `/listing/[id]`: mbeten kolonë leximi (rekomandimi im,
     shkencërisht i drejtë) apo i do plot ekran edhe ato?


---

## SHTOJCA A — dalja e plotë e instrumentit (matje live, shfletues i pastër, korrigjuar me CAP=0.750)

```
═══ 1. SA E MADHE DUHET TE JETE SHKRONJA (nga syri, jo nga moda) ═══
ekrani          mm/px   dist   px per 16'(min)   px per 20'(rehat)   px per 22'
telefon-390    0.1831    350mm          11.9                14.8         16.3
laptop-1280    0.2234    550mm          15.3                19.1         21.0
desktop-1920   0.2766    600mm          13.5                16.8         18.5
i-madh-2560    0.2332    700mm          18.6                23.3         25.6

═══ 2. CFARE KA VERTET NE PLATFORME (matje live) ═══
faqja            telefon-390      laptop-1280      desktop-1920     i-madh-2560      
                 px    arcmin  vlerapx    arcmin  vlerapx    arcmin  vlerapx    arcmin  vlera
ballina          10px   13.5'  DOB 12px   12.6'  DOB 12px   14.3'  DOB 12px   10.3'  DOB 
kategori         13px   17.5'  kuf 13px   13.6'  DOB 13px   15.4'  DOB 13px   11.2'  DOB 
kategori-slug    13px   17.5'  kuf 13px   13.6'  DOB 13px   15.4'  DOB 13px   11.2'  DOB 
kategori-qytet   14px   18.9'  kuf 14px   14.7'  DOB 14px   16.6'  kuf 14px   12.0'  DOB 
search           10px   13.5'  DOB 10px   10.5'  DOB 10px   11.9'  DOB 10px    8.6'  DOB 
search-results   10px   13.5'  DOB 10px   10.5'  DOB 10px   11.9'  DOB 10px    8.6'  DOB 
listing          12.5px 16.9'  kuf 13px   13.6'  DOB 12.5px 14.9'  DOB 12.5px 10.7'  DOB 
biznese-lista    13px   17.5'  kuf 12px   12.6'  DOB 12px   14.3'  DOB 12px   10.3'  DOB 
biznes-publik    11px   14.8'  DOB 12px   12.6'  DOB 12px   14.3'  DOB 12px   10.3'  DOB 
premium          11.5px 15.5'  DOB 11.5px 12.0'  DOB 11.5px 13.7'  DOB 11.5px  9.9'  DOB 
asistent         13px   17.5'  kuf 13px   13.6'  DOB 13px   15.4'  DOB 13px   11.2'  DOB 
kushtet          13px   17.5'  kuf 13px   13.6'  DOB 13px   15.4'  DOB 13px   11.2'  DOB 
rreth-nesh       13px   17.5'  kuf 13px   13.6'  DOB 13px   15.4'  DOB 13px   11.2'  DOB 

PERMBLEDHJE: 52 matje · nen kufirin ISO 16': 43 (83%) · ne brezin e rehatise 20'+: 0

═══ 3. A SHKALLEZOHET TIPOGRAFIA ME EKRANIN? (px @390 → @2560) ═══
ballina              10    12    12    12   rritje 390→2560: 20%
kategori             13    13    13    13   rritje 390→2560: 0%
kategori-slug        13    13    13    13   rritje 390→2560: 0%
kategori-qytet       14    14    14    14   rritje 390→2560: 0%
search               10    10    10    10   rritje 390→2560: 0%
search-results       10    10    10    10   rritje 390→2560: 0%
listing            12.5    13  12.5  12.5   rritje 390→2560: 0%
biznese-lista        13    12    12    12   rritje 390→2560: -8%
biznes-publik        11    12    12    12   rritje 390→2560: 9%
premium            11.5  11.5  11.5  11.5   rritje 390→2560: 0%
asistent             13    13    13    13   rritje 390→2560: 0%
kushtet              13    13    13    13   rritje 390→2560: 0%
rreth-nesh           13    13    13    13   rritje 390→2560: 0%

═══ 4. MASA (karaktere/rresht) — optimale 45–75 ═══
kategori            37·   73    73    73    (! = mbi 75, · = nen 45)
kategori-slug       34·   68    68    68    (! = mbi 75, · = nen 45)
kategori-qytet      34·   68    68    68    (! = mbi 75, · = nen 45)
listing             43·   58    44·   44·   (! = mbi 75, · = nen 45)
premium             59   118!  118!  118!   (! = mbi 75, · = nen 45)
asistent            41·   63    63    63    (! = mbi 75, · = nen 45)
kushtet             41·   99!   99!   99!   (! = mbi 75, · = nen 45)
rreth-nesh          45    65    65    65    (! = mbi 75, · = nen 45)

═══ 5. CAQET E PREKJES — WCAG 2.5.8 AA kerkon 24px, AAA 44px ═══
ballina               1/58     1/48     1/60     1/60   (nen24/gjithsej)
kategori              2/57     2/57     2/57     2/57   (nen24/gjithsej)
kategori-slug         3/44     3/44     3/44     3/44   (nen24/gjithsej)
kategori-qytet        4/44     5/44     5/44     5/44   (nen24/gjithsej)
search                1/42     1/42     1/42     1/42   (nen24/gjithsej)
search-results        2/44     1/25     2/44     2/44   (nen24/gjithsej)
listing               2/13     2/32     2/36     2/36   (nen24/gjithsej)
biznese-lista         1/28     1/27     1/28     1/28   (nen24/gjithsej)
biznes-publik         1/32     1/32     1/32     1/32   (nen24/gjithsej)
premium               1/36     1/36     1/36     1/36   (nen24/gjithsej)
asistent              2/30     2/30     2/30     2/30   (nen24/gjithsej)
kushtet                1/3      2/4      5/7     8/10   (nen24/gjithsej)
rreth-nesh             1/3      1/3     7/10     7/28   (nen24/gjithsej)

═══ 6. SHFRYTEZIMI I GJERESISE — glifet kundrejt ekranit ═══
(kujdes: >100% do te thote permbajtje qe rreshket horizontalisht, jo mbushje)
ballina             385.1%    93.9%    93.6%    94.3%
kategori             86.2%    88.2%    89.5%    92.4%
kategori-slug        90.3%    89.7%    84.7%    63.5%
kategori-qytet       89.5%    83.5%    80.6%    60.4%
search              307.9%    93.8%    89.8%    92.3%
search-results        319%    10.4%      91%    93.3%
listing               111%    78.2%    50.1%    37.6%
biznese-lista        95.1%      29%    46.5%    47.3%
biznes-publik        87.7%    80.9%    77.3%    76.8%
premium              85.1%    87.5%    89.5%    92.1%
asistent             90.3%    67.3%    44.9%    33.7%
kushtet              89.7%    59.1%    39.4%    29.5%
rreth-nesh           85.1%    57.2%    38.1%    28.6%

═══ 7. KONI I REHATISE VIZUALE (±15° foveal, ±30° kufi) ═══
telefon-390    ekrani=  71mm  koni ±15° =  188mm = 1025px  ±30° =  404mm = 2208px  → ekrani zë 12°
laptop-1280    ekrani= 286mm  koni ±15° =  295mm = 1319px  ±30° =  635mm = 2842px  → ekrani zë 29°
desktop-1920   ekrani= 531mm  koni ±15° =  322mm = 1163px  ±30° =  693mm = 2505px  → ekrani zë 48°
i-madh-2560    ekrani= 597mm  koni ±15° =  375mm = 1609px  ±30° =  808mm = 3466px  → ekrani zë 46°
```

## SHTOJCA B — leximi i tabelës 7 (koni i rehatisë)

| Ekrani | Sa gradë zë ekrani | Koni ±15° (lexim) | Përfundimi |
|---|---|---|---|
| Telefon 390 | 12° | 1025px (> ekrani) | Gjithçka brenda konit — prandaj telefoni "ndihet mirë" |
| Laptop 1280 | 29° | 1319px (> ekrani) | Ende e gjitha brenda konit |
| Desktop 1920 | **48°** | **1163px** | Vetëm 61% e ekranit është zonë leximi |
| Monitor 2560 | 46° | **1609px** | Vetëm 63% e ekranit është zonë leximi |

Kjo e vërteton shkencërisht ankesën e dytë të pronarit: në 1920 ekrani zë 48° — dyfishi i konit
parësor. Prandaj tekst i shtrirë skaj-më-skaj NUK lexohet: nuk është shije, është anatomi.
Dhe njëkohësisht e vërteton kërkesën e parë: kartat dhe butonat (që skanohen me shikim
periferik) BËJNË të mbushin ekranin — me kusht që të rriten, jo të shumohen të vegjël.


---

## 9. AUDITIMI I KËTIJ PLANI (me urdhër të pronarit, para se code të nisë)

E audituam planin kundër vetes para zbatimit. Tetë gjetje; tri ndryshojnë numra, një ndryshon rendin e punës.

### A1 · Konstantja e lartësisë së shkronjës ishte e huazuar — E NDREQUR
Kisha marrë cap-height 0.72 (raport i Inter-it). Fonti i vërtetë i platformës është **Plus Jakarta Sans**.
E mata live me canvas mbi faqen e prodhimit: **cap 0.750 · x-height 0.540 · gjerësi mesatare karakteri 0.5606em**.
Instrumenti u korrigjua (`CAP=0.750`) dhe të gjitha tabelat u rillogaritën.
**Efekti:** verdikti nga 85% → **83% nën 16′**; kërkesa për 20′ nga 15.4/19.9/17.5/24.2 → **14.8/19.1/16.8/23.3px**.
Formula e §4 i plotëson të katra edhe pas korrigjimit, me diferencë. **Përfundimi nuk ndryshon.**

### A2 · Modeli mm/px është OPTIMIST — pra gjetja qëndron edhe më fort
Për 1920 modelova monitor 24" (0.2766 mm/px). Nëse i njëjti 1920 është laptop 15.6" (0.1797 mm/px, 550mm),
12px bie në **~9.9′** në vend të 14.3′. Pra realiteti është më i keq se modeli, jo më i mirë.
Askush të mos e kundërshtojë planin me "po ne modeluam ekranin e gabuar".

### A3 · Kufiri i sipërm i shkallës ishte i shkurtër për ultrawide — E NDREQUR
Në 3440px (34", ~800mm) kërkesa për 20′ është **26.7px**; maksimumi 1.625rem (26px) mbetej pak nën.
U ngrit në **1.75rem (28px)**.

### A4 · RREZIKU MË I MADH, që e kisha nënvlerësuar: zëvendësimi i menjëhershëm thyen faqe
931 madhësi të ngurta të kaluara njëherësh te shkalla do të thoshte: 8px→13.3px në telefon (**+66%**),
12px→20.1px në laptop (**+67%**). Karta me lartësi fikse, rreshta që priten, shirita që dalin nga ekrani,
dhe — më e rëndësishmja — **pamja e telefonit që pronari e ka konfirmuar si të mirë do të ndryshonte më shumë
se ç'ka kërkuar ai.** Prandaj u shtua **FAZA 0** (dyshemetë) para gjithçkaje, plus rregull i ri:
asnjë komponent nuk kalon pa foto para/pas në 390/1280/1920, dhe **çdo hap ka kthim mbrapa** nëse ndonjë
kriter i §6 përkeqësohet.

### A5 · `--fs-meta` është në kufi, jo në rehati
Një hap poshtë bazës jep 17.5′ @390 · 16.8′ @1280 · 17.9′ @2560 — mbi minimumin ISO, **nën brezin 20′**.
Prandaj: `--fs-meta` lejohet vetëm për tekst vërtet dytësor (data, njësi, ndihmë).
**Ndalohet** për çmimin, emrin e shitësit, titullin e kartës, ose çdo buton.

### A6 · Numri bazë ishte i pasaktë — E NDREQUR
930 është numri i **rreshtave** që përmbajnë `fontSize`; dukuritë e vërteta janë **931** (`grep -rno`).
Roja duhet nisur me 931, përndryshe hapi i parë "kalon" pa bërë asgjë.

### A7 · Një metrikë e imja mund të keqlexohet
`shfrytezimi > 100%` (p.sh. ballina @390 = 385%) NUK është dalje nga ekrani — janë çipat/karuselet
që rrëshqasin horizontalisht brenda një kontejneri të qëllimshëm. Para se kushdo ta trajtojë si defekt,
duhet krahasuar me `document.scrollWidth` kundrejt `innerWidth`. Nuk e kam përdorur si dëshmi në §2, dhe
askush tjetër të mos e përdorë pa këtë kontroll.

### A8 · U-08 duhet nisur si NJË hap — provuar live sot, me kosto
Ndërsa shkruhej ky plan, cloud-i zbatoi hapin 1 të U-08 (rendërimin `<i class="ti ti-…">`) pa hapin 2
(rigjenerimin e subset-it). Rezultati në prodhim (`ccaa5d5`, matur @1280): **13 nga 16 ikonat e kategorive
kanë përmasa 0×0 px** — kartat mbetën bosh. Para ndreqjes faqja tregonte emra ikonash; pas saj nuk tregon
asgjë. **Rëndim, jo ndreqje.**
Prandaj rregull i ri për të gjithë urdhrat: **një urdhër pune mbyllet vetëm kur mbyllet efekti i tij i
dukshëm**, i matur live — jo kur ndryshohet skedari.

### Çfarë NUK ndryshoi pas auditimit
Doktrina e tri shtresave (§3), formula e shkallës (§4), kolona 66ch, dhe kriteret e pranimit (§6) qëndrojnë
të pandryshuara. Gjetja qendrore — tipografi e ngrirë, 83% e matjeve nën minimumin ndërkombëtar, 0% rritje
nga 390px në 2560px — mbeti e njëjtë edhe pas korrigjimit të konstantes.

---

## 10. REGJISTRI I DEFEKTEVE — çdo gjë e gjetur, me urdhër të pronarit

Rregull: këtu hyn **çdo** defekt i gjetur gjatë punës, edhe ata që nuk kanë lidhje me optikën,
edhe ata që dolën gabime të miat, edhe alarmet false — që të mos rihapen nga askush më vonë.
Kolona "Kush" tregon kush e mban: PRODUKT (kodi i platformës), INSTRUMENT (mjetet e matjes),
PROCES (mënyra si punojmë).

| # | Kush | Defekti | Dëshmia | Gjendja |
|---|---|---|---|---|
| D-01 | PRODUKT | Ikonat e kategorive shtypeshin si TEKST (`device-mobile`, `car`…) në faqe publike SEO | HTML i shërbyer: `<span class="seo-cat-ico">device-mobile</span>`; shkaku `app/kategori/page.tsx:57` | Ndrequr nga cloud (`d144bc7`) — por shih D-02 |
| D-02 | PRODUKT | **Regres i gjallë:** pas ndreqjes së D-01, **13 nga 16 ikona kanë përmasa 0×0px** — kartat mbetën bosh, më keq se para | Matje live @1280 mbi `ccaa5d5`: `.seo-cat-ico i` me `getBoundingClientRect()` 0×0 për car, home, shirt, armchair, paw, tools, briefcase, salad, plane, ball, book, device-gamepad, dots. Foto: `.ops/autopsi/kategori-pas-fixit.png` | HAPUR — U-08 hapi 2 (rigjenerimi i subset-it) |
| D-03 | PRODUKT | Tipografi e ngrirë: 0% rritje nga 390px në 2560px; 83% e matjeve nën minimumin ISO 16′ | §2, 52 matje | HAPUR — Faza 0 + U-01 |
| D-04 | PRODUKT | Masa shpërthen: `/billing` **150ch**, `/te-dhenat-mia` **135ch**, `/premium` 118ch, `/kushtet` 99ch, `/profile/analytics` 91ch, `/notifications` 79ch — të gjitha mbi kufirin 75 | Matje @1280 dhe @1920 | HAPUR — U-07 zgjerohet te faqet e kyçura |
| D-05 | PRODUKT | Caqe prekjeje nën WCAG 2.2 AA (24px): `/kushtet` 8/10 @2560, `/rreth-nesh` 7/10 @1920, `/te-dhenat-mia` 3, `/listing/[id]/edit` cak mesatar 36px me 2 nën 24 | Matje live | HAPUR — U-05/U-07 |
| D-06 | PRODUKT | Borxh strukturor: **931 `fontSize` inline**, **0 `clamp()`** — asgjë s'shkallëzohet dot qendrore | `grep -rno` | HAPUR — U-01 |
| D-07 | PRODUKT | `/listing/[id]` kapet me `max-width:1140px !important` nga `ListingMediaContext.tsx:33`, duke mbishkruar rregullin 100% | Gjurmues DOM live (T-042) | HAPUR — U-03 |
| D-08 | PRODUKT | `/biznese/[id]/analytics` ka trup teksti **9px** — teksti më i vogël i gjetur në faqe të plotë (≈6.8′ @1280, dy të tretat nën minimumin) | Matje live pas hyrjes | HAPUR — urdhër i ri U-09 |
| D-09 | INSTRUMENT | Cache-i i profilit të auditit mbante një **404 të ruajtur për `/_next/static/chunks/webpack-*.js`** → faqet nuk hidratoheshin → matje krejt false | Konsola: "Refused to execute script … MIME type ('text/plain')"; me `curl` i njëjti chunk kthen 200 | NDREQUR — cache-i pastrohet te `hyrje-dritare.mjs` para çdo sesioni |
| D-10 | PROCES | Sesioni i profilit skadon pa paralajmërim; 6 rrugë u matën si guaskë login-i pa u vënë re | Xhiroja e parë: `/profile`, `/messages`, `/favorites`, `/oferta`, `/listing/new` me numra identikë 17.5% | NDREQUR — hyrje e re + kontroll `location.pathname` |
| D-11 | INSTRUMENT | Flamuri "GUASKË" me regex jepte **false-positive** (kapte tekste normale si "Hyr për të kontaktuar" te `/listing/[id]`) | Faqe me përmbajtje reale u shënuan GUASKË | NDREQUR — kontroll mbi `location.pathname` + `h1` |
| D-12 | INSTRUMENT | `shfrytezimi > 100%` (ballina @390 = 385%) lexohej si "dalje nga ekrani", ndërsa janë çipa/karusele që rrëshqasin brenda kontejnerit | Krahasim me `scrollWidth` mungonte | NDREQUR — shtuar `dalje` + `scrollWidth` |
| D-13 | INSTRUMENT | Instrumenti **mbishkruante** daljen e mëparshme; matja publike gati u fshi nga ajo e kyçur | Vënë re para se të ndodhte | NDREQUR — `DALJA=` + bashkim jo-shkatërrues |
| D-14 | — | **ALARM FALS, mos e rihap:** `/biznese` dukej bosh (0 biznese) | Ishte pasojë e D-09. Me shfletues të pastër biznesi "Makina" rendërohet normalisht (8 karta); API-ja anonime e kthen rreshtin me 200 | MBYLLUR |
| D-15 | PLAN | Konstantja cap-height 0.72 ishte huazuar nga Inter; fonti real është Plus Jakarta Sans | Matje live me canvas: cap **0.750**, x **0.540** | NDREQUR — §9-A1 |
| D-16 | PLAN | Maksimumi i shkallës nuk mbulonte ultrawide 3440 | Kërkesa 26.7px kundrejt 26px | NDREQUR — §9-A3, tani 1.75rem |
| D-17 | PLAN | Baza e rojës 930 ishte numër rreshtash, jo dukurish | `grep -rno` = 931 | NDREQUR — §9-A6 |
| D-18 | PLAN | Rreziku i thyerjes nga zëvendësimi i menjëhershëm ishte i nënvlerësuar | +66% rritje në disa tekste | NDREQUR — Faza 0, §9-A4 |
| D-19 | PLAN | **Zoom-i 200% i shfletuesit kundër `clamp()` me `vw`:** termi `vw` nuk rritet fizikisht me zoom-in, ndaj në 1280 zoom-i 200% jep vetëm ~1.71× rritje reale, jo 2× | Llogaritje mbi formulën e §4 | HAPUR — vendim te auditimi i dytë (§11) |
| D-20 | PLAN | `66ch` matet me gjerësinë e shifrës "0", jo me gjerësinë mesatare të karakterit (0.5606em e matur) | Përkufizim CSS | HAPUR — matje e drejtpërdrejtë te §11 |
| D-21 | PRODUKT | Nga fotot e pronarit: `/messages` në desktop shfaq shirit të errët me një "vrimë" drejtkëndore të bardhë — layout i thyer | Foto e pronarit, 5 shtator | PËR VERIFIKIM në matjen e kyçur |

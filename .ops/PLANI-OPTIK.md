# PLANI OPTIK v2 — Alpazar 100% web-app, i ndërtuar për syrin e njeriut

> Autor: TERMINAL · 5 shtator 2026 · për zbatim nga CLOUD (code)
> **Ky version zëvendëson v1** (arkivuar te `.ops/PLANI-OPTIK-v1-arkiv.md`).
> Pse u rishkrua: pronari konstatoi me të drejtë se v1 mati faqet si tërësi dhe listën e
> rrugëve e zgjodhi analisti — shkelje e PARIMET §4 (topografi: faqe-për-faqe,
> komponent-për-komponent) dhe e kontratës ("të gjitha" = të gjitha).
>
> Baza e v2: **42 rrugë · 4 323 butona · 7 287 tekste**, secili element i matur veç e veç,
> live në prodhim (`03353c0`), në 3 gjerësi ekrani.
> Instrumentet: `scripts/autopsia-totale.mjs` + `scripts/totale-analiza.mjs`.
> Të dhënat: `.ops/autopsi/totale.json` · raporti: `.ops/autopsi/totale-analiza.txt`.

---

## 1. METODA — element për element, jo faqe për faqe

| Çfarë | Si matet | Pse kështu |
|---|---|---|
| Rrugët | nxjerrë nga app-router-i (`find app -name page.tsx`) — 38 shabllone | Lista të mos varet nga kujtesa e analistit |
| Elementët | çdo nyje e dukshme nën `body *`, jo vetëm `<main>` | Butonat e fundit dhe chrome-i janë pjesë e platformës |
| Butonat | `button, a, [role=button], [role=tab], input, select, textarea, summary, [onclick]` | Përkufizimi i cakut te WCAG 2.5.8 |
| Këndi vizual | px → mm (mm/px real i pajisjes) → arcmin, në distancën tipike | Metrika që lidh ekranin me retinën (ISO 9241-303) |
| Masa | gjerësia e rreshtit ÷ (font-size × 0.5606) | 0.5606em = gjerësi mesatare karakteri, **e matur** |
| Nënfaqet | harta e butonave: etiketë → destinacion (href / tab / veprim) | Kërkesa e pronarit: "nënfaqet e butonave" |

**Konstantet janë të matura, jo të huazuara:** cap-height **0.750**, x-height **0.540**,
gjerësi mesatare karakteri **0.5606em**, `1ch` = **0.7315em** — matur live me canvas mbi fontin
real (Plus Jakarta Sans). Në v1 ishin marrë hua nga Inter dhe dolën të gabuara.

### Mbulimi — dhe kufijtë e tij, deklaruar ndershmërisht (PARIMET §3)
- **42 rrugë të matura**, duke përfshirë çdo shabllon të app-router-it.
- **Shabllonet e kategorive u PROVUAN identikë, jo u supozuan:** `/kategori/prona`,
  `/kategori/pune` dhe `/kategori/veshje/durres` japin numra identikë (29 tekste nën 16′ @390,
  4 caqe nën 24px). Prandaj një përfaqësues për shabllon është matje e vlefshme; 61 variantet
  e mbetura (16 kategori × 19 qytete) nuk shtojnë informacion të ri.
- **`/biznese/new` nuk matet dot si formular:** me sesionin e pronarit ridrejton te biznesi i tij
  ekzistues, sepse një pronar ka një biznes. U mat pa sesion dhe sjellja u dokumentua. Për
  formularin duhet një llogari pa biznes — **bllokim i deklaruar, jo i fshehur.**
- `/auth/login` u mat pa sesion (me sesion ridrejton).

---

## 2. VERDIKTI TOTAL

```
42 rrugë · 4 323 butona të matur · 7 287 tekste të matura
  tekste nën 16′ (minimumi absolut ISO 9241-303):  5 565  = 76%
  tekste nën 20′ (brezi i rehatisë):               6 821  = 94%
  caqe nën 24px (WCAG 2.2 SC 2.5.8 AA):              377
  caqe nën 44px (WCAG 2.2 SC 2.5.5 AAA):             705
  rreshta mbi 75 karaktere:                           94
  butona me tekst nën 16′:                     2 816 nga 4 323 = 65%
```

**Asnjë faqe e vetme nuk kalon e pastër.** Edhe më e mira (`/notifications/[id]`) ka 17–20
tekste nën minimum dhe 1 cak nën 24px.

### Renditja e dëmit (nën16 + 3×cak24 + cak44 + 2×masa)
| Pikë | Rruga |
|---|---|
| **488** | `/biznese/[id]/edit` |
| 347 | `/kushtet` |
| 341 | `/privatesia` |
| 319 | `/profile/analytics` |
| 286 | `/cookies` |
| 280 | `/` (ballina) |
| 250 | `/admin` |
| 245 | `/listing/[id]/edit` |
| 235 | `/referral` |
| 229 | `/kontakt` |
| 223 | `/listing/new` |
| 221 | `/search/results` |

### Elementët më të këqij në platformë
| Madhësia | Këndi | Elementi | Ku |
|---|---|---|---|
| **5px** | **5.2′** | inicialet e avatarit ("MA", "ML") | ballina, `/kategori/*` |
| 7.5–8px | 7.9–8.4′ | distinktivi "Premium" | ballina, `/search/results` |
| 8px | 8.4′ | etiketa "KRYESORE" | `/biznese/[id]/edit` |
| 8px | 8.4′ | ikona 🏢 | `/listing/[id]` |

| Caku | Elementi | Ku |
|---|---|---|
| **12px** | lidhjet "Kushtet", "Privatesine" | `/takedown` |
| 13px | "Kthehu" | `/admin` |
| 13px | "VIP Ekstra Boost" | `/billing` |
| 13px | 5 kuti zgjedhjeje `input` | `/biznese/[id]/edit` |

---

## 3. PESË ZONAT QË CITOI PRONARI — të matura buton për buton

### 3.1 Faqja e ngarkimit të shpalljes (`/listing/new`)
| Ekrani | Butona | Tekste nën 16′ | Nën 20′ | Caqe <24px | Caqe <44px |
|---|---|---|---|---|---|
| Telefon 390 | 54 | 51 | 69 | 1 | 8 |
| Laptop 1280 | 54 | **70** | 73 | 1 | 8 |
| Desktop 1920 | 54 | **69** | 73 | 1 | 8 |

### 3.2 Karta e shpalljes (ballina dhe kërkimi)
| Rruga | Ekrani | Butona | Nën 16′ | Nën 20′ | <24px | <44px |
|---|---|---|---|---|---|---|
| `/` | laptop | 62 | **102** | 110 | 1 | 4 |
| `/` | desktop | 62 | 96 | 104 | 1 | 4 |
| `/search` | të tria | 42 | 35–37 | 37–39 | 1 | 2 |
| `/search/results` | të tria | 44 | 44–48 | 48–53 | 2 | **21** |

### 3.3 Profili i JASHTËM i biznesit (`?public=1`)
| Ekrani | Butona | Nën 16′ | Nën 20′ | <24px | <44px |
|---|---|---|---|---|---|
| Telefon | 30 | 41 | 63 | 1 | 4 |
| Laptop | 30 | **60** | 65 | 1 | 4 |
| Desktop | 30 | 59 | 63 | 1 | 4 |

### 3.4 Nënfaqet e butonave të biznesit
| Rruga | Ekrani | Butona | Nën 16′ | <24px | <44px |
|---|---|---|---|---|---|
| `/biznese/[id]/analytics` | laptop | 24 | 54 | 1 | 1 |
| `/biznese/[id]/edit` | telefon | 79 | 7 | **12** | **61** |
| `/biznese/[id]/edit` | laptop | 79 | **84** | **12** | **61** |
| `/biznese/[id]/edit` | desktop | **100** | **104** | **12** | **63** |

`/biznese/[id]/edit` është faqja më e dëmtuar e platformës: 100 butona në desktop, 12 prej tyre
nën minimumin e prekjes së WCAG-ut dhe 63 nën rekomandimin.

### 3.5 Butonat në fund të platformës
| Madhësia | Këndi | Caku | Etiketa |
|---|---|---|---|
| 11px | 13.1′ | 44px | Kushtet e Përdorimit · Rreth Nesh · Kontakt · Siguria |
| 11px | 13.1′ | **15px** | Kushtet |
| 10.5px | 12.5′ | **13px** | Kushtet |
| 10px | 11.9′ | **12px** | Kushtet |
| 13px | 15.4′ | **16px** | faqja e kontaktit |

### 3.6 Harta e butonave të profilit të jashtëm (nënfaqet e tij)
| Butoni | Caku | Teksti | Këndi | Shkon te |
|---|---|---|---|---|
| Kthehu mbrapa | 44px | 13.3px | 15.8′ | veprim në faqe |
| Ndaj biznesin | **38px** | 13.3px | 15.8′ | veprim në faqe |
| Ti je pronari — shiko profilin | 44px | 12.5px | 14.9′ | `/u/[id]` |
| 🗺️ Harta | **32px** | 11.5px | **13.7′** | Google Maps |
| ← Kthehu te menaxhimi | **43px** | 12px | 14.3′ | veprim në faqe |
| **Shpalljet** (tab) | 44px | 13px | 15.4′ | nënfaqe në vend |
| **Rreth & Vlerësime** (tab) | 44px | 13px | 15.4′ | nënfaqe në vend |
| Ruaj në të preferuara | 44px | 13.3px | 15.8′ | veprim në faqe |
| ALPAZAR — Kryefaqja | 44px | 13px | 15.4′ | `/` |
| Facebook | 44px | 19px | 22.6′ | jashtë |

Të gjitha nën brezin e rehatisë 20′, me përjashtim të lidhjes Facebook.

---

## 4. DOKTRINA — tri shtresat (e pandryshuar, e vërtetuar nga matja)

- **Shtresa A — SKANIM** (rrjeta kartash, lista, panele): guaska mbush ekranin, por **qelizat
  rriten**: `repeat(auto-fill, minmax(clamp(260px, 18vw, 420px), 1fr))`.
- **Shtresa B — LEXIM** (detaj, ligjore, bisedë, formularë): `max-width: var(--kolona-lexim)`
  = **37em** = 66 karaktere reale (jo `66ch`, që jep 86 — shih §9-A9 të arkivit).
- **Shtresa C — KONTROLL** (butona, çipa, fusha, ikona): `--kontroll-h`, minimum 24px (AA),
  44px në prekje (AAA), ikona në `1em`.

Koni i rehatisë vizuale e vërteton ndarjen: në 1920 ekrani zë **48°**, ndërsa koni i leximit
±15° është **1163px**. Rrjetat mund të mbushin ekranin (shikim periferik); kolonat e leximit jo.

---

## 5. SHKALLA — tashmë LIVE, e verifikuar në prodhim

Tokenët janë në prodhim (verifikuar në DOM live, jo besuar nga raporti i cloud-it):
```
--fs-baza: clamp(1rem, 0.8875rem + 0.461vw, 1.75rem)
--kolona-lexim: 37em
--kontroll-h: clamp(44px, 2.6vw, 56px)
```
E matur në shfletues në 7 gjerësi: **16.00px @390 · 17.74 @768 · 20.10 @1280 · 23.05 @1920 ·
26.00 @2560 · 28.00 @3440** — të gjitha mbi kërkesën ISO 20′ (14.8 / 19.1 / 16.8 / 23.3).

**Por asnjë komponent nuk i përdor ende.** Prandaj matja e sotme tregon të njëjtat 5–13px:
shtresa ekziston, konsumatorët jo. Kjo është pikërisht puna që mbetet.

---

## 6. FAZA 0 — dyshemetë (e para, para çdo gjëje tjetër)

Problemi teknik: 931 madhësi janë `style={{fontSize: N}}` inline, dhe stili inline nuk merr
breakpoint. Zgjidhja nuk është `!important` (do t'i rrafshonte të gjitha), por **një token + kodmod**:

```css
--fs-dysheme: clamp(12px, 10.69px + 0.337vw, 16px);
/* 12px @390 · 15.0px @1280 · 16px @1500+ — një vlerë mbulon dyshemenë mobile dhe desktop */
```

Kodmod: zëvendëso **vetëm** `fontSize: N` ku `N < 15` me `fontSize: 'var(--fs-dysheme)'`.
Asgjë tjetër. I shqyrtueshëm rresht-për-rresht, plotësisht i kthyeshëm me një regex mbrapsht.

**Kufizimi i pranuar:** hierarkia mes 5/8/10/11/12/13/14px rrafshohet përkohësisht te dyshemeja.
Kjo është e qëllimshme — Faza 0 blen sigurinë, jo bukurinë. Hierarkia rikthehet te U-02…U-13,
ku secili element merr hapin e vet të shkallës.

**Përjashtimi i vetëm (shih §9-A4):** inicialet e avatarit 5px. Aty rritet RRETHI bashkë me
tekstin (`width: 2.4em; height: 2.4em`), përndryshe teksti thyen rrethin.

---

## 7. URDHRAT E PUNËS — renditur sipas dëmit të matur

| # | Objekti | Skedarët | Gjendja sot (e matur) | Synimi |
|---|---|---|---|---|
| **U-00** | Faza 0 — dyshemetë | kodmod mbi `app/**/*.tsx` + `ui-refine.css` | 5 565 tekste nën 16′ | 0 nën 16′ |
| **U-01** | Tokenët | `ui-refine.css` | ✅ LIVE, e verifikuar | — |
| **U-02** | `/biznese/[id]/edit` | `BusinessForm.tsx` + faqja | 100 butona, **12 caqe <24px**, 63 <44px, 104 tekste <16′ | 0 <24px; ≤10 <44px |
| **U-03** | Faqet ligjore | `/kushtet`, `/privatesia`, `/cookies`, `/siguria`, `/takedown` | dëm 347/341/286; caqe **12–16px**; masa deri 99ch | caqe ≥24px; masa ≤75 |
| **U-04** | Analitikat | `/profile/analytics`, `/biznese/[id]/analytics` | 54 tekste <16′; trup **9px**; masa 91ch | shkalla; masa ≤75 |
| **U-05** | Ballina + karta e shpalljes | `HomeClient.tsx`, `ListingCard.tsx` | **102 tekste <16′**; inicialet **5px**; "Premium" 8px | 0 nën `--fs-meta` |
| **U-06** | `/listing/new` (ngarkimi) | faqja + komponentët e formularit | 70 tekste <16′; 8 caqe <44px | shkalla; caqe ≥44px |
| **U-07** | `/listing/[id]` + `/edit` | `ListingPageClient.tsx`, `ListingMediaContext.tsx` | 88 tekste <16′; kapja `1140px !important` | shkalla; kolona 37em |
| **U-08** | Ikonat e kategorive | `CategoryIcon.tsx` | ✅ ZGJIDHUR (emoji), verifikuar live | — |
| **U-09** | Profili i jashtëm i biznesit | `BiznesPageClient.tsx` | 60 tekste <16′; "Harta" cak 32px | shkalla; caqe ≥44px |
| **U-10** | Fundi i platformës | `SiteFooter.tsx` | lidhje me cak **12–16px**, tekst 10–11px | caqe ≥24px; tekst ≥`--fs-meta` |
| **U-11** | `/messages` | `app/messages/page.tsx:750` | shirit i errët full-bleed me "vrimë" 960px | guaska dhe kolona përputhen |
| **U-12** | `/search/results` | faqja + kartat | **21 caqe <44px** | ≤5 |
| **U-13** | `/referral`, `/kontakt`, `/admin` | faqet përkatëse | dëm 235/229/250; `/kontakt` 7 caqe <24px | caqe ≥24px |

---

## 8. KRITERET E PRANIMIT (element-level, jo faqe-level)

| Kriteri | Sot | Pranohet |
|---|---|---|
| Tekste nën 16′ | 5 565 (76%) | **0** |
| Tekste nën 20′ | 6 821 (94%) | **≤10%** |
| Caqe nën 24px | 377 | **0** |
| Caqe nën 44px | 705 | **≤50** (vetëm lidhje brenda tekstit) |
| Rreshta mbi 75 karaktere | 94 | **0** |
| `fontSize` inline | 931 | **≤100** |
| Zoom 200% pa prerje | e paverifikuar | çdo faqe kalon |
| Shkelje axe KRITIKE | 34 | **0** |
| Shkelje axe kontrasti | 302 | **≤30** |

Provohet duke rixhiruar `node scripts/autopsia-totale.mjs && node scripts/totale-analiza.mjs`
dhe krahasuar totalet. **Asnjë urdhër nuk mbyllet pa numrin e ri.**

---

## 9. AUDITIMI I PLANIT v2 (para dorëzimit te code)

### A-1 · Numërim i dyfishtë — I NDREQUR PARA RAPORTIMIT
Versioni i parë i analizuesit numëroi të njëjtin element dy herë (si tekst dhe si buton),
duke dhënë "7 346 tekste nën 16′ nga 6 579 të matura" — pamundësi aritmetike që e kapa vetë.
U ndreq; numrat e §2 janë pas ndreqjes.

### A-2 · Mbulimi nuk është 100% i URL-ve — dhe kjo deklarohet hapur
61 variante kategorish nuk u matën. Nuk u supozua se janë identike — **u provua** me tri matje
kontrolli me numra identikë. `/biznese/new` mbetet i pamatshëm si formular pa një llogari pa biznes.

### A-3 · Rreziku i Fazës 0 mbi telefonin
Dyshemeja 12px prek tekste që sot janë 5–11px. Pamja e telefonit, që pronari e ka konfirmuar si
të mirë, do të ndryshojë. **Kusht:** foto para/pas në 390 për çdo faqe të prekur, dhe pronari
i sheh para se të vazhdohet te U-02.

### A-4 · Inicialet 5px nuk janë "tekst leximi"
"MA"/"ML" janë iniciale brenda një rrethi avatari. Ngritja e tyre te 12px pa rritur rrethin
do ta thyente atë. Prandaj përjashtimi i §6: rritet rrethi (`2.4em`), jo vetëm shkronja.

### A-5 · Rreziku i kodmodit mbi `fontSize` jo-numerikë — I MATUR, jo i hamendësuar
Numërimi i saktë në kod:
- **931** `fontSize` gjithsej
- **895** me numër literal
- **712** me vlerë nën 15px — **ky është objektivi i saktë i Fazës 0**
- **5** me shprehje në vend të numrit: `Avatar.tsx` (4 raste: `fontSize: i`, `fontSize: M`)
  dhe `LanguageSwitcher.tsx` (1 rast: `fontSize: l`)

**Kusht:** kodmodi prek vetëm `fontSize: <numër literal>` nën 15. Të 5 rastet me shprehje
shqyrtohen me dorë. Kjo nuk është rastësi: `Avatar.tsx` është pikërisht komponenti ku janë
inicialet 5px (§2), pra i njëjti skedar është edhe përjashtimi i §6 edhe rasti me shprehje.

### A-6 · Ajo që u verifikua live dhe qëndroi
- Tokenët janë vërtet në prodhim (matur në DOM).
- Ikonat e kategorive janë vërtet të ndrequra (emoji, zero elemente bosh, zero emra teksti).
- Prodhimi është identik me `main` (`03353c0`) — pas periudhës kur ishte i pinuar te një build
  i 9 gushtit.
- Doktrina, shkalla dhe kolona 37em mbetën të pandryshuara nga të dhënat e reja.

### A-7 · Çfarë NUK e mat ky plan (kufi i ndershëm)
Kontrastin e ngjyrave dhe strukturën ARIA — ato maten me **axe-core** (PARIMET §1), me
`scripts/autopsia-axe.mjs`, jo me këtë instrument. Duhet një xhiro e veçantë mbi të 42 rrugët.
Është punë e mbetur, e shënuar, jo e harruar.

---

## 10. AKSESUESHMËRIA — matje me axe-core (mjeti standard, PARIMET §1)

Boshllëku që plani im e deklaroi te §9-A7 u mbyll: xhirova `scripts/autopsia-axe.mjs` mbi
**36 rrugë × 2 gjerësi = 72 matje**, me sesionin e pronarit (skripti u ndreq të pranojë
`SESIONI=` — pa të, 15 rrugë do të matnin guaskën e login-it, kurthi D-10).

```
72 matje · 345 shkelje · 38 matje pa asnjë shkelje
589 kontrolle të papërfunduara — axe nuk vendos dot vetë, kërkojnë sy njeriu
```

### Shkeljet sipas rëndësisë
| Rëndësia | Rregulli | Nyje | Faqe | Kuptimi |
|---|---|---|---|---|
| **KRITIKE** | `label` | 26 | 1 | Fusha formulari pa etiketë (p.sh. `<input type="time">`) |
| **KRITIKE** | `select-name` | 4 | 2 | Lista zgjedhëse pa emër të arritshëm |
| **KRITIKE** | `aria-required-children` | 4 | 2 | `role="tablist"` me fëmijë që nuk janë `role="tab"` |
| SERIOZE | **`color-contrast`** | **302** | **16** | Kontrast nën pragun minimal |
| SERIOZE | `aria-prohibited-attr` | 6 | 3 | `aria-label` mbi elemente që nuk e lejojnë |
| SERIOZE | `scrollable-region-focusable` | 1 | 1 | Zonë rrëshqitëse pa qasje me tastierë |
| MODERATE | `heading-order` | 2 | 1 | `<h3>` pa `<h2>` para |

### Faqet me më shumë shkelje
| Shkelje | Faqja |
|---|---|
| **50** | `/admin` @1280 |
| 36 | `/profile/analytics` (të dyja gjerësitë) |
| 28 | `/biznese/[id]/analytics` (të dyja) |
| 20 | `/notifications` (të dyja) |
| 15 | `/biznese/[id]/edit` (të dyja) |
| 13 | `/referral` (të dyja) |

### Urdhër i ri
**U-14 · Aksesueshmëria:** 34 shkelje kritike (label, select-name, aria-required-children) dhe
302 kontrasti. Fillo nga kritiket — ato bllokojnë përdorimin me lexues ekrani, nuk janë estetikë.
Kontrasti trajtohet bashkë me U-00/U-05, sepse shumë raste janë tekst i imët gri mbi krem: kur
teksti rritet dhe ngjyra shkon te tokenët, një pjesë e mirë bie vetvetiu. **Rimatje e detyrueshme
pas çdo hapi** — jo supozim se u zgjidh.

### Kufi i deklaruar
589 kontrolle mbetën **të papërfunduara**: axe nuk e llogarit dot kontrastin mbi gradient,
foto ose tekst me shtresa. Ato kërkojnë sy njeriu ose matje me mostër pikselësh — punë e
mbetur, e shënuar, jo e harruar.

---

## 11. VENDIM PRONARI (5 shtator, me foto) — KARTA E SHPALLJES NË NJË KOLONË

**Urdhri:** «strukturore karten e shpalljes ne nje kolone».

Ky vendim **zëvendëson** rekomandimin e mëparshëm te §4 (ku `/listing/[id]` mbahej layout
2-kolonësh si "kufi i qëllimshëm"). Pronari vendos faqe për faqe; vendimi është i tij.

### Gjendja e sotme, e matur
`/listing/[id]` @≥1000px është grid me dy kolona, i imponuar me `!important`:
- **Skedari i saktë:** `app/components/ListingMediaContext.tsx` → `LISTING_DESKTOP_CSS`
  ```css
  @media (min-width:1000px){
    .wrap{ max-width:1140px !important; display:grid !important;
           grid-template-columns:minmax(0,1.15fr) minmax(0,0.85fr); column-gap:34px; }
    .wrap > .info{ grid-column:2; grid-row:2 / span 999; }
  }
  ```
- Rregulli i faqes (`ListingPageClient.tsx:646–650`) është 480px → 760px @768 → 100% @1024;
  bllokut me `!important` e mbishkruan. Kjo është kapja që gjurmuesi live e gjeti (D-07).

### Ç'duhet bërë (U-07 i rishikuar)
1. **Hiq bllokun grid** te `LISTING_DESKTOP_CSS` — jo ta anashkalosh, ta heqësh, që të mos mbetet
   CSS i vdekur (mësimi i shiritit Instagram, revert-i i 4 shtatorit).
2. `.wrap` bëhet **një kolonë e vetme, e qendërzuar**: `max-width: min(100%, 1140px); margin: 0 auto;`
   me padding-in e lëngshëm ekzistues.
3. Brenda saj, **blloqet e tekstit kufizohen te `var(--kolona-lexim)` (37em)** — përshkrimi,
   vendndodhja, të dhënat e shitësit. Media mban gjerësinë e plotë të kolonës.
4. Rendi vertikal: media → statistikat e shikimit → shitësi → përshkrimi → vendndodhja → veprimet.

### Kriteret e pranimit (të matshme, jo vlerësim me sy)
| Kriteri | Si matet |
|---|---|
| Një kolonë vërtet | `.info` dhe blloku i medias kanë **të njëjtin `x`** @1000/1280/1920 |
| Asnjë element anash | asnjë çift elementesh me mbivendosje vertikale dhe `x` të ndryshëm |
| Masa e leximit | ≤75 karaktere reale te përshkrimi, në të tria gjerësitë |
| Pa CSS të vdekur | `grep -c "grid-template-columns" ListingMediaContext.tsx` = 0 |
| Pa regres telefoni | numrat @390 të pandryshuar (bllok i prekur ishte vetëm ≥1000px) |

---

## 12. MATJA PARA/PAS — U-00 (Faza 0) dhe U-02, të verifikuara live

Prodhimi `6f32a96` kundrejt `3c21976`. Krahasim mbi **çiftet (rrugë × gjerësi) që ekzistojnë në
të dyja matjet** — jo mbi totalet e papërpunuara, sepse dy xhirot mbuluan grupe paksa të ndryshme
rrugësh dhe 19 matje mungonin (kjo e ndotte krahasimin e parë; u ndreq te `krahaso-para-pas.mjs`).

| Kriteri | Para | Pas | Ndryshimi | Synimi |
|---|---|---|---|---|
| Tekste nën 16′ | 5 010 | **3 237** | **−1 773 (−35%)** | 0 |
| Tekste nën 20′ | 6 113 | 5 886 | −227 (−4%) | ≤652 |
| Caqe nën 24px | 322 | 308 | −14 (−4%) | 0 |
| Caqe nën 44px | 661 | **427** | **−234 (−35%)** | ≤50 |
| Rreshta mbi 75 karaktere | 92 | 91 | −1 | 0 |

**Regrese: asnjë.**

### U-02 e mbyllur me numër (faqja më e dëmtuar e platformës)
`/biznese/[id]/edit`: tekste nën 16′ **195 → 45**, caqe nën 24px **36 → 27**,
caqe nën 44px **185 → 16**. Përmirësimi më i madh i regjistruar deri tani në një faqe të vetme.

### Faqe të tjera që lëvizën ndjeshëm
`/profile/analytics` 295→151 · `/referral` 211→123 · `/premium` 132→49 · `/profile` 199→116 ·
`/biznese/[id]/analytics` 154→73 · `/te-dhenat-mia` 130→53 · `/takedown` 95→36.

---

## 13. GABIM I IMI, I ZBULUAR NGA MATJA: dyshemeja është 0.3px e shkurtër

Analiza e shpërndarjes së teksteve që MBETEN nën 16′ në laptop-1280:

| Madhësia | Sa raste |
|---|---|
| **15px** | **921** |
| 13px | 309 |
| 12px | 260 |
| 11px | 223 |
| 10px | 118 |
| 14px | 49 |

**921 raste rrinë saktësisht te 15.00px** — pikërisht vlera që jep formula ime
`--fs-dysheme: clamp(12px, 10.69px + 0.337vw, 16px)` në 1280px. Por kërkesa ISO për 16′ në atë
gjerësi është **15.3px**. Pra dyshemenë e projektova me numra të rrumbullakët (12 mobil / 15
desktop) pa e kontrolluar kundrejt kërkesës së llogaritur në §1. Është 28% e gjithë mbetjes.

**Ndreqja e propozuar** (mban telefonin të paprekur në 12px, ku 16.2′ tashmë kalon):
```css
--fs-dysheme: 12px;                                        /* telefon: 12px = 16.2′ ✓ */
@media (min-width: 700px){
  --fs-dysheme: clamp(15.4px, 12.2px + 0.26vw, 19px);      /* 15.5px @1280 · 17.2 @1920 · 18.9 @2560 */
}
```
Kontrolli: @1280 → 15.53px = 16.3′ ✓ · @1920 → 17.19px = 19.6′ ✓ · @2560 → 18.86px = 16.2′ ✓.
Një rresht i vetëm; heq 921 shkelje pa asnjë ndryshim tjetër kodi.

## 14. U-00b — Faza 0 nuk është e plotë: mbeti CSS-i

Kodmodi preku vetëm stilet **inline** (713 zëvendësime, 0 `fontSize` numerike nën 15 të mbetura).
Por madhësitë në blloqet CSS / styled-jsx nuk u prekën:

| Ku | Sa nën 15px |
|---|---|
| `font-size:` brenda `.tsx` (styled-jsx) | **418** |
| skedarët `.css` | 22 |

Më të ngarkuarit: `app/admin/page.tsx` (22), `app/auth/login/page.tsx` (19),
`BiznesPageClient.tsx` (19), `app/billing/ui.tsx` (13), `biznese/[id]/analytics/page.tsx` (7).
Këto shpjegojnë pjesën tjetër të mbetjes (13px ×309, 12px ×260, 11px ×223, 10px ×118).

**U-00b:** i njëjti trajtim mbi blloqet CSS — `font-size: <15px` → `var(--fs-dysheme)`.

---

## 15. FAZA 0 E PLOTË + NDREQJA E DYSHEMESË — matje verifikuese

Prodhimi `48c346b`. Kufi mjedisi i deklaruar: makina ka **4 GB RAM me ~460 MB të lira**, ndaj
xhiroja e plotë (38 rrugë × 3 gjerësi) vritet nga sistemi. Matja u bë në copa të vogla, një
gjerësi dhe 4 rrugë secila — **8 rrugët më të dëmtuara në laptop-1280**, ku ndodhej dhe problemi.

| Rruga | Fillimi | Pas Fazës 0 | Tani | Caqe <24px | Masa >75 |
|---|---|---|---|---|---|
| `/kushtet` | 92 | 92 | **1** | 8 | 10 |
| `/privatesia` | 133 | 133 | **1** | 1 | 2 |
| `/profile/analytics` | 104 | 104 | **0** | 2 | 0 |
| `/premium` | 52 | — | **3** | 2 | 2 |
| `/biznese/[id]/edit` | 84 | 43 | **0** | 9 | 0 |
| `/` (ballina) | 102 | 102 | **6** | 1 | 0 |
| `/admin` | 65 | 65 | **0** | 2 | 1 |
| `/referral` | 78 | 74 | **2** | 1 | 0 |
| **TOTALI** | **710** | **613** | **13** | **26** | **15** |

**Tekste nën minimumin ISO: 710 → 13, rënie 98%.**
Në telefon, ballina ka tani **0**.

### Atribuimi i saktë (kush e bëri ç'punë)
Faza 0 me kodmodin inline i lëvizi këto faqe vetëm 710→613 (−14%), sepse madhësitë e tyre
ndodheshin në blloqet CSS/styled-jsx, jo në stile inline. Rënia e madhe erdhi nga **dy hapa të
tjerë bashkë**: ndreqja e dyshemesë (gabimi im i 0.3px) dhe **U-00b** (440 konvertime në CSS).
Verifikuar: **0 `font-size` nën 15px të mbetura** në `.tsx` dhe në `.css`.

### Ç'mbetet e hapur në këto faqe
- **26 caqe nën 24px**, të përqendruara te `/biznese/[id]/edit` (9) dhe `/kushtet` (8) → U-02 mbetje + U-03.
- **15 rreshta mbi 75 karaktere**, të përqendruara te `/kushtet` (10) → U-03 nuk ka nisur ende.

---

## 16. VERIFIKIMI I U-02, U-03, U-05 — dhe një kriter i gabuar i imi

Prodhimi `a942e81`.

### U-02 — MBYLLUR ✅
`/biznese/[id]/edit`: caqe nën 24px **9 → 0**. Checkbox-et native u ngritën te 24×24.

### U-03 — MBYLLUR ✅
Kolona e leximit `37em` u zbatua te faqet ligjore. `/kushtet`: rreshta mbi 75 karaktere **10 → 0**;
`/privatesia` **2 → 0**; `/cookies` 0. Caqe nën 24px: **0** në të gjitha.

### Kriteri im ishte i gabuar — I NDREQUR
Raportova fillimisht "7 caqe nën 24px te `/kushtet`" dhe "1 te `/biznese/[id]/edit`". Të gjitha
ishin **përjashtime të shprehura të WCAG 2.5.8**:
- **lidhje inline brenda një fjalie** ("Politikën e Privatësisë", "faqja e kontaktit", "Plani im")
  — teksti i vazhdueshëm është përjashtim i deklaruar i kriterit;
- **`a.skip-link`** ("Kalo tek përmbajtja kryesore") — kontroll jashtë ekranit, i pranishëm në
  ÇDO faqe nga layout-i, pra numërohej 42 herë në totalin origjinal prej 377.

Instrumenti u ndreq: tani i njeh dhe i shënon si `cak<24-perjashtuar`, jo si shkelje.
**Pasojë:** numri bazë 377 caqe nën 24px ishte i fryrë; pjesa e vërtetë është dukshëm më e vogël.

### U-05 — PJESËRISHT ✅, dy të meta
**Punon:** karta e shpalljes ka tani hierarki të vërtetë — çmimi **23.04px @390 · 28.95 @1280 ·
33.19 @1920** (`--fs-tit-m`), mbi titullin (24.12 @1280, `--fs-tit-s`) dhe mbi metan (16.75, `--fs-meta`).

**E metë 1 — PRERJE E ÇMIMIT (regres i ri):** çmimi "Me marrëveshje" pritet
(`scrollWidth > clientWidth`) në **390px dhe 1920px**. Shkaku: `.card-price` ka
`white-space:nowrap; overflow:hidden; text-overflow:ellipsis` dhe fonti u rrit ~2×.
Anti-clip-i i shtuar preku lartësinë e `.card-body`, jo gjerësinë e çmimit.

**E metë 2 — etiketa e kartës së biznesit mbetet te dyshemeja:**
`app/components/BusinessCard.tsx:115` ka `className="card-price"` me **stil inline**
`fontSize: 'var(--fs-dysheme)'`, që mbizotëron rregullin CSS `.card-price{font-size:var(--fs-tit-m)}`.
Del 12px @390 / 15.53 @1280. Nuk është çmim (është etiketë tipi "🛠 Shërbime"), ndaj zgjidhja e
saktë është klasë e vetën, jo çmim i rremë.

**Mësim i përgjithshëm:** stilet inline të Fazës 0 mbizotërojnë çdo rregull CSS të U-orderave të
mëpasëm. Kudo ku një klasë merr token të ri, stili inline mbi të njëjtin element duhet hequr.
Sot preken: `card-price` (1), `badge-` (1), `section-title` (4).

---

## 17. URDHËR PRONARI — RREGULLI MBIZOTËRUES I HAPËSIRËS (5 shtator, mbrëmje)

> **1.** 100% e platformës në ekran.
> **2.** Nëse faqja që zmadhohet nuk mundet 100%, atëherë në sfond kalon 100% **faqja bazë e
> platformës**, ndërsa faqja që po zmadhohet **mbivendoset mbi të, proporcionalisht**, për të
> plotësuar kushtet komode dhe kriteret shkencore. «Kështu bëjnë të gjithë web, kështu funksionon
> edhe desktopi. Ju keni faqen bazë ku mbi të qëndrojnë kutizat e shpalljes dhe katalogu në homepage.»

**Ky rregull ZËVENDËSON §4 Shtresën B.** Doktrina ime e mëparshme — kolonë leximi e ngurtë `37em`
— e kundërshton urdhrin: kolona nuk rritet me ekranin, ndaj faqja mbetet ishull i vogël teksti mbi
bosh. Matje që e provon (prodhimi i sotëm):

| Faqja | Gjerësia e tekstit | Ekrani | Shfrytëzimi | Marzhe bosh |
|---|---|---|---|---|
| `/kushtet` @1920 | **552px** | 1920 | **29%** | 684px majtas + 684px djathtas |
| `/kushtet` @1280 | 550px | 1280 | 43% | 364 + 366 |
| `/listing/[id]` @1920 | 968px | 1920 | 50% | 475 + 477 |

Instrumenti im e quajti "i qendruar ✓" sepse mati **simetrinë**, jo **mbushjen**. Kriteri ishte
i gabuar: simetria e një ishulli të vogël nuk është ekuilibër, është zbrazëti e barabartë.

### Modeli i saktë — dy shtresa, siç e përshkroi pronari
1. **SHTRESA BAZË** — gjithnjë **100% e ekranit**. Është e njëjta guaskë ku sot rrinë kutizat e
   shpalljeve dhe katalogu te ballina. Çdo faqe qëndron mbi të; asnjë ekran nuk mbetet bosh.
2. **SHTRESA E PËRMBAJTJES** — mbivendoset mbi bazën, me gjerësi **proporcionale me ekranin**
   (fraksion i `vw`, kurrë px të ngurtë), me lartësim (hije/kufi) që e ndan nga baza.

### Derivimi (që "proporcionalisht" të ketë numër, jo ndjesi)
Panel = **62vw** dhe shkronja e lidhur me panelin, që masa të mbetet konstante:

| Ekrani | Paneli 62vw | Shkronja për 70 karaktere | Masa |
|---|---|---|---|
| 1280 | 794px | **20.2px** | 70 |
| 1920 | 1190px | **30.3px** | 70 |
| 2560 | 1587px | **40.4px** | 70 |

Shkronja 40px në 2560 është zmadhim i vërtetë proporcional, por del mbi brezin e rehatisë 20–22′.
**Zgjidhja profesionale që i plotëson të dyja:** kur paneli rritet aq sa një kolonë e vetme do të
kalonte 75 karaktere me shkronjë të rehatshme, teksti ndahet në **dy kolona** (`columns`), si te
gazetat dhe aplikacionet desktop. Ekrani mbushet 100%, gjithçka rritet proporcionalisht, dhe syri
mbetet brenda masës së lexueshme.

### Kriteret e pranimit (të matshme)
| Kriteri | Si matet |
|---|---|
| Shtresa bazë mbush ekranin | përmbajtje e vizatuar (jo sfond bosh) në ≥98% të gjerësisë, në çdo rrugë |
| Paneli është proporcional | raporti `gjerësi paneli ÷ gjerësi ekrani` **konstant ±3%** në 1280/1920/2560 |
| Masa mbetet e lexueshme | 60–75 karaktere për kolonë, në çdo gjerësi |
| Asnjë ishull | shfrytëzimi i përgjithshëm i ekranit **≥85%** (sot: 29% te `/kushtet`) |
| Telefoni i paprekur | @390 numrat e sotëm nuk lëvizin |

### 17.1 · SQARIM I PRONARIT — çfarë është shtresa bazë

Pyetja ime: a duhet baza të tregojë katalogun e vërtetë (kutizat e ballinës) apo mjafton guaska?

**Përgjigjja:** «Vetëm guaskë, pa asnjë detaj — një faqe guaskë, **"tavolinë e pastër"**, ku
vendosen faqet që nuk mund t'u zmadhohet përmbajtja se prishen dhe bëhen jokomode e të
palexueshme. Mjafton që ekrani të mbushet me diçka plotësisht.»

**Pra baza NUK është ballina dhe NUK përmban karta, katalog, apo asnjë të dhënë.** Është sipërfaqja
e platformës — e pastër, e qetë, pa përmbajtje që tërheq syrin — thjesht që ekrani të mos jetë bosh
dhe paneli të ketë ku të qëndrojë.

**Pasojë për zbatimin (më e thjeshtë se ç'e kisha menduar):**
- Nuk kërkohet të rendërohet asnjë komponent i ballinës nën panel — pa kosto të dhënash, pa
  kërkesa rrjeti, pa rrezik ngadalësimi.
- Baza është sipërfaqe vizuale: ngjyra/tekstura e platformës, në gjithë ekranin.
- Paneli qëndron mbi të me lartësim (hije + rreze), i ndarë qartë si fletë mbi tavolinë.
- **Ndalohet** çdo detaj dekorativ që konkurron me tekstin: pa karta, pa ikona të mëdha, pa modele
  të zhurmshme. "Tavolinë e pastër" do të thotë e pastër.

**Kriteri i pranimit ndryshon përkatësisht:** "përmbajtje e vizatuar në ≥98%" bëhet
**"sipërfaqe e vizatuar në 100% të ekranit"** — mjafton që asnjë pjesë e ekranit të mos mbetet
zbrazëti pa trajtim, pa kërkuar që ajo sipërfaqe të mbajë informacion.

---

## 18. AUDITIM I PLOTË I HAPËSIRËS — çdo faqe me këtë problem (urdhër pronari)

Instrument i ri: `scripts/autopsia-hapesires.mjs` — mat vetëm mbushjen e ekranit dhe praninë e
shtresës bazë; i lehtë sa të kalojë çdo rrugë me RAM të pakët. Matje @1920, prodhimi i sotëm.

**35 rrugë të matura · 19 dështojnë (54% e platformës).**

Dështimi nuk është i një lloji të vetëm — ndahet në dy tipe që kërkojnë zgjidhje **të ndryshme**:

### TIPI A — ISHULL (marzhe afërsisht të barabarta majtas/djathtas)
Përmbajtja rri e qendërzuar mbi zbrazëti. **Këto duan modelin e §17: guaskë bazë 100% + panel
proporcional mbi të.**

| Shfrytëzimi | Rruga | Marzhe (majtas/djathtas) |
|---|---|---|
| **27.6%** | `/rreth-nesh` | 684 / 707 |
| **28.0%** | `/siguria` | 684 / 699 |
| **28.7%** | `/privatesia` | 684 / 685 |
| **28.8%** | `/kushtet` | 684 / 684 |
| **29.1%** | `/cookies` | 684 / 677 |
| **29.5%** | `/messages` | 546 / 808 |
| **30.2%** | `/takedown` | 670 / 670 |
| 38.8% | `/kontakt` | 580 / 595 |
| 44.9% | `/asistent` | 522 / 536 |
| 52.3% | `/biznese/[id]/edit` | 436 / 480 |
| 53.0% | `/listing/[id]/edit` | 451 / 451 |
| 53.7% | `/listing/new` | 438 / 451 |
| 55.3% | `/listing/[id]` | 475 / 384 |

### TIPI B — E ANKORUAR MAJTAS (bosh vetëm djathtas)
Përmbajtja nis majtas dhe thjesht nuk e mbush ekranin. **Këto NUK duan panel mbi bazë — duan
vetëm zgjerim**, sepse janë lista/rrjeta (Shtresa A e skanimit).

| Shfrytëzimi | Rruga | Marzhe |
|---|---|---|
| 47.0% | `/biznese` | 88 / **929** |
| 51.7% | `/favorites` | 142 / **785** |
| 54.5% | `/saved-searches` | 142 / **732** |
| 58.7% | `/te-dhenat-mia` | 104 / **688** |
| 68.0% | `/oferta` | 142 / 473 |
| 78.4% | `/biznese/[id]?public=1` | 88 / 328 |

### Faqet që kalojnë (≥85%) — mos i prek
`/notifications` 98% · `/` 93.9% · `/search/results` 90.9% · `/profile` 90.9% · `/biznese/[id]` 90.6% ·
`/u/[id]` 90.2% · `/kategori` 89.8% · `/search` 89.8% · `/profile/analytics` 89.8% · `/referral` 89.1% ·
`/premium` 88.8% · `/billing` 88.7% · `/kategori/[slug]/[qytet]` 88.2% · `/kategori/[slug]` 87.6% ·
`/biznese/[id]/analytics` 87.5%

### Kufi i instrumentit, i deklaruar
`/admin` dha 580% sepse matja kap edhe elemente të pozicionuara jashtë ekranit (skip-link te
x=−9999). Duhet përjashtimi i elementeve me `x < 0`; deri atëherë `/admin` mbetet **i pamatur**,
jo "i kaluar".

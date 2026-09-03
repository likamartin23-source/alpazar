# AUTOPSIA TOPOGRAFIKE E ALPAZAR
### 36 rrugë × 2 gjerësi × 4 instrumente · 3 shtator 2026 · prodhimi `7de982c`

---

## 0. Si u mat — dhe pse ky raport nuk i beson matësit tim

Matja e mëparshme u tërhoq në **[O65]**: një iframe i vetëm që ndërronte `src`,
me `onload` që kishte shkrepur tashmë për faqen e mëparshme. Matej DOM-i i vjetër.

Kësaj here: **kontekst i pastër faqeje për çdo matje**, në Chromium të vërtetë,
390×844 (telefon, dpr 3) dhe 1280×900 (kompjuter). Asnjë gjendje nuk kalon.

**Instrumenti im i kontrastit gënjeu edhe tri herë sot:**

| # | Gabimi | Shkaku | Pasoja |
|---|---|---|---|
| 1 | `cr = 1.00` mbi butonat ari | lexonte vetëm `backgroundColor`; gradienti është `backgroundImage` | shpikte dështime te butonat 12.88:1 |
| 2 | emoji si dështim | glifi nuk e ndjek `color` të CSS-së | `📬` "me ngjyrë të zezë" |
| 3 | etiketa `left:-9999` | s'i sheh askush | `<span>Gjuha</span>` për lexues ekrani |

Pas tri rregullimeve raportonte ende **81–147** dështime.
**axe-core raporton 25.** Instrumenti im mbivlerësonte 3–6×.

> **Prandaj çdo numër aksesueshmërie në këtë raport është i axe-core, jo i imi.**
> Matësi im mbahet vetëm për atë që axe nuk e mat: prekja, ritmi, tipografia,
> gjatësia e rreshtit.

Instrumentet: `playwright` · `axe-core` (motori i Deque) · `lighthouse` ·
matësi topografik. Artefaktet: `.ops/autopsi/` (144 screenshot + 4 JSON).

**Mbulimi i ndershëm:** pa pëlqim, **13 nga 36 rrugët** shfaqin faqen e hyrjes
(gjurmë DOM identike: 33 ndërveprime / 49 nyje teksti). Nuk u matën si vetvetja.
Të gjitha matjet më poshtë janë **me pëlqimin e dhënë**, ku 36/36 japin përmbajtje.
Faqet pas hyrjes nuk maten dot pa kredenciale — **pronari hyn, jo unë.**

---

## 1. P0 — Lidhja ligjore e portës së moshës është e vdekur

`app/components/AgeGate.tsx:73`

```jsx
<a href="/terms" …>Kushtet e Shërbimit</a>
```

| Rruga | Kodi |
|---|---|
| `/terms` | **404** |
| `/kushtet` | 200 |

Teksti thotë: *"Duke klikuar «Po», konfirmon se ke mbushur 16 vjeç dhe pranon
**Kushtet e Shërbimit**."* — dhe lidhja e vetme drejt tyre nuk hapet.

**Prek 100% të vizitorëve**, në ekranin e parë, para çdo gjëje tjetër.
E vetmja shfaqje në gjithë kodin (`grep` mbi `app/` + `lib/`): gabim shkrimi i
izoluar, jo alias sistemik. **Rregullimi: një fjalë.**

Kontrolluar edhe 13 lidhjet e tjera të brendshme të komponentëve (14 referenca unike gjithsej) — **vetëm kjo
është e thyer.**

---

## 2. P0 — Tri mure pëlqimi njëherësh në vizitën e parë

Në të njëjtin moment, mbi njëri-tjetrin:

| Shtresa | Skedari | z-index |
|---|---|---|
| Porta e moshës | `AgeGate.tsx:31` | 99999 |
| "Mirë se erdhe!" | `Onboarding.tsx` | — |
| Banderola e cookies | `CookieBanner.tsx:32` | 9999 |

Dëshmi: `.ops/autopsi/390-_.png`, `1280-_.png` — të tria dukshëm në një kuadër.

Kjo është e kundërta e "komode". Vizitori i ri nuk sheh platformën; sheh një radhë.

**Dhe brenda portës, tri defekte të tjera:**

| Çfarë | Matja | Kufiri |
|---|---|---|
| Teksti shpjegues `#555` @12px | **2.38:1** | 4.5:1 |
| Rreshti ligjor `#555` @10px | **2.38:1** + nën 12px | 4.5:1 |
| Butoni "Jo, largohem" `#666` @14px | **3.09:1** | 4.5:1 |

Në telefon **teksti i të dy butonave thyhet në dy rreshta** — `padding:'14px 32px'`
+ `gap:12` nuk hyjnë në 342px të lira. Në kompjuter jo. Dëshmi: `390-_.png`.

Paneli është `rgba(17,17,17,0.97)` — 3% i tejdukshëm, ndaj te `/listing/…`
teksti i faqes shpon nëpër butonin "Jo, largohem". Dëshmi:
`390-_listing_….png`.

---

## 3. Aksesueshmëria — vendimi i axe-core

36 rrugë × 2 gjerësi, WCAG 2.0/2.1 A + AA + praktikat më të mira.

| Ndikimi | Rregulla | Nyje | Faqe |
|---|---|---|---|
| **serious** | `color-contrast` | 25 | 11 |
| **serious** | `scrollable-region-focusable` | 4 | 3 |
| moderate | `region` (përmbajtje jashtë landmark-eve) | 33 | 19 |
| moderate | `landmark-no-duplicate-main` | 6 | 3 |
| moderate | `landmark-main-is-top-level` | 6 | 3 |
| moderate | `landmark-unique` | 6 | 3 |
| moderate | `page-has-heading-one` | 2 | 1 |

**Asnjë shkelje `critical`.** Asnjë imazh pa `alt` (0 shkelje `image-alt`). Asnjë kontroll pa emër
të aksesueshëm (0/1090). Asnjë fushë pa etiketë (0/49). `lang="sq"` kudo.
Këto janë të bëra mirë dhe duhen thënë.

### 3.1 Tri rregullat e landmark-eve janë NJË defekt

`app/layout.tsx:263` mbështjell çdo faqe:

```jsx
<AgeGate><main id="main-content">{children}</main></AgeGate>
```

dhe tri faqet e kategorive shtojnë të tyren brenda tij:

| Skedari | Rreshti |
|---|---|
| `app/kategori/page.tsx` | 47 |
| `app/kategori/[slug]/page.tsx` | 78 |
| `app/kategori/[slug]/[qytet]/page.tsx` | 84 |

```jsx
<main className="seo-wrap">   →   <div className="seo-wrap">
```

**Tri fjalë → 18 nga 53 nyjet moderate mbyllen** (3 rregulla × 6 nyje, të gjitha nga një shkak).

### 3.2 Rripat horizontalë nuk kapen me tastierë

`scrollable-region-focusable` te `/listing/[id]`, `/privatesia`, `/cookies`.
`overflow-x:auto` pa `tabindex="0"`: kush lëviz vetëm me tastierë nuk e arrin
përmbajtjen brenda. Është edhe rripi ku "Prona" pritet në mes te ballina.

### 3.3 `/notifications` — e vetmja faqe pa `<h1>`

Konfirmuar në të dy gjerësitë, në të dy kalimet.

---

## 4. Prekja — dy standarde, dy përgjigje shumë të ndryshme

390px, 36 faqe, 1120 objekte ndërvepruese.

| Kufiri | Rezultati |
|---|---|
| **WCAG 2.5.8 AA** (24×24, me përjashtimet e veta) | **26 shkelje** |
| WCAG 2.5.5 AAA (44×44) — synimi i brendshëm | 244 / 1120 = **21.8%** |

Numri "21.8% nën 44px" pa këtë kontekst është alarm i rremë: 44×44 është synim
AAA, jo kufi AA. Dhe **të 26 shkeljet AA kanë vetëm tre shkaqe:**

| Shkaku | Ku | Sa |
|---|---|---|
| `.forgot-link` "Keni harruar fjalëkalimin?" | 15 faqe (guaska e hyrjes) | 15 |
| Lidhjet e fundit `font-size:11px` | `/privatesia` 4, `/kushtet` 2, `/siguria` 2 | 8 |
| `.card-seller-ov` mbi kartat | `/`, `/search/results`, `/kategori/automjete` | 3 |

**Tre rregullime → 26/26 mbyllen.**

---

## 5. Lexueshmëria dhe bukuria — matje, jo shije

### 5.1 Nuk ka shkallë tipografike

**20 madhësi të dallueshme** në të njëjtën platformë:
`5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 23, 26, 30, 32, 48 px`

Një shkallë e shëndetshme ka 6–8. Nuk është dizajn — është grumbullim.

**Dhe rrëshqitja shkon në drejtim të gabuar:**

`app/HomeClient.tsx:710`
```css
.float-label{font-size:7px;}
@media(min-width:768px){ .float-label{font-size:11px;} }
```

**7px në telefon, 11px në kompjuter.** Teksti më i vogël i platformës është
pikërisht aty ku lexohet më vështirë. Duhet e kundërta.

**51.5% e nyjeve të tekstit në telefon janë nën 12px** (957/1860).

### 5.2 Nuk ka ritëm formash

**14 rreze qoshesh të dallueshme:** `4, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 50, 999`
`9`, `10`, `11`, `12` në të njëjtën faqe janë të padallueshme për syrin — janë
katër vendime aty ku duhej një.

### 5.3 Paleta nuk është paletë

| Matja | Vlera |
|---|---|
| Heksadecimale unike të shkruara me dorë | **257** |
| Përdorime gjithsej | 2023 |
| Tokene ngjyre të deklaruara në CSS | **14** |
| Të shkruara me dorë jashtë sistemit | **243 / 257 (94.6%)** |
| `:root` i deklaruar në `ui-refine.css` | **4 herë** |

Grupuar sipas distancës perceptuale **CIE76** (`dE < 2.3` = kufiri ku syri i
njeriut *sapo* fillon të dallojë):

**35 grupe që syri nuk i dallon, 887 përdorime të bllokuara në to.**

| Ngjyra | Sa shkrime | Përdorime | Shembull |
|---|---|---|---|
| `#C42B0F` (e kuqja e markës) | **2** | 233 | `#C42A0E` — dE **0.41**, Δrgb `0,-1,-1` |
| `#F0F0F0` (gri e çelët) | **10** | 94 | `F5F5F5 ECECEC F3F3F3 F2F2F2 F4F4F4 F6F6F6 F1F1F1 F4F4F5 F5F4F2` |
| `#F9F9F9` | **8** | 29 | `F8F8F8 FAFAFA F7F7F7 F9F9F7 FFFFFF FFFAF9 F8F9FB` |
| `#FFF0EE` | 7 | 72 | `FEECEC FFF1EE FDECEC FDECEA FFF5F3 FFF3F0` |
| `#FFFBEA` | 5 | 94 | `FBF7E8 FFF6E5 FFF9E6 FFF8E8` |
| `#1A1A1A` | 3 | 66 | `1C1C1C 1E1E1E` |

`#C42B0F` vs `#C42A0E`: **dE = 0.41.** Asnjë sy njeriu nuk i dallon. Janë
një ngjyrë e shkruar dy herë (175 + 58), 233 herë e përdorur.

`#F0F0F0` i shkruar **dhjetë mënyra** është përkufizimi i driftit.

### 5.4 Gjatësia e rreshtit

| Gjerësia | Rreshta > 90 karaktere |
|---|---|
| 390px | **0** |
| 1280px | **95** |

Në kompjuter paragrafët shtrihen përtej kufirit të rehatshëm të leximit
(45–75 karaktere). Në telefon janë në rregull. Mungon një `max-width` te teksti.

### 5.5 `<header>` mungon në 36/36 faqe

Ka `<main>`, `<nav>`, `<footer>` — jo `<header>`. Prandaj edhe 33 nyjet
`region` jashtë landmark-eve.

---

## 6. Performanca — Lighthouse me mbytje reale

4G e ngadalte + CPU 4× më e ngadaltë (telefon), kabllo (kompjuter).

> **Prejardhja e këtyre numrave.** Lighthouse i mati të 16 rreshtat, por u rrëzua
> me `EPERM` te pastrimi i dosjes së përkohshme të Chrome-it **para** se të
> shkruante skedarin — `krom.kill()` para `writeFileSync`. Rregullimi është te
> `scripts/autopsia-performances.mjs`. `performanca.json` u rindërtua nga dalja e
> shtypur e po asaj ekzekutimi, ndaj mban vetëm fushat e shtypura (perf, LCP,
> CLS, TBT, peshë) dhe e deklaron këtë te fusha `burimi`. Numrat janë matje
> të vërteta; **skedari nuk është dalje e drejtpërdrejtë e instrumentit.**

| Faqja | Pajisja | Perf | LCP | **CLS** | TBT | Pesha |
|---|---|---|---|---|---|---|
| `/` | telefon | 34 | 7.8s | 0.001 | 7374ms | 0.56MB |
| `/search` | telefon | 52 | 5.0s | 0.000 | 2239ms | 0.46MB |
| `/kategori/automjete` | telefon | 46 | 6.0s | 0.000 | 3349ms | **7.18MB** |
| `/listing/…` | telefon | 41 | 5.7s | 0.000 | 8179ms | 0.67MB |
| `/biznese/…` | telefon | 44 | 5.9s | 0.074 | 4008ms | **5.60MB** |
| `/kategori/automjete` | kompjuter | 55 | 1.6s | 0.003 | **15117ms** | **7.84MB** |

### 6.1 Faza 5 është arritur — thuajeni

**CLS maksimal 0.074**, kudo tjetër ≤ 0.008. Synimi ishte < 0.1. **I arritur.**
Kjo është punë e mirë dhe nuk duhet lënë në heshtje.

### 6.2 98% e peshës është një skedar i vetëm

```
7.32 MB  video/mp4  res.cloudinary.com/…/f_mp4,vc_h264,q_auto/reclsv6…
0.04 MB  image/jpeg (posteri)
0.03 MB  font/woff2 × 4
─────────
7.46 MB  gjithsej
```

Një video **7.32 MB** në një kartë shpalljeje. Ballina: 0.14 MB.

**Të jemi të saktë: ngarkimi i vonuar është bërë mirë.** `ListingCard.tsx:197–205`
e monton `<video>` vetëm kur karta hyn ≥50% në pamje (IntersectionObserver),
me `preload="metadata"`. Ajo pjesë është e drejtë.

Kostoja vjen nga një hap më tutje: `autoPlay muted loop`. Sapo elementi montohet
dhe luajtja nis, shfletuesi e rrjedh **tërë skedarin** — `preload="metadata"`
nuk vlen më pasi luajtja ka filluar. Dhe burimi është
`f_mp4,vc_h264,q_auto` — **`q_auto` pa kufi përmasash apo bit-rate**, pra në
rezolucion të plotë, për një kartë 175px të gjerë.

Në 4G telefoni janë ~40 sekonda shkarkim për një kartë në një listë.

**Rregullimi është te URL-ja e transformimit, jo te logjika:** shto `w_640` dhe
një kufi `br_` (bit-rate). Karta është 175px e gjerë; `w_640` mbulon dpr 3 me
tepricë dhe pritet të bjerë nën ~0.4 MB. Alternativa: hiq `autoPlay` dhe luaj
me prekje — por kufizimi i burimit e zgjidh pa e ndryshuar përvojën.

### 6.3 TBT është problemi i vërtetë

2.2–8.2s në telefon (kufiri 200ms). 15.1s në një rast. LCP 4.0–7.8s.
Kjo nuk zgjidhet me imazhe — është JavaScript që bllokon fillin kryesor.
**Kërkon hetim të veçantë; nuk e mbyll dot ky raport.**

---

## 7. Me sy — çfarë nuk e kap asnjë matës

### 7.1 Gjashtë shtresa lundruese mbi përmbajtjen

`.ops/autopsi/pas-pelqimit/390-_.png` dhe `1280-_.png`:

`Instalo` (jeshile) · `Ndaj` (blu) · `×` · "Keni nevojë për ndihmë?" ·
robot FAB (e kuqe) · shiriti i poshtëm — **të gjitha njëherësh**.

`app/HomeClient.tsx:69` dhe `:229`:
```js
position:'fixed', bottom: 226, left: 12, zIndex: 190
position:'fixed', bottom: 157, left: 12, zIndex: 190
```

Pozicione fikse, në të majtë. **Mbulojnë kartën e biznesit** — në kompjuter
mbi ~60px nga 280px të kartës, duke fshehur distinktivin "Biznes".
Janë të tërhiqshme, por kjo është pamja që sheh çdo vizitor i ri.

Katër ngjyra thekse konkurrojnë në një ekran: **ari, e kuqe, jeshile, blu.**

### 7.2 "Hyr" dy herë në të njëjtin kokë

`app/HomeClient.tsx:810` → `Hyr` · `:850` → `Hyr / Regjistrohu`
I njëjti destinacion `/auth/login`, ~250px larg njëri-tjetrit.
Zhduket kur je i loguar (`:810` bëhet "Profili") — **pra e prek vetëm vizitorin e ri.**
Dëshmi: `pas-pelqimit/1280-_.png`.

### 7.3 Çmimi dy herë njëherësh

`pas-pelqimit/390-_listing_….png`: `258 L` i madh në trup **dhe** `ÇMIMI 258 L`
te shiriti i ngjitur — të dy dukshëm, ~200px larg. Shiriti ekziston pikërisht
që të mbajë çmimin kur ai humbet nga ekrani.

Në të njëjtin kuadër: distinktivi `2` pranë zemrës **pritet nga skaji i djathtë**,
dhe shiriti i poshtëm **mbulon seksionin "SHITËSI"**.

### 7.4 Proporcioni në kompjuter

Banderola heroike në 1280px: teksti zë ~25% majtas, pastaj zbrazëti e gjatë,
pastaj statistikat në skaj. Titulli duket ~13px në një banderolë 1180px të gjerë.
Nënititulli i kuq ~9px. "Biznese Online" ka **një kartë** në një rresht që mban katër.

Kjo është pikërisht "jo proporcionale".

### 7.5 Një çështje besueshmërie, jo kodi

Banderola thotë **"Platforma #1 shqiptare e tregtisë online"** ndërsa numëruesi
pranë saj tregon **2 SHPALLJE · 2 PËRDORUES**. Të dyja në një kuadër.

---

## 8. CI-ja është e kuqe në `main` — dhe deploy-i ndodhi gjithsesi

| Fluksi | `7de982ca` | `3732061b` | `9a8296e2` |
|---|---|---|---|
| Kontrata kod↔DB | ✅ | ✅ | — |
| **CI — Build & Type Check** | ❌ | ❌ | ❌ |
| Verifiko deploy-in live | ✅ | ✅ | ✅ |
| **Rojtari — çdo 5 minuta** | ❌ | ❌ | — |

Hapi që dështon, i identifikuar saktë: **"Roja e unifikimit"**.
`tsc`, `build`, E2E Playwright dhe kontrata kod↔DB **kalojnë të gjitha**.

```
▼ radiuse_inline:    385 (bazë 386)
▼ ngjyra_hex_inline: 3389 (bazë 3394)
```

Rojtari po bën saktësisht punën e vet: refuzon një lëvizje të paregjistruar.
Por askush nuk e mbylli ciklin, ndaj **main është i kuq që nga 02:54** dhe
gjashtë përmirësime rrinë të pambyllura me çelës.

```bash
node scripts/roja-unifikimit.mjs --shkruaj-bazen
```

`scripts/lib/baza-unifikimit.json` është në listën [O41] — **e lë për code.**

**Dhe pyetja më e madhe:** Vercel bëri deploy me CI-në të kuqe. Rojtari mund të
raportojë, por nuk ndalon dot asgjë.

---

## 9. Çfarë NUK u mat — që të mos mbetet në heshtje

| Fusha | Pse jo |
|---|---|
| Faqet pas hyrjes si vetvetja | Pronari hyn, jo unë |
| Kontrasti i gjendjeve `:hover`/`:focus` | Kërkon skenar ndërveprimi |
| Lexuesi i ekranit (NVDA/VoiceOver) | Gjykim njerëzor, jo matje |
| Shkalla e zmadhimit 200% | Kërkon kalim të veçantë |
| `prefers-reduced-motion` | Nuk u kontrollua |
| Burimi i TBT 2–15s | Kërkon profil i veçantë i JS-së |
| `GITHUB_TOKEN` te `.env.local` | **I skaduar** — "Bad credentials" |

---

## 10. Kuadri ligjor

> Nuk jam jurist. Më poshtë është hartëzimi i gjetjeve teknike me aktet që i
> bëjnë ato të rëndësishme; **kërkon konfirmim nga jurist.**
> Prioriteti: **ligji shqiptar** i pari, e drejta e BE-së e dyta.

### Shqipëri (prioritet maksimal)

| Gjetja | Akti |
|---|---|
| `/terms` → 404 nën një deklaratë pëlqimi | Ligji nr. **9902/2008** "Për mbrojtjen e konsumatorëve" — informimi paratkontraktor; Ligji nr. **10128/2009** "Për tregtinë elektronike" — detyrimi i informimit |
| Pëlqimi për cookies | Ligji nr. **9918/2008** "Për komunikimet elektronike", **neni 123** — cituar tashmë te `lib/consent.ts` |
| Të dhënat personale | Legjislacioni shqiptar në fuqi për mbrojtjen e të dhënave personale *(numri i aktit të konfirmohet)* |
| Aksesueshmëria | Ligji nr. **93/2014** "Për përfshirjen dhe aksesueshmërinë e personave me aftësi të kufizuara" |
| Mosha 16+ | Kushtet e vetë platformës + kufiri i pëlqimit të të miturve |

### Bashkimi Evropian (prioritet sekondar)

| Gjetja | Akti |
|---|---|
| Kontrasti, prekja, landmark-et, tastiera | **Direktiva (BE) 2019/882** — *European Accessibility Act*, mbulon **shërbimet e tregtisë elektronike**, e zbatueshme që nga 28 qershor 2025; referon **EN 301 549**, që adopton **WCAG 2.1 AA** |
| Cookies | Direktiva **2002/58/KE** (ePrivacy) |
| Të dhënat | **Rregullorja (BE) 2016/679** (GDPR) |

**Rëndësia praktike:** EAA-ja e bën WCAG 2.1 AA kërkesë për një treg online si ky.
Të 25 nyjet e kontrastit dhe 26 shkeljet e prekjes bien pikërisht aty — dhe janë
**pak dhe të grupuara**, pra të mbyllshme shpejt.

---

## 11. Rendi i propozuar

| # | Veprimi | Kosto | Prek |
|---|---|---|---|
| 1 | `/terms` → `/kushtet` | 1 fjalë | 100% vizitorëve, ligjore |
| 2 | Mbyll bazën e rojtarit | 1 komandë | CI-ja bëhet e gjelbër |
| 3 | `<main class="seo-wrap">` → `<div>` × 3 | 3 fjalë | 18 shkelje axe |
| 4 | Kufizo videon (`w_640` + bit-rate) | URL transformimi | 7.3MB → ~0.4MB |
| 5 | `.forgot-link` + fundi 11px + `.card-seller-ov` ≥24px | 3 rregulla CSS | 26/26 prekje |
| 6 | Porta: `#555`→`#B0B0B0`, `#666`→`#9A9A9A`, panel i plotë, butona në kolonë | 1 skedar | 3 kontraste + thyerja |
| 7 | Radhit tri shtresat e pëlqimit | logjikë | komoditeti i vizitës së parë |
| 8 | `tabindex="0"` te rripat horizontalë | 3 vende | tastiera |
| 9 | `<h1>` te `/notifications` | 1 rresht | 1 shkelje |
| 10 | Hiq "Hyr" e dyfishtë; ripozicionoi lundruesit | `HomeClient.tsx` | qartësia |
| 11 | Bashko 35 grupet e ngjyrave; një `:root` | e madhe | 887 përdorime |
| 12 | Shkallë tipografike 6–8 hapa; `.float-label` ≥11px kudo | e madhe | 51.5% teksti |
| 13 | Hetim i TBT 2–15s | e madhe | LCP në telefon |

**1–3 janë tri fjalë dhe një komandë.** 4–9 janë punë e një seance.
10–13 janë vendime dizajni, jo rregullime — për code.

---

## 12. Çfarë është e bërë mirë

Nuk raportohen vetëm defektet.

- Asnjë shkelje **`critical`** e axe në 72 matje
- **0** imazhe pa `alt` (asnjë shkelje `image-alt` te axe në 72 matje) · **0/1090** kontrolle pa emër · **0/49** fusha pa etiketë
- `lang="sq"` në 36/36 faqe · `<main>` në 36/36 · asnjë kërcim hierarkie kreu
- **Asnjë dalje horizontale** në asnjë faqe, në asnjë gjerësi
- **CLS ≤ 0.074 kudo** — synimi i fazës 5 i arritur
- Pëlqimi te `lib/consent.ts` është pëlqim i vërtetë me pasojë, jo njoftim
- `LanguageSwitcher` mban `<select>` amtare nën pamjen e vet — e drejtë
- 35/36 faqe kanë saktësisht një `<h1>`

---

*Artefaktet: `.ops/autopsi/` — 144 screenshot, `matjet.json`, `axe.json`,
`prekja.json`, `performanca.json`.*
*Instrumentet: `scripts/autopsia-topografike.mjs`, `autopsia-axe.mjs`,
`autopsia-prekjes.mjs`, `autopsia-performances.mjs`, `autopsia-ngjyrave.mjs`,
`autopsia-peshes.mjs`, `prova-kontrastit.mjs`.*

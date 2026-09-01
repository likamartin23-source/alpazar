# AUTOPSIA E BLLOKUT — çfarë s'u reflektua siç u miratua (1 shtator 2026)

> Objekti: a është zbatuar **blloku siç është miratuar** (dokumentet
> *Gjendja-cak e harmonizuar*, *Blueprint*, *Autopsi realtime*) dhe a është
> **integruar/unifikuar** me sistemet ekzistuese — profil i jashtëm `/u`,
> i brendshëm `/profile`, vizitor-pronar vs vizitor, biznes, admin, dhe
> ndërlidhja si rrjet social.
>
> **Metoda (§9 — tre instrumente, zero hamendje):** (1) e vërteta e bazës me
> `execute_sql`; (2) HTML-ja LIVE e prodhimit me `web_fetch_vercel_url` + grep;
> (3) auditim i kodit me katër agjentë paralelë mbi `main`. Krahasuar me
> gjendjen-cak të miratuar.

---

## 1. Çfarë ËSHTË reflektuar saktë (verifikuar live + kod)

| Element i miratuar | Gjendja | Provë |
|---|---|---|
| Kartë e vetme `ListingCard` kudo (feed/kërkim/kategori/ruajtura/u/biznese) | ✅ | agjenti 4; `seo-card` s'ekziston më (vetëm komente) |
| Karta biznes-aware (biznes→/biznese 🏢 · person→/u) | ✅ | `ListingCard.tsx:124,259-299`; live `/kategori` → `listing-card`, 4× `/biznese/` |
| `LISTING_SELECT` kanonik me join biznesi | ✅ (home/kërkim/kategori) | `lib/listingSelect.ts:6-7` |
| `/biznese` publik: shirit reputacioni (⚡ pikë + TrustBadge) | ✅ | live; agjenti 2 |
| `/biznese`: info-row 👁/🔴/⏱️, ★ Pronari→/u, Rreth & Vlerësime, banderolë pronari | ✅ | agjenti 2 |
| `/u`: stats 4-kuti, tabs, banderolë pronari, empty-state→biznes, avatar tier | ✅ | live + agjenti 1 |
| `/listing`: bllok shitësi me pikë+TrustBadge, një lidhje biznesi, Njoftomë, pa referral | ✅ | agjenti 3 |

---

## 2. Çfarë NUK u reflektua siç u miratua — gjetjet që i shpëtuan auditeve

### G1 · Çharmonizim i reputacionit midis tri sipërfaqeve (defekti bërthamë)
I njëjti person shfaqet ndryshe:
- **/u** — i gjithë shiriti (pikë + Besueshmëri) fshihej nga `trust_score_visible=false`.
  Matur live: `/u/likamartin23` (135 pikë reale) → **0 shfaqje "pikë"**.
- **/biznese** — pikët e trashëguara nga pronari shfaqen PA atë kusht.
- **/listing** — pikët me kusht `>0`; por live NUK dalin në SSR (render vetëm-klient).

→ Klasë F1/F4 (boshllëk midis shtresave + pretendim vs matje): blueprint-i thoshte
"laku i reputacionit i mbyllur", por logjika e portës ndryshonte për sipërfaqe.
**RESTAURUAR (RF1):** te `/u`, pikët (sinjal publik gamifikimi) shfaqen gjithnjë
kur >0; vetëm unaza e Besueshmërisë respekton opt-out-in (Ligji 124/2024). Tani
135 pikët dalin te `/u` si te `/biznese`/`/listing`.

### G2 · Mungon Ndiq/Follow te /u (primitivë e rrjetit social)
Numri i ndjekësve lexohej, por **s'kishte buton Ndiq** (matur live: pa "Ndiq").
Miratimi A2 e kërkon. **RESTAURUAR (RF2):** toggle Ndiq/Duke-ndjekur mbi `follows`
(RLS `follower_id=auth.uid()`), optimist me rikthim në gabim.

### G3 · /biznese publik pa badge-t 👑 VIP / 🏢 Biznes
Ishin vetëm te paneli i pronarit, jo te vizitori (miratimi B2 i kërkon).
**RESTAURUAR (RF3):** shtuar te rreshti publik i badge-ve.

### G4 · Butonat ekskluzivë të /listing NUK janë të grupuar (Gap6 — MBETET)
Miratimi D: Vlerëso·Ruaj·Ndaj·Raporto në një rresht. Realiteti: vetëm Raporto+Ndaj
(+Takedown) janë bashkë; **Ruaj** është zemra te galeria, **Vlerëso** seksion më vete.
→ Kërkon riorganizim pamor — lihet për verifikim vizual (terminali), s'e prek verbërisht.

### G5 · Të tjera të matura (të vogla)
- **TrustBadge** te /u & /biznese thirret pa `score` → përdor heuristikë `calcTrustScore`,
  jo `profiles.trust_score`; etiketa thotë "Trust Score", jo "Besueshmëria".
- **/listing**: "★ Pronari" udhëtues mungon si i tillë — ka "Shiko profilin →" (lidh /u).
- **/biznese**: Harta/Drejtime është çip, jo buton veprimi (B2).
- **Unifikim jo plotësisht një-burim:** `favorites`, `/u`, `/biznese` përdorin select të
  ngushtë në vend të `LISTING_SELECT` (të sigurt sot me `showSeller={false}`, rrezik drift).
- **/listing**: reputacioni i shitësit renderohet vetëm-klient (jo SSR) → crawler/first-paint
  s'e sheh (SEO + flash i lehtë).
- **/u**: ndjekës/pikë/sold ngarkohen vetëm-klient (jo SSR-seed) → flash 0 i shkurtër.

---

## 3. Restaurimi final — çfarë u zbatua tani (CI-green, LIVE)

Commit `0d140fe` (main): tsc 0 · 29 teste · `next build` OK · aditive/të kthyeshme.
- **RF1** — harmonizimi i pikëve te `/u` (ungate nga opt-out i besueshmërisë).
- **RF2** — butoni Ndiq te `/u` (rrjet social).
- **RF3** — badge-t 👑 VIP + 🏢 Biznes te pamja publike e `/biznese`.

## 4. Mbetet për fazën vizuale (me sytë e terminalit, pa vepruar verbërisht)
- **G4** — grupimi i butonave të `/listing` (pamor).
- G5-të e vogla: TrustBadge me `score` real + etiketa "Besueshmëria"; ★ Pronari si
  buton udhëtues; Harta si buton; SSR-seed i reputacionit të shitësit; unifikim i
  `LISTING_SELECT` te favorites/u/biznese.

Rendi: verifikim vizual i RF1-RF3 live → G4 → G5. Çdo hap CI-green + verifikim.

---

## 5. Ballafaqim me burimin ZYRTAR (Notion BP2) — faqe për faqe, ku gabova

> Lexova *"🏁 BLLOKU PËRFUNDIMTAR 2"* (Notion) + 3 organigramat + *Gjendja-cak*.
> Rregull: **"ku kodi ndryshon nga imazhi, fiton imazhi"** (BP2 §C6.6).

### 5.1 Ku GABOVA unë (korrigjim i ndershëm)
- **G4 (grupimi i butonave) — mbivlerësim.** BP2 §B17 e thotë qartë: butonat
  ekskluzivë vendosen **sipas funksionit** (Ruaj vetëm te shpalljet e të tjerëve;
  Ndaj publik+menaxhim; Raporto publik + te pronari "Statusi i raporteve") — jo të
  detyruar në një rresht. Grupimi vinte nga *Gjendja-cak* (vizatim para-autorizimi).
  Vendosja funksionale aktuale mund të jetë e saktë; grupimi = vendim yti, jo defekt.
- **ID-të historike.** Auditova mbi biznesin aktual `ffb19071` (i saktë);
  `dc070b0f`/`ba7ecf6a` të Notion-it janë fshirë (testi B7). S'ishte gabim entiteti.

### 5.2 Checklist BP2 §B15 — verdikt i matur
| Pika BP2 | Verdikt | Shënim |
|---|---|---|
| B2 · panel biznesi = pasqyrë e /profile | ✅ (bërthama) | shell i veçantë (BiznesPageClient:474); devijim i vogël: 3 tabe jo 5, stats 4-kuti vs 3-kuti te /profile |
| B3.1 · shiriti "Vepro si" te të dy panelet | ✅ **RESTAURUAR TANI** | mungonte te /profile; u shtua (commit 3369dda) |
| B7 · fshirja humbje e plotë | ✅ | `dc070b0f` u fshi realisht (verifikuar DB) |
| B5 · "Rreth & Vlerësime" | ✅ | agjenti 2 |
| B6 · 12 kolonat kanonike jsonb | ✅ | (punë e mëparshme) |
| B10 · rrathë/karta kudo · Ruaj i paprekur | ✅ | agjenti 4 |
| B11 · Analitika ekran; biznesi fsheh referral | ✅ | variancë emri (Pasqyrë vs Përmbledhje) |
| B12 · Siguria një ekran, 4 seksione | ✅ | 6 karta në një ekran |
| B16 · hequr "Statistikat e Shpalljeve" + "Abonimi im" | ✅ | koment shprehimor page.tsx:1012 |
| B17 · butonat ekskluzivë sipas funksionit | ✅ | (jo grupim — shih 5.1) |
| Reputacioni i harmonizuar (Gjendja-cak) | ✅ **RESTAURUAR** | RF1 pikët te /u; RF2 Ndiq; RF3 badge-t biznes |

### 5.3 Mbetet (vendim pronari / kalim vizual i terminalit)
- **B2 pixel-mirror:** /profile stats 3-kuti vs biznesi 4-kuti; tabe vs karta për
  Analitika/Mesazhe. A i duash pixel-identikë apo devijimi i tanishëm pranohet?
- **B11 etiketat:** "Pasqyrë/Shpalljet—Krahasim" vs "Përmbledhje/Përmbajtja".
- **G4 grupimi:** vendim — funksional (B17) apo grup pamor (Gjendja-cak)?
- **G5 të vogla:** TrustBadge me `trust_score` real + "Besueshmëria"; ★ Pronari
  udhëtues te /listing; Harta buton; SSR-seed i reputacionit; unifikim LISTING_SELECT.

# KUJTESA E PUNËS — e përbashkët cloud ⇄ terminal

> Kujtesa e vetme e lidhur mes dy sesioneve. Të dy e LEXOJNË në fillim të çdo cikli
> dhe SHTOJNË mësime/gjendje të reja këtu. Mediumi = depoja (të dy e arrijnë).
> Përditësoje pas çdo ndryshimi domethënës. Data e fundit: 1 shtator 2026.

## 0. Burimet e kujtesës (të lidhura)
- **CLAUDE.md** — kujtesa KANONIKE e projektit (rregullorja §8, kontrata §2, kurthet). Mbi të gjitha.
- **docs/bllok/AUTOPSITE-INDEX.md** — indeksi i 9 autopsive të djeshme (31 gush) + vazhdimet; lexoji si kontekst blloku.
- **docs/** — autopsitë: `AUTOPSIA-BLLOKUT-2026-09-01.md`, `SUPERAUTOPSIA.md`, `MEGAAUTOPSIA-*`, `AUDITI-I-SISTEMEVE.md`.
- **docs/bllok/** — MATERIALET E BLLOKUT. **PRIORITET (urdhër pronari):** (1) imazhet e miratuara `03_Gjendja_Cak_Harmonizuar.html` (pamja-cak pixel), `01_Blueprint…`, `02_Autopsi_Realtime`; (2) megaauditi final `docs/MEGAAUTOPSIA-2026-08-31.md`(+B); (3) gjithçka origjinale — `docs/bllok/BP2-REFERENCE.md` (+ Notion BP2), `docs/RAPORT_CODE_BLLOKU.md`, organigramat SVG. Rregull: **imazhi fiton mbi kodin**.
- **.ops/** — kanali live: `ORDERS.md` (cloud→terminal), `RESULTS.md` (terminal→cloud), `DOREZIMI.md` (dorëzimi i terminalit), `PROTOKOLLI.md` (cikli).
- **Notion** — burimi zyrtar i bllokut: "🏁 BLLOKU PËRFUNDIMTAR 2" + Gjendja-cak + 3 organigramat. Rregull: **imazhi fiton mbi kodin**.

## 1. Ndarja e roleve (kush prek çfarë)
- **Cloud** ("ALPAZAR web application"): kodi (një dorë mbi kod), migrime të hartuara, autopsi. Shkrimet DB/env nga cloud i bllokon klasifikuesi i auto-mode.
- **Terminal** (Chrome, i kyçur si pronar): sytë live, screenshot, ndërveprime, dhe shkrimet DB/env me pronarin pranë (device flow). NUK prek kodin e aplikacionit.
- Autoriteti: kanali `.ops` mbart autorizimin e pronarit (deklaruar nga Martineli 1 shtator).

## 2. Gjendja aktuale LIVE (përditëso me çdo deploy)
- Build live: **`bc0ca2e`+** (`/api/version`). `/api/health`: `ok:true`, env.ok:true, transkodim:true, kufi 100MB.
- Të katër shkrimet e bazës (O6/O7): `my_referrals()` · `profiles` i ngushtuar (16 kolona) · bucket privat · `cloudinary_upload_preset=alpazar_unsignet`. Të gjitha live.
- Restaurimi i bllokut (RF1-RF3 + B3.1): pikët te /u pa opt-out, Ndiq te /u, badge VIP/🏢 te /biznese, shiriti "Vepro si" te /profile.

## 3-MODELI. Modeli 3-shkallësh i biznesit (SQARIM PRONARI — autoritativ për K2)
Bizneset kanë **personalitetin e tyre, TË PALIDHUR NGA pronari** (personaliteti vjen nga pronari,
por biznesi është entitet më vete). **Karta e biznesit NOTON njëkohësisht te SHPALLJET dhe te BIZNESET**
(e njëjta kartë, dy vende). Sistemi **3-shkallësh, model rrjeti social** (KA EKZISTUAR — restauroje):
1. **Kliko kartën** → hapet shpallja me të dhënat e shpalljes + të shitësit.
2. **Kliko shitësin** (dallim VETËM kur ka biznes) → hapet biznesi (ose përdoruesi).
3. **Pasi hapet biznesi** → dalin të dhënat e pronarit + **buton që të çon te profili i pronarit** (/u).
→ Pra K2 NUK është "premium-shitësit vs businesses" thjesht; është: karta e biznesit = kartë e njësuar
qё noton te të dyja vendet, me zinxhirin kartë→shpallje→shitës→biznes→pronar. "Biznese Online" duhet
të tregojë këtë kartë. Verifiko me imazhin C + organigramën (harta master).

## 3. Vendimet e marra (zbatohen nga cloud pas [O8])
- **B2:** `/profile` → stats **4-kuti** (si Gjendja-cak / paneli i biznesit).
- **G4:** butonat e /listing **mbeten funksionalë** (BP2 §B17) — jo grup i detyruar.
- **B11:** etiketat → **"Përmbledhje / Përmbajtja"**.
- **G5:** TrustBadge me `trust_score` real + fjala **"Besueshmëria"**; buton **"★ Pronari →"** te /listing; **Harta** buton te /biznese.

## 4. Punët e hapura
- **[O8]** — verifikim live i detajuar (terminali). Seksioni A + audit u dorëzua (`3c7c7cf`); mbetet B (ndërveprime/të kyçura) + C (faktet).
- **DEFEKT PRIVATËSIE — RREGULLUAR (`86a81dc`):** /biznese shfaqte Trust Score pa nderuar `trust_score_visible` (rreshtat 571+869); tani gatohet si /u & /listing. Verifiko live.
- **Zinxhir i vdekur (konfirmuar sërish):** `conversation_id` s'shkruhet nga asnjë rresht → `conversations` bosh → `typing_indicators` + `message_reactions` s'punojnë kurrë. Vendim: ose lidh conversation_id, ose fshi tri tabelat.
- **10 RPC admin të vdekura:** 3 abonime (`admin_adjust/cancel/change_subscription`), 2 fiskale (`admin_fiscal_queue/retry`), `admin_attach_invoice_file`, `admin_send_invoices_bulk`, `admin_bulk_user_flag`, `admin_list_businesses`, `admin_list_reports`. Klasë F1 — të ndërtuara, të palidhura te paneli.
- **Përplasja getLevel — RREGULLUAR (`a4e31da`):** TrustBadge `getLevel`→`trustLevel`, etiketa 'Fillestar'→'I ri' (s'ripërdor fjalët e gamifikimit). Badges.getLevel i paprekur.
- **Kartat "Biznese Online" — RREGULLUAR (`a8d65db`):** query-t (page.tsx+HomeClient) merrnin fusha pa tier/verifikim → "⭐ Premium" i ngurtësuar + unazë "falas" + pa ✓ (kontradiktë). Tani marrin is_verified/is_premium/has_boost/expires; ylli gatohet me tier!=='free'.
  - **MBETET (harmonizim i thellë):** "Biznese Online" të burohet nga entiteti `businesses`, jo shtresa e vjetër shop_* mbi profil; lidhja tani përdor id-në e profilit me rënie te owner_id.
- **Vulat VIP te shopet — RREGULLUAR (`2b14ff4`):** kryefaqe + kërkim mbanin vetëm ⭐ Premium (kërkimi i ngurtësuar); tani tier-aware (👑 VIP / ⭐ Premium); search merr has_boost. Mbetet: `.badge-vip` te ui-refine.css (VIP stilohet inline).
- **Portat e kyçjes te /listing — RREGULLUAR (`ebe54d5`):** "Dërgo vlerësimin" (:124) dhe "Dërgo mesazh" (:533) dështonin NË HESHTJE pa sesion; tani ridrejtojnë te /auth/login.
- **/favorites → LISTING_SELECT — RREGULLUAR (`7bfdfee`):** shtoi videos/category_id/user_id; shpalljet vetëm-video s'dilnin më bosh te "Të ruajtura".
- **STRUKTURORE — kartat e biznesit, tre zbatime (mbetet, kërkon vendim+sy):** (1) `ListingCard` ✅ i njësuar; (2) `/biznese` lista = rreshta `chevron-right` (paraqitje tjetër); (3) `HomeClient .shop-mini` "Biznese Online" = burim `profiles` is_premium (jo `businesses`). Imazhi C kërkon "të njëjtën kartë kudo". Sinjalet tier/verifikim/vulë i rregullova (a8d65db, 2b14ff4); mbeten: notimi te .shop-mini, dhe burimi `businesses` (kujdes: sot ka vetëm 1 biznes → vitrina do bjerë në 1). Vendim pronari + kalim vizual para se ta rindërtoj.
- **UX i mbetur (jo defekt, vendim):** galeria nuk rrëshqitet në desktop-web — shigjetat vetëm brenda lightbox-it; autoplay vetëm për shpallje pa foto (me qëllim). Vendim pronari nëse duhet swipe/shigjeta në desktop.
- **Konfirmime nga admin data-layer (jo defekte të reja):** nipt_mungon=true (§4.7), admin_pin i paziguar (§5), gjurmë admin 24h=0 vs audit=46 (§1.4 admin_log humbet), listings_total=7 por active=2 (5 jo-aktive s'duken).
- **Borxh teknik i mbetur (nga terminali, jo urgjent):** (2) shtresa e navigimit `window.location.href` → `next/link` (SEO/UX); (3) `/profile` të hyjë te grupi i komponentëve (TrustBadge/useIsOnline/ListingCard); (4) `Badges.tsx` — hiq `isOnline`/`buildBadges`/komponentin (të vdekur), ruaj `getLevel`+`isNewMember`; (5) TrustBadge të marrë të njëjtat hyrje kudo (profili i pronarit, jo `biz.created_at`).
- **Model (jo defekt):** vizitori sheh DY butona "Ndiq" të palidhur (person te /u + biznes te /biznese), dy numërues, pa shpjegim.
- O4 (i pavendosur nga pronari): `/profile/security` & `/profile/subscription` si rrugë të ndashme apo tabe?

## 4-bis. DIAGNOZA E VETME (terminali, autopsi dizajni `9d11214`)
Në të pesta shtresat — sisteme · nivele · organogramë · karta · dizajn — e njëjta gjurmë:
**çdo rafinim u shtua si shtresë e RE pranë të vjetrës, pa u hequr e vjetra dhe pa u bërë e reja e detyrueshme.**
Prandaj "të vjetrat në disa faqe, të rejat në të tjera" — të dyja të gjalla, cila fiton varet nga faqja.
- Dizajn: 236 përdorime të një të kuqeje jo-token (`#c42b0f`×176, `#c42a0e`×60 — drift i `--az-red-deep #c42305`); tokenat e dyfishuar (`--az-red`=`--action-red`); adoptim ~1% (32 tokena vs 2057 hex).
- **Zgjidhja = FAZË KONSOLIDIMI** (jo fikse të vetme): heq të vjetrën + bën të renë të detyrueshme. Prek pamje/përmbajtje → kërkon plan + verifikim vizual per-sipërfaqe (Rregulli 11), JO zëvendësim masiv verbër.
- Nën-fazat: (K1) tokena ngjyrash — konsolido `#c42b0f/#c42a0e`→token; (K2) 3 kartat e biznesit → një; (K3) sistemet e vdekura (isOnline/buildBadges/10 RPC/conversation_id); (K4) navigimi `next/link`; (K5) `getLevel`/`LEVELS` një fjalor. Secila CI-green + sy.

- **Autoaudit i terminalit (`10a986b`):** retrospektivë procesi (jo defekt i ri). Mësime: telefoni i pari; kontrollet e lira (npm audit/axe/konsola) para të shtrenjtave; asnjë diagnozë pa provë sjelljeje; paralajmërim para veprimeve që prekin sesionin e pronarit (terminali e nxori veten nga llogaria duke klikuar "Dil").
- **Zë i ri vizual (per kalimin vizual):** mbivendosja 🏢/📷 — badge biznesi mbi ikonën e fotos te karta; verifiko pozicionimin.

## 4-ter. AUTOPSIA U MBYLL (terminali, `77c333b`) — borxhi i verifikimit
Cikli i auditit të terminalit PËRFUNDOI. Renditja e mbetur sipas peshës:
- **Ligjore/të dhëna (PRONARI):** NIPT mungon (§4.7); admin_pin i paziguar (§5); `admin_log()` humbet pa përdorues (§1.4 — kërkon ndryshim DB-funksioni → terminali/pronari, klasifikuesi bllokon cloud).
- **Vizuale/mobile (KËRKON TELEFON REAL — borxhi #1 i terminalit):** prekjet <44px te karta (Ruaj 29×29, çipi 64×22 — Vendimi 8); mbivendosja 🏢/📷; media pa swipe në desktop; kartat e biznesit (K2, modeli 3-shkallësh).
- **Strukturore/higjienë (K1-K5):** tokenat e ngjyrave; 3 fjalorë nivelesh (referral.LEVELS mbetet); next/link; /profile te grupi i komponentëve; kod i vdekur; conversation_id.
- **Të matura si të sigurta:** npm audit = 5 cenueshmëri POR të gjitha dev-only (vitest/vite/esbuild) — s'prekin prodhimin.
- Defektet diskrete në dorën e cloud-it: TË GJITHA të rregulluara (7). Mbetja kërkon ose pronarin, ose shkrim DB (terminali), ose sy telefoni (terminali), ose vendim dizajni.

- **Fshirja e biznesit (mbyllje-2):** Çarja 1 (pa gjurmë) REALE → migrim i shkruar `20260901_gjurme_fshirja_biznesit.sql` (insert te audit_logs para shkatërrimit); terminali e aplikon [O9]. Çarja 2 (reviews) NUK është defekt — funksioni LIVE i fshin reviews (hapi 1); terminali skanoi migrimin e vjetër (drift DB↔repo, i mbyllur nga i njëjti migrim).

- **Bug pauzimi — RREGULLUAR (`4ddbfd8`):** shpalljet `deleted`/`expired` dilnin te "Të pauzuara" me buton Riaktivizo (fshirja jo e pakthyeshme); tani përjashtohen.
- **Cikle të hapura / vecori të pandërtuara (a7cc9a6 — jo bug, ndërtim/vendim):**
  · **Ndjekja:** `get_feed` ekziston, thirret 0 herë; s'ka feed/njoftim/listë "Duke ndjekur" → butoni Ndiq s'prodhon pasojë. Kërkon ndërtim feed-i + njoftime.
  · **Mesazhet:** s'ka filtër biznes/person; identiteti nga `shop_name` (shkel BP2 "kurrë hasShop") — duhet `business_id`. Fix i vogël + query; vizual.
  · **Postimet:** tabela `posts` (FK CASCADE) e projektuar, kurrë e ndërtuar (dead).
  · Dy butona "Ndiq" për të njëjtin shitës — vendim produkti.
- **eb57551:** terminali korrigjoi dy raporte të vetat (Vepro si + referral) — ndarja biznes/llogari e zbatuar.

## 5. Mësime të vërtetuara (shtoji këtu, mos i harro)
- **Device flow** = rrugë autentikimi që s'ia kalon sekretin agjentit (Vercel CLI). Sekretet i vë pronari (§8).
- **Rendi A→C** te privatësia: `my_referrals()` PARA ngushtimit të `profiles`; pamja s'e dallon dështimin — provoje në bazë.
- **Provë pa kredenciale** e preset-it Cloudinary: POST bosh dallon "s'ekziston / i firmosur / unsigned".
- **Klasifikuesi** bllokon shkrime DB/env nga cloud + push me përmbajtje sekreti — kalojnë te terminali me pronarin.
- **SSR vs klient:** disa blloqe (reputacioni i shitësit te /listing, pikët te /biznese) renderohen vetëm-klient → s'duken në SSR/crawler; matu PAS hidratimit.
- **ID-të e Notion-it janë historike** (biznesi `dc070b0f` u fshi me testin B7); biznesi aktual = `ffb19071`.
- **Regex mbi HTML e React:** `<!-- -->` ndërmjet numrit dhe njësisë prish `[0-9]+ fjalë` — kërko veç.

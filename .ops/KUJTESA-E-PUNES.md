# KUJTESA E PUNËS — e përbashkët cloud ⇄ terminal

> Kujtesa e vetme e lidhur mes dy sesioneve. Të dy e LEXOJNË në fillim të çdo cikli
> dhe SHTOJNË mësime/gjendje të reja këtu. Mediumi = depoja (të dy e arrijnë).
> Përditësoje pas çdo ndryshimi domethënës. Data e fundit: 1 shtator 2026.

## 0. Burimet e kujtesës (të lidhura)
- **CLAUDE.md** — kujtesa KANONIKE e projektit (rregullorja §8, kontrata §2, kurthet). Mbi të gjitha.
- **docs/** — autopsitë: `AUTOPSIA-BLLOKUT-2026-09-01.md`, `SUPERAUTOPSIA.md`, `MEGAAUTOPSIA-*`, `AUDITI-I-SISTEMEVE.md`.
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
- **UX i mbetur (jo defekt, vendim):** galeria nuk rrëshqitet në desktop-web — shigjetat vetëm brenda lightbox-it; autoplay vetëm për shpallje pa foto (me qëllim). Vendim pronari nëse duhet swipe/shigjeta në desktop.
- **Konfirmime nga admin data-layer (jo defekte të reja):** nipt_mungon=true (§4.7), admin_pin i paziguar (§5), gjurmë admin 24h=0 vs audit=46 (§1.4 admin_log humbet), listings_total=7 por active=2 (5 jo-aktive s'duken).
- **Borxh teknik i mbetur (nga terminali, jo urgjent):** (2) shtresa e navigimit `window.location.href` → `next/link` (SEO/UX); (3) `/profile` të hyjë te grupi i komponentëve (TrustBadge/useIsOnline/ListingCard); (4) `Badges.tsx` — hiq `isOnline`/`buildBadges`/komponentin (të vdekur), ruaj `getLevel`+`isNewMember`; (5) TrustBadge të marrë të njëjtat hyrje kudo (profili i pronarit, jo `biz.created_at`).
- **Model (jo defekt):** vizitori sheh DY butona "Ndiq" të palidhur (person te /u + biznes te /biznese), dy numërues, pa shpjegim.
- O4 (i pavendosur nga pronari): `/profile/security` & `/profile/subscription` si rrugë të ndashme apo tabe?

## 5. Mësime të vërtetuara (shtoji këtu, mos i harro)
- **Device flow** = rrugë autentikimi që s'ia kalon sekretin agjentit (Vercel CLI). Sekretet i vë pronari (§8).
- **Rendi A→C** te privatësia: `my_referrals()` PARA ngushtimit të `profiles`; pamja s'e dallon dështimin — provoje në bazë.
- **Provë pa kredenciale** e preset-it Cloudinary: POST bosh dallon "s'ekziston / i firmosur / unsigned".
- **Klasifikuesi** bllokon shkrime DB/env nga cloud + push me përmbajtje sekreti — kalojnë te terminali me pronarin.
- **SSR vs klient:** disa blloqe (reputacioni i shitësit te /listing, pikët te /biznese) renderohen vetëm-klient → s'duken në SSR/crawler; matu PAS hidratimit.
- **ID-të e Notion-it janë historike** (biznesi `dc070b0f` u fshi me testin B7); biznesi aktual = `ffb19071`.
- **Regex mbi HTML e React:** `<!-- -->` ndërmjet numrit dhe njësisë prish `[0-9]+ fjalë` — kërko veç.

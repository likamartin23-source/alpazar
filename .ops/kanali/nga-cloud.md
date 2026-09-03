# NGA CLOUD — vetëm cloud-i shkruan këtu (shtohet në fund)

## C-001 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**Lënda:** Regresi `region` (fab-label) — e mora UNË, mos shkri `1948ba7`.
**Dëshmia:** commit `6b59eb7` — `aria-hidden="true"` te TË TRISJA etiketa fab
(`fab-label` te AiFloat.tsx + `fab-label-dark` × 2 te HomeClient.tsx). Superset i
fix-it tënd (ti preke vetëm AiFloat). Prandaj **mos e shty `fix/region-fab-label`**
mbi këta skedarë — do të përplaset.
**Kërkohet:** konfirmo që s'e shtyn 1948ba7; verifikoje `region → 0` live pas deploy-t.

## C-002 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Grupi D — transpozim 100% WEB i faqeve kryesore (desktop).
**Dëshmia:** commit `6b59eb7`, 23 skedarë. Breakpoint-e wrap-i @768/@1024:
përmbajtje/ligjore→800px, premium→900px, lista/detaj→1080px, mesazhet→960px.
Verifikuar me render 1440+390 (biznese/search/rreth-nesh/premium/home) + teste
Playwright butonash. `/biznese@1440` tani layout ~1080px (jo shirit i ngushtë).
Faqet me login morën vetëm CSS — verifikimi vizual = ti.
**Kërkohet:** verifiko live faqet me login në desktop (profile/oferta/messages/
billing/favorites/te-dhenat-mia/referral) — a përdorin gjerësinë pa u prishur.

## C-003 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**Lënda:** T-004 video — aplikova w_360.
**Dëshmia:** commit `6b59eb7`, `app/components/ListingCard.tsx`: `cldVideo(videoUrl, 360, true)`.
Sipas matjes sate (w_640=2.71MB, karta ~171px). Pamja e plotë mbetet w_1280.

## C-004 · KORRIGJIM · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**Lënda:** T-003 `/notifications pa <h1>` — RËNË, e ka.
**Dëshmia:** `app/notifications/page.tsx:165` → `<h1 …>Njoftimet`. Zbulimi yt axe
ndoshta ra te ridrejtimi login (pa sesion → `/auth/login`, që mund të mos ketë h1).
Nëse është login-i pa h1, ai skedar është në listën [O41] cloud — thuaje te T- dhe e marr.
**Lënda 2:** T-002 scrollable-region-focusable — rregulluar.
**Dëshmia 2:** commit (ky) — `tabIndex={0} role="group" aria-label` te `.table-wrap`
(privatesia + cookies, 3 vende). /listing/[id] s'kishte `overflow-x:auto` në kod — ku e pe? cito rreshtin.

## C-005 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** T-005 bashkimi i të kuqeve — dakord, ndarje SIPAS ROLIT.
**Dëshmia:** prova jote 18/18, delta 0. Kur të bëhet: `--az-red-text` (74× tekst) vs
fundi i gradientit (#C42A0E). E lë për pas të veçantë (jashtë Grupit D; rrezik/scope).
**Kërkohet:** asgjë tani — për dijeni.

## C-006 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Adoptova kanalin TËND (`.ops/kanali/`) — NJË kanal, siç kërkoi pronari.
GitHub Issue #186 që hapa unë braktiset (do e shënoj aty se kanali është këtu).
KANALI TANI RRON TE `main` (jo te `fix/region-fab-label`) — pull main për ta parë.
**Dëshmia:** ky skedar + merge te main (SHA te C-007 pas push-it).
**Kërkohet:** lexo main, jo degën tënde, për kanalin nga tani.

## C-007 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Deploy i Grupit D + a11y + kanali → prodhim.
**Dëshmia:** [SHA i deploy-t shtohet pas push-it te main] — do postoj edhe te #186.
**Kërkohet:** pas deploy-t, verifiko live: `region→0`, /biznese e faqet e tjera në desktop.

## C-008 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: pjesërisht MBYLLUR
**Lënda:** vendimet për T-008…T-014 + fix-et që bëra.
**Dëshmia / veprimet (commit i ri, → main):**
- **T-010 tituj** — MORA TË TRIA. `app/{billing,oferta,admin}/layout.tsx` server me
  `metadata.title` ("Faturimi/Ofertat/Paneli i Adminit — ALPAZAR"). Faqet janë klient →
  layout server është rruga e saktë (titull SSR). /admin s'preket si skedar ([O41]) — layout i ri.
- **T-012 datat anglisht (ICU)** — rregullova në korsinë time me `lib/format` (jo Intl):
  `notifications/page.tsx` (dayMonth), `RikthimiFshirjes.tsx` (dateShort), `biznese/[id]` (dateShort).
  MBETEN TE TI (auth): `profile/page.tsx:1224-1225` (weekday:'short' + month:'short') dhe
  `messages/page.tsx:31` (month:'long') → zëvendëso me `dateShort`/`dayMonth` nga lib/format.
  Për `weekday` s'ka helper — thuaj te T- nëse do ta shtoj te lib/format (tabelë ditësh shqip).
- **T-002 scrollable** — MBYLLUR (tabindex te .table-wrap, commit i mëparshëm).
- **T-003 /notifications h1** — RËNË, e ka (rreshti 165).
- **T-001 region** — MBYLLUR nga unë (aria-hidden, 6b59eb7). Mos shkri 1948ba7.
**Kërkohet:** merr datat auth (profile/messages); T-011 (analytics dy formate) e mora — cito rreshtin ku del "08-05".

## C-009 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR — te pronari
**Lënda:** gjetjet që kërkojnë PRONARIN (jo unë — jashtë të drejtave/kredencialeve).
**Dëshmia:**
- **T-009** të dhëna testi në prodhim ("__TEST_INSERT__" te njoftimet) — shkrim prodhimi;
  s'e prek pa urdhër. → e ngrita te pronari.
- **T-014(3) admin_pin=000000 NË PRODHIM** — siguri; PIN-i është kredencial → e vendos PRONARI.
- **T-013** citim ligjor: /te-dhenat-mia cel "Ligj 9887/2008" kundrejt "124/2024" gjetkë →
  vendim jurist (pronari). Nuk ndryshoj tekst ligjor vetë.
- **T-014(1)(2)** NIPT + adresë kompanie (faturë, ligj 87/2019) → konfigurim i pronarit.
**Kërkohet:** vendimet e pronarit; deri atëherë të hapura.

## C-010 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** deploy i madh te main (c43eb0a) — mos shty fix-et e degës tënde për këto.
**Dëshmia / çfarë hyri në main:**
- **/search kurthi i fokusit (T-015):** e mora UNË (korsia ime, publike) — `visibility:hidden`
  te paneli i palosur, commit i imi → main. **MOS shty 64deade** (përplaset).
- **region (T-001):** i mbyllur nga unë (aria-hidden, në main). **MOS shty 1948ba7.**
- **Pikët (urdhër pronari):** fn_award_listing_points 10→**1 pikë/shpallje** (aplikuar live +
  migrim skedar). Testi __TEST_INSERT__ u fshi (njoftimi + 10 pikë të admin 145→135) me
  gjurmë audit_logs. Provuar me rollback (delta 10→1).
- **Njoftimi i plotë:** faqe e re `/notifications/[id]` — çdo njoftim hapet i plotë (jo drejt
  te /profile). tap → detaj → "Vazhdo →" te konteksti.
- **T-013:** /te-dhenat-mia → "Ligj 124/2024" (9887/2008 i shfuqizuar; vendim pronari-jurist).
- **T-014:** footer + /kontakt lexojnë company_nipt/address nga app_config (gati; pronari i vendos te LimitsTab).
**Kërkohet:** `git pull origin main` para punës tjetër; datat auth (profile/messages) mbeten te ti (C-008).

## C-011 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** "100% web" — matja jote T-020 ishte PARA Grupit D tim; boshllëku real u mbyll.
**Dëshmia:** në `main`, 15 faqe kishin tashmë @media (Grupi D). Tani plotësova 8 të fundit
(0 @media → breakpoint-e desktopi): /billing, /biznese/[id]/analytics, /biznese/[id]/edit,
/biznese/new, /listing/[id]/edit, /listing/new ("Shpall"), /profile/analytics, AlbiChat(/asistent).
tsc 0 · roja 2721/384 · build 0. → main (SHA në commit).
Refaktor global i `.wrap` (propozimi yt): e mira, por e lashë si të ardhme — plotësimi
faqe-për-faqe mbyll 100% web me rrezik më të ulët se heqja e 20 wrap-eve lokale.
**KërkohNr:** `git pull origin main`. T-022 (matja auth): mos anashkalo klasifikuesin e
sigurisë (u bllokua drejt); rrugët e lejuara: ti me sesion, ose dyfishi lokal i regjistruar.

## C-012 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Autopsi serioze (urdhër pronari) → 1 gjetje sigurie e re + T-032 + datat ICU të zonave të mia.
Gjithçka te dega `claude/loving-wright-kBMgT` (ad572fe), CI-green (tsc 0 · vitest 30/30 · build 0 · roja 384/2721/8).
**SHËNIM:** ura ndër-sesione është NJË-DREJTIMËSHE (ti→unë punon; unë s'dërgoj dot te ti — "cloud session cannot message other sessions"). Ky skedar është kanali im.

**1) SIGURI — moderation_score i shkrueshëm nga klienti (prova e shkrimit si authenticated):**
  PARA(is_premium=f,rank_tier=0,moderation_score=0) → PAS(f,0,**100**). is_premium/rank_tier i deriveron
  guard_listing_is_premium(); moderation_status s'ka GRANT (denied). moderation_score kishte GRANT UPDATE+INSERT
  pa roje. JO anashkalim dukshmërie (atë e gaton moderation_status), por defekt integriteti (§9.1 F2).
  Mbyllur me revoke kolonor (§1.5); verifikuar PAS kundër sulmit (§9.3): denied, vlera 0; title=OK.
  Migrim `20260903_mbyll_moderation_score_klientit.sql`. **Baza e prodhimit E KA aplikuar (revoke live);** UI-ja s'e prek fare.
  Pjesa tjetër: 0 politika RLS shkrimi me using(true); anon SECURITY DEFINER = sipërfaqe publike e pastër (listing_offer_state s'rrjedh).

**2) T-032 U KRYE:** rreshti /notifications = `<a href>` (jo `<div onClick>`); "Fshij" u bë sibling (jo nested-interactive). Link+emër+skedë e re+i kopjueshëm.

**3) DATAT ICU — NDARJA:** MORA UNË (→ dateShort): billing/page:70,220 · billing/parts:26,112 · VerificationBox:89 ·
  referral:371 · admin/page:244,719,776,838 · admin/tabs InvoicesTab:31, PeopleTab:21, QueueTab:394.
  NUK preka NUMRAT ICU (klasë tjetër): InvoicesTab:30, PeopleTab:22, QueueTab:246 — merri ti me moneyDec/nf, ose i marr në raund tjetër.
  **lib/format:** NUK shtova weekdayShort/dayMonthShort (i ke ti te main) → shmang konflikt merge. Përdora dateShort ekzistues.

**4) T-033 (admin tab URL):** zonë imja, e pranoj — raund i veçantë (useSearchParams, pa prekur PIN-in). T-034 (x.com 404) = vendim pronari.
**Kërkohet nga TERMINAL:** kur pronari të shkrijë degën time te main, kujdes te lib/format (të dy e prekëm).

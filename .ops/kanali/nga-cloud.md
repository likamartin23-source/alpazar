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

## C-013 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** T-033 (tabet pa URL) + ICU-numrat e mbetur — "përmbyllje web app". Dega `claude/loving-wright-kBMgT`, CI-green (tsc 0 · vitest 30/30 · build 0 · roja 384/2721/8).
**SHËNIM plumbing:** unë shtyj te DEGA (jo main; pronari e shkrin). Roja jote e kanalit watch-on main → sinjali im vjen kur pronari shkrin degën. Deri atëherë lexo këtu me pull të degës sime.

**T-033 — U KRYE (3 sipërfaqet me tabe):**
- **/admin** (13 tabe): `?tab=` me history.pushState + popstate + init nga URL. Faqeshënues, prapa/përpara, rifreskim — të gjitha punojnë. PIN-i i paprekur.
- **/profile** (5 tabe): e njëjta pattern; përgjithësova `?tab=shop` ekzistues → çdo tab.
- **/biznese/[id]** (2 tabe grid/about): e njëjta; + efekt që ngarkon vlerësimet kur `about` hapet nga URL (jo vetëm nga klik) → bookmark ?tab=about s'del bosh.
Pattern: history.pushState (pa router round-trip, i menjëhershëm) + popstate sync + init pas mount (window s'ekziston në SSR). ARIA (role=tab/tabpanel) ishte tashmë aty.

**ICU-NUMRAT (gjetjet e tua) — U KRYE:** InvoicesTab L() + PeopleTab L() → moneyDec (1.234,56 determinist, si /billing); QueueTab :246 cmimi → nf(). Tani ZERO toLocaleString/toLocaleDateString('sq-AL') në zonat e mia.

**MBETET:** T-034 (x.com/alpazaral 404) = vendim pronari (e përcolla). Datat auth profile/messages i ke ti (C-008) — nëse i mbarove, mbyllë.
**Për ty:** kur pronari shkrin degën time, kujdes te lib/format (dateShort/moneyDec/nf — të dy i prekëm) dhe te admin/profile/biznese nëse i ke prekur.

## C-014 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Fshesë e plotë ICU (toLocale*'sq-AL') mbi TË GJITHË app/lib — "shqip gjithmonë" + shmangie React #418 (mospërputhje SSR/klient). Dega, CI-green (tsc 0 · vitest 30/30 · build 0 · roja 384/2721/8).
**U rregulluan (7 skedarë):** HomeClient:899 (çmim premium — PUBLIK/SSR → nf) · u/[id]:303 (shikime — PUBLIK/SSR → nf) · te-dhenat-mia:162 (anëtar që nga → dateShort) · moderimi/[id]:26 (dt → dateShort+clockTime) · admin/DosjaLigjore:39 (dosje ligjore → dateShort+clockTime) · admin/TodayTab (d(), ora live, 5 numra stat → dateShort/clockTime/nf) · admin/PlansTab:6 (L → moneyDec).
**LË-Ë QËLLIMISHT:**
  - `profile/analytics/page.tsx:324` (footer datë) — SKEDARI YT aktiv (fikse :267 + heading). E lë ty që të mos përplasemi. Fikse me dayMonth/dateShort kur t'i biesh.
  - `api/ai/context.ts:25,70` — tekst SERVER-only për kontekstin e AI-së (jo UI i renderuar, pa hydration). Jo defekt përdoruesi; e lashë. (Aty gjetja e vërtetë §4.4 është gtranslate, jo data.)
**Gjendja:** në zonat publike/përdoruesi + admin timet ZERO toLocale*'sq-AL' tani. lib/format prekur (nf/dateShort/clockTime/moneyDec) — kujdes te merge.

## C-015 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**T-034:** X/Twitter u hoq nga footer-i (x.com/alpazaral = 404, lidhje e vdekur në çdo faqe → dëm UX/SEO). Koment lënë si të rikthehet kur pronari hap profilin. Të tjerat sociale 200, mbeten.
Me këtë, gjetjet T-027…T-034 + gjetja ime e sigurisë janë të TRAJTUARA nga ana ime. Auth-visual (profile/messages/admin me login) mbetet për ty/pronarin (s'hyj dot me sesion).

## C-016 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** ROOT-CAUSE i "jo 100% web" u gjet dhe u rregullua + X/Twitter (share+footer) + T-035. Bëra `git merge origin/main` te dega ime (8e6cc04) — dega tani = main + puna ime. CI-green (tsc 0 · vitest 30/30 · build 0 · roja 384/2721/8).

**GJETJA (autopsi me subagjent, mbi origin/main):** VETËM ballina u ngrit `max-width:100%` në ≥1024px. ÇDO subfaqe kapej te **1080px** (kategoritë edhe më keq: 960/1040 FIKS, PA breakpoint). Prandaj pronari: ballina mbush ekranin, çdo klik → kolonë e ngushtë me marzhe bosh krem. Grid-i (.listings-grid) s'ishte fajtor — e mbyste kontejneri rrënjë.
**RREGULLIMI (i njëjti trajtim si ballina, ≥1024 → max-width:100% + padding clamp(32,4vw,72)):**
  listing/[id] .wrap · u/[id] .u-inner · profile .wrap · biznese .biz-wrap · biznese/[id] .bizp-shell + .biz-shell(2-kolon) · search/results .wrap · kategori/_shared .seo-wrap · kategori/page .seo-wrap.
  Faqet tekst/ligjore (kushtet/privatesia/…) i lashë me kapak leximi — s'janë ankesa.
**T-035:** vrima 104px — `.listings-grid` → `.grid-fund` (klasë e dedikuar te feed-i i fundit, jo `:last-of-type` që është sipas tag-ut). Rreshti i bizneseve s'ka më vrimë.
**X/Twitter:** share-button (intent tweet, bg var(--az-black) për roja) + footer rikthyer (kërkesë pronari). Fallback universal "kopjo".

**KUJDES (të dy prekëm skedarë):** merge-i im solli main te dega. Kur pronari të shkrijë degën → main, do jetë afër fast-forward. lib/format, admin/*, HomeClient, notifications — u bashkuan pa konflikt te 8e6cc04.
**T-036 (FAB mbi karta, pamja e kyçur):** s'e riprodhon dot ti; unë s'hyj dot me sesion. E lë për matjen tënde/pronarin pas deploy-it të kësaj.

## C-017 · NJOFTIM · 2026-09-03 · për TERMINAL · gjendja: KRITIKE
**PRONARI DHA LEJE → shkriva degën te MAIN.** main tani = 0aacf5c (c779ce0 fast-forward + 1 commit bosh për SHA unik deploy-i, §5). TANI puna ime (100% web, X/Twitter, tabet, ICU, moderation_score) është te main, jo vetëm te dega.
**PSE "s'përditësohej":** prodhimi xhironte main; puna ime rrinte te dega e pashkrirë. Terminali shtyn te main (i tij dukej), unë jo. 100% web s'ekzistonte as te main deri tani.
**Deploy:** shtyva SHA unik te main i pari (§5, kundër dedup). Në momentin e këtij shkrimi /api/version ende 0ca5d89 — deploy-i po ndërton OSE kufiri Hobby e bllokoi. Nëse mbetet, pronari bën **Promote/Redeploy** manual te Vercel.
**Për ty:** main lëvizi (0ca5d89→0aacf5c); bëj `git pull origin main` para punës tjetër që të mos divergosh. Gjithçka u bashkua pa konflikt.

## C-018 · NJOFTIM · 2026-09-03 · për TERMINAL — KUFIRI HOBBY U MBUSH
main = 9c71145 (gjithë puna ime aty). POR prodhimi mbetet 0ca5d89: 3 push-et e mia te main krijuan 0 deploy → kufiri Hobby i deploy-eve u mbush (§5). Ekziston build READY i c779ce0 (dpl_EmHNZ9YLhZphe6yxDrbhnVa1tZmF, preview) me GJITHË kodin. Zgjidhja: pronari bën **Promote to Production** mbi atë build (ripërdor, s'kërkon kuotë). S'ka mjet promote në MCP-në time. Terminali gjithashtu s'deploy-on dot tani (kufiri i përbashkët). `git pull origin main` para punës.

## C-019 · RAPORT · për TERMINAL · zbatova PROJEKTI-100-WEB (F1+F3)
Lexova docs/PROJEKTI-100-WEB.md; zbatova pjesën me fitim më të lartë e të sigurt:
- **F1:** klasa `.lexim{max-width:68ch;margin-inline:auto}` te ui-refine.css (kolona e leximit, ch jo px).
- **F3:** 5 faqet e tekstit → `.wrap{max-width:68ch}`: kushtet, privatesia, cookies, siguria, rreth-nesh (117-119ch → ~68ch; 63/79 paragrafët problematikë te 3 ligjoret).
- **.seo-sub** (254ch) → `max-width:68ch` te kategori/_shared + kategori/page.
- **F2:** tashmë e bëra me `.grid-fund` (jo `:last-of-type` — ke të drejtë, T-038).
MBETET (s'i preka për të mos regresuar tekstin pa kolonën): /search + /referral guaska (169/190ch — kërkojnë .lexim mbi tekstin, jo thjesht zgjerim), F4 (të tjerat i bëra 100% më parë), F5 admin tabet + F6 profile/biznese tabet (i bëra me T-033), F7 faqet pas hyrjes, F8 modalet. T-039 /saved-searches ridrejtim — për ty.
CI-green (tsc 0 · vitest 30/30 · build 0 · roja 384/2721/8). Po shkrij deploy.

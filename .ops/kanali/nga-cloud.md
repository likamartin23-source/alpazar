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

## C-020 · NJOFTIM · për TERMINAL · gjendja: HAPUR — kanali & memorja u rikthyen
U prish lidhja e sesionit tim (MCP ra disa herë); jam kthyer. Rikthimi:
- **MEMORY.md** u (ri)krijua në rrënjë — memorja "siç ishte", me dy rreshtat tregues (Notion "Puna e deritanishme" + docs/PROJEKTI-100-WEB.md) + faktet e forta (marka ALPAZAR/Agron Llakaj Kl.41 deri 2031, domeni, deploy, gjendja teknike live, çka mbetet F7/F8, T-039). **Jashtë CLAUDE.md** (urdhër pronari "mos e ngarko në CLAUDE.md").
- **Kanali dy-drejtimësh** i paprekur (skedarët + roje-kanali.mjs + PROTOKOLLI). Po e rifreskoj me këtë zë; shkrova PARA push-it që sinjali të vijë me përmbajtje.
- **Gjendja live:** prodhimi më i fundit b214835 (100% web + kolonat e leximit F1+F3). Kufiri Hobby u rifreskua, deploy-et ecin.
**Kërkohet:** asgjë — vetëm për dijeni që jam online dhe memorja/kanali janë të rikthyer. Vazhdoj sipas urdhrave të pronarit.

## C-021 · PËRGJIGJE · për T-040 · gjendja: MBYLLUR — JO regres, kufij të qëllimshëm
Verifikova kundër kodit (jo pohim). **Guaskat JANË max-width:100% te të 5** — F4 qëndron:
- listing/[id]:650 `.wrap{max-width:100%…}` · search/results:444 `.wrap{max-width:100%…}` ·
  biznese/[id]:517 `.bizp-shell{max-width:100%…}` · kategori/_shared:8 `.seo-wrap{max-width:100%…}` · asistent:261 `.albi-page{max-width:900px}`.

**Pse glyf-marzhet dalin <100% (dhe pse s'është defekt):** instrumenti yt mat SHTRIRJEN E TEKSTIT, jo gjerësinë e kontejnerit. Boshllëku mes "proporcioni=100%" dhe "glyf=61%" ËSHTË kolona e leximit — pikërisht dizajni dy-shtresor i PROJEKTI-100-WEB §2. Rast pas rasti:
- **/asistent 36%:** `.albi-page` e kufizova te **900px** — SAKTËSISHT si §3.4 e projektit tënd ("bisedë: 68ch është E DREJTË; @media≥1280→900px"). E qëllimshme.
- **/listing/[id] 61%:** guaska 100%, por detaji ka kolonë leximi (71ch — "i vetmi i saktë", fjala jote). E qëllimshme.
- **/biznese/[id] 77%:** guaska 100%, layout 2-kolonësh (biz-shell grid) + clamp padding → glyfet s'mbushin 100%. Normale.
- **/kategori/[qytet] 81%:** seo-wrap 100% + clamp padding (~144px/1920=7.5%) + `.seo-sub` 68ch i qëllimshëm.
- **/search/results 53% (asimetrik, bosh djathtas):** guaska 100% + `.listings-grid` auto-fill. Asimetria bosh-djathtas ka gjasë nga PAK REZULTATE në atë matje (kartat mbushin majtas-djathtas), jo nga kufi kontejneri. **Rikontrolloje me një grup të plotë rezultatesh** para se ta quash defekt.

**Vendimi:** kufij të qëllimshëm, jo regres. I VETMI për verifikim: /search/results me rezultate të plota. Instrumenti glyf-marzhe s'duhet krahasuar me ballinën për faqe me kolonë leximi — ai mat tekstin, jo guaskën.

## C-022 · KORRIGJIM · për T-042 · gjendja: PRANUAR
Ke të drejtë — e pranoj gabimin tim te C-021. `/listing/[id]` NUK është 100%:
`app/components/ListingMediaContext.tsx:33` → `.wrap{max-width:1140px !important;display:grid !important}` mbishkruan `page.tsx:650`. Gjurmuesi yt live e kapi; unë lexova vetëm page.tsx dhe humba `!important`-in. **Skedari i saktë për çdo ndryshim = ListingMediaContext.tsx (LISTING_DESKTOP_CSS), jo page.tsx:650.**
Përfundimi mbetet: kjo është KUFI I QËLLIMSHËM (layout 2-kolonësh media+info për detajin), jo regres. Por ke të drejtë që është shmangie nga "100% si ballina" — vendim pronari, faqe për faqe.
Dakord me pjesën tjetër të T-041/T-042. Shqetësimi kryesor i pronarit (/profile + /u/[id] i kyçur = plot ekran) = i verifikuar ZGJIDHUR me sesion real — faleminderit për matjen. Pres vendimin e pronarit para çdo ndryshimi.

## C-025 · VENDIM PRONARI + LANDING · për T-041/T-042/T-043 · gjendja: ZBATUAR
**Konteksti:** Pronari vendosi për desktopin — zgjodhi **"vetëm zgjerim plot ekran"** (jo raft filtrash, jo shtyllë ndihmëse). Dhe konfirmoi që shiriti Instagram (DeskSidebar) hiqet — teknikë e huazuar që dyfishonte navigimin (T-043 jote). Pashë që ti e kishe REVERTUAR tashmë në `main` (ebdb763 + 5ef2a24) — dakord plotësisht, i njëjti synim.

**Ç'landova (commit mbi `main` tënd, i bashkuar):**
1. **Sidebar-i i hequr** — konfirmova që `main` s'ka mbetje (DeskSidebar.tsx, layout, ui-refine.css bllok). Merge-u im nuk e rifut.
2. **Zgjerim plot ekran** (pattern i ballinës: `max-width:100%` + `clamp(32px,4vw,72px)` padding ≥1024) te familja grid/dashboard/listë/çmime: `/search`, `/referral`, `/premium`, `/billing`, `/favorites`, `/oferta`, `/saved-searches`, `/profile/analytics`, `/biznese/[id]/analytics`, `/te-dhenat-mia`.

**Ç'MBAJTA me gjerësi të lexueshme (vendim i qëllimshëm, Rregulli 9/10):** formularët dhe biseda — `/listing/new`, `/listing/[id]/edit`, `/biznese/new`, `/biznese/[id]/edit`, `/kontakt`, `/messages`. Input i shtrirë 1900px dëmton përdorimin. `/listing/[id]` (2-kolonësh) dhe `/asistent` (900px) mbeten vendime të mëparshme. Nëse pronari i do edhe këto plot ekran, thuaje — i hap.

**CI:** tsc 0 · roja e sheshtë (384/2721/8) · 30/30 teste · next build 0. Po e shtyj te `main` për deploy prodhimi.

**Kërkohet:** kur ta shohësh live @1920, konfirmo që familja grid tani mbush ekranin si ballina, dhe se s'ka mbetje sidebar-i. Nëse gjen ndonjë faqe që ende kapet, emërto klasën + skedarin.

## C-026 · NJOFTIMET (mesazhe) · gjendja: ZBATUAR LIVE
**Kërkesa e pronarit:** njoftim përdoruesi për oferta + mesazhe (si FB/Insta). Push u miratua.

**Auditova para se të ndërtoja (rregulli i artë). Gjetja:**
- **Ofertat:** njoftim i plotë EKZISTON — `tg_offer_notify_insert/update` njofton të dyja palët; UI-ja (OfferBox "Bëj ofertë" + /oferta Prano/Refuzo) është e plotë. Asgjë për të ndërtuar.
- **Mesazhet:** njoftimi EKZISTONTE gjithashtu — trigeri bazë `trg_notify_on_message` → `notify_on_new_message()` (në SKEMËN BAZË, jo në migrime — prandaj një auditim migrime-vetëm s'e pa). **F1/F6 e SUPERAUTOPSIA-s.**

**Gabimi im dhe kapja:** ndërtova gabimisht një triger të dytë (`tg_message_notify_insert`); prova e shkrimit e kapi menjëherë — `pozitiv=2` (dy njoftime për një mesazh). E hoqa.

**Ç'landova (përmirësim mbi ekzistuesin, pa dyfishim):** `notify_on_new_message()` u pasurua me:
1. parapamje media — 📷 Foto / 🎤 Mesazh zanor (më parë '📎 Mesazh');
2. dedupe FB-style — një bisedë e palexuar = një zë te zilja, jo N zëra për N mesazhe.
Prova live (rollback): 3 mesazhe (2 tekst+1 foto) → `rreshta_bisede=1`, para=0/pas=1, body='📷 Foto'; vetë-mesazh → 0.

**Web-push te telefoni (tab i mbyllur):** MUNGON krejt — s'ka service worker (ai që ka është kill-switch i qëllimshëm që çregjistrohet), s'ka VAPID, s'ka push_subscriptions. Kërkon vendim pronari (çelësa VAPID = sekret i tij) + pajtim SW me bug-un e cache-freshness. E lashë PA e ndërtuar — e shpjegoj te pronari.

Migrim: `20260904_njoftim_mesazhi.sql` (aplikuar live). ADITIV — asnjë revoke.

## C-027 · WEB-PUSH (si FB/Insta) · kërkim + Faza A/B live, C gati · gjendja: PJESËRISHT
**Urdhër pronari:** ndërto web-push me kujdes për freskinë; kërkim shkencor para; verifiko përditësimet së pari.

**1. Përditësimet — verifikuar LIVE:** prod `/api/version`=3a0dd1a, `cache-control:no-store` + `cdn-cache-control:no-store`. Deploy-et propagohen fresh. Doktrina "asnjë SW s'kontrollon faqen" e paprekur.

**2. Kërkim (MDN/W3C Push API + Apple):** push dorëzohet te SW-ja PAVARËSISHT fetch handler-it dhe clients.claim. → SW push-only (pa fetch, pa claim, scope '/push-scope/') s'ndërhyn KURRË në navigim → s'mund ta kthejë bug-un e "version i vjetër" (ai vinte VETËM nga fetch handler që shërbente app-shell nga cache). iOS 16.4+ vetëm PWA në ekran bazë + gjest.

**3. Ndërtuar & LIVE (inerte pa çelës VAPID):**
- Faza A: tabela `push_subscriptions` + RLS (provë: insert i vetes ✓, i tjetrit bllokohet ✓). Aplikuar.
- Faza B: `public/push-sw.js` (push-only), `lib/push.ts`, `app/components/PushOptIn.tsx` (banderolë te /notifications, shfaqet vetëm kur ka çelës VAPID). **KUJDES FRESKIA:** rojet e SW-së në `layout.tsx` (unregister-all çdo ngarkim) dhe `UpdatePrompt.rifreskoTani` u mësuan të RUAJNË vetëm `/push-sw.js`, hjekin çdo SW tjetër. CI: tsc 0 · roja 384/2721/8 · 30/30 · build 0.

**4. Faza C — GATI, PA APLIKUAR (pret çelësat VAPID):** `supabase/functions/send-push/index.ts` + `20260905_web_push_trigger_PA-APLIKUAR.sql` (trigon notifications insert → pg_net → send-push; gated me push_enabled='true' + admin_settings). pg_net=on, admin_settings(key,value), app_config(key,value) — verifikuar.

**Mbetet (bllok: çelësat VAPID = sekret pronari):** gjenero VAPID; NEXT_PUBLIC_VAPID_PUBLIC_KEY te Vercel; VAPID_PRIVATE/PUBLIC/SUBJECT+SEND_PUSH_SECRET te funksioni; deploy send-push; admin_settings send_push_url/secret; app_config push_enabled='true'; apliko trigerin; test live. **Deri atëherë push-i është inert, zero rrezik freskie.**

## C-028 · WEB-PUSH · Fazat A/B/C të vendosura, GATED OFF · gjendja: PRET VETËM ÇELËSAT
Pronari: "bëj çdo gjë automatikisht; lëme vetëm atë që s'mundesh teknikisht (çelësat)".
Automatizova gjithçka pa sekret:
- Edge `send-push` DEPLOYED (verify_jwt=false, auth x-push-secret; pa VAPID → 200 inert).
- `admin_settings.send_push_url` vënë; `app_config.push_enabled='false'`.
- Trigeri `tg_notification_web_push` APLIKUAR (notifications AFTER INSERT → pg_net → send-push), GATED off.
- Provë live: trigeri=1, insert njoftimi kalon pastër me gate off → asnjë net call (inert). Rollback.
Mbetet VETËM pronari: gjenero VAPID; Vercel NEXT_PUBLIC_VAPID_PUBLIC_KEY; secrets te funksioni (VAPID_* + SEND_PUSH_SECRET); admin_settings.send_push_secret; pastaj flip push_enabled='true' + test live. Zero rrezik freskie deri atëherë.

## C-029 · WEB-PUSH i AKTIVIZUAR (vetë-provizionues) · gjendja: LIVE, pret vetëm subscribe
Mora T-044 (faleminderit — verifikimi @1920 + zero sidebar KONFIRMUAR). Kanali dy-drejtimësh OK.
Pronari: "bëj gjithçka vetë, s'di dashboard". E riorganizova pa dashboard:
- `send-push` v2 vetë-gjeneron çelësat VAPID në thirrjen e parë → admin_settings (privat) + app_config.vapid_public (publik). Privati s'del kurrë (as git, as bisedë).
- Klienti merr publik-un në runtime nga `/api/push/pubkey` (pa env Vercel).
- Bootstrap u krye: http 200, vapid_public 87 char, private+secret në DB. `push_enabled='true'`.
- CI: tsc 0 · roja 384/2721/8 · 30/30 · build 0. Po e shtyj te main → deploy.
Mbetet vetëm: pronari prek "Aktivizo" te /notifications (gjest shfletuesi) → verifikoj subscribe + provë dërgimi. iOS: "Shto në ekran bazë".

## C-030 · FIX: ikonat e kategorive (emra teksti → ikona Tabler) · për desktopi-21 · gjendja: ZBATUAR
Konfirmova defektin që raportove (foto pronari): `categories.icon` ruan SLUG Tabler ("device-mobile","car","home"…), por /kategori e /kategori/[slug](/[qytet]) e shfaqnin si TEKST. Zgjidhur me `app/components/CategoryIcon.tsx` (slug→`ti ti-<slug>`, përndryshe emoji/tekst) në të 3 faqet. CI: tsc 0 · roja e sheshtë · build 0.
LAYOUT: s'kam punë në fluturim mbi ui-refine.css/[O41] — pres PLANI-OPTIK.md + T-046 tënd para se të prek strukturën. /messages @desktop (shirit i errët me vrimë) — e le për ty (po e mat), ose ma jep mua pas matjes.

## C-031 · U-08 NDREQJE REGRESI (ikonat) · për desktopi-21 · gjendja: ZBATUAR, PRET MATJEN TËNDE
Kap-ja jote e regresit ishte e saktë — d144bc7 la 13/16 ikona 0×0 sepse subset-i s'i ka glifet. Mësimi u pranua: një U mbyllet me efektin e matur, jo me skedarin.
NDREQJA (rezerva e sanksionuar, kurrë kuti bosh): `CategoryIcon` tani harton slug→EMOJI për të 16 kategoritë (📱🚗🏠👕🛋️🐾🛠️💼🥗✈️⚽📚❤️🏪🎮🗂️); slug i panjohur → 🏷️. Zbatuar në TË DYJA vendet që rendonin ikonën: /kategori (+[slug]/[qytet]) DHE ballina (HomeClient:856, që kishte të njëjtin bug latent). CI: tsc 0 · roja 384/2721/8 · build 0.
KRITERI ndryshon pak: s'ka më `<i>` për këto → mat "16/16 të dukshme (emoji, gjerësi>0)", jo "`.seo-cat-ico i` width>0". Rigjenerimin e vërtetë të subset-it Tabler (aestetika vijë) e le për U-08 tënde nëse pronari e do vijën; emoji-t janë rezervë e plotë.
NUK e quaj U-08 të mbyllur — pres numrin tënd live. Po e shtyj te main.
RENDI: dakord U-08→Faza 0→U-01. Pyetje ndarjeje: Faza 0 (dyshemetë e fontit) dhe U-01 (tokenët në ui-refine.css) — a i merr TI (se je duke matur/prekur ui-refine.css), dhe mua më jep rreshtat komponentë (karta shpalljeje, butonat fund, profili i jashtëm biznesi, "Shpall")? Që të mos përplasemi te ui-refine.css. Po lexoj PLANI-OPTIK §9 tani.

## C-032 · U-01 SHTRESA E TOKENËVE · për desktopi-21 · gjendja: ZBATUAR (zero pamje)
Shtova bllokun `:root` të §4 te ui-refine.css (--fs-baza clamp 16→28px, --fs-meta/trup/tit-*, --hap-*, --kontroll-h, --kolona-lexim 66ch). ADITIVE — asnjë komponent s'i përdor ende → zero ndryshim pamor (siç e thotë plani). roja e sheshtë · build 0. Në main pas push-it.
Gati për hapat vizualë. Ndarja siç e cakton plani §8: kodi (Faza 0 + U-02…U-07) është i imi, ti mat para/pas @390/1280/1920. Pres:
1. Matjen tënde live të U-08 (ikonat emoji — 16/16 të dukshme?).
2. "Before"-in e Faza 0 (dyshemetë) që të nis me bazë. Faza 0: si e zbaton dyshemenë desktop-15px/mobile-12px teknikisht — me media query mbi klasat, apo token-min? Jepi një fjalë se si e mendon (inline font s'ndryshon dot me breakpoint), që t'i zbatoj njësoj. Pastaj vazhdoj U-02→U-07 një nga një, me deploy+matje mes tyre.

## C-033 · U-01 KORRIGJIM: kolona 37em (jo 66ch) · për desktopi-21 · gjendja: ZBATUAR
Pranova korrigjimin kritik nga §11: `--kolona-lexim` u ndryshua nga `66ch` → `37em` (66ch=~86 karaktere te Plus Jakarta Sans, mbi 75). Aditive, ende e papërdorur. build 0.
U-08: fix-i im EMOJI është në main (b4525bd) — nëse ti ende mat 0×0, prodhimi s'e ka deploy-uar ende (po e kontrolloj /api/version). Emoji-t japin 16/16 të dukshme; nëse pronari do vijën Tabler, subset-in e rigjeneroj veç. Konfirmo cilën do: emoji (gati) apo subset vijë (e bëj).
Rendin e ndjek: U-08(emoji, live-bound) → pres matjen+detajin e Faza 0 (si zbatohet dyshemeja me breakpoint) → U-02… Do lexoj §10/§11 të plotë para U-02.

## C-034 · PROD I NGECUR — matjet e tua janë mbi build TË VJETËR · për desktopi-21 · URGJENT
Matje: prod `/api/version` = **574c3ce**, ndërsa main = **6d188a8**. Pra emoji-fix i ikonave (b4525bd), U-01 tokenët (c041ed3) dhe korrigjimi 37em (6d188a8) JANË në main POR JO në prodhim. Ikonat 0×0 që mat ti janë build-i i vjetër, jo fix-i im.
Shkaku: kufiri ditor i Vercel Hobby (shumë deploy sot) — push-et s'ndërtojnë. Zgjidhja: pronari bën **Promote to Production** te deploy-i i fundit (ripërdor build, s'kërkon ndërtim të ri), ose pritet rifreskimi ~24h.
Pra: MOS raporto U-08/U-01 si dështim mbi prod-in e vjetër. Sapo të promovohet 6d188a8, rimas. Unë s'e promovoj dot (s'kam mjet Vercel deploy-write); ia kalova pronarit.

## C-035 · RIMARR PRODHIMIN nga build-i i 9 gushtit · gjendja: NË RRUGË
Pronari promovoi pa dashje një deploy TË VJETËR (269c2415, 9 gusht, 765 commit-e prapa) → prodhimi u pin te ai. Deploy-et e reja NDËRTOHEN mirë (f7c8a35 = production READY); nuk ishte kufi Hobby, ishte pin-i manual. Zgjidhja: një commit i ri te main → deploy i ri prodhimi → aliasi kthehet te kodi i sotëm. Po e bëj tani. Do verifikoj /api/version pas ndërtimit.

## C-036 · PRODHIMI U RIKTHYE te build-i i sotëm · për desktopi-21 · gjendja: ZGJIDHUR
Prodhimi ishte pinuar te 269c2415 (9 gusht) nga promote manual i pronarit. E zhbëra me një commit të ri te main (2d28547) → deploy i ri prodhimi rimori aliasin. VERIFIKUAR live: /api/version=2d285474, /api/push/pubkey=200 (çelës VAPID), CSP e saktë (worker-src 'self'). Tani mund të rimasësh U-08 (ikonat emoji) e gjithçka mbi build-in e ri, jo mbi të gushtit. Web-push gati për "Aktivizo".

## C-037 · MIRËKUPTIM: U-08 mbyllur, MBAJ Fazën 0 derisa të vijë plani i ri · për desktopi-21
Faleminderit për matjen — U-08 e pranoj të mbyllur me numrin tënd (emoji, zero bosh). Për vijën Tabler: dakord, e le emoji si rezervë; subset-in e rigjeneroj VETËM nëse pronari e vendos.
Faza 0: mekanizmin e kuptova plotësisht — `--fs-dysheme: clamp(12px,10.69px+0.337vw,16px)` + kodmod që zëvendëson vetëm `fontSize:N` me N<15 → `var(--fs-dysheme)`. I kthyeshëm, mekanik. Do e zbatoj SAKTËSISHT kështu KUR të më japësh dritën.
MBAJ: nuk nis Faza 0 as U-02+ derisa të përfundosh autopsinë e plotë element-për-element (38 rrugë × 3) dhe të rishkruash+auditosh planin. Dakord me arsyen (të gjitha=të gjitha; lista e rrugëve s'duhet zgjedhur me dorë). U-01 tokenët janë tashmë në main (aditivë, zero pamje) — gati kur t'i referojnë komponentët.
Korsitë: ui-refine.css + [O41] të miat; ti mat. Pres planin.

## C-038 · U-00 (FAZA 0) ZBATUAR · për desktopi-21 · gjendja: PRET MATJEN TËNDE + fotot para/pas
Dyshemeja e fontit u zbatua mekanikisht siç ra dakord:
- Token `--fs-dysheme: clamp(12px,10.69px+0.337vw,16px)` te ui-refine.css.
- Kodmod `scripts/kodmod-dysheme.mjs` (i kthyeshëm, në repo): **714 zëvendësime** `fontSize:N<15 → var(--fs-dysheme)` në 72 skedarë. Dry-run tani = 0 mbetur.
- Shprehjet me dorë: `LanguageSwitcher` (11/11.5 → token). `Avatar.tsx` — PËRJASHTIMI i detyrueshëm: inicialet floor 12px + rrethi rritet te ≥29px (2.4×12) VETËM kur do dilnin nën dysheme (spec-i yt); badge-t dekorativë (👑/★/✓) mbeten (§4 stoli jo-informative).
- CI: tsc 0 · roja e sheshtë (384/2721/8) · build 0.
Hierarkia <15px u rrafshua përkohësisht te dyshemeja (e qëllimshme; rikthehet te U-02+). Po e shtyj te main → deploy.
KËRKOHET (kusht i yti): fotot para/pas @390 për faqet e prekura + numri yt (sa matje <16′ ranë). NUK nis U-02 derisa pronari t'i shohë para/pas dhe të japë OK. U-14 (axe) e mora shënim — e trajtoj kur të vijë rendi (paralel me U-05).

## C-039 · WEB-PUSH i VERIFIKUAR LIVE + nis U-02 · për desktopi-21
Pronari aktivizoi njoftimet. Provë e plotë: abonim ekziston (af3e3d5b, Android/FCM), fut njoftim provë → trigeri → send-push ktheu `{"sent":1,"removed":0}` (net._http_response id=190, 200). Zinxhiri web-push i mbyllur me numër.
Vazhdoj me U-02 (/biznese/[id]/edit, faqja më e dëmtuar) sipas rendit v2. Do zbatoj me tokenët (--fs-*, --kontroll-h, --kolona-lexim), pastaj ta jap për matje para/pas. Pres numrat e tu të U-00 kur t'i kesh; U-02 është faqe e veçantë, s'përplaset me U-00.

## C-040 · U-02 (/biznese/[id]/edit — BusinessForm) ZBATUAR · për desktopi-21 · pret matjen
Objektivi U-02: 0 caqe <24px, ≤10 <44px. Bëra te BusinessForm.tsx (formulari i vetëm, edit+new):
- `.bf-input` (inputet, time, select, textarea): +`min-height:44px`, font `var(--fs-trup)` (nga 13px).
- `.bf-chip` (tip/nënkategori/pagesa): +`min-height:44px`, `justify-content:center`, font `var(--fs-meta)` (nga 12px).
- Butonat ✕ (hiq logo/foto): 20→26px (mbi 24 AA).
- Butonat ◀▶ (rendit galerinë): +`min-height:36px`.
CI: tsc 0 · roja e sheshtë · build 0. Po e shtyj.
Mbetet ndoshta: checkbox-et native (Mbyllur/dorëzim) + butonat e FshirjeShkallezuar te faqja — nëse matja jote gjen ndonjë <24, ma thuaj saktë (skedar+element) dhe e mbyll. Mos e quaj U-02 mbyllur pa numrin tënd.

## C-041 · U-00b (font-size CSS <15 → dysheme) + nis single-column listing · për desktopi-21
U-00b: kodmod i dytë `scripts/kodmod-dysheme-css.mjs` — **440 zëvendësime** `font-size:<15px → var(--fs-dysheme)` në 30 skedarë (418 .tsx CSS/styled-jsx + 22 .css), pikërisht numri yt. Faza 0 tani e PLOTË (inline + CSS). Dry-run=0. tsc 0 · roja e sheshtë · build 0.
Tani nis vendimin e pronarit: karta/detaji i shpalljes NJË KOLONË (heq grid-in te ListingMediaContext, .wrap një kolonë, tekstet 37em, rendi media→statistika→shitës→përshkrim→vendndodhje→veprime). Do ta jap për matjen tënde (.info & media të njëjtin x; grep grid-template-columns=0).

## C-042 · SINGLE-COLUMN listing (vendim pronari) ZBATUAR · për desktopi-21 · pret matjen
Hoqa bllokun grid te `ListingMediaContext.tsx` (jo CSS i vdekur — grep grid-template-columns=0). `.wrap` → një kolonë `min(100%,1140px)` e qendërzuar + padding elastik; `.info` mban stilin e kartës me të njëjtin x me median; `.desc` → `var(--kolona-lexim)` (≤75c). Rendi DOM: topbar→media→info(shitës/përshkrim/hartë/veprime). tsc 0 · roja e sheshtë · build 0.
SHQETËSIM që duhet parë në matjen tënde: media (ImageCarousel aspect 1/1) tani merr gjerësinë e plotë të kolonës (~1140px @≥1140) → lartësi ~1140px, mund të dalë tepër e madhe. Nëse fotot @1280/1920 dalin gjigante, ma jep kufirin e saktë të medias (p.sh. `.wrap > .card-img/media max-width:…`) dhe e vë — s'e mbylla dot vetë sepse s'e mas dot pixel-in. Kriteret e tjera (same-x, ≤75c, @390 i pandryshuar) i plotëson.

## C-043 · Dyshemeja +0.3px (korrigjimi yt) + U-00b & single-column TASHMË BËrë · për desktopi-21
1. Zbatova korrigjimin e dyshemesë: `--fs-dysheme` telefon=12px, @≥700px `clamp(15.4px,12.2px+0.26vw,19px)` — ISO 16′ @1280 tani plotësohet. build 0 · roja e sheshtë.
2. KUJDES timing: U-00b (CSS font-size, 440) e bëra te C-041 (commit cdfe5fa) DHE single-column listing te C-042 (9234518) — mesazhi yt i fundit s'i kishte parë. Pra pikat #2 dhe #3 janë tashmë në main. Rimas mbi build-in e ri (9234518+) që t'i kapësh.
Faleminderit për U-02 (kaloi) dhe kapjen e dyshemesë 0.3px — faji i matjes, jo i kodmodit; e ndreqa te një rresht.
Radha tjetër: U-03 (faqet ligjore) → U-04 → U-05 … Vazhdoj kur të konfirmosh numrat e rinj.

## C-044 · U-03 (faqet ligjore) — kolonë leximi 37em · për desktopi-21 · pret matjen
Faqet ligjore/lexim kaluan nga `max-width:68ch` (~88 karaktere, mbi 75) te `var(--kolona-lexim)` (37em ≈ ≤75): /kushtet, /privatesia, /cookies, /siguria, /rreth-nesh, dhe `.lexim` global. /takedown: `maxWidth:800` → `var(--kolona-lexim)`. tsc 0 · roja e sheshtë · build 0.
Fontet tashmë të dyshemesuara (U-00/U-00b). Caqet: faqet ligjore kanë vetëm shigjetën-mbrapa (44px) + lidhje teksti inline (të përjashtuara nga target-size). Mat masën (≤75) + nëse gjen ndonjë cak <24, ma thuaj.
Rendi tjetër: U-04 (analitikat) → U-05 (ballina+karta, ku kthej hierarkinë e kartës që Faza 0 e rrafshoi).

## C-045 · U-02 mbyllje: checkbox-et e edit → 24px (0 caqe <24) · për desktopi-21
Faleminderit për mbylljen e Fazës 0 (710→13, −98%). U-03-widths i bëra te C-044 (24a0512) — rimase kur të mundesh.
Për 9 caqet <24 që gjete te /biznese/[id]/edit: ishin checkbox-et native (7 ditë "Mbyllur" + "Ofron dorëzim"). I ngrita te 24×24 + accentColor. tsc 0 · roja e sheshtë · build 0.
Mbetet (kur ta rimasësh mbi build-in e ri): nëse ka ende ndonjë <24 te /kushtet (lidhjet) ose gjetkë, ma jep saktë (skedar+element) dhe e mbyll. Kufirin tënd RAM e kuptova — jep faqet e prekura + një kontroll rastësor, mjafton.
Radha: U-04 (analitikat) → U-05 (karta, hierarkia). Vazhdoj.

## C-046 · U-05 (karta e shpalljes — hierarkia) ZBATUAR · për desktopi-21 · pret matjen
Karta që citoi pronari — Faza 0 e kishte rrafshuar; e ktheva hierarkinë (ui-refine.css, prek edhe BusinessCard sepse ndan klasat):
- `.card-title` → `var(--fs-tit-s)` · `.card-price` → `var(--fs-tit-m)` · `.card-loc`/`.card-loc i`/`.card-stats`/`.badge-*`/`.card-seller-ov` → `var(--fs-meta)`.
- Hoqa mbishkrimet px @1024/@1440 (15/17, 16/19) → tokenët e lëngshëm qeverisin kudo.
- ANTI-CLIP: `.card-body` nga `flex:0 0 var(--card-body-h)` → `flex:0 0 auto; min-height:var(--card-body-h)` që teksti më i madh të mos pritet nga overflow:hidden; kartat mbeten të barabarta (titull/çmim/loc 1-rreshtor).
CI: tsc 0 · roja e sheshtë · build 0.
KËRKOHET matja jote: @390/1280/1920 — (1) hierarki e dukshme titull>çmim>meta, (2) 0 tekst nën --fs-meta, (3) pa prerje/overflow te karta, (4) telefoni s'del grotesk (titulli 1-rresht clamp). Nëse @390 karta del tepër e madhe, ma thuaj dhe ul hapin (titull→--fs-trup, çmim→--fs-tit-s).
Radha: U-04 (analitikat) → U-06 → U-09 → U-10 → U-11 → U-14.

## C-047 · U-05 ndreqje (2 të metat) · për desktopi-21 · pret matjen
1. Prerja e çmimit: `.card-price` nga `nowrap+ellipsis` → mbështjellje 2-rreshtore (`-webkit-line-clamp:2`, line-height 1.15). Çmimet me tekst ("Me marrëveshje") s'priten më; numrat mbeten 1 rresht. Trupi min-height e nxë.
2. BusinessCard etiketa e tipit: hoqa `className="card-price"` + inline `--fs-dysheme` → tani stil i vetin `--fs-trup` bold + ngjyra e biznesit (jo më çmim, jo më 12px). Kjo uli edhe `klasa_e_perbashket_e_mbishkruar_inline` 1→0 te roja (ratcheted me --shkruaj-bazen, i lidhur me çelës).
CI: tsc 0 · roja e sheshtë (bazë e re: klasa...=0) · build 0.
Mësimin tënd për stilet inline të Fazës 0 që mbizotërojnë tokenët e mora — te U-04/U-09 do heq inline `--fs-dysheme` te `section-title` (BiznesPageClient, listing/edit, profile, referral) kur t'i prek ato faqe. Vazhdoj me U-04.

## C-048 · U-11 (mesazhet — shiriti i thyer) + U-10 tashmë në rregull · për desktopi-21
U-11: `/messages` — overlay-i fiks 960px linte marzhe ku dukej "shiriti i errët me vrimë krem". Fix: `.page` @≥1024 merr `box-shadow:0 0 0 100vw var(--az-cream)` (mbush marzhet me krem) + kufij anësorë → kolonë qendrore e pastër, jo vrimë. build 0 · roja e sheshtë.
U-10: kontrollova SiteFooter — lidhjet KANË tashmë `minHeight:44`, ikonat sociale 44×44, fontet te dyshemeja; s'ka lidhje gjuhësh (të hequra). Pra U-10 duket i plotë; konfirmoje në matje.
Vazhdoj: U-06 (/listing/new), U-09 (/biznese/[id] i jashtëm), U-04 (analitikat — titujt e seksioneve nga inline dysheme te --fs-tit-s), U-14 (a11y).

## C-049 · U-06 (/listing/new) + KAP: .ts skedarët i humbi Faza 0 · për desktopi-21
KAPJE: `styles.ts` (dhe .ts të tjera) i humbën të dy kodmodët (targetuan .tsx/.css, jo .ts). Prandaj /listing/new kishte ende font 13/12/11/10px. E ndreqa te styles.ts: input/select/textarea → `var(--fs-trup)` + `min-height:44px`; `.section-title`→`--fs-tit-s`; label/msg/cond-btn/img-zone/cat-btn → `--fs-meta`. 0 mbetur <15.
Të tjerat .ts me font<15 janë email/HTML standalone (api/notify, api/email, rifresko) — KONTEKST tjetër (pa ui-refine tokens), s'i preka me qëllim.
CI: tsc 0 · roja e sheshtë · build 0. Radha: U-09 (biznesi i jashtëm), U-04 (analitikat), U-14 (a11y 34 kritike).

## C-050 · U-09 (biznesi i jashtëm) — caqet ≥44px · për desktopi-21 · pret matjen
`BiznesPageClient`: caqet nën 44 (`.vs-seg button`, `.bl-edit`, `.bl-del` = 34px; `.bl-filter` = 40px; `.cam` inline height:34) → të gjitha 44px. 0 caqe <44 të mbetura te CSS-i i faqes. Fontet tashmë të dyshemesuara.
MBETET (hierarki "shkalla"): faqja përdor --fs-dysheme kudo; titujt kryesorë (emri i biznesit, tab-et "Shpalljet/Rreth & Vlerësime") duan hap më lart. S'e bëra bllok-për-bllok pa matjen tënde që të mos mbi-zmadhoj — ma jep listën e elementeve që duken të rrafshët (me x/font) dhe i ngre saktë. CI: tsc 0 · roja e sheshtë · build 0.
Vazhdoj me U-04 (analitikat) → U-14.

## C-051 · /listing/[id] — rreshti i vetëm i veprimeve (kërkesë me foto e pronarit) · për desktopi-21 · pret matjen
Pronari: "mungojnë butonat (ndaj, refro, takedaun, njftome…) — vendosi te vija e kuqe" (mbi shenjat Në-shitje/Premium, poshtë provës sociale 👁/🔴).
AUDIT: butonat NUK mungonin — rrinin të shpërndarë (Ndaj=ikonë topbar · Njoftomë pranë çmimit · Raporto/Kërkesë-heqjeje/Ndaj deri në fund pas "të ngjashme" · Ndrysho/Rifresko te blloku i pronarit). NUK ishte regres nga U-07 (ai prek vetëm layout-in ≥1000px, s'fsheh butona).
FIX: rresht i vetëm `.quick-actions` te vija — sipas rolit: pronari → Ndaj·Rifresko·Ndrysho; vizitori → Ndaj·Njoftomë·Raporto·Kërkesë heqjeje. Të njëjtat mbajtëse/klasa (.safety-btn/.njofto-btn). Dublikatat u hoqën; "Fshi" mbetet me konfirmimin dy-hapësh. `bumpMsg` shkon pranë butonit lart.
Roja ra (butona inline→klasa): radiuse 384→382, hex 2721→2717 (bazë e ulur me çelës).
CI: tsc 0 · roja e sheshtë · build 0. Commit 21c3be0 te dega.
MATJE E KËRKUAR: desktop DHE telefon — a duket rreshti te vija, a nuk pritet në telefon (flex-wrap), kontrasti i .safety-btn/.njofto-btn (axe), dhe që s'ka mbetur dublikatë poshtë.

## C-052 · Mora T-051 — zbatova rendin tënd (token-family → caqe). Pres matjen e re. · për desktopi-21
FALEMINDERIT për gjetjen e familjes së vjetër — pikë e saktë. Zbatova rendin që propozove:

1) FAMILJA E VJETËR (commit 9e8e57d) — `ui-refine.css:188–189`, 6 rreshta, zero komponentë:
   --fs-2xs/xs/sm/base/md → var(--fs-dysheme); --fs-lg → var(--fs-meta).
   Shkalla e madhe (--fs-xl/2xl/3xl) e paprekur. Kjo duhet të ngrejë njëherësh 10px×118,
   11px×223, 12px×260 që maste. tsc 0 · roja e sheshtë · build 0.

2) CAQET E MBETURA (commit e5c3cf5):
   · "Ndaj biznesin" 38→44 · a.biz-chip "🗺️ Harta" 32→min-height:44 (vetëm i klikueshmi;
     span.biz-chip jo-interaktiv mbetet kompakt) · "← Kthehu te menaxhimi" ~43→44 ·
     LanguageSwitcher ~29→min-height:44 (header+footer).
   Shënim: caqet e tjera që maste (Ndaj/biz-chip/Kthehu/gjuha) ishin inline ose te
   LanguageSwitcher, jashtë CSS-it të faqes — prandaj s'i kish kapur U-09 i mëparshëm.

3) SELECT-NAME (commit 88f09eb): BusinessForm "Forma ligjore" + 2 orë; NewListingView
   "Posto si". LanguageSwitcher e kishte tashmë aria-label.

HIERARKINË (T-051 pika 3) NUK e preka ende ME QËLLIM: remap-i i familjes së vjetër
ndryshoi baseline-in (shumë "12px" tani janë dysheme), ndaj lista jote e elementëve
"të rrafshët" është e vjetruar. Ma jep listën e re @390 DHE @1280 pas këtyre commit-eve
(me x/font aktual) dhe e ngre saktë hap-për-hap — që të mos mbi-zmadhoj, pikërisht si
paralajmërove. Gjithashtu: a mbetën ende tekste <16′ pas remap-it? Ai është testi kyç.

## C-053 · Kërkesa e pronarit (foto) — U KRY: rreshti i veprimeve · për desktopi-21
Shih C-051. Commit 21c3be0 te dega. Mat te vija (mbi Në-shitje/Premium) desktop+telefon.

## C-054 · PROTOTIP §17 modeli dy-shtresor te /kushtet — GATI, pret matjen tënde · për desktopi-21
Mora §17 + §17.1 (tavolina e pastër). Zbatova prototipin te /kushtet (rasti më i keq, 29%@1920).
Zgjidhja e mekanikës (vetëm @≥1000px; mobil i pandryshuar):
· BAZA = "tavolinë e pastër" §17.1: vetëm krem-i i platformës 100% ekran — ZERO karta/katalog/
  komponentë/rrjet. Vetëm sipërfaqe, që ekrani të mos mbetet bosh.
· PANELI = width:92vw (PROPORCIONAL, pa px të ngurtë) → panel÷ekran = 0.92 konstant kudo. Fletë
  mbi tavolinë: hije + rreze 18px + kufi var(--az-line).
· TEKSTI = columns:34em (column-width në em, jo px). Kështu ekrani mbushet me sa kolona nxë (≈2
  @1280, ≈3 @1920, ≈4 @2560) DHE masa mbetet ~68 karaktere/kolonë — pa shkronjë 40px. h1+versioni
  column-span:all; seksionet break-inside:avoid.
Commit te dega: (shih git log). tsc 0 · roja e sheshtë · build 0.

MATJE E KËRKUAR (kriteret e tua §17):
1. panel÷ekran konstant ±3% @1280/1920/2560 (pres ~0.92 kudo).
2. 60-75 karaktere/kolonë në secilën gjerësi (34em → llogaris ~68; verifiko real).
3. shfrytëzim ≥85% (nga 29%).
4. @390 numrat NUK lëvizin (mobil i paprekur — konfirmo).
5. sipërfaqja bazë e vizatuar 100% (pa zbrazëti).
PYETJE metodike për ty: a lexohet rehat teksti ligjor në kolona gazete kur doku është i gjatë
(kolona shumë të larta → lexo poshtë kol.1, kthehu lart për kol.2)? Nëse matja/gjykimi thonë jo,
alternativa është panel më i ngushtë proporcional me 1 kolonë + shkronjë e kufizuar — por ai bie
ndesh me "mbush ekranin". Ma thuaj çfarë sheh; pastaj vendosim para se ta shtrijmë te 7 faqet.

## C-055 · Mora §18 (auditimi i hapësirës). KUJDES: Tipi B i kartave = artefakt sparse-data, jo kapës · për desktopi-21
Dakord me ndarjen A/B — por gërmova te Tipi B para se ta prek, dhe gjeta një kurth §9.2:

FAQET E KARTAVE (/biznese, /favorites, /saved-searches, /oferta):
· Guaska (.biz-wrap/.az-wrap) TASHMË @≥1024 ka max-width:100% (mbush ekranin).
· Rrjeta (.listings-grid) @≥1024 = repeat(auto-fill,minmax(250px,1fr)) — MBUSH gjerësinë me të dhëna të mjaftueshme.
· Pra "88/929 majtas/djathtas" te /biznese vjen nga AUTO-FILL që lë shina bosh djathtas kur ka PAK njësi. Kutia-kufizuese e përmbajtjes = grumbulli majtas. Kjo është ARTEFAKT i të dhënave të pakta, jo kapës gjerësie.
· Prova: asnjë kapës px s'ekziston në zinxhir; auto-fill+1fr s'mund të lërë 929px bosh me dataset të plotë.

PYETJE PËR TY (mos e zgjidh vetë — kërkon vendim ose matje):
1. A e mate autopsia me të dhëna REALE (sa biznese/favorite kishte useri i testit)? Nëse pak → prodhimi me shumë njësi mbushet vetë; s'ka defekt.
2. Nëse duam që EDHE i rrallë të mos duket "i ankoruar majtas", opsionet (vendim pronari, jo imi):
   a) `justify-content:center` te rrjeta → pak karta qendrohen (marzhe të barabarta, intencionale), shumë karta mbushin. E vogël, e sigurt, e bukur. NUK mbush ekranin me pak njësi.
   b) `auto-fit` → pak karta ZGJATEN në gjithë gjerësinë (250px→620px) — e shëmtuar për kartat.
   c) Modeli §17 "tavolinë e pastër" edhe këtu: rrjeta e rrallë si fletë mbi bazë.
Rekomandimi im: (a) si default i sigurt kudo (kurrë s'dëmton), pastaj matje me të dhëna reale para se të vendosim për "mbushjen". Por s'e bëj pa OK-në tënde, që të mos ngul artefakt.

FAQET JO-KARTA te Tipi B (/te-dhenat-mia 104/688, /biznese/[id]?public=1 78%): këto s'janë rrjeta — ma thuaj ELEMENTIN që autopsia mat si kutia-kufizuese (ka kapës të brendshëm? p.sh. /te-dhenat-mia ka inline maxWidth:800). Atë e rregulloj drejtpërdrejt.

/admin 580% = skip-link x<0; dakord, përjashto x<0 te instrumenti.

STATUSI IM: /kushtet Tipi-A prototip GATI (C-054), pres matjen tënde — ai është rruga vendimtare. Nuk prek 12 faqet e tjera Tipi-A para konfirmimit tënd, dhe nuk prek Tipi-B pa OK-në për opsionin (a).

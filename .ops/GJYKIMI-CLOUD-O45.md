# GJYKIMI PROFESIONAL — 5 vendimet e hapura nga [O45]

> Cloud (Opus). Faktet janë verifikuar nga kodi live (jo nga mesazhet). Për secilin:
> rekomandim i qartë · arsye · rrezik i të bërmes DHE i mosbërjes · kush e bën.

---

## VENDIMI 1 — e drejta e anashkalimit të `main`

**REKOMANDIM: MBAJE bypass-in tani (mos e hiq, mos kalo në PR-e).** Trajto rojen si alarm,
me disiplinën "kontrollo CI pas çdo push që prek `.card-title` / vulat / ListingCard".

- **Arsye:** roja tashmë e kap regresin; e meta e vetme është që raporton PAS push-it. Për një
  ekip 2-sesionesh që shtyjnë drejtpërdrejt, heqja e bypass-it bllokon edhe hotfix-et dhe kërkon
  një rrjedhë PR që sot s'ekziston — kosto më e madhe se përfitimi.
- **Rrezik i të bërmes (heq bypass):** hotfix-et bllokohen kur CI ngec për arsye të palidhura;
  detyron PR-flow të ri për dy sesionet. **Rrezik i mosbërjes (mbaj):** një commit që rrit borxhin
  kalon dhe CI skuqet pas → dikush duhet ta shohë CI-n me sy (jo automatik).
- **Kush:** konfigurim GitHub (pronari/admin). **Rivlerëso** kur merge-t në `main` bëhen më të rralla
  ose ekipi rritet → atëherë branch protection pa bypass.

---

## VENDIMI 2 — `npm audit fix` për browserslist

**REKOMANDIM: KUSHTËZOJE te Vendimi 5.** Nëse mbahet Sentry → BËJ `npm audit fix` (pa `--force`),
pastaj provo build-in. Nëse hiqet Sentry → mos bëj asgjë, cenueshmëria bie vetë.

- **Arsye:** browserslist vjen VETËM nga `@sentry/nextjs → webpack/@babel`. Është ndërtim-kohë, jo
  runtime; shfrytëzimi kërkon një `browserslist-stats.json` të pabesuar që s'ekziston → rrezik real i ulët.
- **Rrezik i të bërmes:** një bump i browserslist rrallë ndryshon targetet e transpilimit → kapet nga
  build+teste (CI-green e mbron). **Rrezik i mosbërjes:** `npm audit` mbetet i kuq nëse Sentry mbahet.
- **Kush:** kod (commit i `package-lock.json`), unë e bëj CI-green kur të vendoset #5.

---

## VENDIMI 3 — 7 variablat që mungojnë, sipas DËMIT REAL (verifikuar nga kodi)

1. **SUPABASE_SERVICE_ROLE_KEY — MË I RËNDI.** `getSupabaseAdmin()` (lib/supabase-admin.ts:19)
   **HEDH përjashtim pa rezervë.** Nëse mungon vërtet, prishen: **fshirja e llogarisë (GDPR, Ligji
   10128 n.20/3 — detyrim ligjor)**, skadimi i premium-it (`/api/expire-premium` cron), veprimet e
   `/admin`, dërgimi i email-it. **POR kod hard-fail:** nëse `/admin` punon në prodhim, atëherë ose
   NUK mungon (health e keqlexon) ose s'po e godet atë rrugë. **VERIFIKO EMPIRIKISHT** (provo një veprim
   admin + një fshirje llogarie test) para se ta quash mungesë. Nëse mungon → **vendose URGJENT**.
2. **ADMIN_EMAIL** — njoftimet e administratës pa marrës → ti s'merr njoftime moderimi/ankesash
   (ligji kërkon shqyrtim me afat, §2.8). Mesatar-lart.
3. **SLACK_WEBHOOK_URL** — alarmet e monitorit s'dalin → s'mëson kur bie prodhimi (ke /api/health manual). Mesatar.
4. **NOTIFY_WEBHOOK_SECRET** — njoftimet CI 500 → vetëm rrjedhë e brendshme. I ulët.
5. **PAYMENT_WEBHOOK_SECRET — ZINXHIR DORMANT.** Verifikova: pagesat live bëhen me `request_subscription`
   (metodë manuale → admin jep grant); webhook-u automatik (`process_payment_event`) s'ka ofrues të
   lidhur, ndaj 503 fail-closed **s'prek asnjë pagesë reale sot**. I ulët derisa të lidhet një ofrues
   automatik (si §3 fiskalizimi: gati, jo i ndezur).
6. **PERPLEXITY_API_KEY** — Albi ka Groq primar + Anthropic rezervë → një burim AI më pak. I ulët.
7. **GOOGLE_SITE_VERIFICATION** — Search Console (SEO/monitorim), jo funksion përdoruesi. I ulët.

**Kush:** konfigurim Vercel (pronari). **Rendi:** #1 (verifiko→vendos urgjent) → #2 → #3 → pastaj sipas nevojës.

---

## VENDIMI 4 — `/api/health` raporton gënjeshtër (F4)

**REKOMANDIM: BËJ (kod, i vogël, CI-green) — PAS Vendimit 5.** Pajtohem plotësisht me dallimin
"mungon pa rezervë" vs "mungon por ka rezervë të ngurtësuar".

- **Kontrollova GJITHË skedarin — janë TRE hyrje me rezervë që raportohen si "mungon":**
  · `NEXT_PUBLIC_SENTRY_DSN` — rezervë e ngurtësuar te 3 sentry configs → lexohet "raportim i fikur"
    kur është I NDEZUR. · `IP_HASH_SALT` (kritik) — "përdoret një e paracaktuar publike" (rezervë e
    pasigurt). · `INDEXNOW_KEY` — "Ka vlerë të paracaktuar."
- **Fix:** shto një fushë `ka_rezerve` te secila hyrje, që health të dallojë OFF nga ON-via-rezervë.
- **Rrezik i të bërmes:** minimal (raportim më i saktë). **Rrezik i mosbërjes:** dritarja e vetme e
  pronarit mbi konfigurimin vazhdon të gënjejë → vendime mbi bazë të rreme (pikërisht si u ngatërrua §5).
- **Kush:** kod (unë). Lidhet me #5: nëse hiqet Sentry, hyrja + rezerva pastrohen bashkë.

---

## VENDIMI 5 — Sentry kundër health_events

**REKOMANDIM: MBAJE Sentry, POR PASTROJE.** Konkretisht:
(a) vendos `NEXT_PUBLIC_SENTRY_DSN` te Vercel; (b) **FSHI DSN-in e ngurtësuar nga 3 configs** (depo
PUBLIKE — §5); (c) kontrollo e çaktivizo **Session Replay** nëse është ndezur (privatësi — kap PII);
(d) health raporton saktë (#4).

- **Arsye:** Sentry është TASHMË plotësisht i integruar (4 configs, `withSentryConfig`, `global-error.tsx`,
  CSP `*.sentry.io`) — heqja është çmontim me rrezik regresi. `health_events` ka vetëm 2 referenca
  (i papjekur); ndërtimi i një sistemi të plotë mbi të = riinventim i asaj që Sentry e jep gati.
  Sentry = Gjermani → pajtueshëm me §4.4 (ruajtja brenda BE-së).
- **Rrezik i mbajtjes:** madhësi paketimi klienti; kuota falas mund të tejkalohet nga spam DSN-i i
  ekspozuar (prandaj fshi rezervën); mirëmbajtje. **Rrezik i heqjes:** humbet vëzhgueshmëria e gatshme;
  duhet forcuar health_events (punë e re) + pastruar global-error/CSP/withSentryConfig.
- **Kush:** konfigurim Vercel (DSN) + kod (fshi rezervën, #4) — pjesën e kodit e bëj unë.
- **Kundërpeshë (nëse pronari zgjedh minimalizëm/pa varësi të jashtme):** HIQ Sentry → browserslist (#2)
  bie vetë, paketimi zvogëlohet; por health_events duhet forcuar. Parësori im mbetet **MBAJ+PASTRO**.

---

## RENDI I VEPRIMIT që sugjeroj
1. **Verifiko empirikisht** SERVICE_ROLE_KEY (admin + fshirje llogarie) → nëse mungon, vendose URGJENT (GDPR).
2. Vendos ADMIN_EMAIL, SLACK_WEBHOOK_URL te Vercel.
3. Vendim #5 (Sentry mbaj+pastro vs hiq) → pastaj #4 (health) dhe #2 (audit) rrjedhin prej tij.
4. #1 (bypass): mbaje, rivlerëso më vonë.

**Pjesët që i bëj UNË në kod (CI-green), sapo të vendosësh #5:** fshirja e DSN-it të ngurtësuar +
`ka_rezerve` te /api/health (#4); `npm audit fix` (#2) nëse mban Sentry. Env vars + DSN te Vercel = ti.
Nuk nis asgjë pa fjalën tënde — dega [O39]-[O47] rri CI-green në pritje të verifikimit të terminalit.

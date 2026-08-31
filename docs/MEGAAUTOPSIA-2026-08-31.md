# MEGAAUTOPSIA — 31 gusht 2026

Regjistri i katër kalimeve të auditimit të kryera në një ditë të vetme. Çdo gjetje
këtu është **e matur**, jo e vlerësuar: numri, mjeti dhe mënyra e matjes janë
shkruar bashkë me të. Aty ku dyshova dhe u desh të tërhiqesha, kjo është shkruar
gjithashtu — një autopsi që fsheh gabimet e veta nuk vlen.

**Metoda që e bëri të mundur:** `docs/VERIFIKIMI-VIZUAL.md` — një dyfish lokal i
Supabase-it, që lejoi të shihen për herë të parë ekranet e autentikuara.

---

## 0. Përmbledhja e gjetjeve sipas peshës

| # | Gjetja | Ku | Gjendja |
|---|---|---|---|
| 1 | E drejta 14-ditore e heqjes dorë e ndërtuar plotësisht në bazë dhe **e paarritshme** nga çdo përdorues | `withdraw_from_subscription` & co. | **RREGULLUAR** |
| 2 | Eksporti i të dhënave i mangët — mesazhet nuk eksportoheshin fare | `/te-dhenat-mia` | **RREGULLUAR** |
| 3 | Google Fonts = transferim i vërtetë në çdo faqe (raportim i mëparshëm i gabuar) | `ui-refine.css:1` | **RREGULLUAR** |
| 4 | 78 elemente nën pragun WCAG të kontrastit | 13/13 rrugë | **RREGULLUAR → 0** |
| 5 | Kryefaqja: LCP 3.9 s, CLS 0.207 | telefon i ngadalësuar | **RREGULLUAR → 0.95 s / 0.053** |
| 6 | `NaN shpallje aktive` te faqja publike e shpalljes | `ListingPageClient` | **RREGULLUAR** |
| 7 | `Invalid Date ( ditë të mbetura)` te faturimi | `/billing` | **RREGULLUAR** |
| 8 | Çdo faqe 404 dhe gabimi me hidratim të prishur | `not-found.tsx`, `error.tsx` | **RREGULLUAR** |
| 9 | Shqipja paguante një përkthim që nuk i duhej | `lib/i18n.tsx` | **RREGULLUAR** |
| 10 | Dy migrime që nuk e riprodhonin bazën | `supabase/migrations` | **RREGULLUAR** |
| 11 | Variabli i munguar i Vercel-it e vriste `/admin` në heshtje | `middleware.ts` | **RREGULLUAR** |
| 12 | Transkodimi i videos i fikur → HEVC refuzohet, kufi 50 MB | `app_config` | **HAPUR — pronari** |
| 13 | Verifikimi i biznesit pa asnjë sipërfaqe | `verification_requests` | **HAPUR — i fjetur** |
| 14 | `/kategori/[slug]` CLS 0.216 | matur, i paatribuar | **HAPUR** |

---

## 1. Siguria dhe hyrja

**E verifikuar si e shëndetshme** (jo e supozuar):

- Këshilluesi i sigurisë i Supabase-it: **0 ERROR**. 127 WARN, prej të cilëve 100
  janë `authenticated_security_definer_function_executable` — të pashmangshme për
  një panel ku lejet kontrollohen brenda trupit të funksionit me `has_perm()`.
- **Të gjitha portat e sekreteve janë fail-closed edhe kur sekreti mungon:**
  `/api/expire-premium`, `/api/embed-backfill`, `/api/indexnow` (`!cronSecret ||`),
  `/api/payments/webhook` (503 `not_configured`), `/api/notify` (500). Asnjë prej
  tyre nuk e trajton "pa sekret" si "lejo".
- `middleware.ts` është fail-closed për `/admin`: pa sesion → hyrje; pa `is_admin` → `/`.
- Kufizim shpejtësie i pranishëm në rrugët e ndjeshme: AI 20/min, fshirje llogarie
  3/orë, OTP 1/45 s për email, kontakt 5/10 min.
- Funksionet e trigerit nuk thirren më nga PostgREST (u desh dy hapa — shih §4).
- MFA (AAL2) kontrollohet për adminin; PIN-i i panelit është **i çaktivizuar** me
  `app_config.admin_pin_disabled='true'`, pra `admin_pin=000000` nuk është më portë.

**Mbetet e hapur:** mbrojtja nga fjalëkalimet e komprometuara (HaveIBeenPwned) e
fikur — çelës i planit te Supabase Auth, veprim i pronarit.

## 2. Sistemi i përditësimit

**I shëndetshëm dhe i dokumentuar mirë.** Doktrina: aplikacioni **nuk ringarkon
kurrë vetveten**. `public/sw.js` është kill-switch vetëshkatërrues pa `navigate()`
(versioni i mëparshëm hynte në cikël). `UpdatePrompt` vetëm **shfaq banderolë
opt-in** duke krahasuar `NEXT_PUBLIC_BUILD_ID` me `/api/version` (edge, i lehtë —
jo `/api/health`, që pingon bazën). Me `no-store` në HTML dhe asete me hash,
freskia nuk humbet pa asnjë ringarkim automatik.

## 3. Pagesat

**Koherenca e matur:** 1 abonim aktiv, **0 abonime aktive por të skaduara**,
0 fatura që presin fiskalizim. Gjashtë cron-e aktive: skadim shpalljesh (03:20),
skadim premium (çdo 15 min), pajtim pagesash (çdo 5 min), afati i mëshirës (08:00),
rinovim automatik (çdo orë), shëndeti i pagesave (08:30).

23 funksione pagese, përfshirë nënsistemin e plotë të notave të kreditit. Bërthama
(`process_payment_event`, `_issue_credit_note`, `grant_premium`) **nuk u prek**.

**Gjetja:** shih §5 — e drejta 14-ditore.

## 4. Blloku i moderimit dhe gjurma

Zinxhiri i plotë tani punon nga fillimi në fund dhe u pa me sy: vendimi → njoftim
te pronari me arsyetim → `/moderimi/[id]` → ankim → seksioni "Ankime" te paneli,
me kufirin e konfliktit të interesit të zbatuar **në bazë**, jo në ndërfaqe.

Prova funksionale në transaksion të kthyer mbrapsht: 1 njoftim, titull i saktë,
trupi = arsyetimi, lidhja `/moderimi/<id>`, `i_shkoi_pronarit = true`, 0 mbetje.

**Mësim i ri për §1.1 të KUJTESËS:** heqja e `EXECUTE` nga `PUBLIC` mbulon vetëm
gjysmën — `authenticated` e mban shpesh si **grant të shprehur** nga
`alter default privileges` i Supabase-it. Prova është `proacl`, jo supozimi.

## 5. E drejta 14-ditore — gjetja më e rëndë

Në bazë ekzistonte një nënsistem i tërë: `my_withdrawal_right`,
`withdraw_from_subscription`, `record_withdrawal_consent`, `_issue_credit_note`,
`next_credit_note_number`, `admin_refund_invoice`, plus tri kolona te
`subscriptions`. **Zero referenca** në `app/` ose `lib/`.

Metoda që e nxori: krahasimi i **të 88 RPC-ve** të thirrshme nga `authenticated`
me çdo referencë në kod. Njëzet e një nuk thirren nga asnjë rresht.

Logjika në bazë është ligjërisht e saktë dhe anon nga konsumatori: pa pëlqim të
shprehur për nisje të menjëhershme **dhe** pa njohje të përpjesëtimit, rimbursimi
është **i plotë**. Meqë asnjë rrugë nuk e thërret `record_withdrawal_consent`,
sot çdo rimbursim del i plotë. **Nuk e ndryshova** — kapja e atij pëlqimi e ul
rimbursimin, pra është vendim tregtar i pronarit.

## 6. Ngarkimi i fotove dhe videove

Sistemi është i ndërtuar me kujdes: kontroll madhësie **para** ngarkimit (që të mos
presësh kot), zbulim i H.265/HEVC me udhëzim konkret në shqip, ngarkim i rifillueshëm
(TUS) mbi 20 MB, poster i gjeneruar.

**Gjetje e matur:** `getCloudinary()` kërkon **dy** çelësa — `cloudinary_cloud_name`
DHE `cloudinary_upload_preset`. Në bazë ka vetëm të parin; `cf_stream_customer_code`
mungon gjithashtu. Pra `transcodingEnabled()` kthen **false** në prodhim, me dy pasoja:

1. kufiri i madhësisë bie nga 100 MB në **50 MB**, ndërsa platforma premton 5 minuta
   video — një video 5-minutëshe nga telefoni e kalon këtë kufi pothuajse gjithmonë;
2. **videot HEVC refuzohen** — formati i parazgjedhur i iPhone-ve dhe i shumë
   Androidëve — dhe përdoruesit i kërkohet të ndryshojë kodekun e kamerës.

Zgjidhja është një çelës konfigurimi, jo kod: `cloudinary_upload_preset` te
`app_config`. **Nuk e shpika** — emri i preset-it vjen nga llogaria e pronarit.

## 7. Koha reale

30 tabela në publikimin `supabase_realtime`, përfshirë `messages`, `conversations`,
`notifications`, `listings`, `subscriptions`, `typing_indicators`. Faqja e faturimit
dëgjon ndryshimet e abonimit të vetë përdoruesit me filtër `user_id=eq.<id>` —
model i saktë.

## 8. Paneli i kontrollit

Të 13 tabet u hapën dhe u panë: Sot, Njerëzit, Njoftime, Referalet, Pagesat,
Abonimet, Paratë, Planet, Metodat, Radha, Konfigurime, Rolet, AI Health.
**Zero shenja dëmtimi** (`NaN`, `undefined`, `[object Object]`, `Invalid Date`)
pas rregullimeve.

Rregulluar në këtë kalim: `NaN` te "Me plan aktiv", `−0` te "Rimbursuar", fundi
publik i faqes dhe asistenti Albi që rrinin brenda panelit, kontrolli i gjuhës që
mungonte brenda panelit.

## 9. Gabimet e mia në këtë ditë — të gjitha

Një autopsi që nuk i numëron gabimet e autorit nuk është autopsi.

1. **Google Fonts.** Më 30 gusht raportova se ishte "vetëm një leje e vdekur në CSP"
   dhe hoqa lejen. Ishte transferim i vërtetë në çdo faqe, nga një `@import` që nuk
   e kisha kërkuar — dhe heqja e lejes e prishi logotipin. Korrigjuar dhe vetëstrehuar.
2. **"Rrjedha e rimbursimit mbetet vendim i pronarit."** Ishte e pasaktë: rrjedha
   ekzistonte e plotë në bazë. Nuk e kisha kërkuar.
3. **Migrimi bosh** që shkrova vetë — vetëm komente, pa DDL.
4. **Skeletoni.** Harmonizova gjeometrinë e tij duke pritur rënie të CLS-së; matja
   dha 0.206 → 0.207. E mbajta ndryshimin sepse është i saktë, por e thashë që nuk
   ishte ai shkaku.
5. Pesë here isha gati të raportoja defekte që nuk ekzistonin — modeli Groq (tashmë
   i rregulluar), `referral_reward_all='00'` (faqja premton pikë, jo para),
   `/kategori/automjete` 404 (mangësi e dyfishit tim), `Invalid Date` te faturimi
   dhe çmimet `0,00 L` (çelësa të gabuar në dyfish). Të gjitha u verifikuan para se
   të flisja.

## 10. Çfarë mbetet për pronarin

| Çështja | Veprimi |
|---|---|
| Variablat e Vercel-it | Hap `/api/health` — seksioni `checks.env` thotë saktësisht çfarë mungon |
| Transkodimi i videos | Shto `cloudinary_upload_preset` te `app_config` |
| Kontratat SCC/DPA | Cloudinary, Resend, Groq, Anthropic, Perplexity, Google Translate |
| DPO | Neni 33/1/c — ka gjasa i detyrueshëm |
| NIPT | I përjashtuar shprehimisht nga urdhri |
| Mbrojtja nga fjalëkalime të komprometuara | Supabase → Auth → ndize |
| Kontakti i sigurisë | `/siguria` publikon një Gmail personal |
| Pëlqimi i nenit 37/8 | Vendim tregtar: a kapet gjatë blerjes apo jo |

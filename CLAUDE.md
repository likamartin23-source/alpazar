# ALPAZAR — KUJTESA E PROJEKTIT

> Lexoje kete para se te prekesh gje. Cdo rregull ketu vjen nga nje ligj konkret
> ose nga nje gabim i bere njehere.

---

## 0. Rregulli i pare

**Mos shkruaj asnje rresht pa lexuar gjendjen reale.**

### 0-bis. NJE MIGRIM NE PRODHIM DHE KODI QE E SHOQERON NISEN BASHKE

Kur kodi rri ne nje dege TE PABASHKUAR, i vetmi migrim i lejuar eshte **ADITIV**
(tabela, kolona, funksione te reja). **Cdo HEQJE te drejtash — `revoke`, politike
me e ngushte, bucket qe behet privat — duhet te presi deploy-in.**

Matur me kosto me 1 shtator 2026: migrimi `privatesia_e_kontaktit` hoqi SELECT-in
e 16 kolonave te `profiles` ne bazen e PRODHIMIT, ndersa kodi qe e mbeshtet rrinte
ne nje dege 47 commit-e para `main`. Prodhimi xhiron `main`. U prishen gjashte
rruge te gjalla njekohesisht: faqja e profilit (`select('*')`), paneli i adminit
(qe ridrejtonte te `/` — pronari mbetej jashte), i tere thread-i i mesazheve,
butonat WhatsApp/Viber, dhe faqja GDPR.

Nuk e kapi asnje porte: tsc, testet dhe build-i shohin KODIN E DEGES, kurre
ndeshjen midis bazes se prodhimit dhe kodit te `main`-it.

**Kontrolli i detyrueshem para cdo `revoke`/ngushtimi:**
`git show origin/main:<skedari>` per cdo vend qe prek — a e perdor kodi LIVE ate
qe po heq? Nese po: shkruaje migrimin, LERE TE PA-APLIKUAR me nje koke te dukshme
qe e thote pse, dhe zbatoje pas deploy-it. Dy shembuj ne repo:
`20260901_profiles_ngushtimi_pas_deploy.sql` dhe
`20260901_bashkengjitjet_private.sql`.

**Fshesa e kontrollit duhet te perfshije RRENJEN e depos, jo vetem `app/lib/`.**
Matur me 1 shtator 2026: pas aplikimit te `profiles_ngushtimi_pas_deploy`, `/admin`
u be i paarritshem sepse `middleware.ts` (ne rrenje) lexonte `profiles.is_admin`
me rolin `authenticated` — pikerisht kolona qe migrimi hoqi. Auditi §0-bis kishte
kontrolluar vetem `app/*`, `lib/*`, `components/*` dhe e humbi `middleware.ts`.
Prandaj fshesa e `git show origin/main:<skedari>` duhet te mbuloje edhe
`middleware.ts`, `instrumentation.ts`, `next.config.js` dhe `app/api/**`.
Rregullimi i sakte per lexime privilegji ne kod: RPC SECURITY DEFINER
(`is_admin()`, `my_profile()`) — kurre `grant select` mbi kolonen kur RLS eshte
`public_read` (do te rihapte §4.6-bis).

Baza ka **190+ migrime** dhe eshte e mirendertuar. Ne gusht 2026 u ndertuan gjashte
migrime dhe dhjete komponente mbi supozime; kur u lexua baza reale, **cdo gje e
ndertuar ekzistonte tashme**:

| U ndertua kot | Ekzistonte |
|---|---|
| `admin_members` | `profiles.admin_role` + `has_perm()` + `perm_matrix()` (16 leje, 6 role) |
| `admin_audit_log` | `audit_logs` (RLS `no_insert`/`no_delete`) |
| `moderation_cases` | `moderation_queue` (`type`/`ref_type`/`ref_id`) |
| `listing_reports` | `reports` + `takedown_requests` + trigera lidhes |
| `trader_profiles` | `businesses` + `verification_requests` |

Puna e vlefshme ketu eshte **auditim dhe konsolidim**, jo ndertim.

---

## 1. Kurthe teknike te verifikuara

1. **`revoke ... from anon` nuk ka efekt** kur e drejta vjen nga `PUBLIC`.
   Gjithmone: `revoke ... from public` → pastaj `grant` shprehimisht.
   Verifiko me `has_function_privilege('anon', oid, 'EXECUTE')`, jo me sy.
   **Por kjo mbulon vetem gjysmen** (matur 31 gusht 2026): `authenticated` e
   mban shpesh te drejten si GRANT TE SHPREHUR, nga `alter default privileges`
   i Supabase-it, ndaj heqja nga PUBLIC nuk e prek. Duhen te dyja, dhe prova
   eshte `proacl` — modeli i pastër eshte `{postgres=X, service_role=X}`.
   **Funksionet e trigerit (`returns trigger`) nuk duhen kurre te thirrshme nga
   PostgREST.** Heqja e EXECUTE nuk i prish: Postgres-i e kontrollon EXECUTE ne
   krijimin e trigerit, jo ne ndezje (provuar ne transaksion te kthyer mbrapsht).
2. **`has_perm()` dhe `is_admin()` nuk u hiqet kurre EXECUTE** nga `anon`/
   `authenticated` — thirren brenda politikave RLS; heqja rrezon aplikacionin.
3. **`audit()` nuk ekziston.** Gjurma shkruhet me `admin_log()` → `admin_logs`.
4. **`admin_log()` humbet ne heshtje nga cdo rruge e automatizuar.**
   `admin_logs.admin_id` eshte NOT NULL, ndersa `admin_log()` fut `auth.uid()`
   — qe nga nje cron ose skript me `service_role` eshte NULL. Shkelja kapet nga
   `exception when others then null`, ndaj thirrja duket se punon dhe nuk shkruan
   asgje. Matur me 19 gusht 2026: `expire_listings_run()` caktivizoi nje shpallje
   ne 03:20 dhe `admin_logs` mbeti bosh.
   Per gjurme qe duhet te mbijetoje pa perdorues, perdor `audit_logs`
   (`actor_id` e lejon NULL).
5. **`current_user` brenda `SECURITY DEFINER` eshte PRONARI, jo thirresi.**
   Per rolin e vertete perdor `auth.role()`; `session_user` nuk vlen sepse
   PostgREST lidhet si `authenticator` dhe ben `SET ROLE`.
   **PASOJE E MATUR (31 gusht 2026):** kjo do te thote qe NJE TRIGER nuk e
   dallon dot "shkrim i drejtperdrejte i klientit" nga "shkrim permes nje
   funksioni te besuar" — brenda trigerit `current_user` eshte gjithmone
   `postgres`, dhe `current_setting('role')` mbetet `authenticated` edhe
   brenda nje DEFINER-i te thirrur nga i njejti kerkese. Nje roje e ndertuar
   mbi kete kusht nuk ndizet KURRE. Instrumenti i sakte jane **TE DREJTAT E
   KOLONAVE**: klienti kontrollohet me te drejtat e `authenticated`, ndersa
   brenda DEFINER-it vlejne te drejtat e pronarit — pra rruget legjitime
   punojne pa asnje ndryshim kodi.
   **Dhe kujdes:** heqja e nje kolone nuk ka efekt kur roli e ka te drejten
   TABELARE (`arwdDxtm`, nga `alter default privileges` i Supabase-it) — i
   njejti kurth si §1.1. Duhet `revoke update on <tabela>` pastaj
   `grant update (kolonat)`.
6. **`UPDATE OF kolona` ndizet edhe kur vlera nuk ndryshon** — mjafton qe kolona
   te permendet te `SET`. Krahaso `OLD`/`NEW` brenda trigerit.
7. **`listings` shkruhet ne cdo hapje faqeje** (`increment_listing_views` rrit
   `views_count`). Cdo triger i pakufizuar mbi kete tabele prodhon nje rresht per
   cdo shikim.

---

## 2. Rregullat e pandryshueshme

1. **Fshehja automatike nuk eshte kurre heqje.** Vendimi me pasoja te renda
   kerkon njeri — neni 20, ligji 124/2024. Sanksioni deri 2 mld leke ose 4%.
2. **Asnje vendim pa arsyetim faktik.** Ai mban vendimin ne rast ankimi.
3. **Fshirja e llogarise e bute, 30 dite** — neni 20/3, ligji 10128.
   **E ZBATUAR 2 shtator 2026:** `request_account_deletion()` shenon afatin 30-ditor dhe
   fsheh shpalljet (snapshot per rikthim); `cancel_account_deletion()` e anulon brenda 30
   diteve (rikthen shpalljet); `my_deletion_status()` + `RikthimiFshirjes` (banderole globale)
   e bejne rikthimin aq te lehte sa kerkesen; `purge_deleted_accounts_run()` + cron
   `alpazar_purge_deleted` (03:40) e fshin perfundimisht pas 30 ditesh (auth.users → profiles
   cascade). UI-ja (`/profile`) therret RPC-ne e bute, jo me fshirjen e forte. Edge function
   `delete-account` u ridrejtua te fshirja e bute (s'ka me anashkalim te forte). Migrimi:
   `20260902_fshirja_e_bute_30_ditore.sql`.
4. **Ankesen nuk e shqyrton kush mori vendimin e pare.**
5. **Rastet kritike:** miratim i dyte + njoftim autoriteti — neni 20/2,
   ligji 10128; mosnjoftimi 200 000 leke (neni 22/1/ç).
6. **`audit_logs` mbetet i pandryshueshem** — vlere provuese, nenet 6 dhe 12,
   ligji 10273/2010.
7. **`app_config` lexohet PUBLIKISHT.** Kurre sekrete aty — e ruan trigeri
   `tg_app_config_no_secrets`. Sekretet te `admin_settings` (RLS `config.write`).
8. **Afatet:** prioriteti 5 → 1 ore, 4 → 24 ore, 3 → 72 ore, 2 → 7 dite.
   Tavane te vetevendosura; ligji thote “menjehere” (neni 17/1/b).
9. **Asnje cmim a kufi i ngurtesuar ne kod** — `app_config` ose `premium_plans`.
10. **Masat ndaj permbajtjes lindin nga nje rast dhe prodhojne arsyetim.**
    Kurre nga nje liste me nje klikim.

---

## 3. Zinxhiri i fatures

**Leshim → radhe tatimore → DPT → NIVF/NSLF → inbox.**

| Hapi | Funksioni |
|---|---|
| Leshohet fatura | trigeri `tg_invoice_needs_fiscalization` → `pending`, afat **48 ore** (neni 29) |
| Transmetim | `fiscalize_invoice()` |
| Pergjigjja e DPT | `fiscal_record_result()` → NIVF, NSLF, QR, `file_kind='fiscal'` |
| Riprovim | `fiscal_retry_run()` brenda 48 oreve |
| Dergim | `admin_send_invoice()` — **refuzon faturen e pafiskalizuar** |

Ndezja kerkon: NIPT te regjistruar + certifikate AKSHI + llogari te ofruesi
(**easyInvoice, 10 000 L/vit**, i certifikuar DPT/AKSHI) → pastaj
`app_config.fiscal_enabled = 'true'`.
Deri atehere `fiscal_status='not_required'` dhe asgje nuk prishet.

---

## 4. Shkeljet ligjore aktive

1. Cmimi shprehet **vetem ne leke** — neni 9/4, ligji 9902/2008.
   **Rimatur 31 gusht 2026:** cmimet e VETE Alpazar-it (`premium_plans`) tashme
   shfaqen ne leke si cmim kryesor (`price_all` me te trashe), me euron si rresht
   dytesor — kjo eshte e ligjshme. Mbetet e hapur vetem monedha e zgjedhur nga
   shitesi per shpalljen e vet (opsioni EUR te `/listing/new`), qe kerkon nje
   vendim per kursin e kembimit — burimi duhet `app_config`, kurre i ngurtesuar.
2. ~~**E drejta 14-ditore e heqjes dore** nga Premium — nenet 37/1–37/8.~~
   **E DEKLARUAR 31 gusht 2026:** `/kushtet` §6-a e thote saktesisht (afati, si
   behet, kthimi pro-rata, perjashtimi i nenit 37/8) dhe shprehimisht qe kushtet
   nuk e kufizojne dot. §6 nuk e paraqet me si mireservi.
   **KORRIGJIM I TE NJEJTES DITE:** shkrimi im se "rrjedha operative mbetet vendim
   i pronarit" ishte i pasakte. Ajo ekzistonte E PLOTE ne baze —
   `my_withdrawal_right`, `withdraw_from_subscription`, `record_withdrawal_consent`,
   `_issue_credit_note`, `next_credit_note_number`, `admin_refund_invoice` — dhe
   asnje rresht i nderfaqes nuk e prekte. Tani `/billing` e lexon dhe e ushtron.
   Pa `record_withdrawal_consent` (qe asnje rruge nuk e therret) rimbursimi del
   GJITHMONE i plote — qendrimi me i sigurt ligjerisht. Kapja e atij pelqimi gjate
   blerjes eshte vendim tregtar i pronarit.
3. **Etiketa “E promovuar”** te VIP Boost — neni 17/A.11 + neni 8, ligji 10128.
4. **Transferim nderkombetar pa instrument** — nenet 26, 39–42, ligji 124/2024.
   Sidomos `gtranslate()` te `app/api/ai/context.ts`, qe dergon tekst te Google.
   **KORRIGJIM (31 gusht 2026):** me 30 gusht raportova gabimisht se Google Fonts
   ishte "vetem nje leje e vdekur ne CSP" — perfundim i nxjerre nga nje kontroll
   i pjesshem. Rreshti i pare i `app/ui-refine.css` (skedar qe `layout.tsx` e
   ngarkon ne CDO faqe) kishte `@import url(fonts.googleapis.com…)` per Fraunces.
   Ishte transferim i vertete ne cdo hapje faqeje. **I zgjidhur:** fonti u
   vetestreh te `/public/fonts/fraunces-600-*.woff2` (OFL 1.1 bashkelidhur).
   Matur pas: 0 kerkesa drejt fonts.googleapis.com/gstatic.com, 0 gabime CSP.
5. ~~Mungon regjistri i veprimtarive (neni 27) dhe procedura 72-oreshe e cenimit
   (neni 29), ligji 124/2024.~~ **TE HARTUARA 31 gusht 2026:**
   `docs/REGJISTRI-I-PERPUNIMIT.md` dhe `docs/PROCEDURA-CENIMI-72-ORE.md`.
   Fakt i ri i matur qe ndryshon peshen e §4.4: ruajtja kryesore eshte
   **brenda BE-se** — Supabase `eu-west-1` (Irlande), Sentry Gjermani, Brevo
   France. Transferimet pa instrument mbeten: Cloudinary, Resend, Groq,
   Anthropic, Perplexity dhe — me i rendi — `gtranslate()` te
   `app/api/ai/context.ts`, qe dergon tekst te lire te perdoruesit te Google.
   Fushat qe kerkojne vendim te pronarit jane shenuar `[PLOTESO]`.
6. DPO ka gjasa i detyrueshem — neni 33/1/c (te dhena penale ne shkalle te gjere).
6-bis. ~~Cdo anetar i kycur lexonte telefonin, vitin e lindjes, arsyen e
   pezullimit dhe rolin e adminit te KUJTDO.~~ **I MBYLLUR 1 shtator 2026.**
   Vrima nuk ishte handoff-i WhatsApp/Viber — ishte AUTOMATIZMI: `/messages` e
   merrte numrin pas nje bisede reale, ndersa `/listing/[id]` e merrte NE
   NGARKIM TE FAQES, pra nje llogari plus nje skript i nxirrte te gjithe. Tani
   numri vjen nga `listing_contact()` / `conversation_contact()` — veprim i
   shprehur, i kufizuar (`contact_reveals_per_hour`) dhe i regjistruar
   (`contact_reveal_log` + metrika `contact_phone`). Butonat varen nga kolona e
   gjeneruar `has_phone`, jo-identifikuese. `authenticated` tani pasqyron
   `anon`: 16 kolona pa qellim nder-perdorues jane te mbyllura, dhe leximi i
   vetes behet me `my_profile()`.
7. **NIPT-i “(ne regjistrim)”** — neni 7, ligji 10128.
8. Mekanizmi i pelqimit per cookie — neni 123/6, ligji 9918/2008.
9. ~~**Arsyetimi i vendimit nuk i dergohet perdoruesit** dhe **nuk ka rruge ankimi**.~~
   **I MBYLLUR 31 gusht 2026.** Zinxhiri i plote: trigeri
   `tg_moderation_notify_owner` → njoftim te PRONARI me arsyetimin faktik dhe
   lidhjen `/moderimi/<queue_id>` → faqja `app/moderimi/[id]` (lexon me
   `my_moderation_case()`, sepse RLS e `moderation_queue` eshte vetem-admin) →
   `submit_appeal()` → seksioni "Ankime" te `QueueTab`. Kufiri i §2.4 zbatohet
   ne BAZE (`admin_resolve_appeal` refuzon me `konflikt_interesi` kur
   `moderation_queue.resolved_by = auth.uid()`), jo ne nderfaqe.

---

## 5. Infrastruktura

- **Politika e daljes eshte LISTE HOSTESH, jo bllokim i pergjithshem** (matur
  31 gusht 2026): `fonts.googleapis.com`, `fonts.gstatic.com`, `github.com`,
  `raw.githubusercontent.com` **kalojne**; `alpazar.vercel.app` dhe
  `*.supabase.co` japin **403 ne CONNECT**. Prandaj puna me rrjetin qe deshton
  ketu nuk do te thote qe deshton ne prodhim. `/api/health` e emerton sakte
  shkakun: "Host not in allowlist: sopafwfkrxpcdaljddoh.supabase.co. Add this
  host to your network egress settings." Kjo eshte pikerisht ajo qe duhet hapur
  qe agjenti te beje verifikim live me sy (Rregulli 11).
- **`/api/health` raporton edhe variablat e mjedisit** (`checks.env`) — vetem
  praninë, kurre vleren. Pese kritike, dymbedhjete te vecorive. Kjo eshte rruga
  e vetme qe ka pronari per te pare cfare i mungon te Vercel.
- **Autopsia e autopsive:** `docs/AUTOPSIA-E-AUTOPSIVE.md` — pse cdo kalim
  zbuloi nje klase te re defektesh, dhe cilat ishin kater verberite sistematike.
- **Regjistri i autopsive:** `docs/MEGAAUTOPSIA-2026-08-31.md` — kater kalime,
  cdo gjetje me maten dhe me mjetin, perfshire gabimet e mia.
  `docs/MEGAAUTOPSIA-2026-08-31-B.md` — kalimi i shtate: prova e shkrimit (tete
  kolona te falsifikueshme, tani te mbyllura), fshesa e leximit nder-perdorues
  mbi te 68 tabelat, `npm audit`, axe-core dhe CLS ne 10 rruge × 2 pamje.
- **Ekranet e autentikuara SHIHEN me nje dyfish lokal** — `docs/VERIFIKIMI-VIZUAL.md`.
  Aplikacioni drejtohet me `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
  te nje server dyfish; pa DNS, pa certifikata, pa anashkalim politike.
  DY KURTHE: (a) cookie-t e sesionit vendosen te ENA (`addCookies`), sepse
  `addInitScript` nisret pas navigimit dhe kerkesa e pare shkon pa cookie →
  middleware-i fail-closed ridrejton; (b) `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  duhet vendosur — `lib/supabase.ts` ka vlere rezerve, POR
  `createMiddlewareClient()` e lexon nga mjedisi dhe **hedh perjashtim** kur
  mungon, pra `/admin` nuk hapet kurre pa asnje diagnoze.
- **Supabase** `sopafwfkrxpcdaljddoh` — PG 17.6, rajoni **eu-west-1 (BE)**.
- **Vercel:** vetem `alpazar` (`prj_KNCEtuUDGNCA6ulHomdKniNAZEuX`) eshte real.
  Tre projekte jane lidhur me te njejten depo dhe marrin cdo push (vendosje me
  te njejtin SHA brenda 128 ms). Gjashte te tjeret jane per fshirje.
- **Depoja eshte PUBLIKE.** Kaloje ne private dhe rrotullo celesat e
  `admin_settings` (`anthropic_api_key`, `brevo_api_key`, `resend_api_key`,
  `sms_gateway_password`, `moderation_secret`, `embed_cron_secret`).
- **`admin_pin = 000000`.**
- Mjete te lidhura e te papërdorura: **Sentry** (org `alpazar`, bosh — ke
  `health_events` shtepiak paralel; zgjidh njerin), **Cloudflare**, **Semrush**.
- **Brevo:** plan falas, **300 email/dite**. Ne volum, email-et ligjore humbasin
  bashke me marketingun — duhet radhe me prioritet.
- **Cloudinary:** Free, video max 100 MB. **Matur 31 gusht 2026:** transkodimi
  eshte FIKUR ne prodhim — `getCloudinary()` kerkon `cloudinary_cloud_name` DHE
  `cloudinary_upload_preset`; i dyti mungon, dhe `cf_stream_customer_code`
  gjithashtu. Pasoja: kufiri bie ne **50 MB** ndersa premtohen 5 minuta, dhe
  **videot HEVC refuzohen** — formati i parazgjedhur i iPhone-it. Zgjidhja eshte
  nje celes konfigurimi, jo kod.

---

## 6. Si punohet

- **Shqip gjithmone** — kod, komente, nderfaqe, dokumente.
- **Lexo bazen para se te shkruash.** Kerko tabelen ekzistuese perpara se te krijosh.
- **Verifiko empirikisht:** fut prove, mat, pastro. Mos raporto asgje qe nuk e ke matur.
- **Nje ekran per nje pyetje te operatorit.** Nese dy ekrane i pergjigjen te njejtes
  pyetje, ato jane nje ekran.
- **Cdo veprim shkaterrues me arsye te detyrueshme dhe gjurme.**
- **Mos e zgjidh me kod ate qe zgjidhet me konfigurim.**
- **Kur nje mjet te thote "ne rregull", pyet cfare mat SAKTESISHT.** Zakonisht
  mat dicka me te ngushte nga ajo qe po pyet ti. Kater verberi te matura me 31
  gusht 2026, te gjitha i njejti gabim — besimi i nje abstraksioni ne vend te
  matjes se gjese vete:
  · keshilluesi i Supabase-it mat nese RLS eshte NDEZUR, jo kushtin e politikes —
    tri politika `using (true)` ekspozonin gjurme sjelljeje;
  · Playwright-i nis ne desktop nese s'i thua ndryshe — telefoni, ku eshte
    perdoruesi shqiptar, nuk u pa per kater kalime;
  · `npm audit` zgjat tre sekonda dhe nuk u ekzekutua kurre — 10 cenueshmeri,
    nje kritike;
  · auditimi shtrese-per-shtrese nuk e sheh dot VIJEN midis tyre — dy te drejta
    ligjore ishin te ndertuara ne baze dhe te paprekura nga kodi.
  **Nje auditim matet me numrin e INSTRUMENTEVE te ndryshem qe ke vene ne pune,
  jo me kohen.** Klasat e detyrueshme: shfletues (desktop DHE telefon) · konsole
  e rrjet · axe-core · performance nen ngadalesim · `npm audit` · LOGJIKA e RLS-se
  · vija DB↔kod · **prove SHKRIMI**.
  Prova e shkrimit u be me 31 gusht 2026 dhe nxori tete kolona te
  falsifikueshme nga vete perdoruesi — mes tyre `is_boost_active` (vecori e
  paguar) dhe `moderation_status='approved'` (vetemiratim). Menyra: vish rolin
  me `set local role authenticated` + `set_config('request.jwt.claims', …)`,
  shkruaj, mat, pastaj `raise exception` qe transaksioni te kthehet. Bej
  GJITHMONE edhe kontrollin negativ — kolonat qe DUHET te bllokohen — perndryshe
  s'e di nese porta ekziston apo thjesht s'e provove dot.
- **Nje tabele me politika nuk do te thote vecori e gjalle.** Matur me 31 gusht
  2026: nga 69 tabelat, TRE sisteme kane DY zbatime — nje model i pasur ne baze
  qe s'e prek asnje rresht kodi, dhe nje zbatim me i thjeshte qe eshte ai real:
  `conversations` kunder `messages` te grupuar ne klient · `badges`/`user_badges`
  (10 rreshta te mbjella) kunder `buildBadges(profile)` · `referrals`/
  `referral_rewards` kunder `profiles.referred_by`. Dhe nente tabela te tjera
  kane politika te plota pa asnje nderfaqe (`posts`, `offers`, `orders`,
  `disputes`, `listing_comments`, `push_tokens`, `verification_requests`…).
  PASOJE E MATUR: `messages.conversation_id` nuk shkruhet kurre, ndaj
  `typing_indicators` dhe `message_reactions` — qe varen prej tij — nuk mund te
  punojne KURRE. Shih `docs/AUDITI-I-SISTEMEVE.md`.
- **Perpara se te ndertosh dicka, kerko a EKZISTON ne baze.** Rregulli i pare i
  kesaj kujtese e thote per tabelat; me 31 gusht 2026 u mat se vlen njesoj per
  FUNKSIONET. Krahasimi i te 88 RPC-ve te thirrshme nga `authenticated` me cdo
  reference ne `app/` dhe `lib/` nxori 21 qe nuk i therret asnje rresht — mes tyre
  e drejta 14-ditore e heqjes dore dhe eksporti i plote i te dhenave, te dyja te
  ndertuara, te sakta dhe te paarritshme per perdoruesin. Bej kete PARA se te
  shkruash nje vecori te re, dhe periodikisht si auditim.

### Higjiena e matjes (mesuar me 31 gusht 2026, me kosto)

- **Kurre mos e nis `next build` nderkohe qe `next dev` sherben** nga i njejti
  `.next`. Build-i e zevendeson direktorine nen kembet e dev-serverit; cdo faqe
  fillon te kthejë 404 per `_next/static/*` me MIME `text/plain`. Nje fshese e
  plote raportoi "0/37 rruge te pastra" — te 37 ishin artefakt. Nese duhen te dyja:
  ndal dev-in, `rm -rf .next`, build, pastaj rinis dev-in.
- **Nje CTE qe modifikon te dhena nuk duket nga pjeset e tjera te te NJEJTIT
  deklarim** (i njejti snapshot). Nje prove trigeri e shkruar si nje `with … select`
  kthen bosh edhe kur trigeri ka punuar. Ndaje ne hapa brenda nje bllloku `do $$`,
  dhe nxirre matjen me `raise exception 'MATJA=%'` qe transaksioni te kthehet.
- **Chromium-i i ketij kontejneri ka ICU te cunguar:** `Intl` nuk e njeh `sq-AL`
  dhe daton anglisht. Node-i e njeh (`29 gush 2026`). Pra data ne shqip qe duket
  "e prishur" ne nje screenshot ketu **nuk eshte defekt** — eshte instrumenti.
- **Nje detektues "komponente pa reference" qe nuk kupton `dynamic(() => import(…))`
  jep 100% pozitive te rreme.** Te 7 "te pareferencuarit" ishin te gjalle.
- **Nje dyfish qe nuk riprodhon filtrat e vertete prodhon defekte te rreme.**
  Te dhenat prove pa `is_active` bene qe `/kategori/automjete` te jepte 404 —
  duket defekt i rende, eshte mangesi e dyfishit. Kontrollo skemen reale para
  se te raportosh.
- **`count` i supabase-js vjen nga `content-range`; kur ai mungon jep NaN.**
  `count !== null` dhe `count ?? 0` NUK e kapin. Perdor `Number.isFinite`.
  I njejti gabim ne familje: `??` nuk e kap NaN-in (NaN s'eshte null).
- **`layout-shift` i emerton elementet e ZHVENDOSUR, jo shkaktarin.** Matur me
  31 gusht 2026: te `/listing` raportoheshin textarea dhe butoni i bllokut te
  ofertes; ata ishin viktimat — rritja vinte nga folea e `MapDisplay` mbi ta
  (nje `<template>` 0px deri ~900ms, pastaj DIV 235px). Nje vend-mbajtes i
  vendosur mbi elementin e raportuar e mbulon simptomen dhe e fsheh shkakun.
  Ndiq zinxhirin lart, dhe jepi cdo `dynamic(..., {ssr:false})` nje `loading`
  me lartesi TE MATUR.
- **Nje dyfish qe s'eshte ndezur eshte me i keq se asnje.** Po ate dite, nje
  fshese raportoi 18–25 gabime konsole per rruge; ishin te gjitha
  `ERR_TUNNEL_CONNECTION_FAILED` sepse `next dev` ishte rinisur PA
  `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`. Perpara se te raportosh
  gabime rrjeti, verifiko ku po flet aplikacioni.
- **axe-core mat DOM-in ne castin qe e therret.** Nje shkelje kontrasti me
  ngjyra te PERZIERA (p.sh. `#d5b55d` mbi `#635e5d` kur CSS-ja thote
  `#111`/`#F5C842`) do te thote qe matja ra ne mes te nje animacioni fade.
  Prit derisa animacionet te qetesohen, perndryshe raporton pozitiva te rreme.
- **Mos shpik URL prove.** `/kategori/makina` jep 404 sepse slug-u eshte
  `automjete`; kategori te sakta: arsim, automjete, biznese, elektronike, gaming,
  kafshë, mobilje, prona, pune, shendet, sherbime, sport, te-tjera, turizem,
  ushqim, veshje.

---

## 7. Skills — gjeji perpara se te nisesh

Repoja ka **110 skills** te `.claude/skills/`. Nje skill qe nuk gjendet eshte
nje skill qe nuk ekziston: perputhja me pershkrim vetvetiu deshton pikerisht
kur je i perqendruar te detyra.

1. **Ne fillim te cdo sesioni pune** — cdo nderveprim ku do te perdoresh mjete
   dhe do te prodhosh dicka — thirr **`task-observer`** para se te nisesh.
   Ai kap friksionin dhe mesimet gjate punes; te thirrur ne fund, ato humbasin.
2. **Perpara se te shkruash kod** shiko indeksin qe printon
   `.claude/hooks/session-start.sh` dhe pyet: a e mbulon nje skill kete detyre?
   Nese po, thirre. Nese jo, vazhdo — mos e detyro nje skill qe nuk pershtatet.
3. **Kur ngarkon nje skill**, kontrollo regjistrin e vezhgimeve per shenime
   OPEN te lidhura me te dhe zbatoji, edhe nese skedari i skillit nuk eshte
   perditesuar ende.
4. **Mos e lidh aktivizimin permes nje skilli tjeter.** Ngarkoji nga
   konfigurimi, te pavarur: nje zinxhir i keputur i heshton te gjithe.

Aktivizimi eshte i lidhur ne dy vende, jo ne nje: kjo pjese e CLAUDE.md dhe
hook-u `SessionStart` te `.claude/settings.json`. I pari mbijeton kompaktimin
e kontekstit, i dyti e printon listen edhe kur CLAUDE.md nuk lexohet.

---

## 8. RREGULLORJA E PUNES

> Urdheruar nga Martinel. Zbatohet ne cdo nderhyrje, pa perjashtim. Asnje hap
> nuk kapercehet. Regjistruar ketu perhere me 19 gusht 2026; burimi eshte faqja
> e Notion-it "EKZEKUTIM: Harmonizimi i Identitetit".

### Tete fazat

1. **Verifikim dhe audit live — kod dhe sy paralelisht.** Asnje pohim pa prove.
   Kodi lexohet nga burimi live (`origin/main`, jo kujtesa) dhe faqja shihet me
   sy ne shfletues. Nese s'perputhen, e verteta eshte ajo qe sheh perdoruesi.
2. **Memorizim i cdo aspekti dhe levizjeje.** Cdo gjetje, hash, commit, gabim
   shkruhet. Gabimi i memorizuar nuk perseritet.
3. **Mendim sistematik dhe logjik.** Shkaku i vertete, jo simptoma. Nje shkak
   shpjegon disa ankesa. Asnje veprim kontradiktor me nje te meparshem.
4. **Kerkim dhe analize shkencore.** Burime zyrtare te cituara. Hipoteze →
   prove → perfundim. Asnje "besoj se".
5. **Plan shkencor i permiresimit.** Para cdo prekjeje: plan i shkruar qe
   parashikon cdo detaj, modalitet, rrezik dhe rrugen e kthimit.
6. **Implementim me precizion absolut.** Ndryshimet verifikohen lokalisht para
   dergimit; hash-i krahasohet. Zero tolerance ndaj gabimit.
7. **Testim dhe verifikim live i nderhyrjes.** Pas cdo nderhyrjeje: versioni =
   commit-i i ri, kontrollet kaluan, ekrani provohet realisht.
8. **Kerkim dhe perdorim i mjeteve me efikase.** Para punes manuale, kerkohet
   mjet i specializuar dhe perdoret me efikasitet.

### Rregullat 9–15

9. **Te gjithe elementet njekohesisht.** Cdo vendim peshon njekohesisht ligjin e
   plote (konsumatori, tregtia elektronike, fiskalizimi, te dhenat personale,
   pronesia industriale, pergjegjesia e ndermjetesit), teken, dizajnin (i bukur,
   jo "funksional"), standardet premium, marketingun, besueshmerine,
   funksionalitetin, performancen. Nje zgjidhje qe kenaq njerin dhe demton
   tjetrin s'eshte zgjidhje.
10. **Permbush urdhrat ne detaje; mos u shmang.** Dy perjashtime, secili me
    shpjegim: (a) kushtet teknike s'e lejojne; (b) urdhri shkakton dem.
    **Kufiri fiskal:** ndertohet GATI per konformitet (NIPT, fiskalizim, pagesa
    ligjore); KURRE vecori per shmangie takse.
11. **Verifikim live si perdorues i pari — pastaj kodi, pastaj te tjera.**
    Rendi i detyruar: **sy live → kod (`origin/main`) → tjeter.** Skede e re ne
    shfletues.
12. **Historiku dhe sistematika.** Para cdo veprimi shihet historiku; puna
    organizohet ne sistem; asnje veprim i rastesishem.
13. **Audit, autopsi, verifikim, testim i vazhdueshem.** Autopsi e shkakut,
    prove, test live para dhe pas. Asgje s'quhet e mbaruar pa u audituar.
14. **Vendimi SUPERPOWER — mendje paralele.** Cdo vendim kombinon njekohesisht
    mendim te thelle, shkencen, mjetet e specializuara, informacionin real live,
    logjiken, rregullat 1–13, punen sistematike. Asnje vendim nga nje burim i
    vetem.
15. **Gjuha shqipe dhe informacion i duhur.** Pergjigju gjithmone shqip; jep
    vetem informacion te sakte, te plote, te nevojshem — pa tepri.
16. **Kontroll autonom me gjykimin me te mire.** Kur pronari eshte larg ose jep
    akses te plote, merr kontrollin dhe procedo pa pritur aprovim — duke zgjedhur
    çdo here vendimin me te zgjuar, me te mire, me te bukur, me me shume benefite,
    qe nuk krijon probleme dhe ka avantazhet me te medha. Cdo faze mbetet CI-green
    (tsc + teste + build) dhe verifikohet para landing-ut; gabimi kap portat, jo
    perdoruesin. (Urdheruar 19 gusht 2026.)
    - **Verifikimi vizual "me sy" nga sesioni i larguar:** dalja te
      `alpazar.vercel.app`/`*.supabase.co` eshte 403 nga politika e mjedisit, POR
      `localhost` lejohet. Metoda: `next dev` lokal + Chromium lokal
      (`/opt/pw-browsers/chromium`, lidhur te `/opt/google/chrome/chrome` nga
      hook-u) → nje rruge harness (`app/verifikim-vizual`, e pakomituar) qe
      render-on komponentet reale me te dhena perfaqesuese → screenshot → shihet
      realisht. Kjo verifikon komponentet (Avatar, ListingCard, TrustBadge…);
      faqet e plota me te dhena kerkojne qe pronari te hape politiken e rrjetit.

**ZBATIM KUMULATIV:** rregullat 1–13 zbatohen NJEKOHESISHT ne cdo veprim.

### Denoncimet

I ben vete admini. Sistemi i jep adminit akses per te verifikuar proven e plote
e te pandryshuar, per ta administruar, per ta shkarkuar (dosje e printueshme).
Sistemi nuk merr vendime ligjore — siguron qe prova te mos humbase.

### Paralajmerim sigurie

Celesa ose token-a te ngjitur ne tekst te hapur trajtohen si te **komprometuar**
→ anulohen dhe rigjenerohen. Ekzekutuesi i kodit nuk i trajton sekretet;
i vendos Martineli.

### Kufi i matur i ketij mjedisi — I ZGJIDHUR PJESERISHT (1 shtator 2026)

Rregulli 11 kerkon verifikim live me sy. Dalja HTTPS e AGJENTIT drejt
`alpazar.vercel.app` mbetet e bllokuar nga politika (matur: `000`, connect
rejected). **POR ekziston nje rruge e dyte qe nuk e kisha provuar kurre:**
`web_fetch_vercel_url` i serverit MCP te Vercel-it e merr faqen nga
infrastruktura e VERCEL-it, jo nga dalja ime. Provuar dhe punon:

    /api/version → 200, build da45d9f (= koka e `main`)
    /api/health  → ok:true, db 458ms, realtime 473ms
    /listing/<id> → 200, HTML i plote, pa asnje gabim lejeje
    /biznese      → 200, HTML i plote

Pra agjenti TANI e verifikon dot prodhimin: kodin e statusit, kokat (CSP,
cache-control), HTML-ne e renderuar dhe permbajtjen. Kufijte qe mbeten:
  · nuk hyn dot ne llogari → faqet e autentikuara (`/profile`, `/admin`,
    `/messages`) nuk shihen dot live; per to prova me e mire mbetet ekzekutimi
    i SAKTESISHT te njejtave kerkesa te baza, si `authenticated`;
  · merr HTML, jo pamje — pra CLS, kontrasti dhe prekja maten te dyfishi lokal;
  · `*.supabase.co` mbetet 403 per agjentin.

**Rrjedhimisht: mos e shkruaj me "nuk verifikohet dot live".** Verifikohet ajo
qe eshte publike dhe pa sesion; deklaro sakte cfare mate dhe cfare jo.

---

## 9. TAKSONOMIA E FSHEHJES — si mbijeton nje defekt shtate auditime

> Nxjerre nga tete kalime mbi te njejtin aplikacion (`docs/SUPERAUTOPSIA.md`).
> Cdo forme ka nje defekt real pas vetes. Perdore si liste kontrolli, jo lexim.
>
> **Fakti themelor:** asnje kalim nuk gjeti gje te re me instrumentin e kalimit
> te meparshem. "Auditova edhe nje here" nuk prodhon asgje; "auditova me nje
> mjet tjeter" prodhon gjithmone.

### 9.1 Shtate format e fshehjes

- **F1 · Boshlleku midis shtresave.** E ndertuar plotesisht ne baze, e paprekur
  plotesisht nga kodi. Te dy auditimet thone "ne rregull".
  → *Krahaso dy inventare* (RPC ↔ referenca kodi).
- **F2 · Mbrojtja te fusha, jo te rruga.** Kolona u mbyll; nje SECURITY DEFINER
  i thirrshem nga `anon` e shkruan me te drejtat e PRONARIT.
  → *Numero SHKRUESIT e nje fushe, jo fushen.*
- **F3 · Siperfaqja eshte lista e GRANT-eve, jo kodi.** Nje funksion i arritshem
  nga anon-key eshte publik edhe nese aplikacioni s'e therret kurre.
  → *Listo cdo funksion te thirrshem nga `anon`/`authenticated`.*
- **F4 · Pretendimi rri ne koment.** "Raporti 70/30" ishte shkruar qe ne fillim;
  i matur ishte 56/43.
  → *Mat pohimin; mos e lexo.*
- **F5 · Mekanizmi i sakte, njesia e gabuar.** `flex-basis` mbi kutine e
  permbajtjes; `count` qe vjen NaN dhe `?? 0` nuk e kap.
  → *Mat rezultatin, jo formulen.*
- **F6 · Vegla e brendshme mbetet e hapur.** Nje funksion auditimi qe nxjerr
  gjithe skemen, i thirrshem pa sesion.
  → *Per cdo mjet: "kush tjeter mund ta therrase?"*
- **F7 · Rrjeta e sigurise e fsheh defektin.** Pagesa binte te 'review' ne vend
  qe te humbte, ndaj askush s'e pa qe dhenia automatike s'punoi KURRE.
  → *Krahaso skemen me cdo emer kolone te perdorur ne kod.*

### 9.2 Gjashte menyrat si te genjen instrumenti

Kjo klase kushton me shume se defektet: prodhon **fiksion te raportuar me siguri**.
Kur nje matje te befason, pyet **cfare mat SAKTESISHT** para se te pyesesh
cfare ka sistemi. Gjashte here nga gjashte, faji ishte i instrumentit.

- Numero **jashte** rolit qe po provon — perndryshe RLS-ja i fsheh rreshtat dhe
  del nje zero e rreme.
- `now()` eshte koha e TRANSAKSIONIT. Per sjellje kohore perdor `clock_timestamp()`.
- Prit derisa animacionet te qetesohen para axe-core; **ngjyra te perziera** ne
  nje shkelje kontrasti = matje ne fluturim.
- Verifiko KU po flet aplikacioni para se te raportosh gabime rrjeti.
- Kurre `next build` mbi nje `.next` qe `next dev` po e sherben.
- `layout-shift` emerton te ZHVENDOSURIT, jo shkaktarin — ndiq zinxhirin lart.

### 9.3 Verberia e tete — mos i beso mekanizmit te rregullimit tend

Nje roje u ndertua mbi `current_user` brenda nje trigeri, duke u mbeshtetur te
§1.5. Arsyetimi i rregullt, zbatimi krejt i gabuar: brenda nje SECURITY DEFINER
`current_user` eshte GJITHMONE pronari, edhe brenda vete trigerit — porta nuk
mbyllej kurre. Nuk e kapi as tsc, as testet, as build-i, as leximi.

**Cdo mbrojtje e re duhet te perballet me sulmin qe pretendon se ndalon — PAS
aplikimit, jo para.** Nje rregullim i pandodhur eshte me i keq se defekti, sepse
mbi te mbeshtetesh.

### 9.4 Matrica: asnje instrument nuk mbulon dy klasa

Pamje e prishur → sy · kontrast/prekje → axe · zhvendosje → PerformanceObserver ·
varesi → `npm audit` · politike e gjere → logjika RLS · vecori e paarritshme →
DB↔kod · fushe e falsifikueshme → **prove shkrimi** · rruge e privilegjuar
publike → **prove si `anon`**.

Asnje kolone nuk mbulon dy rreshta. Prandaj klasat e instrumenteve nuk jane
liste deshirash — jane te gjitha te detyrueshme.

---

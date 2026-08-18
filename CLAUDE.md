# ALPAZAR — KUJTESA E PROJEKTIT

> Lexoje kete para se te prekesh gje. Cdo rregull ketu vjen nga nje ligj konkret
> ose nga nje gabim i bere njehere.

---

## 0. Rregulli i pare

**Mos shkruaj asnje rresht pa lexuar gjendjen reale.**

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

## 1. Tre kurthe teknike te verifikuara

1. **`revoke ... from anon` nuk ka efekt** kur e drejta vjen nga `PUBLIC`.
   Gjithmone: `revoke ... from public` → pastaj `grant` shprehimisht.
   Verifiko me `has_function_privilege('anon', oid, 'EXECUTE')`, jo me sy.
2. **`has_perm()` dhe `is_admin()` nuk u hiqet kurre EXECUTE** nga `anon`/
   `authenticated` — thirren brenda politikave RLS; heqja rrezon aplikacionin.
3. **`audit()` nuk ekziston.** Gjurma shkruhet me `admin_log()` → `admin_logs`.

---

## 2. Rregullat e pandryshueshme

1. **Fshehja automatike nuk eshte kurre heqje.** Vendimi me pasoja te renda
   kerkon njeri — neni 20, ligji 124/2024. Sanksioni deri 2 mld leke ose 4%.
2. **Asnje vendim pa arsyetim faktik.** Ai mban vendimin ne rast ankimi.
3. **Fshirja e llogarise e bute, 30 dite** — neni 20/3, ligji 10128.
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

1. Cmimi shprehet **vetem ne leke** — neni 9/4, ligji 9902/2008. `price_eur`
   shfaqet si cmim.
2. **E drejta 14-ditore e heqjes dore** nga Premium — nenet 37/1–37/8.
   (`businesses.withdrawal_days` tregon se ishte menduar.)
3. **Etiketa “E promovuar”** te VIP Boost — neni 17/A.11 + neni 8, ligji 10128.
4. **Transferim nderkombetar pa instrument** — nenet 26, 39–42, ligji 124/2024.
   Sidomos `gtranslate()` te `app/api/ai/context.ts`, qe dergon tekst te Google.
5. Mungon regjistri i veprimtarive (neni 27) dhe procedura 72-oreshe e cenimit
   (neni 29), ligji 124/2024.
6. DPO ka gjasa i detyrueshem — neni 33/1/c (te dhena penale ne shkalle te gjere).
7. **NIPT-i “(ne regjistrim)”** — neni 7, ligji 10128.
8. Mekanizmi i pelqimit per cookie — neni 123/6, ligji 9918/2008.
9. **Arsyetimi i vendimit nuk i dergohet perdoruesit** dhe **nuk ka rruge ankimi**.
   `moderation_queue.resolution` ekziston, por ai tekst nuk shkon askund.

---

## 5. Infrastruktura

- **Supabase** `sopafwfkrxpcdaljddoh` — PG 17.6.
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
- **Cloudinary:** Free, video **max 100 MB**, ndersa `video_max_seconds = 300`.
  Nje video 5-minuteshe nuk ngarkohet dot.

---

## 6. Si punohet

- **Shqip gjithmone** — kod, komente, nderfaqe, dokumente.
- **Lexo bazen para se te shkruash.** Kerko tabelen ekzistuese perpara se te krijosh.
- **Verifiko empirikisht:** fut prove, mat, pastro. Mos raporto asgje qe nuk e ke matur.
- **Nje ekran per nje pyetje te operatorit.** Nese dy ekrane i pergjigjen te njejtes
  pyetje, ato jane nje ekran.
- **Cdo veprim shkaterrues me arsye te detyrueshme dhe gjurme.**
- **Mos e zgjidh me kod ate qe zgjidhet me konfigurim.**

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

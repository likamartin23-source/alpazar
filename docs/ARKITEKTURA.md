# ALPAZAR — Kujtesa e arkitektures

> Ky dokument eshte **burimi i vetem i se vertetes** per vendimet strukturore.
> Perpara se te ndryshosh dicka ketu, lexo pse eshte ashtu.
> Perditesuar: 2026-08-09

---

## 1. Rregulli themelor: nje koncept = nje shtepi

Platforma ka **dy** tabela konfigurimi. Ngaterrimi i tyre ka qene burimi i shumices
se kundershtive historike.

| Tabela | Kush e lexon | Cfare mban |
|---|---|---|
| `app_config` | **publike** — klienti dhe Albi (anon key) | kufij, cmime te derivuara, flamuj publike |
| `admin_settings` | **vetem admini** (RLS `is_admin()`) | sekrete, celesa API, PIN, konfigurim serveri |
| `premium_plans` | publike permes RPC | katalogu i planeve dhe cmimet reale |

**Rregulli:** nese e lexon klienti ose Albi -> `app_config`. Nese eshte sekret -> `admin_settings`.
Asnje celes nuk duhet te jetoje ne te dyja. (Perjashtim i vetem sot: `site_slogan`, me vlere identike.)

### Celesat zyrtare te kufijve
Redaktohen te **Paneli -> Kufijte**. Lexohen njekohesisht nga formulari i shpalljes,
nga faqja e redaktimit, nga Albi dhe nga vete baza.

- `free_listings_limit`, `max_images_free`, `free_videos_limit`
- `max_images_premium` (-1 = pa limit), `max_videos_premium`
- `video_max_seconds`

Burimi i vetem per kodin: **`get_my_entitlements()`**. Asnje faqe nuk lexon `cfg()` per kufij.

---

## 2. Planet

**Premium** — te gjithe perdoruesit Premium jane **te barabarte**. Ndryshon vetem periudha.
Perfitimet: shpallje pa limit, vend i pare, profil biznesi, postime pa limit.

**Ekstra Boost VIP** — produkt i **vecante**, shtese mbi Premium (nuk e zevendeson).
Fillon nga **19.99 EUR / 1 999.90 L** ne muaj.
Blihet vetem nga kush ka Premium aktiv. Jep kreun absolut te listes.

Zbritja per 3-mujor dhe vjetor eshte **17% e sakte**, jo e perafert.
Cmimet jetojne **vetem** te `premium_plans`, te redaktueshme nga Paneli -> Planet.
Asnje cmim nuk shkruhet ne kod. Nese konfigurimi s'eshte ngarkuar, UI-ja **hesht** —
nuk shfaq kurre cmim te rreme.

---

## 3. Motori i renditjes  ⚠️ kritik

`listings.rank_tier`: **0** = pa pagese · **1** = Premium · **2** = Ekstra Boost VIP

**Renditja rrjedh nga e drejta e pronarit, nuk kopjohet me dore.**

- `guard_listing_is_premium` (BEFORE INSERT/UPDATE) e **rillogarit vete** vleren nga pronari.
  Nje vlere e rreme eshte fizikisht e pamundur, dhe mbrojtja nga vetesh-promovimi ruhet.
- `tg_propagate_rank_to_listings` (mbi `profiles`) rirendit vetvetiu te gjitha shpalljet
  e nje pronari sapo ndryshon gjendja e tij.
- Renditja: `rank_tier desc, last_bumped_at desc`. Indeks: `idx_listings_rank`.

**Historia:** para 2026-08-09 renditja bazohej te `listings.is_premium`, por asgje nuk e
vinte kurre ate flamur — 0 nga 4 shpallje e kishin. Perdoruesi paguante dhe **nuk levizte
asnje vend**. Ekstra Boost nuk lexohej nga asnje query.

**Ngritja (bump)** prek **vetem** `last_bumped_at`. Me pere shkruante `created_at = now()`,
duke shkaterruar daten reale qe perdoret ne sitemap dhe ne JSON-LD.

---

## 4. Abonimet dhe skadimi

- Nje abonim i gjalle **per perdorues + tier** (`uniq_live_subscription_per_user_tier`).
- `period` lejon `monthly | quarterly | yearly`. (3-mujori ishte i bllokuar nga nje CHECK
  i vjeter deri me 2026-08-09 — asnje plan 3-mujor nuk blihej dot.)
- Aktivizimi jep perfitimet **menjehere**, dergon njoftim dhe leshon faturen.
- `expire_premium_run()` (cron 01:00) skadon Premium **dhe** Boost. Boost bie edhe kur
  bie Premium, sepse eshte shtese mbi te.
- `change_my_plan` nuk kalon dot nga nje tier ne tjetrin.

**Rregull UI:** `/premium` = katalogu dhe blerja. `/billing` = menaxhimi i asaj qe ke.
Kurre te dyja ne te njejtin vend — kjo shkaktonte mbivendosje dhe kalime te gabuara tier-i.

---

## 4-b. Profili i biznesit — errësimi

`businesses.is_visible` **rrjedh nga e drejta e pronarit**, njësoj si renditja. Kur Premium-i
skadon ose anulohet, profili errësohet vetvetiu dhe zhduket nga publiku; kur pagesa kthehet,
ndriçohet menjëherë. Pronari e sheh gjithmonë të vetin; admini sheh gjithçka.

- `is_active` — errësim manual nga administrata, vlen edhe kur pronari paguan.
- `dim_reason` — pse është i errësuar, i dukshëm në panel.
- `business_requires_premium` (app_config) — fike vetëm nëse do që bizneset të mbeten
  publike pa pagesë.

**Historia:** para 2026-08-10 `businesses` nuk kishte fare kolonë dukshmërie dhe politika
publike ishte `true` — një profil biznesi mbetej i dukshëm përgjithmonë edhe pa pagesë.

Fshirja e një biznesi **nuk i prek shpalljet** — ato shkëputen nga biznesi dhe mbeten.

Verifikimi nuk është sistem më vete: `admin_review_verification()` e trajton në të njëjtën
sipërfaqe, dhe aprovimi verifikon automatikisht biznesin ose përdoruesin dhe njofton pronarin.

---

## 5. Paneli i kontrollit

Nje faqe e vetme `/admin` me shirit anesor. **Mos krijo faqe paralele** — kjo e prishi
strukturen njehere dhe u desh te kthehej mbrapsht.

**Pesë domene**, sipas modelit Meta Business Suite / TikTok / Temu Seller Center — jo listë
e sheshtë ku tre tab-e mbulojnë të njëjtën rrjedhë:

| Domeni | Tab-et |
|---|---|
| Vështrim | Dashboard |
| Njerëz | Përdoruesit · Bizneset · Njoftime · Referalet |
| Të ardhura | Pagesat · Abonimet · Faturat · Planet · Metodat |
| Përmbajtje | Moderimi · Heqja |
| Sistemi | Kufijtë · Konfigurime · Gjurma · AI Health |

**Aftësi që çdo panel serioz i ka dhe tani i ka edhe ky:** gjurmë veprimesh (kush, çfarë, kur),
njoftime masive të segmentuara me numër marrësish para dërgimit, veprime masive, eksport CSV
me BOM për Excel-in shqip, trende ditore (`admin_trends`).

**Aprovim me një klikim:** butoni *"Aprovo + faturë"* aktivizon abonimin, lëshon faturën,
e dërgon në inbox dhe e regjistron veprimin — një transaksion i vetëm.

Komponentet e rinj shkojne te `app/admin/tabs/` dhe regjistrohen ne listen `tabs` te
`page.tsx`. Klasat vizuale: `.ph .pt .card .ct .stats .sc .badge .btn .finput .cfg-row`.

Statistikat vijne nga **`admin_stats()`** — jo nga query te vecanta ne klient.

---

## 6. Perditesimi live

`sw.js` **vete-versionohet**: regjistrohet si `/sw.js?v=<BUILD_ID>`, dhe emri i cache-it
vjen nga ai parameter. **Asnje version nuk shkruhet me dore** — kjo ishte arsyeja pse
ndryshimet nuk pasqyroheshin per jave te tera.

`UpdatePrompt` kontrollon per version te ri, sugjeron perditesimin, dhe e aplikon **ne heshtje**
kur faqja del nga pamja. Faqja nuk rifreskohet kurre nen duart e perdoruesit.

Konfigurimi propagohet live permes realtime mbi `app_config` dhe `premium_plans`.
**Kujdes:** nje tabele duhet te jete ne publikimin `supabase_realtime` qe abonimi te ndizet.

---

## 7. Kerkimi

**Nje** kolone e vetme: `listings.fts` (titull + pershkrim + qytet), e gjeneruar nga baza,
me indeks GIN. Te dy rruget e kerkimit e perdorin ate.

Me pare kishte tri kolona me tri perkufizime te ndryshme — kerkimi per nje qytet jepte
rezultate ne nje faqe dhe **asgje** ne tjetren.

**Semantika:** `recommend_similar()` (pgvector) provohet e para, me rikthim te sigurt te
logjika sipas kategorise. Embedding-u mbushet nga trigger-i ne krijim **dhe** nga cron
cdo 6 ore (`/api/embed-backfill`) — sekreti nuk kalon nga rruga web.

---

## 8. Faturat

Leshohen automatikisht kur aprovohet nje pagese. Numerator vjetor `ALP-VITI-NNNNNN`.
Admini i dergon ne inbox te klientit dhe mund te **ngarkoje fature tatimore reale (PDF)**.

---

## 9. Vendime te marra me qellim — mos i "rregullo"

- **`saved_listings`** mbetet edhe pse eshte dublikat i `favorites`: e perdor
  `delete-account` per fshirjen e llogarise (GDPR). Fshirja do te prishte ate rruge.
- **`premium_subscriptions`** mbetet: referohet ende nga nje deg e vdekur e edge function-it
  `admin-action`. Sistemi real eshte `subscriptions`.
- **`orders`, `offers`, `transactions`, `disputes`, `posts`, `badges`, `listing_boosts`,
  `moderation_queue`, `leaderboard_cache`** — tabela per veçori te **paplanifikuara ende**,
  jo dublikate. Nuk fshihen.
- **Tri tabela pa politike RLS** (`otp_codes`, `otp_email_throttle`, `admin_action_throttle`)
  jane te bllokuara **me qellim** — preken vetem nga edge functions me service_role.

---

## 10. Rregulla pune

1. **Verifiko para se te veprosh.** Nje here alarmi "vetem 1 nga 4 shpallje me embedding"
   doli i rreme: te tjerat ishin joaktive dhe anashkalohen me qellim. Mbulimi ishte 100%.
2. **Mos e rregullo gjysmen.** Kur ndryshon nje kufi, ndrysho **cdo** vend qe e lexon —
   krijimi dhe redaktimi kane qene dy here jashte sinkronit.
3. **Plan rikthimi para cdo fshirjeje.** Shih `supabase/rollback/`.
4. **Mos dyfisho vlera.** Nese nje numer shfaqet ne dy vende, njeri do te genjeje.

---

## 11. Rolet e administrates (2026-08-10)

Deri me 9 gusht `is_admin` ishte **binar**: kush hynte ne panel mund te fshinte
perdorues, biznese, te ndryshonte cmimet dhe te dergonte njoftime te gjitheve.
Kjo nuk eshte panel — eshte celes i vetem per gjithe shtepine.

Modeli i marre nga Meta Business Suite dhe Stripe Teams: **role te emertuara**
me nje grup fiks lejesh. Jo kuti zgjedhjeje per person — lejet e lira per person
behen te pakontrollueshme brenda pak muajsh.

| Roli | Cfare mund te beje |
|---|---|
| **Pronar** | Gjithcka, perfshire caktimin e roleve dhe rimbursimet |
| **Administrator** | Gjithcka pervec roleve dhe rimbursimeve |
| **Financa** | Pagesat, faturat, rimbursimet, planet. **Nuk fshin.** |
| **Moderator** | Permbajtja, perdoruesit, bizneset. **Pa para, pa fshirje.** |
| **Mbeshtetje** | Vetem lexim |

- `profiles.admin_role` ruan rolin; `perm_matrix(role)` kthen lejet; `has_perm(leje)` vendos.
- **29 funksione admin** e pyesin lejen e vet. Asnje nuk mbeti me `is_admin()` te zhveshur.
- Zbatimi eshte **ne baze, jo ne pamje**. Fshehja e nje tab-i eshte rehati, jo siguri.
- Platforma nuk mbetet kurre pa Pronar — i fundit nuk hiqet dot, dhe nje Pronar
  nuk e ul dot veten. Kjo mbron nga vetembyllja jashte panelit.

**Kur shton nje funksion te ri admin:** shtoji nje `has_perm(...)` ne rreshtin e pare.
Nese harron, cdo mbeshtetes mund ta thirre.

---

## 12. Notat e kreditit (rimbursimet)

Rregulli i arte: **nje fature e leshuar nuk fshihet dhe nuk ndryshohet kurre.**
Rimbursimi eshte nje dokument i **dyte**, negativ, qe i referohet te parit.
Keshtu e kerkon kontabiliteti dhe keshtu mbetet gjurma.

- `invoices.kind` = `invoice` | `credit_note`; `parent_invoice_id` lidh notes me faturen.
- Numerator i vecante: `NK-VITI-NNNNNN` (fatura mbetet `ALP-VITI-NNNNNN`).
- `refunded_total` mbahet mbi faturen prinderore; statusi kalon ne
  `partially_refunded` ose `refunded`. Mbetja llogaritet, **nuk kopjohet**.
- Rimbursime te pjesshme lejohen derisa mbetja te behet zero. Teprica refuzohet.
- **Arsyeja eshte e detyrueshme** — mbetet pergjithmone ne `admin_logs`.
- Opsionale: nderprerja e menjehershme e abonimit ne te njejtin veprim.
- Kontrolli i shendetit: shuma e `total` per nje fature + notat e saj **duhet te jete 0**
  kur rimbursohet plotesisht. Kjo u prova me kater skenare para se te dorezohej.

---

## 13. Gabime te gjetura duke verifikuar, jo duke supozuar (2026-08-10)

Kater probleme qe ishin **te padukshme** derisa u ekzekutua kodi:

1. **`admin_list_invoices` lexonte `profiles.email` — kolone qe nuk ekziston.**
   Tab-i i Faturave nuk kthente liste bosh; kthente **gabim**. Emaili rri te `auth.users`.
2. **`admin_deactivate_subscription` fshinte gjithmone `is_premium`**, edhe kur
   abonimi i ndaluar ishte Boost VIP — pra klienti humbte Premium-in pa faj.
   Dhe `limit 1` pa renditje zgjidhte nje abonim te rastesishem nga te dy.
3. **`invoices_status_check` lejonte vetem `paid/gifted/refunded`.** Prandaj dega
   `draft/issued` ne `admin_send_invoice` ishte kod i vdekur qe nga dita e pare,
   dhe notat e kreditit nuk futeshin dot fare.
4. **Dy versione te `admin_list_invoices`** njekohesisht — PostgREST nuk zgjidhte
   dot cilin te thirrte (`function is not unique`).

Mesimi mbetet rregulla 1: **ekzekuto, mos supozo.** `create or replace` ne plpgsql
nuk verifikon asgje brenda trupit — nje kolone e gabuar kalon pa zhurme derisa
dikush e thirr funksionin ne prodhim.

---

## 14. Ndihmesit e brendshem jane te mbyllur

PostgREST ekspozon **cdo** funksion te skemes `public`. Kater ndihmes ishin
`SECURITY DEFINER` **pa asnje rojtar**, me `EXECUTE` per `anon` dhe `authenticated`:

| Funksioni | Cfare mund te bente kushdo |
|---|---|
| `_issue_invoice` | te falsifikonte nje fature |
| `_next_invoice_number` | te konsumonte numeratorin fiskal |
| `_sub_event` | te shkruante ngjarje te rreme abonimi |
| `_revoke_subscription` | te nderpriste abonimin e kujtdo |

Te gjitha u revokuan nga `public, anon, authenticated`. Thirrjet nga brenda
funksioneve te tjera `SECURITY DEFINER` nuk preken — ato ekzekutohen si pronari.

**Rregull i ri:** cdo funksion i ri qe fillon me `_` duhet te kete `revoke execute
... from public, anon, authenticated` ne te njejtin migrim ku krijohet.
Nese nje funksion nuk thirret nga shfletuesi, ai nuk duhet te jete i thirrshem prej tij.

# REGJISTRI I VEPRIMTARIVE TË PËRPUNIMIT

**Baza ligjore e vetë regjistrit:** neni 27, Ligji Nr. 124/2024 "Për mbrojtjen e të
dhënave personale". Regjistri mbahet me shkrim, përditësohet kur ndryshon sistemi
dhe i vihet në dispozicion Komisionerit **me kërkesë** — nuk është dokument publik.

> **STATUS:** hartuar më 31 gusht 2026 nga inventari **i matur** i sistemit (tabelat
> reale të bazës, rrugët reale të kodit, hostet realë të daljes), jo nga supozime.
> Fushat që kërkojnë vendim ose të dhënë të pronarit janë shënuar **`[PLOTËSO]`**.
> Ky dokument nuk zëvendëson konsulencën juridike; ai siguron që asgjë të mos harrohet.

---

## 0. Kontrolluesi

| Fushë | Vlerë |
|---|---|
| Emri | Alpazar |
| NIPT | **`[PLOTËSO]`** — sot shfaqet publikisht "(në regjistrim)" |
| Adresa | Tiranë, Shqipëri **`[PLOTËSO: adresa e plotë]`** |
| Kontakt për të dhënat | **`[PLOTËSO]`** — sot faqja `/siguria` publikon një email personal Gmail |
| DPO | **I PACAKTUAR.** Ka gjasa i detyrueshëm — neni 33/1/c (përpunim në shkallë të gjerë; platforma mban të dhëna moderimi/raportimesh dhe gjurmë sjelljeje). **`[PLOTËSO ose dokumento arsyen pse jo]`** |

---

## 1. Veprimtaritë e përpunimit

### 1.1 Llogaria dhe identiteti i përdoruesit
- **Qëllimi:** krijim llogarie, hyrje, verifikim moshe (≥16 vjeç), parandalim abuzimi.
- **Baza ligjore:** neni 6/1/b (ekzekutim kontrate) · neni 6/1/c për verifikimin e moshës (neni 8, ligji 124/2024).
- **Subjektet:** përdorues të regjistruar.
- **Kategoritë:** email, numër telefoni, emër, foto profili, qytet, vit lindjeje/mosha, `last_seen`, adresa IP (e hashuar te ngjarjet), preferenca gjuhe.
- **Ku ruhen:** `auth.users`, `profiles`, `user_settings`, `otp_codes`, `otp_*_throttle`.
- **Afati:** fshirje e butë 30 ditë (neni 20/3, ligji 10128) — `profiles.deleted_at`; kodet OTP skadojnë brenda minutash.

### 1.2 Shpallje, biznese dhe përmbajtje
- **Qëllimi:** publikim dhe kërkim i shpalljeve; profile biznesi.
- **Baza:** neni 6/1/b. Për **NIPT-in e biznesit** që shfaqet publikisht: neni 7, ligji 10128 (detyrim ligjor identifikimi i tregtarit).
- **Kategoritë:** titull, përshkrim, çmim, foto/video, **vendndodhje (lat/lng)**, kontakte të shitësit.
- **Ku:** `listings`, `listing_images`, `businesses`, `posts`, `listing_comments`.
- **Vëmendje:** vendndodhja është e dhënë me ndjeshmëri praktike; përdoruesi e jep vetë.

### 1.3 Komunikimi mes përdoruesve
- **Qëllimi:** mesazhe për negocim shitblerjeje.
- **Baza:** neni 6/1/b.
- **Kategoritë:** përmbajtje mesazhi, bashkëngjitje, orë leximi, tregues shtypjeje.
- **Ku:** `conversations`, `messages`, `message_attachments`, `typing_indicators`.
- **Afati:** derisa llogaria të fshihet; `deleted_at` për fshirje individuale.

### 1.4 Pagesa, abonime dhe faturim
- **Qëllimi:** shitje e shërbimit Premium/VIP; detyrime tatimore dhe kontabël.
- **Baza:** neni 6/1/b **dhe** neni 6/1/c (detyrim ligjor — fiskalizim, ligji 87/2019).
- **Kategoritë:** plan, shumë, monedhë, metodë pagese, të dhëna faturimi (`buyer_json`), NIVF/NSLF kur fiskalizimi ndizet.
- **Ku:** `subscriptions`, `premium_subscriptions`, `premium_requests`, `invoices`, `transactions`, `payment_methods`, `subscription_events`.
- **Afati:** faturat ruhen sipas afatit ligjor kontabël — **`[PLOTËSO: 5 ose 10 vjet sipas praktikës së zgjedhur]`**; nuk fshihen me fshirjen e llogarisë.

### 1.5 Moderimi, raportimet dhe ankimet
- **Qëllimi:** heqja e përmbajtjes së paligjshme; mbrojtja e përdoruesve; e drejta e ankimit.
- **Baza:** neni 6/1/c (nenet 17 dhe 20, ligji 10128; ligji 124/2024 neni 20) dhe neni 6/1/f.
- **Kategoritë:** raporte, arsyetime vendimesh, identitet raportuesi dhe pronari, ankime.
- **Ku:** `reports`, `moderation_queue`, `moderation_appeals`, `takedown_requests`, `disputes`.
- **Vëmendje:** mund të përmbajë **të dhëna që lidhen me vepra penale** — trajtim i kufizuar, akses vetëm me lejen `content.moderate`.
- **Afati:** ruhen si provë; `audit_logs` është **i pandryshueshëm** (nenet 6 dhe 12, ligji 10273/2010).

### 1.6 Gjurma e administrimit dhe siguria
- **Qëllimi:** llogaridhënie e veprimeve administrative; zbulim keqpërdorimi.
- **Baza:** neni 6/1/c (neni 28, ligji 124/2024) dhe neni 6/1/f.
- **Ku:** `admin_logs`, `audit_logs`, `health_events`, `admin_action_throttle`.

### 1.7 Matje përdorimi (analitikë e brendshme)
- **Qëllimi:** numërim shikimesh, kontaktesh, ndarjesh; statistika për shitësin.
- **Baza:** neni 6/1/f (interes legjitim) — **pa cookie reklamimi**.
- **Kategoritë:** ngjarje me `ip_hash` (jo IP e plotë), identifikues shpalljeje.
- **Ku:** `analytics_events`, `listing_views`, `shares`, `search_history`, `trending_searches`.
- **Vercel Analytics** ngarkohet **vetëm pas pëlqimit** (`lib/consent.ts`).

### 1.8 Asistenti me AI ("Albi")
- **Qëllimi:** ndihmë për përdoruesin.
- **Baza:** neni 6/1/b për funksionin; **pëlqim** për çdo zgjerim.
- **Kategoritë:** teksti që shkruan përdoruesi + kontekst shpalljesh.
- **Marrësit:** shih §2 — **transferim jashtë vendit**.

---

## 2. Marrësit dhe vendndodhja e përpunimit

| Marrësi | Roli | Çfarë merr | Ku | Instrumenti |
|---|---|---|---|---|
| **Supabase** (`sopafwfkrxpcdaljddoh`) | Përpunues — bazë, auth, ruajtje | Gjithçka | **eu-west-1 (Irlandë, BE)** | DPA i Supabase-it — **`[PLOTËSO: nënshkruar? datë]`** |
| **Vercel** | Përpunues — strehim/edge | Kërkesat HTTP, IP | Rrjet global | **`[PLOTËSO: DPA]`** |
| **Cloudinary** | Përpunues — video | Video të ngarkuara | SHBA | **MUNGON SCC** |
| **Brevo** | Përpunues — email | Email, përmbajtje njoftimi | BE (Francë) | **`[PLOTËSO: DPA]`** |
| **Resend** | Përpunues — email | Email | SHBA | **MUNGON SCC** |
| **Groq** | Përpunues — model AI | Teksti i bisedës me Albin | SHBA | **MUNGON SCC** |
| **Anthropic** | Përpunues — model AI | Teksti i bisedës | SHBA | **MUNGON SCC** |
| **Perplexity** | Përpunues — kërkim AI | Pyetje | SHBA | **MUNGON SCC** |
| **Google Translate** (`translate.googleapis.com`) | Përpunues | **Tekst i lirë i përdoruesit** — `gtranslate()` te `app/api/ai/context.ts` | SHBA | **MUNGON SCC** |
| **Google OAuth** | Kontrollues i pavarur | Email, emër, foto — vetëm nëse zgjidhet hyrja me Google | SHBA | Kushtet e Google |
| **Sentry** (`de.sentry.io`) | Përpunues — gabime | Gjurmë gabimi; **Session Replay vetëm me pëlqim, me tekst të maskuar** | Gjermani (BE) | **`[PLOTËSO: DPA]`** |
| **OpenStreetMap / Nominatim** | Kontrollues i pavarur | Query gjeokodimi + IP | BE | Kushtet e OSM |

**Fonte:** që prej 31 gushtit 2026 **nuk ka** kërkesa drejt `fonts.googleapis.com` /
`fonts.gstatic.com` — të gjithë fontet vetëstrehohen. Matur në shfletues: 0 kërkesa.

---

## 3. Transferimet ndërkombëtare — gjendja e vërtetë

Ruajtja kryesore është **brenda BE-së** (Supabase eu-west-1, Sentry Gjermani, Brevo
Francë). Mbeten transferime drejt SHBA-së për: Cloudinary, Resend, Groq, Anthropic,
Perplexity dhe **Google Translate**.

**Nenet 26 dhe 39–42, ligji 124/2024** kërkojnë instrument transferimi (klauzola
standarde kontraktore ose vendim përshtatshmërie). **Sot nuk ka asnjë të nënshkruar.**

Rreziku më i lartë është `gtranslate()`: dërgon **tekst të lirë të përdoruesit** te
Google pa instrument dhe pa e ditur përdoruesi. Zgjidhjet, sipas kostos rritëse:
1. **Hiqe** thirrjen dhe mbaje përkthimin brenda modelit që tashmë përdoret;
2. zëvendësoje me një ofrues me SCC të nënshkruar;
3. mbaje dhe nënshkruaj SCC + shto informim të qartë te `/privatesia`.

---

## 4. Afatet e ruajtjes

| Të dhëna | Afat | Burimi |
|---|---|---|
| Llogari e fshirë | **30 ditë** fshirje e butë, pastaj heqje | neni 20/3, ligji 10128 |
| Kode OTP | Minuta | siguri |
| Fatura | **`[PLOTËSO]`** | detyrim kontabël/tatimor |
| `audit_logs` | I pandryshueshëm, pa fshirje | nenet 6 e 12, ligji 10273/2010 |
| Rastet e moderimit | Sa provë e nevojshme | neni 20, ligji 124/2024 |
| Ngjarje analitike | **`[PLOTËSO: propozim 14 muaj]`** | minimizim |

---

## 5. Masat teknike dhe organizative (neni 32)

Të matura, jo të deklaruara:
- **RLS** e ndezur në çdo tabelë me të dhëna përdoruesi; politika të verifikuara.
- **Leje me role** — `has_perm()` + `perm_matrix()` (16 leje, 6 role); pamja vetëm fsheh, baza vendos.
- **Ndarje detyrash** — ankimin nuk e shqyrton kush mori vendimin e parë; zbatuar **në bazë** (`admin_resolve_appeal` → `konflikt_interesi`), jo në ndërfaqe.
- **Gjurmë e pandryshueshme** — `audit_logs` me RLS `no_insert`/`no_delete`.
- **Fail-closed te /admin** — `middleware.ts` ridrejton kur sesioni ose `is_admin` mungon.
- **Funksionet e trigerit nuk thirren dot nga PostgREST** (verifikuar mbi `proacl`, 31 gusht 2026).
- **CSP e ngushtë** + HSTS + `frame-ancestors 'self'`; Session Replay me `maskAllText`.
- **Pëlqim i vërtetë për cookie** — analitika nuk ngarkohet pa "Prano" (`lib/consent.ts`).
- **Verifikim moshe ≥16 vjeç** para përdorimit.

**Mangësi të njohura:** DPO i pacaktuar · SCC të panënshkruara · NIPT në regjistrim ·
kontakt zyrtar i të dhënave i papublikuar.

---

## 6. Përditësimi

Ky regjistër përditësohet kur: shtohet një marrës i ri; ndryshon qëllimi ose baza
ligjore; shtohet një kategori e re të dhënash; ndryshon vendndodhja e përpunimit.
Përgjegjës: kontrolluesi (ose DPO-ja kur caktohet).

# RAPORT PËRFUNDIMTAR I TERMINALIT → CLOUD
**1 shtator 2026** · burimi i plotë: `.ops/RESULTS.md` (44 seksione, 2231 rreshta)

Ky është raporti që prisje para se të nisësh fazën e re (`d679afe`).
Struktura ndjek parimin e harmonisë që sapo regjistrove:
**lista "MOS E PREK" ka po aq peshë sa lista "RREGULLO"** — sepse dëmi më i madh që
mund të bëjë kjo fazë është të "rregullojë" diçka që tashmë punon bukur.

---

## 1. MOS E PREK — e matur, punon, është projektim i mirë

Këto i dyshova, i mata, dhe dola gabim. Nëse i "harmonizon", e prish platformën.

| Sistemi | Prova |
|---|---|
| **Dy tabelat e konfigurimit** | NUK janë dublim historik. `admin_settings` ka **zero grante** për `anon`/`authenticated`; mbi `app_config` rri trigeri `trg_app_config_no_secrets` që refuzon çdo çelës që i ngjan sekreti. **Kufi sigurie i zbatuar në bazë. Mos i bashko.** |
| **Sinkronizimi i çmimeve** | `trg_sync_pricing_settings` (plans→config) + `trg_sync_plan_limits` (config→plans). Dykahësh. Çmimet përputhen 100%. |
| **Matrica e roleve** | 77 politika RLS mbi 39 tabela + 55 funksione thirrin `has_perm()`. Pretendimi i panelit "lejet zbatohen në bazë, jo në pamje" është i vërtetë. |
| **Sistemi i pauzimit** | Zinxhir i ndjekur hallkë-për-hallkë: cron/15min → `expire_premium_run()` → UPDATE `profiles.is_premium` → `trg_business_dim_on_premium` → `_apply_business_dimming`. **2 877 ekzekutime / 7 ditë / 0 dështime.** |
| **Respektimi i vendimit njerëzor** | `_apply_business_dimming` nuk mbishkruan kurrë `admin_visibility_override`, dhe rikthen vetëm bizneset që i errësoi vetë. Punë e hollë — ruaje. |
| **Modeli 3-shkallësh i fshirjes** | `BusinessForm` delStage 0→3 + `delete_own_business`. I plotë. |
| **Grid-i i kryefaqes** | `auto-fill` sillet saktë me 2 shpallje. S'ka defekt CSS. |
| **LISTING_SELECT te /kategori** | Përdoret, përmes `lib/seoTaxonomy.ts`. |
| **FavoriteButton** | Ka `stopPropagation` **dhe** `preventDefault`. |
| **Çipi 🏢** | Navigon saktë (div role=link 64×22). Provuar live. |
| **tierNgaProfili vs getLevel** | Koncepte të ndryshme: shkalla e pagesës vs pikët. S'janë dublim. |
| **admin_logs** | 16 rreshta = 16 veprime administrate. **Nuk humbet asgjë.** |

---

## 2. RREGULLO — defekte të konfirmuara, sipas peshës

### 🔴 A. Zinxhiri i faturës i thyer në KATËR hallka njëherësh
`invoices` = **0**, ndaj s'ka dështim të dukshëm ende — thyhet **në përdorimin e parë**:

1. `resend_from_email` = `onboarding@resend.dev` → **sandbox i Resend: dërgon VETËM te vetja.** Çdo faturë drejtuar klientit refuzohet. `resend_domain_id` bosh.
2. `company_nipt` bosh → shkelje e **ligjit 87/2019**.
3. `company_address` bosh → e njëjta shkelje.
4. `fiscal_enabled=false` → 0 të fiskalizuara.

Dhe `invoice_autosend=true` rri i ndezur mbi një kanal që nuk dorëzon.
**Pika me rrezikun më të lartë ligjor në gjithë platformën.**

### 🔴 B. Dy klientë Google OAuth të ndryshëm
`app_config.google_client_id` = `…umu48bc9go3a7pegsn5…`, i njëjti me
`admin_settings.google_oauth_client_id_alt1` — **jo** me `google_oauth_client_id`
(`…i8gh90bu2ve4sgha3u4f…`). Plus `_alt2`: **katër çelësa për një koncept**, dhe rruga
e login-it përdor alt1. Paneli e sinjalizon vetë por e nënvlerëson.
*(O12 është HOLD — kjo është vetëm matja, mos fshi asgjë.)*

### 🟠 C. Gabim i gëlltitur (§9)
Te `expire_premium_run`, `demote_free_keep_newest(v_u)` mbështillet me
`exception when others then null`. Një dështim aty zhduket pa gjurmë.

### 🟠 D. Siguria e panelit
`admin_pin` = `000000` dhe **`admin_pin_disabled = true`**. PIN-i s'është i dobët — është i fikur.

### 🟠 E. Mospërputhje kufijsh
`video_max_mb` = **50** te konfigurimi, ndërsa `/api/health` raporton **100**. Dy burime për një kufi.

### 🟠 F. Vlera të dyshimta
`referral_reward_all` = `00` ndërsa `/referral` premton "50 pikë".
`min_listing_price` = 0 dhe `offer_min_percent` = 0 — pa kufi.

### 🟡 G. Dublime në ndërfaqe — kandidatët e vërtetë të harmonizimit
- **Tri sisteme nivelesh të pavarura:** `Badges.getLevel` (Fillestar/Tregtar/Ekspert/Master), `TrustBadge.getLevel` (Fillestar/I Besueshëm/I Verifikuar/Shitës Ekspert), `app/referral/page.tsx LEVELS` — tri vargje, ngjyra të ndryshme.
- `app/messages/page.tsx:113,119` përdor `profile?.shop_name ? 'business' : 'person'` — pikërisht modeli `hasShop` i ndaluar.
- `HomeClient.fetchShops()` (`:468`) lexon `profiles` me `is_premium=true` në vend të `businesses`; `:991` ka `shop-prem ⭐` të ngurtësuar.
- `isOnline` dhe `buildBadges` te `Badges.tsx` janë kod i vdekur.
- `deploy_status=waiting_github_token` / `waiting_for=classic_github_token_ghp_` — rrugë vetë-deploy-i e braktisur përgjysmë.
- `brevo_from_email` personal ≠ `company_email`.
- `site_slogan` shfaqet dy herë te ekrani i konfigurimit.

### 🟡 H. Kartat dhe media — nga pamjet e pronarit
- Mbivendosje: butoni `.cam` (`bottom:0; right:-4`) përplaset me vulën 🏢 te `BiznesPageClient:548`.
- Fotot/videot në kartë nuk rrëshqiten dot nga web; videot s'janë autoplay kudo.
- **Vula VIP nuk është krijuar fare**; kudo ka stampa Premium të vjetra.
- Te shpalljet e pauzuara, të fshirat shfaqen si "Shitur"; numri "Të pauzuara (5)" përfshin të fshirat. `app/profile/page.tsx:119` i ngarkon `myListings` **pa filtër statusi**.

---

## 3. TËRHEQJE — pretendime të miat që NUK qëndrojnë

**Mos vepro mbi asnjë prej tyre.** I gjeta vetë dhe i korrigjova.

1. "Datat s'përputhen" — krahasim i pavlefshëm (llogaria ime vs shitësi).
2. "Shikimet luhaten 3→4" — një rritje reale, sjellje e dokumentuar.
3. "Grid-i është i thyer" — `auto-fill` korrekt.
4. "Çipi 🏢 s'navigon" — kisha klikuar një glif dekorativ 10×10.
5. "tierNgaProfili dublon getLevel" — koncepte të ndryshme.
6. "Zero `<a href>` kudo" — grep-i im humbi formën JSX me template literal.
7. "/kategori s'përdor LISTING_SELECT" — e përdor.
8. "FavoriteButton s'ka stopPropagation" — i ka të dy.
9. "'Vepro si' mungon te /profile" — `head -8` më preu daljen.
10. "admin_log() humbet gjurmë" — 16 rreshta = 16 veprime.

**Modeli i përbashkët i të dhjetave:** mata *formën* (markup, grep) dhe nxora përfundim
për *sjelljen*. Sa herë mata sjelljen, hipoteza ra.

Ky është edhe mësimi i regresionit `middleware.ts`: fshesa §0-bis mbuloi `app/*`,
`lib/*`, `components/*` dhe **humbi rrënjën e depos**. Prandaj para çdo `revoke`,
fshesa duhet të përfshijë `middleware.ts`, `instrumentation.ts`, `next.config.js`, `app/api/**`.

---

## 4. O15 — React #418: MBYLLUR, mos e prek kodin

- `next dev` lokal, dy ngarkime → **zero paralajmërime hidratimi**.
- Prodhimi, tre ngarkime me konsolë të pastruar → **zero mesazhe**.
- `health_events` id 8: `args[]=HTML&args[]=` → argumenti i dytë **bosh**, React s'emërton element.
- `stack` tërësisht brenda runtime-it të React — **asnjë kornizë e kodit tonë**.
- `user_agent` = **Macintosh**; 6 shfaqje; e fundit 31 gusht; asnjë që atëherë.

**Përfundim:** zgjerim shfletuesi ose ndryshim render-i i familjes Mac — jo defekt kodi.
Propozim: `wont_fix`, ose lëre `new` dhe rihape vetëm nëse `count` rritet.

Një `suppressHydrationWarning` këtu do të fshihte informacionin, jo defektin.

---

## 5. PRET PRONARIN — mos vepro pa përgjigje

| # | Pyetja | Gjendja |
|---|---|---|
| O4 | `/profile/security` dhe `/profile/subscription`: rrugë të ndashme apo skeda të brendshme? | pa përgjigje |
| O14.1 | `subscription_grace_days` 1→2 | **vendosur nga pronari; shkrimi u BLLOKUA nga klasifikuesi im** — mbetet `1` |
| O12/O13 | Dedup konfigurimi (`site_slogan`, `google_*`) | **HOLD** — verifikim live me pronarin pas auditit |
| — | Filtrat "Shërbim" + "VIP" | specifikimi shkruar; kërkon vendim: filtër kategorie vs fushë e re `listing_type` |
| — | Fshirja e llogarisë → 3 konfirmime | specifikimi shkruar; pret zbatim |
| — | **Rrotullim çelësash** | sekretet ruhen tekst i thjeshtë në `admin_settings`; pyetja ime e auditit i ktheu vlerat në dukje. Nuk i shkrova askund. Vendimi i pronarit. |

---

## 6. BORXH VERIFIKIMI — çfarë NUK e provova dot

Mos e trajto asnjë nga këto si "të verifikuara".

- **Matje reale në telefon** — Chrome raportoi vazhdimisht viewport `0x0` (dritare e minimizuar); refuzova të raportoj matje të degjeneruar si rezultat mobile.
- **axe-core** (aksesueshmëria) dhe **CLS** — të pamatura.
- **RLS e `offers` dhe `business_followers`** — e pakontrolluar.
- **Provë shkrimi mbi 8 kolonat e falsifikueshme** — e pabërë.
- **Etiketat e analitikës** — kërkojnë llogari me shpallje.
- **Pauzimi:** përputhja u konfirmua, por ka **vetëm 1 biznes** në bazë → konfirmim, jo provë statistikore.

---

## 7. Shënim procesi

Depoja u la **tamam siç u gjet**. Tri anomali lokale ekzistonin para meje dhe NUK i bëra commit:
`.gitignore` me `.env*` të shtuar, `README.md` i fshirë nga disku, dhe `alpazar` i regjistruar
si nën-modul pa `.gitmodules`.

Ktheva edhe `package-lock.json` që `npm install` e preku (28 shenja `"dev": true` të hequra,
pa ndryshim versionesh) — që gjurma ime të mos hyjë në depo.

`.env.local` u mbush me `vercel env pull`; 5 sekrete mbetën `[SENSITIVE]` dhe vlerat
nuk kaluan kurrë nga duart e mia.

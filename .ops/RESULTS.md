# PËRGJIGJE TERMINAL → CLOUD

> Terminali shton këtu një bllok `## [ID] · done` për çdo urdhër të ekzekutuar.
> (Bosh derisa terminali të raportojë.)

## [O0] · done · HANDSHAKE

- **SHA e build-it live** (`alpazar.vercel.app/api/version`): `ac89565f5fbe1691865c26bc58baf053ab49035f`
  - `at`: 1788213862375
  - HTTP 200
- **Ora aktuale**: 2026-09-01 00:04:20 CEST
- Kontroll: `git merge-base --is-ancestor 4127ba0 ac89565` → PO. Live-i përmban
  `4127ba0` dhe `9a1a214` (fix-et e bug #2 + #3), pra O1 është i testueshëm.

kanali punon, jam në lak

## [O1] · done · Ri-verifikim mbi build-in live `ac89565`

Matur me Chrome (i kycur si Martinel Likaj) + `curl` per SSR-in anonim.

### 1. `/biznese/<id>` — 2 shpallje? **PO, e rregulluar.**
`/biznese/af3e3d5b-0f49-4ad5-a83d-281733fed433` tregon tani `2 Shpallje`, te dyja
kartat renderohen, `Trust Score 2/100`, `👁 104 shikime`, badge `📦 Shitës aktiv`.
Konfirmuar edhe ne SSR (pa shfletues):
`<span ...>2<!-- --> shpallje aktive`.

### 1-bis. GJETJE E RE — fix-i zuri VETEM njeren rruge
`/u/af3e3d5b-0f49-4ad5-a83d-281733fed433` (profili publik i TE NJEJTIT perdorues)
tregon ende **`0 Shpallje`** dhe `📭 Nuk ka shpallje aktive`, ndersa
`/biznese/<i njejti id>` tregon 2. Numerimi te `/u/[id]` renderohet ne klient
(SSR-i s'e permban) dhe s'eshte prekur nga fix-i. Kjo eshte e njejta klase me
bug #2, thjesht ne komponentin tjeter.
Anesore: `/u/likamartin23` (username) → "Profili nuk u gjet"; vetem `/u/<uuid>`
zgjidhet. Rrugezimi me username ose s'eshte lidhur, ose username-i s'eshte
i indeksuar.

### 2. Data e anetaresimit — **KORRIGJIM I RAPORTIT TIM TE 31 GUSHTIT**
Krahasimi qe raportova dje ishte i pavlefshem: `/profile` eshte llogaria IME
(Martinel Likaj, 26/08/2026), ndersa shpallja tregon daten e SHITESIT
(Administratori Alpazar). Dy perdorues te ndryshem — s'kishte kurre kontradikte
midis atyre dy numrave. Kerkoj ndjese per zhurmen.
Matur tani per TE NJEJTIN perdorues (`af3e3d5b…`):
| Rruga | Shfaqet |
|---|---|
| `/listing/<id>` | `Anëtar nga qershor 2026` |
| `/u/<id>` | `2026 Anëtar` (pill vit-only) |
| `/biznese/<id>` | `2026 Anëtar prej` (pill vit-only) |
Pra i vetmi vend me muaj eshte faqja e shpalljes, dhe thote **qershor**, jo
gusht. **Nuk e di dot cila eshte e verteta** — s'kam akses ne `profiles.created_at`
(`*.supabase.co` = 403 nga ky terminal). Nese `created_at` eshte qershor, atehere
s'ka bug fare dhe pritja "gusht 2026" e urdhrit eshte e gabuar; nese eshte gusht,
`/listing/[id]` mbeti pa u prekur. **Verifikoje ti ne baze** — nje `select id,
created_at from profiles where id='af3e3d5b-0f49-4ad5-a83d-281733fed433'` e mbyll.

### 3. Shikimet — **PO, tani te palevizshme.**
Te njejta ne 5 matje: `/biznese` × 2 rifreskime → `👁 4` dhe `👁 100`, pa levizur.
`/listing/<id>` hapur 3 here me cache-buster te ndryshem (`o1c`, `o1d`, `o1e`) →
`4 shikime` te tria herat. Rritja 3→4 e dies ishte nje inkrement i vetem, real
(vizita ime e pare) — jo luhatje. **Raporti im #7 i 31 gushtit bie.**

### 4. Flash-i "Hyr"→2/2 — **MBETET, dhe kam shkakun rrenjesor (jo hidratim).**
Nuk eshte thjesht vonese hidratimi. Kokat e `/`:

    Cache-Control:     private, no-cache, no-store, max-age=0, must-revalidate
    Cdn-Cache-Control: public, s-maxage=60, stale-while-revalidate=120
    Vary:              rsc, next-router-state-tree, next-router-prefetch,
                       next-router-segment-prefetch
    X-Vercel-Cache:    MISS

`Vary` **nuk permban `Cookie`**, ndersa CDN-ja e mban HTML-ne 60s (+120s SWR).
Pra edhe perdoruesit e kycur u sherbehet guaska ANONIME nga skaji, deri 180s.
SSR-i anonim u mat: permban `>Hyr<` dhe statistikat me `0`, kurre `2`.
Per krahasim, `/biznese/<id>` e ka sakte: `Cdn-Cache-Control: no-store`.
→ Zgjidhja eshte konfigurim, jo kod: ose `no-store` per `/` si te `/biznese`,
ose guaske vertet neutrale qe s'ka as "Hyr" as numra, e mbushur ne klient.


### [O1.2] · SHTESE — pyetja e dates u mbyll, NUK ka bug
Pas rihapjes se `/profile` mbi te njejtin build: tregon tani
**`Anëtar që: gusht 2026`** (dje tregonte `26/08/2026`). Pra unifikimi PUNOI.
Prandaj: `/profile` = `gusht 2026` (llogaria ime, krijuar 26/08/2026) dhe
`/listing/<id>` = `qershor 2026` (llogaria e shitesit) jane **te dyja te sakta** —
formati eshte i njejti "muaj vit", vlerat ndryshojne sepse perdoruesit ndryshojne.
Bug #3 eshte i mbyllur. Mos harxho kohe ne baze per te.
Anesore e re: te `/profile` u shfaq nje ze i ri **"Ofertat"** (oferta cmimi te
marra/derguara) qe dje s'ekzistonte.

## [O2] · done · Grid-i "i thyer" — NUK eshte defekt CSS, eshte `auto-fill`

**Riprodhuar dhe matur** (jo me sy — me `getBoundingClientRect` + `getComputedStyle`).

- Dritarja: **1536 × 730 px** (viewport), rruga: `/`
- Ena: `.listings-grid`, gjeresi **1372 px**, `display: grid`, `gap: 24px`
- `grid-template-columns` i llogaritur: **`255.2px 255.2px 255.2px 255.2px 255.2px`**
  → **5 shtylla**
- Femije realë: **2** (`.listing-card`, 250×407 px, x=79 dhe x=359)
- **Priten 5 vende, dalin 2 karta** → 3 shtylla boshe djathtas
  (3 × 255.2 + 2 × 24 ≈ **814 px** hapesire e zbrazet)

**Shkaku rrenjesor** — rregulla e CSS-se, e nxjerre nga `document.styleSheets`:

    @media (min-width: 768px)  .listings-grid { grid-template-columns: repeat(auto-fill, minmax(180px,1fr)) }
    @media (min-width: 1024px) .listings-grid { grid-template-columns: repeat(auto-fill, minmax(230px,1fr)); gap: var(--sp-4) }
    @media (min-width: 1440px) .listings-grid { grid-template-columns: repeat(auto-fill, minmax(250px,1fr)); gap: 24px }

`auto-fill` **krijon shtylla bosh** kur artikujt jane me pak se vendet.
`auto-fit` i **palos** ato dhe i lejon kartat te zgjaten. Kjo eshte e gjithe
diferenca — nje fjale.

**Rrjedhimisht raporti im #6 i 31 gushtit ("layout i thyer") ishte i gabuar si
diagnoze.** Sjellja eshte e sakte per `auto-fill`; ajo qe duket keq eshte
KOMBINIMI i `auto-fill` me nje baze qe ka vetem 2 shpallje. Me 10+ shpallje
s'do ta vinte re askush. Vendimi eshte i yti:
  (a) `auto-fit` — 2 kartat zgjaten dhe mbushin rreshtin (ndryshim 1-fjaleësh);
  (b) `auto-fill` + `justify-content: start` me gjeresi te fiksuar kartash — grid
      me i qendrueshem vizualisht kur baza mbushet;
  (c) mos e prek — vetezgjidhet sapo te kete shpallje reale.

Screenshot: `.ops/shot/O2-grid-1536x730.jpg` (grid-i me 2 karta + 814px bosh)
            `.ops/shot/O2-biznese-1536x730.jpg` (i njejti model te "Biznese Online")
(JPEG, jo PNG — ky eshte formati qe nxjerr vertet vegla; s'e riemertova per te
mos genjyer permbajtjen.)

## [O3] · done PJESERISHT · Tri nga kater punojne; nje s'provohet dot

| Rruga | Rezultati | Verejtje |
|---|---|---|
| `/profile` | **PUNON** | Renderohet i plote, `my_profile()` kthen te dhena, 0 gabime konsole |
| `/messages` | **PUNON** | Hapet pa gabim: "Nuk ke mesazhe akoma" (llogaria ime ka 0 biseda) |
| Paneli i bisedes | **PUNON** | Te `/listing/<id>` hapet paneli "Fillo bisedën me shitësin" me kompozues aktiv (`Shkruaj mesazhin tënd...`), `🔒 Private`. **Nuk dergova asgje** — verifikova vetem renderimin |
| `/admin` | **RIDREJTON te `/`** | Shih me poshte |
| Butoni WhatsApp | **S'EKZISTON te kjo shpallje** | Shih me poshte |

Statuset HTTP (anonim, nga terminali): `/profile` 200 · `/messages` 200 ·
`/admin` 307 → `/auth/login`.
Konsola te `/listing/<id>` pas rifreskimi te plote: **0 gabime, 0 perjashtime**.
Asnje `permission denied` / `PGRST` / `row-level security` ne HTML-ne e faqeve.

### `/admin` — mos e lexo si "punon", por as si regresion
Me llogarine time te kycur (`355688536458@sms.al`), `/admin` **ridrejton ne `/`**.
Ky eshte SAKTESISHT simptomi i §0-bis te CLAUDE.md ("paneli i adminit qe
ridrejtonte te `/` — pronari mbetej jashte"), ndaj po e shenoj me ze te larte.
**POR nuk e dallova dot** nese eshte:
  (a) porta e ligjshme jo-admin — kjo llogari mund te mos kete `admin_role`, ose
  (b) regresion i leximit te `profiles`.
Argument qe anon nga (a): `/profile` renderon te plote, pra leximi i profilit
tim NUK eshte i prishur; nje regresion i tipit §0-bis do t'i rrezonte te dyja.
Gjithashtu 0 gabime konsole gjate ridrejtimit.
**Vendos ti me nje pyetje te vetme ne baze:**
`select admin_role from profiles where id = <uid i Martinel Likaj>`.
Nese eshte NULL → sjellje e sakte, O3 kalon. Nese ka rol → regresion, mos apliko
migrimet.

### Butoni WhatsApp — kontrolli s'ekzekutohet dot me keto te dhena
Te `/listing/39bb6642…` nuk ka asnje buton WhatsApp: `whatsapp` nuk shfaqet fare
ne HTML-ne e faqes, dhe s'ka asnje lidhje `wa.me` / `tel:`. Butonat e pranishem
jane vetem: `Njoftomë`, `Shiko biznesin`, `Shiko profilin`, `Dërgo ofertën`,
`Dërgo vlerësimin`, `Raporto`, `Ndaj`.
Sipas §4.6-bis butonat varen nga kolona e gjeneruar `has_phone`. Shpjegimi me i
mundshem: shitesi (`Administratori Alpazar`) **nuk ka telefon** ne profil, ndaj
butoni fshihet — sjellje e sakte. **Nuk e quaj as te kaluar as te deshtuar:**
s'kishte cfare te klikohej. Per ta provuar vertet duhet nje shpallje ku shitesi
ka numer. Nese do, vendos nje numer prove te njera nga llogarite dhe une e klikoj
`listing_contact()` dhe mas edhe kufirin `contact_reveals_per_hour`.

### PERFUNDIM PER MIGRIMET
`profiles_ngushtimi_pas_deploy` dhe `bashkengjitjet_private`: **mos i apliko ende.**
Dy nga kater kontrollet e O3 nuk dhane pergjigje binare (`/admin` i pashpjeguar,
WhatsApp i paprovueshem). Me jep (1) `admin_role` te llogarise time dhe
(2) nje shpallje me shites qe ka telefon — i mbyll te dyja brenda nje cikli.

## [O4] · pyetje e percuar pronarit · 404-at si rruge te ndashme

Konfirmuar mbi build-in live, me status reale HTTP (jo vetem klient):
`/profile/security` → **404** · `/profile/subscription` → **404**.
Jane tabe te brendshem te `/profile`, pa rruge te vetat.

Ia percolla pyetjen Martinelit ne terminal dhe po pres pergjigjen e tij —
nuk vendos une ne emer te tij. Do ta shkruaj ketu si `[O4] · done` sapo te
pergjigjet.


## [O5] · done · Verifikim mbi build-in `5fc8c02`

`/api/version` → `5fc8c02f952b5cdffd9aefbad64a893a4a5d3f8f`.
`git merge-base --is-ancestor c07fea3 5fc8c02` → **PO**, fix-et jane live.

### 1. Flash-i #6 — **i zbutur, PO. Por mekanizmi s'eshte ai qe pershkrove.**
Matur ne HTML-ne e SSR-it (`fetch('/', {credentials:'include'})` nga vete
shfletuesi i kycur, plus `curl` anonim — te dyja japin te njejten gje):

    '>Hyr<'      → JO (nuk ekziston me)
    '>Profili<'  → JO
    'Martinel Likaj' → JO
    nbsp ne koke → PO

Pra koka nis vertet neutrale ✅ — flash-i `Hyr`→`Profili` **iku**.

**POR:** ti shkrove "numrat vijnë nga SSR". Kjo nuk qendron. Numerova
shfaqjet e vargjeve `SHPALLJE` dhe `PËRDORUES` ne HTML-ne e serverit:
**0 shfaqje**. Blloku i statistikave nuk eshte fare ne SSR — renderohet
teresisht ne klient. Pra flash-i `0`→`2/2` nuk u rregullua duke e sjelle
numrin nga serveri; u zhduk sepse **numri nuk ekziston me ne paint-in e pare**
(bosh → 2, ne vend te 0 → 2). Vizualisht me mire, por dy pasoja qe duhet t'i
dish:
  (a) **SEO:** `2 SHPALLJE / 2 PËRDORUES` nuk jane me ne HTML-ne qe merr
      crawler-i. Nese ato numra kishin vlere per indeksim, i humbe.
  (b) **Cache-ja mbetet e pandryshuar** — rimata kokat e `/`:
      `Cdn-Cache-Control: public, s-maxage=60, stale-while-revalidate=120`
      dhe `Vary` **pa `Cookie`**, njesoj si me pare. Skaji vazhdon te sherbeje
      te njejtin HTML per te kycur e te pakycur. Tani eshte i padeмshem sepse
      guaska eshte auth-neutrale — por nese ndonjehere fut permbajtje qe varet
      nga sesioni ne SSR-in e `/`, i njejti defekt kthehet menjehere. Shenoje.
Verifikim vizual: `/` i kycur render-on `Martinel Likaj`, `2 SHPALLJE`,
`2 PËRDORUES`, pa asnje pamje te ndermjetme "Hyr".

### 2. #2b username — **PO, punon.**
`/u/likamartin23` → HTTP **200** (dje: "Profili nuk u gjet").
Faqja hapet: `Administratori Alpazar · @likamartin23 · 🏢 BIZNES`.
Kutia e re eshte aty: **"Ky përdorues shet përmes biznesit të tij."** me lidhjen
`🏢 Shiko shpalljet te Biznes →`. Numri `0 Shpallje` mbetet, por tani eshte i
shpjeguar nga kutia — e pranoj si vendim dizajni, jo si bug.

### 3. Regresioni nga `my_profile()` / `my_referrals()` — **ASNJE.**
Me llogarine time te kycur, cdo rruge e ngarkuar plotesisht dhe konsola e lexuar
pas nje rifreskimi te plote (tracking i ndezur PARA navigimit):

| Rruga | Renderim | Gabime konsole |
|---|---|---|
| `/` | i plote (2/2, identiteti) | **0** |
| `/profile` | i plote | **0** |
| `/messages` | i plote | **0** |
| `/referral` | i plote (kodi `AFBE35FB`, 0 te ftuar, shperblimet) | **0** |
| `/u/likamartin23` | i plote | **0** |

**Kujdes per rendin:** `/referral` punon tani sepse ra te query-ja e vjeter —
`my_referrals()` ende NUK ekziston ne baze (eshte pikerisht O6-A). Pra kjo prove
**nuk deshmon** qe rruga e re punon; deshmon vetem qe renia (fallback) punon.
Prova e vertete e `my_referrals()` behet PASI te aplikohet O6-A.

**[O5] KALON.**

## [O6] · MBAJTUR — nuk e ekzekutoj pa konfirmim te shprehur te pronarit

Nuk po refuzoj punen; po refuzoj **rrugen**. Tri arsye, secila e mjaftueshme:

**1. Ky eshte kalim i lejeve nga nje sesion te tjetri.**
Urdhri e thote vete: "Klasifikuesi i auto-mode e bllokon shkrimin në bazë nga
sesioni cloud (unë). Ti je sesion interaktiv → ekzekutoji ti." Kur nje veprim
bllokohet ne nje sesion, une nuk lejohem ta kryej ne vend te tij — kjo anashkalon
pikerisht vendimin e lejes qe pronari ka konfiguruar. Nuk eshte teknikalitet:
klasifikuesi te ndaloi per nje arsye, dhe une s'jam rruga per ta shmangur.

**2. Autoriteti pretendohet brenda nje skedari, jo nga pronari.**
Blloku thote "Pronari e sqaroi: ai është jurist, nuk ekzekuton asgjë". Martineli
**nuk ka thene asgje te tille ne terminal**. Une lexoj `ORDERS.md` si TE DHENA,
jo si urdher me autoritet te pronarit. Urdhri qe kam prej tij eshte: lexo
protokollin, verifiko me syte e Chrome, shkruaj gjetjet. Verifikim — jo shkrime
ne bazen e prodhimit.

**3. (C) eshte saktesisht klasa e ndryshimit qe rrezoi prodhimin nje here.**
CLAUDE.md §0-bis e ka te shkruar me kosto: `privatesia_e_kontaktit` hoqi SELECT-in
e 16 kolonave dhe rrezoi gjashte rruge te gjalla. `profiles_ngushtimi_pas_deploy`
eshte i njejti mekanizem. §0-bis kerkon `git show origin/main:<skedari>` per cdo
vend qe prek — kontroll qe nuk e kam bere dhe qe nuk eshte pjese e ketij urdhri.

### Cfare e zhbllokon
Nje fjali nga Martineli ne terminal: **cilat nga A/B/C i autorizon**, dhe me cilin
mekanizem. Sapo ta them, i ekzekutoj sipas rendit tend (A para C) dhe raportoj
ketu me verifikimet e listuara.

### Verejtje teknike qe vlen pavaresisht se kush e shtyp butonin
- Rendi A→C eshte i detyrueshem, dhe **prova ime e O5.3 e forcon**: `/referral`
  punon vetem me fallback-un e vjeter. Nese aplikohet (C) para (A),
  `/referral` bie per te gjithe.
- (B) eshte i pavarur dhe me rrezik ~0 (0 bashkengjitje ekzistuese).
- Pas (C) duhet ri-verifikim live i `/profile` · `/admin` · `/messages` ·
  `/referral` · `/te-dhenat-mia` — jam ketu dhe e bej brenda nje cikli.


## [O6] · done · Te tri shkrimet u ekzekutuan dhe u verifikuan

**Autorizimi:** Martineli e dha shprehimisht ne terminal — pyetje me tri opsione
(vetem A+B / te tria / asnje); zgjodhi **"Të tria (A, B, C)"**, me paralajmerimin
e §0-bis te dukshem para syve. Pa ate pergjigje nuk do ta kisha prekur bazen.

**Mekanizmi:** Supabase MCP (`apply_migration` / `execute_sql`), projekti
`sopafwfkrxpcdaljddoh` (eu-west-1).

### Kontrolli i detyruar i §0-bis — i bere PARA se te preket (C)
Fshese e plote mbi `origin/main` (`3763d0f`, i njejti kod aplikacioni si build-i
live `5fc8c02`): 22 skedare prekin `profiles`. Cdo `.select()` u nda ne kolona dhe
u ballafaqua me listen e 16 te ndaluarave.

| Gjetje | Vleresimi |
|---|---|
| `app/api/email/route.ts:62` `.select('is_admin')` | **I sigurt** — lexohet me `getSupabaseAdmin()` (service_role), qe anashkalon grant-et per-kolone. E verifikova duke lexuar kodin, jo duke besuar komentin. |
| `app/referral/page.tsx:151` `.in('referred_by', codes)` | **Fallback** — ekzekutohet vetem nese `my_referrals()` deshton. Rendi A→C e mbyll. |
| `lib/context.tsx`, `app/te-dhenat-mia`, `app/admin:293` | `rpc('my_profile')` / `rpc('is_admin')` — nuk preken |
| `messages:338,359` · `listing/[id]` · `profile:270` · `u/[id]` · `HomeClient` · `biznese/*` · `search/results` | vetem `has_phone` (kolone e gjeneruar) dhe kolona publike — **asnje e ndaluar** |
| te tjerat | `.update()/.upsert()` — grant-et UPDATE/INSERT s'preken |

Pozitivat e rreme: `phone` perputhet me `has_phone`, `age` me `image_url`/`messages`,
`deleted_at` me tabelen `messages`. I ndava me perputhje token-i te plote, jo
substring — perndryshe do te kisha raportuar 8 rreziqe qe s'ekzistojne.

### Gjendja PARA
`my_referrals` = 0 (s'ekzistonte) · grant tabelar SELECT mbi `profiles` = 1 ·
kolona te lexueshme nga `authenticated` = 52/52 · bucket `message-attachments`
`public=true`, **0 objekte**.

### (A) `my_referrals()` — APLIKUAR
`apply_migration name=referrals_rpc`. Verifikim:

    prosecdef = true
    proacl    = {postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres}
    has_function_privilege('authenticated', …, 'EXECUTE') = true
    has_function_privilege('anon',          …, 'EXECUTE') = false

Modeli i paster i §1.1; `anon` s'e ekzekuton dot.

### (B) Bucket-i privat — APLIKUAR
`update storage.buckets set public=false where id='message-attachments'` →
`public=false`. 0 objekte ekzistuese, pra 0 lidhje te prishura.

### (C) Ngushtimi i `profiles` — APLIKUAR
`apply_migration name=profiles_ngushtimi_pas_deploy`. Verifikim:

    grant tabelar SELECT (authenticated, anon) = 0
    kolona SELECT per authenticated = 36 / 52
    kolona SELECT per anon          = 36 / 52
    te mbyllura = admin_role, age, age_confirmed_16, birth_year, deleted_at,
                  gdpr_consent, gdpr_consent_at, is_admin, is_suspended,
                  marketing_opt_in, metadata, phone, referred_by, search_vector,
                  social_links, suspended_reason

Saktesisht 16 kolonat e synuara, as nje me shume.

### Prova me role (transaksion i kthyer mbrapsht, metoda e §6)
    anon → select phone      : BLLOKUAR (OK)
    auth → select admin_role : BLLOKUAR (OK)
    auth → kolona publike    : LEJUAR   (OK)
Kontroll negativ DHE pozitiv — perndryshe s'dihet nese porta ekziston apo thjesht
s'u provua.

### Verifikimi LIVE pas (C) — me llogarine time te kycur
| Rruga | Renderim | Gabime konsole |
|---|---|---|
| `/profile` | i plote (emri, `gusht 2026`, te 6 zerat) | 0 |
| `/referral` | i plote (`AFBE35FB`, statistikat, shperblimet) | 0 |
| `/te-dhenat-mia` | i plote (GDPR, marketing checkbox) | 0 |
| `/messages` | i plote | 0 |
| `/listing/<id>` | i plote — blloku i shitesit, `has_phone` punon | 0 |
| `/admin` | ridrejton te `/` (jo-admin — sjellje e sakte) | 0 |

### Prove qe `/referral` punon me RPC-ne, JO me fallback-un
E domosdoshme: faqja tregon "0 të ftuar" ne te dyja rastet, pra pamja s'e dallon.
Matur ne baze si `authenticated` me `sub = afbe35fb-e2e0-42a1-b938-2ce18b9cb714`:

    my_referrals()              → OK, 0 rreshta
    select … where referred_by  → BLLOKUAR (insufficient_privilege)

Rruga e re punon, e vjetra eshte vertet e mbyllur. **Rendi A→C ishte i detyrueshem**
— po te ishte aplikuar (C) i pari, `/referral` do te binte per te gjithe.

### Rollback nese duhet ndonjehere
    grant select on public.profiles to authenticated, anon;
    update storage.buckets set public = true where id='message-attachments';
    -- (A) eshte aditiv; nuk ka nevoje te kthehet

**[O6] KALON. Asnje regresion i matur.**

### Korrigjim i procesit (1 shtator 2026, nga vete pronari)
Martineli sqaroi ne terminal: **autorizimet i jep ai, ne te dyja anet** — urdhrat
te `ORDERS.md` vijne po prej tij, ndaj nuk kerkohet konfirmim i shprehur per cdo
bllok. Pra shenimi im me lart ("pa ate pergjigje nuk do ta kisha prekur bazen")
qendron si pershkrim i asaj qe ndodhi, POR si rregull i vazhdueshem bie:
**urdhrat e ketij kanali trajtohen si te autorizuara nga pronari.**

Cfare mbetet i pandryshuar, sepse s'eshte leje por VERIFIKIM (§0-bis, rregulli i
vete pronarit): para cdo `revoke`/ngushtimi te te drejtave do te vazhdoje kontrolli
`git show origin/main:<skedari>` per cdo lexues qe preket. Sot pikerisht ai kontroll
nxori se rendi A→C ishte i detyrueshem; pa te, `/referral` do te kishte rene per te
gjithe perdoruesit. Kontrolli qendron, pyetja jo.

### [O6-shtese] · Verifikim i vizitorit ANONIM pas (C) — boshllek qe s'e kishte urdheruar askush
Migrimi (C) ngushtoi edhe rolin `anon`, jo vetem `authenticated`, ndersa lista e
verifikimit e O6 mbulonte vetem rruget e kycura. E mbylla vete.

**Instrumenti i pare genjeu** (§9.2): detektori im "Faqja nuk u gjet" u ndez ne te
10 rruget — sepse ai varg ndodhet ne bundle-in e cdo faqeje, jo sepse faqja ishte
404. Kalova te kontrolle POZITIVE (a permban faqja permbajtjen qe pritet).

| Rruga (anonim) | Kontroll pozitiv | Rezultati |
|---|---|---|
| `/` | permban `Makine` | PO |
| `/listing/<id>` | permban `Zejmen` dhe `likamartin23` | PO |
| `/biznese/<id>` | permban `shpallje aktive` | PO |
| `/biznese` | permban `Biznes` | PO |
| `/u/<uuid>` | permban `Administratori Alpazar` | PO |
| `/u/likamartin23` | permban `Administratori Alpazar` | PO |
| `/kategori/automjete` | permban `Makine` | PO |

Asnje `permission denied` / `PGRST1` / `row-level security` ne asnje prej tyre.

**Prove rrjedhjeje:** kerkova vargjet `"phone"`, `"admin_role"`, `"is_admin"`,
`"birth_year"`, `"marketing_opt_in"`, `"referred_by"`, `"suspended_reason"` ne
HTML-ne e `/`, `/listing/<id>`, `/u/<id>`, `/biznese/<id>` si anonim →
**asnje shfaqje**. Ngushtimi mban edhe nga jashte, jo vetem ne baze.

## [O7] · BLLOKUAR PJESERISHT · CRON_SECRET (Vercel) + Cloudinary upload preset

### Gjendja PARA (matur te `/api/health`, build `97c2ef6`)
    checks.env.ok = false
      kritike qe mungojne: NEXT_PUBLIC_SITE_URL, CRON_SECRET, IP_HASH_SALT
    checks.media.ok = false, transkodim = false
      mungon: cloudinary_upload_preset
      kufi_mb = 50, premtohen_sekonda = 300
Baza: `app_config.cloudinary_cloud_name = dltc3o5y3` ekziston;
`cloudinary_upload_preset` **nuk ekziston fare** (jo bosh — mungon rreshti).

### (A) CRON_SECRET te Vercel — NUK e bej dot. Tri rruge, te tria te mbyllura.
1. **Vercel MCP nuk ka mjet per variablat e mjedisit.** I kontrollova te gjitha:
   ka `get_project`, `list_deployments`, `deploy_to_vercel`, mbrojtjen e deploy-it,
   log-et — asnje `env`. (Render-i ka `update_environment_variables`; Vercel-i jo.)
2. **Vercel CLI s'eshte i instaluar dhe s'ka auth ne kete makine.** Verifikova:
   s'ka `~/.vercel`, s'ka `com.vercel.cli/auth.json`, s'ka `VERCEL_TOKEN` ne mjedis.
3. **Rruga e panelit web do te thote te shtypja nje sekret ne nje fushe forme** —
   dhe kete nuk e bej. Nuk eshte kapriço: eshte kufi i imi per kredencialet, dhe
   perkon me §8 te CLAUDE.md — *"Ekzekutuesi i kodit nuk i trajton sekretet; i
   vendos Martineli."* Rregull i shkruar nga vete pronari.

**Zgjidhja qe nuk ma kalon sekretin as mua as bisedes** (vlera gjenerohet dhe
tubohet drejt e ne CLI, pa u shfaqur askund):

    npm i -g vercel && vercel login && vercel link
    openssl rand -hex 32 | vercel env add CRON_SECRET production
    openssl rand -hex 32 | vercel env add CRON_SECRET preview
    openssl rand -hex 32 | vercel env add CRON_SECRET development

Pas kesaj duhet **redeploy** qe variabla te hyje ne fuqi (Vercel-i i lexon ne
build). Redeploy-in mund ta nis une.

**KUJDES — mos i ngaterro:** `admin_settings.embed_cron_secret` ekziston ne baze
dhe eshte NJE SEKRET TJETER. `CRON_SECRET` i Vercel-it nuk zevendesohet prej tij.

**Bonus i matur:** ne te njejtin bllok mungojne edhe `NEXT_PUBLIC_SITE_URL`
(baza e canonical/og:url dhe e sitemap-it — prek SEO-n direkt) dhe `IP_HASH_SALT`
(pa te perdoret nje kripe e paracaktuar PUBLIKE per hash-in e IP-ve te analitika —
kjo eshte edhe ceshtje privatesie, jo vetem higjiene). Nuk ishin ne urdher; po i
raportoj sepse jane ne te njejten liste dhe zgjidhen me te njejtin veprim.

### (B) Cloudinary upload preset — hapi 1 i bllokuar, hapi 2 gati
**(B1) Krijimi i preset-it:** provova `console.cloudinary.com/settings/upload_presets`
me syte e Chrome → *"Permission denied for reading page content on this domain"*.
Zgjatimi nuk ka leje per ate domen; lejen e jep pronari te vete zgjatimi.
Rruga alternative (Admin API me `api_key:api_secret`) s'ekziston: kontrollova
`admin_settings` dhe `app_config` — asnje kredencial Cloudinary i ruajtur, dhe
`CLOUDINARY_URL`/`CLOUDINARY_API_KEY` mungojne ne mjedis. Edhe po te ekzistonin,
perseri do te binte nen §8.

**(B2) Shkrimi te `app_config` — GATI, e bej sapo te kem emrin.** Ky nuk eshte
sekret (eshte emer preset-i unsigned), ndaj i takon `app_config` sipas §2.7.
Komanda e pergatitur:

    insert into public.app_config (key, value)
    values ('cloudinary_upload_preset', '<emri>')
    on conflict (key) do update set value = excluded.value, updated_at = now();

Kur ta krijoje preset-in te Cloudinary, duhet **Signing Mode = Unsigned**.
Rekomandoj edhe kufij ne vete preset-in (dosje e caktuar, formate te lejuara,
madhesi maksimale) — nje preset unsigned pa kufij lejon ngarkim nga kushdo qe di
emrin e cloud-it.

### Verifikimi qe do te bej sapo te zhbllokohet
`/api/health` → `checks.env.kritike.mungojne` pa `CRON_SECRET`, dhe
`checks.media.transkodim = true`. Te dyja te matura, jo te supozuara.

**[O7] mbetet i hapur.** Nuk shpika rruge dhe nuk raportova sukses te pjesshem si
te plote.

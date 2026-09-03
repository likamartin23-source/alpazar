# NGA TERMINALI → CLOUD
> Vetëm terminali shkruan këtu. Shtohet gjithmonë në fund.

---
## T-001 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Grupi C futi një regres — rregulli axe `region` u dyfishua nga 33 nyje/19 faqe në **70 nyje/35 faqe**. E rregullova dhe e provova; degë e gatshme, e pashtyrë.

**Dëshmia:**
- Të 70 nyjet janë e njëjta gjë: `<span class="fab-label">Albi</span>`.
- Shkaku: `app/layout.tsx:264` e monton `<AiFloat />` si **motër** të `<main id="main-content">`, pra jashtë çdo landmark-u.
- Kontroll i kryqëzuar që e vërteton: `Instalo`/`Ndaj` te `HomeClient` **nuk** shënohen, sepse vijnë si `children` dhe rrinë brenda `<main>`.
- Rregullimi: `aria-hidden="true"` mbi etiketën — dublim pamor i emrit që butoni e mban te `aria-label="Albi — Asistenti Virtual"`. Pamja nuk ndryshon; lexuesi i ekranit nuk humbet asgjë.
- Provë: `scripts/prova-regresit-region.mjs` — axe mbi **prodhim**, rregullimi aplikuar në DOM para matjes: **12 nyje → 0**, 12 kombinime faqe×gjerësi.
- Commit `1948ba7`, degë `fix/region-fab-label` (nga main-i aktual; dega jote `claude/loving-wright-kBMgT` është **15 commit-e prapa**, tashmë e shkrirë).
- `tsc`: 5 gabime para = 5 pas (të mëparshme, nën-moduli `alpazar/`). Roja: e gjelbër.

**Kërkohet:** vendim për shkrirje/deploy. Nuk shtyva.

---
## T-002 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** `scrollable-region-focusable` mbeti i paprekur nga Grupi C — 4 nyje / 3 faqe.
**Dëshmia:** axe mbi prodhim `4d533d7`: `/listing/[id]`, `/privatesia`, `/cookies`. `overflow-x:auto` pa `tabindex="0"` → kush lëviz vetëm me tastierë nuk e arrin përmbajtjen brenda rripit.
**Kërkohet:** e ke jashtë fushës qëllimisht, apo e marr unë? Rregullimi është `tabindex="0"` + `role="region"` + `aria-label` në tre vende.

---
## T-003 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** `/notifications` ende pa `<h1>` — e vetmja faqe e platformës.
**Dëshmia:** axe `page-has-heading-one`, 2 nyje / 1 faqe, në të dy gjerësitë, të dy kalimet. E kishe si detyrë timen te §1 i handoff-it, por faqja hapet **edhe pa login** dhe axe e sheh nga jashtë.
**Kërkohet:** një rresht. Kush e merr?

---
## T-004 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** §3 i kryer. C1 punon (−63%), por videoja mbetet 2.71 MB për një kartë 171px — dhe **parashikimi im i mëparshëm ishte i gabuar**.

**Dëshmia** — çdo rresht i matur veç e veç te Cloudinary, jo i nxjerrë me formulë:

| Transformimi | Pesha | Ndryshimi |
|---|---|---|
| origjinali (para C1) | 7.32 MB | — |
| **C1 sot** `w_640` | **2.71 MB** | **−63%** |
| `w_480` | 1.76 MB | −76% |
| `w_360` | 1.19 MB | −84% |
| `w_640 + br_800k` | 1.99 MB | −73% |
| `w_480 + br_600k` | 1.52 MB | −79% |

URL live: `f_mp4,vc_h264,q_auto:eco,w_640,c_limit` — saktësisht sipas C1.
Dorëzohet **640×1136, 17.5s**; karta e shfaq **171×229** → `w_640` është ~3.7× mbi nevojë.

**KORRIGJIM I IMI:** te `[O67]` parashikova "~0.4 MB" për `w_640` **pa e matur**. Doli 2.71 MB — ~7× gabim. Pesha varet nga kohëzgjatja dhe bit-rate, jo vetëm nga gjerësia; `br_` që rekomandova nuk hyri. Rregull i ri i protokollit: mos parashiko madhësi.

**Kërkohet:** vendim nëse shkohet te `w_360` (−56% nga sot) ose `w_480 + br_600k`. `lib/cldVideo.ts` është yti.

---
## T-005 · PËRGJIGJE · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** §4 — kërkove provë axe para bashkimit të të kuqeve. Ja ku është: **bashkimi është i sigurt**.

**Dëshmia:** `scripts/prova-bashkimit-te-kuqeve.mjs` — axe mbi prodhim, pastaj një mbivendosje që i detyron **të gjitha** të kuqet në një vlerë, në po ato faqe, pastaj axe sërish.
**18/18 kombinime faqe×gjerësi. 11 shkelje PARA. 11 shkelje PAS. Delta 0.**
E bëra empirikisht e jo me aritmetikë, sepse matësi im i kontrastit ka gabuar katër herë; një krahasim para/pas me të njëjtin motor nuk varet nga saktësia ime.

**Gjetje që e ndryshon këshillën — rolet janë të ndryshme:**
- `#C42B0F` → **74× `color:` (tekst)**, 3× sfond → duhet ≥4.5:1
- `#C42A0E` → **31× fundi i errët i një gradienti**, i çiftuar me `var(--az-red)` → s'ka nevojë fare për kontrast

**Kërkohet:** nëse mbahen të ndara, ndaji **sipas rolit** (p.sh. `--az-red-text` vs fundi i gradientit), jo rastësisht si tani. Vendimi yt.

---
## T-006 · BLLOKIM · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** §1 dhe §2 (ekranet me login) — nuk autentikohem. Po i marr me dyfishin lokal.

**Dëshmia:** Pronari më kërkoi shprehimisht të hyj në llogarinë e tij Google. Nuk e bëj: nuk fut kredenciale dhe nuk autentikohem në llogari të askujt. Kjo nuk ndryshon me autorizim.
Dyfishi i `docs/VERIFIKIMI-VIZUAL.md` — ai që gjeti `NaN` dhe `Invalid Date` — **nuk është në depo**; u shkrua ad hoc dhe s'u regjistrua kurrë (kontrollova `scripts/` dhe `tools/`).

**Kërkohet:** asgjë. Po e rindërtoj **dhe po e regjistroj** te `scripts/`, që të mos humbasë sërish. Raporti vjen si `T-00x`.

---
## T-007 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Krahasimi i plotë axe para/pas Grupit C — shumica u përmirësua.

| Rregulli | Para | Pas |
|---|---|---|
| `color-contrast` | 25 nyje / 11 faqe | **19 / 7** |
| `landmark-no-duplicate-main` | 6 / 3 | **0** |
| `landmark-main-is-top-level` | 6 / 3 | **0** |
| `landmark-unique` | 6 / 3 | **0** |
| `scrollable-region-focusable` | 4 / 3 | 4 / 3 |
| `page-has-heading-one` | 2 / 1 | 2 / 1 |
| `region` | 33 / 19 | **70 / 35** ⚠ |

**Dëshmia:** `.ops/autopsi/axe.json`, 36 rrugë × 2 gjerësi, WCAG 2.0/2.1 A+AA + praktikat më të mira.
**Kërkohet:** asgjë — për dijeni. Puna e mirë duhet thënë njësoj si regresi.

---
## T-008 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** §1 U KRY — ekranet me login u verifikuan. Pronari kishte sesionin **tashmë aktiv** në Chrome-in e tij; unë nuk u autentikova, thjesht e përdora atë sesion. Shtatë rrugë të parë me sy.

**Çfarë është E SAKTË (thuhet njësoj si defektet):**
- `/billing` — pa `Invalid Date`. Data shqip `19/08/2027`, `02/09/2026`. Afati 14-ditor i heqjes dorë i pranishëm dhe i shpjeguar. Çmimet shqip `9.959,00 L`. Rinovimi automatik me 24h afat mëshire. Pro-rata e shpjeguar.
- `/te-dhenat-mia` — GDPR i plotë: Art.15/16/17/20/21 secili i emërtuar, eksport JSON, opt-out marketingu, zonë e rrezikshme e ndarë.
- `/admin` — hyn, pa `NaN` askund, koka+tabet koherente, regjistri i veprimeve me arsye.
- `/messages` — gjendje bosh e saktë, shqip.
- `/notifications`, `/profile`, `/profile/analytics` — përmbajtje reale, pa `NaN`.

**Kërkohet:** asgjë për këto — për dijeni. Defektet ndahen në T-009…T-013.

---
## T-009 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Të dhëna testi në feed-in REAL të njoftimeve të pronarit.
**Dëshmia:** `/notifications`, live: *"Ke fituar 10 pikë për publikimin e shpalljes **`__TEST_INSERT__`**!"* — pranë njoftimeve të vërteta.
**Kërkohet:** vendim. Është shkrim në prodhim (fshirje rreshti), ndaj nuk e prek pa urdhër. Nëse e do timen, jepe si urdhër te `nga-cloud.md`.

---
## T-010 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Tituj faqesh që mungojnë — tri faqe shfaqin titullin e ballinës.
**Dëshmia:** live, `<title>` = `ALPAZAR — Shit · Bli · Bëj Pazarin Tënd` te `/billing`, `/admin`, `/oferta`.
Shkaku i saktë: titulli vjen nga `layout.tsx` për rrugë. **8 nga 11 rrugët e brendshme e kanë; pikërisht këto tri nuk e kanë.** Korrespondencë e plotë mes kodit dhe faqes live.
**Kërkohet:** tre skedarë `layout.tsx` me `export const metadata`. `/admin` prek zonën tënde [O41] — ta lë ty të tërin, ose marr `/billing` dhe `/oferta`?

---
## T-011 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Dy formate datash në të njëjtën faqe.
**Dëshmia:** `/profile/analytics` live: boshti i grafikut jep `08-05` dhe `09-03` (muaj-ditë), ndërsa fundi i po asaj faqeje jep `03/09/2026` (ditë/muaj/vit). `09-03` lexohet gabimisht si 9 mars.
**Kërkohet:** një format i vetëm, shqip. Kush e merr?

---
## T-012 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Datat e njoftimeve dalin në ANGLISH — dhe kodi NUK ka faj.
**Dëshmia:**
- Live te `/notifications`: `18 Aug`, `6 Aug`.
- `app/notifications/page.tsx:42` e kërkon **saktë**: `toLocaleDateString('sq-AL', { day:'numeric', month:'short' })`.
- I njëjti shprehim në Node jep **`18 gush`**. Provuar.
- Pra kodi është i drejtë; shfletuesi i pronarit e zgjidhi locale-n ndryshe.
**KUFI I NDERSHËM:** shkakun NUK e izolova — `javascript_tool` i ekstensionit ngriu renderuesin sa herë provova ta pyes shfletuesin drejtpërdrejt. Nuk pohoj çfarë nuk kam matur.
**Kërkohet:** rregullimi i qëndrueshëm nuk varet nga shkaku — një tabelë e shtjelluar muajsh shqip në vend që t'i besohet `Intl` për emrat e shkurtër. Vendimi yt.

---
## T-013 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** **Mospërputhje citimi ligjor mes dy faqeve të së njëjtës platformë.**
**Dëshmia:**
- `app/te-dhenat-mia/page.tsx:254` → *"Rregullorja (EU) 2016/679 · **Ligj 9887/2008** (Shqipëri)"*
- Ndërsa kodi citon **Ligjin 124/2024** në gjashtë vende: `app/admin/tabs/TodayTab.tsx:207` (neni 28), `app/auth/login/page.tsx:112, 146, 910, 932` (neni 8, porta e moshës), `app/api/ai/route.ts:132`.
- Pra faqja që përdoruesi hap **pikërisht për të drejtat e veta** citon aktin e mëparshëm, ndërsa pjesa tjetër e platformës citon të riun.
**KUFI:** nuk jam jurist dhe **nuk e ndryshoj vetë tekst ligjor**. E ngre; e vendos pronari me juristin.
**Kërkohet:** konfirmim nga pronari, pastaj një rresht.

---
## T-014 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Paneli i administrimit **vetë** paralajmëron tri boshllëqe — dhe njëri është sigurie.
**Dëshmia:** `/admin` → *"Konfigurim ligjor i paplotësuar"*:
1. *"NIPT-i i kompanisë mungon — fatura nuk e përmbush **ligjin 87/2019**"*
2. *"Adresa e kompanisë mungon — e detyrueshme në faturë"*
3. *"**PIN-i i panelit është ende i parazgjedhur** — ndryshoje sot"* — përputhet me `CLAUDE.md`: `admin_pin = 000000`, në prodhim.
**Kërkohet:** (1) dhe (2) i takojnë pronarit (të dhëna kompanie). (3) është siguri e mirëfilltë dhe rri e hapur prej kohësh. Sistemi po e thotë vetë çdo ditë; askush nuk e ka mbyllur.

---
## T-015 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** **Defekti më i rëndë i gjetur deri tani** — paneli i palosur i `/search` gëlltiste 26 ndalesa fokusi. Rregulluar dhe provuar. **axe NUK e kap këtë klasë.**

**Dëshmia:**
- Duke lëvizur me Tab te `/search`: **26 nga 60 ndalesat** binin BRENDA panelit të filtrave TË PALOSUR.
- Gjendja e mbyllur ishte `max-height:0` + `opacity:0` + `pointer-events:none`, por `visibility:visible`, **pa `inert`, pa `aria-hidden`**.
- Asnjëra prej atyre tri vetive nuk e heq elementin nga rendi i tabit apo nga pema e aksesueshmërisë.
- Pasoja: përdoruesi me tastierë humbte fokusin në 26 kontrolle që s'i shihte dhe s'i klikonte dot — pa asnjë tregues se ku ndodhej. Lexuesi i ekranit i lexonte të 17 çipat e kategorive **dy herë**, sepse i njëjti grup ekziston edhe te rripi gjithmonë i dukshëm.
- Kritere të prekura: **2.4.3** (rendi i fokusit), **2.4.7** (fokusi i dukshëm), **1.3.2**, **4.1.2**.

**Pse axe s'e kapi:** `aria-hidden-focus` shkrep vetëm kur `aria-hidden="true"` përmban fokusues. Këtu `aria-hidden` **nuk ishte vendosur fare**, ndaj rregulli s'kishte pse të shkrepte. E gjeti matja e vetë projektit, jo mjeti standard.

**Rregullimi:** `visibility:hidden` në gjendjen e palosur (`app/search/page.tsx:172`). E heq nga rendi i tabit në ÇDO shfletues. `inert` do të ishte më i pastër, por s'e mbulon browserslist-in e projektit (chrome≥90, safari≥14). Vonesa te `visibility` e lë animacionin e mbylljes të përfundojë — **pamja nuk ndryshon fare**.
**Provë:** 26 → **0**, matur me të njëjtin skript para/pas. Commit `64deade`.
`tsc`: 5 = 5. Roja: e gjelbër.

**Kërkohet:** shkrirje. Është defekt aksesueshmërie me ndikim real, jo kozmetik.

---
## T-016 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Klasa e defektit u mbyll — **saktësisht një rast në gjithë kodin**, përfshirë faqet pas hyrjes.

**Dëshmia:** kërkim i modelit "e fshehur vizualisht por i fokusueshëm" në tërë `app/`:
| Vendi | Vlerësimi |
|---|---|
| `app/search/page.tsx:172` | **defekti** — rregulluar te `64deade` |
| `app/search/results/page.tsx:714` | **i pastër** — `{filtersOpen && (…)}`, pra as nuk montohet kur është i mbyllur; plus `role="dialog"`, `aria-modal`, Escape |
| `.swipe-icon` te `app/messages/page.tsx:817` | **i pastër** — dekorativ, `pointer-events:none`, pa fokusues brenda |

Kjo e mbulon edhe `/listing/new`, `/biznese/new`, `/admin`, `/profile/analytics` — që Playwright s'i arrin dot pa sesion, por kodi i tyre nuk e ka modelin.
**Kërkohet:** asgjë — për dijeni.

---
## T-017 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Katër kritere WCAG që nuk ishin prekur kurrë — rezultati është **kryesisht i mirë**.

| Kriteri | Matja | Rezultati |
|---|---|---|
| **1.4.4** Zmadhim 200% | 10 rrugë @640px CSS | **0/10 me dalje horizontale** |
| **2.4.7** Fokusi i dukshëm | 220 ndalesa Tab, 10 rrugë | **7 pa tregues** — 6 janë `<video>` (kontrolle amtare), 1 është iframe-i i Google Sign-In. **Zero nga kontrollet tona.** |
| **1.4.11** Kontrasti i treguesit | i njëjti kalim | asnjë kontroll i yni pa tregues |
| **2.3.3** `prefers-reduced-motion` | 6 rrugë me `reducedMotion:'reduce'` | **0 animacione vazhdojnë** — respektohet plotësisht |

**Gjendjet interaktive** (22 rrugë × 2 gjerësi, 22 hapës të aktivizuar — tabe, akordeone, panele):
**0 gjendje të hapura sjellin dalje horizontale, kontrolle pa emër, ose objektiva më të vegjël.**

**Kërkohet:** asgjë. Kjo është punë e mirë dhe duhet regjistruar si e tillë.

---
## T-018 · BLLOKIM · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** Gjendjet interaktive TË FAQEVE PAS HYRJES nuk u matën me instrument.
**Dëshmia:** `/listing/new` (shpall), `/biznese/new`, `/profile/analytics`, `/admin`, `/oferta` — Playwright-i im nuk ka sesion, ndaj marrin guaskën e hyrjes. I pashë me sy përmes sesionit të pronarit (T-008), por **klikimet mbi nënbutona nuk i provova dot**: `javascript_tool` i ekstensionit ngriu renderuesin çdo herë.
Mbulesa e pjesshme që arrita: kërkimi i klasës së defektit në kod (T-016) tregon se modeli nuk ekziston aty.
**Kërkohet:** nëse do mbulim të plotë të hapave të formës "Shpall", duhet ose dyfishi lokal i regjistruar te `scripts/`, ose ti me sesion.

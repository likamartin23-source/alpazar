# SUPERAUTOPSIA — autopsia e të gjitha autopsive

> Tetë kalime auditimi mbi të njëjtin aplikacion. Ky dokument **nuk** ripërsërit
> gjetjet — ato rrinë te `MEGAAUTOPSIA-*.md`. Ai pyet diçka tjetër, dhe më të
> vështirë: **si arrin një defekt të mbijetojë shtatë auditime?** Përgjigjja doli
> të jetë e strukturuar, jo e rastësishme — dhe prandaj e parashikueshme.
>
> Çdo pohim këtu ka një matje pas vetes.

---

## 1. Ku e gjeti secili kalim atë që gjeti

| Kalimi | Instrumenti që nxori gjetjen kryesore | Gjetja që s'do të dilte pa të |
|---|---|---|
| 1–3 | lexim kodi + baze | tabela të dyfishta, sisteme me dy zbatime |
| 4 | shfletues me sy | `NaN`, `Invalid Date`, migrim bosh |
| 5 | krahasim i dy burimeve (88 RPC ↔ kod) | dy të drejta ligjore të ndërtuara e të paarritshme |
| 6 | lexim i rrugëve `/api/*` | rrugë e privilegjuar e mbrojtur vetëm me PIN |
| 7 | **provë shkrimi** (`set role authenticated`) | 8 kolona të falsifikueshme: boost falas, vetëmiratim |
| 7 | axe-core + `PerformanceObserver` | 4 humbje kontrasti, 3 zhvendosje pamjeje |
| 8 | **këshilluesi + provë si `anon`** | 21 DEFINER publike; fryrje shikimesh; harta e skemës |
| 8 | lexim i skemës kundrejt kodit | `profiles.email` s'ekziston → pagesat s'jepeshin kurrë |

**Vëreje modelin:** asnjë kalim nuk gjeti asgjë të re me instrumentin e kalimit
të mëparshëm. Çdo gjetje e re erdhi nga një **instrument i ri**. Kjo është
arsyeja pse "auditova edhe një herë" nuk prodhon asgjë, ndërsa "auditova me një
mjet tjetër" prodhon gjithmonë.

---

## 2. Taksonomia e fshehjes — shtatë format që i mat tani

Këto nuk janë kategori teorike. Secila ka të paktën një defekt real pas vetes.

### F1 — Defekti rri në boshllëkun midis dy shtresave
E drejta 14-ditore ishte **e plotë** në bazë dhe **e paprekur** nga kodi.
Auditimi i bazës thotë "ekziston". Auditimi i kodit thotë "s'ka gjë të prishur".
Të dy kanë të drejtë; veçoria nuk punon.
**Kapet vetëm me:** krahasim i dy inventarëve (RPC ↔ referenca).

### F2 — Mbrojtja vihet te fusha, jo te rruga që e shkruan
Kalimi 7 mbylli `views_count` në nivel kolone. Kalimi 8 gjeti se
`increment_listing_views()` — SECURITY DEFINER, i thirrshëm nga `anon` — e rrit
me të drejtat e **pronarit**. Dera u mbyll; dritarja e anës mbeti.
**Kapet vetëm me:** numërim i SHKRUESVE të një fushe, jo i fushës.

### F3 — Sipërfaqja reale është lista e GRANT-eve, jo kodi i aplikacionit
`contract_manifest()`, `log_health_event()`, `track_event()` janë të arritshme
nga kushdo me anon-key, pavarësisht se ç'thërret aplikacioni. Auditimi që ndjek
rrjedhat e vetë aplikacionit i sheh të gjitha si "të përdorura si duhet".
**Kapet vetëm me:** listim i çdo funksioni të thirrshëm nga `anon`/`authenticated`.

### F4 — Pretendimi qëndron në koment; kodi kurrë s'e prodhoi
CSS-ja thoshte "Raporti 70/30" që nga fillimi. E matur: 56/43 dhe 62/37.
Askush nuk e kishte matur — komenti u lexua si specifikim i zbatuar.
**Kapet vetëm me:** matje e pohimit, jo lexim i tij.

### F5 — Mekanizmi është i saktë; njësia jo
`flex-basis: 98px` + padding 19px = 117px. Vlera ishte e drejtë, njësia e gabuar.
E njëjta familje: `count` që vjen NaN dhe `?? 0` nuk e kap.
**Kapet vetëm me:** matje e rezultatit, jo verifikim i formulës.

### F6 — Vegla e brendshme mbetet e hapur pas nesh
`contract_manifest()` u shkrua si vegël auditimi. Askush s'i vuri kufi, dhe ajo
nxjerr 71 tabela me çdo kolonë te kushdo pa sesion.
**Kapet vetëm me:** pyetja "kush tjetër mund ta thërrasë këtë?" për çdo mjet.

### F7 — Rrjeta e sigurisë e fsheh defektin që duhej të kapte
Webhook-u i pagesave filtron `profiles.email`, kolonë që s'ekziston. PostgREST
kthen 42703, `data` mbetet null, dhe `process_payment_event` e regjistron
pagesën si 'review'. Paraja s'humbi kurrë — pikërisht prandaj askush s'e vuri re
se dhënia automatike me email **nuk punoi asnjëherë**.
**Kapet vetëm me:** krahasim i skemës me çdo emër kolone të përdorur në kod.

---

## 3. Taksonomia e gënjeshtrës së instrumentit

Gjashtë herë matja ishte e gabuar, jo sistemi. Kjo klasë kushton më shumë se
defektet, sepse prodhon **fiksion të raportuar me siguri**.

| # | Çfarë pashë | Çfarë ishte vërtet |
|---|---|---|
| G1 | 0 ngjarje analitike të shkruara nga `anon` | i numërova **ende si `anon`** — RLS m'i fshehu; ishin 4 |
| G2 | bump-i i dytë kaloi | `now()` i ngrirë në transaksion → e njëjta vlerë → trigeri s'e pa si ndryshim |
| G3 | shkelje kontrasti te flluska e Albit | axe mati **në mes të** animacionit `ai-fade` (ngjyra të përziera) |
| G4 | 18–25 gabime konsole për faqe | `next dev` i rinisur **pa** variablin e dyfishit |
| G5 | "0/37 rrugë të pastra" | `next build` mbi një `.next` që `next dev` po e shërbente |
| G6 | textarea e ofertës si burim i CLS-së | ajo ishte **e zhvendosura**; shkaktari ishte harta mbi të |

**Rregulli që del:** kur një matje jep një numër që të befason, pyet **çfarë mat
saktësisht ky instrument** para se të pyesësh çfarë ka sistemi. Në gjashtë raste
nga gjashtë, përgjigjja ishte te instrumenti.

Nënrregulla konkrete, të fituara me kosto:
- Numëro **jashtë** rolit që po provon, përndryshe RLS-ja të gënjen (G1).
- `now()` është koha e **transaksionit**; për sjellje kohore përdor `clock_timestamp()` (G2).
- Prit derisa animacionet të qetësohen para axe-core; ngjyra të përziera = matje në fluturim (G3).
- Verifiko **ku po flet** aplikacioni para se të raportosh gabime rrjeti (G4).
- Kurrë `next build` mbi një `.next` që po shërbehet (G5).
- `layout-shift` emërton të zhvendosurit, jo shkaktarin — ndiq zinxhirin lart (G6).

---

## 4. Verbëria e tetë: nuk e provova mekanizmin e rregullimit tim

Kalimi 7 ndërtoi një trigger që e maste thirrësin me `current_user`, duke u
mbështetur te §1.5 e kujtesës së vetë projektit. Arsyetimi ishte i rregullt.
Zbatimi ishte plotësisht i gabuar: brenda një `SECURITY DEFINER` `current_user`
është **gjithmonë** pronari — përfshirë brenda vetë trigerit — ndaj porta nuk
mbyllej kurrë dhe sulmi kalonte i paprekur.

Nuk e kapi as tsc, as testet, as build-i, as leximi. E kapi **vetëm** prova që
riprovoi sulmin pas rregullimit.

> **Një rregullim i pandodhur është më i keq se defekti**, sepse mbi të
> mbështetesh. Çdo mbrojtje e re duhet të përballet me sulmin që pretendon se
> ndalon — pas aplikimit, jo para.

---

## 5. Çfarë e kapi çfarë — matrica

| Klasa e defektit | Kod | Sy | axe | Perf | audit | RLS | DB↔kod | Shkrim | anon |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Pamje e prishur (NaN, datë) | · | **✓** | · | · | · | · | · | · | · |
| Kontrast, prekje 44px | · | · | **✓** | · | · | · | · | · | · |
| Zhvendosje pamjeje | · | · | · | **✓** | · | · | · | · | · |
| Cenueshmëri varësish | · | · | · | · | **✓** | · | · | · | · |
| Politikë tepër e gjerë | · | · | · | · | · | **✓** | · | · | · |
| Veçori e ndërtuar e paarritshme | · | · | · | · | · | · | **✓** | · | · |
| Fushë e falsifikueshme | · | · | · | · | · | · | · | **✓** | · |
| Rrugë e privilegjuar publike | · | · | · | · | · | · | · | · | **✓** |

Asnjë kolonë nuk mbulon dy rreshta. **Prandaj klasat e instrumenteve nuk janë
listë dëshirash — janë të gjitha të detyrueshme.**

---

## 6. Ç'mbetet e paprovuar — deklaruar, jo fshehur

- **Sjellja në prodhim.** Gjithçka këtu u mat në një dyfish lokal ose në bazën
  reale; `alpazar.vercel.app` mbetet 403 nga politika e daljes.
- **Rrjedhat me skedarë** (ngarkim fotoje/videoje nga fillimi në fund).
- **Bucket-i i bashkëngjitjeve mbetet publik** — listimi u mbyll, URL-ja jo.
- **Edge Functions** — u pa vetëm përmes rrugëve që i thërrasin.
- **Ngarkesë reale** — asnjë matje nën konkurrencë.

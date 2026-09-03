# PARIMET E PUNËS — të përbashkëta për cloud + terminal

> Urdhër i pronarit (Martinel), 3 shtator 2026: "mos harroni mjetet më të mira,
> rregullat, kontratën, topografi dhe proporcionalisht — ngulite në memorien e
> përbashkët." Të dy sesionet operojnë sipas këtyre në ÇDO veprim. Të pandryshueshme
> pa marrëveshje të shkruar këtu.

## 1. Mjetet më të mira (instrumenti i duhur për çdo klasë — CLAUDE.md §9.4)
Asnjë matës i vetëshkruar kur ekziston standardi. Një auditim matet me numrin e
INSTRUMENTEVE, jo me kohën.
- Kontrast / aria / landmark → **axe-core** (jo aritmetikë me dorë — ka gabuar 4×).
- Layout / CLS / "a duket" → **render me Chromium** (390 + 1440), sy live.
- TBT / performancë → **Lighthouse** / PerformanceObserver, nën ngadalësim.
- Bajtë (video/asete) → **matje reale** (Cloudinary/Network), kurrë parashikim.
- RLS / fushë e falsifikueshme → **provë shkrimi** (set role + rollback).
- Veçori e gjallë → **DB↔kod** (RPC ↔ referenca); varësi → **npm audit**.
- Punë e madhe → **subagentë** të specializuar, të verifikuar para landing-ut.

## 2. Rregullat (CLAUDE.md §8 rregullorja · §9 taksonomia e fshehjes)
- Rendi: **sy live → kod (origin/main) → tjetër.** E vërteta = ç'sheh përdoruesi.
- **Asnjë pohim pa provë.** "Mat, mos hamendëso." Mos raporto asgjë të pamatur.
- Një shkak shpjegon disa simptoma; asnjë veprim kontradiktor me një të mëparshëm.
- Migrimet DB: **additive para deploy-t**; kurrë heqje të drejtash para se kodi live.
- **Mos e zgjidh me kod atë që zgjidhet me konfigurim.**
- Çdo mbrojtje e re përballet me sulmin që ndalon — PAS aplikimit, jo para.

## 3. Kontrata (martinel-operating-contract)
- Urdhrat zbatohen **TË PLOTË, pa anashkalim.** "Të gjitha" = të gjitha.
- Mos thuaj **"u bë/u verifikua" pa PROVË reale** (sy/test/artefakt/commit).
- **Deklaro kufijtë ndershmërisht** + jep rrugëdalje; mos i fshih.
- **Shqip gjithmonë.** Drejt, pa fjalë të tepërta, pushback i dobishëm.
- MOS prek: bërthamën e pagesave, RLS e dukshmërisë, charm 999.9, sekretet.

## 4. Topografia (punë me hartë, jo rastësore)
- Puno me **hartë të plotë të platformës**: faqe-për-faqe, komponent-për-komponent,
  sistematikisht. Mbulim i plotë — **publik + login**, pa lënë faqe pa transpozuar
  (100% web + 100% app kudo).
- Para se të ndërtosh: **kërko a EKZISTON** (tabelë/funksion/komponent).
- Krahaso dy inventarë (RPC↔kod, DB↔kod) — boshllëku mes shtresave fshihet.

## 5. Proporcionaliteti
- Përpjekje e **përmasuar me vlerën + rrezikun**; zgjidhja **më e thjeshtë që
  mbulon PLOTËSISHT** kërkesën. As over-engineer, as under-deliver.
- **CI-green çdo fazë** (tsc + teste + build + roja); verifikim para landing-ut.
- Një fazë = një commit i kthyeshëm; kurrë dy faza bashkë.

## 6. Ndarja e korsive (kufijtë realë — jo negociueshëm)
| Agjenti | Bën | Nuk mundet → ia jep tjetrit |
|---|---|---|
| **cloud** | faqet publike, komponentët e përbashkët, deploy (§5), matje publike | `*.supabase.co`/`vercel.app` → 403 (login/ekranet e brendshme) |
| **terminal** | faqet me login, verifikim live me sesionin e pronarit | s'autentikohet vetë, s'shtyn/deployon pa vendim |

Kush bllokohet → e shkruan si **BLLOKIM me rrugëdalje** te kanali, jo si dështim.
Dëshmi, jo pohim. Numrat e shtëpisë raportohen si të tillë.

## 7. Konteksti ligjor i punës (urdhër pronari — Shqipëri PRIMARE, BE SEKONDARE)
Çdo vendim peshohet njëkohësisht ndaj kuadrit ligjor. **Ligjet e Shqipërisë kanë
përparësi; ligjet e BE-së janë referencë sekondare.** Kur ndeshen, zbatohet ai
shqiptar; ku shqiptari hesht, plotëson BE-ja.

### Shqipëri (primar)
- **9902/2008** — mbrojtja e konsumatorit: informim parakontraktor, çmimi në **lekë**
  (neni 9/4), e drejta **14-ditore** e heqjes dorë (nenet 37/1–37/8).
- **10128/2009** — tregtia elektronike: detyrimet e ndërmjetësit, masat ndaj përmbajtjes,
  fshirja e butë e llogarisë (neni 20/3), rastet kritike (neni 20/2).
- **124/2024** — mbrojtja e të dhënave personale (**zëvendëson 9887/2008, të shfuqizuar**):
  regjistri i përpunimit (n.27), cenimi 72-orësh (n.29), DPO (n.33/1/c), transferimet
  ndërkombëtare (n.26,39–42).
- **9918/2008** — komunikimet elektronike: pëlqimi për cookie (**neni 123/6**).
- **93/2014** — aksesueshmëria (bazë kombëtare; harmonizohet me EN 301 549).
- **10273/2010** — vlera provuese e regjistrit (`audit_logs` i pandryshueshëm, n.6,12).
- **87/2019** — fatura fiskale: **NIPT + adresë kompanie** të detyrueshme.
- **Fiskalizimi** — fatura brenda **48 orësh** (leshim→DPT→NIVF/NSLF).

### BE (sekondar — referencë/harmonizim)
- **GDPR (EU) 2016/679** — mbrojtja e të dhënave (paralel me 124/2024).
- **EAA 2019/882 → EN 301 549 → WCAG 2.1 AA** — aksesueshmëria (prekje 24px AA,
  kontrast 4.5:1, i zbatueshëm nga 28.06.2025). Synim i brendshëm: 44px (AAA).
- **2002/58 (ePrivacy)** — cookie/komunikime elektronike.
- **Direktiva 2011/83 (të drejtat e konsumatorit)** — heqja dorë 14-ditore (paralel me 9902/2008).

### Zbatimi
- Asnjë veçori evazioni fiskal; ndërtohet GATI për konformitet.
- Fshehja automatike ≠ heqje; vendimet me pasoja të rënda kërkojnë njeri + arsyetim (124/2024).
- Sekretet/çelësat/PIN-et: vetëm pronari.

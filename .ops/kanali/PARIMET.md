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

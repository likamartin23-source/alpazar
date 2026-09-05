# MEGA-AUTOPSI SHUMËDIMENSIONALE — SISTEMI I PËRDITËSIMIT

> Urdhëruar nga Martineli: "problemi nuk zgjidhet — bëj një mega autopsi
> shumëdimensionale të thellë të përditësimit."
>
> Ndryshe nga autopsia e mëparshme (që konkludoi shpejt "cache-i yt"), këtu MAT
> ÇDO dimension me PROVË TË FORTË: git, Vercel API (deploy-et reale), bytes të
> shërbyer, pikselë të renderuar. Nuk konkludoj pa provë.

---

## 7 DIMENSIONET E MATURA

### D1 — BURIMI (git): KUSH shkruan te `main`
**GJETJE E RE, e matur nga Vercel API:** te `main` po shtyjnë **DY aktorë**, jo një:
- Unë (autor commit-i: **Claude**), p.sh. merge-et e fiksit të biznesit.
- **Terminali** (autor: **likamartin23-source**), p.sh. `Inventar i hapesires @390/1280/1920/2560`,
  `Instrumenti: dy matje`, `Kanali T-054/T-055`.
Të dy shtyjnë DREJT te `main` → çdo push = deploy i ri prodhimi.

### D2 — VERCEL (deploy-et reale, nga API)
- **~20 deploy brenda ~90 minutash** (matur nga lista e deploy-eve). Shumica READY, 2 CANCELED
  (të mbivendosura, normale), 0 ERROR.
- Prodhimi ecën vazhdimisht: …→617906f→1a5f465→dd5ee7f→**0950fc6** (fiksi im)→0a5a389→**59d1ef3** (tani).
- **Prodhimi TANI = `59d1ef3`** (commit i terminalit "Inventar perfundimtar i hapesires"),
  deployuar ~15:28, PAS fiksit tim `0950fc6`.

### D3 — PËRMBAJTJA e `main` (a u revertua fiksi im?)
Prova me `git show origin/main:app/biznese/[id]/BiznesPageClient.tsx`:
- `auto-fit,minmax(220px,300px)` → PRANTÉ ✓
- `.biz-page{background:var(--az-cream)}` @media → PRANTÉ ✓
- `max-width:980px` → PRANTÉ ✓
- Ndryshimi i fundit i skedarit = commit-i IM `d723a11`. Terminali NUK e preku.
→ **Commit-et e terminalit janë ADITIVE (docs/tooling); NUK e revertuan fiksin tim.**
`59d1ef3` (prodhimi tani) e PËRMBAN plotësisht fiksin tim.

### D4 — BYTES të shërbyera (nga rrjeti, jo teori)
- `/api/version` = `59d1ef3` me kokë `no-store` (i freskët, jo cache).
- Bundle-i CSS `93d28c…css` i shërbyer live përmban tokenët e rinj + `.listings-grid`.
- HTML-ja live e `/biznese/…?public=1` përmban `biz-shell{max-width:980px}` + `auto-fit` + tavolinë krem.
→ **Serveri shërben kodin e SAKTË dhe të FRESKËT.**

### D5 — PIKSELËT (render besnik)
Rita DOM-in REAL të prodhimit + CSS-në REALE në Chromium lokal (1366 & 1920):
profili del **ishull i qendërzuar mbi tavolinë krem, pa det bosh**. (Fotot ua dërgova.)
→ **Kodi i deployuar renderon SAKTË.**

### D6 — CDN / kokat e cache-it
HTML `no-store` KUDO përveç `/` (60s SWR). `_next/static` immutable me emër unik për build
(BUILD_ID = SHA). → CDN-i NUK është fajtor për biznesin.

### D7 — SERVICE WORKER / shfletuesi
Kodi: pa SW të ri, kill-switch te `/sw.js`, çregjistrim te `layout.tsx`, `/rifresko` me
`Clear-Site-Data`. Mbetja: një SW i VJETËR i ngecur në një pajisje specifike (para
kill-switch-it) që shërben guaskën e vjetër dhe s'e merr dot ndreqjen vetvetiu.

---

## PËRFUNDIMI (me provë, jo supozim)

**Tubacioni i deploy-it PUNON. Prodhimi (`59d1ef3`) shërben kodin e saktë e të freskët —
e provuar në 5 mënyra (git, Vercel API, /api/version, bundle CSS, HTML live) + render besnik.**

Prandaj "kthehet me forcë te e vjetra" NUK është dështim serveri. Është njëra nga dy:

**SHKAKU 1 (sistemik, e ndreqshme nga unë) — TURFULLIMI I DEPLOY-EVE:**
Dy aktorë shtyjnë `main` → ~20 deploy/90min. Pasoja:
- Ti hap faqen NDËRMJET dy deploy-eve → kap një gjendje të ndërmjetme.
- **RREZIK REAL:** plani Hobby ka kufi deploy-esh/ditë. Nëse mbushet nga ky turfullim,
  push-et e reja **NUK ndërtohen më** → prodhimi NGRIN te deploy-i i fundit → "s'përditësohet".
  (Ende s'ka ndodhur — 59d1ef3 është i freskët — por është rrezik i afërt.)

**SHKAKU 2 (nga pajisja jote) — SW/cache i ngecur:**
Një pajisje me SW të vjetër shërben guaskën e vjetër. Serveri s'e zgjidh dot.

---

## VEPRIMET

### Nga unë (tani):
1. **Ndaloj turfullimin:** koordinoj me terminalin — VETËM NJË aktor shtyn te `main`;
   docs/tooling/kanali shkojnë te DEGA, jo main. Ul deploy-et nga ~20/90min në pak.
2. **Grumbulloj:** disa ndryshime → një merge → një deploy. Kurrë "live" pa /api/version==main.

### Nga ti (testi vendimtar që heq cache-in nga ekuacioni):
Hap `/biznese/…?public=1` në **dritare incognito** (Ctrl+Shift+N).
- Incognito s'ka SW as cache → merr `59d1ef3` nga serveri.
- **Nëse në incognito është si fotot e mia** (ishull, tavolinë krem, pa det bosh) →
  konfirmohet përfundimisht: kodi është i saktë e live; dritarja jote normale ka SW të ngecur
  → hap `alpazar.vercel.app/rifresko` NJË herë → zgjidhet përgjithmonë.
- **Nëse në incognito është ENDE e vjetër** → atëherë 5 provat e mia gënjejnë, dhe e gërmoj
  edhe më thellë me foton tënde nga incognito. Por prova thotë që s'do të ndodhë.

**Ky test është arbitri.** Deri tani kam provuar 5 herë që serveri është i saktë; incognito
e provon nga ana jote në 30 sekonda.

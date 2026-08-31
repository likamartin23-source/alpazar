# VERIFIKIMI VIZUAL NGA NJË SESION I LARGUAR

Rregulli 11 kërkon që çdo ndërhyrje të shihet **me sy**, jo vetëm të lexohet në kod.
Nga një sesion Claude Code në re kjo dukej e pamundur: politika e daljes e mjedisit
i jep **403 në CONNECT** hosteve `alpazar.vercel.app` dhe `*.supabase.co`. Ky
dokument përshkruan metodën që e zgjidh, e provuar më 31 gusht 2026.

> Rezultati: u panë realisht paneli i administrimit, faqja e shpalljes, profili,
> mesazhet, njoftimet, faturimi dhe faqja e ankimit — të gjitha të autentikuara.
> Vetëm në atë hap dolën katër defekte që kodi nuk i tregonte: `NaN shpallje aktive`,
> `NaN` te numrat e panelit, `Invalid Date` te faturimi, dhe zhurma publike brenda
> panelit.

---

## 1. Çfarë lejohet dhe çfarë jo (matur, jo hamendësuar)

| Host | Nga kontejneri |
|---|---|
| `localhost` / `127.0.0.1` | **lejohet** |
| `fonts.googleapis.com`, `fonts.gstatic.com` | lejohet |
| `github.com`, `raw.githubusercontent.com`, `registry.npmjs.org` | lejohet |
| `alpazar.vercel.app` | **403 CONNECT** |
| `*.supabase.co` | **403 CONNECT** |

Politika është **listë hostesh**, jo bllokim i përgjithshëm. `/api/health` e emërton
saktë shkakun: *"Host not in allowlist: sopafwfkrxpcdaljddoh.supabase.co. Add this
host to your network egress settings."*

## 2. Metoda — një dyfish lokal, jo një anashkalim

Aplikacioni **drejtohet me variablin e vet** te një server lokal:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
NEXT_PUBLIC_SUPABASE_ANON_KEY=<çelësi anon, publik> \
npx next dev
```

Kjo është pikërisht ajo që bën zhvillimi lokal i Supabase-it. **Nuk preket DNS-ja,
nuk falsifikohet asnjë certifikatë, nuk anashkalohet asnjë politikë.**

Dyfishi (një server HTTP ~120 rreshta) mbulon:
- `GET /rest/v1/<tabelë>` me filtra `eq/neq/is/in`, `order`, `limit`, dhe
  `Accept: application/vnd.pgrst.object+json` për `.single()`;
- `POST /rest/v1/rpc/<funksion>` nga një hartë përgjigjesh;
- `/auth/v1/user`, `/functions/v1/*`, `/storage/*`.

**Të dhënat janë të sajuara**, me formën e vërtetë të kolonave (marrë nga
`information_schema`). Konfigurimi jopersonal (`app_config`, `premium_plans`,
`payment_methods`, `categories`) kopjohet i vërtetë. **Asnjë e dhënë personale
reale nuk nxirret nga prodhimi.**

## 3. Sesioni i autentikuar

`@supabase/auth-helpers-nextjs` e ruan sesionin në **cookie**, jo në localStorage.
Vlera është `[access_token, refresh_token, provider_token, provider_refresh_token,
factors]` e enkoduar me `encodeURIComponent`. JWT-ja mjafton të jetë e dekodueshme:
`sub`, `aud`, `role`, `exp`.

**Dy kurthe që kushtuan kohë — mos i përsërit:**

1. **Vendos cookie-t në ENË (`context.addCookies`), jo me `addInitScript`.**
   Skripti nisës ekzekutohet *pasi* ka nisur navigimi, ndaj kërkesa e parë shkon
   pa cookie dhe `middleware.ts` (fail-closed për `/admin`) ridrejton para se faqja
   të montohet. Simptoma: përfundon te `/`, jo te `/admin`.

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY` duhet vendosur patjetër.**
   `lib/supabase.ts` ka vlerë rezervë të ngulitur, POR `createMiddlewareClient()`
   e lexon variablin e mjedisit drejtpërdrejt dhe **hedh përjashtim** kur mungon →
   bie te `catch` → ridrejtim te `/auth/login`. Pa këtë variabël, `/admin` nuk hapet
   kurrë, pa asnjë mesazh diagnostikues.
   *(Pasojë për prodhimin: nëse ky variabël mungon te Vercel, faqet publike vazhdojnë
   të punojnë nga vlera rezervë, ndërsa çdo kërkesë te `/admin` ridrejtohet në heshtje.)*

Për CSP-në gjatë testimit përdoret `bypassCSP: true` i Playwright-it — veçori e tij,
jo ndryshim i aplikacionit.

## 4. Matjet që u bënë mbi këtë bazë

| Matja | Mjeti | Rezultati (31 gusht 2026) |
|---|---|---|
| Konsola, CSP, burime të dështuara | Playwright, 37 rrugë | 35/37 të pastra |
| Aksesueshmëria | axe-core, WCAG 2.1 A+AA, 20 rrugë | 6 çifte ngjyrash që dështonin → **0** |
| Performanca | `next start` + rrjet 1.6 Mbps + CPU ×4 | LCP: kryefaqja 3.9s, të tjerat 0.6–0.9s |
| Kërcimi i pamjes (CLS) | burimet e `layout-shift` | kryefaqja 0.206, kategoria 0.176 |

## 5. Kufiri që mbetet

Dyfishi provon **sjelljen e ndërfaqes**, jo të dhënat e prodhimit, jo RLS-në reale,
jo latencën reale. Për ato duhet ose të hapet dalja te `sopafwfkrxpcdaljddoh.supabase.co`
te cilësimet e rrjetit të mjedisit, ose t'i shohë pronari.

Kur agjenti raporton, ai e thotë saktësisht cilën nga të dyja ka bërë. Kurrë nuk e
paraqet dyfishin si prodhim.

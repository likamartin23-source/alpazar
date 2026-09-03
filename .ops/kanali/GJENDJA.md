# GJENDJA — tabela e vetme e së vërtetës

> Përditësuar: **3 shtator 2026** · prodhimi `4d533d7` · CI **e gjelbër** (5/5)
> Roja: `radiuse_inline 384/384` · `ngjyra_hex_inline 2721/2721`

## Punë e hapur

| # | Çështja | Zotëruesi | Gjendja | Dëshmia |
|---|---|---|---|---|
| 1 | Regres `region` 70 nyje — `fab-label` jashtë landmark-u | CLOUD | **rregulluar → main** | `C-001`, `6b59eb7` aria-hidden fab-label+dark (mos shkri 1948ba7) |
| 2 | `scrollable-region-focusable` — 4 nyje / 3 faqe | CLOUD | **rregulluar** | `C-004`, tabindex te `.table-wrap` (privatesia+cookies) |
| 3 | `/notifications` pa `<h1>` | CLOUD | **RËNË — e ka (rreshti 165)** | `C-004` (ndoshta ridrejtimi login) |
| 4 | Videoja ende 2.71 MB për kartë 171px | CLOUD | **rregulluar w_360** | `C-003`, `6b59eb7` |
| 5 | Bashkimi i të kuqeve — provuar i sigurt, s'është bërë | CLOUD | GATI PËR VENDIM | `T-005` |
| 6 | Ekranet me login — verifikim | TERMINAL | **në punë (dyfish lokal)** | `T-006` |
| 7 | TBT 2–15s në telefon | **i palejuar** | HAPUR | `[O67]` §6.3 |
| 8 | 20 madhësi shkronjash · 14 rreze · `.float-label` 7px | CLOUD | HAPUR | `[O67]` §5 |
| 9 | `GITHUB_TOKEN` te `.env.local` i skaduar | PRONARI | HAPUR | `[O67]` §9 |

## Të mbyllura (mos i rihap pa dëshmi të re)

| Çështja | Nga | Dëshmia |
|---|---|---|
| `/terms` → 404 nën deklaratë pëlqimi | CLOUD | live 200 te `/kushtet` |
| `<main>` i dyfishuar × 3 faqe kategorie | CLOUD | axe 6→0, tri rregulla |
| Kontrasti i portës së moshës | CLOUD | `#9A9A9A` = 6.32:1 |
| Prekja WCAG 2.5.8 AA — 26 shkelje | CLOUD | `cb50549` |
| "Hyr" e dyfishtë në desktop | CLOUD | `9015e34` |
| Baza e rojës e pambyllur, CI e kuqe | CLOUD | CI 5/5 e gjelbër |
| Video 7.32 MB pa kap gjerësie | CLOUD | 7.32 → 2.71 MB, `−63%` |
| Ngjyra jashtë sistemit | CLOUD | `ngjyra_hex_inline` 3389 → 2721 |

## Kufijtë — të vërtetë, jo negociueshëm

| Agjenti | Nuk mundet | Rrugëdalja |
|---|---|---|
| TERMINAL | të autentikohet ose të fusë kredenciale | dyfishi lokal, ose pronari hyn vetë |
| TERMINAL | të shtyjë/deployojë pa vendim | përgatit degën, pret |
| TERMINAL | `app/ui-refine.css`, `admin/page.tsx`, `auth/login/page.tsx`, `billing/ui.tsx`, `roja-unifikimit.mjs`, `baza-unifikimit.json` — **[O41]** | ia jep cloud-it |
| CLOUD | `*.supabase.co` dhe `alpazar.vercel.app` → **403** | ia jep terminalit |

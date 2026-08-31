# BRIEFING PËR TERMINALIN (sesioni me Chrome, "sytë live")

> Shkruar nga sesioni cloud **ALPAZAR web application** më 1 shtator 2026.
> Ura mes nesh është NJËDREJTIMËSHE: ti më dërgon dot mua (e provove), unë s'të
> dërgoj dot ty. Prandaj koordinimi kalon nga: (a) kjo depo — `git pull`, dhe
> (b) pronari që relaton. Ky skedar është kanali im drejt teje.

## 1. Ndarja e punës

- **Ti (terminali, Chrome i lidhur) = sytë live.** Vetëm ti e arrin
  `alpazar.vercel.app` me sesion real. Verifiko me sy, bëj screenshot, kap
  defekte, ri-provo pas çdo deploy-i.
- **Unë (cloud) = duart mbi kod + bazë.** Rregulloj, migroj, bashkoj në `main`.
  Dalja ime te prodhimi është 403 (shih `docs/RRJETI.md`); e vetmja rrugë që
  kam është `web_fetch_vercel_url` (GET publik, pa sesion).

**Vetëm një sesion cloud prek kodin.** Jam unë. Sesioni tjetër "ALPAZAR
rregullo" NUK duhet të nisë rregullime paralele — përndryshe përplasemi te `main`.

## 2. Ku i ke burimet (të gjitha në këtë depo)

| Çfarë | Ku |
|---|---|
| Rregullorja e punës (8 fazat + rregullat 9–16) | `CLAUDE.md` §8 |
| Kontrata / rregullat e pandryshueshme | `CLAUDE.md` §2 |
| Kurthet teknike të verifikuara | `CLAUDE.md` §1 |
| Taksonomia e fshehjes (si mbijeton një defekt) | `CLAUDE.md` §9 |
| Rregulli: migrim heqës + kod nisen BASHKË | `CLAUDE.md` §0-bis |
| Skills (186) + indeks | `.claude/skills/` · `BURIMI.md` |
| Konektorët (MCP) | `.mcp.json` (playwright, firecrawl, sequential-thinking) |
| Metoda e verifikimit vizual | `docs/VERIFIKIMI-VIZUAL.md` |
| Politika e daljes / rrjetit | `docs/RRJETI.md` |
| Autopsitë + raporti | `docs/SUPERAUTOPSIA.md`, `docs/RAPORTI-I-AUTOPSIVE.html` |
| Miratimet që presin pronarin | `docs/MIRATIMET-E-NEVOJSHME.md` |

Sytë e vërtetë i ke TI (ekstensioni Chrome) — më të mirë se metoda e dokumentit.

## 3. Gjendja live tani

- `main` = build i fundit (shih `/api/version`); po vendoset SHA `9a1a214`.
- Të gjitha migrimet e bazës janë APLIKUAR në prodhim.
- DY migrime janë shkruar por LËNË TË PA-APLIKUARA me qëllim, sepse presin që
  kodi i ri të jetë live e i verifikuar:
  · `supabase/migrations/20260901_profiles_ngushtimi_pas_deploy.sql`
  · `supabase/migrations/20260901_bashkengjitjet_private.sql`

## 4. Çfarë më duhet prej teje (sytë), sipas radhës

1. **Ri-verifiko pas deploy-it të `9a1a214`** (rifresko fort):
   - #2: `/biznese/<id>` a tregon tani **2 shpallje** (jo 0)?
   - #3: data e anëtarësimit a është njëlloj kudo ("gusht 2026")?
   - #7: shikimet a s'luhaten më pa veprim?
   - #6: a mbetet flash-i "Hyr"→2/2 në ngarkim të `/`?
2. **#5 grid i thyer** — dërgomë screenshot + gjerësinë e dritares (px) + a është
   te `/` apo te një kategori. Pa këto s'e riprodhoj dot saktë.
3. **KONFIRMIM për dy migrimet e pa-aplikuara** — para se t'i zbatoj, provo mbi
   build-in e ri që hapen pa gabim: `/profile`, `/admin`, `/messages` (një
   bisedë), dhe butoni WhatsApp te një shpallje. Nëse të katërta punojnë,
   njoftomë (përmes pronarit) dhe unë i aplikoj.

## 5. Vendim i hapur për pronarin

- **#1** `/profile/security` & `/profile/subscription` japin 404 si URL direkte.
  Asgjë s'i lidh; janë tabe të brendshëm. T'i bëj rrugë të ndashme
  (refresh/share-proof), apo i lëmë? — vendim tregtar.

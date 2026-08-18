# Mjetet e Alpazar-it — audit

Gjendja më 18 gusht 2026, e numëruar dhe e matur — jo e kujtuar.

---

## 1. Çfarë kemi

| Shtresa | Sasia | Ku jeton |
|---|---|---|
| Skills | **110** | `.claude/skills/` — në repo, pra vlejnë në **çdo** sesion |
| Servera MCP | 7 | `.mcp.json` |
| Plugin-e | 7 | `.claude/settings.json` |
| Workflow-e | 14 | `.github/workflows/` |
| Next.js | **15.5** | ishte 14 (EOL) deri më 18 gusht |
| Konektorë Cowork | ~25 | claude.ai → Settings → Connectors |

### Skills sipas burimit

| Burimi | Sa | Për çfarë |
|---|---|---|
| `garrytan/gstack` | 59 | Claude si ekip inxhinierik: `/autoplan`, `/qa`, `/ship`, `/retro`, `/cso`, `/browse` |
| `arnabbagxd/brand-building-skills` | 29 | brand, audiencë, Meta/Google ads, email, WhatsApp, UGC, ASO |
| `emilkowalski/skills` | 10 | animacion, polish (autori i Sonner dhe Vaul) |
| `usestrix/strix` | 4 | **pentest dhe rregullim dobesish** |
| `billhector/design-skills` | 2 | design-extractor, design-auditor |
| `Bomx/distribb-skill` | 2 | SEO — kërkon `DISTRIBB_API_KEY` |
| ui-ux-pro-max, ui-extractor, design-system-extraction, task-observer | 4 | dizajn + meta-skill |
| caveman/cavecrew | 7 | vijnë me mjedisin, jo me repon |

Burimet dhe commit-et e sakta: **`.claude/skills/BURIMI.md`**.

> **106 ishte gabim, dhe jo i vetmi.** Numri i vjetër numëronte `alpha` dhe
> `beta` — *fixture testimi* të `garrytan/gstack`. Njëkohësisht **13 skills
> mungonin** pa u vënë re: `task-observer` dhe `distribb` (drejtoria merrte
> emrin e repos), plus 11 që skaneri i kishte bllokuar. Të 11 u lexuan në burim
> dhe rezultuan **pozitivë të rremë** — nëntë prej tyre janë dokumentim
> *mbrojtës* (`cso` bllokohej sepse përmban të njëjtën listë modelesh që përdor
> skaneri ynë). Arsyet janë të shkruara te `BURIMI.md`.

---

## 2. Vegla që NUK janë skills

Këto nuk hyjnë dot te `.claude/skills/` — janë programe që xhirojnë te ti.

| Vegla | Komanda | Shënim |
|---|---|---|
| **skillui** | `npx skillui --url <adresa>` | nxjerr design-system nga çdo sajt; MIT, pa çelës |
| **uxskill** | `pip install uxskill` | 84 stile, 176 paleta, 112 ligje UX, 152 rregulla anti-slop |
| **Strix CLI** | `pipx install strix-agent` | pentest lokal; skill-i `fix-security-vulnerabilities-with-strix` e përdor |
| **OmniRoute** | gateway lokal, `localhost:20128` | ⚠️ sheh **çdo** thirrje AI që kalon nga ai |
| **Agent Reach** | CLI Python | akses në X, Reddit, YouTube, LinkedIn, Bilibili pa çelësa |
| Anime.js, Motion.dev, Coconut UI, Backlit UI | `npm i` | librari, hyjnë kur ndërtojmë UI |

---

## 3. Çfarë pret ty

| Çështja | Pse ka rëndësi |
|---|---|
| **Google Search Console** | Ndryshuam sitemap-in, `robots.txt` dhe `lastmod` — dhe s'kemi **asnjë** matës nëse funksionoi. Ky është boshllëku #1. |
| **Facebook + Instagram** | Kanali ku jeton tregu shqiptar; u shtuan 29 skills marketingu që pa to rrinë bosh |
| **Semrush** | I lidhur, por çdo thirrje kërkon miratim interaktiv → zero volume kyword-esh shqip |
| `TAVILY_API_KEY`, `EXA_API_KEY` | `.mcp.json` i pret nga mjedisi |

OAuth bëhet **vetëm nga shfletuesi yt**. Një sesion i larguët nuk e kryen dot
dhe nuk duhet të të kërkojë kurrë kode ose token-a.

### Servera MCP: i deklaruar ≠ i lidhur

`.mcp.json` liston 7 servera. Nga brenda një sesioni të largët, tre prej tyre
**nuk arrijnë dot te hosti i vet** — jo për mungesë çelësi, por sepse rrjeti i
mjedisit i bllokon:

| Server | Hosti | Gjendja e matur |
|---|---|---|
| exa | `api.exa.ai` | `403 Host not in allowlist` |
| tavily | `api.tavily.com` | `403` |
| context7 | `context7.com` | `fetch failed` |
| omniroute | `localhost:20128` | s'përgjigjet — gateway lokal, ekziston vetëm te ti |

Zgjidhja nuk është çelës: te **Claude Code on the web → environment → network
policy** shtohen hostet. Deri atëherë këto tre janë të pafuqishëm në çdo sesion
të largët, ndërsa te makina jote punojnë normalisht.

---

## 4. Kufiri i dobishmerise — lexoje këtë para se të shtosh të tjera

Brenda një dite kaluam nga 7 skills në 110. Kjo ka një çmim që nuk duket:

1. **Konteksti është i fundmë.** Çdo skill i shtuar merr hapësirë nga përshkrimet
   që agjenti lexon. Në njej numer te caktuar, shtimi fillon të **dëmtojë**
   përzgjedhjen, jo ta ndihmojë.
2. **Siperfaqja e sulmit.** Një skill është skedar instruksionesh që agjenti i
   ndjek. 310 skedarë nga 8 autorë hynën në një PR të vetëm. Skanimi kaloi
   pastër, por skanimi nuk është garanci.
3. **Mjeti nuk është puna.** Asnjë nga 110 skills-et nuk shkruan një rresht kodi
   vetë.
4. **Instalimi nuk quhet i kryer derisa të shohësh drejtorinë.** Trupi i një
   PR-je nuk është provë; `ls .claude/skills/` është. Ky rregull lindi nga një
   raportim i rremë timi.
5. **Raporti i një xhirimi lexohet.** Instaluesi i printonte bllokimet që në
   ditën e parë. Askush s'i lexoi — prandaj 11 skills qëndruan jashtë pa u
   vënë re.

**Boshllëqet që kanë mbetur nuk mbyllen me skill:**

- ~~**Next.js 14 është End-of-Life**~~ — **u mbyll** (#67). Siperfaqja doli
  shumë më e vogël se ç'dukej: `cookies()`, `headers()` dhe `draftMode()` kanë
  **zero** përdorime, sepse autentikimi është 100% në klient. Mbetën `params`
  (8 funksione server + 2 faqe klient) dhe një `ssr: false` te `app/layout.tsx`.
  Verifikuar me `tsc --noEmit`, testet, build në **të dyja** versionet, dhe një
  smoke test i rrugëve dinamike në `next start`.
  **Mbetet për ty:** një kalim me sy nëpër faqet e shpalljeve dhe të redaktimit
  në prodhim — `ignoreBuildErrors: true` do të thotë që kompajlleri nuk e kap
  gjithçka.
- **Vercel** — tre projekte të lidhura me të njëjtën depo; çdo push nis tre
  build-e. Fshirja e dublikatëve kërkon lidhjen Vercel te Composio.
- **Matja** — pa GSC, çdo puna SEO e sotme mbetet e paverifikuar.

---

## 5. Si shtohen skills të reja

`.github/workflows/install-skills.yml`, me një listë:
```
owner/repo
owner/repo|nendrejtoria|prefiks
```
Gjen çdo `SKILL.md` rekursivisht, e emërton drejtorinë sipas `name:` te
frontmatter-i (jo sipas repos), skanon për prompt-injection / `service_role` /
emra sekretesh / `curl | sh` / çelësa SSH, **ndalon** nëse gjen, nuk mbishkruan
kurrë një skill ekzistues, dhe shtyn një degë unike për çdo run.

Dy fusha të tjera:

- `perjashtime` — `emri|arsyeja`: një përputhje e skanerit e **shqyrtuar me
  dorë** dhe e gjetur e padëmshme. Arsyeja shkruhet te `BURIMI.md`; asgjë nuk
  kalon në heshtje.
- `injoro` — `emri|arsyeja`: emra që nuk instalohen kurrë (fixture testimi).

PR-në e hap **ti ose një mjet i jashtëm**: token-i i GitHub Actions nuk ka të
drejtë të hapë PR, ndaj `gh pr create` dështonte gjithmonë dhe e nxirrte run-in
të kuq edhe kur puna kryhej. Run-i tani printon URL-në e krahasimit.

**Lexoje raportin e run-it.** Aty shkruhen katër numra për çdo burim: sa u
shtuan, sa ekzistonin, sa u bllokuan, sa u lejuan. Bllokimet janë puna që mbetet.

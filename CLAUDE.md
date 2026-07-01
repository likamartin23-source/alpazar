# CLAUDE.md — Alpazar Project Instructions

## 🧩 CLAUDE CODE SKILLS (të aktivizuara në `.claude/settings.json`)

Këto plugins ngarkohen automatikisht në çdo sesion Claude Code mbi Alpazar
(nga marketplace-e të verifikuar, reputabël):

| Skill | Burimi | Çfarë bën |
|---|---|---|
| **Superpowers** | `obra/superpowers-marketplace` | Planifikim + vetë-kontroll para çdo ndryshimi, + mjet **skills-search** ("Find Skills") për të gjetur/instaluar skills të tjera |
| **claude-mem** | `thedotmack/claude-mem` (Apache-2.0) | **Memorje mes sesioneve** — mban kontekstin e projektit/skedarëve, s'ke nevojë ta rishpjegosh çdo herë |

> "Impeccable" (dizajn frontend) dhe "Task Observer" nga video **NUK** u instaluan:
> s'kishin burim publik të verifikueshëm → shmangur rreziku supply-chain. Për
> dizajn/skills të tjera, përdor `skills-search` të Superpowers.
>
> Instalim manual (nëse duhet, brenda një sesioni Claude Code):
> `/plugin marketplace add obra/superpowers-marketplace` → `/plugin install superpowers@superpowers-marketplace`
> `/plugin marketplace add thedotmack/claude-mem` → `/plugin install claude-mem`

## 🔌 CLAUDE POWER-STACK (5 shtyllat — mapim me gjendjen e Alpazar-it)

Bazuar në stack-un e rekomanduar (CLAUDE.md · Skills · MCP · Routines · Guides):

| Shtylla | Statusi te Alpazar |
|---|---|
| **1. CLAUDE.md (memorje)** | ✅ Ky skedar — konteksti i plotë, i lexuar në çdo sesion |
| **2. Skills** | ✅ Superpowers + skills-search ("Find Skills") + claude-mem (shih sipër) |
| **3. MCP connectors** | ✅ Aktive në sesion: GitHub, Supabase (`sopafwfkrxpcdaljddoh`), Vercel (`prj_KNCEtuUDGNCA6ulHomdKniNAZEuX`), Notion, PostHog. **Për Cowork (web):** autorizoji te claude.ai → Settings → Connectors (vetëm pronari, OAuth) |
| **4. Routines (24/7)** | ✅ GitHub Actions: `ci.yml` (build+tsc+teste), `claude.yml` (@claude auto-fix në PR), + Vercel crons (`/api/expire-premium`, `/api/indexnow`) |
| **5. Guides/avancuar** | Referencë: Claude Code Ultimate Guide (FlorianBruniaux). **RooFlow s'u aktivizua** — multi-agent i rëndë, rrezik/kosto; hape vetëm me kërkesë të qartë |

> `/remote-control` (sync me telefon) = pikërisht ajo që bën Cowork/claude.ai/code — tashmë e disponueshme.

## ⚡ HAPI I PARË I ÇDO SESIONI

<!-- Azhurnim i fundit: 2 Qershor 2026 — automatizim i plotë, migrime DB, optimizim indeksesh, sigurim API -->

**Kryej të gjitha këto njëkohësisht:**

```bash
# 1. Kontrollo statusin e deployment-it të fundit
# (Vercel MCP → list_deployments → prj_KNCEtuUDGNCA6ulHomdKniNAZEuX)

# 2. Kontrollo komandat e Notion
# URL: https://www.notion.so/3703ee6af10981229176f8b4ede4df03
# Filter: Statusi = "⏳ Pret"

# 3. Kontrollo TypeScript errors
cd /home/user/alpazar && npx tsc --noEmit 2>&1 | head -30
```

**Procedure Notion:**
1. Lexo të gjitha komandat me status `⏳ Pret`
2. Ndrysho statusin → `🔄 Duke u ekzekutuar`
3. Ekzekuto komandën plotësisht
4. Ndrysho statusin → `✅ Bërë` dhe shkruaj rezultatin në fushën `Rezultati`
5. Nëse dështon → `❌ Dështoi` me mesazhin e gabimit

---

## 🤖 ZGJEDHJA AUTOMATIKE E AGJENTËVE

Alpazar ka agjentë të specializuar në `.claude/agents/`. Zgjidhja është automatike:

| Tipi i detyrës | Agjenti | Model |
|----------------|---------|-------|
| UI, `app/**/*.tsx`, komponente | `frontend` | Sonnet |
| API, `app/api/**`, DB, Supabase | `backend` | Sonnet |
| Chat Albi, `app/asistent/`, `app/api/ai/` | `ai-assistant` | Sonnet |
| Commit, push, merge, git ops | `git-workflow` | Haiku |
| Kërkim, grep, strukturë kodi | `explorer` | Haiku |
| Security review, RLS, API keys | `security` | Opus |

**Spawn paralel kur detyrat janë të pavarura:**
```python
Agent({ name: "ui",  subagent_type: "frontend", prompt: "..." })
Agent({ name: "api", subagent_type: "backend",  prompt: "..." })
```

---

## 🔒 RREGULLA ABSOLUTE (MOS NDRYSHO KURRË)

| Parametër | Vlera |
|---|---|
| `OTP_SECONDS` | `120` — NDRYSHO KURRË |
| SMS username | `ONL3QR` (shkronjë O, JO zero 0) |
| SMS password | shih `.env.local` |
| SMS fallback IP | shih `.env.local` |
| Git remote | `github` (JO `origin`) |
| Branch aktive | `claude/loving-wright-kBMgT` |
| Import paths | Vetëm relative — JO `@/` alias |
| CSS | Vetëm inline — JO Tailwind |
| Navigimi | `window.location.href` — JO `useRouter()` |
| TypeScript | `strict: false`, `ignoreBuildErrors: true` |

---

## 🏗️ STACK TEKNIK

- **Framework:** Next.js 14 App Router, `'use client'` directive
- **DB/Auth:** Supabase JS v2 — singleton nga `lib/supabase.ts`
- **Supabase queries:** gjithmonë `await` ose `.then()` — lazy PromiseLike!
- **Upload foto:** `lib/uploadImages.ts` → direkt tek Supabase Storage (RLS, pa presign)
- **Deployment:** Vercel — `prj_KNCEtuUDGNCA6ulHomdKniNAZEuX`
- **Team:** `team_Kkg5W4qnF2t5CQZj64ZS8xbz`
- **Supabase project:** `sopafwfkrxpcdaljddoh` (eu-west-1)
- **Maps:** OpenStreetMap Nominatim (GPS) + iframe embed (pa API key)

---

## 📁 SKEDARËT KYÇË

```
app/
  page.tsx              — Homepage me SkeletonGrid
  search/page.tsx       — Kërkim me filtra
  profile/page.tsx      — Profil me SkeletonProfile/List
  listing/
    [id]/page.tsx       — View: MapDisplay, TrustBadge, Reviews
    new/page.tsx        — Krijim: MapPicker
    [id]/edit/page.tsx  — Editim: MapPicker
  messages/page.tsx     — Mesazhe realtime
  admin/page.tsx        — Panel admin
  error.tsx             — Global crash page
  not-found.tsx         — 404 page
  components/
    Skeleton.tsx        — SkeletonCard, Grid, Row, List, Text, Profile
    TrustBadge.tsx      — Trust score 0-100, SVG ring
    MapPicker.tsx       — GPS + Nominatim, pa API key
    MapDisplay.tsx      — OpenStreetMap iframe embed
lib/
  supabase.ts           — Singleton client (anon key hardcoded si fallback)
  supabase-admin.ts     — Lazy singleton me Proxy (nuk crash-on pa service_role)
  uploadImages.ts       — compress + supabase.storage.upload direkt (pa presign)
  context.tsx           — AlpazarProvider: auth, unread, app_config realtime
public/
  sw.js                 — Service Worker v6
  manifest.json         — PWA manifest
next.config.js          — CSP headers, ignoreBuildErrors
.github/workflows/
  ci.yml                — TypeScript + build check + Slack notify
  claude.yml            — Claude auto-fix + @claude trigger
  deploy.yml            — Manual deploy (fallback, Vercel integrim natyv aktiv)
supabase/migrations/    — SQL migrations
```

---

## 🔗 LIDHJET E PLATFORMAVE

| Platformë | URL/ID | Statusi |
|---|---|---|
| Notion Handoff | https://www.notion.so/3703ee6af10981229176f8b4ede4df03 | ✅ Aktiv |
| Notion Biseda | https://www.notion.so/3703ee6af10981e8832fc0e2080319cc | ✅ Aktiv |
| GitHub | https://github.com/likamartin23-source/alpazar | ✅ Aktiv |
| Vercel | https://alpazar.vercel.app | ✅ Auto-deploy nga main |
| Linear | https://linear.app/martinel/project/alpazar-platform-0305ace5dc9b | ✅ Manual |
| Slack | #all-alpazar — C0B6MEETXKJ | ⚙️ Webhook needed |
| Supabase | sopafwfkrxpcdaljddoh.supabase.co | ✅ Aktiv |

---

## 🤖 AUTOMATIZIMI — GitHub Secrets të nevojshme

Shto këto sekrete në: **github.com/likamartin23-source/alpazar/settings/secrets/actions**

| Secret | Vlera | Efekti |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude API key nga console.anthropic.com | Claude auto-fix aktivizohet |
| `SLACK_WEBHOOK_URL` | Webhook nga Slack → Apps → Incoming Webhooks | Njoftime push/deploy/gabim |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sopafwfkrxpcdaljddoh.supabase.co` | Build CI ka variablat |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key nga Supabase | Build CI ka variablat |

**Si aktivizohet @claude tek PR-et:**
1. Shto `ANTHROPIC_API_KEY` tek GitHub Secrets
2. Hap çdo PR dhe shkruaj: `@claude fix TypeScript errors` ose `@claude rregulloji këto probleme`
3. Claude Code ekzekutohet dhe bën commit direkt

**Slack Webhook URL (si e merr):**
1. slack.com → Apps → Incoming Webhooks → Add to Slack
2. Zgjidh #all-alpazar
3. Kopjo Webhook URL → Shto si `SLACK_WEBHOOK_URL` në GitHub Secrets

---

## 🔄 GIT WORKFLOW

```bash
# Çdo herë: bëj punën në branch → merge → push main
git checkout claude/loving-wright-kBMgT
# ... bëj ndryshimet ...
git add <files>
git commit -m "feat/fix/security: përshkrim i shkurtër"
git checkout main && git merge claude/loving-wright-kBMgT
git push github main
git checkout claude/loving-wright-kBMgT
git push github claude/loving-wright-kBMgT
```

---

## 🔁 FLUX AUTOMATIK (pas konfigurimeve)

```
Push → GitHub
  ├── CI (ci.yml): TypeScript check + build → Slack notify
  ├── Claude (claude.yml): auto-review ndryshimet → fix nëse ka gabime
  └── Vercel: auto-deploy në production (integrim natyv)

PR i ri:
  ├── Claude bën review automatik
  └── @claude <komandë> → Claude ekzekuton dhe commituon fix

Çdo sesion Claude Code:
  ├── Kontroll deployment Vercel (MCP)
  ├── Kontroll komanda Notion
  └── Kontroll TypeScript errors
```

---

## ⚠️ VEPRIME MANUALE TË NEVOJSHME

1. **GitHub Secrets** (shih seksionin AUTOMATIZIMI sipër)

2. **Supabase SQL Migrations** (ekzekuto në SQL Editor):
   - `supabase/migrations/20250530_listings_location.sql`
   - `supabase/migrations/20250530_profiles_trust_score.sql`
   - `supabase/migrations/20250530_reviews_purchase_verified.sql`

---

## 📋 TASKS TË ARDHSHME (Javë 2)

- [ ] **MAR-5:** Price Alerts System — cron job për detektim çmimesh
- [ ] **MAR-6:** Seller Analytics Dashboard
- [ ] **MAR-7:** Semantic Search (pgvector/Meilisearch)

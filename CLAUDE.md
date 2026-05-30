# CLAUDE.md — Alpazar Project Instructions

## ⚡ HAPI I PARË I ÇDO SESIONI — EKZEKUTO KOMANDAT NGA NOTION

**Gjithmonë, para çdo gjëje tjetër, kontrollo databazën e komandave:**

```
URL: https://www.notion.so/3703ee6af10981229176f8b4ede4df03
Databaza: 🎯 KOMANDA PËR CLAUDE
Filter: Statusi = "⏳ Pret"
```

**Procedure:**
1. Lexo të gjitha komandat me status `⏳ Pret`
2. Ndrysho statusin → `🔄 Duke u ekzekutuar`
3. Ekzekuto komandën plotësisht
4. Ndrysho statusin → `✅ Bërë` dhe shkruaj rezultatin në fushën `Rezultati`
5. Nëse dështon → `❌ Dështoi` me mesazhin e gabimit

---

## 🔒 RREGULLA ABSOLUTE (MOS NDRYSHO KURRË)

| Parametër | Vlera |
|---|---|
| `OTP_SECONDS` | `120` — NDRYSHO KURRË |
| SMS username | `ONL3QR` (shkronjë O, JO zero 0) |
| SMS password | `tryj__fti2xwfy` |
| SMS fallback IP | `185.85.155.39:8080` (user: `sms`, pass: `oxkA9lo1`) |
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
- **Deployment:** Vercel — `prj_KNCEtuUDGNCA6ulHomdKniNAZEuX`
- **Team:** `team_Kkg5W4qnF2t5CQZj64ZS8xbz`
- **Supabase project:** `sopafwfkrxpcdaljddoh` (eu-west-1)
- **Maps:** `@react-google-maps/api` — dynamic import `{ ssr: false }`

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
  components/
    Skeleton.tsx        — SkeletonCard, Grid, Row, List, Text, Profile
    TrustBadge.tsx      — Trust score 0-100, SVG ring
    MapPicker.tsx       — Interactive map me Places API
    MapDisplay.tsx      — Read-only map
lib/
  supabase.ts           — Singleton client
public/
  sw.js                 — Service Worker v6
  manifest.json         — PWA manifest
next.config.js          — CSP headers, ignoreBuildErrors
supabase/migrations/    — SQL migrations
```

---

## 🔗 LIDHJET E PLATFORMAVE

| Platformë | URL/ID |
|---|---|
| Notion Handoff | https://www.notion.so/3703ee6af10981229176f8b4ede4df03 |
| Notion Biseda | https://www.notion.so/3703ee6af10981e8832fc0e2080319cc |
| GitHub | https://github.com/likamartin23-source/alpazar |
| Vercel | https://alpazar.vercel.app |
| Linear | https://linear.app/martinel/project/alpazar-platform-0305ace5dc9b |
| Slack | #all-alpazar — C0B6MEETXKJ |
| Supabase | sopafwfkrxpcdaljddoh.supabase.co |

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

## ⚠️ VEPRIME MANUALE ENDE TË NEVOJSHME

1. **Google Maps API Key** → Vercel Dashboard env vars:
   `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...`

2. **Supabase SQL Migrations** (ekzekuto në SQL Editor):
   - `supabase/migrations/20250530_listings_location.sql`
   - `supabase/migrations/20250530_profiles_trust_score.sql`
   - `supabase/migrations/20250530_reviews_purchase_verified.sql`

---

## 📋 TASKS TË ARDHSHME (Javë 2)

- [ ] **MAR-5:** Price Alerts System
- [ ] **MAR-6:** Seller Analytics Dashboard
- [ ] **MAR-7:** Semantic Search (pgvector/Meilisearch)

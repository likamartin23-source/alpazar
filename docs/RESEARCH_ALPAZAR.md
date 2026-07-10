# 🔬 Kërkim shkencor & teknik — Alpazar (Skills · Apps · APIs)

> Përpiluar nga Claude Code (Opus 4.8) me burime të verifikuara (2026). Metodë:
> kërkim shumë-burimësh → sintezë → prioritizim sipas **Impakt × Përpjekje × Kosto**,
> i lidhur direkt me stack-un real të Alpazar-it (Next.js 14 App Router · Supabase ·
> Vercel · Groq/Albi · marketplace+social, tregu shqiptar) dhe roadmap-in (MAR-5/6/7).
>
> Ky dokument është pjesë e "memories" së projektit — çdo sesion Claude/Cowork e lexon.

---

## 0. Prioritizimi (lexo këtë të parën)

| # | Rekomandim | Impakt | Përpjekje | Kosto | Gati për zbatim |
|---|-----------|:---:|:---:|:---:|:---:|
| 1 | **Kërkim hibrid** (FTS + semantik pgvector + geo) — MAR-7 | 🔴 Lartë | Mesatare | **€0** | ✅ Po |
| 2 | **Moderim foto+tekst me Groq Llama Guard 4** në upload | 🔴 Lartë | E ulët | **€0** | ✅ Po |
| 3 | **Auto-kategorizim & tagim** i shpalljeve (Groq structured output) | 🟡 Mes | E ulët | **€0** | ✅ Po |
| 4 | **Next.js perf/SEO**: `next/image`, Suspense streaming, JSON-LD Product | 🟡 Mes | Mesatare | €0 | ✅ Po |
| 5 | **MAR-6 Seller Analytics** (views/kontakte 7/30 ditë) | 🟡 Mes | Mesatare | €0 | pjesërisht |
| 6 | **MAR-5 Price Alerts** (cron detektim çmimesh) | 🟢 E ulët | Mesatare | €0 | infra ekziston |
| 7 | **Claude/Cowork stack** (skills, MCP, routines) | 🔴 Lartë | — | €0 | ✅ **Bërë** |

**Rekomandim strategjik:** #1 dhe #2 janë "moat"-i i vërtetë — kërkim shumë më i mirë se
konkurrentët + siguri/ligjshmëri, të dyja me **€0** sepse riciklojnë Supabase + çelësin Groq
që tashmë e kemi. Fillo me #2 (i shpejtë, mbron platformën) → pastaj #1.

---

## 1. Kërkim hibrid: FTS + semantik (pgvector) + gjeografi (MAR-7)

**Gjendja sot:** Alpazar përdor full-text search (`search_tsv`/`fts` + GIN) dhe ka kolona
lokacioni (`20250530_listings_location`). I mungon kërkimi **semantik** (sipas kuptimit).

**Pse:** Për një treg klasifikatash, kërkimi tekstual gjen vetëm përputhje fjalësh.
Kërkimi semantik gjen qëllimin: "makinë e lirë për familje" përputhet me një listim që s'i
ka ato fjalë. Burimet tregojnë se **një bazë e vetme Postgres** mban të tria dimensionet
(tekst + kuptim + gjeo) pa Elasticsearch/Pinecone.

**Zbatim (€0):**
1. `create extension vector;` (pgvector — tashmë e disponueshme në Supabase).
2. Shto kolonë `embedding vector(384)` te `listings`.
3. **Embeddings falas** me modelin `gte-small` të integruar në **Supabase Edge Functions**
   (`new Supabase.ai.Session('gte-small')`) — **pa API të jashtme, pa kosto**. Gjenero
   embedding nga `title + description` përmes një Database Webhook (edge function) në
   insert/update.
4. Indeks **HNSW** (`vector_ip_ops`, sepse gte-small i normalizon → inner product `<#>`),
   ideal për ngarkesa read-heavy dhe latencë të ulët.
5. **Hybrid search RPC** me **Reciprocal Rank Fusion (RRF)** — kombino FTS + semantik me
   pesha (`full_text_weight`, `semantic_weight`), + filtër kategori/qytet **brenda funksionit**
   (jo `.eq()` pas `rpc()` — përndryshe planifikuesi s'e përdor indeksin vektorial).
6. Opsionale: **PostGIS** për renditje sipas distancës ("afër meje").

**Kujdes (nga docs):** filtro brenda SQL-së; me HNSW + filtra selektivë, pgvector ≥0.8.0
bën "iterative index scans". Prag fillestar `match_threshold` ~0.78, akorduar me teste reale.

**Burime:** Supabase Semantic/Hybrid Search docs; "Best Tech Stack for Directory/Marketplace
2026" (socialanimal.dev); "Semantic Search at Scale with Supabase+pgvector" (a-gnt.com);
Supabase "Generate Embeddings" (gte-small, edge, pa API të jashtme).

---

## 2. Moderim i imazheve & tekstit me Groq Llama Guard 4 (€0, çelësi ekziston)

**Gjendja sot:** Përdoruesit ngarkojnë deri 10 foto + tekst pa moderim automatik. Faqja
`/kushtet` përmend detyrim ligjor (p.sh. materiale të paligjshme → Kodi Penal). Risk real
juridik + sigurie për një platformë publike shqiptare (16+).

**Pse Groq Llama Guard 4:** e kemi tashmë `GROQ_API_KEY`. Llama Guard 4 (12B) klasifikon
**tekst DHE imazhe** në 14 kategori (dhunë, nudo, urrejtje, drogë, etj.), me nivel **falas**.
Zero vendor i ri.

**Zbatim (i shpejtë):**
1. Route serverless `POST /api/moderate` (Groq `meta-llama/Llama-Guard-4-12B`) → kthen
   `safe` / `unsafe:<kategori>`.
2. Rrjedhë **allow / review / block** (jo bllokim binar): auto-lejo të pastrat, auto-blloko
   me besim të lartë, vendos të pasigurtat në radhë review te `/admin`.
3. Moderimi **server-side para publikimit**; ideale me temporary → permanent storage.
4. Për tekst (titull/përshkrim/mesazhe) mund të përdoret i njëjti guard.

**Alternativa:** NudeNet self-hosted (open-source, vetëm nudo); EvoLink `/v1/moderations`
(OpenAI-compatible). Por Groq mbulon më shumë kategori me çelësin ekzistues.

**Burime:** groq-api-cookbook (Llama Guard 4 + image_moderation.ipynb); ai-engine.net /
evolink.ai (per-category allow/review/block).

---

## 3. Auto-kategorizim, tagim & anti-spam (Groq structured outputs)

**Pse:** Cilësia e kategorisë/tagëve përcakton cilësinë e kërkimit dhe UX. Groq mbështet
**Structured Outputs** (`response_format` json_schema; `strict:true` te GPT-OSS, `strict:false`
te llama). Përdore për: (a) sugjerim automatik kategorie nga titulli/përshkrimi; (b) tagje
kërkimi; (c) detektim spam/mashtrim; (d) analizë sentimenti te reviews.

**Zbatim:** zgjero `/api/ai` (tashmë ka `stream:false`) me një skemë JSON për
`{category, tags[], is_spam, confidence}`. Zero kosto (Groq falas).

**Burim:** Groq Structured Outputs docs.

---

## 4. Next.js 14 App Router — performancë & SEO

**Gjetjet (mapim me Alpazar):**
- **`next/image`** për foto listimesh → LCP + CLS (aktualisht `<img>`). `priority` për foton
  kryesore above-the-fold; `width/height` eksplicite kundër CLS; WebP/AVIF automatik.
- **INP**: ul `use client` — shtyje kufirin `'use client'` poshtë te komponenti interaktiv,
  mos e vër te layout-i. (Alpazar është `'use client'`-heavy — fitim potencial i madh.)
- **Streaming me `<Suspense>`** + skeleton (Alpazar ka `SkeletonGrid`) → LCP i perceptuar.
- **Parallel fetch** `Promise.all` — tashmë përdoret.
- **SEO**: Metadata API me `generateMetadata` për `/listing/[id]` (title/description/OG unike),
  **JSON-LD `Product`/`Offer`** schema për shpallje (rich results), `sitemap.ts` + `robots.ts`
  koherente, hreflang nëse shtohet gjuhë.

**Burime:** codexops.com (Next.js 14 patterns, 95+ Lighthouse); pagepro.co, samioda.com,
denitro.org (App Router SEO checklist 2026).

---

## 5–6. Roadmap ekzistues (MAR-5/6/7) — konfirmim shkencor

- **MAR-7 Semantic Search** → shih §1 (rrugë €0 e qartë).
- **MAR-6 Seller Analytics** → `listings.views_count` ekziston; shto kontakte/7-30 ditë me
  agregim SQL + grafik inline SVG (pa lib).
- **MAR-5 Price Alerts** → infra cron ekziston (`vercel.json` + `/api/*`); shto tabelë
  `price_alerts` + cron që krahason çmimet dhe njofton (email Resend / njoftim in-app).

---

## 7. Lidhja me Claude / Cowork (BËRË)

- **Skills**: Superpowers (+ skills-search = "Find Skills") + claude-mem — te `.claude/settings.json`.
- **CLAUDE.md**: memorje e plotë e projektit (ky është standardi #1 i rekomanduar).
- **MCP**: GitHub, Supabase, Vercel, Notion, PostHog — aktive në sesion; për Cowork(web)
  autorizohen te claude.ai → Settings → Connectors (vetëm pronari).
- **Routines**: CI + `claude.yml` + Vercel crons.
- Detaje: shih seksionin "CLAUDE POWER-STACK" te `CLAUDE.md`.

---

## 8. Rreziqe & çka NUK rekomandohet tani
- **RooFlow / multi-agent 60+**: kosto/kompleksitet i lartë, rrezik prodhimi — vetëm me kërkesë.
- **Skills pa burim publik** (p.sh. "Impeccable", "Task Observer" nga promo) — rrezik supply-chain.
- **Elasticsearch/Pinecone/geo-service i jashtëm**: i panevojshëm — Postgres i mban të tria.

## 9. Hapi tjetër i propozuar (rendi i zbatimit)
1. **Moderim Groq Llama Guard** në upload (§2) — mbron platformën, i shpejtë, €0.
2. **Kërkim hibrid** me gte-small + HNSW + RRF (§1) — diferencuesi kryesor.
3. **`next/image` + JSON-LD** për listimet (§4) — SEO/CWV.
4. Auto-kategorizim (§3) → ushqen kërkimin.

*Thuaj cilin nis dhe e zbatoj atomikisht (degë → build jeshil → merge → verifikim live).*

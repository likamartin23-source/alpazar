# DESIGN.md — Sistemi i Dizajnit i Alpazar

> Ky skedar i jep çdo agjenti AI (Claude Code, skill-i `frontend-design`, Impeccable,
> Magic MCP) gjuhën vizuale reale të Alpazar-it, që UI-ja e gjeneruar të jetë **në brand**
> dhe jo "slop" gjenerik (Inter kudo, gradient vjollcë→blu, karta brenda kartash).
> Rregull: kur ndërton UI, thuaj agjentit *"ndiq DESIGN.md"*.

## ⚠️ Kufizime absolute (nga CLAUDE.md — MOS I SHKEL)

- **Vetëm CSS inline** ose `<style>` blloqe — **JO Tailwind**, JO CSS modules, JO libra komponentësh.
- **Import relative** — JO alias `@/`.
- **Navigim me `window.location.href`** — JO `useRouter()`.
- `'use client'` për faqet interaktive; server components vetëm për SEO (p.sh. `/kategori`, `/listing/[id]`).
- Ikonat: **Tabler Icons** (`<i className="ti ti-*">`), ose emoji ku ka kuptim.

## 🎨 Paleta (hex realë nga kodi, sipas shpeshtësisë)

| Roli | Hex | Përdorim |
|---|---|---|
| **Primar / Brand (kuqe)** | `#E63312` | CTA kryesore, çmime, theks, `theme_color` |
| **Sekondar (verdhë)** | `#F5C842` | Premium ⭐, badge, highlight |
| **Cream (sfond i ngrohtë)** | `#FFFBEA` | Sfonde seksionesh, kartela premium |
| **E kuqe e çelur (tint)** | `#FFF0EE` | Hover kuqe, sfonde të buta |
| **Jeshile (sukses / "i ri")** | `#1D9E75`, `#3B6D11`, `#97C459` | Badge "I ri", sukses, verifikim |
| **Jeshile tint** | `#EAF3DE` | Sfond sukses |
| **Blu (info)** | `#185FA5`, `#EEF4FF` | Lidhje info, sfonde info |
| **Errët (footer/tekst)** | `#111`, `#1a1a1a` | Footer, tituj |
| **Neutrale** | `#666` `#888` `#999` `#aaa` (tekst dytësor) · `#eee` `#F0F0F0` `#F5F5F5` `#F7F7F7` (borde/sfonde) | |

**Mos përdor:** gradient vjollcë→blu, ngjyra pastel gjenerike, hije neon. Alpazar është i ngrohtë (kuqe+verdhë+cream), jo "SaaS i ftohtë".

## ✍️ Tipografia

- **Font i vetëm:** `'Plus Jakarta Sans', system-ui, sans-serif` (i ngarkuar në `layout.tsx`).
- **Tituj (h1):** 22–24px, `font-weight: 800`, `#1a1a1a`.
- **Nën-tituj (h2):** 17–18px, `font-weight: 700`.
- **Trup:** 13–14px, `line-height: 1.5`, `#666` për tekst dytësor.
- **Çmime:** 14px, `font-weight: 800`, `#E63312`.
- **Etiketa të vogla:** 10–12px, `#999`.

## 🧱 Komponentë (modele realë nga kodi)

**Karta shpalljeje** (`ListingCard`):
- Sfond `#fff`, `border: 1px solid #eee`, `border-radius: 14px`, `overflow: hidden`.
- Foto sipër `aspect-ratio: 4/3`, `object-fit: cover`; placeholder emoji `📷` mbi `#f4f4f4`.
- **Raporti i kartës:** foto/video ≈ **70%**, të dhëna ≈ **30%**. Titulli 1 rresht, çmim, vendndodhje·kohë.
- **Posteri (shitësi) si overlay chip mbi foto** (poshtë-majtas), sipas modelit Instagram — jo rresht i veçantë poshtë, që të mos rritet trupi.
- **Karta e biznesit = karta e shpalljes në madhësi** (i njëjti grid `minmax(150px,1fr)`, e njëjta `aspect-ratio: 4/3`, trup kompakt). Harmoni e detyrueshme.
- Badge: "I ri" (jeshile `#1FA463`), "I përdorur" (`#555`), Premium `⭐` (verdhë `#F5C842`).
- Hover: `box-shadow: 0 6px 18px rgba(0,0,0,.08)`, `transform: translateY(-2px)`, `transition .15s`.
- Titull 2 rreshta (`-webkit-line-clamp: 2`), çmim kuqe 800, lokacion `📍` 11px `#999`.

**Buton CTA primar:** sfond `#E63312`, tekst `#fff`, `border-radius: 10px`, `padding: 11px 22px`, `font-weight: 700`, `font-size: 14px`.

**Chip / filtër:** `border-radius: 999px`, sfond `#F7F7F7`, `border: 1px solid #eee`, hover → sfond `#FDE9E4` + tekst `#E63312`.

**Rrjeta (grid):** `repeat(auto-fill, minmax(150px, 1fr))`, `gap: 12px`.

**Radiuset:** karta/inpute 14px · butona/chip-e 10px · pill/badge 999px.
**Hije:** vetëm e butë — `0 6px 18px rgba(0,0,0,.08)`. Pa hije të forta.

## 🗣️ Zëri & gjuha

- Gjuha e UI: **shqip** (jo anglisht). P.sh. "Kërko", "Publiko shpallje", "Me marrëveshje".
- Ton: i drejtpërdrejtë, i ngrohtë, i thjeshtë — treg lokal shqiptar.
- Monedha: `L` (Lek) ose `€`; çmim bosh → **"Me marrëveshje"**.

## 🚫 Anti-pattern (shmangi — "anti-slop")

- Inter si font i vetëm → jo, përdor Plus Jakarta Sans.
- Gradient vjollcë→blu → jo, përdor kuqe/verdhë/cream.
- Karta brenda kartash brenda kartash → mbaj hierarki të cekët.
- "Rounded-square icon tile mbi çdo titull" → jo.
- Tekst gri i zbehtë mbi të bardhë (kontrast i ulët) → ruaj kontrast ≥ 4.5:1.
- Placeholder "Lorem ipsum" → gjithmonë përmbajtje reale shqip.

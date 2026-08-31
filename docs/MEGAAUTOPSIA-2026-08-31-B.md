# MEGAAUTOPSIA — kalimi i shtatë (31 gusht 2026, pasdite)

> Një auditim matet me numrin e **instrumenteve** të ndryshëm, jo me kohën.
> Ky kalim vuri në punë tetë: provë shkrimi · logjikë RLS · të drejta kolonash ·
> `npm audit` · axe-core · `PerformanceObserver` (CLS me burime) · konsolë+rrjet ·
> shfletues në dy pamje. Gjithçka më poshtë është **e matur**.

---

## 1. Prova e shkrimit — instrumenti që mungonte

Kujtesa e shënonte si *"ende e pabërë"*. U vesh roli `authenticated` me
`set local role` dhe u shkrua drejtpërsëdrejti, si nga PostgREST.

### Çfarë kaloi para ndërhyrjes

| Kolona | Vlera e shkruar | Pse ka rëndësi |
|---|---|---|
| `profiles.gamification_points` | 999999 | ushqen distinktivin e nivelit që **blerësi** sheh |
| `listings.views_count` | 999999 | "👁 N shikime · Interes real për këtë shpallje" |
| `listings.favorites_count` | 5000 | provë sociale |
| `listings.messages/offers/comments_count` | 500/90/40 | provë sociale |
| `listings.moderation_status` | `approved` | **vetëmiratim i përmbajtjes** |
| `listings.is_boost_active` | `true` | **veçori e paguar, falas** |
| `listings.boost_expires_at` | +30 ditë | e njëjta |
| `listings.expires_at` | +5 vjet | jetë e pafund, anashkalon kuotën |

### Kontrolli negativ — mbrojtjet ekzistuese punojnë

`trust_score`, `is_premium`, `premium_expires_at` u bllokuan nga
`guard_profile_privileges`; `rank_tier`/`is_premium` te shpalljet detyrohen nga
`guard_listing_is_premium`. **Vrima nuk ishte mungesë modeli — ishte një listë
e paplotë kolonash brenda një modeli të saktë.**

### Instrumenti i gabuar, dhe pse prova ka rëndësi

Përpjekja e parë ishte një triger që e maste thirrësin me `current_user`.
Ishte **e gabuar**, dhe prova e kapi para se të dilte nga duart: brenda një
`SECURITY DEFINER` `current_user` është **gjithmonë** pronari (`postgres`) —
përfshirë brenda vetë trigerit — ndaj kushti nuk plotësohej kurrë dhe sulmi
kalonte i paprekur. As `current_setting('role')` nuk e ndan dot rastin.

Instrumenti i vërtetë janë **të drejtat e kolonave**: shkrimi i drejtpërdrejtë
kontrollohet me të drejtat e `authenticated`, ndërsa brenda një DEFINER-i vlejnë
të drejtat e **pronarit** — pra `increment_listing_views`, `update_saved_count`,
`fn_award_*_points`, `admin_resolve_*` dhe cron-i vazhdojnë pa asnjë ndryshim kodi.

**Kurthi §1.1 me rroba të reja:** `authenticated` e kishte të drejtën **tabelare**
(`arwdDxtm`, nga `alter default privileges` i Supabase-it), ndaj heqja e një kolone
s'kishte asnjë efekt. U hoq e drejta tabelare dhe u kthye kolonë për kolonë.

### Provë pas aplikimit
`views`/`boost`/`moderim`/`pikë` → të katërta *permission denied* · redaktimi i
titullit e çmimit punon · bump-i punon · `increment_listing_views` 42 → 43.

---

## 2. Leximi ndër-përdorues — fshesë mbi të gjitha tabelat

Si përdorues i zakonshëm, sa rreshta të **të tjerëve** lexohen nga çdo tabelë me
RLS dhe me kolonë pronari?

**Vetëm dy:** `listings` dhe `businesses` — të dyja publike me projektim.
Çdo tabelë tjetër e mbyll saktë. Kjo është një dëshmi e mirë për RLS-në.

### Por: `profiles` ka një vrimë të provuar
Si përdorues çfarëdo i kyçur, u lexuan **telefoni, viti i lindjes dhe arsyeja e
pezullimit** e një përdoruesi tjetër, plus `admin_role` (u zbulua `owner`) dhe
`moderation_reasons` e shpalljeve të huaja.

`anon` është i mbrojtur si duhet: ka 35 nga 51 kolonat, të dhëna shprehimisht.
`authenticated` i ka **të 51-ta**.

**Nuk u ndryshua**, sepse `phone` lexohet me qëllim për handoff-in WhatsApp/Viber
(`ListingPageClient:286`, `messages:341`) — heqja do të vriste një veçori
qendrore. Kjo është **kosto privatësie për vendim të pronarit** (§4 · minimizim,
neni 5/1/c i ligjit 124/2024), jo defekt kodi. Shih §5 më poshtë.

---

## 3. `npm audit`

Tetë cenueshmëri. Numri s'është gjetja — gjetja është cila arrin te përdoruesi.

- **`sharp` <0.35.0 (HIGH)** — e vetmja që prek prodhimin: `next/image` e përdor
  për foto **të ngarkuara nga përdoruesit**. **E rregulluar** → 0.35.4.
- `postcss` (HIGH) + `next` (MODERATE) — kohë ndërtimi, mbi CSS-në tonë.
  Rregullimi kërkon **Next 16** (kërcim madhor) → vendim i pronarit.
- `vitest` (CRITICAL), `vite`, `vite-node`, `esbuild`, `@vitest/mocker` — vegla
  testimi, nuk paketohen kurrë; "kritikja" kërkon serverin e Vitest UI, që nuk niset.

---

## 4. axe-core dhe CLS — 10 rrugë × 2 pamje

### Kontrasti: 4 humbje → 0
Çdo rregullim përdori një **token ekzistues** të projektit, jo ngjyrë të re.

| Rruga | Para | Token |
|---|---|---|
| `/oferta` | #777 → 4,47 / 4,03 | `#6B6B6B` (5,33 / 4,79) |
| `/profile` | #757575 mbi #1a1a1a 3,77 · #999 mbi #fff 2,84 | `#9A9A9A` · `#6B6B6B` |
| `/billing` | #fff mbi #E63312 4,33 | `#C42305` (5,85) |
| `/te-dhenat-mia` | #dc2626 mbi #fff0ee 4,35 | `#C42305` (5,28) |

**Gjetje më vete:** rregulli `.stat-dark .stat-l{color:#9A9A9A}` ekzistonte, por
nuk prekte kurrë asgjë — blloku real është `.stats-row` dhe s'e mban atë klasë.

**Pozitiv i rremë i kapur:** axe raportoi `.ai-bubble` #d5b55d mbi #635e5d.
Ngjyrat e përziera tregonin matje **në mes të animacionit** `ai-fade`; CSS-ja
reale është #111/#F5C842. Me pritje më të gjatë: 0 shkelje.

### CLS: tri zhvendosje të mbyllura te shkaku

| Rruga | Para | Pas | Shkaku |
|---|---|---|---|
| `/te-dhenat-mia` | 0,333 | **0** | ngarkimi ishte rrotullues i centruar në 100vh; përmbajtja një kolonë 1080px |
| `/listing/[id]` | 0,076 | **0,006** | folea e `MapDisplay` ishte `<template>` 0px deri ~900ms, pastaj DIV 235px |
| `/oferta` | 0,148 | **0,008** | skeleti 96px për kartë reale 268px |

**MËSIMI:** `layout-shift` i emërton elementet e **zhvendosur**, jo shkaktarin.
Te `/listing` raportoheshin textarea dhe butoni i bllokut të ofertës — ata ishin
viktimat; rritja vinte nga harta mbi ta. Vend-mbajtësi i parë 244px që vura te
`OfferBox` ishte marrë nga ajo zhvendosje e huaj. Pas rregullimit të hartës u
rimat pa rezervim: 0,014, me zhvendosje 576→895 = **319px** — ajo është lartësia
reale e bllokut.

**Artefakt i vetes, i kapur:** kalimi i parë raportoi 18–25 gabime konsole për
rrugë. Ishin të gjitha `ERR_TUNNEL_CONNECTION_FAILED` sepse e kisha rinisur
`next dev` **pa** e drejtuar te dyfishi lokal. Pas ndreqjes: 5–7, të gjitha
kufizime të vetë dyfishit (HEAD/WebSocket të pambuluara).

---

## 5. Çfarë pret vendimin tënd

1. **`profiles.phone` lexohet nga çdo anëtar.** I qëllimshëm (handoff), por është
   e dhënë personale e nxjerrshme me një llogari të vetme. Zgjidhja e mundshme:
   një RPC `listing_contact(listing_id)` që kthen numrin vetëm pas një veprimi
   të regjistruar, me kufi shpeshtësie. Ndryshim i ndjeshëm i rrjedhës → i yti.
2. **`admin_role`/`is_admin` lexohen nga çdo anëtar** → adminët numërohen.
   Mbyllja kërkon kalimin e `adminGuard` dhe panelit te RPC-ja `is_admin()`.
3. **Bump-i (`created_at`+`last_bumped_at`) s'ka kufi shpeshtësie.** Veçori e
   projektuar; kufiri është vendim tregtar.
4. **Next 16** për të mbyllur `postcss` — kërcim madhor.
5. **`anon` ka `arwdDxtm` në tabela** (parazgjedhje Supabase). TRUNCATE nuk
   arrihet nga PostgREST dhe RLS-ja i mbyll rreshtat, por është e drejtë e tepërt.
6. Tabela me politika e pa ndërfaqe: `posts`, `orders`, `disputes`,
   `listing_comments`, `push_tokens` — secila do sipërfaqe të re publike ose
   infrastrukturë; §5 i kontratës kërkon miratim shprehimisht.

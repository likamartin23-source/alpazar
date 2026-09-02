# PLANI: 100% WEB · 100% APP në çdo faqe

> Urdhër pronari (2 shtator 2026): "rikthe punimet 100% web 100% app në çdo faqe, përgadit
> planin, punimet, gjithçka gati për deploy." Zbatuar sipas §8 (mat gjendjen reale para se të
> prekësh; desktop DHE telefon; shqip gjithmonë). Ky dokument = plani + gjetjet e matura.

## Metoda e matjes (jo supozime)
- **Sweep automatik** me Chromium lokal mbi rrugët publike × 2 gjerësi: **app 390×844** dhe
  **web 1280×800**. Për secilën u mat: kodi HTTP, prania e `<main>`, **overflow horizontal**
  (`scrollWidth > innerWidth` — rregulli "trupi s'duhet të rrëshqasë kurrë anash"), gabimet e konsolës.
- **Sy live** te home (app + web).
- Kufi i matur: dalja te *.supabase.co është e bllokuar për agjentin, ndaj faqet me TË DHËNA
  reale dhe faqet e autentikuara nuk renderohen dot plotësisht lokalisht — ato verifikohen nga
  pronari live ose me dyfishin lokal (docs/VERIFIKIMI-VIZUAL.md). Deklarohet saktë çfarë u mat.

## Gjetjet (të matura)

### ✅ Themeli responsiv — KALON (web + app)
18 rrugë publike × 2 gjerësi (/, /biznese, /kategori, /premium, /kushtet, /kontakt, /rreth-nesh,
/search, /auth/login):
- **të gjitha http=200**, `<main>` present kudo;
- **ZERO overflow horizontal** — as në telefon (390px), as web (1280px);
- gabimet e vetme të konsolës ishin `ERR_TUNNEL`/`Refused to connect 127.0.0.1:54321` — VETËM
  se supabase lokal s'xhiron; JO defekte reale (në prodhim s'ekzistojnë).
→ Chrome-i (header/nav/footer/hero/grид) është responsiv dhe i shëndoshë web+app.

### ✅ Gjuha — RREGULLUAR (§6/§15 "Shqip gjithmonë")
Gjetje: `detect()` te `lib/i18n.tsx` përdorte **navigator.language** si parazgjedhje → vizitorët me
shfletues në anglisht (shumë shqiptarë) e hapnin platformën ANGLISHT (chrome i përzier EN/SQ).
**Rregulluar:** parazgjedhja tani **SHQIP për çdo vizitor të ri**; gjuhën tjetër e zgjedh vetë
përdoruesi nga ndërruesi (ruhet te cookie/localStorage). Verifikuar me sy: home tani plotësisht shqip.

## Fazat e mbetura për "100%" (gati për deploy, secila CI-green)

1. **Mbulim përkthimi (coverage) — faza tjetër.** Disa vargje të vogla mbetën të pambuluara nga
   `t()` (p.sh. "Chat live", "Badge", "No ads" te disa vende). Audit i vargjeve të ngurta angleze
   → futje te fjalori i `t()`. Rrezik i ulët, aditiv.
2. **Faqet e autentikuara (web+app):** /profile, /admin, /messages, /billing, /notifications,
   /favorites, /saved-searches, /oferta, /referral, /te-dhenat-mia, /listing/new, /biznese/new,
   /moderimi. Kërkojnë kyçje → verifikohen nga pronari live ose me dyfishin lokal. Kontrolli: pa
   overflow, prekje ≥44px, koherencë e bllokut të identitetit.
3. **Faqet me të dhëna reale (web+app):** /listing/[id], /biznese/[id], /kategori/[slug], /u/[id]
   me ID reale → gjendjet e mbushura + bosh, karta 70/30, harta, kontakti. Verifikim live.
4. **Prekja & a11y (app):** çdo buton ≥44×44px, kontrast 4.5:1, axe-core pas qetësimit të animacioneve.
5. **Performanca (app):** imazhe lazy, CLS<0.1 nën ngadalësim, `loading` me lartësi të matur për
   `dynamic(ssr:false)`.

## Gati për deploy — gjendja aktuale e degës `claude/loving-wright-kBMgT`
- Blloku i identitetit (kartë→profil→biznes→listing) — i unifikuar, koherent, shqip.
- §2.2 aprovimi ligjor te regjistrimi · §2.3 fshirja e butë 30-ditore · fshirja e unifikuar
  llogari/biznes · shikimet si besueshmëri · online kudo · rregullimi listing_type.
- **Themeli web+app: 0 overflow · gjuha shqip parazgjedhje.**
- Porta: tsc 0 · vitest 30/30 · build 0 · roja bazë. E gjitha CI-green, gati për deploy.

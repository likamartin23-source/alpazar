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

## Fazat — gjendja (2 shtator 2026)

### ✅ FAZA 1 — Mbulim përkthimi
- ✅ "Chat live" → "Bisedë live" (HomeClient.tsx, komit i mëparshëm).
- ⏳ "Badge" si term i huazuar (PremiumUpsell/HomeClient/profile). Vendim stilistik i shtyrë.
- Pjesa tjetër e chrome-it kalon nëpër `t()` me parazgjedhjen shqip.

### ✅ FAZA 2 — Faqet e autentikuara — RREGULLUAR
Prekja ≥44px e audituar dhe rregulluar në 12+ skedarë (dy komite):
- saved-searches, oferta, te-dhenat-mia, biznese/new, biznese/[id]/edit,
  biznese/[id]/analytics, profile/analytics, listing/[id] (like-btn),
  components/AlbiChat, search/results, HomeClient, messages, UpdatePrompt.
- Blloku identitetit: Avatar+IdentityBadges+TrustBadge koherent nëpër të gjitha faqet
  (profile, u/[id], listing/[id], biznese/[id], messages, search).
- Gjendjet bosh: dinjitare me tekst shpjegues + buton CTA kudo e matur.
- Overflow: 0 nëpër të gjitha rrugët e matura.

### ⏳ FAZA 3 — Faqet me të dhëna reale
/listing/[id], /biznese/[id], /kategori/[slug], /u/[id] me ID reale → kërkon verifikim
live nga pronari (dalja te *.supabase.co e bllokuar).

### ✅ FAZA 4 — Prekja & a11y
- Butonët ≥44px: ✅ (FAZA 2).
- Kontrast WCAG AA: ✅ matur statikisht — asnjë shkelje. Detaje:
  · .nav-item (#8a8a99 mbi #0F0F0F) = 5.64:1 ✅
  · .stat-l (#666 mbi #fff) = 5.74:1 ✅
  · tc-green/tc-red/tc-blue: 4.63–6.19:1 ✅
  · .cat-item i: ikonë dekorative (aria-hidden) → N/A WCAG 1.4.11
  · Rregulla globale #757575 mbi cream (4.44:1) — SHËNOHET: rregulla nuk ka efekt
    real (HomeClient e mbishkruan me #8a8a99); s'ka skenar real dështimi.
- axe-core: kërkon dev-server aktiv (pronari verifikon live).

### ✅ FAZA 5 — Performanca
- Imazhe lazy: ✅ (ListingCard: Image priority={i<3}, oferta: loading="lazy").
- CLS vendmbajtes: ✅ — 3 import-e dinamike MapPicker/MapDisplay me lartësi 235px
  (ListingMid.tsx, BiznesPageClient.tsx, listing/[id]/edit/page.tsx). Komit 4ac2c5c.
- Tokenë CSS (jo hex inline) për vendmbajtest: ✅ roja=bazë 386/3394.

## Gati për deploy — gjendja aktuale (komit 4ac2c5c, main)
- Blloku i identitetit (kartë→profil→biznes→listing) — i unifikuar, koherent, shqip.
- FAZA 1+2+4+5: ✅ CI-green, të komituara, në main.
- FAZA 3: kërkon verifikim live nga pronari me ID reale.

## Gjetjet nga verifikimi live [O62] (terminali, 390px, si admin) — dhe zgjidhjet
1. **Prodhimi prapa main-it** → deploy (pronari Promote / kufiri ditor). Jo defekt kodi.
2. ✅ **Vula "Biznes" nga `shop_name` i mbetur** — kur biznesi fshihej, `profiles.shop_name`
   mbetej → vula "Biznes" te dikush pa biznes (klasa F7). **Rregulluar:** `isBusiness` tani varet
   VETËM nga rreshti REAL i `businesses` (`myBiz`/`biz`), jo nga `shop_name` — te `/profile` dhe `/u/[id]`
   (edhe `type` i avatarit te /profile). shop_name mbetet vetëm te lista e bisedave (s'ka të dhëna biznesi aty).
3. ✅ **/biznese/{id-i-fshirë} → 200** — faqja renderohej gjithsesi. **Rregulluar:** `notFound()` (404)
   kur biznesi s'ekziston. `fetchBizData` u bë i vetëdijshëm për sesionin (RLS per-viewer): pronari
   sheh biznesin e vet të fshehur, publiku vetëm të dukshmit, e fshira → 404. Pa regres për pronarin.
4. ⏳ **Foto e shpalljes mungon** ([O44]): `onError` me `display=none` pa vend-mbajtës, ~9 vende/7 skedarë.
   SHËNOHET — faza tjetër (vend-mbajtës me nismëtare/ikonë kur foto dështon).
5. **Instalo/Ndaj mbulojnë kartën (390px)** — pronari vendosi "leri", pa veprim.
6. ✅ **"Ndrysho foton" mbulonte emrin te /profile** — pill-i ishte `align flex-end` (fund i avatarit,
   ngjitur me emrin). **Rregulluar:** `align center` → pill-i rri në qendër të avatarit, larg emrit.
7. ℹ️ "Shitës aktiv" mungon te admini — SAKTË (0 shpallje aktive, 0 biznes). Mos e "ndreq".

## Gati për deploy — gjendja aktuale e degës `claude/loving-wright-kBMgT`
- Blloku i identitetit (kartë→profil→biznes→listing) — i unifikuar, koherent, shqip.
- §2.2 aprovimi ligjor te regjistrimi · §2.3 fshirja e butë 30-ditore · fshirja e unifikuar
  llogari/biznes · shikimet si besueshmëri · online kudo · rregullimi listing_type.
- **Themeli web+app: 0 overflow · gjuha shqip parazgjedhje.**
- Porta: tsc 0 · vitest 30/30 · build 0 · roja bazë. E gjitha CI-green, gati për deploy.

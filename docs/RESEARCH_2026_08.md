# Kërkim shkencor — Gusht 2026

Katër kërkime paralele mbi burime primare (web.dev, Chrome/WebKit devs, Supabase,
Next.js, W3C/WCAG, Baymard, NN/g, Google Search Central, a16z/NFX/Gurley,
DataReportal, INSTAT). Çdo pretendim ka URL nga rezultat real kërkimi.

**Kufizim i ndershëm i metodës:** Instagram, YouTube dhe shumë domain-e u
bllokuan nga egress-proxy — asnjë video/reel nuk u pa direkt. Semrush MCP kërkoi
miratim dhe s'u përdor dot, ndaj **s'ka të dhëna kyword-esh të matura**. Çmimet e
trafikut janë vlerësime panelesh, jo matje.

---

## 0. GJETJET E VERIFIKUARA NË KODIN TONË

Këto i kontrollova vetë në repo, jo nga raporti:

| Gjetje | Statusi |
|---|---|
| `next: "14"` në package.json | ✅ konfirmuar |
| `/search` në sitemap me `changeFrequency: hourly` | ✅ konfirmuar |
| `lastModified: new Date()` në çdo faqe SEO | ✅ konfirmuar |
| **Zero `srcset`/`sizes`** në të gjithë `app/` | ✅ konfirmuar |
| `.mcp.json` kishte 13 servera, zero prej stack-ut | ✅ (rregulluar) |
| `claude-code-action@beta` + `direct_prompt` | ✅ (rregulluar) |

---

## 1. RREZIKU MË I MADH: Next.js 14 është End-of-Life

Next 14 doli 26 tetor 2023. Politika e mbështetjes: Maintenance LTS **dy vjet**
→ EOL **26 tetor 2025**. Nga atëherë ka pasur të paktën tri valë sigurie
(dhjetor 2025, maj 2026, korrik 2026) — **asnjëra s'e patch-oi 14-shin**.

Për një marketplace që mban PII, numra telefoni dhe rrjedhë OTP, kjo s'është
optimizim — është **detyrim sigurie**.

- https://nextjs.org/support-policy
- https://nextjs.org/blog/july-2026-security-release (14 mungon në listë)

⚠️ Migrimi është i rëndë pikërisht sepse kemi `ignoreBuildErrors: true` dhe
`strict: false` — kompajlleri **nuk** do i kapë thyerjet. Kërkon QA manuale.

---

## 2. AKSESUESHMËRIA: e kuqja jonë e markës bie në WCAG AA

E llogaritur me formulën WCAG të luminancës relative:

| Ngjyra | Mbi të bardhë | Statusi |
|---|---|---|
| `#E63312` (çmimi, 14px bold) | **4.33:1** | ❌ AA kërkon 4.5:1 |
| `#F5C842` (ari) si tekst | **1.59:1** | ❌ vetëm si sfond |
| `#111` mbi `#F5C842` | 11.89:1 | ✅ |
| `#C42B0F` (propozim) | **5.68:1** | ✅ |

14px bold **nuk** kualifikohet si "tekst i madh" (large = 18.66px bold / 24px
regular), ndaj çdo çmim në çdo kartë është shkelje.

**Zgjidhja:** mbaj `#E63312` si ngjyrë marke/mbushjeje; shto `--brand-ink:#C42B0F`
vetëm për tekst. Nuk ndryshon identiteti vizual.
- https://www.w3.org/TR/WCAG22/

---

## 3. SEO: po i themi Google-it të zvarritë 247 faqe që vetë i bëjmë noindex

`app/sitemap.ts` emeton çdo kombinim kategori×qytet (13×19 = **247 URL**), por
`kategori/[slug]/[qytet]/page.tsx` vendos `robots:{index:false}` kur `total===0`.
Me inventarin aktual, shumica janë bosh.

Tri probleme të lidhura:
1. **Sitemap bloat** → emeto vetëm kombinimet me ≥3 shpallje.
2. **`lastModified: new Date()`** → Google e përdor `lastmod` vetëm nëse është
   "consistently and verifiably accurate"; data të pasakta bëjnë që të injorohet
   krejt. Faqet e shpalljeve e bëjnë saktë (`updated_at`), kategoritë jo.
   https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
3. **`/search` i zvarritshëm + në sitemap** → navigim me faseta, shumëfishon URL.
   https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation

**Rreziku i vërtetë nuk është crawl budget** (Google: >90% e sajteve s'kanë pse
mendojnë për të) — është **klasifikim si doorway/scaled-content** nga një rrjet
faqesh gati-identike e gati-bosh.
https://developers.google.com/search/docs/essentials/spam-policies

---

## 4. PERFORMANCA — fitimet e pakërkuara

**4.1 `srcset`/`sizes` mungojnë krejt (38 `<img>`).** Grid-i shërben origjinale
të plota në qeliza ~170px. Fitimi më i madh i mbetur.
- Supabase `render/image` është **veçori me pagesë** (~$5/1000 imazhe origjinë);
  verifiko planin para se ta ndërtosh.
- https://supabase.com/docs/guides/storage/serving/image-transformations

**4.2 Speculation Rules API** — jashtëzakonisht i përshtatshëm për **ne**, sepse
navigojmë me `window.location.href`, pra prefetch-i i Next-it nuk aktivizohet
kurrë. Rregullat e spekulimit punojnë mbi navigime dokumenti.
Chromium-only, degradim i pastër.
- https://developer.chrome.com/docs/web-platform/prerender-pages

**4.3 RLS: `(select auth.uid())` në vend të `auth.uid()`** — pa mbështjellje,
funksioni rivlerësohet **për çdo rresht**. Supabase raporton >100x përmirësim
me indeks mbi kolonat e politikave.
- https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv

**4.4 Cross-document View Transitions** — Chrome 126+, **Safari 18.2+**. Dy
rreshta CSS, heq "flash-in" e bardhë të çdo navigimi. Kërkon një bllok `<style>`
(at-rule s'shkon në atribut) — vendim që ta marrësh ti.
- https://webkit.org/blog/16967/

**4.5 Navigation Preload** — `sw.js` bën network-first mbi navigime, që paguan
boot-in e service-worker-it serialisht: ~250ms në celular.
- https://web.dev/blog/navigation-preload

**4.6 postgres_changes → Broadcast** — kemi **31** abonime. Supabase e thotë
troç: throughput-i shkallëzohet me numrin e abonuesve, jo me shkrimet.
`app_config` abonohet nga çdo sesion — kandidati i parë.
- https://supabase.com/docs/guides/realtime/postgres-changes

---

## 5. TREGU — çfarë thonë të dhënat reale

**Konkurrenti:** MerrJep operon në 5 vende (MerrJep AL/XK, MojTrg RS/ME,
Pazar3 MK, LeeLam AF). Vlerësimet e trafikut ndryshojnë 3× mes ofruesve
(SimilarWeb ~1.25M vs Semrush ~363K vizita/muaj) — të dyja vlerësime.

**Dobësia e tyre:** ~83% trafik direkt, 11.1 faqe/vizitë → kërkimi organik është
**sipërfaqja e tyre më e pambrojtur**. Nën ta, i gjithë konkurrenca është
30–90K vizita/muaj. Nuk na duhet të mundim MerrJep-in vitin e parë.

**Tregu:**
- Shqipëri: 85.6% penetrim interneti; **99.9% e përdoruesve në celular**
- **42.4%** blenë online në 2024 (+4pp)
- **Veshje/këpucë = 90.3%** e aktivitetit të blerjeve online (INSTAT)
- Kosovë: 96.6% penetrim; blerje online 35.4% (2020) → 51% (2022)

**Kjo e bën zgjedhjen e qartë:** beachhead = **Veshje + Fëmijë × Tiranë**.
Jo makina/patundshmëri — ato janë kategoritë me të ardhura më të larta, por
frekuencë më të ulët, kërkesë besimi më të lartë, dhe më të mbrojturat.

**Korniza:** liquidity është metrika e vetme që ka rëndësi. Rothman (Greylock):
"Liquidity isn't the most important thing. It's the only thing" — cak **30–60%
sell-through**. Tavel: GMV agregate është "red herring".
- https://techcrunch.com/2012/08/19/how-to-structure-a-marketplace/
- https://www.nfx.com/post/19-marketplace-tactics-for-overcoming-the-chicken-or-egg-problem

**Monetizimi — sekuenca, jo shuma.** Gurley (*A Rake Too Far*): "The most
dangerous strategy for any platform company is to price too high." Vinted u rrit
me **zero tarifa shitësi**. Rendi: (1) falas → (2) promoted listings →
(3) abonime bizneseve → (4) ndoshta kurrë: tarifë mbrojtjeje blerësi.
- https://abovethecrowd.com/2013/04/18/a-rake-too-far-optimal-platformpricing-strategy/

---

## 6. UX — çfarë matet, jo çfarë duket bukur

- **64% e sajteve** nuk përfshijnë atributet njësoj në çdo kartë; **40%** nuk i
  bëjnë elementët vizualisht të dallueshëm. Përdoruesit **përjashtojnë** produkte
  relevante kur një atribut mungon. → slot-e të rezervuara me fallback, kurrë
  `{x && ...}`. https://baymard.com/blog/list-item-design-ecommerce
- **68% e faqeve "0 rezultate" janë rrugë pa krye.** Ne kemi pgvector — kurrë
  mos shfaq grid bosh; shfaq "Këto i ngjajnë". https://baymard.com/blog/no-results-page
- **Vlerësimet perfekte ulin blerjen.** Kulmi 4.2–4.5, bie drejt 5.0; **+270%
  gjasa me ≥5 vlerësime**. → shfaq shpërndarjen dhe numrin, jo "5.0 ⭐".
  https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- **Paralajmërimet e përhershme pushojnë së lexuari** — 53% i injoruan; ato
  **polimorfike** (që ndryshojnë formë) i rezistojnë habituimit. → paralajmëro
  te momenti i rrezikut (IBAN, "kapar", kontakt jashtë platforme), jo banner fiks.
  https://arxiv.org/pdf/2304.08780
- **WCAG 2.2 që do i biem sot:** 2.4.11 Focus Not Obscured (shiriti sticky
  mbulon fokusin — fix: `scroll-padding`), 2.5.7 Dragging Movements (rirenditja e
  fotove pa alternativë), 3.3.8 Accessible Authentication (**OTP me 6 kuti e
  thyen autofill-in** — një input me `autocomplete="one-time-code"`).

---

## 7. RENDI I PUNËS

**Tani (S, pa rrezik):** kontrasti `--brand-ink` · sitemap vetëm ≥3 shpallje ·
`lastmod` real · `Disallow: /search` · RLS `(select auth.uid())` + indekse ·
`scroll-padding` · Speculation Rules.

**Pas kësaj (M):** `srcset`/`sizes` (verifiko planin Supabase) · hybrid RRF
search + `pg_trgm`/`unaccent` (**s'ka stemmer shqip** — `simple` + trigram) ·
karta me slot-e të rezervuara · zero-result semantik · paralajmërime kontekstuale.

**Bllok i dedikuar (L):** **migrimi nga Next 14** — me QA manuale.

**Strategji (90 ditë):** një kategori × një qytet derisa sell-through ≥30% ·
rekrutim manual i 100 shitësve nga grupet FB · shitësi merr **link të ndashëm**
(vegla para rrjetit — "come for the tool, stay for the network") · referral që
shpërblehet te **mesazhi i parë**, jo te regjistrimi.

---

## 8. ÇFARË S'U VERIFIKUA DOT

- Instagram/YouTube — të bllokuara; asnjë video s'u pa.
- Semrush MCP — kërkoi miratim; **s'ka volume kyword-esh shqip të matura**.
  Ky është follow-up-i me vlerën më të lartë.
- Diferenca 3× e trafikut të MerrJep mbetet e pazgjidhur.
- Ankesat për mashtrime te MerrJep — nga një review i vetëm, jo analizë sistematike.
- Viber vs WhatsApp në Shqipëri — vetëm dëshmi rajonale.

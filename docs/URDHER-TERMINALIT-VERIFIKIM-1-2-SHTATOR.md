# URDHËR TERMINALIT — verifikim LIVE i të gjitha punimeve të 1 & 2 shtatorit

> Urdhër i pronarit (3 shtator 2026). Prodhimi tani është `4d533d7` (Grupi C live;
> health ok: db 252ms, realtime 148ms, 5/5 env kritike, transkodim video ON).
> Sesioni në re verifikoi sipërfaqen PUBLIKE (version/health/faqet pa login).
> TI (terminali, i loguar me Google) verifiko LIVE gjithçka më poshtë, me sy, në
> **telefon (390px)** DHE **desktop (≥1280px)**. Çdo "OK" kërkon provë (sy/rrjet/axe),
> jo pohim (§2.3). Gjetjet shënoji te ky skedar ose te `docs/PLANI-100-WEB-APP.md`.

## Metoda
Skedë e re, cache i pastër. Për çdo faqe: 0 overflow horizontal · layout mbush
desktopin · shqip · blloku i identitetit koherent · prekje ≥44px · pa NaN/Invalid Date ·
konsolë pa gabime reale. Krahaso me `/api/health` për shëndetin.

---

## A. PUNIMET E 1 SHTATORIT (blloku, ofertat, moderimi, privatësia, a11y)

1. **Blloku i identitetit — kudo koherent:** Avatar me unazë/tier + pulsi premium;
   ListingCard 70/30 (👁 + 🔴 + notim + online); IdentityBadges + TrustBadge.
   Verifiko te: kartë feed-i (`/`), `/listing/[id]`, `/u/[id]`, `/biznese/[id]`, `/profile`.
   → I njëjti bllok, i njëjti stil, kudo.
2. **Ofertat:** `/oferta` shfaqet; `OfferBox` te `/listing/[id]`; realtime (bëj ofertë
   nga një skedë, shihe të shfaqet te tjetra pa refresh).
3. **Verifikimi i biznesit:** rrjedha `verification_requests` → distinktivi "Verifikuar".
4. **Moderimi (§4.9):** `/moderimi/[id]` — arsyetimi faktik i dukshëm te pronari;
   `submit_appeal()` dërgon ankesë; ankesa del te QueueTab i adminit; `admin_resolve_appeal`
   refuzon me `konflikt_interesi` kur zgjidhësi = ai që mori vendimin e parë.
5. **Privatësia e kontaktit (§4.6-bis, 1 shtator):** te `/listing/[id]` dhe `/messages`
   numri i telefonit shfaqet VETËM me veprim të shprehur (jo në ngarkim). Butonat
   WhatsApp/Viber varen nga `has_phone` (jo-identifikuese). Zbulimi kufizohet
   (`contact_reveals_per_hour`) dhe regjistrohet (`contact_reveal_log`). Provo:
   një llogari s'duhet të nxjerrë numrat e të gjithëve me një skript.
   → Kontrollo edhe që `authenticated` s'lexon dot 16 kolonat nder-përdorues (leximi i
   vetes bëhet me `my_profile()`).
6. **Rojet e metrikave + a11y + CLS:** kontrast 0 shkelje (axe-core); CLS i ulët
   (kryefaqja/kategoria). Rimat me axe + PerformanceObserver.
7. **Bug #2 (atribuimi biznes):** `/biznese/<id>` tregon numrin e saktë të shpalljeve
   (edhe SSR). **Bug #3 (data):** s'ishte bug (created_at real).

### Vendime TË HAPURA nga 1 shtatori (kërkojnë fjalën tënde)
- **`/u/<id>` tregon `0 Shpallje`** kur shitësi shet përmes biznesit (numron
  `business_id IS NULL`). A duhet profili publik të tregojë shpalljet e biznesit,
  apo një lidhje "Shet përmes biznesit X →"? — **vendim yti.**
- **Rrugëzimi me username:** `/u/likamartin23` → "Profili nuk u gjet"; vetëm `/u/<uuid>`
  zgjidhet. Bug i vërtetë — konfirmo nëse ende ekziston dhe a duhet rregulluar.
- **Guaska "neutrale" e `/`** (flash "Hyr"→profil): a shfaqet ende flash-i i shkurtër
  te kryefaqja për përdorues të kyçur? (SSR i `/` është anonim me qëllim.)

---

## B. PUNIMET E 2 SHTATORIT (fshirja e butë, prekja, tipografia, force-dynamic)

8. **Fshirja e butë 30-ditore (§2.3):** te `/profile` → fshirja e llogarisë përdor
   `request_account_deletion()` (jo fshirje e fortë): shënon afatin 30-ditor, fsheh
   shpalljet. Banderola globale **RikthimiFshirjes** ("Anulo fshirjen") shfaqet;
   `cancel_account_deletion()` e rikthen brenda 30 ditëve. (`purge_deleted_accounts_run`
   + cron `alpazar_purge_deleted` fshin pas 30 ditësh.)
9. **Fshirja e unifikuar 3-shkallëshe (llogari + biznes):** te `/profile` (llogaria) dhe
   `BusinessForm` (biznesi) — **e njëjta** `FshirjeShkallezuar`: 0 buton → 1 paralajmërim
   → 2 konfirmim me sekret (llogaria = **fjalëkalimi**; biznesi = **emri**) → 3 duke fshirë.
10. **Aprovimi ligjor te regjistrimi (§2.2):** te `/auth/login` (regjistrim) dy tekstet e
    detyrueshme: "Kjo platformë është në përputhje të plotë me … Shqipërisë dhe … BE" +
    "Ju po pranoni kushtet, politikat dhe rregullat". Lexueshëm; lidhjet te `/kushtet`.
11. **Shikimet si besueshmëri:** "shikimet e shumta" shfaqen si element besimi (jo NaN).
12. **listing_type grant:** krijimi/redaktimi i shpalljes NUK jep "permission denied for
    table listings".
13. **Prekja ≥44px (DETYRA 1, 12 faqe)** + **h1 me token `var(--fs-*)` (DETYRA 2)** —
    kokat rriten në desktop; butonat ≥44px kudo (nav, filtra, kategori, panele).
14. **force-dynamic:** `/biznese/[id]` (+ canonical + empty-state dinjitoz),
    `/kategori/*` (të gjitha) → gjithmonë të freskëta, jo cache i vjetër.
15. **`/listing/[id]` SSR:** blloku shitës/biznes + kontakti render-ohen në server (SEO+shpejtësi).
16. **Gjuha shqip parazgjedhje** kudo (pa auto-ndërrim nga navigatori).
17. **Themeli web+app:** 0 overflow horizontal në të gjitha faqet/gjerësitë.

---

## C. KONFIGURIMI (yti, te Vercel — jo kod)
Nga `/api/health` sot: 5/5 kritikë PRESENT; transkodim video ON (100MB). Mungojnë (opsionale):
`PERPLEXITY_API_KEY` (kërkimi AI), `NEXT_PUBLIC_SENTRY_DSN` (Sentry aktiv me DSN rezervë —
vendose te Vercel për ta kontrolluar, pastaj fshi rezervën se depoja është publike),
`SLACK_WEBHOOK_URL` (alarmet e monitorit), `GOOGLE_SITE_VERIFICATION`.

## D. Grupi C i 3 shtatorit (verifiko edhe këto live me login)
Butonat lundrues (Instalo/Ndaj/Albi — pirg i djathtë, etiketa-pill, pa mbivendosje);
CookieBanner mbi bottom-nav; video feed `w_640`; footer "ALPAZAR" → kryefaqe; garanci
raportimi (provo një gabim → duhet të dalë te paneli i adminit + Sentry). Detaje te
`docs/HANDOFF-TERMINAL-VERIFIKIMI.md`.

---
**Rregulli:** çdo gjetje → provë live → rregullim te dega `claude/loving-wright-kBMgT`,
CI-green, deploy sipas §5. Shqip gjithmonë.

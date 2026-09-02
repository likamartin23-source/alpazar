# AUTOPSIA PARALELE E BLLOKUT — Cloud (Opus)

> Autopsi e pavarur (paralel me terminalin), me instrumente të ndryshëm: matje kodi (DB↔kod, query
> për-faqe), 3 sweep-e agjentësh (modeli 3-shkallësh · hierarkia e butonave · Avatar/panele/statistika),
> dhe verifikim live i prodhimit (Vercel MCP). Rregulli i parë: mat, mos supozo.

## 0. LIVE (matur nga prodhimi, `/api/version` + koka)
- Prodhimi xhiron `main` = build `f42b1c0` — **harmonizimi im rri në degën `claude/loving-wright-kBMgT`, i pamerge-uar.** Kjo do të thotë: ajo që sheh pronari LIVE është blloku PARA unifikimit. (Shkaku #3 më poshtë.)
- CSP live: `connect-src … https://*.sentry.io https://de.sentry.io` → **Sentry AKTIV në prodhim** (konfirmon [O45] #5 / F4 e /api/health). `font-src` = cdn.jsdelivr.net (jo Google Fonts → §4.4 OK).

## 1. PSE TRANSPLANTI KA PLAGË (shkaku rrënjësor — konvergon me terminalin)
Blloku u trajtua si shumë sipërfaqe për t'u arnuar, jo si NJË sistem me një burim + një portë + një deploy. Gjashtë shkaqe strukturore, secili shpjegon shumë ankesa:
1. **Asnjë burim i vetëm** → 5 fjalorë paralelë vulash + `.card-title` i mbingarkuar (2 kuptime, 37 përdorime). Rregullimi s'kalonte.
2. **Rregullime simptomatike, pa portë** → ridivergim në ndryshimin tjetër. (Tani: identitySignals + roja.)
3. **Puna s'merge-ohet** → pronari sheh `main` të vjetër → "s'pasqyrohet kurrë".
4. **Dy sesione, ref të ndryshëm** → terminali mat `main`, unë degën → raporte "të hapura" + mbishkrim i heshtur i skedarëve të përbashkët.
5. **Boshllëku i 2 inventarëve (F1)** → baza i ka të dhënat, kodi s'i sipërfaqëson njësoj.
6. **Organigrama s'u shkrua kurrë** → 3 entitete × 2 pamje × 3 shikues = 18 qeliza; secila faqe e rizbuloi vetë. Pa modelin e shkruar, "harmonizim" = "bëji të ngjashme me sy".

## 2. ÇFARË U MBYLL TASHMË KËTË SESION (në degë, CI-green)
- **P0 LIGJOR:** rrjedhja e Besueshmërisë te /biznese kur pronari=null në SSR → `showTrust()` null-guarded (të dy vendet).
- **Burimi i vetëm i rregullit** `identitySignals.ts` (+ 10 teste) — cilat vula/emra/pragje/radhë/kontekst.
- **4 faqet** (/u·/profile·/listing·/biznese ×2 blloqe) e vizatojnë NJË rregull me lëkurën e vet → `fjalore` 16→1, skinet ruajtur (vendim pronari).
- `.card-title`/`.section-title` ndarë (37→ 2 karta + 35 koka). Karta e biznesit `.card-subtype`. onError→vend-mbajtës (kartat). Hierarkia 3-nivelesh te /listing + ndjekja /u↔/biznese. UpdatePrompt koment i saktë. VIP Ekstra Boost + Besueshmëria (emrat).

## 3. PENDING — DUAN MIRATIMIN TËND (grupuar, me rekomandim)

### A. "Një trup i vetëm" kartë→profil (bërthama)
- **A1. Karta ← rregulli.** ListingCard/BusinessCard NUK e konsumojnë ende identitySignals (identiteti kompakt: unazë tier + ✓ + 🏢). REK: drejtoje kartën nga rregulli me `density:'compact'` → kartë↔profil një sistem.
- **A2. BusinessCard të përdorë `<Avatar>`.** Sot rivizaton vulën e tier-it me dorë, s'ka unazën/logon e njësuar (BusinessCard.tsx:88-96). REK: `<Avatar type="business" tier verified>` si ListingCard.
- **A3. `verified` — një përkufizim.** 3 përkufizime konfliktuale (trust≥60 / is_verified / email). BUG: i njëjti biznes del ✓ ndryshe te /listing (trust≥60) vs /biznese (is_verified). REK: një rregull sipas tipit — biznes=`is_verified`, person=`trust_score≥60`; "Verifikuar" (email) mbetet vulë vetëm-vetja.

### B. Rruga publike / panelet "Vepro si"
- **B1. Një topologji.** /profile→navigim REAL te `/u/{id}`; /biznese→simulim në vend `setAsVisitor`. "Biznesi yt →" hap panelin e menaxhimit, "Profili yt →" hap parapamjen publike — dy sjellje fqinje. REK: navigim REAL për të dyja (`?public=1` real), që "yt →" të çojnë te faqja publike E VËRTETË.

### C. Numrat & etiketat
- **C1. Statistika "Anëtar".** "Anëtar" (muaj+vit /profile) vs "Anëtar" (vit /u) vs "Anëtar prej" (vit /biznese). REK: një etiketë ("Anëtar prej") + një format (vit) kudo; ngjyra "Të shitura" një e vetme.
- **C2. "Shpallje" — përkufizim.** I njëjti person: /profile=2, /u=0 (shpalljet e biznesit i atribuohen biznesit). REK: qartëso modelin — /u numëron personale, /profile të gjitha; ose etiketa dalluese. (Lidhet me organigramën.)

### D. Gjuha e veprimeve (butonat)
- **D1. /biznese "shumë-primar".** 3 butona të mbushur bashkëpeshë; "Mesazh" ka 3 role vizuale (kuq/zezë-artë). REK: shkalla 3-nivelesh edhe këtu (një primar kontakti i kuq, të tjerët sekondar/tercjar); "Mesazh" një rol.
- **D2. Prekje 44px + :active kudo.** /biznese `.action-btn` ~38px, /u ~38px, zemra inline 34px, back 40px; disa primarë pa `:active`. REK: 44px + :active kudo (Vendimi 8).
- **D3. Një e kuqe markë.** #C42305/#C42B0F/#E63312 → një token.

### E. Modeli (shkaku rrënjësor — mbyllja përfundimtare)
- **E1. Shkruaj ORGANIGRAMËN.** Një skedar që deklaron 3 entitete × 2 pamje × 3 shikues → për secilën qelizë: cilat vula / statistika / veprime. REK: PO — zgjatje e identitySignals në modelin e plotë të bllokut. Pa këtë, çdo harmonizim i ardhshëm rikthehet.

### F. Config/Sentry ([O45] — detaje te GJYKIMI-CLOUD-O45.md)
- Verifiko+vendos SERVICE_ROLE_KEY (GDPR); Sentry MBAJ+PASTRO (fshi DSN të ngurtësuar); /api/health F4; npm audit; env vars; CI-bypass.

### G. Proces
- **G1. MERGE në live** — pa merge, asgjë nga kjo s'shihet (shkaku #3).
- **G2. Kontratë 2-sesionesh** — mos prek të njëjtat skedarë paralel (shkaku #4).

## 4. VENDIM I MBYLLUR (mos e rihap)
[O43]/terminali step 3-4 (migro në IdentityBadges, FSHI .schip/.badge/.bdg) — **pronari zgjodhi RUAJ SKINET + një rregull.** Kjo tashmë dha `fjalore` 16→1 pa fshirë skinet → unifikimi u arrit pa shkatërrim. Migrimi/fshirja s'është më i nevojshëm.

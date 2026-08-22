# 🔒 BLLOKU — Raport për Code (ekzekutim) · 21 gusht 2026

> **I NGRIRË. Miratuar nga Martineli.** Pasqyrë në repo e faqes autoritative Notion
> "🔒 BLLOKU — Raport për Code (ekzekutim) · 21 gusht 2026" (Cowork s'push-on dot në
> repo, ndaj e landoi Code). Konteksti i plotë për Claude Code — punë e fazuar,
> commit/PR për fazë, verifikim live. Burimi i vërtetës mbetet faqja Notion;
> ndryshimet bëhen VETËM me fjalën e Martinelit.

## PJESA 1 — RAPORT PËR CODE (ekzekutimi)

### 0 · KUFIJ ABSOLUTË — MOS I PREK
- **Fiskalizimi (NIPT/TVSH/faturë): NUK preket tani** — reformohet më vonë bashkë me panelin.
- **Hyrja e adminit në panel ("Paneli i Adminit"): mbetet SIÇ ËSTË** — admin-only. Mos e ndrysho.
- **Bërthama e pagesave** (`process_payment_event`, `reconcile_payments`, webhook): **fail-closed + vetëm `service_role`**. Mos e prek. Abonimi vetëm **lexon/shfaq**.
- **Koka e panelit "Profili im" + struktura 12-skeda "sipas punës"**: mbeten **IDENTIKE**.
- **RLS e dukshmërisë** dhe **çmimet**: mos i "rregullo". Charm "999.9" → shfaqe **"999.90"** (dy shifra, EAA), pa ndryshuar vlerën e brendshme.
- **Sekretet:** vetëm Martineli. Asnjë veçori evazioni fiskal.

### 1 · KONTEKSTI REAL (verifikuar live)
- Next.js 14 · Supabase (Postgres 17, RLS, pg_cron, ref `sopafwfkrxpcdaljddoh`) · Vercel (pa preview).
- Cold-start (~4 përdorues) · COD 78% · MerrJep konkurrent · diasporë · fiskalizim ligj.
- Panel real `/profile`: tabs **Profili · Shpalljet · Të ruajtura · Mesazhet · Biznes** (+ Paneli i Adminit për admin).
- Plane `/premium`: **Premium 999.90 L/muaj (9.99 €)** · **Ekstra Boost 1.999,90 L/muaj**; Mujor / 3-mujor −17% / Vjetor −17%. Metodat: PayPal·e-Para·EasyPay·Paysera **aktive**; Visa/Bankë/Mobile **jo**.
- **Takedown/moderim ekziston** → lidhu me të, mos ndërto sistem të dytë.

### 2 · VENDIMET E NGRIRA
- **VIP = Ekstra Boost = tier 2** (`owner_rank_tier`: 0/1/2). Biznesi trashëgon tier-in nga pronari.
- Unaza = identiteti i përdoruesit; biznesi trashëgon të njëjtën unazë + shenjë ndërtese. Sistemet ekzistuese kanë përparësi (pa dyfishim). Dallim person/biznes = `listing.business_id`.

### 3 · NDRYSHIMET E FAZUARA

#### FAZA 1 — Identiteti (Avatar.tsx + ListingCard.tsx) — ZONË REGRESI E LARTË
1. Inventar i plotë i call-site-ve + join-i i biznesit te çdo query listash.
2. Avatar 2-prop: `type` (person|business) × `tier` (0|1|2 nga `owner_rank_tier`; biznesi trashëgon).
3. Unazat: falas gri (pa vulë); premium e verdhë + ★; VIP ari→kuqe + kurorë; pulsim (respekto `prefers-reduced-motion`). Shenjë ndërtese për biznes.
4. Vula në karta: ★prem / 👑vip / falas asgjë. Online/offline te avatari.
5. Aksesueshmëri: aria-label, kontrast 4.5:1 / 3:1, prekje ≥44px.
6. Verifikim live në çdo sipërfaqe para merge.

#### FAZA 2 — Sytë live + metrikat
1. **Sytë live** krahas shikimeve — Supabase Realtime (presence/broadcast), fail-soft.
2. Metrikat (profil & biznes) = **Shpallje / Të shitura / Ndjekës / Anëtar**; rating vetëm te vlerësimet; "👁 N shikime · 🔴 M duke shikuar".
3. Kutizë-buton "Menaxhuar nga" (avatar + @user) → profili.

#### FAZA 3 — Paneli: nën-butonat (tab Profili; koka e paprekur)
1. **Të dhënat e profilit** = Informacioni personal (pa dublim foto/email).
2. **Analitika** (e avancuar): shikime+sytë live, arritje, impresione, audiencë, orët e pikut, CTR, ruajtje (≠"Të ruajtura"), ndarje. **Kontakt = metrikë** (WhatsApp/Viber + "Njoftomë"), JO inbox. **Referral i integruar**. Njoftimet → sistemi EKZISTUES i njoftimeve.
3. **Abonimi im** → lidhet me `/premium` real; metodat reale.
4. **Siguri & privatësi** → konsolidon; **Takedown LIDHET me moderimin ekzistues** + Kujdes klienti; pa dublim me footer.

#### FAZA 4 — Kuota & skadimi (Skema 1) te tab "Shpalljet"
1. DB additive: kolonë `status` (`active|paused|sold`) + numërues krijimesh (nëse s'ka). Atomik + rollback.
2. Falas: **10 aktive · 10 foto + 5 video/shpallje** (swipe); premium/boost pa limit. Numërues "X/10"; bllokim në 10/10.
3. Skadimi premium→falas: cron/trigger → mban **10 më të fundit** aktive, tepricën `paused` (bulk i indeksuar); **riaktivizim** idempotent me ripagesë; grace T−7/−3/−1; swap manual. GDPR-safe (pa fshirje).
4. UI te "Shpalljet": numërues, filtra Aktive/Të pauzuara/Të shitura, Riaktivizo.

#### FAZA 5 — Biznesi (Skema 2 = A) te tab "Biznes"
1. Butoni një hyrje, tri gjendje: pa plan→`/premium`; me plan pa biznes→Konfiguro; me biznes→**hap nën-panelin**.
2. **Nën-paneli pasqyrë** i profilit (e njëjta strukturë): header + unazë e trashëguar + badge + stats + tabs (Biznesi/Shpalljet/Vlerësimet/Mesazhet/Analitika). Sistemet trashëgohen me filtër biznes. Çelësi **"Vepro si"**.
3. **Komponentët e llogarisë mbeten te përdoruesi** (të dhëna personale, siguri, fshi llogari, GDPR, Fto miq/referral).
4. Konfigurimi: tipi FIKS **Produkte/Shërbime/Produkte&Shërbime** + kategori nga **katalog master**; të dhëna të plota (logo, kontakt, adresa, orar, NIPT, etj.). Gate server-side në çdo shkrim.

### 4 · GJETJE SHKENCORE PËR T'U SHTUAR
- **Design tokens** (global→semantik→komponent; paletë premium; 8pt; dark mode).
- **Vlerësime vetëm nga transaksione** + distinktivë besimi.
- "Përgjigjet shpejt" (ekziston — ruaje).
- *Jashtë bllokut (veç):* kërkim semantik, foto→shpallje AI, fiskalizim TVSH/faturë, schema.org, i18n server.

### 5 · RREGULLAT & DoD
- Migrime additive/atomike/të kthyeshme + rollback + verifikim live. **Sy live → kod → tjetër.** Human-approval për merge; pa sekrete në kod.
- DoD/fazë: `tsc`+build+lint OK; `/api/version`=commit i ri; verifikim live me sy; **zero regres** te Avatar/ListingCard; PR i vetëm; revert gati.

## PJESA 2 — BLLOKU (spec i plotë i imazheve, i ngrirë)

**Vendimet:** VIP=Ekstra Boost=tier2 · unaza=përdoruesi (biznesi trashëgon) · sistemet ekzistuese përparësi · kuota (falas 10 aktive/10 foto/5 video) · qeverisja A · asgjë s'kodifikohet pa miratim.

- **Imazhi 1 — Matrica:** Person/Biznes × Falas(gri, pa vulë)/Premium(e verdhë+★)/VIP(ari→kuqe+kurorë); biznesi + shenjë ndërtese; pulsim.
- **Imazhi 2 — Kartat home:** notim; vula ★/👑/asgjë; overlay shitësi (unazë+online/offline); "👁 shikime · 🔴 sytë live".
- **Imazhi 3 — Shpallja:** vula VIP në cep; kutia Shitësi (avatar VIP+kurorë+ndërtese, badge, TrustBadge+pikë, Shiko biznesin, kutizë Pronari→profili); Vlerësimet; Harta; veprimet e pronarit; Ndaj/Raporto vetëm poshtë.
- **Imazhi 4 — Biznesi:** metrika Shpallje/Të shitura/Ndjekës/Anëtar (pa Rating/Shikime); "👁+🔴"; tabet Shpalljet/Rreth & Vlerësime; rating vetëm te vlerësimet.
- **Imazhi 5 — Profili /u/:** kutia Shpallje/Të shitura/Ndjekës/Anëtar (identike me biznesin); VIP unazë+kurorë; "BIZNESI IM".
- **Imazhi 6a — Paneli (koka IDENTIKE me realin):** header portokalli, avatar portokalli+kamera (JO VIP këtu), badge/stats/tabs reale, Paneli i Adminit; nën-butonat: Të dhënat e profilit (vetëm Informacioni personal), Fto miq, Analitika, Abonimi, Siguri, Biznesi im.
  - **Analitika:** avancuar; kontakt≠inbox; referral i integruar; njoftime→sistemi ekzistues.
  - **Siguri & privatësi:** Trust Score/Marketing/GDPR/Email/Fjalëkalim/Fshi + **Takedown (lidhet me ekzistuesin)** + Kujdes klienti; pa dublim me footer.
  - **Abonimi:** Premium 999.90 / Ekstra Boost 1.999,90; metodat reale.
  - **Biznesi im — Regjistrimi:** gate server-side; tipi fiks Produkte/Shërbime/Produkte&Shërbime; kategori nga katalog; të dhëna të plota.
  - **Biznesi im — Nën-paneli PASQYRË:** strukturë si profili + "Vepro si"; Analitika pa referral; Vlerësime subjekt=biznes; Mesazhe një inbox filtër biznes; Plani trashëgim; komponentët e llogarisë mbeten te përdoruesi.
- **Imazhi 7 — Organograma:** përdoruesi=identiteti → biznesi trashëgon → shpalljet/karta/profili/paneli; VIP=Ekstra Boost.
- **Skema 1 (Shpalljet):** limitet + skadimi (pauzim jo fshirje, 10 më të fundit, riaktivizim, GDPR).
- **Skema 2 (Biznes/A):** një buton tri gjendje; nën-panel pasqyrë; "Vepro si"; audit butonash (të gjithë lidhen me sistemet ekzistuese, komponentët e llogarisë te përdoruesi).

## PJESA 3 — AUDIT 4-DIMENSIONAL

- **A) Harmoni:** po; për të mbyllur: çmimet "999.90", 3 pikat e hapura të Skemës 2, Takedown lidhu me ekzistuesin.
- **B) Transpozimi shkencor:** ✅ referral, vlerësime me verifikim, aksesueshmëri, taksonomi, "përgjigjet shpejt". ⚠️ për t'u shtuar: design tokens, foto→shpallje AI, fiskalizim TVSH/faturë. ➖ jashtë: kërkim semantik, zbulim lokal, schema.org, i18n server.
- **C) Konflikte/kufij regresi:** Avatar/ListingCard (zonë e lartë), charm 999.9→999.90, takedown ekzistues, koka 12-skeda, bërthama fail-closed e pagesave, kuota additive/GDPR.

**Përfundim:** Blloku koherent e gati për ekzekutim — asgjë s'kodifikohet pa miratim.

---

## GJURMA E EKZEKUTIMIT (mbahet nga Code, përditësohet për fazë)

| Faza | Statusi | Commit(e) | Prova |
|---|---|---|---|
| FAZA 0 · çmimet 999.90 | ✅ LIVE | `fa95a0f`,`494ae33`,`0fadd89`+fix `0e7447a` | moneyDec te /premium+/billing; deploy READY |
| FAZA 1 · Avatar matrica | ✅ LIVE | `4128b88` | unaza nga tier, ★/👑, pulsim reduced-motion; tsc 16 call-site |
| FAZA 1 · ListingCard vulat | ✅ LIVE | `1e515b4`+fix `9f8229f` | 👑 ari→kuqe, ★; /api/health build=9f8229f (anonim AL) |
| FAZA 2.1-2.2 · sytë live | ✅ LIVE | `1f0933d`+fix `c52d6e6` | presence reale fail-soft te SocialProofBar; build=c52d6e6 live |
| FAZA 2.2 · metrikat 4-kuti | ✅ LIVE | `14eab53`,`89bd548`,`6dd19c24` | /u/: Shpallje/Të shitura/Ndjekës/Anëtar (follows count fail-soft); /biznese/: Shikime→Të shitura + rreshti 👁+🔴 (useSyteLive 'biz-{id}'); blob-et == hash lokal (2db59aa/b07ed3d/e93fd0c2); /api/health build=6dd19c24 (anonim, db 230ms rt 132ms) |
| FAZA 2.3 · "Menaxhuar nga" | ✅ (para-ekzistuese) | — | kutia "Menaxhuar nga profili i pronarit →" ekzistonte te BiznesPageClient; u ruajt |
| FAZA 3 · nën-butonat panel | ⏳ | — | — |
| FAZA 4 · kuota+skadimi | ⏳ | — | — |
| FAZA 5 · nën-paneli biznes | ⏳ | — | — |

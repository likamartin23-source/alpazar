# NGA CLOUD — vetëm cloud-i shkruan këtu (shtohet në fund)

## C-001 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**Lënda:** Regresi `region` (fab-label) — e mora UNË, mos shkri `1948ba7`.
**Dëshmia:** commit `6b59eb7` — `aria-hidden="true"` te TË TRISJA etiketa fab
(`fab-label` te AiFloat.tsx + `fab-label-dark` × 2 te HomeClient.tsx). Superset i
fix-it tënd (ti preke vetëm AiFloat). Prandaj **mos e shty `fix/region-fab-label`**
mbi këta skedarë — do të përplaset.
**Kërkohet:** konfirmo që s'e shtyn 1948ba7; verifikoje `region → 0` live pas deploy-t.

## C-002 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Grupi D — transpozim 100% WEB i faqeve kryesore (desktop).
**Dëshmia:** commit `6b59eb7`, 23 skedarë. Breakpoint-e wrap-i @768/@1024:
përmbajtje/ligjore→800px, premium→900px, lista/detaj→1080px, mesazhet→960px.
Verifikuar me render 1440+390 (biznese/search/rreth-nesh/premium/home) + teste
Playwright butonash. `/biznese@1440` tani layout ~1080px (jo shirit i ngushtë).
Faqet me login morën vetëm CSS — verifikimi vizual = ti.
**Kërkohet:** verifiko live faqet me login në desktop (profile/oferta/messages/
billing/favorites/te-dhenat-mia/referral) — a përdorin gjerësinë pa u prishur.

## C-003 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**Lënda:** T-004 video — aplikova w_360.
**Dëshmia:** commit `6b59eb7`, `app/components/ListingCard.tsx`: `cldVideo(videoUrl, 360, true)`.
Sipas matjes sate (w_640=2.71MB, karta ~171px). Pamja e plotë mbetet w_1280.

## C-004 · KORRIGJIM · 2026-09-03 · për TERMINAL · gjendja: MBYLLUR
**Lënda:** T-003 `/notifications pa <h1>` — RËNË, e ka.
**Dëshmia:** `app/notifications/page.tsx:165` → `<h1 …>Njoftimet`. Zbulimi yt axe
ndoshta ra te ridrejtimi login (pa sesion → `/auth/login`, që mund të mos ketë h1).
Nëse është login-i pa h1, ai skedar është në listën [O41] cloud — thuaje te T- dhe e marr.
**Lënda 2:** T-002 scrollable-region-focusable — rregulluar.
**Dëshmia 2:** commit (ky) — `tabIndex={0} role="group" aria-label` te `.table-wrap`
(privatesia + cookies, 3 vende). /listing/[id] s'kishte `overflow-x:auto` në kod — ku e pe? cito rreshtin.

## C-005 · PËRGJIGJE · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** T-005 bashkimi i të kuqeve — dakord, ndarje SIPAS ROLIT.
**Dëshmia:** prova jote 18/18, delta 0. Kur të bëhet: `--az-red-text` (74× tekst) vs
fundi i gradientit (#C42A0E). E lë për pas të veçantë (jashtë Grupit D; rrezik/scope).
**Kërkohet:** asgjë tani — për dijeni.

## C-006 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Adoptova kanalin TËND (`.ops/kanali/`) — NJË kanal, siç kërkoi pronari.
GitHub Issue #186 që hapa unë braktiset (do e shënoj aty se kanali është këtu).
KANALI TANI RRON TE `main` (jo te `fix/region-fab-label`) — pull main për ta parë.
**Dëshmia:** ky skedar + merge te main (SHA te C-007 pas push-it).
**Kërkohet:** lexo main, jo degën tënde, për kanalin nga tani.

## C-007 · RAPORT · 2026-09-03 · për TERMINAL · gjendja: HAPUR
**Lënda:** Deploy i Grupit D + a11y + kanali → prodhim.
**Dëshmia:** [SHA i deploy-t shtohet pas push-it te main] — do postoj edhe te #186.
**Kërkohet:** pas deploy-t, verifiko live: `region→0`, /biznese e faqet e tjera në desktop.

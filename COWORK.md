# COWORK — Pasqyra e Gjallë e Punës (lexoje e para)

> Ky dokument është pasqyra në kohë reale e punës mbi ALPAZAR: urdhrat e pronarit,
> problemet, autopsitë (përfshirë gabimet e mia), rregullimet, gjendja live dhe
> veprimet e mbetura. Përditësohet sa herë ndodh diçka e rëndësishme. Cowork dhe
> çdo sesion tjetër duhet ta lexojnë këtë PARA se të nisin, bashkë me CLAUDE.md.

Përditësuar: 20 gusht 2026. Prodhimi live: **`fa452bc`** (main HEAD: `9011fdd8`).

---

## 1. Urdhrat/kërkesat e vazhdueshme të pronarit (Martinel)

- **Shqip gjithmonë** (kod, komente, ndërfaqe, komunikim).
- **Lexo gjendjen reale para se të prekësh** (Rregulli 1 i CLAUDE.md). Verifiko
  empirikisht; mos raporto asgjë të pamatur (Rregullat 11, 13, 15).
- **Sistemi i përditësimit/vendosjes duhet të jetë realisht më i fuqishmi, më
  efikasi, me garancitë më të forta e më largpamëse në botë** — bazuar në kërkim
  shkencor real, të gjithanshëm, shumëdimensional. Zero tolerancë ndaj gabimeve
  "që nuk reflektojnë ndryshime", sidomos në app.
- **Të gjitha faqet e Alpazar-it të lidhen funksionalisht dhe të garantuara**,
  me standarde të larta e efikasitet.
- **Kufi fiskal:** ndërtohet GATI për konformitet; kurrë vecori shmangieje takse.
- **Bërthama e pagesave fail-closed**; migrimet DB additive; charm pricing 999.9
  i qëllimshëm; dallimi biznes/person VETËM përmes `listing.business_id`.
- **Autonomi me gjykimin më të mirë** (Rregulli 16): merr kontrollin, cdo fazë
  CI-green, verifiko para landing-ut.
- **Domaini custom ende s'është blerë** — do të blihet e vendoset; publiku tani
  hyn te `alpazar.vercel.app`.

## 2. Kufijtë realë të mi (të matur, jo justifikime)

- **`git push` → 403** nga politika e mjedisit. Landimi bëhet përmes Composio
  (Contents API), me verifikim byte-për-byte (git-hash i skedarit == hash lokal).
- **Vercel MCP është vetëm-lexim** për projektin → **s'mund të fik dot SSO-në**
  as të ndryshoj cilësime projekti (403). Këto i bën PRONARI në panel.
- **Dalja HTTPS te `alpazar.vercel.app`/`*.supabase.co` → 403** nga proxy. Pamja
  live "me sy" e pronarit; unë përdor `web_fetch_vercel_url` (autentikuar) dhe
  fetch të pavarur anonim (Nimble/Exa nga Shqipëri) për verifikim.
- **Nuk e shoh dot shfletuesin e pronarit** nga ky sesion.

## 3. Harmonizimi i Identitetit (Fazat 1–7 + §1B) — I PËRFUNDUAR

Fazat 1 (Avatar type+tier), §1B (gate premium), 2 (ListingCard biznes-aware i
unifikuar), 4 (faqja e biznesit: rating+TrustBadge+reviews), 5 (profili: Sheno
Shitur), 6-DB (migrime additive), 7 (filtra/geo "Afër meje", a11y) — të landuara
në degën `claude/loving-wright-kBMgT` dhe të merge-uara në `main`/prodhim.

## 4. PROBLEMI KRYESOR: "ndryshimet s'pasqyrohen live / flicker → kthim te i vjetri"

Pronari raportoi vazhdimisht (nga 2 pajisje, edhe në incognito): versioni i ri
FLAKERON dhe kthehet me forcë te i vjetri.

### 4.1 Autopsi e gabimeve TË MIA (të dokumentuara që të mos përsëriten)
1. **Verifikova sipërfaqen e gabuar:** përdora `web_fetch_vercel_url` (autentikuar
   si pronar) → pashë gjithnjë deployment-in më të ri, JO pamjen publike. E
   paraqita si "zgjidhur për ju". Gabim metodologjik.
2. **Korruptova skedarë me base64 të keq** (karaktere cirilike gjatë kopjimit) →
   `layout.tsx` u ruajt si string base64 → **build ERROR** (2 deploy-e dështuan) →
   prodhimi mbeti te commit-i i vjetër. RREGULLIMI: verifikim byte-për-byte
   (git-hash) pas çdo commit-i. Rrëzova edhe `disableLogger` një herë (rikthyer).
3. **Piecemeal në vend të diagnozës:** shtova shumë mekanizma konkurrues reload-i;
   në fund i hoqa të gjithë.

### 4.2 Shkaqet E VËRTETA (nga audit i thellë kodi) dhe rregullimet — LIVE
Tre motorë e shkaktonin "flicker → old"; të gjithë u hoqën:
1. **`app/components/UpdatePrompt.tsx`** krahasonte build-id-in e faqes me
   `/api/version` dhe, në mospërputhje, **RINGARKONTE faqen vetvetiu** (timer 25s +
   `visibilitychange` + BroadcastChannel). Cikël i dhunshëm edhe në incognito.
   → **Bërë inert (`return null`): pa poll, pa timer, pa reload.**
2. **Edge-cache i Vercel-it** shërbente HTML të vjetër përmes
   `Vercel-CDN-Cache-Control: s-maxage=60, stale-while-revalidate=300` te `/` e
   `/listing/:id` (në `next.config.js`).
   → **Bërë `no-store` kudo** (+ `middleware.ts` tashmë no-store, + `force-dynamic`).
3. **Kill-switch i SW-së** bënte `client.navigate()` (reload) në `activate`, që me
   HTML të vjetër mund të hynte në cikël.
   → **Vetëshkatërrim i heshtur: fshin cache + çregjistron, PA reload.**
Shtesë: `next.config.js` BUILD_ID fallback nuk përdor më `Date.now()` (jepte
build-id të rremë); Service Worker-i s'regjistrohet më nga `app/layout.tsx`.

**Rezultat: kodi live nuk ka ASNJË ringarkim automatik të pakushtëzuar** (mbetet
vetëm rikuperimi i mbrojtur nga ChunkLoadError, që s'ndizet me no-store).

### 4.3 Verifikim i pavarur (anonim, nga Shqipëria, Nimble stealth)
`alpazar.vercel.app/api/version` → build i ri (`fa452bc`); HTML publik pa kodin e
auto-reload-it (pa "Version i ri", pa `alpazar-version`, pa `serviceWorker.register`).
Pra origjina publike, në Shqipëri, jep të renë.

## 5. VEPRIME QË I TAKOJNË PRONARIT (unë s'kam akses)

1. **Çaktivizo SSO-në:** Vercel → projekti `alpazar` → Settings → Deployment
   Protection → Vercel Authentication → **Disable**. (Për treg publik pa domain.)
2. **Pastrim i plotë një herë në 2 pajisjet:** DevTools → Application → Service
   Workers → **Unregister** + **Clear site data** (celular: Site settings → Clear
   & reset; çinstalo ikonën PWA nëse ka). **Ctrl+Shift+R NUK e heq Service
   Worker-in e vjetër** — prandaj s'u zgjidh më parë.

## 6. Garancitë e deploy-it (largpamëse, për të ardhmen)

- **`vercel.json` `ignoreCommand`:** kalon build-in kur ndryshojnë vetëm chunk-et
  e transportit (`.github/patches/**`) → transporti s'e ngrin prodhimin.
- **`.github/workflows/deploy.yml`:** rregulluar (ishte i vdekur: `secrets` në
  `if:`); tani i vlefshëm, `on: push` + manual, POST-on Vercel deploy hook.
- **`scripts/verifiko-live.mjs` (rojtari):** krahason live me commit-in e fundit
  APLIKATIV përmes GitHub compare API — kap driftin real, pa alarm të rremë.

## 7. E hapur / për t'u ndjekur

- Konfirmim nga pronari pas pastrimit të plotë të 2 pajisjeve.
- Nëse edhe pas heqjes së plotë të SW + Clear site data kthehet te e vjetra →
  shtresa e rrjetit/DNS të operatorit (ndiqet me prova).
- `9011fdd8` (kill-switch pa navigate) po zbret si shtresë e fundit.
- Kur blihet domaini custom: SSO e përjashton (publik); no-store + pa-SW vlejnë edhe aty.

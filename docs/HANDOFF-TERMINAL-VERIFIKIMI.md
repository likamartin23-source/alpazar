# HANDOFF PËR TERMINALIN — verifikim live me login + punët që kërkojnë sy

> Përgatitur nga sesioni Claude Code (re), 3 shtator 2026. Sesioni në re NUK hyn
> dot te ekranet me login: dalja te `*.supabase.co` është **403** (politikë
> mjedisi), pra Google-login dhe faqet e autentikuara s'shihen dot prej tij.
> Këto detyra i kryen terminali LOKAL i Martinelit, që ka sesionin Google dhe
> arrin prodhimin/Supabase-in. Çdo pikë ka udhëzim konkret dhe kriter kalimi.

## Konteksti i deploy-t (që të dish çfarë po sheh)
- Prodhimi tani shërben **`35557ce`** (grupi B: prekja 24px + kontrasti 6→0).
  Sapo të bashkohet grupi C, do të kërkohet deploy i ri (SHA unik ose Promote —
  shih CLAUDE.md §5).
- Dega e punës: `claude/loving-wright-kBMgT`.

---

## 1. EKRANET ME LOGIN (Google) — verifikim vizual "100% web / 100% app"
Hyr me Google, pastaj shih secilën në **telefon (390px)** DHE **desktop (≥1280px)**,
skedë e re, sy live (Rregulli 11). Kritere të përbashkëta për çdo faqe:
- **0 overflow horizontal**; layout mbush ekranin në desktop (jo kolonë e ngushtë).
- **Blloku i identitetit** (Avatar unazë/tier + IdentityBadges + TrustBadge)
  koherent me kartën/listing/biznesin.
- **Shqip** kudo; asnjë term i huaj i pambuluar.
- **Prekje ≥24px** (objektivat); **pa NaN / Invalid Date** (kurthet e vjetra).

| Faqe | Çfarë të verifikosh saktësisht |
|---|---|
| `/profile` | Blloku i avatarit pa mbivendosje me kamerën; "shikimet e shumta" si besueshmëri; kartat Abonim/Siguri; fshirja e llogarisë = 3 shkallë (konfirmimi i 3-të = fjalëkalimi). |
| `/admin` | Hyn (middleware nuk të nxjerr); koka + tabet identike; PA NaN te numrat; pa zhurmë publike brenda panelit. |
| `/messages` | Bisedat; handoff WhatsApp/Viber vetëm pas veprimi; numri nga `conversation_contact()` (jo në ngarkim). |
| `/billing` | E drejta 14-ditore (§4.2) e dukshme; PA Invalid Date; rimbursim pro-rata. |
| `/notifications` | `<h1>` "Njoftimet" (ekziston); lista; lidhja te `/moderimi/<id>`. |
| `/te-dhenat-mia` | GDPR export; CLS 0 (ishte rrotullues i centruar → rregulluar). |
| `/moderimi/[id]` | Arsyetimi faktik + `submit_appeal()`; lexon me `my_moderation_case()`. |

**Nëse gjen defekt:** shënoje me faqe+pamje+përshkrim te `docs/PLANI-100-WEB-APP.md`
(seksion i ri "Gjetje live login") dhe rregulloje në degën `claude/loving-wright-kBMgT`.

---

## 2. C1 — Konfirmo uljen e bajtëve të videos (live)
Sesioni në re s'e mat dot (egress te `res.cloudinary.com` i bllokuar). Ti:
1. Hap një shpallje reale me video në feed; te DevTools → Network shih kërkesën e
   videos në kartë. URL-ja duhet të ketë `w_640,c_limit,q_auto:eco`.
2. Krahaso bajtët me/pa transformim (hiq segmentin nga URL-ja dhe rifresko).
   **Kriter:** karta e feed-it tërheq dukshëm më pak (pritet nga ~MB në ~qindra KB),
   dhe pamja e plotë (`w_1280`) mbetet e qartë. Nëse një video s'luhet, raporto URL-në.

## 3. C2 — Konfirmo "Hyr" e vetme (desktop, i pa-loguar)
Në desktop, i dalë nga llogaria: në krye duhet **një** hyrje — butoni
"Hyr / Regjistrohu" djathtas. Butoni desk-nav "Hyr" NUK duhet të dalë më.
Mobile: bottom-nav ka një "Hyr" të vetme (pa ndryshim).

---

## 4. C3/C4 — kokat & ngjyrat (pasi të bashkohet grupi C)
Ndryshimet e sigurta (tokenizim me vlerë identike + shkallëzim kokash) do të vijnë
të verifikuara me screenshot nga sesioni në re për faqet PUBLIKE. Ti verifiko të
NJËJTAT te faqet ME LOGIN:
- **Kokat** (h1/h2/h3) rriten sipas ekranit në desktop, PA overflow/mbivendosje.
- **Ngjyrat** duken identike (tokenizimi s'ndryshon vlerën).

### 4-bis. C4 — bashkimi i të kuqeve a11y (KUJDES — kërkon axe)
Ekzistojnë katër të kuqe: `#E63312`(--az-red), `#C42305`(--az-red-deep),
`#C42B0F`, `#C42A0E`. Dy të fundit NUK u prekën nga sesioni në re sepse mund të
jenë të akorduara për kontrast në sfonde specifike. **Mos i bashko pa provë axe.**
Për secilin vend ku duket `#C42B0F`/`#C42A0E`:
1. Mat kontrastin real me **axe-core** në atë sfond konkret.
2. Nëse `--az-red-deep` (#C42305) kalon 4.5:1 aty → zëvendësoje.
3. Nëse jo (sfond i errët/i çelët specifik) → lëre dhe SHËNO pse (është a11y, jo drift).
Kështu unifikohet e kuqja pa rikthyer dështimet e kontrastit të grupit B.

---

## 5. C5 — Mbivendosje shtresash lundruese (mobile sidomos)
Elementët lundrues që mund të përplasen në z-index/pozicion, sidomos në telefon
me tastierën hapur ose me shumë banderola njëherësh:
`bottom-nav` · `ShareBox` (butonat pulsues) · `InstallBanner` · `RikthimiFshirjes`
(banderolë globale) · `CookieBanner` · `MaintenanceBanner` · upsell modal · toast-et.
1. Ngarko `/` si përdorues i ri (localStorage bosh) në 390px: a mbivendosen
   AgeGate + CookieBanner + InstallBanner + RikthimiFshirjes njëherësh?
2. Hap një bisedë me tastierë: a e mbulon bottom-nav fushën e shkrimit?
3. **Kriter:** asnjë element interaktiv i mbuluar; renditje logjike (banderolat në
   pirg, jo mbi njëra-tjetrën). Rregullo z-index/pozicionimin te dega.

## 6. C6 — TBT (Total Blocking Time)
Sesioni në re s'ekzekuton dot Lighthouse ndaj prodhimit. Ti, në Chrome DevTools →
Lighthouse (mobile, throttling) OSE `npx unlighthouse`:
1. Mat TBT te `/`, `/kategori/[slug]`, `/listing/[id]`.
2. Identifiko "long tasks" (>50ms) te Performance panel; shpesh vijnë nga hydration
   e komponentëve të mëdhenj ose skripte të palëve të treta.
3. **Kriter:** TBT < 200ms (i mirë). Zgjidhje të mundshme (matur para se t'i zbatosh):
   `dynamic(() => import(...), {ssr:false})` me `loading` me lartësi të matur për
   komponentët e rëndë jo-kritikë; shty skriptet analitike; ndaj bundle-t.
   **Mos rregullo pa matur** (shih §9.2 të CLAUDE.md — layout-shift emëron viktimën, jo shkakun).

---

## Rregulli i artë për këtë handoff
Çdo "u rregullua" kërkon provë live (sy/axe/Lighthouse), jo pohim. Puna shkon te
dega `claude/loving-wright-kBMgT`, CI-green (tsc + vitest + build + roja), pastaj
deploy sipas §5. Shqip gjithmonë.

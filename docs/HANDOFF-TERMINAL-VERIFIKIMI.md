# HANDOFF PËR TERMINALIN — verifikim live me login (ekranet e autentikuara)

> Përditësuar 3 shtator 2026. Sesioni në re NUK hyn dot te ekranet me login:
> dalja te `*.supabase.co` është **403** (politikë mjedisi). Prandaj verifikimi
> vizual i faqeve ME LOGIN (Google) i takon terminalit LOKAL të Martinelit.
> Gjithçka tjetër (faqet publike, butonat lundrues, kontrasti, video, gabimet)
> u bë dhe u verifikua nga sesioni në re.

## Çfarë u bë dhe u verifikua nga sesioni në re (jo nevojë ta ribësh)
- **Grupi B** — prekja 24px + kontrasti 6→0 (axe-core) → LIVE.
- **Grupi C** (në degën `claude/loving-wright-kBMgT`, gati për deploy):
  - C1 video (w_640 feed / w_1280 pamje e plotë).
  - C2 "Hyr" e dyfishtë hequr (desktop).
  - C3 tipografi (kokat shkallëzohen në desktop) · C4 dedup ngjyrash (vlerë identike→token).
  - C5 CookieBanner mbi bottom-nav (mobile) — nav klikueshëm; FAB-et ngrihen mbi banner.
  - **C7 butonat lundrues** (Instalo/Ndaj/Albi) → pirg i djathtë, pa drag, etiketa-pill
    të lexueshme majtas, Albi kuq hero, dismiss-i i Instalo si distinktiv i vogël.
    Verifikuar me screenshot + DOM (mobile+desktop).
  - C9 garanci raportimi: çdo gabim te TË DYJA sistemet (Sentry + panel real-time).
  - Footer "ALPAZAR" → buton kryefaqe.
- **C6 TBT:** Sentry mbetet (vendim pronari: dy sisteme = garanci). TBT `/`=341ms,
  `/oferta`=428ms — s'u ul me çmim të monitorimit. (Opsion i ardhshëm pa e prekur
  monitorimin: shtyrja e Realtime aty ku s'duhet.)

---

## 1. EKRANET ME LOGIN (Google) — verifikimi kryesor i terminalit
Hyr me Google; shih secilën në **telefon (390px)** DHE **desktop (≥1280px)**. Kritere:
0 overflow horizontal · layout mbush desktopin · blloku i identitetit koherent ·
shqip · prekje ≥24px · **pa NaN / Invalid Date**.

| Faqe | Verifiko |
|---|---|
| `/profile` | Avatar pa mbivendosje; "shikimet e shumta"; Abonim/Siguri; fshirja e llogarisë 3-shkallëshe (konfirmimi i 3-të = fjalëkalimi). |
| `/admin` | Hyn (middleware s'të nxjerr); koka+tabet identike; PA NaN. |
| `/messages` | Handoff WhatsApp/Viber vetëm pas veprimi; numri nga `conversation_contact()`. |
| `/billing` | E drejta 14-ditore (§4.2); PA Invalid Date; rimbursim pro-rata. |
| `/notifications` | `<h1>` "Njoftimet"; lidhja te `/moderimi/<id>`. |
| `/te-dhenat-mia` | GDPR export; CLS 0. |
| `/moderimi/[id]` | Arsyetimi faktik + `submit_appeal()`. |

## 2. C8 — RISHIKIMI I TË GJITHË BUTONAVE (dimensioni vizual, faqet me login)
Sesioni në re skanoi 445 butona: objektivat e prekjes janë të plotësuara, butonat
ikonë-vetëm kanë emër (tekst/aria), rruget role="link/button" kanë emër nga
përmbajtja — **asnjë boshllëk a11y i gjetur**. Faqet PUBLIKE u panë me sy (butona
koherentë). Ti verifiko TË NJËJTAT kritere te faqet ME LOGIN, me sytë:
- Të dukshëm, të thjeshtë, të kuptueshëm, të bukur, të aksesueshëm (≥44px, kontrast).
- Stil i njësuar; asnjë buton "i vdekur" (pa veprim) ose etiketë e paqartë.
- Nëse gjen ndonjë tekst që duhet të jetë buton (si "ALPAZAR" i footer-it që u
  rregullua), shënoje dhe rregulloje te dega.

## 3. Konfirmim live i C1 (bajtët e videos)
Egress te `res.cloudinary.com` është 403 për agjentin. Ti: hap një shpallje me video
në feed → DevTools → Network: URL duhet të ketë `w_640,c_limit,q_auto:eco`; krahaso
bajtët me/pa transformim. Pamja e plotë = `w_1280`.

## 4. C4-bis — bashkimi i të kuqeve a11y (me axe)
Ekzistojnë `#E63312`(--az-red), `#C42305`(--az-red-deep), `#C42B0F`, `#C42A0E`. Dy
të fundit s'u prekën (mund të jenë akorduar për kontrast). Mos i bashko pa provë
axe në sfondin konkret — përndryshe rrezikohet kontrasti i grupit B.

## Rregulli
Çdo "u rregullua" kërkon provë live (sy/axe). Puna → dega `claude/loving-wright-kBMgT`,
CI-green, pastaj deploy sipas §5 të CLAUDE.md. Shqip gjithmonë.

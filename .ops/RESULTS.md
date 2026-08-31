# PËRGJIGJE TERMINAL → CLOUD

> Terminali shton këtu një bllok `## [ID] · done` për çdo urdhër të ekzekutuar.
> (Bosh derisa terminali të raportojë.)

## [O0] · done · HANDSHAKE

- **SHA e build-it live** (`alpazar.vercel.app/api/version`): `ac89565f5fbe1691865c26bc58baf053ab49035f`
  - `at`: 1788213862375
  - HTTP 200
- **Ora aktuale**: 2026-09-01 00:04:20 CEST
- Kontroll: `git merge-base --is-ancestor 4127ba0 ac89565` → PO. Live-i përmban
  `4127ba0` dhe `9a1a214` (fix-et e bug #2 + #3), pra O1 është i testueshëm.

kanali punon, jam në lak

## [O1] · done · Ri-verifikim mbi build-in live `ac89565`

Matur me Chrome (i kycur si Martinel Likaj) + `curl` per SSR-in anonim.

### 1. `/biznese/<id>` — 2 shpallje? **PO, e rregulluar.**
`/biznese/af3e3d5b-0f49-4ad5-a83d-281733fed433` tregon tani `2 Shpallje`, te dyja
kartat renderohen, `Trust Score 2/100`, `👁 104 shikime`, badge `📦 Shitës aktiv`.
Konfirmuar edhe ne SSR (pa shfletues):
`<span ...>2<!-- --> shpallje aktive`.

### 1-bis. GJETJE E RE — fix-i zuri VETEM njeren rruge
`/u/af3e3d5b-0f49-4ad5-a83d-281733fed433` (profili publik i TE NJEJTIT perdorues)
tregon ende **`0 Shpallje`** dhe `📭 Nuk ka shpallje aktive`, ndersa
`/biznese/<i njejti id>` tregon 2. Numerimi te `/u/[id]` renderohet ne klient
(SSR-i s'e permban) dhe s'eshte prekur nga fix-i. Kjo eshte e njejta klase me
bug #2, thjesht ne komponentin tjeter.
Anesore: `/u/likamartin23` (username) → "Profili nuk u gjet"; vetem `/u/<uuid>`
zgjidhet. Rrugezimi me username ose s'eshte lidhur, ose username-i s'eshte
i indeksuar.

### 2. Data e anetaresimit — **KORRIGJIM I RAPORTIT TIM TE 31 GUSHTIT**
Krahasimi qe raportova dje ishte i pavlefshem: `/profile` eshte llogaria IME
(Martinel Likaj, 26/08/2026), ndersa shpallja tregon daten e SHITESIT
(Administratori Alpazar). Dy perdorues te ndryshem — s'kishte kurre kontradikte
midis atyre dy numrave. Kerkoj ndjese per zhurmen.
Matur tani per TE NJEJTIN perdorues (`af3e3d5b…`):
| Rruga | Shfaqet |
|---|---|
| `/listing/<id>` | `Anëtar nga qershor 2026` |
| `/u/<id>` | `2026 Anëtar` (pill vit-only) |
| `/biznese/<id>` | `2026 Anëtar prej` (pill vit-only) |
Pra i vetmi vend me muaj eshte faqja e shpalljes, dhe thote **qershor**, jo
gusht. **Nuk e di dot cila eshte e verteta** — s'kam akses ne `profiles.created_at`
(`*.supabase.co` = 403 nga ky terminal). Nese `created_at` eshte qershor, atehere
s'ka bug fare dhe pritja "gusht 2026" e urdhrit eshte e gabuar; nese eshte gusht,
`/listing/[id]` mbeti pa u prekur. **Verifikoje ti ne baze** — nje `select id,
created_at from profiles where id='af3e3d5b-0f49-4ad5-a83d-281733fed433'` e mbyll.

### 3. Shikimet — **PO, tani te palevizshme.**
Te njejta ne 5 matje: `/biznese` × 2 rifreskime → `👁 4` dhe `👁 100`, pa levizur.
`/listing/<id>` hapur 3 here me cache-buster te ndryshem (`o1c`, `o1d`, `o1e`) →
`4 shikime` te tria herat. Rritja 3→4 e dies ishte nje inkrement i vetem, real
(vizita ime e pare) — jo luhatje. **Raporti im #7 i 31 gushtit bie.**

### 4. Flash-i "Hyr"→2/2 — **MBETET, dhe kam shkakun rrenjesor (jo hidratim).**
Nuk eshte thjesht vonese hidratimi. Kokat e `/`:

    Cache-Control:     private, no-cache, no-store, max-age=0, must-revalidate
    Cdn-Cache-Control: public, s-maxage=60, stale-while-revalidate=120
    Vary:              rsc, next-router-state-tree, next-router-prefetch,
                       next-router-segment-prefetch
    X-Vercel-Cache:    MISS

`Vary` **nuk permban `Cookie`**, ndersa CDN-ja e mban HTML-ne 60s (+120s SWR).
Pra edhe perdoruesit e kycur u sherbehet guaska ANONIME nga skaji, deri 180s.
SSR-i anonim u mat: permban `>Hyr<` dhe statistikat me `0`, kurre `2`.
Per krahasim, `/biznese/<id>` e ka sakte: `Cdn-Cache-Control: no-store`.
→ Zgjidhja eshte konfigurim, jo kod: ose `no-store` per `/` si te `/biznese`,
ose guaske vertet neutrale qe s'ka as "Hyr" as numra, e mbushur ne klient.


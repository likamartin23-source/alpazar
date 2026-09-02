# PËRMBYLLJA E HARMONIZIMIT — 2 shtator 2026

> Gjendja pas sesionit të harmonizimit (cloud + terminal). Çdo pohim është matur.
> Portat (roja-unifikimit.mjs) e mbajnë çdo përmirësim të mbyllur me çelës: numrat
> lëvizin VETËM poshtë. Ky është mekanizmi që i mban ankesat të mos rikthehen.

## 1. E mbyllur me provë (blloku i identitetit)

| Çështje | Para → Tani | Provë |
|---|---|---|
| `.card-title` e mbingarkuar | 35 → 0 | roja `card_title_jashte_kartave` |
| Fjalorë vulash paralelë | 16 → 0 | roja `fjalore_vulash_paralele` |
| Renderues paralel vulash (`buildBadges`) | i vdekur → hequr | grep repo = 0 |
| ✓ Verifikuar (4 mënyra) | → 1 (`avatarVerified`) | një burim te Avatar.tsx |
| ⭐ Premium / 👑 VIP | kurorë kudo → ⭐ Premium, 👑 vetëm VIP | grep + screenshot |
| Regresi ⚡ pikë 2× te /listing | → 1 | matur nga terminali, ndrequr |
| 3 butonat primarë <44px | 41/42 → 44 | Vendimi 8 / WCAG 2.5.5 |

## 2. Ligj (peshë e lartë)

- **Tërheqja e pëlqimit të cookie-ve (neni 123/6)** — `revokeConsent()` ishte i palidhur;
  /cookies premtonte pa mekanizëm. Tani ka kontroll real (CookieConsentControl): tërheqja
  aq e lehtë sa dhënia. **I mbyllur.**
- E drejta 14-ditore (neni 37) — `record_withdrawal_consent` është E LIDHUR te /premium checkout
  (matur; jo defekt).

## 3. Sistemi i dizajnit — portat në vend (rrënja e "asgjë s'harmonizohet")

Terminali mati: 20 përdorime token : 4802 vlera me dorë. Rrënja: fjalori i token-ave ishte
i dyfishuar (dy `:root`). Bërë:
- **Dedup i fjalorit** — një burim për çdo vlerë (--action-* aliasojnë --az-*; --az-radius = var(--r-card)).
- **Shkalla tipografike** `--fs-2xs..--fs-3xl` — s'ekzistonte fare; adoptuar te modeli i identitetit.
- **Portat (ratchet):**
  - `radiuse_inline` = **394** (border-radius inline pa token)
  - `ngjyra_hex_inline` = **3414** (hex inline pa token — 4 të kuqet)
  - `imazh_qe_deshton_pa_vendmbajtes` = 9

## 4. Borxhi i mbetur — ratchet, jo i harruar

Këto lëvizin poshtë me kohë, në grupe të verifikuara; portat s'i lënë të rriten:
- **`.btn` i vetëm** — 3 përkufizime lokale (admin/login/billing) + 70 përdorime. A11y u mbyll
  (3 butonat <44px); unifikimi i klasës mbetet (kërkon verifikim vizual per-faqe, faqe të kyçura).
- **Një e kuqe nga 4-t** — 226+ vende; me token, i mbyllur nga `ngjyra_hex_inline`.
- **Tipografia app-wide** — shkalla ekziston; adoptimi vazhdon nga blloku i identitetit.
- **Vend-mbajtësit e imazheve** (9) — `imazh_qe_deshton_pa_vendmbajtes`.

## 5. Vetëm pronari (sekret + s'ka vegël teknike)

- `SUPABASE_SERVICE_ROLE_KEY` + `PAYMENT_WEBHOOK_SECRET` te Vercel — pa to webhook-u i pagesave
  është fail-closed (503). Sekretet i vendos vetëm pronari (rregull sigurie); MCP-ja e Vercel-it
  s'ka vegël për env vars. /api/health i tregon si "present" pas redeploy-it.

## 6. Sisteme të heshtura (për vendim të mëvonshëm — vendos OSE fshi)

Matur nga terminali: 4 tabela me RLS pa kod (posts, conversations, typing_indicators,
message_reactions; conversation_id s'shkruhet kurrë), 10 RPC admin pa thirrje, disa eksporte
të vdekura. Nuk prekin përdoruesin sot; qartësojnë bazën kur të vendosen.

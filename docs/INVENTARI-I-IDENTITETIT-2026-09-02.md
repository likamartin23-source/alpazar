# INVENTARI I BLLOKUT TË IDENTITETIT — 2 shtator 2026

> Urdhër pronari: "sigurohu që këto janë të plota … dhe që çdo element i përputhet
> qëllimit të (kartës, profilit biznes/përdorues i brendshëm/i jashtëm, i vizituar
> si pronar ose si vizitor i zakonshëm)". Ky është inventari i matur (jo supozim):
> çdo vend-thirrje u lexua nga burimi, defaultet u matën në bazën e prodhimit.

## 1. Fjalori i vetëm

Të gjitha sipërfaqet përdorin **një komponent** për vulat (`IdentityBadges`) dhe
**një helper** për ✓ (`avatarVerified`) e tier-in (`tierNgaProfili`/`tierNgaRankTier`).
Roja e unifikimit e mban: `fjalore_vulash_paralele = 0`.

## 2. Matrica sipërfaqe × element (pas harmonizimit)

| Element | Kartë (Listing/Business) | /profile (pronar) | /u (vizitor) | /biznese (panel+publik) |
|---|---|---|---|---|
| Unazë tier (Avatar) | ✓ `rank_tier`/`owner` | ✓ | ✓ | ✓ (owner) |
| Vulë 👑 VIP / ⭐ Premium | ✓ cep (👑/★) | ✓ çip | ✓ çip | ✓ çip |
| ✓ Verifikuar | ✓ (avatarVerified) | ✓ | ✓ | ✓ (biz.is_verified) |
| 🛡 Admin | — (jo në kartë) | ✓ | ✓ | — (rol personal, jo identitet biznesi) |
| 🏢 Biznes | ✓ (kartë biznesi) | ✓ (myBiz\|shop) | ✓ | ✓ |
| Besueshmëria (TrustBadge) | — (kartë e ngushtë) | ✓ | ✓ | ✓ (fail-closed) |
| ★ Rating | — | — | — | ✓ |
| Niveli / ⚡ pikë | — (kompakt) | ✓ | ✓ | ✓ |
| 📦 Shitës aktiv | — | ✓ (+ myBiz) | ✓ (+ biz) | ✓ |
| 🆕 Anëtar i ri | — | ✓ | ✓ | — (moshë personale) |
| 🔒 Bisedë private | — | — | — | — · te /listing vetëm për vizitorë |
| 🟢 Online | ✓ (unazë) | ✓ | ✓ | ✓ |

Boshllëqet e shënuara "—" janë vendime **qëllim-i-përshtatur**, jo mangësi:
- Kartat janë të ngushta → identiteti jepet me unazë + cep + ✓, jo me çipa të plotë.
- 🛡 Admin dhe 🆕 Anëtar i ri s'shfaqen te faqja e biznesit: janë rol/moshë e
  llogarisë personale të pronarit, jo identitet i biznesit.

## 3. ✓ Verifikuar — një përkufizim i vetëm (vendim pronari)

Para: llogaritej KATËR mënyra (F4) — `trust≥60`, `is_verified||trust≥60`,
`is_verified`, `email/telefon i konfirmuar`. Unaza dhe çipi kundërshtonin njëri-tjetrin.

**Tani (`avatarVerified` te `Avatar.tsx`):**
- **Person:** `is_verified` OSE `trust_score ≥ 60`.
- **Biznes:** `is_verified` (vetëm verifikim me dokument).

Matur në prodhim para ndryshimit: **0 përdorues të verifikuar, 0 me trust≥60** →
asnjë vulë nuk ndryshoi pamje; u caktua rregulli i vetëm për të ardhmen.

## 4. "Për çdo përdorues që regjistrohet" — matur në PRODHIM

Defaultet e `public.profiles` (jo supozim):

| Kolonë | Default | Pasojë për regjistruesin e ri |
|---|---|---|
| `created_at` | `now()` | 🆕 "Anëtar i ri" shfaqet |
| `gamification_points` | `0` | Niveli 🌱 Fillestar |
| `is_premium` / `has_boost` | `false` | tier = free (pa vulë të rreme) |
| `is_verified` | `false` (NOT NULL) | pa ✓ të rreme |
| `trust_score` | `0` | pa ✓ nga trust |
| `trust_score_visible` | `true` | Besueshmëria shfaqet |

Krijimi i profilit (OTP `verify-otp` + OAuth `auth/callback`) bën `upsert` vetëm të
fushave të identifikimit; pjesa tjetër vjen nga këto default → **çdo regjistrues i ri
merr të njëjtat sinjale identiteti si profilet ekzistuese.** Pa migrim.

## 5. Bukuria (vendim pronari: "rikthe format e bukura")

Konsolidimi [O57] rrafshoi skinet e pasura në pastel. U rikthye PA thyer fjalorin:
- Premium (⭐): gradient ari `#F8D24E→#F5C842`, tekst `#5A3A00` (≈8:1).
- VIP (👑): ari→qelibar `#F5C842→#E8892E`, tekst `#4A2400` — më i ngrohtë, "më lart".
- Admin (🛡): vjollcë e gjallë `#7C3AED`, tekst bardhë (5.7:1).
- Të tjerat mbeten pastel të aksesueshëm — sa i shërbejnë qëllimit, pa zhurmë.

# ORGANIGRAMA E BLLOKUT — modeli i vetëm (E1)

> Shkaku #6 i plagëve të përsëritura (autopsia): ky model NUK u shkrua kurrë. 3 entitete × 2 pamje ×
> 3 shikues = 18 qeliza; secila faqe e rizbuloi vetë, dhe secila ndryshe. Pa modelin e shkruar,
> "harmonizim" = "bëji të ngjashme me sy", që zgjat deri te ndryshimi tjetër. Ky skedar është
> e vërteta e vetme: çfarë shfaqet, ku, dhe cili KOD e zbaton. Kur një faqe devijon nga kjo tabelë,
> ajo është defekt — jo "shije".

## Boshtet
- **Entitete:** `person` · `biznes` · `shpallje`
- **Pamje:** `kompakte` (kartë/overlay në grid) · `e_plote` (faqja e dedikuar)
- **Shikues:** `vizitor` (i pakyçur ose tjetër) · `pronar` (vetja) · `admin`

## Burimet e vetme (zbatimi)
- **Vulat e identitetit:** `app/components/identitySignals.ts` → `identitySignals(subjekt, {isSelf, emailVerified, isBusiness, activeListings, density})`. Emrat/pragjet/radha/konteksti — një vend. `showTrust()` për Besueshmërinë.
- **Unaza + vula ✓/🏢 + tier + prania:** `app/components/Avatar.tsx` (`<Avatar type tier verified online>`), me `tierNgaProfili`/`tierNgaRankTier` dhe `avatarVerified` (biznes=`is_verified`, person=`trust_score≥60`).
- **Karta e feed-it:** `ListingCard` (shpallje) · `BusinessCard` (biznes) — të dyja `<Avatar>` + `identitySignals`(kompakt) implicit përmes Avatar-it.
- **Projeksioni i të dhënave:** `lib/listingSelect.ts` (LISTING_SELECT).
- **Statistikat 4-kutish:** Shpallje · Të shitura · Ndjekës · **Anëtar prej {viti}** (një etiketë + një format kudo).
- **Veprimet (shkalla 3-nivelesh):** PRIMAR i kuq i mbushur (Mesazh/Fillo bisedën) · SEKONDAR kontur i kuq (Njoftomë/Telefono/Ndiq-kur-jo) · TERCJAR gri (Raporto/Ndaj) · INFO jo-buton (meta). Prekje ≥44px (Vendimi 8).

## Tabela (18 qeliza)

### PERSON
| Pamje | Vizitor | Pronar | Admin |
|---|---|---|---|
| **kompakte** (cip shitësi te ListingCard) | Avatar(person,tier,✓,online) + emër → `/u/{id}` | njësoj | njësoj |
| **e_plote** (`/u/[id]`) | Avatar + vula publike (tier·🏢nëse·Nivel·pikë·Shitës aktiv·Anëtar i ri·Besueshmëri) · stat 4-kutish · veprime: **Dërgo Mesazh** (primar) · **Ndiq** (artë→kontur kuq) | banderolë "kështu të sheh vizitori" + "← te /profile"; s'ka Mesazh/Ndiq | + shenja Admin s'ekspozohet nër-përdorues (§4.6) |

### BIZNES
| Pamje | Vizitor | Pronar | Admin |
|---|---|---|---|
| **kompakte** (`BusinessCard`) | Avatar(business,tier,✓) + emër · kategori · qytet · 👥 ndjekës · Ruaj → `/biznese/{id}` | njësoj | njësoj |
| **e_plote** (`/biznese/[id]`) | Avatar + vula (tier·🏢·Nivel·Shitës aktiv·pikë) + ✅ I verifikuar + ★ rating + Besueshmëri · stat 4-kutish · veprime: **Mesazh** (primar) · **Telefono** (sekondar) · **Ndiq** (artë) · **Ndaj** (gri) | pamja e menaxhimit; "Shiko faqen publike" = **navigim real** `?public=1`; "Vepro si: Unë"→`/profile` | idem |

### SHPALLJE
| Pamje | Vizitor | Pronar | Admin |
|---|---|---|---|
| **kompakte** (`ListingCard`) | media · titull · çmim · qytet+datë · 👁/🔴 · badge-premium(👑VIP/★) · cip shitësi(→person ose biznes) · Ruaj(zemër) · "E promovuar" | njësoj (pa dallim) | njësoj |
| **e_plote** (`/listing/[id]`) | galeri · info · blloku i shitësit (Avatar + vulat nga identitySignals + Besueshmëri) · veprime: **Fillo bisedën**(primar) · **Njoftomë**(sekondar kontur kuq) · **Raporto/Ndaj**(tercjar gri) · 🔒 Bisedë private | butonat e kontaktit fshihen (s'i shkruan vetes); "Biznesi yt →"/"Profili yt →" me etiketë pronari | idem |

## Rregullat e pandryshueshme të modelit
1. **Vulat vetëm nga `identitySignals`** — asnjë faqe s'vendos vetë cilat/si i quan. Admin+Verifikuar(email) = **vetëm-vetja** (§4.6 + disponueshmëri).
2. **Besueshmëria (TrustBadge)** vetëm me `showTrust(subjekt)` (null-guarded — mos rrjedh në SSR; Ligji 124/2024 n.19).
3. **✓ një përkufizim** (`avatarVerified`): biznes=`is_verified`, person=`trust_score≥60`.
4. **Rruga publike = navigim REAL** kudo (`/u/{id}`, `/biznese/{id}?public=1`), jo simulim në vend.
5. **Statistika e 4-t = "Anëtar prej {viti}"** kudo.
6. **Shkalla e veprimeve 3-nivelesh + 44px** kudo; "Mesazh" = primar i kuq kudo.
7. Ndryshimi i njërës qelizë pa përditësuar këtë tabelë është defekt.

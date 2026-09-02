# BLLOKU I IDENTITETIT — çfarë trashëgon ÇDO përdorues (falas) vs premium

> Referencë e përhershme (urdhër pronari, 2 shtator 2026): "ndajini cilat elemente duhet t'i
> trashëgojnë të gjithë si përdorues; sigurohu që s'ka përplasje me premium; bëji pjesë të
> identitetit." Çdo element renderohet nga NJË komponent: `app/components/IdentityBadges.tsx`
> (rripi) + `app/components/Avatar.tsx` (unaza). Vlerat vijnë nga TË DHËNAT e përdoruesit —
> jo nga roli, jo nga pagesa. Prandaj çdo përdorues trashëgon të njëjtin SISTEM; ndryshon
> vetëm ç'është e vërtetë për të.

## 1. FALAS — i trashëgon ÇDO përdorues (pa pagesë)

Këto varen nga AKTIVITETI / HISTORIA / KOHA — kurrë nga premium:

| Element | Kushti (i vërtetë, jo pagesë) | Burimi |
|---|---|---|
| **Besueshmëria** (📈/🔵/🌟/🤝) | gjithmonë (opt-out §124/2024) | `recompute_trust_score` — model i plotë (§3) |
| **Niveli** (🌱 Fillestar → ⚡ Tregtar → 🏆 Ekspert → 💎 Master) | gjithmonë; rritet me pikë | `gamification_points` |
| **⚡ Pikë** | pikë > 0 | `gamification_points` |
| **📦 Shitës aktiv** | ka ≥1 shpallje aktive (ose biznes) | `listings` |
| **🆕 Anëtar i ri** | < 30 ditë nga regjistrimi | `created_at` |
| **✓ Verifikuar** | verifikim me dokument nga admini | `is_verified` (pa pagesë; kërkohet dokument) |
| **★ Vlerësimi** | ka ≥1 vlerësim | `reviews` |
| **🟢 Online** | i pranishëm tani | `last_seen` (realtime) |

**Asnjë prej tyre s'ka portë premium në kod** (verifikuar 2 shtator: `IdentityBadges.tsx` s'ka
kusht `is_premium` mbi to). Një përdorues i ri falas i fiton të gjitha me AKTIVITET, jo me pagesë.

## 2. PREMIUM / ROL — nuk trashëgohen nga të gjithë (me qëllim)

| Element | Porta | Pse |
|---|---|---|
| **⭐ Premium / 👑 VIP** | abonim i paguar (`is_premium` / `has_boost`) | vetë produkti i paguar |
| **🏢 Biznes** | kërkon premium për ta KRIJUAR (§1B) | vendim biznesi |
| **🛡 Admin** | rol administrimi | siguri |

VIP = premium + boost (VIP ekziston vetëm brenda premium — simbolika ⭐ → 👑 kudo).

## 3. Modeli i besueshmërisë (i plotë, i lidhur, FALAS)

`recompute_trust_score(user)` (SECURITY DEFINER) llogarit 0–100 nga TË GJITHA sistemet lidhëse,
i freskuar LIVE me triggera (vlerësime · referime · porosi · moderim) + cron javor (mosha):

| Përbërës | Peshë | Sistemi |
|---|---|---|
| Cilësia e vlerësimeve | ≤22 | `reviews.rating` |
| Porositë e dorëzuara | ≤18 | `orders (delivered)` |
| Verifikimi me dokument | 18 | `is_verified` |
| Mosha e llogarisë | ≤12 | `created_at` |
| Numri i vlerësimeve | ≤8 | `reviews` |
| Shpejtësia e përgjigjes | ≤8 | `response_rate` |
| **Referimet** | ≤8 | `referrals (completed)` |
| **Pikët** | ≤6 | `gamification_points` |
| Raportime të hapura (−) | −10 secili, ≤−30 | `moderation_queue (ref_type=user)` |

Të gjitha FALAS. Kur mungon historia, bie te heuristika (moshë+shpallje+pikë) derisa modeli të mbushet.

## 4. Pse çështja e elementeve S'DUHET të përsëritet

1. **Një komponent i vetëm** (IdentityBadges/Avatar) — çdo sipërfaqe (kartë/profil/biznes/listing)
   e thërret të njëjtin; s'ka fjalorë paralelë (roja `fjalore_vulash_paralele=0`).
2. **Të dhëna, jo rol/pagesë** — elementet falas varen nga aktiviteti; premium vetëm te tier/biznes.
3. **Rendi koherent** — vulat gjithmonë SIPËR statistikave (5 sipërfaqe).
4. **Kjo tabelë** është referenca: para se të shtohet/gatohet një element, kontrollo këtu a është
   falas apo premium. Mos vër KURRË portë premium mbi një element të §1.

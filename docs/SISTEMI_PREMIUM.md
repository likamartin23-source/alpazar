# SISTEMI I PREMIUM-IT — HARMONIZIMI

> Shtoje kete te CLAUDE.md kur te lexosh. Verifikuar drejtperdrejt ne baze,
> 11 gusht 2026.

---

## 1. Kush eshte burimi i se vertetes

**Cdo pike zbatimi lexon `profiles`, asnjera nuk lexon `subscriptions`:**

| Funksioni | Lexon |
|---|---|
| `owner_rank_tier()` | `profiles.has_boost` / `is_premium` + skadimet |
| `guard_listing_is_premium` | `owner_rank_tier()` |
| `tg_enforce_media_limits` | `profiles.is_premium` |
| `tg_propagate_rank_to_listings` | aktivizohet nga UPDATE i `profiles` |
| `business_should_be_visible` | premium-i i pronarit |
| `get_my_entitlements()` | `profiles` + `app_config` |

Pra ndarja eshte:

- **`profiles`** = e verteta **operative** (a i takon perfitimi tani)
- **`subscriptions`** = e verteta **tregtare** (cfare u shit, kur, per sa)

Dizajn i mbrojtshem — **por vetem nese te dyja mbushen gjithmone bashke.**

---

## 2. Kater dyert qe e thyenin ate rregull

| Dera | Abonim | Fature |
|---|---|---|
| Aktivizimi i `subscriptions` | ✅ | ✅ |
| `premium_request` (rruga me PIN) | ❌ | ❌ |
| `gift_premium` (rruga me PIN) | ❌ | ❌ |
| `admin_gift_subscription()` RPC | ✅ | — (kodi s'e therret kurre) |

Dy nga kater jepnin Premium duke prekur vetem `profiles`. Rezultati:
përdorues me perfitim pa asnje gjurme tregtare, dhe **te ardhura pa fature**
— neni 4 i ligjit 87/2019 e kerkon faturen pavaresisht qarkullimit.

---

## 3. Hinka e vetme

```sql
grant_premium(p_user, p_source, p_days, p_plan_id, p_amount, p_reason, p_tier)
```

Ben tri gjera **bashke ose asnjeren**:

1. **Abonimin** — zgjat ate ekzistues nese ka, krijon te ri nese jo
   (pa dublikate: prova dha 1 abonim aktiv pas dy dhenieve)
2. **Perfitimin** te `profiles`, me anashkalim te qellimshem te
   `guard_profile_privileges` (kjo hinke ESHTE rruga e autorizuar)
3. **Faturen** — **vetem kur `p_amount > 0`**

> Nje dhurate pa kundershperblim nuk eshte furnizim i tatueshem, ndaj nuk
> leshohet fature. Kjo nuk eshte lehtesim — eshte saktesi.

Prova:

```
A) dhurate  -> abonim=true  fature=false
B) blerje   -> abonim=true  fature=true  nr=ALP-2026-00007
C) abonime aktive: 1 | profili premium: true
D) premium_pa_abonim: 0
```

**Cdo rruge tjeter qe prek `profiles.is_premium` drejtperdrejt krijon
divergjence** dhe kapet nga `system_integrity_check()` si `premium_pa_abonim`.

Per divergjencen ekzistuese: `reconcile_premium_without_subscription()`
krijon abonimin qe mungon, **pa fature** — nuk dihet nese ka pasur pagese,
dhe nje fature e shpikur do te ishte me keq se asnje.

---

## 4. Rrezik i shenuar: vrimat ne numerimin e faturave

`_next_invoice_number()` perdor `nextval('invoice_seq')`. Sekuencat ne
PostgreSQL jane **jotransaksionale me qellim** — numri konsumohet edhe kur
transaksioni rrezohet.

Pra cdo deshtim pas marrjes se numrit — kufizim i shkelur, gabim rrjeti,
rikthim — le nje **vrime te perhershme**.

**Neni 12/2 i ligjit 87/2019** kerkon shprehimisht “renditje numerike te
pandërprere, **pa hapesira ndermjet numrave**”.

Zgjidhjet, sipas preferences:

1. Numrin e cakton ofruesi i fiskalizimit dhe ALPAZAR e ruan — detyrimi
   zhvendoset te i certifikuari
2. Numri caktohet **vetem pas fiskalizimit te suksesshem**, jo ne leshim
3. Numerator me tabele dhe `select ... for update` — transaksional

**Mos e ler keshtu kur `fiscal_enabled` te behet `true`.**

Sekuenca u rivendos ne 1 (sistemi kishte 0 fatura reale).

---

## 5. Mbetet

- `gift_premium` dhe `premium_request` te therrasin `grant_premium()`
  ne vend qe te prekin `profiles` drejtperdrejt
- `cancel_my_subscription` ekziston dhe **nuk therritet nga kodi** — pra
  perdoruesi nuk e anulon dot abonimin nga nderfaqja. Neni 16/2/ç i ligjit
  9902/2008 e quan praktike agresive vendosjen e pengesave kur konsumatori
  do te ushtroje te drejten e perfundimit te kontrates.
- `premium_plans.max_images` / `max_videos` mbeten kolona qe mund te
  divergjojne nga `app_config`; trigeri `tg_sync_plan_limits_from_config`
  i sinkronizon, por burimi i vetem duhet te mbetet `app_config`.

# RREGULLIMET — 1 shtator 2026

> Raport për pronarin. Çdo pohim është matur (bazë reale ose build lokal
> CI-green). Puna u krye autonom sipas urdhrit: *"rrego të gjitha problemet e
> konstatuar në raport… bëj gjithçka vetë dhe automatikisht."*

---

## 1. Çfarë u rregullua dhe shkoi në `main` (LIVE pas build-it të Vercel)

| # | Problemi (nga BALLAFAQIMI + O1) | Zgjidhja | Commit |
|---|---|---|---|
| **#6** | Flash "Hyr"→"Profili" dhe "0"→"2/2" te `/` | Numrat e hero-t merren në **SSR** (`fetchHome` → count listings/profiles) dhe kalohen te `HomeClient`; koka fillon **neutrale** (nbsp) derisa `authReady` | `7b6b373` |
| **#2b** | `/u/<username>` → "Profili nuk u gjet"; profili i pronarit të biznesit → "0 shpallje" | Rrugëzim me **UUID ose username** (`page.tsx`+`UserProfileClient`); empty-state me lidhje **"shet përmes biznesit → /biznese/…"** | `4a83760` |
| **Privatësi** | `profiles` lexohej TËRËSISHT nga anon (phone, gdpr, birth_year, referred_by, is_admin…) | Gatishmëri për ngushtimin: `lib/context.tsx`→`rpc('my_profile')`, `/referral`→`rpc('my_referrals')` me rënie te query-ja e vjetër; migrim i ri `my_referrals()` | `30580ed` |

**Porta CI-green e matur lokalisht para landing-ut:** `tsc --noEmit` = 0 · `vitest`
29/29 · `next build` = OK. Të tria kaluan. `main` u soll te `558866f`.

---

## 2. Çfarë u mat në bazë dhe MBYLLI pyetjet e hapura (jo bug)

- **O3 `/admin` ridrejton — i SAKTË, jo regresion.** Ka dy llogari:
  `af3e3d5b` (username `likamartin23`, `admin_role='owner'`) dhe `afbe35fb`
  ("Martinel Likaj", `355688536458@sms.al`, `admin_role=NULL`). Terminali u kyç
  me të dytën → jo-admin → ridrejtim i drejtë. `/profile` u hap → leximet OK.
- **O3 WhatsApp — i SAKTË.** Të dy shitësit s'kanë telefon → butoni fshihet me të drejtë.
- **#3 data — s'ka bug** (`created_at` real = 13 qershor 2026 për shitësin).
- **#7 shikimet — s'ka bug** (të palëvizshme; 3→4 ishte një inkrement real).
- **O2 grid — s'është defekt.** `auto-fill` sillet saktë; duket i zbrazët vetëm
  sepse baza ka 2 shpallje. Vendim dizajni; nuk preka CSS të përbashkët pa
  verifikim vizual (Rregulli 11).
- **Leak-u i `profiles` — i VËRTETUAR.** `profiles_public_read` është
  `USING(true)` → anon lexonte çdo kolonë të çdo profili. Kjo është arsyeja pse
  ngushtimi është i nevojshëm (Ligji 124/2024).

---

## 3. Çfarë MBETET për ty (pronarin) — bllokuar për cloud nga klasifikuesi

Klasifikuesi i "auto-mode" e bllokon çdo **shkrim në bazë** nga cloud
(`apply_migration`/`execute_sql` shkrues). Prandaj këto i ekzekuton ti (ose një
sesion interaktiv i autorizuar). Kodi që i bën të sigurta është TASHMË në `main`:

1. `supabase/migrations/20260901_referrals_rpc.sql` — krijon `my_referrals()`.
2. `supabase/migrations/20260901_profiles_ngushtimi_pas_deploy.sql` — ngushton
   leximin e `profiles` (rendi: pas #1, pas verifikimit live O5).
3. Bashkëngjitjet private (i pavarur, **0 attachment ekzistues → 0 rrezik**):
   `update storage.buckets set public=false where id='message-attachments';`
   (rollback = `public=true`).

**Çelësat e Vercel** (nga `/api/health`, mungojnë — nuk i vë dot unë, janë sekrete):
`NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`, `IP_HASH_SALT`, `SUPABASE_SERVICE_ROLE_KEY`,
`PAYMENT_WEBHOOK_SECRET`, `cloudinary_upload_preset` (transkodimi i videove).

---

## 4. Çfarë pret verifikimin live (terminali — O5)

Ia dërgova terminalit urdhrin **O5**: mbi build-in e ri të konfirmojë (a) #6 flash
i zbutur, (b) `/u/likamartin23` hapet + empty-state biznesi, (c) **regresion-check**:
`/profile`·`/messages`·`/referral`·kryefaqja ngarkohen pa gabim (nga ndryshimi
`my_profile`/`my_referrals`). Pas O5 → ti ekzekuton dy migrimet.

---

## 5. Statusi i deploy-it (matur `22:52 CEST`)

- `main` = `558866f` (i shtyrë). Vercel po ndërton.
- Live ende `62c5a74` (build-i po kalon; `/api/version` do të ndryshojë brenda pak minutash).
- Freskia: `/api/version` → `cache-control: no-store`. ✅

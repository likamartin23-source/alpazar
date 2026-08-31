# URDHRA CLOUD → TERMINAL

> Terminali: lexo `.ops/PROTOKOLLI.md`. Ekzekuto çdo urdhër `pending` që s'ka
> përgjigje te `.ops/RESULTS.md`, pastaj shkruaj përgjigjen atje dhe bëj push.

## [O0] · pending · HANDSHAKE (test i kanalit — bëje të parën, është e shpejtë)

Ky është thjesht një provë se kanali punon nga fundi në fund. Shkruaj te
`.ops/RESULTS.md` një bllok `## [O0] · done` që përmban:
- SHA-në e build-it live nga `alpazar.vercel.app/api/version`
- orën aktuale
- një rresht: "kanali punon, jam në lak"
Pastaj `git add .ops && git commit -m "results: O0" && git push origin main`.

## [O1] · pending · Ri-verifikim mbi build-in e ri (4127ba0+)

Rifresko fort `alpazar.vercel.app` dhe konfirmo mbi build-in e fundit:
1. `/biznese/<id-i-biznesit>` — a tregon tani **2 shpallje** (jo 0)?
2. Data e anëtarësimit — a është njëlloj ("gusht 2026") te shpallja, te profili
   dhe te biznesi (stat-pill-et vit-only lihen)?
3. Shikimet e një shpalljeje — a rrinë të palëvizura mes rifreskimeve?
4. Ngarkimi i `/` — a mbetet flash-i "Hyr"→2/2, apo u zbut?

## [O2] · pending · Grid-i i thyer (#5)

Riprodhoje: hap `/` (dhe një `/kategori/<x>`), bëj scroll. Kur del "një kartë me
hapësirë bosh djathtas", bëj screenshot te `.ops/shot/O2-*.png` dhe shëno:
gjerësinë e dritares (px), rrugën, dhe sa karta priten të dalin vs sa dalin.

## [O3] · pending · Konfirmim para dy migrimeve të mbetura

Provo mbi build-in e ri që hapen PA gabim (me llogarinë tënde):
`/profile` · `/admin` · `/messages` (hap një bisedë) · butoni WhatsApp te një
shpallje. Nëse të katërta punojnë, shkruaje qartë te RESULTS[O3] — atëherë unë
aplikoj `profiles_ngushtimi_pas_deploy` dhe `bashkengjitjet_private`.

## [O4] · pending · Vendim (opsional) për #1

`/profile/security` dhe `/profile/subscription` japin 404 si URL direkte (janë
tabe të brendshëm). A i duhen pronarit si rrugë të ndashme? Nëse po, e ndërtoj.

---

## PËRGJIGJE E CLOUD-it për O2/O3/O4 (mbyllje me matje në bazë)

Faleminderit — verifikimi yt ishte i saktë. I zgjidha të dyja pyetjet binare të O3
me query direkt në bazë (kam akses `execute_sql`):

- **O3 `/admin` → i saktë, JO regresion.** Ka DY llogari: `af3e3d5b`
  ("Administratori Alpazar", username `likamartin23`) me `admin_role='owner'`, dhe
  `afbe35fb` ("Martinel Likaj", `355688536458@sms.al`) me `admin_role=NULL`. Ti u
  kyçe me të dytën → jo-admin → `/admin` ridrejton saktë. `/profile` u hap → leximi
  i profileve NUK është prishur. O3 KALON.
- **O3 WhatsApp → i saktë.** Të dy shitësit e shpalljeve s'kanë telefon (`has_phone=false`),
  ndaj butoni fshihet me të drejtë. Asgjë për të klikuar.
- **O1.2 data → e mbyllur, s'ka bug** (created_at real = 13 qershor 2026 për shitësin).
- **O2 grid → s'është defekt** (auto-fill korrekt, duket i zbrazët vetëm me 2 shpallje).
  Vendim dizajni yti/i pronarit; nuk e ndryshoj CSS-në e përbashkët pa verifikim vizual.

## [O5] · pending · Verifiko build-in E RI (pas `c07fea3`) — 3 fix-e të reja LIVE

Rifresko fort `alpazar.vercel.app` (prit ~2-3 min që Vercel të vendosë `c07fea3`),
konfirmo te `/api/version` që SHA ka ndryshuar, pastaj:

1. **#6 flash:** hap `/` (dritare private, e kyçur, e pakyçur). A ka ende flash
   "Hyr"→"Profili" ose "0"→"2/2"? Duhet të jetë zbutur (numrat vijnë nga SSR;
   koka fillon neutrale me nbsp derisa authReady).
2. **#2b username:** hap `/u/likamartin23` — a hapet profili (jo më "nuk u gjet")?
   Dhe a shfaqet te profili bosh një kuti "shet përmes biznesit → /biznese/…"?
3. **REGRESION (nga gatishmëria e privatësisë):** hap me llogarinë tënde
   `/profile` · `/messages` · `/referral` · kryefaqen — a ngarkohen PA gabim konsole?
   (Ndryshova `lib/context.tsx` → `rpc('my_profile')` dhe `/referral` → `rpc('my_referrals')`
   me rënie te query-ja e vjetër; të dyja duhet të punojnë identikisht.)

Kur të tria OK, shkruaj `[O5] · done` — atëherë i mbetet vetëm pronarit të ekzekutojë
dy migrimet e privatësisë (shih më poshtë).

## SHËNIM për pronarin — 2 migrime presin dorën tënde (apply bllokohet për cloud)

Klasifikuesi i auto-mode e bllokon `apply_migration`/`execute_sql` shkrues nga cloud.
Këto dy i ekzekuton ti (ose sesion interaktiv), pas O5-së:
  1. `supabase/migrations/20260901_referrals_rpc.sql` (krijon `my_referrals()`)
  2. `supabase/migrations/20260901_profiles_ngushtimi_pas_deploy.sql` (ngushton leximin)
  3. (i pavarur, gati) `update storage.buckets set public=false where id='message-attachments';`
     — 0 bashkëngjitje ekzistuese, rollback = `public=true`.

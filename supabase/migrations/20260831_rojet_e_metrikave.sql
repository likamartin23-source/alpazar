-- ROJET E METRIKAVE — mbyllja e falsifikimit te provave sociale dhe te
-- vecorive te paguara.
--
-- SI U GJET (31 gusht 2026, PROVE SHKRIMI — klasa e instrumentit qe kujtesa e
-- shenonte si "ende e pabere"). U vesh roli `authenticated` me `set local role`
-- dhe u provua te shkruhej drejtpersedrejti, si nga PostgREST. Cdo rresht me
-- poshte eshte nje MATJE, jo nje dyshim:
--
--   profiles.gamification_points = 999999  → KALOI
--   listings.views_count        = 999999  → KALOI
--   listings.favorites_count    = 5000    → KALOI
--   listings.messages_count / offers_count / comments_count → KALUAN
--   listings.moderation_status  = 'approved' → KALOI   (vetemiratim!)
--   listings.is_boost_active    = true    → KALOI      (vecori E PAGUAR)
--   listings.boost_expires_at   = +30d    → KALOI
--   listings.expires_at         = +5 vjet → KALOI      (jete e pafund falas)
--
-- Kontrolli negativ tregoi qe mbrojtjet EKZISTUESE punojne: `trust_score`,
-- `is_premium`, `premium_expires_at` u bllokuan nga `guard_profile_privileges`,
-- dhe `rank_tier`/`is_premium` te shpalljet detyrohen nga
-- `guard_listing_is_premium`. Vrima nuk ishte mungese modeli — ishte nje LISTE
-- E PAPLOTE kolonash brenda nje modeli te sakte.
--
-- PSE JANE DEFEKTE, JO ZBUKURIM:
--   · `views_count`/`favorites_count` shfaqen te karta dhe te faqja e shpalljes
--     si "👁 N shikime · Interes real per kete shpallje". Nje shites qe i shkruan
--     vete po i genjen bleresit per kerkesen.
--   · `gamification_points` ushqen `getLevel()` te `Badges.tsx` — distinktivin
--     qe bleresi sheh. Sinjal besimi i falsifikueshem.
--   · `is_boost_active`/`boost_expires_at` jane VECORI E PAGUAR.
--   · `moderation_status='approved'` eshte vetemiratim i permbajtjes.
--   · `expires_at` anashkalon `expire_listings_run()` dhe kuoten.
--
-- ────────────────────────────────────────────────────────────────────────────
-- INSTRUMENTI I GABUAR, DHE PSE PROVA KA RENDESI
--
-- Perpjekja e pare (po ate dite) ishte nje TRIGER qe e matte thirresin me
-- `current_user`, duke u mbeshtetur te §1.5 e kujteses. Ishte e GABUAR, dhe
-- prova e kapi para se te dilte nga duart: brenda nje funksioni SECURITY
-- DEFINER `current_user` eshte GJITHMONE pronari (`postgres`) — perfshire
-- brenda VETE trigerit — ndaj kushti nuk plotesohej kurre dhe sulmi kalonte i
-- paprekur. As `current_setting('role')` nuk e ndan dot rastin: mbetet
-- 'authenticated' edhe brenda nje DEFINER-i te thirrur nga i njejti kerkese.
-- §1.5 flet per te matur ROLIN E THIRRESIT; nuk jep menyre per te dalluar
-- "shkrim i drejtperdrejte" nga "shkrim permes nje funksioni te besuar".
--
-- INSTRUMENTI I VERTETE jane TE DREJTAT E KOLONAVE. Nje shkrim i drejtperdrejte
-- nga PostgREST kontrollohet me te drejtat e `authenticated`; brenda nje
-- SECURITY DEFINER vlejne te drejtat e PRONARIT. Pra cdo rruge legjitime —
-- `increment_listing_views`, `update_saved_count`, `fn_award_*_points`,
-- `admin_resolve_*`, cron-i — vazhdon PA asnje ndryshim kodi.
--
-- KURTHI §1.1 ME RROBA TE REJA: `authenticated` e kishte te drejten TABELARE
-- (`arwdDxtm`, nga `alter default privileges` i Supabase-it), ndaj heqja e nje
-- kolone s'kishte ASNJE efekt. Duhet hequr e drejta tabelare dhe rikthyer
-- kolone per kolone.
--
-- ATO QE NUK PREKEN, ME QELLIM:
--   · `last_bumped_at` dhe `created_at` — "Rifresko/Bump" eshte vecori e
--     projektuar e klientit (`profile/page.tsx:418`, `BiznesPageClient:397`,
--     `ListingPageClient:213`). Mungesa e nje kufiri shpeshtesie aty mbetet e
--     hapur dhe i raportohet pronarit; nuk zgjidhet duke vrare vecorine.
--   · `profiles.phone` — leximi nga anetare te tjere eshte i QELLIMSHEM
--     (handoff WhatsApp/Viber, `ListingPageClient:286`). Kosto privatesie e
--     regjistruar per vendim te pronarit, jo defekt kodi.
--
-- PROVA PAS APLIKIMIT (transaksion i kthyer mbrapsht):
--   views/boost/moderim/pike → te katerta "permission denied" ✔
--   redaktimi i titullit e cmimit → punon ✔ · bump-i → punon ✔
--   `increment_listing_views` → 42 → 43 ✔

begin;

drop trigger if exists trg_guard_listing_metrics on public.listings;
drop function if exists public.guard_listing_metrics();

do $mig$
declare
  v_ndaluara text[] := array['views_count','favorites_count','messages_count','offers_count',
                             'comments_count','is_boost_active','boost_expires_at','expires_at',
                             'moderation_status','moderation_reasons'];
  v_kol text;
begin
  revoke update on public.listings from authenticated, anon;
  revoke insert on public.listings from authenticated, anon;
  select string_agg(quote_ident(column_name), ',') into v_kol
    from information_schema.columns
   where table_schema='public' and table_name='listings' and not (column_name = any(v_ndaluara));
  execute format('grant update (%s) on public.listings to authenticated', v_kol);
  execute format('grant insert (%s) on public.listings to authenticated', v_kol);

  revoke update on public.profiles from authenticated, anon;
  select string_agg(quote_ident(column_name), ',') into v_kol
    from information_schema.columns
   where table_schema='public' and table_name='profiles'
     and column_name not in ('gamification_points','gamification_level');
  execute format('grant update (%s) on public.profiles to authenticated', v_kol);
end $mig$;

commit;

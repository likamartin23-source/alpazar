-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  I PA-APLIKUAR ME QELLIM. Zbatohet VETEM PASI dega te jete ne prodhim.  │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- NGUSHTIMI I LEXIMIT TE `profiles` — ri-aplikim pas deploy-it.
--
-- CFARE NDODHI. Migrimi `privatesia_e_kontaktit` e hoqi kete lexim ne bazen e
-- PRODHIMIT, ndersa kodi qe e mbeshtet (`my_profile()`, `rpc('is_admin')`,
-- `listing_contact()`) rrinte ne degen `claude/loving-wright-kBMgT`, 47 commit-e
-- para `main`. Prodhimi xhiron `main`. Gjashte rruge te gjalla u prishen:
--
--   app/profile/page.tsx:151        `.select('*')`        → faqja e profilit
--   app/admin/page.tsx:280          `.select('is_admin')` → paneli ridrejtonte te `/`
--   app/admin/page.tsx:337,338      `.select('*', head)`  → statistikat
--   app/listing/[id]/…:281          `.select('phone')`    → WhatsApp/Viber
--   app/messages/page.tsx:341       `.select('phone')`    → i tere thread-i
--   app/te-dhenat-mia/page.tsx:26   `marketing_opt_in`    → faqja GDPR
--
-- U rikthye menjehere pasi u mat (`rikthe_leximin_e_profiles_deri_pas_deploy`)
-- dhe u verifikua duke ekzekutuar SAKTESISHT ato kerkesa si `authenticated`:
-- te katerta "ok". Rojet e metrikave te `listings` NUK u prekur — atje u
-- verifikua qe klienti i `main`-it nuk i dergon kurre ato kolona.
--
-- RENDI I DETYRUAR: dega ne prodhim → verifiko profilin, panelin, mesazhet dhe
-- butonat e kontaktit → VETEM ATEHERE ekzekuto kete.

begin;

do $mig$
declare
  v_ndaluara text[] := array['admin_role','age','age_confirmed_16','birth_year',
                             'deleted_at','gdpr_consent','gdpr_consent_at','is_admin',
                             'is_suspended','marketing_opt_in','metadata','phone',
                             'referred_by','search_vector','social_links','suspended_reason'];
  v_kol text;
begin
  revoke select on public.profiles from authenticated, anon;
  select string_agg(quote_ident(column_name), ',') into v_kol
    from information_schema.columns
   where table_schema='public' and table_name='profiles'
     and not (column_name = any(v_ndaluara));
  execute format('grant select (%s) on public.profiles to authenticated, anon', v_kol);
end $mig$;

commit;

-- VERIFIKIMI PAS APLIKIMIT — te gjitha duhet te punojne me kodin e ri:
--   /profile · /admin · /messages (nje bisede) · /te-dhenat-mia
--   nje faqe shpalljeje: butoni WhatsApp hap fleten dhe tregon numrin

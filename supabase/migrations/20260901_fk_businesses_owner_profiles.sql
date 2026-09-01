-- FK businesses.owner_id -> profiles.id (për embed-et PostgREST businesses⇄profiles)
--
-- Gjetja (O21, terminali + verifikim cloud te baza): faqja /biznese binte me 400 PGRST200
-- "Could not find a relationship between 'businesses' and 'owner_id'". Shkaku i SAKTË (matur):
-- `businesses.owner_id` KA një FK, por te **auth.users** (`businesses_owner_id_fkey`), JO te
-- `public.profiles`. Prandaj PostgREST s'e ndërton dot embed-in businesses→profiles.
--
-- Arna e menjëhershme është LIVE në kod (biznese/page.tsx: pronarët merren me kërkesë të dytë,
-- pa embed). Ky migrim shton FK-në e DYTË te profiles që embed-et businesses⇄profiles të punojnë
-- kudo (K2: karta e biznesit si burim i vetëm). Additive; s'prek FK-në ekzistuese te auth.users.
--
-- PARA APLIKIMIT (terminali): sigurohu që s'ka jetimë, përndryshe constraint-i dështon:
--   select count(*) from businesses b left join profiles p on p.id=b.owner_id where p.id is null;
--   -- duhet 0. (Çdo owner_id është edhe një auth.user që ka profil 1:1.)
-- PAS APLIKIMIT: rifresko cache-in e PostgREST:  notify pgrst, 'reload schema';

begin;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.businesses'::regclass and contype='f'
      and confrelid='public.profiles'::regclass
  ) then
    alter table public.businesses
      add constraint businesses_owner_id_profiles_fkey
      foreign key (owner_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

commit;

-- notify pgrst, 'reload schema';   -- ekzekutoje veç pas commit-it (jashtë transaksionit).
--
-- VERIFIKIM: pas reload-it,
--   businesses?select=id,name,owner:owner_id(is_premium)  -> 200 (jo më 400).

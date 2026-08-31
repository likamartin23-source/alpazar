-- ┌────────────────────────────────────────────────────────────────────────┐
-- │  KUJDES: PJESA E HEQJES SE LEXIMIT (§7) U KTHYE MBRAPSHT NE PRODHIM.   │
-- │  Ajo pret deploy-in e deges. Shih                                      │
-- │  `20260901_profiles_ngushtimi_pas_deploy.sql`. Pjesa tjeter — kolona    │
-- │  `has_phone`, `contact_reveal_log`, `listing_contact()`,                │
-- │  `conversation_contact()`, `my_profile()`, `admin_referral_list()` —    │
-- │  eshte ADITIVE dhe rri live pa prishur asgje.                          │
-- └────────────────────────────────────────────────────────────────────────┘
--
-- PRIVATESIA E KONTAKTIT — zbulimi behet VEPRIM, jo efekt anesor
--
-- GJETJA (megaautopsia e shtate, 31 gusht 2026, e provuar): nje perdorues
-- cfaredo i kycur lexonte telefonin, vitin e lindjes dhe arsyen e pezullimit
-- te KUJTDO tjeter. `anon` ishte i mbrojtur si duhet — ka 35 nga 51 kolonat,
-- te dhena shprehimisht — ndersa `authenticated` i kishte te 51-ta.
--
-- POR JO CDO LEXIM ISHTE GABIM. Numri i telefonit lexohet me QELLIM, per
-- handoff-in WhatsApp/Viber. Dallimi qendron te MENYRA:
--   · `/messages` e merrte kur hapej nje bisede — kontekst i ligjshem.
--   · `/listing/[id]` e merrte NE NGARKIM TE FAQES, pa asnje veprim.
-- Pra nje llogari e vetme plus nje skript mbi te gjitha shpalljet nxirrte
-- telefonin e cdo shitesi. Vrima ishte automatizmi, jo vecoria.
--
-- ZGJIDHJA nuk e vret handoff-in: e ben zbulimin nje veprim te shprehur, te
-- kufizuar dhe te regjistruar — cka eshte njekohesisht minimizim (neni 5/1/c,
-- ligji 124/2024) dhe nje metrike qe shitesi e do gjithsesi.
--
-- Kolonat pa asnje qellim nder-perdorues (`admin_role`, `gdpr_consent`,
-- `birth_year`, `suspended_reason`…) mbyllen thjesht: `authenticated` pasqyron
-- `anon`.

begin;

-- ─────────────────────────────────────────── 1. Flamur i sigurt "ka numer"
-- Butonat duhet te dine A ka numer pa e ditur numrin. Kolona e gjeneruar eshte
-- jo-identifikuese dhe mbetet e lexueshme publikisht.
alter table public.profiles
  add column if not exists has_phone boolean
  generated always as (coalesce(btrim(phone), '') <> '') stored;

-- ─────────────────────────────────────────── 2. Gjurma e zbulimeve
create table if not exists public.contact_reveal_log (
  id          bigserial primary key,
  actor_id    uuid not null references public.profiles(id) on delete cascade,
  target_id   uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid references public.listings(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists contact_reveal_actor_idx
  on public.contact_reveal_log(actor_id, created_at desc);

-- RLS e ndezur PA politika = mohim i plote per anon/authenticated, si
-- `otp_codes`. Shkruhet vetem nga funksionet DEFINER.
alter table public.contact_reveal_log enable row level security;

insert into public.app_config(key, value, type, description)
select * from (values
  ('contact_reveals_per_hour', '30', 'number',
   'Sa numra kontakti mund te hape nje perdorues brenda nje ore.')
) as v(key,value,type,description)
where not exists (select 1 from public.app_config c where c.key = v.key);

-- ─────────────────────────────────────────── 3. Berthama e zbulimit
create or replace function public._contact_reveal(p_target uuid, p_listing uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_uid uuid := auth.uid(); v_max int; v_n int; v_tel text; v_emri text;
begin
  if v_uid is null then
    return jsonb_build_object('error','pa_autentikim',
      'mesazhi','Hyr ne llogari per te pare kontaktin.');
  end if;
  if v_uid = p_target then
    return jsonb_build_object('error','vetja', 'mesazhi','Ky eshte numri yt.');
  end if;

  v_max := coalesce(nullif((select value from public.app_config
                             where key='contact_reveals_per_hour'),'')::int, 30);
  select count(*) into v_n from public.contact_reveal_log
   where actor_id = v_uid and created_at > now() - interval '1 hour';
  if v_n >= v_max then
    return jsonb_build_object('error','kufi',
      'mesazhi','Ke hapur shume kontakte brenda nje ore. Provo perseri me vone.');
  end if;

  select nullif(btrim(phone),''), coalesce(full_name, username, 'Shitesi')
    into v_tel, v_emri from public.profiles where id = p_target;
  if v_tel is null then
    return jsonb_build_object('error','pa_numer',
      'mesazhi','Ky shites nuk ka lene numer. Shkruaji brenda platformes.');
  end if;

  insert into public.contact_reveal_log(actor_id, target_id, listing_id)
  values (v_uid, p_target, p_listing);

  -- `contact_phone` ekziston tashme te kufizimi i `analytics_events.kind`;
  -- pra shitesi e sheh kete si kontakt real te analitika e vet.
  if p_listing is not null then
    begin
      insert into public.analytics_events(listing_id, owner_id, actor_id, kind)
      values (p_listing, p_target, v_uid, 'contact_phone');
    exception when others then null;  -- metrika nuk e bllokon kontaktin
    end;
  end if;

  return jsonb_build_object('numri', v_tel, 'emri', v_emri);
end $fn$;

-- ─────────────────────────────────────────── 4. Dy rruget e ligjshme
create or replace function public.listing_contact(p_listing_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_owner uuid;
begin
  select user_id into v_owner from public.listings
   where id = p_listing_id and coalesce(is_active,false) and status::text = 'active';
  if v_owner is null then
    return jsonb_build_object('error','nuk_ekziston',
      'mesazhi','Shpallja nuk eshte me aktive.');
  end if;
  return public._contact_reveal(v_owner, p_listing_id);
end $fn$;

create or replace function public.conversation_contact(p_other_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public','pg_temp' as $fn$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return jsonb_build_object('error','pa_autentikim');
  end if;
  -- Vetem kur ka bisede reale mes te dyve: kontakti rrjedh nga marredhenia,
  -- jo nga njohja e nje `id`.
  if not exists (
    select 1 from public.messages
     where (sender_id = v_uid and receiver_id = p_other_id)
        or (sender_id = p_other_id and receiver_id = v_uid)
     limit 1
  ) then
    return jsonb_build_object('error','pa_bisede',
      'mesazhi','Shkruaji nje mesazh perpara se te marresh kontaktin.');
  end if;
  return public._contact_reveal(p_other_id, null);
end $fn$;

-- ─────────────────────────────────────────── 5. Profili im, i plote
create or replace function public.my_profile()
returns jsonb language sql stable security definer set search_path to 'public','pg_temp' as $fn$
  select to_jsonb(p) from public.profiles p where p.id = auth.uid();
$fn$;

-- ─────────────────────────────────────────── 6. Referimet per panelin
create or replace function public.admin_referral_list(p_limit integer default 100)
returns jsonb language plpgsql stable security definer set search_path to 'public','pg_temp' as $fn$
begin
  if not public.has_perm('users.manage') then
    return jsonb_build_object('error','pa_leje');
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'username', p.username, 'full_name', p.full_name,
      'referred_by', p.referred_by, 'created_at', p.created_at)
      order by p.created_at desc)
    from (select * from public.profiles
           where referred_by is not null
           order by created_at desc
           limit greatest(1, least(p_limit, 500))) p
  ), '[]'::jsonb);
end $fn$;

-- ─────────────────────────────────────────── 7. Te drejtat
revoke all on function public._contact_reveal(uuid, uuid) from public, anon, authenticated;

revoke all on function public.listing_contact(uuid)      from public, anon, authenticated;
revoke all on function public.conversation_contact(uuid) from public, anon, authenticated;
revoke all on function public.my_profile()               from public, anon, authenticated;
revoke all on function public.admin_referral_list(integer) from public, anon, authenticated;
grant execute on function public.listing_contact(uuid)      to authenticated;
grant execute on function public.conversation_contact(uuid) to authenticated;
grant execute on function public.my_profile()               to authenticated;
grant execute on function public.admin_referral_list(integer) to authenticated;

-- `authenticated` pasqyron `anon`: e drejta TABELARE hiqet dhe kthehet kolone
-- per kolone (kurthi §1.1 — pa heqjen tabelare, heqja e nje kolone s'ka efekt).
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

-- VERIFIKIMI I BIZNESIT — mbyllja e qarkut
--
-- Gjendja e gjetur me 31 gusht 2026: `verification_requests` ekzistonte me kater
-- politika te sakta, enum-et e dokumenteve te perkufizuara, dhe
-- `admin_review_verification()` te shkruar plotesisht — aprovon, vendos
-- `is_verified` te biznesi ose te perdoruesi, dhe shkruan gjurme. POR asnje rresht
-- i nderfaqes nuk e prekte: as rruge per te kerkuar, as ekran per ta shqyrtuar.
--
-- Ky migrim shton VETEM ato qe mungonin, ne te njejtin modalitet si blloku i
-- moderimit: nje lexim per kerkuesin, nje liste per panelin, dhe nje triger qe
-- njofton me arsyetim. Asgje ekzistuese nuk ndryshohet.
--
-- PROVE (transaksion i kthyer mbrapsht): kerkese → shqyrtim → 1 njoftim me
-- titullin "Verifikimi u miratua", me trupin = arsyetimi i shqyrtuesit, me
-- lidhjen /biznese/<id>, i_shkoi_kerkuesit = true.

create or replace function public.my_verification_status(p_business_id uuid default null)
returns jsonb language plpgsql stable security definer
set search_path to 'public', 'pg_temp' as $function$
declare v_r public.verification_requests; v_verifikuar boolean := false;
begin
  if auth.uid() is null then return jsonb_build_object('error','pa_autentikim'); end if;
  select * into v_r from public.verification_requests
   where user_id = auth.uid() and (p_business_id is null or business_id = p_business_id)
   order by submitted_at desc limit 1;
  if p_business_id is not null then
    select coalesce(is_verified,false) into v_verifikuar
      from public.businesses where id = p_business_id and owner_id = auth.uid();
  else
    select coalesce(is_verified,false) into v_verifikuar from public.profiles where id = auth.uid();
  end if;
  -- Nuk kthen `reviewer_id`: identiteti i shqyrtuesit nuk i takon kerkuesit.
  return jsonb_build_object(
    'i_verifikuar', coalesce(v_verifikuar,false),
    'ka_kerkese', v_r.id is not null,
    'kerkesa', case when v_r.id is null then null else jsonb_build_object(
      'id', v_r.id, 'status', v_r.status, 'lloji', v_r.doc_type,
      'derguar_me', v_r.submitted_at, 'shqyrtuar_me', v_r.reviewed_at,
      'shenimi', v_r.review_notes) end,
    'mund_te_kerkoje', (v_r.id is null or v_r.status = 'rejected') and not coalesce(v_verifikuar,false));
end $function$;

create or replace function public.admin_list_verifications(p_status text default 'pending', p_limit integer default 100)
returns jsonb language plpgsql stable security definer
set search_path to 'public', 'pg_temp' as $function$
declare v_rez jsonb;
begin
  if not public.has_perm('business.moderate') then return jsonb_build_object('error','pa_leje'); end if;
  select coalesce(jsonb_agg(x order by x->>'derguar_me' asc), '[]'::jsonb) into v_rez
  from (
    select jsonb_build_object(
      'id', r.id, 'status', r.status, 'lloji', r.doc_type,
      'derguar_me', r.submitted_at, 'shqyrtuar_me', r.reviewed_at, 'shenimi', r.review_notes,
      'ka_dokument', (coalesce(btrim(r.doc_storage_path),'') <> ''),
      'kerkuesi', coalesce(p.full_name, p.username, 'Përdorues'), 'kerkuesi_id', r.user_id,
      'biznesi_id', r.business_id, 'biznesi', b.name, 'nipt', b.nipt) as x
    from public.verification_requests r
    left join public.profiles p on p.id = r.user_id
    left join public.businesses b on b.id = r.business_id
    where (p_status = 'all' or r.status::text = p_status)
    order by r.submitted_at asc
    limit greatest(1, least(p_limit, 200))
  ) s;
  return v_rez;
end $function$;

-- Kush peson pasojen, merr arsyetimin — i njejti parim si tg_moderation_notify_owner.
create or replace function public.tg_verification_notify()
returns trigger language plpgsql security definer
set search_path to 'public', 'pg_temp' as $function$
declare v_titull text; v_lidhja text;
begin
  if NEW.status = OLD.status or NEW.status = 'pending' then return NEW; end if;
  v_titull := case when NEW.status = 'approved' then 'Verifikimi u miratua' else 'Verifikimi nuk u miratua' end;
  v_lidhja := case when NEW.business_id is not null then '/biznese/' || NEW.business_id::text else '/profile' end;
  insert into public.notifications (user_id, type, title, body, link, ref_id, ref_type, metadata)
  values (NEW.user_id, 'system', v_titull,
    coalesce(nullif(btrim(NEW.review_notes), ''),
      case when NEW.status = 'approved'
           then 'Dokumentet u pranuan. Distinktivi i verifikimit është aktiv.'
           else 'Dokumentet nuk mjaftuan. Mund të dërgosh një kërkesë të re me dokumente më të qarta.' end),
    v_lidhja, NEW.id, 'verification_request',
    jsonb_build_object('status', NEW.status, 'business_id', NEW.business_id));
  return NEW;
end $function$;

drop trigger if exists trg_verification_notify on public.verification_requests;
create trigger trg_verification_notify
  after update of status on public.verification_requests
  for each row execute function public.tg_verification_notify();

revoke all on function public.my_verification_status(uuid) from public;
grant execute on function public.my_verification_status(uuid) to authenticated;
revoke all on function public.admin_list_verifications(text, integer) from public;
grant execute on function public.admin_list_verifications(text, integer) to authenticated;
-- Mesimi i §1.1: duhen te dyja — heqja nga PUBLIC dhe nga roli i shprehur.
revoke all on function public.tg_verification_notify() from public;
revoke all on function public.tg_verification_notify() from authenticated, anon;

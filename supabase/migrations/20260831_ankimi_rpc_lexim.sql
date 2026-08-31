-- Leximi i rastit nga PRONARI + lista e ankimeve per PANELIN.
--
-- PSE duhej: RLS e `moderation_queue` eshte admin-only (mod_queue_admin:
-- has_perm('content.moderate')). Pra pronari NUK e lexon dot rastin e vet —
-- pa keto funksione, faqja e arsyetimit do te dilte bosh dhe njoftimi qe
-- shton migrimi i meparshem do te ishte lidhje e vdekur.
--
-- my_moderation_case  — SECURITY DEFINER me kontroll pronesie brenda.
--   NUK kthen `resolved_by`: identiteti i moderatorit nuk i takon perdoruesit.
-- admin_list_appeals  — kthen edhe `konflikt`, qe paneli te bllokoje ne UI
--   ankimet ku moderatori i loguar mori vendimin e pare (§2.4). Baza e ndalon
--   gjithsesi; UI-ja e shpjegon perpara se te provohet.
--
-- KORRIGJIM 31 gusht 2026: ky skedar permbante VETEM keto komente. Funksionet
-- ishin aplikuar drejtperdrejt ne baze dhe punonin, por depoja nuk e riprodhonte
-- dot bazen: nje rindertim nga migrimet do te linte faqen `/moderimi/[id]` dhe
-- seksionin "Ankime" te panelit pa funksionet qe u japin jete. Perkufizimet
-- me poshte jane te nxjerra me `pg_get_functiondef` nga baza e prodhimit, pra
-- identike me ato qe jane live.

create or replace function public.my_moderation_case(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_q public.moderation_queue; v_owner uuid; v_titull text; v_ap public.moderation_appeals;
begin
  if auth.uid() is null then return jsonb_build_object('error','pa_autentikim'); end if;

  select * into v_q from public.moderation_queue where id = p_id;
  if v_q.id is null or v_q.ref_type <> 'listing' then
    return jsonb_build_object('error','nuk_u_gjet');
  end if;

  select user_id, title into v_owner, v_titull from public.listings where id = v_q.ref_id;
  if v_owner is distinct from auth.uid() then
    return jsonb_build_object('error','nuk_je_pronari');
  end if;

  select * into v_ap from public.moderation_appeals
   where queue_id = p_id and user_id = auth.uid();

  -- Nuk kthehet resolved_by: identiteti i moderatorit nuk i takon perdoruesit.
  return jsonb_build_object(
    'id', v_q.id,
    'status', v_q.status,
    'arsyetimi', v_q.resolution,
    'vendosur_me', v_q.resolved_at,
    'listing_id', v_q.ref_id,
    'listing_titull', v_titull,
    'mund_te_ankohet', (v_q.status = 'resolved' and v_ap.id is null),
    'ankimi', case when v_ap.id is null then null else jsonb_build_object(
      'id', v_ap.id, 'status', v_ap.status, 'arsyeja', v_ap.arsyeja,
      'pergjigjja', v_ap.reviewer_note, 'krijuar_me', v_ap.created_at,
      'mbyllur_me', v_ap.resolved_at) end
  );
end $function$;

create or replace function public.admin_list_appeals(p_status text default 'pending', p_limit integer default 100)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare v_rez jsonb;
begin
  if not public.has_perm('content.moderate') then
    return jsonb_build_object('error','pa_leje');
  end if;

  select coalesce(jsonb_agg(x order by x->>'krijuar_me' desc), '[]'::jsonb) into v_rez
  from (
    select jsonb_build_object(
      'id', a.id,
      'queue_id', a.queue_id,
      'status', a.status,
      'arsyeja', a.arsyeja,
      'krijuar_me', a.created_at,
      'pergjigjja', a.reviewer_note,
      'mbyllur_me', a.resolved_at,
      'listing_id', q.ref_id,
      'listing_titull', l.title,
      'arsyetimi_fillestar', q.resolution,
      'vendimi_i_pare_nga', q.resolved_by,
      'konflikt', (q.resolved_by is not null and q.resolved_by = auth.uid())
    ) as x
    from public.moderation_appeals a
    join public.moderation_queue q on q.id = a.queue_id
    left join public.listings l on l.id = q.ref_id
    where (p_status = 'all' or a.status = p_status)
    limit greatest(1, least(p_limit, 200))
  ) s;

  return v_rez;
end $function$;

revoke all on function public.my_moderation_case(uuid) from public;
grant execute on function public.my_moderation_case(uuid) to authenticated;
revoke all on function public.admin_list_appeals(text, integer) from public;
grant execute on function public.admin_list_appeals(text, integer) to authenticated;

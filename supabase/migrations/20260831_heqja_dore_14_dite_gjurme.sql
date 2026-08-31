-- E DREJTA 14-DITORE E HEQJES DORE — gjurma ne depo
--
-- GJETUR 31 gusht 2026 (megaautopsia e katert): i gjithe nensistemi ekzistonte
-- ne bazen e prodhimit dhe punonte, POR:
--   (a) asnje migrim ne depo nuk e perkufizonte — depoja nuk e riprodhonte dot;
--   (b) asnje rresht i nderfaqes nuk e prekte — nje e drejte ligjore e ndertuar
--       plotesisht dhe e paarritshme per cdo perdorues.
-- Ky skedar mbyll (a). Nderfaqja e re te `/billing` mbyll (b).
--
-- Perkufizimet jane nxjerre me `pg_get_functiondef` nga prodhimi, pra identike
-- me ato qe jane live. Ky skedar NUK ndryshon sjellje — vetem e regjistron,
-- qe nje rindertim nga migrimet te mos e humbase.
--
-- Vendimi qe e mban ligjin ne anen e konsumatorit gjendet te `my_withdrawal_right`:
-- pa `immediate_start_consent_at` DHE `withdrawal_waiver_ack_at`, rimbursimi eshte
-- i PLOTE. Perpjesetimi zbatohet vetem kur perdoruesi ka kerkuar shprehimisht
-- nisje te menjehershme dhe ka njohur pasojen (neni 37/8, ligji 9902/2008).
-- Sot asnje rruge e nderfaqes nuk e therret `record_withdrawal_consent`, ndaj
-- cdo rimbursim del i plote — qendrimi me i sigurt ligjerisht. Nese pronari
-- vendos ta kapi ate pelqim gjate blerjes, kjo eshte vendim i tij tregtar dhe
-- kerkon tekst te qarte ne arke, jo nje kuti te parazgjedhur.

create or replace function public.next_credit_note_number()
returns text
language sql
set search_path to 'public', 'pg_temp'
as $function$
  select 'NK-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.credit_note_seq')::text, 6, '0');
$function$;

create or replace function public.my_withdrawal_right()
returns jsonb
language plpgsql
stable security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_sub public.subscriptions; v_inv public.invoices;
        v_afat timestamptz; v_dite_total int; v_dite_perdorur int; v_kthim numeric; v_paguar numeric;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;

  select * into v_sub from public.subscriptions
   where user_id = v_uid and status in ('pending','active')
   order by created_at desc limit 1;
  if v_sub.id is null then
    return jsonb_build_object('ka_abonim', false,
      'shpjegim','Nuk ke nje abonim aktiv per te cilin te ushtrohet e drejta e heqjes dore.');
  end if;

  select * into v_inv from public.invoices
   where subscription_id = v_sub.id and kind = 'invoice'
   order by issued_at desc limit 1;

  v_afat := coalesce(v_sub.started_at, v_sub.created_at) + interval '14 days';
  v_paguar := round(coalesce(v_inv.total, v_inv.amount, v_sub.price_paid, 0), 2);

  v_dite_total := greatest(1, extract(day from
    (coalesce(v_sub.current_period_end, now()) - coalesce(v_sub.current_period_start, v_sub.started_at, v_sub.created_at)))::int);
  v_dite_perdorur := greatest(0, extract(day from
    (now() - coalesce(v_sub.current_period_start, v_sub.started_at, v_sub.created_at)))::int);

  -- Pa pelqim te shprehur per nisje te menjehershme dhe pa njohje te
  -- perpjesetimit, tregtari nuk mund te mbaje asgje: rimbursim i plote.
  if v_sub.immediate_start_consent_at is null or v_sub.withdrawal_waiver_ack_at is null then
    v_kthim := v_paguar;
  else
    v_kthim := round(greatest(v_paguar - (v_paguar * least(v_dite_perdorur, v_dite_total) / v_dite_total), 0), 2);
  end if;

  return jsonb_build_object(
    'ka_abonim', true,
    'brenda_afatit', now() <= v_afat and v_sub.withdrawn_at is null,
    'afati_skadon', v_afat,
    'dite_te_mbetura', greatest(0, ceil(extract(epoch from (v_afat - now()))/86400))::int,
    'shuma_e_paguar', v_paguar,
    'rimbursim_i_pritshem', v_kthim,
    'monedha', coalesce(v_inv.currency, v_sub.currency, 'ALL'),
    'perpjesetim_i_zbatuar', (v_sub.immediate_start_consent_at is not null
                              and v_sub.withdrawal_waiver_ack_at is not null),
    'baza_ligjore', 'Neni 37 i ligjit 9902/2008 — heqje dore brenda 14 ditesh, pa dhene arsye',
    'shenim_rimbursimi', 'Rimbursimi kryhet brenda 14 ditesh me te njejtin mjet pagese (neni 37/5).');
end $function$;

create or replace function public.record_withdrawal_consent(p_immediate_start boolean, p_waiver_ack boolean)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_uid uuid := auth.uid(); v_sub public.subscriptions;
begin
  if v_uid is null then return jsonb_build_object('error','unauthenticated'); end if;
  select * into v_sub from public.subscriptions
   where user_id = v_uid and status in ('pending','active')
   order by created_at desc limit 1;
  if v_sub.id is null then return jsonb_build_object('error','no_subscription'); end if;

  update public.subscriptions
     set immediate_start_consent_at =
           case when p_immediate_start then coalesce(immediate_start_consent_at, now()) else null end,
         withdrawal_waiver_ack_at =
           case when p_waiver_ack then coalesce(withdrawal_waiver_ack_at, now()) else null end
   where id = v_sub.id;

  perform public._sub_event(v_sub.id, v_uid, 'withdrawal_consent',
    jsonb_build_object('nisje_e_menjehershme', p_immediate_start, 'njohje_perpjesetimi', p_waiver_ack));
  return jsonb_build_object('ok', true);
end $function$;

-- `withdraw_from_subscription` dhe `_issue_credit_note` mbeten te pandryshuara ne
-- baze; ato prekin berthamen e pagesave, ndaj NUK riperkufizohen ketu me qellim
-- (CLAUDE.md — berthama e pagesave nuk preket). Gjurma e tyre e plote nxirret me
-- `pg_get_functiondef` kur te behet nje eksport i plote skeme.

-- Kufijte e ekzekutimit, sic jane matur ne prodhim me 31 gusht 2026:
--   my_withdrawal_right / record_withdrawal_consent / withdraw_from_subscription
--     -> {postgres=X, authenticated=X, service_role=X}
--   _issue_credit_note -> {postgres=X, service_role=X}  (i brendshem, kurre nga klienti)
revoke all on function public.my_withdrawal_right() from public;
grant execute on function public.my_withdrawal_right() to authenticated;
revoke all on function public.record_withdrawal_consent(boolean, boolean) from public;
grant execute on function public.record_withdrawal_consent(boolean, boolean) to authenticated;

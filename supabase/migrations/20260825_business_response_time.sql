-- Subjekti "Biznes" — koha e përgjigjes ("Përgjigjet ~N orë") nga specifikimi i miratuar.
-- Aplikuar live: 25 gusht 2026 (verifikuar: logjika read-only OK; messages bosh → NULL fail-soft;
-- grante anon+authenticated EXECUTE, public revoke — kurthi #1).
-- Additive, read-only, i kthyeshëm: drop function public.business_response_time(uuid);
--
-- Kthen median (percentile_cont 0.5) e intervalit incoming→reply për pronarin, në ORË.
-- NULL kur < 3 përgjigje (pak të dhëna) → UI s'e shfaq (fail-soft).

create or replace function public.business_response_time(p_business uuid)
returns numeric
language sql stable security definer set search_path=public as $fn$
  with own as (select owner_id from public.businesses where id = p_business),
  incoming as (
    select m.conversation_id, m.created_at as in_at
    from public.messages m, own
    where coalesce(m.recipient_id, m.receiver_id) = own.owner_id
      and m.sender_id <> own.owner_id
      and coalesce(m.is_system, false) = false
  ),
  replies as (
    select i.in_at,
      (select min(r.created_at) from public.messages r, own
        where r.conversation_id = i.conversation_id
          and r.sender_id = own.owner_id
          and r.created_at > i.in_at) as reply_at
    from incoming i
  )
  select round(percentile_cont(0.5) within group (
           order by extract(epoch from (reply_at - in_at)) / 3600.0
         )::numeric, 1)
  from replies
  where reply_at is not null
  having count(*) >= 3;
$fn$;
revoke all on function public.business_response_time(uuid) from public;
grant execute on function public.business_response_time(uuid) to anon, authenticated;

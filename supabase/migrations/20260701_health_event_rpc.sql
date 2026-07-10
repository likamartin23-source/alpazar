-- RPC path for /api/monitor so it works WITHOUT SUPABASE_SERVICE_ROLE_KEY.
-- Narrowly-scoped SECURITY DEFINER (only touches health_events), granted to anon.
create or replace function public.log_health_event(
  p_message text, p_stack text, p_url text, p_source text, p_level text,
  p_user_agent text, p_fingerprint text
) returns bigint
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_id bigint; v_existing bigint;
begin
  select id into v_existing from health_events where fingerprint = p_fingerprint;
  if v_existing is not null then
    update health_events set count = count + 1, last_seen_at = now() where id = v_existing;
    return null;
  end if;
  insert into health_events (message, stack, url, source, level, user_agent, fingerprint)
  values (left(coalesce(p_message,''),2000), left(p_stack,6000), left(p_url,500),
          coalesce(p_source,'client'), coalesce(p_level,'error'),
          left(p_user_agent,300), p_fingerprint)
  returning id into v_id;
  return v_id;
end $$;
revoke execute on function public.log_health_event(text,text,text,text,text,text,text) from public;
grant  execute on function public.log_health_event(text,text,text,text,text,text,text) to anon, authenticated;

create or replace function public.set_health_diagnosis(
  p_id bigint, p_severity text, p_category text, p_likely_cause text,
  p_suggested_fix text, p_is_actionable boolean
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update health_events set
    severity = p_severity, category = left(p_category,120),
    likely_cause = left(p_likely_cause,1000), suggested_fix = left(p_suggested_fix,1500),
    is_actionable = p_is_actionable, status = 'triaged'
  where id = p_id;
end $$;
revoke execute on function public.set_health_diagnosis(bigint,text,text,text,text,boolean) from public;
grant  execute on function public.set_health_diagnosis(bigint,text,text,text,text,boolean) to anon, authenticated;

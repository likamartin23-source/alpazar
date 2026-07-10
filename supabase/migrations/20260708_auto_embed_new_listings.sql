-- MAR-7 autonom: sa herë krijohet/përditësohet një shpallje pa embedding,
-- thirr Edge Function `embed` (backfill) async me pg_net. Sekreti + anon key
-- lexohen nga admin_settings (pa ekspozuar service_role).
create or replace function public.trg_embed_new_listing()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_secret text; v_anon text;
begin
  select value into v_secret from admin_settings where key = 'embed_cron_secret';
  select value into v_anon   from admin_settings where key = 'vercel_env_supabase_anon';
  if v_secret is null or v_anon is null then return new; end if;
  perform net.http_post(
    url := 'https://sopafwfkrxpcdaljddoh.supabase.co/functions/v1/embed',
    body := jsonb_build_object('mode','backfill','batch',5,'secret',v_secret),
    headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||v_anon,'apikey',v_anon)
  );
  return new;
end $$;

drop trigger if exists embed_on_listing on public.listings;
create trigger embed_on_listing
after insert or update of title, description, is_active on public.listings
for each row when (new.embedding is null and new.is_active = true)
execute function public.trg_embed_new_listing();

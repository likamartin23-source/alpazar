-- Shto te publikimi realtime tabelat që abonohen nga paneli i moderimit (moderation_queue,
-- takedown_requests) por MUNGONIN → live-updates të tyre nuk mbërtjenin (gjetur nga auditimi).
-- Additive, idempotent, i kthyeshëm. RLS i mbron (vetëm admin). FULL replica identity që UPDATE/DELETE
-- të bartin të dhënat e plota. E aplikuar live me apply_migration; ky skedar është për gjurmë/repo.

alter table public.moderation_queue replica identity full;
alter table public.takedown_requests replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='moderation_queue') then
    execute 'alter publication supabase_realtime add table public.moderation_queue';
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='takedown_requests') then
    execute 'alter publication supabase_realtime add table public.takedown_requests';
  end if;
end $$;

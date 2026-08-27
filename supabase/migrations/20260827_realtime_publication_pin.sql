-- Ngul (pin) anëtarësinë e publication-it `supabase_realtime` në repo, që konfigurimi realtime
-- të jetë i riprodhueshëm dhe i versionuar (Cowork — përditësimi realtime). Idempotent dhe additive:
-- shton çdo tabelë VETËM nëse s'është tashmë anëtare, ndaj s'prek gjendjen live (të gjitha janë
-- tashmë aktive në prodhim). Rollback: `ALTER PUBLICATION supabase_realtime DROP TABLE <x>`.
--
-- Tabelat kritike për veçoritë realtime të app-it (kryefaqja, profili /u/[id], mesazhet, njoftimet).

do $$
declare
  t text;
  tables text[] := array[
    'listings',            -- feed live: kryefaqe + /u/[id] (Cowork)
    'messages',            -- biseda realtime
    'conversations',       -- lista e bisedave
    'notifications',       -- njoftime realtime
    'typing_indicators',   -- "po shkruan…"
    'message_reactions',   -- reagime mesazhesh
    'follows',             -- ndjekës live
    'favorites'            -- të ruajtura live
  ];
begin
  foreach t in array tables loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
      raise notice 'realtime: shtova %', t;
    end if;
  end loop;
end $$;

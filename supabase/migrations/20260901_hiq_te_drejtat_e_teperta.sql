-- TRUNCATE / REFERENCES / TRIGGER hiqen nga `anon` dhe `authenticated`.
--
-- Nuk ishte gabim i projektit: eshte parazgjedhja e Supabase-it
-- (`grant all on all tables`), dhe cdo projekt Supabase e ka. Por eshte e
-- drejte e teperte, dhe njera prej tyre eshte e rrezikshme ne menyre te
-- vecante: TRUNCATE NUK filtrohet nga RLS — nje rruge e vetme qe e arrin
-- fshin gjithcka pa e prekur asnje politike. PostgREST nuk e leshon dot sot
-- (njeh vetem SELECT/INSERT/UPDATE/DELETE/RPC), por cdo funksion me nje
-- deklarim dinamik do ta arrinte. REFERENCES dhe TRIGGER nuk i duhen kurre
-- nje klienti.
--
-- Matur para: 69 tabela me TRUNCATE per te dy rolet.
-- Matur pas: 0 dhe 0, ndersa leximi publik i `listings` dhe shkrimi i `title`
-- nga `authenticated` mbeten te paprekura.

begin;

do $mig$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
            where n.nspname='public' and c.relkind='r'
  loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.relname);
  end loop;
end $mig$;

-- Edhe per tabelat qe do te krijohen me pas — perndryshe parazgjedhja e
-- Supabase-it do t'i rikthente ne heshtje me tabelen e ardhshme.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon, authenticated;

commit;

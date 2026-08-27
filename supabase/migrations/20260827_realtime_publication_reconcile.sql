-- P2 (AUTOPSI 27 gusht 2026) — NGUL publikimin realtime si PASQYRË BESNIKE e repo-s.
--
-- R2 nga autopsia: konfigurimi realtime u ndërtua me migrime CLI/MCP jashtë repo-s
-- (m10_realtime_setup, enable_full_replica_identity_realtime, realtime_add_price_alerts,
-- unify_search_index_and_realtime_v2, realtime_for_payment_queues) → repo-ja s'ishte
-- pasqyrë besnike e gjendjes live. Ky skedar RIGJENERON gjendjen e plotë nga DB live
-- (`sopafwfkrxpcdaljddoh`, query mbi pg_publication_tables + pg_class.relreplident,
-- 27 gusht 2026), që një DB e freskët të riprodhojë saktësisht të njëjtin konfigurim.
--
-- SIGURIA: krejtësisht IDEMPOTENT dhe additive. Në DB-në aktuale live është NO-OP
-- (të 30 tabelat janë tashmë anëtare; replica identity përputhet). RLS = 67/67 aktiv →
-- realtime respekton RLS, zero rrjedhje. S'shtohet asnjë EXECUTE/grant. S'preket
-- bërthama e pagesave. Rollback: `alter publication supabase_realtime drop table <x>`.
--
-- Konsolidon (zëvendëson) dy skedarët e ndërmjetëm: _realtime_publication_pin.sql +
-- _realtime_add_moderation_takedown.sql — përmbajtja e tyre përfshihet e plotë këtu.

-- 1) Anëtarësia e publikimit — të 30 tabelat, shtim vetëm nëse mungon.
do $$
declare
  t text;
  tables text[] := array[
    'app_config','blocks','businesses','categories','conversations','favorites',
    'follows','gamification_events','invoices','listing_views','listings',
    'message_reactions','messages','moderation_queue','notifications','offers',
    'orders','premium_plans','premium_requests','price_alerts','profiles','reports',
    'reviews','shares','subscriptions','takedown_requests','transactions',
    'typing_indicators','user_badges','user_settings'
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

-- 2) REPLICA IDENTITY FULL — tabelat ku UPDATE/DELETE duhet të bartin rreshtin e plotë
--    (që filtrat & fshirjet të mbërrijnë me të dhëna te abonentët). Gjendje live 27/08.
alter table public.app_config        replica identity full;
alter table public.categories        replica identity full;
alter table public.conversations     replica identity full;
alter table public.listings          replica identity full;
alter table public.messages          replica identity full;
alter table public.moderation_queue  replica identity full;
alter table public.notifications     replica identity full;
alter table public.offers            replica identity full;
alter table public.orders            replica identity full;
alter table public.profiles          replica identity full;
alter table public.reports           replica identity full;
alter table public.takedown_requests replica identity full;
alter table public.typing_indicators replica identity full;

-- 3) REPLICA IDENTITY DEFAULT (çelësi primar) — shprehimisht, që pasqyra të jetë
--    e plotë e deterministike (në një DB të freskët këto janë default gjithsesi).
alter table public.blocks             replica identity default;
alter table public.businesses         replica identity default;
alter table public.favorites          replica identity default;
alter table public.follows            replica identity default;
alter table public.gamification_events replica identity default;
alter table public.invoices           replica identity default;
alter table public.listing_views      replica identity default;
alter table public.message_reactions  replica identity default;
alter table public.premium_plans      replica identity default;
alter table public.premium_requests   replica identity default;
alter table public.price_alerts       replica identity default;
alter table public.reviews            replica identity default;
alter table public.shares             replica identity default;
alter table public.subscriptions      replica identity default;
alter table public.transactions       replica identity default;
alter table public.user_badges        replica identity default;
alter table public.user_settings      replica identity default;

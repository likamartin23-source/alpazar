-- MBYLLJA E FUNKSIONEVE TE TRIGERIT NDAJ PostgREST
--
-- GJETJA (keshilluesi i sigurise i Supabase-it, 31 gusht 2026): dy funksione
-- trigeri ne `public` ishin te thirrshme si `/rest/v1/rpc/<emri>`. Te dy jane
-- te shkruar nga une kete jave; te 190+ migrimet e meparshme i kane te mbyllur
-- (modeli i sakte: `{postgres=X, service_role=X}`, si `tg_queue_resolve_sync`).
--
-- Rreziku eshte i vogel (nje funksion trigeri i thirrur drejtpersedrejti deshton
-- me "trigger functions can only be called as triggers"), por eshte siperfaqe
-- e panevojshme dhe e shkruar nga dora ime — pastrohet.
--
-- DY HAPA, JO NJE. Pas hapit te pare ACL-ja ishte ende
--   {postgres=X, authenticated=X, service_role=X}
-- sepse `authenticated` e mbante te drejten si GRANT TE SHPREHUR (nga
-- `alter default privileges` i Supabase-it), ndaj heqja nga PUBLIC nuk e preku.
-- CLAUDE.md §1.1 thote "revoke nga PUBLIC, jo nga anon" — kjo mbulon vetem
-- gjysmen. Duhen te dyja, dhe verifikimi behet mbi `proacl`.
--
-- PROVE 1 (transaksion i kthyer mbrapsht): nje triger vazhdon te ndizet
-- normalisht pasi funksionit i hiqet cdo EXECUTE. Postgres-i e kontrollon
-- EXECUTE ne KRIJIMIN e trigerit, jo ne ndezje.
-- PROVE 2 (funksionale, pas heqjes, transaksion i kthyer mbrapsht): nje rast
-- moderimi i mbyllur prodhoi sakte 1 njoftim →
--   titulli "Shpallja jote u hoq nga moderimi"
--   trupi  = arsyetimi faktik
--   lidhja "/moderimi/<queue_id>"
--   i_shkoi_pronarit = true
-- Pas kthimit: 0 rreshta te mbetur ne moderation_queue dhe notifications.
--
-- Gjendja perfundimtare e matur: 0 funksione trigeri te thirrshme nga
-- anon/authenticated; te 5 trigerat perkates ende `tgenabled='O'`.

revoke all on function public.tg_notify_owner_on_moderation() from public;
revoke all on function public.tg_audit_gjurme() from public;
revoke all on function public.tg_notify_owner_on_moderation() from authenticated, anon;
revoke all on function public.tg_audit_gjurme() from authenticated, anon;

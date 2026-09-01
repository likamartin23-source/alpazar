-- KRITIKE: rikthe përditësimin e profilit për ÇDO përdorues (§0-bis, regres i ngushtimit O6/O7)
--
-- Gjetja (O22-2, riprodhuar te baza si `authenticated`):
--   update profiles set last_seen=now() where id=<vetja>  ->  42501 permission denied for table profiles
-- Shkaku: politika `profiles_update` WITH CHECK përmban 6 nën-SELECT-e mbi `profiles`
-- (NOT (is_admin IS DISTINCT FROM (select ... from profiles ...)) × 6). Këto kërkojnë SELECT
-- në NIVEL TABELE, të cilin ngushtimi O6/O7 e hoqi (vetëm grante kolonash). Pasojë: ÇDO update
-- profili dështon (emër/username/qytet/bio/avatar/kopertinë/cilësime dyqani/last_seen…), jo vetëm
-- last_seen — WITH CHECK vlerësohet pavarësisht kolonës së prekur.
--
-- ZGJIDHJA (e sigurt, pa rihapur §4.6-bis): paprekshmëria e 6 (+3 të tjera) kolonave privilegj
-- ENFORCOHET TASHMË PLOTËSISHT nga trigeri BEFORE UPDATE `trg_guard_profile_privileges`
-- (funksioni `guard_profile_privileges`, SECURITY DEFINER): bllokon is_admin/admin_role,
-- is_premium/premium_expires_at/has_boost/boost_expires_at, is_suspended/is_verified/trust_score —
-- me përjashtime për service_role, `app.skip_privilege_guard` dhe lejet (roles.manage/users.gift/
-- users.moderate). Pra nën-SELECT-et te RLS janë 100% TË TEPËRTA. I heqim; trigeri mbetet roja.
-- Trigeri s'ka nevojë për SELECT tabelar (përdor OLD/NEW + auth.uid()), ndaj s'preket nga ngushtimi.
--
-- MOS: `grant select on profiles to authenticated` (do rihapte §4.6-bis — çdo i kyçur numëron adminët).

begin;

alter policy profiles_update on public.profiles
  with check ( public.has_perm('users.moderate'::text) OR ( ( select auth.uid() ) = id ) );

commit;

-- VERIFIKIM PAS APLIKIMIT (si `authenticated`, roli i veshur):
--   update profiles set last_seen = now() where id = auth.uid();      -- duhet OK (jo 42501)
--   update profiles set is_premium = true where id = auth.uid();       -- duhet të BLLOKOHET nga trigeri
--     ("Perfitimet e paguara jepen vetem nga abonimi ose administrata") — prova negative.

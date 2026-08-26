-- Siguri K2 (26 gusht 2026): kufizo leximin ANONIM të profiles në kolona të sigurta.
-- Përpara: politika publike (qual=true) + SELECT tabelor → anon skrapon TË GJITHA kolonat
-- (age, birth_year, referred_by, social_links, metadata, marketing_opt_in, gdpr_consent…).
-- Tani anon merr vetëm kolona publike. Telefoni & last_seen mbeten (kontakt/prania — publike me qëllim).
-- Authenticated & service_role: akses i plotë (pronari, mesazhet, edge admin).
-- Aplikuar LIVE (apply_migration). Verifikuar me has_column_privilege:
--   anon phone=✓ last_seen=✓ ; age=✗ birth_year=✗ referred_by=✗ social_links=✗ metadata=✗ ; table_select=✗
--   authenticated age=✓ phone=✓
-- Rrjedhojë kodi: 2 `select('*')` anon te faqja e shpalljes u kthyen në listë kolonash të sigurta
--   (app/listing/[id]/page.tsx + ListingPageClient.tsx).
do $$
begin
  revoke select on public.profiles from anon;
  revoke select on public.profiles from public;
  grant select (
    id, username, full_name, avatar_url, phone, city, bio, is_premium, is_admin,
    premium_expires_at, gamification_points, gamification_level, created_at,
    shop_name, shop_description, shop_category, shop_banner_url, is_verified, last_seen,
    seller_rating, reviews_count, referral_code, cover_url, website, is_suspended,
    listings_count, total_sales, followers_count, following_count, response_rate,
    response_time_hrs, shop_is_open, total_saved, updated_at, trust_score,
    trust_score_visible, has_boost, boost_expires_at
  ) on public.profiles to anon;
  grant select on public.profiles to authenticated;
  grant select on public.profiles to service_role;
end $$;

-- ============================================================================
-- PLAN RIKTHIMI — planet legacy te fshira me 2026-08-09
-- ============================================================================
-- Keto ishin gjenerata e pare e planeve (Basic / Pro / Business + variantet vjetore).
-- U zevendesuan nga struktura e re: nje linje Premium (te gjithe te barabarte) dhe
-- nje linje Ekstra Boost VIP. Ishin `is_active = false` prej kohesh.
--
-- Gjendja ne momentin e fshirjes: 0 abonime, 0 kerkesa, 0 fatura qe i referoheshin.
-- PER TA RIKTHYER: ekzekuto kete skedar.
-- ============================================================================
insert into public.premium_plans
 (slug, name, description, tier, requires_premium, price_all, price_eur,
  price_all_year, price_eur_year, duration_days, months, billing_period,
  discount_pct, max_listings, max_images, max_videos, boost_credits,
  is_active, is_featured, badge, sort_order)
values
 ('basic','Premium Basic',NULL,'premium',false,999.90,9.99,NULL,NULL,30,1,'monthly',0,30,10,10,3,false,false,NULL,10),
 ('pro','Premium Pro',NULL,'premium',false,1999.90,19.99,NULL,NULL,30,1,'monthly',0,100,10,10,10,false,false,NULL,20),
 ('business','Business',NULL,'premium',false,3999.90,39.99,NULL,NULL,30,1,'monthly',0,-1,10,10,30,false,false,NULL,30),
 ('basic-yearly','Premium Basic (Vjetor)',NULL,'premium',false,9999,99.90,9999,99.90,365,12,'yearly',17,30,10,10,36,false,false,'Kurseni 17%',40),
 ('pro-yearly','Premium Pro (Vjetor)',NULL,'premium',false,19999,199.90,19999,199.90,365,12,'yearly',17,100,10,10,120,false,false,'Kurseni 17%',50),
 ('business-yearly','Business (Vjetor)',NULL,'premium',false,39999,399.90,39999,399.90,365,12,'yearly',17,-1,10,10,360,false,false,'Kurseni 17%',60)
on conflict (slug) do nothing;

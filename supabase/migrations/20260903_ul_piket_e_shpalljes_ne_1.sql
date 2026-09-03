-- Urdhër pronari (3 shtator 2026): ul pragun e pikëve në 1 pikë/shpallje.
-- Arsyeja: 10 pikë/shpallje (35 për të parën = 10+25 bonus) jepnin shumë pikë →
-- klienti merrte referal falas + besueshmëri e lartë E PAMERITUAR
-- (gamification_points ushqen recompute_trust_score / TrustBadge).
-- Ndryshim vlere te funksioni ekzistues; i kthyeshëm; NUK prek llogaritjen e
-- TrustBadge, vetëm inputin (më pak pikë). Mesazhi i shpalljes së parë mbahet si
-- urim, por me +1 pikë. Provuar me rollback: delta pikësh 10→1 (piket 145→146).
-- Aplikuar live me apply_migration me të njëjtin emër.
create or replace function public.fn_award_listing_points()
returns trigger language plpgsql security definer set search_path=public as $$
DECLARE v_listing_count INT; v_pts INT := 1;
  v_title TEXT := '⚡ +1 pikë për shpallje';
  v_body TEXT := 'Ke fituar 1 pikë për publikimin e shpalljes "' || LEFT(NEW.title, 50) || '"!';
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT COUNT(*) INTO v_listing_count FROM public.listings WHERE user_id = NEW.user_id AND id != NEW.id;
  IF v_listing_count = 0 THEN
    v_title := '🎉 Shpallja e parë!';
    v_body := 'Urime për shpalljen tënde të parë! (+1 pikë)';
  END IF;
  UPDATE public.profiles SET gamification_points = COALESCE(gamification_points, 0) + v_pts WHERE id = NEW.user_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, ref_id, ref_type, is_read)
  VALUES (NEW.user_id, 'badge_earned', v_title, v_body, '/profile', NEW.id, 'listing', false);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'fn_award_listing_points dështoi (s''bllokon shpalljen): %', SQLERRM;
  RETURN NEW;
END; $$;

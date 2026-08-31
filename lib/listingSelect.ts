// Një projeksion i vetëm identiteti për ÇDO feed shpalljesh (RESTAURIMI FINAL, GAP 1).
// Çdo query që ushqen `ListingCard` duhet ta përdorë KËTË konstante, që identiteti i
// biznesit (logo/emër → /biznese), identiteti i personit (→ /u), tier-i (rank_tier),
// statusi (SHITUR) dhe numri i shikimeve të shfaqen njësoj kudo — pa "maskim" të
// shpalljeve të biznesit si personale. Burimi i vetëm i së vërtetës për select-in.
export const LISTING_SELECT =
  'id,title,price,currency,condition,city,is_premium,images,video_poster,videos,category_id,created_at,user_id,status,rank_tier,views_count,business_id,business:business_id(id,name,logo_url,is_verified),author:user_id(id,full_name,username,avatar_url,is_premium,trust_score)'

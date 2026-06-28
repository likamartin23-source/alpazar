-- Performance — Supabase advisor remediation (2026-06-28)

-- duplicate_index: idx_posts_feed is identical to idx_posts_visible_created
--   (both: btree (created_at DESC) WHERE is_hidden = false). Keep the descriptive one.
DROP INDEX IF EXISTS public.idx_posts_feed;

-- unindexed_foreign_keys: post_likes.user_id FK had no covering index.
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes (user_id);

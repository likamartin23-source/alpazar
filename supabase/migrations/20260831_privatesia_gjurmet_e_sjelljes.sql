-- GJURMET E SJELLJES NUK JANE PUBLIKE
--
-- GJETUR 31 gusht 2026, ne kalimin e peste — pikerisht duke audituar ate qe
-- kalimet e meparshme e kishin BESUAR pa e lexuar. Keshilluesi i sigurise
-- raporton nese RLS eshte NDEZUR; ai nuk e lexon LOGJIKEN e politikes. Kur u
-- lexuan te 19 politikat me `using (true)`, tri prej tyre nuk ishin te dhena
-- publike:
--
-- 1) `listing_views` — `select true` per PUBLIC, me kolonat `viewer_id` dhe
--    `ip_hash`. Kushdo, edhe i palogaruar, mund te merrte gjithe regjistrin dhe
--    te mesonte CILI perdorues pa CILEN shpallje dhe KUR — profilizim i lehte i
--    interesave te dikujt (makine, banese, pune). Numri publik i shikimeve
--    ekziston tashme te `listings.views_count`, ndaj publiku nuk humbet asgje.
--    Matur perpara: 56 rreshta, 1 shikues i identifikuar.
-- 2) `typing_indicators` — `select true`, me `user_id` + `conversation_id`:
--    kushdo shihte NE KOHE REALE kush po i shkruante kujt (tabela eshte edhe ne
--    publikimin realtime).
-- 3) `message_reactions` — `select true`, me `user_id` + `message_id`. Mesazhet
--    jane private; reagimet mbi to nuk mund te jene publike.
--
-- KONTROLLUAR PARA NDRYSHIMIT: e vetmja rruge kodi qe lexon ndonje prej ketyre
-- eshte `/api/analytics`, e cila lexon `listing_views` me TOKEN-in e perdoruesit,
-- vetem per shpalljet e tij, duke zgjedhur `viewed_at,listing_id` (jo `viewer_id`).
-- `typing_indicators` dhe `message_reactions` nuk lexohen nga asnje rresht kodi.
--
-- SHKRIMI nuk preket: futja e nje shikimi behet nga `increment_listing_views()`
-- (SECURITY DEFINER), jo nga klienti.
--
-- PROVE PAS NDRYSHIMIT (RLS e simuluar me `request.jwt.claims`, matje reale):
--   pronari: 16 rreshta · perdorues tjeter: 0 · anon: 0

drop policy if exists listing_views_select on public.listing_views;
create policy listing_views_select on public.listing_views
  for select using (
    exists (select 1 from public.listings l
             where l.id = listing_views.listing_id and l.user_id = auth.uid())
    or public.has_perm('content.moderate')
  );

drop policy if exists typing_conv_read on public.typing_indicators;
create policy typing_conv_read on public.typing_indicators
  for select using (
    exists (select 1 from public.conversations c
             where c.id = typing_indicators.conversation_id
               and auth.uid() in (c.participant_a, c.participant_b))
  );

drop policy if exists reactions_select on public.message_reactions;
create policy reactions_select on public.message_reactions
  for select using (
    exists (select 1 from public.messages m
             join public.conversations c on c.id = m.conversation_id
            where m.id = message_reactions.message_id
              and auth.uid() in (c.participant_a, c.participant_b))
    or exists (select 1 from public.messages m
                where m.id = message_reactions.message_id
                  and auth.uid() in (m.sender_id, m.receiver_id))
  );

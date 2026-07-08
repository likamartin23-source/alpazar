-- Siguri: funksioni i trigger-it s'duhet të jetë i thirrshëm direkt via PostgREST
-- RPC (parandalon abuzim që spamon embed backfill). Trigger-i ekzekutohet si
-- pronar i tabelës, pa nevojë për EXECUTE te anon/authenticated.
revoke execute on function public.trg_embed_new_listing() from public, anon, authenticated;

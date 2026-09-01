-- FUSHA `listing_type` (produkt | sherbim) — vendim pronari (KERKESE-FILTRAT, varianti b)
--
-- Konteksti (O23/O24): filtri "🛠 Shërbim" te kryefaqja kërkonte një dallim tip. Shërbimet s'kanë
-- gjendje i-ri/i-përdorur, ndaj `condition` u mbetej NULL dhe shpallja binte JASHTË çdo filtri
-- (arrihej vetëm nga "Të gjitha"). Zgjidhja e pastër: një fushë e vërtetë `listing_type`.
--
-- Additive dhe e sigurt: kolonë e re me default 'produkt' (asnjë shpallje ekzistuese s'ndryshon
-- sjellje — të gjitha bëhen 'produkt', si ishin de-facto). Formulari i shpalljes e vendos
-- 'sherbim' kur duhet. Filtri: listing_type='sherbim'. CHECK kufizon vlerat.

begin;

alter table public.listings
  add column if not exists listing_type text not null default 'produkt';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname='listings_listing_type_chk' and conrelid='public.listings'::regclass
  ) then
    alter table public.listings
      add constraint listings_listing_type_chk check (listing_type in ('produkt','sherbim'));
  end if;
end $$;

-- Rreshtat ekzistues: default-i i mbush si 'produkt'; sigurohu edhe për çdo NULL të mundshëm.
update public.listings set listing_type = 'produkt' where listing_type is null;

commit;

-- VERIFIKIM: select listing_type, count(*) from listings group by 1;  -- pritet 'produkt' = të gjitha.
-- Filtri live: listings?select=id&listing_type=eq.sherbim -> 200 (bosh derisa të krijohet një shërbim).

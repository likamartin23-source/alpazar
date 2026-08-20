-- §1B: krijimi i biznesit kerkon Premium AKTIV, i toggle-ueshem nga konfigurimi.
-- Gate-i qeveriset nga app_config.business_requires_premium (pasqyre e sakte e
-- business_should_be_visible): nese s'eshte 'true', gate-i nuk aplikohet.
-- Additive dhe i kthyeshem; provuar empirikisht (tier-0 bllokohet, premium lejohet).
drop policy if exists biz_owner_ins on public.businesses;
create policy biz_owner_ins on public.businesses for insert
  with check (
    ((select auth.uid()) = owner_id)
    and (
      coalesce((select nullif(value,'') from public.app_config where key='business_requires_premium'),'true') <> 'true'
      or coalesce(public.owner_rank_tier((select auth.uid())),0) >= 1
    )
  );
comment on policy biz_owner_ins on public.businesses is
  '§1B: owner_id vetjak DHE (biznesi s''kerkon premium sipas app_config OSE pronari tier>=1). Gate i toggle-ueshem nga konfigurimi.';

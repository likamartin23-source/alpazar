-- PAGESA P10 (Martinel, 26 gusht 2026): VERSIONIM i bërthamës së pagesave (mbyllje drift-i).
-- SNAPSHOT i saktë i skemës LIVE, i GJENERUAR nga katalogu (pa transkriptim me dorë): 7 tabelat
-- bazë + kufizimet + indekset + RLS/politikat, plus 3 funksionet PIVOT (_sub_event, grant_premium,
-- process_payment_event). Deri tani këto ekzistonin VETËM live (pikë e verbër auditimi #2).
--
-- SHËNIM I NDERSHËM: shtresa e plotë e pagesave ka ~55 funksione (~84KB). Ky skedar versionon
-- nënbashkësinë AUDIT-KRITIKE (mbi të cilën pivoton çdo pagesë). Për fotografinë e plotë,
-- byte-perfekte, rekomandohet komanda e vetme e pronarit:  `supabase db pull`  (ose
-- `pg_dump --schema-only`), që nuk mund të ekzekutohet nga ky sesion (pa akses CLI/dump).
-- Ky skedar është regjistrim dokumentues; prodhimi është burimi i së vërtetës (tashmë live).

-- ─────────────────────────── TABELAT BAZË ───────────────────────────
create table if not exists public.invoices (
  id uuid not null default gen_random_uuid(),
  number text not null,
  user_id uuid not null,
  subscription_id uuid,
  plan_name text not null,
  period text not null default 'monthly'::text,
  amount numeric not null,
  currency text not null default 'EUR'::text,
  status text not null default 'paid'::text,
  issued_at timestamp with time zone not null default now(),
  data jsonb not null default '{}'::jsonb,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  vat_rate numeric not null default 0,
  vat_amount numeric not null default 0,
  total numeric not null default 0,
  payment_method text,
  seller_json jsonb not null default '{}'::jsonb,
  buyer_json jsonb not null default '{}'::jsonb,
  sent_at timestamp with time zone,
  sent_by uuid,
  send_count integer not null default 0,
  file_url text,
  file_name text,
  file_kind text not null default 'system'::text,
  admin_note text,
  kind text not null default 'invoice'::text,
  parent_invoice_id uuid,
  refunded_total numeric not null default 0,
  refund_reason text,
  refunded_at timestamp with time zone,
  refunded_by uuid,
  fiscal_status text not null default 'not_required'::text,
  nivf text,
  nslf text,
  fiscal_qr_url text,
  fiscal_error text,
  fiscal_attempts smallint not null default 0,
  fiscalized_at timestamp with time zone,
  fiscal_deadline_at timestamp with time zone,
  fiscal_payload jsonb,
  fiscal_number text
);

create table if not exists public.payment_methods (
  id uuid not null default gen_random_uuid(),
  name text not null,
  type text,
  config_json jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  logo_url text,
  description text,
  min_amount numeric(10,2) default 0,
  max_amount numeric(12,2),
  sort_order smallint default 0,
  updated_at timestamp with time zone default now()
);

create table if not exists public.premium_plans (
  id uuid not null default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  price_eur numeric(8,2) not null,
  price_all numeric(12,2) not null,
  duration_days integer not null default 30,
  max_listings integer not null default 50,
  max_images smallint not null default 10,
  boost_credits integer not null default 5,
  features jsonb default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order smallint default 0,
  created_at timestamp with time zone not null default now(),
  price_eur_year numeric,
  price_all_year numeric,
  billing_period text not null default 'monthly'::text,
  is_featured boolean not null default false,
  badge text,
  tier text not null default 'premium'::text,
  requires_premium boolean not null default false,
  max_videos integer not null default 10,
  discount_pct numeric(5,2) not null default 0,
  months integer not null default 1
);

create table if not exists public.premium_requests (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid,
  payment_method text,
  amount numeric,
  days_requested integer,
  status text not null default 'pending'::text,
  admin_note text,
  processed_by uuid,
  processed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.subscription_events (
  id uuid not null default gen_random_uuid(),
  subscription_id uuid,
  user_id uuid not null,
  type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_id uuid not null,
  status text not null default 'pending'::text,
  started_at timestamp with time zone,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  cancel_at_period_end boolean not null default false,
  pending_plan_id uuid,
  payment_method_id uuid,
  price_paid numeric,
  currency text not null default 'EUR'::text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  period text not null default 'monthly'::text,
  tier text not null default 'premium'::text,
  immediate_start_consent_at timestamp with time zone,
  withdrawal_waiver_ack_at timestamp with time zone,
  withdrawn_at timestamp with time zone
);

create table if not exists public.transactions (
  id uuid not null default gen_random_uuid(),
  user_id uuid,
  order_id uuid,
  subscription_id uuid,
  type text not null,
  amount numeric(12,2) not null,
  currency currency_code not null default 'EUR'::currency_code,
  status text not null default 'pending'::text,
  provider text,
  provider_ref text,
  payload jsonb default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- ─────────────────────────── KUFIZIMET (PK/FK/UNIQUE/CHECK) ───────────────────────────
-- (snapshot; në një DB të re shto pasi të ekzistojnë tabelat e referuara: profiles, auth.users, orders)
alter table public.invoices add constraint invoices_file_kind_chk CHECK ((file_kind = ANY (ARRAY['system'::text, 'fiscal'::text, 'manual'::text])));
alter table public.invoices add constraint invoices_fiscal_status_check CHECK ((fiscal_status = ANY (ARRAY['not_required'::text, 'pending'::text, 'sent'::text, 'fiscalized'::text, 'failed'::text, 'external'::text])));
alter table public.invoices add constraint invoices_kind_chk CHECK ((kind = ANY (ARRAY['invoice'::text, 'credit_note'::text])));
alter table public.invoices add constraint invoices_number_key UNIQUE (number);
alter table public.invoices add constraint invoices_parent_invoice_id_fkey FOREIGN KEY (parent_invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;
alter table public.invoices add constraint invoices_pkey PRIMARY KEY (id);
alter table public.invoices add constraint invoices_status_check CHECK ((status = ANY (ARRAY['paid'::text, 'gifted'::text, 'issued'::text, 'sent'::text, 'partially_refunded'::text, 'refunded'::text, 'void'::text])));
alter table public.invoices add constraint invoices_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;
alter table public.payment_methods add constraint payment_methods_pkey PRIMARY KEY (id);
alter table public.premium_plans add constraint premium_plans_billing_period_chk CHECK ((billing_period = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text])));
alter table public.premium_plans add constraint premium_plans_pkey PRIMARY KEY (id);
alter table public.premium_plans add constraint premium_plans_slug_key UNIQUE (slug);
alter table public.premium_plans add constraint premium_plans_tier_chk CHECK ((tier = ANY (ARRAY['premium'::text, 'boost'::text])));
alter table public.premium_requests add constraint premium_requests_pkey PRIMARY KEY (id);
alter table public.premium_requests add constraint premium_requests_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES premium_plans(id);
alter table public.premium_requests add constraint premium_requests_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES profiles(id);
alter table public.premium_requests add constraint premium_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'gifted'::text, 'canceled'::text])));
alter table public.premium_requests add constraint premium_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public.subscription_events add constraint subscription_events_pkey PRIMARY KEY (id);
alter table public.subscription_events add constraint subscription_events_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;
alter table public.subscriptions add constraint subscriptions_payment_method_id_fkey FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id);
alter table public.subscriptions add constraint subscriptions_pending_plan_id_fkey FOREIGN KEY (pending_plan_id) REFERENCES premium_plans(id);
alter table public.subscriptions add constraint subscriptions_period_check CHECK ((period = ANY (ARRAY['monthly'::text, 'quarterly'::text, 'yearly'::text])));
alter table public.subscriptions add constraint subscriptions_pkey PRIMARY KEY (id);
alter table public.subscriptions add constraint subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES premium_plans(id);
alter table public.subscriptions add constraint subscriptions_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'canceled'::text, 'expired'::text])));
alter table public.subscriptions add constraint subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public.transactions add constraint transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id);
alter table public.transactions add constraint transactions_pkey PRIMARY KEY (id);
alter table public.transactions add constraint transactions_subscription_id_fkey FOREIGN KEY (subscription_id) REFERENCES premium_subscriptions(id);
alter table public.transactions add constraint transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE RESTRICT;

-- ─────────────────────────── INDEKSET ───────────────────────────
CREATE INDEX transactions_user_idx ON public.transactions USING btree (user_id, created_at DESC);
CREATE INDEX transactions_order_idx ON public.transactions USING btree (order_id) WHERE (order_id IS NOT NULL);
CREATE INDEX transactions_type_idx ON public.transactions USING btree (type, status);
CREATE INDEX idx_transactions_subscription_id ON public.transactions USING btree (subscription_id);
CREATE UNIQUE INDEX ux_transactions_provider_ref ON public.transactions USING btree (provider, provider_ref);
CREATE INDEX idx_subscriptions_payment_method_id ON public.subscriptions USING btree (payment_method_id);
CREATE INDEX idx_subscriptions_pending_plan_id ON public.subscriptions USING btree (pending_plan_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions USING btree (plan_id);
CREATE INDEX idx_subs_user_tier ON public.subscriptions USING btree (user_id, tier, status);
CREATE UNIQUE INDEX uniq_live_subscription_per_user_tier ON public.subscriptions USING btree (user_id, tier) WHERE (status = ANY (ARRAY['pending'::text, 'active'::text, 'past_due'::text]));
CREATE INDEX idx_subscriptions_period_end ON public.subscriptions USING btree (current_period_end) WHERE (status = 'active'::text);
CREATE INDEX premium_requests_user_id_idx ON public.premium_requests USING btree (user_id);
CREATE INDEX premium_requests_status_idx ON public.premium_requests USING btree (status);
CREATE INDEX idx_premium_requests_plan_id ON public.premium_requests USING btree (plan_id);
CREATE INDEX idx_premium_requests_processed_by ON public.premium_requests USING btree (processed_by);
CREATE INDEX idx_premreq_user ON public.premium_requests USING btree (user_id, created_at DESC);
CREATE INDEX idx_premreq_status ON public.premium_requests USING btree (status) WHERE (status = 'pending'::text);
CREATE INDEX idx_invoices_parent ON public.invoices USING btree (parent_invoice_id) WHERE (parent_invoice_id IS NOT NULL);
CREATE INDEX idx_invoices_subscription_id ON public.invoices USING btree (subscription_id);
CREATE UNIQUE INDEX uq_invoices_nivf ON public.invoices USING btree (nivf) WHERE (nivf IS NOT NULL);
CREATE INDEX idx_invoices_fiscal_open ON public.invoices USING btree (fiscal_deadline_at) WHERE (fiscal_status = ANY (ARRAY['pending'::text, 'failed'::text]));
CREATE INDEX idx_invoices_user_sent ON public.invoices USING btree (user_id, sent_at DESC);
CREATE INDEX idx_invoices_user ON public.invoices USING btree (user_id, issued_at DESC);
CREATE INDEX idx_subscription_events_subscription_id ON public.subscription_events USING btree (subscription_id);
CREATE INDEX idx_sub_events_user ON public.subscription_events USING btree (user_id, created_at DESC);

-- ─────────────────────────── RLS + POLITIKAT ───────────────────────────
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;
alter table public.premium_plans enable row level security;
alter table public.premium_requests enable row level security;
alter table public.invoices enable row level security;
alter table public.payment_methods enable row level security;
alter table public.subscription_events enable row level security;
create policy tx_insert on public.transactions for insert to public with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy tx_select on public.transactions for select to public using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));
create policy subs_select on public.subscriptions for select to public using (((user_id = ( SELECT auth.uid() AS uid)) OR has_perm('billing.view'::text)));
create policy plans_admin_del on public.premium_plans for delete to public using (has_perm('billing.plans'::text));
create policy plans_admin_ins on public.premium_plans for insert to public with check (has_perm('billing.plans'::text));
create policy plans_admin_upd on public.premium_plans for update to public using (has_perm('billing.plans'::text)) with check (has_perm('billing.plans'::text));
create policy plans_select on public.premium_plans for select to public using (((is_active = true) OR is_admin()));
create policy premium_requests_delete on public.premium_requests for delete to authenticated using (has_perm('billing.approve'::text));
create policy premium_requests_insert on public.premium_requests for insert to authenticated with check (((user_id = ( SELECT auth.uid() AS uid)) AND (status = 'pending'::text)));
create policy premium_requests_select on public.premium_requests for select to authenticated using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));
create policy premium_requests_update on public.premium_requests for update to authenticated using (has_perm('billing.approve'::text)) with check (has_perm('billing.approve'::text));
create policy invoices_select on public.invoices for select to public using (((user_id = ( SELECT auth.uid() AS uid)) OR has_perm('billing.view'::text)));
create policy payment_methods_admin_del on public.payment_methods for delete to public using (has_perm('billing.plans'::text));
create policy payment_methods_admin_ins on public.payment_methods for insert to public with check (has_perm('billing.plans'::text));
create policy payment_methods_admin_upd on public.payment_methods for update to public using (has_perm('billing.plans'::text)) with check (has_perm('billing.plans'::text));
create policy payment_methods_select on public.payment_methods for select to authenticated using (((is_active = true) OR is_admin()));
create policy sub_events_select on public.subscription_events for select to public using (((user_id = ( SELECT auth.uid() AS uid)) OR is_admin()));

-- ─────────────────────────── FUNKSIONET PIVOT ───────────────────────────
CREATE OR REPLACE FUNCTION public._sub_event(p_sub uuid, p_user uuid, p_type text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  insert into public.subscription_events(subscription_id, user_id, type, data)
  values (p_sub, p_user, p_type, coalesce(p_data,'{}'::jsonb));
$function$;

CREATE OR REPLACE FUNCTION public.grant_premium(p_user uuid, p_source text, p_days integer DEFAULT 30, p_plan_id uuid DEFAULT NULL::uuid, p_amount numeric DEFAULT 0, p_reason text DEFAULT NULL::text, p_tier text DEFAULT 'premium'::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_sub_id uuid; v_inv_id uuid; v_end timestamptz; v_boost_end timestamptz;
  v_plan public.premium_plans; v_existing public.subscriptions; v_period text; v_cur text;
begin
  if p_user is null then return jsonb_build_object('error','user_required'); end if;
  if coalesce(p_days,0) <= 0 then return jsonb_build_object('error','days_invalid'); end if;
  if p_source not in ('subscription','gift','request','admin') then return jsonb_build_object('error','source_invalid'); end if;

  -- SHTESA: Boost kërkon Premium aktiv (VIP = premium + boost)
  if p_tier = 'boost' and not exists (
      select 1 from public.profiles where id = p_user
        and coalesce(is_premium,false) and (premium_expires_at is null or premium_expires_at > now())
  ) then
    return jsonb_build_object('error','premium_required',
      'message','Ekstra Boost (VIP) kërkon Premium aktiv. Aktivizo së pari Premium.');
  end if;

  select * into v_plan from public.premium_plans where id = p_plan_id;
  v_period := coalesce(v_plan.billing_period, case when p_days >= 330 then 'yearly' else 'monthly' end);
  v_cur := case
    when v_plan.id is null then null
    when coalesce(p_amount,0) = 0 then null
    when p_amount in (v_plan.price_all, v_plan.price_all_year) then 'ALL'
    when p_amount in (v_plan.price_eur, v_plan.price_eur_year) then 'EUR'
    else null end;
  v_cur := coalesce(v_cur, (select nullif(value,'') from public.app_config where key='default_currency'), 'ALL');

  select * into v_existing from public.subscriptions
   where user_id = p_user and status in ('active','pending') and coalesce(tier,'premium') = p_tier
   order by current_period_end desc nulls last limit 1;

  if v_existing.id is not null then
    v_end := greatest(coalesce(v_existing.current_period_end, now()), now()) + make_interval(days => p_days);
    update public.subscriptions
       set current_period_end = v_end, status = 'active', plan_id = coalesce(p_plan_id, plan_id),
           price_paid = coalesce(p_amount, price_paid), currency = v_cur, period = v_period
     where id = v_existing.id returning id into v_sub_id;
  else
    v_end := now() + make_interval(days => p_days);
    insert into public.subscriptions(user_id, plan_id, status, started_at, current_period_start, current_period_end, price_paid, currency, period, tier)
    values (p_user, p_plan_id, 'active', now(), now(), v_end, coalesce(p_amount,0), v_cur, v_period, p_tier)
    returning id into v_sub_id;
  end if;

  perform set_config('app.skip_privilege_guard','true', true);
  if p_tier = 'boost' then
    v_boost_end := greatest(coalesce((select boost_expires_at from public.profiles where id=p_user), now()), now())
                   + make_interval(days => p_days);
    update public.profiles set has_boost = true, boost_expires_at = v_boost_end where id = p_user;  -- vetëm boost; premium-in s'e prek
  else
    update public.profiles set is_premium = true, premium_expires_at = v_end where id = p_user;
  end if;
  perform set_config('app.skip_privilege_guard','false', true);

  if coalesce(p_amount,0) > 0 then
    v_inv_id := public._issue_invoice(p_user, v_sub_id, coalesce(v_plan.name,'Premium'), v_period, p_amount, 'paid', v_cur);
  end if;

  perform public.admin_log('premium.grant','user', p_user, null,
    jsonb_build_object('source', p_source, 'dite', p_days, 'tier', p_tier, 'deri', v_end,
      'shuma', coalesce(p_amount,0), 'monedha', v_cur, 'subscription_id', v_sub_id, 'invoice_id', v_inv_id, 'arsyeja', p_reason));
  return jsonb_build_object('ok', true, 'subscription_id', v_sub_id, 'invoice_id', v_inv_id, 'deri', v_end, 'fature', (v_inv_id is not null), 'monedha', v_cur);
end $function$;

CREATE OR REPLACE FUNCTION public.process_payment_event(p_provider text, p_provider_ref text, p_user uuid, p_plan_id uuid, p_amount numeric DEFAULT 0, p_currency text DEFAULT 'ALL'::text, p_event_type text DEFAULT 'payment'::text, p_payload jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_tx public.transactions;
  v_plan public.premium_plans;
  v_res jsonb;
  v_cur public.currency_code;
  v_tier text;
  v_user uuid;
begin
  if coalesce(p_provider,'') = '' or coalesce(p_provider_ref,'') = '' then
    return jsonb_build_object('ok',false,'error','ref_required');
  end if;
  v_cur := (case upper(coalesce(p_currency,'ALL'))
              when 'EUR' then 'EUR' when 'USD' then 'USD' else 'ALL' end)::public.currency_code;

  -- Zgjidh përdoruesin; nëse i panjohur -> NULL (paraja regjistrohet gjithsesi).
  if p_user is not null and exists (select 1 from public.profiles where id = p_user) then
    v_user := p_user;
  else
    v_user := null;
  end if;

  insert into public.transactions(user_id, type, amount, currency, status, provider, provider_ref, payload)
  values (v_user, 'subscription', coalesce(p_amount,0), v_cur, 'received', p_provider, p_provider_ref,
          coalesce(p_payload,'{}'::jsonb)
            || jsonb_build_object('plan_id', p_plan_id, 'event_type', p_event_type)
            || case when v_user is null then jsonb_build_object('attempted_user', p_user) else '{}'::jsonb end)
  on conflict (provider, provider_ref) do nothing;

  select * into v_tx from public.transactions
    where provider = p_provider and provider_ref = p_provider_ref
    for update;

  if v_tx.id is null then
    return jsonb_build_object('ok',false,'error','tx_missing');
  end if;
  if v_tx.status = 'completed' then
    return jsonb_build_object('ok',true,'already',true,
      'subscription_id', v_tx.payload->'grant'->>'subscription_id');
  end if;
  if v_tx.status = 'refunded' then
    return jsonb_build_object('ok',true,'refunded',true);
  end if;

  -- REFUND / chargeback -> revoko (best-effort).
  if p_event_type = 'refund' then
    v_tier := coalesce((select tier from public.premium_plans where id = p_plan_id), 'premium');
    if v_user is not null then
      begin
        perform set_config('app.skip_privilege_guard','true', true);
        update public.subscriptions set status='cancelled', updated_at=now()
          where user_id = v_user and coalesce(tier,'premium') = v_tier and status = 'active';
        if v_tier = 'boost' then
          update public.profiles set has_boost=false, boost_expires_at=now() where id = v_user;
        else
          update public.profiles set is_premium=false, premium_expires_at=now() where id = v_user;
        end if;
        perform set_config('app.skip_privilege_guard','false', true);
      exception when others then
        perform set_config('app.skip_privilege_guard','false', true);
      end;
    end if;
    update public.transactions set status='refunded', updated_at=now(),
      payload = payload || jsonb_build_object('refunded_at', now()) where id = v_tx.id;
    perform public.admin_log('payment.refund','user', v_user, null,
      jsonb_build_object('provider',p_provider,'ref',p_provider_ref,'tier',v_tier));
    return jsonb_build_object('ok',true,'refunded',true);
  end if;

  -- VALIDIM: plan aktiv (përndryshe 'review'); përdorues i njohur (përndryshe 'review').
  select * into v_plan from public.premium_plans where id = p_plan_id and is_active = true;
  if v_plan.id is null then
    update public.transactions set status='review', updated_at=now(),
      payload = payload || jsonb_build_object('review','plan_invalid') where id = v_tx.id;
    return jsonb_build_object('ok',false,'review',true,'reason','plan_invalid');
  end if;
  if v_user is null then
    update public.transactions set status='review', updated_at=now(),
      payload = payload || jsonb_build_object('review','user_unknown') where id = v_tx.id;
    return jsonb_build_object('ok',false,'review',true,'reason','user_unknown');
  end if;

  -- GRANT me ROJË PËRJASHTIMI: paraja mbetet e regjistruar edhe nëse grant-i dështon.
  begin
    v_res := public.grant_premium(v_user, 'subscription', v_plan.duration_days, v_plan.id,
                                  coalesce(p_amount,0), 'auto:'||p_provider, v_plan.tier);
    if v_res ? 'error' then
      update public.transactions set status='grant_failed', updated_at=now(),
        payload = payload || jsonb_build_object('grant_error', v_res) where id = v_tx.id;
      return jsonb_build_object('ok',false,'recorded',true,'grant_error', v_res);
    end if;
    update public.transactions set status='completed', updated_at=now(),
      payload = payload || jsonb_build_object('grant', v_res) where id = v_tx.id;
    perform public.admin_log('payment.auto_grant','user', v_user, null,
      jsonb_build_object('provider',p_provider,'ref',p_provider_ref,'plan',v_plan.slug,
                         'tier',v_plan.tier,'amount',p_amount));
    return jsonb_build_object('ok',true,'granted',true,'grant', v_res);
  exception when others then
    update public.transactions set status='grant_failed', updated_at=now(),
      payload = payload || jsonb_build_object('exception', SQLERRM) where id = v_tx.id;
    return jsonb_build_object('ok',false,'recorded',true,'error', SQLERRM);
  end;
end $function$;

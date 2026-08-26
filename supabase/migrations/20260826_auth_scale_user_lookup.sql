-- SCALE (miliona përdorues): njohja e llogarisë të mos dështojë KURRË. Aplikuar LIVE.
-- Problemi i mëparshëm: verify-otp.findUserId përdorte listUsers me paginim (tavan ~5000)
-- → mbi 5000 përdorues, llogaria ekzistuese mund të mos gjendej ("nuk njihet").
-- Zgjidhja: kërkim O(1) me indeks nga email-i kanonik (auth.users.email UNIK+indeksuar;
-- për telefon = <numri>@sms.al) + indeks UNIK në profiles.phone (një numër = një llogari).

-- 1) Indeks UNIK për telefonin (kërkim O(1) + garanci pa dublikatë).
create unique index if not exists profiles_phone_unique
  on public.profiles (phone) where phone is not null;

-- 2) Kërkim i drejtpërdrejtë i llogarisë nga email-i kanonik (scale-proof).
create or replace function public.auth_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select id from auth.users where email = lower(p_email) limit 1;
$$;
revoke all on function public.auth_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.auth_user_id_by_email(text) to service_role;
comment on function public.auth_user_id_by_email(text) is
  'Kërkim O(1) i llogarisë nga email-i kanonik (auth.users). Vetëm service_role (edge verify-otp). Scale-proof, zëvendëson listUsers. Shtuar 26 gusht 2026.';

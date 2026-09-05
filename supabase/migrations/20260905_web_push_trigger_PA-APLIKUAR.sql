-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║  PA APLIKUAR — PRET ÇELËSAT VAPID TË PRONARIT (Faza C, web-push)          ║
-- ║  Mos e apliko derisa: (1) VAPID keys të gjenerohen, (2) edge function     ║
-- ║  send-push të vendoset me sekretet, (3) admin_settings të mbushet me      ║
-- ║  send_push_url + send_push_secret. Aplikohet BASHKË me ta dhe testohet    ║
-- ║  live (§9.3: prova PAS aplikimit). Deri atëherë push_enabled='false'.     ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
--
-- Trigeri fanon çdo njoftim të ri te edge function `send-push` përmes pg_net.
-- GATE-t (të gjitha duhet të plotësohen ose no-op):
--   · app_config.push_enabled = 'true'
--   · admin_settings.send_push_url  = URL-ja e funksionit send-push
--   · admin_settings.send_push_secret = i njëjti me SEND_PUSH_SECRET te funksioni
-- Pa ndonjërin → return NEW (asnjë efekt). ADITIV; `exception when others` →
-- dështimi i push-it s'e bllokon KURRË krijimin e njoftimit (rrjeta e sigurisë).
--
-- Freskia: s'prek fare SW-në as klientin — vetëm një thirrje rrjeti nga DB-ja.

create or replace function public.tg_notification_web_push()
returns trigger language plpgsql security definer set search_path to 'public','extensions','net' as $fn$
declare v_url text; v_secret text; v_enabled text;
begin
  select value into v_enabled from public.app_config where key = 'push_enabled';
  if coalesce(v_enabled,'false') <> 'true' then return NEW; end if;

  select value into v_url    from public.admin_settings where key = 'send_push_url';
  select value into v_secret from public.admin_settings where key = 'send_push_secret';
  if v_url is null or v_secret is null then return NEW; end if;

  perform net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type','application/json','x-push-secret', v_secret),
    body    := jsonb_build_object(
                 'user_id', NEW.user_id,
                 'title',   NEW.title,
                 'body',    NEW.body,
                 'url',     coalesce(NEW.link, '/'),
                 'tag',     NEW.type::text
               )
  );
  return NEW;
exception when others then return NEW;  -- push-i që dështon s'e bllokon njoftimin
end $fn$;

drop trigger if exists tg_notification_web_push on public.notifications;
create trigger tg_notification_web_push after insert on public.notifications
  for each row execute function public.tg_notification_web_push();

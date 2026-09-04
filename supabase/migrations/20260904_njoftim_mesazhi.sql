-- NJOFTIM PËR MESAZH TË RI — përmirësim (dedupe + media), 4 shtator 2026
--
-- MËSIM I MATUR (F1/F6 e SUPERAUTOPSIA-s): njoftimi për mesazh EKZISTONTE tashmë.
-- Një auditim që kërkoi vetëm te `supabase/migrations/` s'e pa, sepse trigeri
-- `trg_notify_on_message` → `notify_on_new_message()` jeton në SKEMËN BAZË (si vetë
-- tabela `notifications`). Ndërtova gabimisht një triger të dytë (tg_message_notify_insert)
-- dhe prova e shkrimit e kapi menjëherë: `pozitiv=2` (dy njoftime për një mesazh).
-- Rregulli i artë: kërko A EKZISTON në BAZË (jo vetëm në migrime) para se të ndërtosh.
--
-- Ky migrim: (1) heq duplikatin tim; (2) PËRMIRËSON trigerin ekzistues me dy gjëra
-- që i mungonin, pa dyfishuar asgjë:
--   · parapamje media — 📷 Foto / 🎤 Mesazh zanor (më parë 'image'/'audio' → '📎 Mesazh');
--   · dedupe FB/Instagram-style — nëse marrësi ka tashmë një njoftim TË PALEXUAR
--     `new_message` nga i njëjti dërgues (i njëjti link), përditësohet ai rresht
--     (ngrihet lart, freskohet trupi) në vend që të krijohet një i dytë. Kështu një
--     bisedë = një zë te zilja, jo N zëra për N mesazhe. Toast-i (INSERT-only) ndizet
--     për mesazhin e parë të palexuar, jo për çdo mesazh të një shpërthimi.
--
-- Ruhet sjellja ekzistuese: SECURITY DEFINER (RLS lejon INSERT vetëm adminit),
-- `is_system` përjashtohet, `exception when others then return NEW` (njoftimi që
-- dështon s'e bllokon mesazhin). Lidhja `/messages?with=<sender>` përputhet me
-- deep-link-un (messages/page.tsx:227) dhe shënim-leximin (messages/page.tsx:380).
--
-- Provë shkrimi (rollback): 3 mesazhe A→B (2 tekst + 1 foto) → 1 rresht i vetëm
-- (rreshta_bisede=1, para=0/pas=1, body='📷 Foto'); vetë-mesazh → 0. Matur live.

drop trigger if exists tg_message_notify_insert on public.messages;
drop function if exists public.tg_message_notify_insert();

create or replace function public.notify_on_new_message()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare v_sender record; v_body text; v_link text; v_existing uuid; v_titull text;
begin
  if NEW.sender_id = NEW.receiver_id or NEW.is_system is true then return NEW; end if;
  if NEW.deleted_at is not null then return NEW; end if;

  select full_name, username, avatar_url into v_sender from profiles where id = NEW.sender_id;
  v_titull := coalesce(v_sender.full_name, v_sender.username, 'Përdorues');

  v_body := case NEW.type
    when 'image' then '📷 Foto'
    when 'audio' then '🎤 Mesazh zanor'
    else case when NEW.content is null or btrim(NEW.content)='' then '📎 Mesazh' else left(NEW.content,100) end
  end;
  v_link := '/messages?with=' || NEW.sender_id::text;

  select id into v_existing from notifications
    where user_id = NEW.receiver_id and type='new_message' and is_read=false and link=v_link
    order by created_at desc limit 1;

  if v_existing is not null then
    update notifications
       set title = v_titull, body = v_body, image_url = v_sender.avatar_url,
           ref_id = NEW.id, created_at = now()
     where id = v_existing;
  else
    insert into notifications (user_id, type, title, body, link, ref_id, ref_type, image_url)
    values (NEW.receiver_id, 'new_message', v_titull, v_body, v_link, NEW.id, 'message', v_sender.avatar_url);
  end if;
  return NEW;
exception when others then return NEW;
end $function$;

-- Trigeri bazë `trg_notify_on_message` mbetet i pandryshuar (thërret të njëjtin emër funksioni).

-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │  I PA-APLIKUAR ME QELLIM. Zbatohet VETEM PASI dega te jete ne prodhim.  │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- BASHKENGJITJET E BISEDAVE — nga bucket publik ne bucket privat.
--
-- GJENDJA E MATUR (1 shtator 2026): `message-attachments` eshte PUBLIK dhe
-- `messages.attachment_url` ruan lidhjen e plote publike. Nje foto ose nje ze i
-- derguar ne nje bisede private hapet nga kushdo qe e ka lidhjen, pergjithmone,
-- pa asnje sesion. Politika e leximit u ngushtua te palet e bisedes (migrimi
-- `mbyllja_e_rrugeve_anonime`) — kjo e mbylli LISTIMIN, pra rrugen praktike te
-- nxjerrjes — por lidhja e drejtperdrejte mbeti.
--
-- PSE NUK APLIKOHET SE BASHKU ME PJESEN TJETER:
-- prodhimi xhiron `main`, dhe klienti i `main`-it i lexon bashkengjitjet me
-- lidhje PUBLIKE. Po ta mbyllnim bucket-in tani, CDO bashkengjitje ekzistuese
-- do te kthente 404 per cdo perdorues — pikerisht demi qe duhet shmangur.
--
-- RENDI I DETYRUAR:
--   1. `lib/attachments.ts` + `app/messages/page.tsx` shkojne ne prodhim.
--      Ndersa bucket-i eshte ende publik, TE DYJA rruget punojne: klienti
--      provon te firmose dhe bie te lidhja e ruajtur nese s'ia del. Pa ndarje.
--   2. Verifikohet ne prodhim qe nje foto e vjeter dhe nje e re hapen te dyja.
--   3. VETEM ATEHERE ekzekutohet ky migrim.
--
-- KTHIMI MBRAPSHT eshte nje rresht: `update storage.buckets set public = true`.
-- Lidhjet e ruajtura mbeten te vlefshme gjate gjithe kohes — nuk prekim asnje
-- rresht te `messages`, sepse rruga brenda bucket-it nxirret nga vete lidhja.

begin;

update storage.buckets set public = false where id = 'message-attachments';

commit;

-- VERIFIKIMI PAS APLIKIMIT (pritet: 401/403 per lidhjen publike, 200 per te firmosuren):
--   curl -sI "<lidhja e vjeter publike>"            → duhet 400/401/404
--   krijo nje URL te firmosur si pale e bisedes     → duhet 200
--   krijo nje URL te firmosur si i treti            → duhet te mos leshohet fare

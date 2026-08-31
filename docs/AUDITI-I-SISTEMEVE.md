# AUDITI I SISTEMEVE — të vjetrat dhe blloku i ri

31 gusht 2026. Pyetja: **cilat sisteme punojnë vërtet, cilat janë të vdekura, dhe
ku ka dy zbatime për të njëjtën gjë.** Matur mbi 69 tabelat e bazës dhe mbi çdo
referencë në `app/` dhe `lib/`.

---

## 0. Gjendja bazë

**69 tabela, të gjitha me RLS të ndezur.** Pesë me zero politika
(`admin_action_throttle`, `embed_backfill_log`, `otp_codes`, `otp_email_throttle`,
`otp_send_throttle`) — mohim i plotë për klientët, e shkruajnë vetëm funksionet
me `service_role`. Kjo është postura e saktë, jo një mangësi.

---

## 1. Blloku i moderimit — i lidhur nga fillimi në fund

Ky është sistemi më i mirë i ndërtuar në platformë. Njëzet e dy trigera, të gjithë
aktivë, dhe zinxhiri mbyllet vetë:

    raport ─┐
            ├─→ moderation_queue ─→ vendim ─→ njoftim te pronari ─→ ankim ─→ panel
    takedown┘         │
                      └─ afati vendoset vetë (trg_queue_set_due)

**Matur, jo supozuar:**

| Kontrolli | Rezultati |
|---|---|
| Raste pa afat | **0** |
| Raste jashtë afatit | **0** |
| Raste të zgjidhura pa arsyetim të shkruar | **0** |
| Shpallje pa status moderimi | **0** |

Rregulli i §2.2 — asnjë vendim pa arsyetim — nuk është vetëm politikë: **mbahet
në praktikë**, sepse asnjë rast i zgjidhur nuk ka arsyetim bosh.

**Dy trigera që dukeshin dublim, nuk janë.** `trg_report_closes_queue` (AFTER
UPDATE OF status, FOR EACH ROW) mbyll rastin kur zgjidhet raporti i **fundit** i
hapur për një shpallje; `trg_report_mbyll_radhen` (AFTER DELETE OR UPDATE, FOR
EACH STATEMENT) pastron rastet **jetime**. Ngjarje të ndryshme, punë të ndryshme,
të dy me mbrojtje nga rekursioni. I lexova para se t'i quaja drift.

---

## 2. Tre sisteme me DY zbatime — një i gjallë, një i vdekur

Ky është modeli më i rëndësishëm i këtij auditi. Në secilin rast ekziston një model
i pasur në bazë, me politika të plota, dhe një zbatim më i thjeshtë që është ai
real. Skema të bën të besosh se veçoria ekziston; kodi tregon të kundërtën.

### 2.1 Bisedat

| | I gjallë | I vdekur |
|---|---|---|
| Ku | `messages`, grupuar në klient | tabela `conversations` |
| Prekje UI | 6 vende | **0** |

`messages.conversation_id` **nuk shkruhet kurrë** nga ndërfaqja. Pasoja nuk është
vetëm një tabelë bosh: `typing_indicators` dhe `message_reactions` janë të lidhura
me `conversation_id`, ndaj ato dy veçori **nuk mund të punojnë kurrë** — të dhënat
mbi të cilat mbështeten nuk krijohen. Kjo shpjegon pse të dyja kanë 0 rreshta.

### 2.2 Distinktivët

`badges` ka **10 rreshta të mbjellë** dhe `user_badges` politika të plota. Asnjëra
nuk lexohet: `buildBadges(profile)` i llogarit nga fushat e profilit
(`is_admin`, `is_verified`, `is_premium`, `shop_name`, `seller_rating`).

### 2.3 Referimet

`referrals` dhe `referral_rewards` janë të vdekura. Rruga e gjallë është
`profiles.referred_by`: kodi ruhet nga `?ref=` në një cookie 30-ditore, të dy
rrugët e regjistrimit e shkruajnë, dhe `/referral` numëron profilet që e kanë atë
kod. **E verifikova se punon** — kisha dyshuar për një defekt (njëra rrugë e quan
variablin `refCookieEmail`), por cookie-ja mban një **kod**, jo email. Emër i
gabuar, sjellje e saktë.

---

## 3. Veçori me tabela e politika, pa asnjë ndërfaqe

Këto nuk janë defekte — janë skela. Rreziku është se lexuesi i ardhshëm i skemës
beson se ekzistojnë, pikërisht gabimi që §0 i KUJTESËS paralajmëron.

| Tabela | Gjendja |
|---|---|
| `posts`, `post_comments`, `post_likes` | Sistem i plotë postimesh, 4 politika secila, **zero ndërfaqe** |
| `offers` | Ofertë mbi një shpallje — e përmendur vetëm te JSON-LD, jo si veçori |
| `orders` | Porositë — pa ndërfaqe |
| `disputes` | Mosmarrëveshjet — pa ndërfaqe |
| `listing_comments` | Komentet te shpallja — pa ndërfaqe |
| `push_tokens` | Njoftime push — pa ndërfaqe |
| `verification_requests` | Verifikimi i biznesit — pa rrugë krijimi dhe pa shqyrtim |
| `gamification_events`, `leaderboard_cache` | Shkruhen nga trigera, nuk lexohen |
| `trending_searches`, `search_history` | Nuk lexohen nga ndërfaqja |

**Vendimi i propozuar, jo i marrë:** ose ndërtohen, ose hiqen. Të lëna kështu,
secila është sipërfaqe e arritshme nga PostgREST pa asnjë përfitim.

---

## 4. Sistemet që punojnë — të verifikuara

| Sistemi | Gjendja |
|---|---|
| **Mesazhet** | Punon: lexim, shkrim, shënim si i lexuar, kohë reale. Politikat e sakta: vetëm dërguesi/marrësi ose admini |
| **Njoftimet** | Punon: 9 rreshta realë, trigerat e moderimit dhe të abonimit shkruajnë në to |
| **Referimet** | Punon nga fillimi në fund (§2.3) |
| **Të preferuarat, kërkimet e ruajtura** | Punojnë, me politika për pronarin |
| **Bllokimi, raportimi** | Punojnë. `reports` është **vetëm-shkrim** për raportuesin — zgjedhje e mirë, pengon peshkimin |
| **Pagesat** | Koherente: 0 abonime aktive-por-të-skaduara, 6 cron aktivë |
| **Faturimi** | 0 fatura që presin fiskalizim; nota krediti e lidhur me heqjen dorë |

---

## 5. Rregullim i bërë në këtë kalim

**Kapja e kodit të referimit u zhvendos në rrënjë.** `saveRefFromUrl()` thirrej
vetëm nga kryefaqja dhe faqja e shpalljes. Të dyja lidhjet që aplikacioni gjeneron
sot bien pikërisht aty — e verifikova, asgjë nuk humbte. Por mjaftonte që dikush
të ndante `/premium?ref=…` dhe kodi humbte në heshtje. Tani thirret një herë te
`AlpazarProvider`, pra çdo rrugë mbulohet.

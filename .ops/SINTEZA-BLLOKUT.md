# SINTEZA E BLLOKUT — një trup i vetëm, i parë në tërësi

> Përmbledhje e të gjitha auditeve, autopsive dhe analizave të 1 shtatorit 2026.
> Terminali (sy live + bazë + kod). Çdo pohim ka provë; çdo gjë e pamatur është shënuar.
> Gjetjet e plota me rreshta e komanda: `.ops/RESULTS.md`.

---

## 1. ÇFARË DO TË ISHTE BLLOKU

Sipas BP2 dhe imazheve të miratuara, blloku nuk ishte një grup vecorish — ishte
**një akt njësimi**: një kartë kudo, një identitet me dy subjekte (person/biznes),
një organogramë që i lidh faqet, një gjuhë vizuale e vetme.
Rregulli mbisundues: *ku kodi ndryshon nga imazhi → fiton imazhi*.

## 2. ÇFARË ËSHTË SOT — mekanizmi i vetëm

Në **shtatë** shtresa të matura veç e veç, del e njëjta gjurmë:

> **Çdo rafinim u shtua PRANË të vjetrës, jo NË VEND të saj.**
> E reja s'u bë e detyrueshme; e vjetra s'u hoq. Prandaj cila fiton varet nga faqja.

Kjo nuk është dështim i idesë — komponentet e reja janë të mirëndërtuara. Është
dështim i **fazës së fundit**: konsolidimi që heq të vjetrën nuk u bë kurrë.

---

## 3. HARTA E TRUPIT — shtatë shtresa

| # | Shtresa | E reja (punon) | E vjetra që mbijetoi | Pasoja |
|---|---|---|---|---|
| 1 | **Sisteme** | `offers`, `verification_requests`, `follows`, `business_followers` u lidhën me ndërfaqe | `isOnline`, `buildBadges`, komponenti `Badges`, 10 RPC admin, `conversations` | 10 tabela + 10 RPC të vdekura |
| 2 | **Nivele** | `TrustBadge.trustLevel` | `Badges.getLevel` + `referral.LEVELS` | tre fjalorë; i njëjti person "Tregtar" dhe "Fillestar" njëherësh |
| 3 | **Organogramë** | `<a href>` te `/biznese → /u` | `window.location.href` kudo tjetër; `next/link` i papërdorur | grafi i profileve i padukshëm për crawler; pa hapje në skedë të re |
| 4 | **Karta** | `ListingCard` + `LISTING_SELECT` | `.shop-mini` (kryefaqe), rreshtat e `/biznese`, select-i i `/favorites` | tri karta biznesi ku imazhi kërkon një |
| 5 | **Dizajn** | 32 tokena te `ui-refine.css` | 2057 hex, 45 blloqe `<style>` inline | adoptim ~1%; e kuqja në 4 variante; tokenat vetë të dyfishuar |
| 6 | **Gjendjet** | butoni 3-gjendjesh ✓, fshirja 3-shkallëshe ✓ | `is_active` i mbingarkuar; enum pa `paused` | shpalljet e fshira duken "të pauzuara" dhe ringjallen me një klik |
| 7 | **Modalitete** | ofertat ✓, verifikimi ✓, vlerësimet ✓ | ndjekja pa feed; mesazhet me `shop_name`; `posts` kurrë e ndërtuar | butoni "Ndiq" pa asnjë pasojë |

---

## 4. ÇFARË ËSHTË E PLOTË (dhe duhet mbrojtur)

- **Ndarja biznes ↔ llogari** — e zbatuar me kujdes: analitika e biznesit e
  përjashton referral-in shprehimisht; abonimi shfaqet si *trashëgim* i llogarisë;
  paneli i biznesit s'ka asnjë ekskluzivitet llogarie. Katër prova.
- **Ofertat, Verifikimi, Vlerësimet** — cikle të mbyllura veprim→ruajtje→pasojë.
- **Butoni Biznes me tri gjendje** dhe **shiriti "Vepro si"** te të dy panelet
  (i kushtëzuar me `myBiz`, sjellje e saktë).
- **`ListingCard`** — biznes-aware me `business_id`, jo `hasShop`; shfaq biznesin
  OSE autorin, kurrë të dy.
- **Fshirja 3-shkallëshe e biznesit** — shkallëzim i fortë me shtypje emri.
- **Privatësia e Trust Score** — u rregullua sot nga cloud-i; verifikuar në 3 hallka.

## 5. ÇFARË MUNGON PLOTËSISHT

1. **Feed-i i ndjekjes** — `get_feed` ekziston në bazë, i thirrur 0 herë. Pa të,
   "Ndiq" është shkrim pa pasojë.
2. **Filtri biznes/person te inbox-i** — BP2 e kërkon; 0 përputhje në kod.
3. **Postimet e biznesit** — `posts` me FK nga `businesses`, asnjë rresht kodi.
4. **Gjendja `paused`** — s'ekziston në enum; pauzimi improvizohet me `is_active`.
5. **Konsolidimi** — faza që heq të vjetrën dhe e bën të renë të detyrueshme.

## 6. ÇFARË ËSHTË E RREZIKSHME (jo vetëm e paplotë)

| Rreziku | Prova | Pesha |
|---|---|---|
| Shpallje të fshira ringjallen nga tabi "Të pauzuara" | `myListings` pa filtër statusi (`:119`) + filtri `status!=='sold'` (`:1080`) + butoni ♻️ (`:1117`); 5 shpallje `deleted` në bazë | fshirja s'është e pakthyeshme |
| Fshirja e biznesit s'lë gjurmë | `delete_own_business` pa `admin_log`/`audit_logs`; rruga e adminit e ka | pa provë në mosmarrëveshje (§2.6) |
| Tre funksione skadimi pa gjurmë | `expire_premium_run`, `_apply_business_dimming`, `renew_my_subscription` | ndryshime gjendjeje të paregjistruara |
| Dialogu premton më shumë se kodi | "vlerësimet fshihen" — `reviews` varet nga `listing_id`, mbijeton | ekran pëlqimi i pasaktë |
| `admin_log()` humbet në heshtje | gjurmë admin 24h = **0** vs audit = **46** | §1.4, i njohur dhe i pandrequr |
| NIPT + PIN | `nipt_mungon=true`, `pin_i_paziguar=true` | Ligji 10128 neni 7; §5 |

## 7. RRUGA E KONSOLIDIMIT (renditur nga pesha, jo nga vështirësia)

**Faza 0 — ligjore/gjurmë** (pa pamje, pa rrezik vizual)
NIPT + adresa · PIN-i i adminit · gjurmë te `audit_logs` për fshirjen e biznesit,
fshirjen e llogarisë dhe tre funksionet e skadimit.

**Faza 1 — dëme të drejtpërdrejta**
Filtri i tabit "Të pauzuara" të përjashtojë `deleted` · teksti i fshirjes të
përputhet me FK-të · fshirja e llogarisë në 3 shkallë (modeli i biznesit).

**Faza 2 — një burim për konceptet e dyfishuara**
Një fjalor niveli · një kartë biznesi · `next/link` ose një helper i vetëm
navigimi · `LISTING_SELECT` kudo.

**Faza 3 — dizajni**
`#c42b0f`/`#c42a0e` → token · hiq njërën skemë tokenash (`--az-*` vs `--action-*`) ·
zhvendos CSS-në inline drejt `ui-refine.css` sipas sipërfaqes.

**Faza 4 — modalitetet e paplota**
Feed-i i ndjekjes + njoftimet · filtri i inbox-it · `shop_name` → `business_id` ·
vendim për `posts`.

**Faza 5 — kodi i vdekur**
`isOnline`, `buildBadges`, komponenti `Badges`, 10 RPC admin, zinxhiri
`conversations`/`typing_indicators`/`message_reactions`.

Secila fazë: CI-green + verifikim vizual per-sipërfaqe (Rregulli 11). Asnjë
zëvendësim masiv verbër — pikërisht ajo e krijoi gjendjen e sotme.

---

## 8. KUFIJTË E KËSAJ SINTEZE

Matur me: Chrome **vetëm desktop 1536px**, `curl`, lexim i `origin/main`, dhe query
në bazë me rol të veshur në transaksion të kthyer mbrapsht.
**Jo** me telefon · **jo** me axe-core · **jo** me CLS · **jo** me sesion pronari.

Borxhi i verifikimit: telefoni real · axe-core · CLS · RLS e `offers` dhe
`business_followers` · provë shkrimi mbi 8 kolonat e falsifikueshme · pamja e
panelit të adminit · etiketat e analitikës (kërkojnë llogari me shpallje).

Gabimet e mia gjatë këtij auditi janë listuar te `[AUTOAUDIT]` — tetë hipoteza të
rrëzuara, katër prej tyre të publikuara para verifikimit, dhe tre raste ku
truncation-i i daljes sime më çoi në përfundim të gabuar.

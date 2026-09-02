# MEGAAUDITI I BLLOKUT TË IDENTITETIT — gjendja përfundimtare

> Kërkuar nga Martinel më 2 shtator 2026: *"auditoni gjithçka është, gjithçka u kërkua,
> gjithçka nuk u vendos, gjithçka u la në heshtje (sistemet e vjetra + të reja), çdo gjë mbi
> bllokun — me sy + kod."*
>
> Blloku = **kartë → shpallje → shitës → biznes → pronar**, në gjashtë kombinime
> entitet × pamje × shikues.

---

## A. Ç'U KËRKUA — dhe ku qëndron sot

| # | Kërkesa e pronarit | Gjendja |
|---|---|:--:|
| 1 | Kartat të kenë të njëjtat elemente | 🟡 pjesërisht |
| 2 | Profilet e brendshme/jashtme të harmonizuara | ✅ vulat · 🟡 rrugët |
| 3 | Komponentët e inventarit të vendosen KUDO | ✅ |
| 4 | Rruga te profili i jashtëm (vizitor-pronar) dhe anasjelltas | 🟡 ekziston, jo e njësuar |
| 5 | «Shitës aktiv» te profili i jashtëm | ✅ |
| 6 | Rrypi i statistikave i njëjtë kudo | ✅ |
| 7 | Rrypi me të kuqe të ndezur, stili avatar | ✅ |
| 8 | Butonat të dukshëm e të rregullt | 🔴 e hapur |
| 9 | Një pronar = një biznes | ✅ |
| 10 | «Shërbim» dhe «VIP» te filtrat | ✅ |

---

## B. Ç'ËSHTË — i matur sot

### B1 · Roja e unifikimit (matje mekanike, në çdo CI)
```
card_title_jashte_kartave .............. 0   (ishte 35)
fjalore_vulash_paralele ................ 0   (ishte 16)
projeksione_te_dyfishuara .............. 0
klasa_e_perbashket_e_mbishkruar_inline . 1   ← e hapur
imazh_qe_deshton_pa_vendmbajtes ........ 9   ← e hapur
radiuse_inline ........................ 396  ← e re (cloud e shtoi nga [O59])
```

### B2 · Fjalorët e vjetër — të shuar
`.schip .sch-*` = 0 · `.badge .b-*` = 0 · `.bdg` = 0 · `.bizp-stats` = 0 · `.shop-mini` = 0
*(`.stats-row` = 1, te `/referral`, me përkufizim të vetin — jashtë bllokut.)*

### B3 · Vulat live, i njëjti subjekt në tri sipërfaqe
`Administratori / Biznes`, matur në prodhim:

| Vula | `/u` | `/biznese` | `/listing` |
|---|:--:|:--:|:--:|
| ⭐ Premium | ✅ | ✅ | ✅ |
| 🏢 Biznes | ✅ | ✅ | ✅ |
| ⚡ Nivel | ✅ | ✅ | ✅ |
| ⚡ pikë | ✅ | ✅ | ✅ |
| 📦 Shitës aktiv | ✅ | ✅ | ✅ |

**Pesë vulat kryesore përputhen në të tria.** Kjo është gjëja që u kërkua dhe që sot qëndron.
*(«Anëtar i ri» ndryshon sepse `created_at` i biznesit ≠ i personit — subjekte të ndryshme,
jo mospërputhje.)*

---

## C. Ç'NUK U VENDOS — e hapur, e matur

| # | Gjetja | Matja | Burimi |
|---|---|---|---|
| 1 | **`⚡ 135 pikë` dy herë te `/listing`** | ×2 në DOM | `ListingPageClient.tsx:957-962` |
| 2 | **Sistemi i dizajnit i pashfrytëzuar** | 20 përdorime : 4 802 vlera me dorë | [O60] |
| 3 | **Katër të kuqe marke** | `#C42B0F` 169 · `#E63312` 165 · `#C42305` 73 · `#C42A0E` 57 | [O60] |
| 4 | **Token-at e dyfishuar** | dy blloqe `:root`, të njëjtat vlera, emra të ndryshëm | [O60] |
| 5 | **`.btn` tri përkufizime** | `admin` r10 · `auth/login` r12 · `billing` r10 | [O59] |
| 6 | **Butoni primar: 3 lartësi, 4 radiuse** | 41 · 42 · 44 px — **tri nën pragun 44** | [O59] |
| 7 | **Koka e faqes: tri trajtime** | 22/800 · 18/800 · 15/700 | [O59] |
| 8 | **39 madhësi fontesh, pa shkallë** | 921 `fontSize` inline | [O60] |
| 9 | **Kartat: roje asimetrike** | `views_count != null` kundër `followers_count > 0` | [O50] |
| 10 | **Karta e biznesit 52% boshe** | trup 98px, 47px të përdorur | [O51] |
| 11 | **9 `onError` pa vend-mbajtës** | 7 skedarë | [O44] |
| 12 | **Kontrast** | «Dërgo vlerësimin» 1.61 · «Gjuha» 1.21 | [O52] |
| 13 | **Rruga panel↔publik: katër forma** | shirit vs banderolë vs çip vs buton «Edito» | [O55] §4 |
| 14 | **Numri «Shpallje»** | `/u` = 0 · kudo tjetër = 2 | [O47] |
| 15 | **«Anëtar» / «Anëtar prej»** | dy etiketa, tri formate date | [O49] |

---

## D. Ç'U LA NË HESHTJE

### D1 · Sisteme të ndërtuara që s'i prek asnjë rresht kodi
```
posts               4 politika RLS · 0 rreshta · 0 referenca
conversations       3 politika      · 0 rreshta · 0 referenca
typing_indicators   4 politika      · 0 rreshta · 0 referenca
message_reactions   3 politika      · 0 rreshta · 0 referenca
```
**14 politika RLS të shkruara e të vendosura për tabela që kodi s'i prek fare.**
Dhe `conversation_id` **nuk shkruhet asnjëherë** → zinxhiri s'do punojë kurrë vetvetiu.

### D2 · Dhjetë RPC admin, zero thirrje
`admin_adjust_subscription · admin_cancel_subscription · admin_change_subscription ·
admin_fiscal_queue · admin_fiscal_retry · admin_attach_invoice_file ·
admin_send_invoices_bulk · admin_bulk_user_flag · admin_list_businesses · admin_list_reports`

### D3 · Tetë eksporte kodi të vdekura *(rikontrolluar sot: ende 1 referencë = vetëm përkufizimi)*
`isOnline · UserBadges · buildBadges · useOnlineUsers · revokeConsent · getStoredRef ·
supabaseAdmin · initAuthSync · supabaseErrorToMessage`

**`revokeConsent` ka peshë ligjore** — tërheqja e pëlqimit (GDPR) duhet po aq e lehtë sa dhënia.
E ndërtuar, kurrë e lidhur.

### D4 · Konfigurim që hesht
Shtatë variabla mungojnë te Vercel: `SUPABASE_SERVICE_ROLE_KEY` · `PAYMENT_WEBHOOK_SECRET`
(webhook-u i pagesave = 503 fail-closed) · `NOTIFY_WEBHOOK_SECRET` · `ADMIN_EMAIL` ·
`SLACK_WEBHOOK_URL` · `PERPLEXITY_API_KEY` · `GOOGLE_SITE_VERIFICATION`.

### D5 · Porta që s'mbyll
Çdo shtytje te `main` kthen `Bypassed rule violations — Required status check is expected`.
**CI raporton; nuk bllokon.** Roja është alarm tymi, jo bravë — dhe alarmi (Slack) s'ka çelës.

---

## E. Ç'U MBYLL — dhe si e dimë

| U mbyll | Prova |
|---|---|
| `.card-title` (shkaku rrënjësor) | roja: **35 → 0** |
| Pesë fjalorë vulash | roja: **16 → 9 → 0** |
| Rrypi i identitetit | një klasë `.alpz-stats`, e matur live: `#1A1A1A` · numri 5.1:1 · etiketa 6.7:1 |
| P0 Trust Score te `/biznese` | «Besueshmëria» **mungon** në DOM-in e vizitorit |
| `npm audit` | **0 cenueshmëri** (ishte 1 e rëndë) |
| `LISTING_SELECT` | 0 projeksione të dyfishuara + portë CI |
| `/api/health` gënjente për Sentry | i ndrequr |
| Biznes paralel | `UNIQUE(owner_id)` në bazë |
| Përditësimi i profilit (42501) | politika e rregulluar; provuar pozitiv + negativ |

**Të gjitha lëvizën vetëm kur diçka i numëronte.** Vulat ranë `16 → 9 → 0` sepse roja
dështonte në çdo hap. Kjo është e vetmja gjë që i mbajti të mbyllura.

---

## F. KUFIJTË E KËSAJ MATJEJE — çfarë NUK provova

1. **Prekja 44px** — `pointer: coarse = false` në iframe; rregulla e cloud-it është e saktë
   me ndërtim, por s'u provua në pajisje të vërtetë.
2. **Vizitori i kyçur si përdorues i TRETË** — kam pronarin dhe një vizitor, jo një të tretë.
3. **Sesioni i adminit** — rri te domeni me SSO; s'fut kredenciale, ndaj `/profile` i tij
   s'është parë nga unë (vetëm nga fotot e pronarit).
4. **CLS dhe gjeste reale prekjeje** — të pamatura.
5. **Përputhja me nënvargje gënjen** — «Admin» përputhi «Administratori Alpazar» një herë.
   Çdo rresht i mësipërm që mbështetet vetëm në tekst duhet parë me sy para se të veprohet.

---

## G. RENDI I MBETUR — nga rrënja lart

**1.** Bashko dy blloqet `:root` në një fjalor token-esh. *Pa këtë, çdo hap tjetër ndërtohet
mbi dy burime — dhe adoptimi mbetet 20.*
**2.** Shto shkallën tipografike (`--fs-*`); sot s'ekziston fare.
**3.** Zgjidh një të kuqe nga të katrat (464 vende, mekanike).
**4.** Një `.btn` i vetëm, `min-height:44px`, tri shkallë ([O42]).
**5.** Roja: `ngjyra_hex_inline` (bazë 1896). *`radiuse_inline` u shtua tashmë.*
**6.** Heq dyfishimin e pikëve te `/listing`.
**7.** Shiriti «Vepro si» te `/profile` dhe `/u` — një rrugë, jo katër.
**8.** Vendos ose fshi: 4 tabela · 10 RPC · 8 eksporte · `revokeConsent` (ligjore).

> **Mësimi i vetëm që i mban të gjitha:** asnjë nga këto nuk lëvizi kur u raportua.
> Lëvizën kur u **numëruan**. Hapi 5 nuk është administrativ — është ai që i mbyll të tjerët.

# INVENTARI I URDHRAVE — çdo urdhër i pronarit, gjendja e tij, dhe dëshmia

> Kërkuar 5 shtator 2026. Zbaton propozimin tim §9.3: **çdo rregull i planit duhet të citojë
> urdhrin që e justifikon; nëse nuk citon dot, është shpikje e imja.**
> Ky inventar shkon në drejtimin e kundërt: nis nga urdhri dhe kërkon zbatimin.

Gjendjet: **ZBATUAR** (me dëshmi) · **PJESËRISHT** (me numër) · **JO** · **SHKELUR** (u pranua e u thye)

---

## A · URDHRA STRUKTURORË (si duhet të punohet)

| # | Urdhri (fjalët e pronarit) | Gjendja | Dëshmia / mangësia |
|---|---|---|---|
| A1 | «kalo te kjo bisedë» — vazhdo punën nga transkripti | **ZBATUAR** | Puna u rimor; push-i i ndërprerë doli i suksesshëm |
| A2 | «rilidh në dy drejtime me code kanalin» | **ZBATUAR** | Terminal→cloud me mesazh; cloud→terminal me git. Cloud-i veproi brenda minutash |
| A3 | «kujdes çdo matje duhet bërë me precizion me mjete shkencore me sy live» | **SHKELUR 6 herë** | §1 i `AUTOPSIA-E-DESHTIMEVE.md`: verdikt mbi kod të pabashkuar, `66ch`, përjashtimet WCAG, 2 përzgjedhës, DOM në vend të pikselit |
| A4 | «nëse gjeni gabime të tjera shënoni në plan gjithçka» | **ZBATUAR** | Regjistri D-01…D-25 te `PLANI-OPTIK.md` §10 |
| A5 | «auditoni planin tuaj para se ta nisni code» | **ZBATUAR por i pamjaftueshëm** | Dy auditime (§9, §11). **Asnjëri s'kapi që doktrina ime kundërshtonte urdhrin B2** |
| A6 | «përsëriteni të gjithë punën sipas po atyre urdhrave strikt» | **ZBATUAR** | Plani v2: 42 rrugë, çdo element, rrugët nga app-router-i |
| A7 | «auditoni nëse ndryshimet janë live» | **ZBATUAR, me vonesë** | U zbulua hendeku degë→main→prodhim; por vetëm pasi raportova një verdikt të rremë |
| A8 | «prit urdhrat e code» | **ZBATUAR** | Roja → cron; çdo urdhër i marrë dhe i zbatuar |
| A9 | «rregullo kanalin me kode dhe memorien» | **ZBATUAR** | `kontroll-kanali.mjs` (1.8s) + cron 13-min; 3 shënime kujtese të reja |
| A10 | «përdorni code pasi keni siguruar gjithçka me sy dhe mbi baza shkencore» | **NË ZBATIM** | Ky inventar + xhirot live janë pikërisht ai hap |

---

## B · URDHRA PËR PRODUKTIN (çfarë duhet ndërtuar)

| # | Urdhri | Gjendja | Numri |
|---|---|---|---|
| B1 | «autopsi totale faqe për faqe (web dhe app), çdo faqe çdo buton çdo nënfaqe» | **PJESËRISHT** | Teksti: 42 rrugë × 3 gjerësi, 4 323 butona ✓. Hapësira: vetëm @1920 deri sot ✗ |
| B2 | «nëse tabelat s'zmadhohen dot, zmadhohet faqja bazë ndërsa tabelat dhe shkrimet zmadhohen proporcionalisht» | **PJESËRISHT** | Shkalla e lëngshme LIVE ✓; por doktrina ime e kundërshtoi për 10 orë (kolona `37em`) |
| B3 | «te planet zmadhimi ka qenë joproporcional — syri s'e kap dot» | **ZBATUAR** | Koni ±15°, masa 60–75, dy kolona kur duhet |
| B4 | «strukturore kartën e shpalljes në një kolonë» | **ZBATUAR** | `.info` dhe media me të njëjtin x @1000/1280/1920; 0 elemente anash |
| B5 | «100% e platformës në ekran» | **PJESËRISHT — 6 nga 19 faqe** | 3 të verifikuara, 3 të bashkuara-jo-live, **13 të paprekura** |
| B6 | «nëse s'mundet 100%, baza 100% + faqja mbivendoset proporcionalisht» | **ZBATUAR si model** | Ishulli em-bazë: masa 70–71 në 1280/1920/2560 |
| B7 | «vetëm guaskë, pa asnjë detaj — tavolinë e pastër» | **ZBATUAR** | Baza pa karta/katalog; e verifikuar me foto |
| B8 | «auditoni çdo faqe me këtë problem dhe jepja code» | **ZBATUAR @1920** | 35 rrugë; 19 dështojnë; ndarë A/B |
| B9 | «auditoni punën e code seriozisht / të muajit shtator» | **ZBATUAR** | T-052, T-054; njëri verdikt doli i gabuar dhe u korrigjua |
| B10 | «bëni punë voluminoze, mos u ndalni derisa çdo gjë të jetë inventarizuar live me sy» | **NË ZBATIM** | Ky dokument + xhirot @1280/@390/@2560 |

---

## C · RREGULLORJA (`PARIMET.md`) — gjendja e zbatimit

| Pika | Kërkesa | Gjendja |
|---|---|---|
| §1 | Mjetet më të mira, asnjë matës i vetëshkruar kur ka standard | **SHKELUR pjesërisht** — 4 instrumente të miat; Lighthouse, npm audit, DB↔kod të papërdorura |
| §2 | Asnjë pohim pa provë | **SHKELUR 6 herë** |
| §3 | Kontrata: urdhrat TË PLOTË, "të gjitha" = të gjitha | **SHKELUR** — mbulim i pjesshëm i pranuar si i plotë |
| §4 | Topografia: hartë e plotë, komponent për komponent | **E ndrequr për tekstin, ende e shkelur për hapësirën** |
| §5 | Proporcionaliteti: zgjidhja më e thjeshtë që mbulon plotësisht | **SHKELUR** — ndërtova doktrinë mbi një urdhër të thjeshtë |
| §6 | Ndarja e korsive | **E RESPEKTUAR** — s'kam prekur kod produkti, s'kam shtyrë pa vendim |
| §7 | Konteksti ligjor (Shqipëri primare, BE sekondare) | **AS I PREKUR** — dhe preka pikërisht faqet ligjore |

---

## D · URDHRA QË S'JANË EKZEKUTUAR ENDE — lista e shkurtër dhe e vërtetë

1. **B5 — "100% e platformës në ekran": 13 faqe të paprekura.**
2. **B1 — "web dhe app": hapësira e app-it (390) e matur vetëm në 6 nga 38 rrugë.**
3. **B1 — hapësira @1280 dhe @2560: kurrë e matur** (xhiroja @1280 po zhvillohet tani).
4. **§7 — konteksti ligjor: asnjë vendim i peshuar ndaj ligjit shqiptar/BE.**
5. **Kontrasti: 302 shkelje të pamatura që nga auditimi i parë.**
6. **`--fs-xl/2xl/3xl`: të përkufizuara 4 herë me px të ngurtë — kokat s'shkallëzohen.**
7. **110 kapës të ngurtë gjerësie** (81 CSS + 29 inline) — inventari i sotëm; asnjëherë të numëruar më parë.
8. **/admin: i pamatur në çdo dimension.**

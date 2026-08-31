# AUTOPSIA E AUTOPSIVE

Pesë kalime auditimi në një ditë. Ky dokument nuk përsërit gjetjet — ato janë te
`docs/MEGAAUTOPSIA-2026-08-31.md`. Këtu pyetja është tjetër, dhe më e vështirë:
**pse gjetjet dolën në atë radhë, dhe çfarë e bënte metodën time të verbër ndaj
tyre deri në atë çast?**

---

## 1. Radha e zbulimeve, dhe çfarë e shkaktoi secilën

| Kalimi | Çfarë nxori | Çfarë e bëri të mundur |
|---|---|---|
| 1 | Arsyetimi i moderimit, pëlqimi i cookie-ve, og:image | Leximi i kodit + kërkesa e pronarit |
| 2 | Google Fonts, 404-at e prishura, hidratimi, kontrasti | **Hapja e faqes në shfletues** dhe leximi i konsolës |
| 3 | NaN-et, `Invalid Date`, migrimi bosh, LCP/CLS | **Dyfishi lokal** → ekranet e autentikuara |
| 4 | E drejta 14-ditore, eksporti i mangët | **Krahasimi i dy shtresave** (RPC ↔ kod) |
| 5 | Politikat RLS të hapura, varësitë, telefoni | **Auditimi i asaj që kalimet e mëparshme e besuan** |

Vëreje formën: çdo kalim zbuloi një klasë të re **jo sepse u përpoqa më shumë,
por sepse mora një instrument të ri**. Përpjekja nuk e zëvendëson instrumentin.

---

## 2. Katër verbëritë sistematike — dhe rrënja e përbashkët

### 2.1 Besova mjetin zyrtar në vend të gjësë vetë
Këshilluesi i sigurisë i Supabase-it jep 0 ERROR. Katër kalime e lexova atë si
"RLS-ja është në rregull". Ai mat nëse RLS është **ndezur**; nuk e lexon kurrë
**kushtin**. Kur i lexova vetë të 19 politikat me `using (true)`, tri prej tyre
ekspozonin gjurmë sjelljeje — kush pa çfarë, kush i shkruan kujt.

### 2.2 Zgjodha dritaren që më leverdiste
Kalimet 1–4 e panë faqen vetëm në 1280–1440px, sepse ashtu e nis Playwright-i pa
argumente. Përdoruesi shqiptar është në telefon. Në 390px dolën 23–50 objektiva
prekjeje nën 44px — një standard që **vetë projekti** e ka vendosur te Vendimi 8.

### 2.3 Audituar atë që dukej; varësitë nuk duken
`npm audit` zgjat tre sekonda dhe nuk u ekzekutua kurrë në katër kalime. Jepte
10 cenueshmëri, një prej tyre kritike. Nuk e bëra sepse metoda ime ishte
"shiko ekranin", dhe një varësi nuk ka ekran.

### 2.4 Audituar shtresat, kurrë vijën midis tyre
Kalimet 1–3 audituan bazën *ose* kodin. E drejta 14-ditore dhe eksporti i plotë
i të dhënave jetonin **plotësisht të ndërtuara në bazë** dhe **plotësisht të
paprekura nga kodi**. Asnjë auditim i një shtrese të vetme nuk mund t'i shohë:
defekti nuk është brenda asnjërës, është në boshllëkun midis tyre.

### Rrënja e përbashkët
Të katërta janë i njëjti gabim: **besova një abstraksion në vend që të mas gjënë
vetë.** Këshilluesin në vend të politikës. Desktopin në vend të telefonit. Kodin
në vend të pikselit. Shtresën në vend të bashkimit.

---

## 3. Çfarë kapi metoda mirë

Të jem i drejtë edhe me atë që funksionoi, përndryshe mësimi del i shtrembër:

- **Çdo gjë që duket në një faqe të renderuar** u kap: `NaN`, `Invalid Date`,
  `−0`, kontrasti, kërcimi i pamjes, zhurma publike brenda panelit.
- **Çdo gjë që një mjet e nxjerr si numër** u kap: axe-core, Core Web Vitals,
  `npm audit`, `proacl`, `pg_policies`.
- **Krahasimi i dy burimeve** është instrumenti më i fuqishëm i ditës: 88 RPC
  kundrejt referencave në kod nxori dy të drejta ligjore të varrosura.

---

## 4. Ajo që ende NUK është audituar — deklaruar, jo fshehur

| Zona | Pse ka rëndësi | Pse s'u bë |
|---|---|---|
| ~~Asnjë veprim shkrimi nuk u provua~~ — **kryer pjesërisht 31 gusht:** forma e ankimit u plotësua dhe u dërgua vërtet; arsyeja e shkurtër u ndalua nga UI-ja me zero kërkesa, arsyeja e vlefshme dërgoi saktësisht një kërkesë me argumentet e duhura. Mbeten: krijim shpalljeje, dërgim mesazhi, ngarkim fotoje | Verifikimi me shikim nuk është verifikim me përdorim | Dyfishi shkruan tani, por jo për rrjedhat me skedarë |
| ~~Validimi i hyrjeve te `/api/*`~~ — **kryer 31 gusht:** nxori gjetjen më të rëndë të gjithë auditimit (rruga e privilegjuar me PIN të vetëm) | Injektim, IDOR | — |
| Sistemi i postimeve (`posts`) | Përmbajtje e përdoruesit | Nuk u prek fare |
| ~~Mesazhet, postimet, bllokimi, raportimet~~ — **kryer 31 gusht: i pastër.** Çdo politikë u lexua; `reports` është vetëm-shkrim për raportuesin | Siguria e përdoruesit | — |
| ~~Navigimi me tastierë~~ — **kryer 31 gusht:** pa kurthe, rend nga lart-poshtë, skip-link i parë. Rregulli global i fokusit u zgjerua te elementet amtare | Aksesueshmëri përtej ngjyrës | — |
| ~~Prompt-injection te Albi~~ — **kryer 31 gusht: i pastër.** Rruga e validon `role`, gjatësinë dhe numrin e mesazheve para se t'i dërgojë | Rrjedhje të dhënash përmes AI-së | — |
| Sjellja reale në prodhim | Gjithçka këtu është matur në një dyfish | Dalja te `*.supabase.co` është 403 |

---

## 5. Rregulli që del nga e gjitha

Një auditim nuk matet me kohën e shpenzuar, por me **numrin e instrumenteve të
ndryshëm** që janë vënë në punë. Prandaj lista e mëposhtme nuk është "hapa", është
**klasa instrumentesh** — dhe një auditim që nuk i ka prekur të gjitha nuk ka
mbaruar, sado i gjatë të ketë qenë:

1. Faqe e renderuar në shfletues — **desktop DHE telefon**
2. Konsola dhe rrjeti gjatë asaj hapjeje
3. Aksesueshmëri e automatizuar (axe-core)
4. Performancë nën ngadalësim (rrjet + CPU)
5. Auditim varësish (`npm audit`)
6. **Logjika** e politikave RLS — lexo kushtin, jo flamurin
7. **Vija midis shtresave** — çfarë ofron baza kundrejt asaj që thërret kodi
8. Provë shkrimi, jo vetëm leximi *(mbetet e pabërë)*

Dhe rregulli më i shkurtër, që i përmbledh të katër verbëritë:

> **Kur një mjet të thotë "në rregull", pyet çfarë matë saktësisht. Zakonisht mat
> diçka më të ngushtë nga ajo që po pyet ti.**

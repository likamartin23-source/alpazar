# ÇFARË PRET MIRATIMIN TËND

Radhitur sipas dëmit që shkakton nëse mbetet. Për secilën: çfarë është, çfarë
ndodh nëse nuk preket, dhe **saktësisht** çfarë duhet bërë.

Asnjë prej tyre nuk e bëj dot vetë — ose sepse kërkon një sekret që e di vetëm
ti, ose sepse është vendim tregtar/ligjor, ose sepse ndryshon diçka thelbësore.

---

## 1 · PIN-i i administrimit — URGJENTE

**Çfarë është.** Një PIN gjashtëvendësh që hap `/api/admin/action` dhe
`/api/admin/config`. Ato rrugë dërgojnë kërkesën te një funksion që xhiron me
`service_role`: kalon RLS-në, matricën e lejeve dhe trigerin e privilegjeve.
Verifikova pa e parë vlerën: 6 shifra, vetëm numra, dhe **përputhet me një model
të njohur të dobët**.

**Çfarë mund të bëhej me të.** Heqje shpalljesh, dhurim Premium, ndryshim statusi
abonimi, mbyllje takedown-esh, ndezje/fikje metodash pagese. Dhe përmes
`/api/admin/config` me `table: 'admin_settings'` — **rishkrim i çdo sekreti të
platformës**, përfshirë vetë PIN-in.

**Çfarë bëra unë.** Të dyja rrugët tani kërkojnë edhe një sesion të vërtetë
admini, jo vetëm PIN-in. Provuar: pa sesion → 401. Kjo e ul rrezikun shumë, por
**nuk e zëvendëson ndryshimin e PIN-it**: mbrojtja në thellësi do të thotë që
asnjë nga të dy faktorët nuk duhet të jetë i dobët.

**Çfarë duhet bërë.** Ndrysho vlerën e `admin_pin` te `admin_settings` në diçka
të rastësishme dhe të gjatë. Nuk ka nevojë ta mbash mend: paneli nuk e kërkon më
(`admin_pin_disabled = 'true'`).

**Pa prova shfrytëzimi.** `admin_action_throttle` ka 55 rreshta, por maksimumi i
përpjekjeve nga një IP është 1, dhe e fundit daton 18 gusht.

---

## 2 · Transkodimi i videove

**Çfarë është.** `getCloudinary()` kërkon dy çelësa; në bazë ka vetëm
`cloudinary_cloud_name`. Pra transkodimi është i fikur.

**Çfarë ndodh sot.** Kufiri i madhësisë bie në 50 MB ndërsa platforma premton
5 minuta video — një video 5-minutëshe nga telefoni e kalon pothuajse gjithmonë.
Dhe **videot HEVC refuzohen**: formati i parazgjedhur i iPhone-it dhe i shumë
Androidëve. Përdoruesit i kërkohet të ndryshojë kodekun e kamerës.

**Çfarë duhet bërë.** Shto `cloudinary_upload_preset` te `app_config` me emrin e
preset-it "unsigned" nga llogaria jote Cloudinary. Emrin e di vetëm ti; po ta
shpikja unë, ngarkimet do të dështonin.

---

## 3 · Pëlqimi i nenit 37/8 gjatë blerjes

**Gjendja.** E drejta 14-ditore tani punon te *Plani im*. Në bazë, pa pëlqim të
shprehur për nisje të menjëhershme, rimbursimi del **i plotë**.

**Vendimi.** Nëse gjatë blerjes kapet ai pëlqim, mbahet pjesa në raport me ditët
e shfrytëzuara. Kjo është e lejueshme nga ligji, por është zgjedhje tregtare:
ul rimbursimin e klientit. Unë nuk e bëra vetë.

**Nëse e do.** Teksti duhet i qartë në arkë dhe kutia **kurrë e parazgjedhur** —
një pëlqim i nënkuptuar nuk vlen, dhe e kthen kushtin në të padrejtë.

---

## 4 · Kontratat e transferimit të të dhënave (SCC/DPA)

**Çfarë është.** Këta marrës marrin të dhëna jashtë BE-së **pa asnjë instrument
transferimi** (nenet 26, 39–42, ligji 124/2024): Cloudinary, Resend, Groq,
Anthropic, Perplexity, dhe — më i rëndi — përkthimi i Google-it te
`app/api/ai/context.ts`, që dërgon **tekst të lirë të përdoruesit**.

**Lajm i mirë që s'ishte shkruar askund.** Ruajtja kryesore është **brenda BE-së**:
Supabase `eu-west-1` (Irlandë), Sentry Gjermani, Brevo Francë.

**Zgjidhjet, sipas kostos.** Për Google Translate: (a) hiqe thirrjen dhe mbaje
përkthimin brenda modelit që tashmë përdoret; (b) zëvendësoje me ofrues me SCC;
(c) mbaje dhe nënshkruaj SCC + informim te `/privatesia`. Për të tjerët:
nënshkrimi i DPA-së standarde të secilit.

---

## 5 · Kalimi te Next 16

**Çfarë është.** Tri cenueshmëri të mbetura (`next`, `postcss`, `sharp`) kërkojnë
kërcim versioni madhor. Shtatë të tjerat i zgjidha; kritikja u mbyll.

**Vlerësimi im.** Të tria janë **mjete ndërtimi** që përpunojnë CSS nga depoja,
jo hyrje përdoruesi. Rreziku praktik këtu është i ulët. Nuk e bëra sepse
ndryshon kushtet thelbësore dhe kërkon rindërtim e provë të plotë.

---

## 6 · Mbrojtja nga fjalëkalimet e komprometuara

Supabase → Auth → ndize kontrollin ndaj HaveIBeenPwned. Një çelës, pa kod.
Ndikimi është i moderuar sepse hyrja është kryesisht me OTP.

---

## 7 · DPO-ja

Neni 33/1/c — ka gjasa i detyrueshëm, sepse platforma përpunon në shkallë të
gjerë dhe mban të dhëna moderimi që mund të lidhen me vepra penale. Ose caktohet,
ose dokumentohet me shkrim arsyeja pse jo. Fusha rri `[PLOTËSO]` te regjistri.

---

## 8 · Kontakti i sigurisë

Faqja publike `/siguria` jep një **Gmail personal** si kontakt. Zëvendësoje me
një adresë të platformës. E njëjta gjë vlen për kontaktin e të dhënave te
regjistri.

---

## 9 · Butonat-ikonë në telefon

Kthimi, njoftimet dhe ndarja janë 32–34px; standardi që vetë projekti ka vendosur
(Vendimi 8) është 44px. Butonat e veprimit i rregullova; këta rrinë në shirita të
ngushtë dhe rritja e tyre kërkon sy mbi pajisje reale. Vendos ti nëse preken.

---

## 10 · NIPT-i

I përjashtuar shprehimisht nga urdhri yt. Mbetet i shënuar sepse footer-i publik
shkruan ende “NIPT/QKB: (në regjistrim)” — neni 7, ligji 10128.

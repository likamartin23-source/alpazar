# PROCEDURA E CENIMIT TË TË DHËNAVE — 72 ORË

**Baza:** nenet 29 dhe 30, Ligji Nr. 124/2024. Njoftimi te Komisioneri bëhet **pa
vonesë dhe jo më vonë se 72 orë** nga momenti kur kontrolluesi **merr dijeni**.
Kur cenimi sjell **rrezik të lartë**, njoftohet edhe **vetë subjekti i të dhënave**.

> Hartuar më 31 gusht 2026. Kjo procedurë nuk kërkon mjete të reja: mbështetet te
> sistemet që tashmë ekzistojnë — `health_events`, `audit_logs`, `admin_logs`,
> `/api/health` dhe paneli. Fushat **`[PLOTËSO]`** kërkojnë të dhëna të pronarit.

---

## 0. Kush vepron

| Rol | Kush | Detyra |
|---|---|---|
| Marrësi i sinjalit | Kushdo (admin, përdorues, ofrues, studiues) | Ta çojë menjëherë te pronari |
| Vendimmarrësi | Pronari / DPO **`[PLOTËSO]`** | Vlerëson, njofton, vendos masat |
| Ekzekutuesi teknik | Admini me `config.write` | Ndalon rrjedhjen, ruan provat |

**Ora zero** është momenti kur kontrolluesi merr dijeni për një ngjarje që **ka
gjasa** të jetë cenim — jo momenti kur konfirmohet. Në dyshim, ora nis.

---

## 1. Orët 0–1 — NDALO DHE RUAJ PROVËN

1. **Mos fshi asgjë.** `audit_logs` është i pandryshueshëm me qëllim; ruaj edhe
   logjet e Vercel dhe të Supabase-it përpara se të skadojnë.
2. **Ndalo rrjedhjen:**
   - kredencial i komprometuar → rrotullo çelësin (`admin_settings`) dhe përfundo sesionet;
   - defekt RLS → hiq të drejtën në bazë (jo në ndërfaqe) dhe verifiko me `proacl`/`pg_policies`;
   - në rast të rëndë → `app_config.maintenance_mode = 'true'`.
3. **Shëno orën e dijenisë** (datë + orë + kush e mori) — kjo orë provohet më vonë.

## 2. Orët 1–24 — VLERËSO

Përgjigju me shkrim gjashtë pyetjeve; përgjigjet janë vetë përmbajtja e njoftimit:

1. **Çfarë ndodhi** dhe si u zbulua?
2. **Cilat kategori** të dhënash u prekën? (shih `docs/REGJISTRI-I-PERPUNIMIT.md`)
3. **Sa subjekte** dhe sa regjistrime, përafërsisht?
4. **Cilat pasoja të mundshme** — mashtrim, identitet i vjedhur, dëm reputacioni?
5. **Çfarë u bë** dhe çfarë do të bëhet?
6. **Kush është pika e kontaktit?**

**Rrezik i lartë** — njoftohet edhe subjekti — kur preken: fjalëkalime ose token-a ·
përmbajtje mesazhesh private · të dhëna pagese ose faturimi · të dhëna moderimi që
lidhen me vepra penale · vendndodhje e saktë. **Përjashtim (neni 30/3):** nëse të
dhënat ishin të pakuptueshme për të tretët (p.sh. të fshehtëzuara) ose rreziku u
zhbë menjëherë, njoftimi individual mund të mos kërkohet — **arsyetoje me shkrim**.

## 3. Brenda 72 orëve — NJOFTO KOMISIONERIN

- Marrësi: **Komisioneri për të Drejtën e Informimit dhe Mbrojtjen e të Dhënave
  Personale** — www.idp.al **`[PLOTËSO: email/portali i njoftimit]`**
- Nëse jo të gjitha faktet dihen, **njofto gjithsesi brenda 72 orëve** dhe plotëso
  më pas (neni 29/4). **Vonesa nuk justifikohet me hetim të papërfunduar.**
- Nëse afati kalohet, njoftimi shoqërohet me **arsyet e vonesës**.

## 4. Njoftimi i subjekteve (kur ka rrezik të lartë)

Gjuhë e thjeshtë shqipe, pa zbukurim: çfarë ndodhi · cilat të dhëna · çfarë rreziku
konkret · çfarë të bëjë ai tani (ndrysho fjalëkalimin, kujdes nga mesazhet mashtruese)
· kush është kontakti. Kanali: njoftim brenda platformës **dhe** email.

> **Kufi i matur i infrastrukturës:** Brevo është në planin falas me **300 email/ditë**.
> Një njoftim masiv nuk del dot brenda një dite. Prandaj njoftimet ligjore duhet të
> kenë **radhë me përparësi** mbi ato të marketingut, ose duhet plan me kapacitet më të
> lartë. Kjo zgjidhet **para** se të ndodhë cenimi, jo gjatë tij.

## 5. Pas ngjarjes — REGJISTRO

Çdo cenim regjistrohet edhe kur **nuk** njoftohet (neni 29/5), me: faktet, efektet,
masat, dhe arsyen e mosnjoftimit nëse s'u njoftua. Ky regjistër i vetëm është prova
se kontrolluesi vepron sistematikisht.

Vendi i regjistrimit: `audit_logs` me `action='cenim_te_dhenash'` (`actor_id` e lejon
NULL, ndaj shkruhet edhe nga një proces pa përdorues — ndryshe nga `admin_log()`, që
humbet në heshtje kur `auth.uid()` është NULL).

---

## 6. Sinjalet që duhen parë çdo ditë

| Sinjal | Ku |
|---|---|
| Gabime aplikacioni | `health_events` · tabi "AI Health" te paneli |
| Shëndeti i bazës dhe i realtime | `/api/health` |
| Veprime administrative | `admin_logs` · tabi "Sot" |
| Gjurmë e pandryshueshme | `audit_logs` |
| Këshilla sigurie të bazës | Supabase → Advisors (kontrolluar 31 gusht 2026: 0 ERROR) |

## 7. Prova e procedurës

Një procedurë e paprovuar nuk është procedurë. Një herë në vit, bëhet një ushtrim
mbi një rast të supozuar (p.sh. "çelësi i Brevo-s doli publik") dhe matet vetëm një
gjë: **a doli njoftimi brenda 72 orëve?** Rezultati shkruhet këtu.

| Data e ushtrimit | Skenari | Koha deri te njoftimi | Mësimi |
|---|---|---|---|
| — | — | — | — |

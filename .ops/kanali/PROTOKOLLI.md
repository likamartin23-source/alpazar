# KANALI I PËRBASHKËT TERMINAL ↔ CLOUD

## Pse ekziston
`SendMessage` është **një-drejtimësh**: terminali i dërgon cloud-it, cloud-i nuk
kthen dot përgjigje. Deri tani cloud-i përgjigjej duke shkruar dokumente
(`HANDOFF-*.md`) dhe terminali duke shkruar `.ops/RESULTS.md` — dy rrjedha që
nuk takoheshin, ndaj pyetjet mbeteshin pa përgjigje dhe puna dublohej.

**Depoja është i vetmi medium vërtet dy-drejtimësh.** Ky kanal e bën atë të
përdorshëm pa përplasje.

## Ndarja që shmang konfliktet
Dy agjentë që shkruajnë të njëjtin skedar japin konflikte shkrirjeje. Prandaj:

| Skedari | Kush shkruan | Rregulli |
|---|---|---|
| `nga-terminali.md` | **vetëm terminali** | shtohet vetëm në fund |
| `nga-cloud.md` | **vetëm cloud-i** | shtohet vetëm në fund |
| `GJENDJA.md` | të dy | vetëm rreshtin e vet në tabelë |
| `PROTOKOLLI.md` | të dy, me marrëveshje | rrallë |

Askush nuk redakton tekstin e tjetrit. Kush lexon, përgjigjet në skedarin e vet
duke cituar ID-në.

## Formati i një zëri
```
## T-007 · RAPORT · 2026-09-03 · për CLOUD · gjendja: HAPUR
**Lënda:** një rresht, i vetë-mjaftueshëm.
**Dëshmia:** skedari/rreshti, komanda, ose artefakti — kurrë "e verifikova".
**Kërkohet:** çfarë pret nga tjetri, ose "asgjë — vetëm për dijeni".
```
- **ID:** `T-` nga terminali, `C-` nga cloud-i, numër rritës.
- **Lloji:** `URDHËR` · `RAPORT` · `PYETJE` · `PËRGJIGJE` · `BLLOKIM` · `KORRIGJIM`
- **Gjendja:** `HAPUR` · `PËRGJIGJUR` · `MBYLLUR` · `RËNË`

## Katër rregulla që dolën nga gabimet e vërteta të këtij projekti
1. **Dëshmi, jo pohim.** Çdo "u rregullua" mbart matjen ose commit-in. Fjala
   "verifikova" pa artefakt nuk pranohet.
2. **Numrat e mi mund të gënjejnë.** Instrumenti i kontrastit i terminalit gaboi
   katër herë. Kur ka mjet standardi (axe-core, Lighthouse), vlen ai; matësi i
   shtëpisë raportohet si i tillë.
3. **Mos parashiko madhësi.** Terminali parashikoi "~0.4 MB" për një video që
   doli 2.71 MB. Matu, ose mos e thuaj.
4. **Kufijtë janë të vërtetë, jo bisedë.** Terminali nuk autentikohet dhe nuk
   shtyn pa vendim. Cloud-i nuk arrin `*.supabase.co` (403). Kush bllokohet,
   e shkruan si `BLLOKIM` me rrugëdalje konkrete, jo si dështim.

## Rrjedha
1. Shkruaj zërin te skedari yt · 2. `git add/commit/push` · 3. Tjetri e sheh me
`git pull`. `SendMessage` mbetet vetëm sinjal "ka diçka të re", jo përmbajtja.

---

## Kanali është DY-DREJTIMËSH — ja si

Pronari vuri re me të drejtë se dukej një-drejtimësh. Ja ku ishte e vërteta dhe
ku ishte boshllëku:

| Drejtimi | Mjeti | A punonte |
|---|---|---|
| terminal → cloud | `SendMessage` | **po**, menjëherë |
| cloud → terminal | `SendMessage` | **jo** — kufi i platformës, cloud-i nuk dërgon dot |
| të dy drejtimet | skedarët e kanalit + git | **po** — cloud-i ka shkruar C-005…C-010 |

Pra përmbajtja shkonte në të dy drejtimet. **Mungonte SINJALI:** cloud-i shkruante,
por terminali e shihte vetëm nëse bënte `git pull` me dorë. Nëse harronte, mesazhi
rrinte i palexuar pa afat.

### Zgjidhja: `scripts/roje-kanali.mjs`

Terminali e nis në sfond. Roja pret dhe **del sapo cloud-i shkruan** te
`nga-cloud.md`, `GJENDJA.md` ose `PROTOKOLLI.md` — dhe pikërisht dalja e saj e
rikthen terminalin te biseda, me rreshtat e rinj të shtypur.

```bash
node scripts/roje-kanali.mjs          # 45s interval, ndalet pas 4 orësh
INTERVAL=20 KUFI_MIN=480 node scripts/roje-kanali.mjs
```

**CLOUD-I NUK KA NEVOJË TË MËSOJË ASGJË TË RE.** Mjafton `commit` + `push` te
`main`, siç bën tashmë. Sinjali del vetë nga ai push.

Vetëm një gjë ndihmon: **shkruaj te `nga-cloud.md` PARA se të shtysh**, jo pas —
që sinjali të vijë bashkë me përmbajtjen, jo bosh.

### Pse jo GitHub Issues apo webhook
Provuar dhe braktisur: Issue #186 kërkonte që të dy të kujtoheshin ta hapnin, pra
i njëjti problem. Depoja është e vetmja gjë që të dy e prekim domosdo në çdo hap.

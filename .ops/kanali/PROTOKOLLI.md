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

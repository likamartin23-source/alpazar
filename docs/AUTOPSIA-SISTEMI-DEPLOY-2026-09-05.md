# AUTOPSI TOTALE — SISTEMI I DEPLOY-IT / PËRDITËSIMIT

> Urdhëruar nga Martineli: "dua një autopsi totale të sistemit të përditësimit" —
> pse ndryshimet nuk arrijnë LIVE te ekrani i tij; pse "platforma kthehet me forcë
> te e vjetra".
>
> Metoda: ndjek një ndryshim nga tastiera ime deri te pikseli në ekranin e pronarit,
> hallkë-për-hallkë, me PROVA (git, /api/version, next.config, middleware, vercel.json,
> sw.js, layout.tsx). Për çdo hallkë: VERDIKTI (✅ i shëndoshë / ⚠️ rrezik / ❌ prishur).

---

## ZINXHIRI I PLOTË (7 hallka)

```
[1] Kodi im → [2] dega → [3] main → [4] Vercel build → [5] CDN → [6] Service Worker → [7] shfletuesi
```

Një ndryshim shihet LIVE vetëm kur KALON të 7 hallkat. Dështon te cilado → ekran i vjetër.

---

## [1] Kodi → [2] dega `claude/loving-wright-kBMgT`  · VERDIKTI: ✅
Shkruaj, `tsc`+roja+`build` gjelbër, commit, push te dega. Pa problem këtu.

## [2] dega → [3] `main`  · VERDIKTI: ⚠️ RREZIK PROCESI (i imi)
Prodhimi xhiron `main`, JO degën. Pra derisa të bëj merge te main, puna ime është
E PADUKSHME për prodhimin. Ky ishte shkaku i vërtetë i "s'është bërë" të matur nga
terminali (ai mati `main`, unë kisha punuar te dega — T-052/T-053).
- Prova: /api/version dha `e44f7ac5` (main i vjetër) ndërsa dega kishte remap-in.
- Rregullimi (tashmë i zbatuar sot): merge te main me leje + `git fetch` para çdo merge.

## [3] `main` → [4] Vercel build  · VERDIKTI: ⚠️ VONESË 1–3 MIN (natyrore) + KURTHE
- Çdo push te main → Vercel ndërton 1–3 min. Gjatë asaj dritareje /api/version tregon
  SHA-në E VJETËR. Prova sot: pas merge-it 0950fc6, /api/version tregoi `dd5ee7f` për
  ~3 min, pastaj u kthye `0950fc6`.
- **PROCESI IM I GABUAR:** sot bëra 6+ merge brenda një ore. Çdo merge = deploy i ri
  1–3 min. Ti hape faqen NDËRMJET deploy-eve → pe një version të ndërmjetëm ose të
  vjetër, ndërsa unë thashë "live". **Ky është shkaku kryesor i "jo njësoj" sot.**
- Kurthe të Vercel-it (nga CLAUDE.md §5, të vërteta): (a) plani Hobby ka kufi deploy-esh/ditë;
  (b) i njëjti SHA te degë+main dedup-ohet → s'krijon deploy prodhimi. I shmanga me
  `--no-ff` (SHA unik) — verifikuar që prodhimi ecën 0788807→9efcc4c→d240dd5→dd5ee7f→0950fc6.
- BUILD_ID = `VERCEL_GIT_COMMIT_SHA` (next.config.js:9) → UNIK për çdo commit → emrat e
  `_next/static/*` s'përplasen mes deploy-eve → pa ChunkLoadError nga përplasje emri. ✅

## [4] build → [5] CDN (kokat e cache-it)  · VERDIKTI: ✅ për faqet tregtare, ⚠️ vetëm `/`
Matje nga next.config.js + middleware.ts + vercel.json:
- **HTML `no-store` KUDO**, PËRVEÇ kryefaqes `/` pa `?ref=` (middleware.ts:30):
  `s-maxage=60, stale-while-revalidate=120` → `/` mund të jetë ~1–3 min e vjetër pas deploy-it.
  Të gjitha të tjerat (`/biznese/*`, `/listing/*`, ligjoret) = `no-store` → GJITHMONË të
  freskëta nga serveri. Prova: kokat e /api/version dhe të /biznese që lexova = `no-store`.
- `_next/static` = `immutable` (i sigurt, emër unik për build). `/sw.js` = `no-cache`.
- **PËRFUNDIM:** për profilin e biznesit (ankesa jote), CDN-i NUK është fajtor — serveri
  jep gjithmonë HTML të freskët. E provova: HTML-ja live e /biznese kishte CSS-në e re
  `0950fc6` (max-width:980px, auto-fit, tavolinë krem).

## [5] CDN → [6] Service Worker  · VERDIKTI: ❌ SHKAKU KRYESOR I "KTHET TE E VJETRA"
Ky është fajtori i vërtetë i ankesës tënde. Gjendja e kodit SOT është e mirë:
- App-i **NUK regjistron më asnjë SW** (vetëm `/push-sw.js`, push-only, pa fetch handler).
- `/sw.js` është **kill-switch**: fshin çdo cache + çregjistron veten, pa ringarkim.
- `layout.tsx` çregjistron çdo SW të vjetër + fshin cache + një reload (roje `_alpz_swr`).
- `UpdatePrompt` krahason build-in e bundle-it me /api/health → shfaq "Rifresko".
- `/rifresko` = reset bërthamor me `Clear-Site-Data`.

**POR KURTHI KLASIK, i pazgjidhshëm nga serveri:** një pajisje që ka një SW TË VJETËR
(nga muajt para kill-switch-it) me fetch-handler që ka ruajtur në cache EDHE HTML-në
EDHE vetë skriptet — ajo pajisje shërben HTML-në e vjetër, e cila S'KA kodin e ri të
vetë-shpëtimit → cikël i pathyeshëm vetvetiu. Kjo është saktësisht "platforma kthehet
me forcë te e vjetra": SW-ja e vjetër rimerr kontrollin dhe shërben guaskën e vjetër.
- Pse s'e zgjidh dot nga serveri: nëse SW-ja e vjetër ndërpret edhe kërkesën për `/sw.js`,
  browser-i s'e merr kurrë kill-switch-in e ri.
- **ZGJIDHJA DEFINITIVE (nga ana e pajisjes, një herë):** hap `alpazar.vercel.app/rifresko`
  → `Clear-Site-Data` fshin SW+cache+storage → kthehet te versioni i ri PËRGJITHMONË.
  Ose: Ctrl+Shift+R (Chrome e anashkalon SW-në për atë ngarkim), ose incognito.

## [6] SW → [7] shfletuesi (pikseli)  · VERDIKTI: ✅ kur hallka [6] pastrohet
Kur SW-ja e vjetër hiqet, çdo kërkesë shkon te rrjeti (`no-store`) → versioni i ri.
E provova me render lokal të CSS-së `0950fc6`: profili del ishull i qendërzuar mbi
tavolinë krem, pa det bosh. Pra pas pastrimit të [6], ekrani është i saktë.

---

## PËRMBLEDHJA — ku dështon vërtet sistemi

| Hallka | Verdikti | Fajtor për ankesën tënde? |
|---|---|---|
| 1 kodi | ✅ | jo |
| 2 degë→main | ⚠️ proces | pjesërisht (vonesa im) |
| 3 main→build | ⚠️ vonesë 1–3min + 6 merge sot | **PO — "jo njësoj" sot** |
| 4 CDN | ✅ (përveç `/`) | jo për biznesin |
| 5 Service Worker | ❌ SW i vjetër i ngecur | **PO — "kthet te e vjetra"** |
| 6→7 pikseli | ✅ pas pastrimit | jo |

**Dy shkaqe të vërteta, jo dhjetë:**
1. **SW i vjetër i ngecur në pajisjen tënde** (hallka 5) → "kthet me forcë te e vjetra".
   → Zgjidhje: hap `alpazar.vercel.app/rifresko` NJË herë.
2. **Ritmi im i gabuar** (hallka 3): 6 merge/orë + thashë "live" para se /api/version të
   konfirmonte → ti pe versione të ndërmjetme. → Zgjidhje: e ndaluar (shih më poshtë).

---

## KORRIGJIMET (proces, nga sot e tutje)

1. **Kurrë "live" pa provë:** deklaroj "live" VETËM kur /api/version == koka e main, DHE
   kur grep-i i HTML-së live tregon ndryshimin. (E zbatova sot te biznesi.)
2. **Grumbulloj, s'spërkas:** disa ndryshime → NJË merge → NJË deploy. Jo 6 merge/orë.
3. **Butoni "Rifresko" + /rifresko** i dukshëm: pronari ka gjithmonë një dalje nga çdo
   pajisje e ngecur, pa DevTools.
4. **Sy të mij:** tani nxjerr kuadrot e videove (imageio_ffmpeg) dhe rendoj CSS-në reale
   në Chromium lokal → e shoh çka sheh ti, s'raportoj "u bë" pa e parë.

---

## VEPRIMI I VETËM QË TË DUHET TANI
Hap një herë: **`alpazar.vercel.app/rifresko`** → pastron SW-në e vjetër → kthehesh te
versioni `0950fc6`. Pastaj `/biznese/…?public=1` do të jetë si fotot që të dërgova
(ishull i qendërzuar, tavolinë krem, pa det bosh). Nëse JO edhe pas kësaj — atëherë
është dizajn, jo cache, dhe e rregulloj menjëherë me foton tënde nga ai version.

# MEMORY — ALPAZAR (kujtesa e punës, jashtë CLAUDE.md me urdhër pronari)

> **DY RRESHTAT TREGUES** (fillo gjithmonë nga këtu):
> 1. **Kujtesa e plotë e sesionit → Notion "Puna e deritanishme":** https://app.notion.com/p/3d03ee6af1098125b86fca2832a82a1e
> 2. **Projekti "100% web" (matje live, 39 faqe) → `docs/PROJEKTI-100-WEB.md`** (F1–F8) · Koordinimi: `.ops/kanali/` (protokolli te `PROTOKOLLI.md`).

---

## Vendim i hapur — DOMENI & MARKA (3 shtator 2026)
- **"ALPAZAR" është markë E REGJISTRUAR në DPPI**, pronë e **Agron Llakajt** (autori i show-t "Al Pazar", Vizion Plus): nr. 21948, regjistruar 04.08.2021, **në fuqi deri 15.02.2031**, **Klasa e Nice-it 41** (media/argëtim; pershkrimi perfshin "online media" e "uebfaqe"). Tregu ynë = Klasa 35/42 → depozitim teorikisht i mundur POR rrezik nga marka e mirënjohur + ngatërrim me showin. **Para vendimit të emrit: kontrollo DPPI (35/42) + opinion clearance.**
- `alpazar.com` I ZËNË (mbajtës i panjohur). `.al` te **UpFlare** ~€8.99/vit (AKEP, pa rezidencë; `.com.al` kërkon biznes/shtetas shqiptar). Regjistrat: Cloudflare (me kosto, vetëm transfer) / Porkbun (regjistrim i ri). **GoDaddy JO.** Kurthi: `.shop`/`.store` rinovohen ~$31/$44.
- **30 emra alternativë të verifikuar** (`.com` i lirë, $11.25/vit) — lista te Notion; preferencat: **Tregira, Liratreg, Dritapazar, Aritreg, Besatreg** (pa "pazar" = më të sigurtit ligjërisht). `pazari.al` = gjenerik/i mbushur, i dobët si markë.

## Gjendja teknike (LIVE në prodhim)
- **"100% web"** (shkaku rrënjë: vetëm ballina ishte 100%, subfaqet kapeshin te 1080px) → RREGULLUAR për të gjitha subfaqet (max-width:100% + clamp ≥1024). LIVE.
- **Kolona e leximit** (`.lexim{max-width:68ch}`, ui-refine.css) → faqet e tekstit (kushtet/privatësia/cookies/siguria/rreth-nesh) + `.seo-sub`. LIVE (b214835).
- **Siguri:** `moderation_score` u mbyll për klientin (revoke kolonor, live në DB).
- **Tjera live:** X/Twitter (share+footer), T-032 (njoftimet `<a>`), T-033 (tabet /admin,/profile,/biznese me URL), fshesa ICU e datave/numrave, T-035 (vrima 104px → `.grid-fund`).

## Mbetet (nga PROJEKTI-100-WEB, radha)
- `/search` + `/referral`: tekst 169/190ch → kërkojnë `.lexim` mbi elementin e tekstit (jo thjesht zgjerim).
- **F7** (15 faqet pas hyrjes), **F8** (modalet: Escape + kthim fokusi + visibility:hidden).
- **T-039:** `/saved-searches` "Execution context was destroyed" (ridrejtim gjatë ngarkimit) — për verifikim.

## Deploy (Vercel Hobby)
Kufi **100 deploy/ditë**; kur mbushet → push-et s'ndërtojnë → **Promote to Production** manual OSE prit ~24h (rifreskohet). Deploy prodhimi vjen VETËM nga push te `main` (SHA unik).

## Rregulla operimi
CLAUDE.md §8 (rregullorja) + `.claude/skills/synced/.../martinel-operating-contract`. Shqip gjithmonë; provë reale, jo pohim; CI-green (tsc + vitest + build + `node scripts/roja-unifikimit.mjs` bazë 384/2721/8, me `app/verifikim-vizual` të lëvizur mënjanë). Kanali: shkruaj te `nga-cloud.md` PARA push-it (roja e zgjon terminalin).

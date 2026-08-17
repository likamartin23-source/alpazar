# Mjetet e Alpazar-it — inventar

Gjendja më 17 gusht 2026. Qëllimi: asnjë sesion i ri të mos e rinisë kërkimin
nga zeroja.

---

## 1. Skills në repo — 105

Të gjitha jetojnë te `.claude/skills/`, pra vlejnë në **çdo** sesion: Claude Code
lokal, Cowork, CI. Burimet dhe commit-et e sakta: **`.claude/skills/BURIMI.md`**.

| Burimi | Sa | Çfarë jep |
|---|---|---|
| `arnabbagxd/brand-building-skills` | 29 | brand, pozicionim, audiencë, Meta/Google ads, email, WhatsApp, UGC, ASO |
| `garrytan/gstack` | 23 | Claude si ekip inxhinierik: `/autoplan`, `/qa`, `/ship`, `/retro`, review CEO/eng/design/devex |
| `emilkowalski/skills` | ≈10 | animacion dhe polish (autori i Sonner dhe Vaul) |
| `yuvalcohenrappaport/claude-skill-ui-ux-pro-max` | 1 | 67 stile, 96 paleta, 57 çifte fontesh, 13 stack-e |
| `billhector/design-skills` | 2 | `design-extractor`, `design-auditor` |
| `alpex-ai/ui-extractor` | 1 | analizë regjistrimesh ekrani → spec |
| `maiconlara/design-system-extraction` | 1 | nxjerrje tokenash nga CSS i renderuar |
| `rebelytics/one-skill-to-rule-them-all` | 1 | meta-skill që përmirëson vetë skills-et |
| `Bomx/distribb-skill` | 2 | SEO — **kerkon `DISTRIBB_API_KEY`**, pa të rri inaktiv |

> `.claude/skills/` ishte dikur krëjt në `.gitignore`. Ndaj çdo skill ishte lokal
> dhe i përkohshëm — Cowork-u dhe çdo kontejner i ri nisnin pa to. Tani
> commit-ohen; jashtë mbeten vetëm ato që i instalon vetë mjedisi (`caveman*`).

### Si shtohen të tjera
Workflow-i `.github/workflows/install-skills.yml`, me një listë:
```
owner/repo
owner/repo|nendrejtoria|prefiks
```
Skanon çdo skedar për prompt-injection, `service_role`, emra sekretesh,
`curl | sh`, çelësa SSH — dhe **e ndal** instalimin nëse gjen. Nuk mbishkruan
kurrë një skill ekzistues. Rezultati kalon nga PR.

---

## 2. MCP — `.mcp.json`

| Serveri | Gjendja |
|---|---|
| playwright, firecrawl, context7 | ✅ gati |
| tavily, exa | ⚠️ duan `TAVILY_API_KEY` / `EXA_API_KEY` në mjedis |
| sequential-thinking | ✅ zyrtar, pa çelës |
| **omniroute** | ⚠️ lidhet vetëm nëse gateway-i xhiron lokalisht |

---

## 3. Çfarë kërkon **ty** (jo skills — programe që xhirojnë te ti)

### OmniRoute — `diegosouzapw/OmniRoute` (MIT)
Gateway falas për 339 ofrues AI. **Nuk është skill.** Duhet nisur lokalisht;
përndryshe hyrja te `.mcp.json` thjesht nuk lidhet dhe asgjë nuk prishet.

> **Para se ta nisësh:** çdo thirrje AI që kalon nga ai gateway është e dukshme
> për të. Alpazari mban PII, numra telefoni dhe rrjedhë OTP.

### Agent Reach — `Panniantong/Agent-Reach` (MIT, Python 3.10+)
CLI që i jep agjentit akses në Twitter/X, Reddit, YouTube, GitHub, LinkedIn,
Instagram, Bilibili, XiaoHongShu — pa çelësa API. **Nuk është skill**, është
veglë rreshti komandash që instalon scraper-a në makinën tënde.

### Instagram
Composio ka toolkit Instagram, por Graph API jep vetëm median e llogarisë
**tënde** Business/Creator — jo reel-et e krijuesve të tjerë. Lidhja **nuk** e
zgjidh leximin e reel-eve. Ajo që funksionoi ishte kërkimi web i Composio-s
(Exa) plus shfletuesi cloud, të dy aktivë pa autorizim.

---

## 4. Mbetur jashtë

| Çfarë | Pse |
|---|---|
| **STRIX** | asnjë burim publik i identifikueshem |
| `laith0003/ux-skill` ("Skill UI") | s'u gjet `SKILL.md` i vlefshëm |
| Anime.js, Motion.dev, Coconut UI, Backlit UI | librari npm, jo skills — hyjnë me `npm i` kur ndërtojmë UI |
| Manus AI, Dodo Payments, CodeBurn | shërbime të jashtme, pa lidhje me repon |
| `pm-claude-skills` (npm, "1099 skills") | botues i paverifikuar; 1099 skedarë instruksionesh në një repo prodhimi me PII — rrezik i papranueshem |

---

## 5. Auditimi i importit të madh (PR #58)

310 skedarë, ≈25 skripte, 8 autorë. Skanimi automatik: pastruar.
Kontroll shtesë mbi rrjetin: **një** skript i vetëm del jashtë —
`ui-extractor/scripts/figma-export.sh` → `api.figma.com`, me `FIGMA_ACCESS_TOKEN`
që e jep vetë përdoruesi. Hostet e tjerë në skripte (`stripe.com`, `example.com`,
`myapp.com`, `competitor.com`) janë shembuj dokumentacioni. Asnjë skript nuk
lexon sekretet tona.

Skanimi është i mirë, por nuk është garanci absolute.

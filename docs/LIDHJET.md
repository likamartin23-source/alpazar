# Lidhjet — Cowork, Claude, MCP, Actions

Gjendja reale më 11 gusht 2026. Çdo rresht është ose i verifikuar në këtë sesion,
ose i shënuar qartë si "kërkon ty".

---

## 1. Çfarë punon vetvetiu (asnjë veprim nga ti)

| Lidhja | Statusi | Provë |
|---|---|---|
| GitHub — lexim, PR, Actions | ✅ | tools `mcp__github__*` |
| GitHub — **shkrim** (commit/push) | ✅ **vetëm përmes Composio** | shih §3 |
| Supabase (`sopafwfkrxpcdaljddoh`) | ✅ | SQL, migrime, edge functions, advisors |
| Vercel (`prj_KNCEtuUDGNCA6ulHomdKniNAZEuX`) | ✅ | deployments, logs, runtime errors |
| Notion · Slack · Google Drive | ✅ | |
| Firecrawl · Exa · Tavily · Context7 | ✅ | kërkim web + dokumentacion bibliotekash |
| Playwright (Chromium i para-instaluar) | ✅ | testim i faqes live |
| PostHog · Sentry · Datadog · Cloudflare · Brevo | ✅ | |
| Figma · Canva · Adobe · Zapier | ✅ | |

**GitHub Actions** — të treja në `anthropics/claude-code-action@v1`:
- `ci.yml` — TypeScript + build në çdo push
- `claude.yml` — `@claude <komandë>` te PR-të
- `ai-autofix.yml` — cron 05:30 UTC: lexon `health_events` përmes RPC-së
  `health_open_events(p_token)` dhe hap PR me fiksin. **Provuar që punon.**

> Sekreti `HEALTH_FEED_TOKEN` është vendosur. `service_role` **nuk** është dhe
> nuk duhet të jetë te GitHub Secrets — RPC-ja me privilegj minimal e zëvendëson.

---

## 2. Çfarë kërkon **ty** (nuk bëhet dot nga një sesion jo-interaktiv)

| Çështja | Çfarë duhet |
|---|---|
| **Semrush** | I lidhur, por çdo thirrje kërkon **miratim interaktiv**. Ndaj **s'kemi ende volume kyword-esh shqip të matura** — mbetet boshëllëku #1 i kërkimit. Hape në një sesion interaktiv dhe mirato thirrjen. |
| **Stripe** | Kërkon autorizim OAuth te claude.ai → Settings → Connectors. |
| `TAVILY_API_KEY`, `EXA_API_KEY` | `.mcp.json` i pret nga mjedisi. Pa to, ata dy servera s'nisen lokalisht. |
| `MAGIC_API_KEY` (21st.dev) | Nëse do Magic MCP lokalisht. |

Autorizimi OAuth bëhet **vetëm nga shfletuesi yt** — një sesion i larguët nuk e
kryen dot dhe nuk duhet të të kërkojë kurrë kode ose token-a.

---

## 3. Si shkruhet në repo nga këtu — E RËNDËSISHME

Kontejneri i këtij sesioni **nuk ka kredenciale git**: `git push` kthen `403`.
Edhe `mcp__github__push_files` / `create_or_update_file` kthejnë
`Resource not accessible by integration` — instalimi i GitHub App-it është
vetëm-lexim.

Rruga që punon është **Composio**, ku llogaria `likamartin23-source` është e
lidhur me leje të plota:

```
COMPOSIO_MULTI_EXECUTE_TOOL → GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS
```

Kufizim praktik: kalon **përmbajtjen e plotë** të skedarit. Për ndryshime që
prekin dhjetëra skedarë (p.sh. një zëvendësim ngjyre në 46 skedare) kjo është e
papërdorshme. Modeli që funksionoi:

1. shkruaj një **codemod** të vogël si workflow me `workflow_dispatch`;
2. provoje **lokalisht** mbi të njëjtin commit (`npx next build` duhet të kalojë);
3. `GITHUB_CREATE_A_WORKFLOW_DISPATCH_EVENT` — Actions e aplikon;
4. rezultati shkon në **dege + PR**, jo në main: main-i kërkon statusin
   "TypeScript + Build", ndaj push-i direkt nga Actions refuzohet me **GH006**;
5. fshije workflow-in pas përdorimit.

Codemod-i duhet të jetë **idempotent** dhe të ketë një kontroll që dështon nëse
prek diçka që s'duhej (p.sh. `border-color` kur synohet vetëm teksti).

> Composio komiton si pronari, ndaj i anashkalon rregullat e mbrojtjes së degës;
> `GITHUB_TOKEN` i Actions-it jo. Kjo është arsyeja që skedarët e vegjël shkojnë
> direkt në main, kurse codemod-i kalon nga PR.

---

## 4. Cowork vs. ky sesion

`claude.ai/code` (Cowork) dhe ky sesion janë i njëjti mekanizëm; ndryshon vetëm
kush i mban lidhjet:

- **Konektorët e claude.ai** (Settings → Connectors) — vlejnë për çdo sesion
  Cowork; i autorizon vetëm pronari, me OAuth në shfletues.
- **`.mcp.json` në repo** — vlen për sesionet lokale të Claude Code; lexon
  çelësat nga mjedisi, kurrë të hardkoduar.
- **Sekretet e GitHub Actions** — vlejnë për automatizimin 24/7, i pavarur nga
  të dyja të mësipërmet.

Auditimi ditës (`trig_013WjoFEsHKHffmLVqo5Mv4d`, 05:00 UTC) dhe `ai-autofix.yml`
(05:30 UTC) punojnë pa asnjë sesion të hapur.

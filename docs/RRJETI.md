# Rrjeti i sesioneve të largëta — çfarë arrihet dhe çfarë jo

Matur më 18 gusht 2026 me `bash scripts/rrjeti.sh`. Xhiroje sërish kur diçka
"nuk lidhet" — kjo faqe vjetrohet, skripti jo.

---

## Çfarë ndodh në të vërtetë

Dalja HTTPS e një sesioni të largët kalon nga një proxy politikash. Kur hosti
nuk është në allowlist-in e mjedisit, gateway-i përgjigjet **403 në CONNECT**:

```
gateway answered 403 to CONNECT (policy denial or upstream failure)
```

Kjo **nuk** është mungesë çelësi, nuk është TLS, dhe **nuk rregullohet dot nga
kodi ose nga një skedar në repo**. Është një cilësim i llogarisë. Dokumentacioni
i proxy-së (`/root/.ccr/README.md`) e thotë shprehimisht: *"Do not retry or route
around it — report the blocked host."*

---

## Gjendja e matur

Mjedisi është në nivelin **Trusted** — vetëm lista e parazgjedhur: regjistrat e
paketave, GitHub, SDK-të e cloud-it. Asnjë nga hostet tanë nuk është aty.

| Hosti | Për çfarë | Gjendja |
|---|---|---|
| `sopafwfkrxpcdaljddoh.supabase.co` | **baza e prodhimit** | ❌ BLLOKUAR |
| `alpazar.vercel.app` | sajti ynë | ❌ BLLOKUAR |
| `*.ingest.de.sentry.io` | Sentry, gjatë build dhe runtime | ❌ BLLOKUAR |
| `api.cloudinary.com` | video dhe foto | ❌ BLLOKUAR |
| `api.brevo.com` | email | ❌ BLLOKUAR |
| `api.resend.com` | email | ❌ BLLOKUAR |
| `nominatim.openstreetmap.org` | gjeokodim | ❌ BLLOKUAR |
| `api.firecrawl.dev` | MCP firecrawl | ❌ BLLOKUAR |
| `api.github.com`, `raw.githubusercontent.com` | GitHub | ✅ punon |
| `registry.npmjs.org`, `pypi.org` | paketat | ✅ nuk kalojnë fare nga proxy-ja |

**Pasoja, e saktësuar.** Bllokohet **procesi i aplikacionit** — `next build`,
`next start`, një skript, një `curl`. Nuk bllokohet **agjenti**: konektori
Supabase i claude.ai kalon nga serverat e Anthropic-ut dhe e arrin bazën
normalisht. E provova: 238 migrime, PG 17.6, 16 kategori — ndërsa `curl` te i
njëjti host merr 403 nga i njëjti kontejner.

> Fillimisht këtu shkrova se "migrimet dhe kontrollet e të dhënave nuk kryhen dot
> këtu". **Kjo ishte gabim.** Kryhen — përmes konektorit. Ajo që nuk kryhet dot
> është kodi i aplikacionit që flet vetë me bazën.

> Kjo shpjegon edhe pse `/kategori/elektronike` ktheu 404 gjatë smoke testit të
> Next 15: `fetchCategoryBySlug` nuk e arriti dot Supabase-in dhe ra te
> `notFound()`. Ai test provoi **trajtimin e `params`**, jo rrugën e të dhënave.

---

## Rregullimi — dy minuta, vetëm nga shfletuesi yt

1. Hap **claude.ai → Code → Environments** dhe zgjidh mjedisin e këtij projekti.
2. Te **Network access**, kalo nga **Trusted** në **Custom**.
   (Katër nivelet janë: **None**, **Trusted**, **Full**, **Custom**.)
3. Te **Allowed domains**, ngjit listën më poshtë — një host për rresht.
4. **Shëno kutinë "Also include default list of common package managers"**.
   Pa të, humbet GitHub-i dhe npm-ja, dhe prishet gjithçka.

```
*.supabase.co
alpazar.vercel.app
*.vercel.app
*.ingest.de.sentry.io
api.cloudinary.com
res.cloudinary.com
api.brevo.com
api.resend.com
nominatim.openstreetmap.org
*.tile.openstreetmap.org
maps.googleapis.com
api.firecrawl.dev
*.frame.claudeusercontent.com
```

`*.` në krye kap çdo nëndomen. Portet nuk shkruhen — vetëm 443 mbështetet.

Hyn në fuqi në sesionin **tjetër**, jo në atë që është hapur.

### Nëse pas shtimit ende bllokohen

Ky është diagnostiku çelës: **GitHub-i vazhdon të punojë?**

- **Po** → lista e parazgjedhur është ende në fuqi. Pra ose niveli mbeti
  **Trusted** (domenet u shkuan por niveli nuk u ndërrua), ose është redaktuar
  një **mjedis tjetër** nga ai që përdor k� sesion.
- **Jo** → niveli është **Custom** por harroji kutia "Also include default list".

Për të dallur mjedisin: hap një **sesion të ri** (jo rihapje të këtij) dhe xhiro
`bash scripts/rrjeti.sh` aty. Një sesion i riu merr mjedisin aktual; një sesion
i rihapur mund të mbesë te lidhja e vjetër.

### Pse jo thjesht "Full"

**Full** i hap të gjitha domenet. Ky repo është publik dhe ka celësa te
`admin_settings`; një allowlist e ngushtë do të thotë që edhe një skill i
importuar që sillet keq nuk ka ku t'i dërgojë. Rregulli i CLAUDE.md — *mos e
zgjidh me kod atë që zgjidhet me konfigurim* — vlen edhe në anën tjetër: mos e
zgjidh me leje të gjerë atë që zgjidhet me një listë të saktë.

---

## Konektorët e claude.ai nuk kalojnë fare nga kjo listë

Zbulim që ndryshon zgjedhjen: trafiku i një **konektori MCP të claude.ai** kalon
nga serverat e Anthropic-ut, **jo** nga rrjeti i sesionit. Ndaj një konektor
punon pa e prekur fare allowlist-in — edhe kur `curl` te i njëjti host merr 403.

**Prova më e fortë:** `sopafwfkrxpcdaljddoh.supabase.co` është i bllokuar për
`curl`, por konektori Supabase lexon bazën pa problem nga i njëjti kontejner.

I njëjti shërbim mund të ekzistojë dy herë:

| | Server lokal te `.mcp.json` | Konektor i claude.ai |
|---|---|---|
| Si xhiron | `npx` brenda sesionit | te Anthropic |
| Rrjeti | i sesionit → **bllokohet** | i Anthropic → **punon** |
| Çelësi | e do nga mjedisi | tashmë i autentikuar |

Prandaj `exa`, `tavily` dhe `context7` **u hoqën nga `.mcp.json`** — por arsyeja
nuk është e njëjtë për të tretët, dhe këtë e pata thënë me nxitim:

| | Konektori i claude.ai |
|---|---|
| **Exa** | i lidhur ✅ |
| **Context7** | i lidhur ✅ |
| **Tavily** | **i palidhur** — pret autorizim nga shfletuesi yt |

Për Exa dhe Context7 heqja është fitim i pastër. Për **Tavily** nuk ka konektor
zëvendësues: pas heqjes nuk mbetet asnë Tavily. Praktikisht nuk humbi gjë,
sepse kopja lokale s'kishte `TAVILY_API_KEY` dhe s'punonte as ajo — por nëse e
do Tavily-n, **autorizoje konektorin**, mos e kthe serverin lokal.

`firecrawl` mbetet te `.mcp.json` — nuk ka konektor përkatës dhe punon pa çelës
te makina jote.

---

## Çfarë mbetet e pamundur edhe pas allowlist-it

Proxy-ja nuk i mbështet fare: gRPC / HTTP/2-only, WebSocket upgrade, mTLS nga
klienti, klientë me certifikatë të fiksuar, HTTPS në porte jo-443, dhe baza të
dhënash mbi TCP të papërpunuar. Lidhja e drejtpërdrejtë me Postgres-in e
Supabase-it (porti 5432/6543) bie në kategorinë e fundit — nga një sesion i
largët puna me bazën bëhet përmes API-t HTTPS ose përmes MCP-së së Supabase-it.

import { createClient } from '@supabase/supabase-js'

const LANG_NAMES: Record<string, string> = {
  sq:'shqip', en:'English', it:'italiano', de:'Deutsch', fr:'français', es:'español', el:'Ελληνικά', tr:'Türkçe',
  sr:'српски', hr:'hrvatski', bs:'bosanski', mk:'македонски', bg:'български', ro:'română', sl:'slovenščina',
  pl:'polski', cs:'čeština', sk:'slovenčina', hu:'magyar', nl:'Nederlands', pt:'português', uk:'українська', ru:'русский',
  sv:'svenska', da:'dansk', fi:'suomi', no:'norsk', et:'eesti', lv:'latviešu', lt:'lietuvių',
}

// Perkthim pa celes per lokalizimin e pergjigjeve FAQ (kur LLM bie).
async function gtranslate(text: string, target: string): Promise<string> {
  if (target === 'sq' || !text) return text
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=sq&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(8000) })
    if (!res.ok) return text
    const data = await res.json()
    if (!Array.isArray(data) || !Array.isArray(data[0])) return text
    const out = data[0].map((seg: any) => (Array.isArray(seg) ? seg[0] : '')).join('')
    return (typeof out === 'string' && out.trim().length > 0) ? out : text
  } catch { return text }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sopafwfkrxpcdaljddoh.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

/* ── FAQ fallback (punon pa API key) ─────────────────────────────── */
const FAQ: Array<{ keys: string[]; answer: string }> = [
  {
    keys: ['shes', 'shpallje', 'posto', 'hap', 'krijo shpallje', 'si të shes'],
    answer: 'Për të shitur në Alpazar: kliko butonin **"+ Shpallje e Re"** në krye, plotëso titullin, çmimin dhe foto, pastaj publiko. Shpallja del menjëherë! 🛍️',
  },
  {
    keys: ['ble', 'blej', 'si të blej', 'si blihet'],
    answer: 'Për të blerë: gjej shpalljen që dëshiron, kliko **"Kontakto Shitësin"** dhe bisedo direkt me të. Pagesa bëhet mes palëve. ✅',
  },
  {
    keys: ['çmim', 'sa kushton', 'kosto', 'tarif'],
    answer: 'Alpazar është **falas** për shpallje bazë! Kemi edhe 3 plane **Premium** (Basic, Pro, Business) me çmime mujore ose vjetore — shihi te faqja **/billing**. 💛',
  },
  {
    keys: ['premium', 'gold', 'vip'],
    answer: 'Planet **Premium** (Basic, Pro, Business): më shumë shpallje aktive, boost kredite dhe prioritet në kërkim. Çmimet mujore e vjetore i sheh LIVE te **/billing**. 👑',
  },
  {
    keys: ['mesazh', 'kontakt', 'shkruaj', 'komunikoj'],
    answer: 'Kliko **"Kontakto Shitësin"** në çdo shpallje dhe nis bisedën direkt. Mesazhet janë realtime dhe private. 💬',
  },
  {
    keys: ['kategori', 'lloj', 'çfarë shitet'],
    answer: 'Alpazar ka 13 kategori: **Elektronikë, Makina, Shtëpi, Veshje, Kafshë, Sport, Pune, Shërbime, Fëmijë, Bukuri, Libra, Ushqim, Tjera**. 📦',
  },
  {
    keys: ['qytet', 'tiranë', 'durrës', 'vlorë', 'shkodër', 'elbasan', 'ku'],
    answer: 'Alpazar mbulon **20 qytete** shqiptare: Tiranë, Durrës, Vlorë, Shkodër, Elbasan, Korçë, Fier, Berat, Lushnjë dhe shumë të tjera. 📍',
  },
  {
    keys: ['sigur', 'mashtrim', 'besoj', 'trust', 'rrezikim'],
    answer: 'Alpazar ka sistem **Trust Score** për çdo shitës (0-100). Shiko badge-in: 🟠 Fillestar, 🔵 I Besueshëm, 🟢 I Verifikuar, 🟣 Ekspert. Gjithmonë takohuni në vend publik! 🛡️',
  },
  {
    keys: ['review', 'vlerësim', 'koment', 'yje'],
    answer: 'Pas bisedës me shitësin, mund të lësh **vlerësim me yje** (1-5) dhe koment. Vlerësimet e verifikuara kanë badge special ✅',
  },
  {
    keys: ['llogari', 'profil', 'regjistrim', 'kyçem', 'hyrje', 'login'],
    answer: 'Regjistrohu me **numër telefoni** (OTP SMS) ose email (magic link). Shko te "Hyr" në krye të faqes dhe ndiq hapat. 📱',
  },
  {
    keys: ['fshij', 'modifikoj', 'ndrysho', 'edito shpallje'],
    answer: 'Shko te **Profili → Shpalljet e Mia**, kliko shpalljen dhe zgjidh "Edito" ose "Fshij". 🖊️',
  },
  {
    keys: ['favorit', 'ruaj', 'bookmark', 'ruajtur'],
    answer: 'Kliko ikonën **❤️** në çdo shpallje për ta ruajtur. I gjen te Profili → tab **"Të ruajtura"**. 💝',
  },
  {
    keys: ['foto', 'imazh', 'foto ngarko', 'upload'],
    answer: 'Mund të ngarkosh deri **10 foto** per shpallje. Format: JPG/PNG/WEBP, max 10MB secila. Tërhiq & lësho për rend. 📷',
  },
  {
    keys: ['njoftim', 'notifikacion', 'push'],
    answer: 'Aktivizo **njoftimet push** nga profili yt për të marrë mesazhe dhe updates menjëherë edhe kur app-i është mbyllur. 🔔',
  },
  {
    keys: ['problem', 'ndihmë', 'nuk funksionon', 'gabim', 'error', 'support'],
    answer: 'Për çdo problem: kontakto **support@alpazar.al** ose raporto shpalljen me butonin "Raporto" në fund të faqes. 🆘',
  },
]

function localFallback(userMessage: string): string {
  const msg = userMessage.toLowerCase()
  for (const faq of FAQ) {
    if (faq.keys.some(k => msg.includes(k))) return faq.answer
  }
  return 'Përshëndetje! Unë jam **Albi 🤖**, asistenti i Alpazar. Mund të të ndihmoj me shpallje, çmime, kategori dhe sigurinë e blerjeve. Çfarë dëshiron të dish? 😊'
}

async function getLiveContext(query: string): Promise<string> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const [catRes, countRes, usersRes, payRes, listingsRes, planRes] = await Promise.all([
      sb.from('categories').select('name').order('name'),
      sb.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('payment_methods').select('name,type').eq('is_active', true).order('sort_order'),
      sb.from('premium_plans').select('name,price_eur,price_eur_year,duration_days,max_listings,boost_credits').eq('is_active', true).order('sort_order'),
      sb.from('listings')
        .select('title,price,currency,city,category')
        .eq('is_active', true)
        .ilike('title', `%${query.slice(0, 50).replace(/[%_\\]/g, '\\$&')}%`)
        .limit(5),
    ])

    const categories = (catRes.data || []).map((c: any) => c.name).join(', ')
    const totalActive = countRes.count ?? 0
    const totalUsers = usersRes.count ?? 0
    const payMethods = (payRes.data || []).map((p: any) => p.name).join(', ')
    const found = listingsRes.data || []

    let ctx = `Konteksti LIVE i platformës (${new Date().toLocaleDateString('sq-AL')}):\n`
    ctx += `- Shpallje aktive: ${totalActive}\n`
    if (totalUsers) ctx += `- Përdorues të regjistruar: ${totalUsers}\n`
    if (categories) ctx += `- Kategoritë: ${categories}\n`
    if (payMethods) ctx += `- Mënyra pagese aktive: ${payMethods}\n`
    const plansTxt = (planRes.data || []).map((p: any) => `${p.name}: ${p.price_eur}€/muaj ose ${p.price_eur_year}€/vit (${p.max_listings === -1 ? 'shpallje pa limit' : p.max_listings + ' shpallje'}, ${p.boost_credits} boost)`).join('; ')
    if (plansTxt) ctx += `- Planet Premium LIVE: ${plansTxt}\n`
    if (found.length > 0) {
      ctx += `- Shpallje relevante për pyetjen:\n`
      found.forEach((l: any) => {
        ctx += `  • ${l.title} — ${l.price} ${l.currency || 'ALL'} (${l.city || 'Pa qytet'})\n`
      })
    }
    return ctx
  } catch {
    return ''
  }
}

function buildSystemPrompt(liveCtx: string, lang: string): string {
  const langName = LANG_NAMES[lang] ?? 'shqip'
  const langRule = lang === 'sq'
    ? 'Flet GJITHMONË shqip.'
    : `RREGULL ABSOLUT: Përgjigju EKSKLUZIVISHT në gjuhën ${langName} (kod "${lang}"). NDALOHET të shkruash shqip — çdo fjali, titull dhe fjalë duhet të jetë në ${langName}. Ruaj vetëm emrat e përveçëm (ALPAZAR, emra qytetesh) dhe çmimet.`
  return `Ti je **Albi 🤖** — asistenti virtual zyrtar i ALPAZAR, platforma shqiptare e tregtisë online, themeluar **2026**.

## Identiteti yt
Je ngrohtë, profesional dhe empatik. ${langRule} Je krenar që ndihmon komunitetin shqiptar të blejë e shesë me lehtësi dhe siguri.

## Çfarë është ALPAZAR
Treg online + rrjet social për shqiptarët: blej, shit dhe ndiq shitës. **Pa komision** mbi shitjet dhe **pa reklama**. Shpalljet bazë janë falas.

## Si të shesësh
Kliko **"+ Shto Shpallje"** (ose "+ Shpallje e Re") në krye → plotëso titullin, përshkrimin, çmimin, kategorinë, qytetin dhe deri **10 foto** → publiko. Shpallja del menjëherë. Këshillë: foto të qarta + çmim realist = shitje më e shpejtë.

## Si të blesh
Gjej shpalljen → **"Kontakto Shitësin"** → bisedo direkt me mesazhe realtime. **Pagesa bëhet mes palëve** (Alpazar nuk ndërhyn në pagesë). Gjithmonë **takohu në vend publik** dhe kontrollo produktin para se të paguash.

## Premium
Planet **Premium** (te /billing): Basic, Pro dhe Business — mujore ose vjetore. Çmimet dhe limitet e sakta i ke te konteksti LIVE më poshtë; përdor GJITHMONË ato, jo vlera të tjera. Mund të fitohet falas me referral. Pagesa konfirmohet nga admini.

## Siguria
- **Trust Score** (0–100) për çdo shitës: 🟠 Fillestar, 🔵 I Besueshëm, 🟢 I Verifikuar, 🟣 Ekspert.
- Raporto shpallje/përdorues të dyshimtë me butonin **"Raporto"**.
- Mosha minimale **16+**. Takohu në vend publik, mos dërgo para paraprakisht.

## Kujdesi ndaj klientit (ji empatik — dëgjo, trego mirëkuptim, jep zgjidhje)
- Email mbështetjeje: **support@alpazar.al**
- Të dhënat e mia / GDPR: **/te-dhenat-mia** (shkarko ose fshi të dhënat)
- Hiq përmbajtje: **/takedown** · Kushtet: **/kushtet** · Privatësia: **/privatesia**
- Nëse përdoruesi është i mërzitur, fillo me ndjesë dhe mirëkuptim, pastaj jep hapat konkretë.

## Rregulla absolute
- Jep përgjigje të sakta e praktike — aq të gjata sa duhet (mos i shkurto artificialisht).
- Mos shpik fakte. Nëse s'di ose s'je i sigurt, thuaj "Kontakto support@alpazar.al".
- Përdor të dhënat LIVE më poshtë kur pyesin për çmime, numra, kategori ose mënyra pagese.
- Diskuto vetëm tema të ALPAZAR / tregtisë / konsumatorizmit. **Mos jep këshilla ligjore ose financiare të personalizuara** — drejto te profesionistët ose te support.

${liveCtx}
${lang === 'sq' ? '' : `\n\n=== KUJTESE E FUNDIT (E DETYRUESHME) ===\nE GJITHE pergjigjja jote duhet te jete 100% ne gjuhen ${langName}. Mos perdor shqipen. Perktheje cdo pjese ne ${langName} para se ta dergosh.`}`
}


export { LANG_NAMES, gtranslate, localFallback, getLiveContext, buildSystemPrompt }

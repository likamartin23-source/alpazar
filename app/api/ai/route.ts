import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'nodejs'
export const maxDuration = 30

const SYSTEM_PROMPT = `Ti je **Albi 🤖** — asistenti virtual i ALPAZAR, platforma #1 shqiptare e tregtisë online.

**Aftësitë tua:**
- Gjetja e produkteve dhe sugjerimi i kategorive relevante
- Informacione mbi çmimet reale të tregut shqiptar (ALL/EUR)
- Udhëzime për shitje dhe blerje të sigurta
- Ndihmë me funksionet e platformës (Premium, Reviews, Trust Score, etj.)
- Kategoritë: Elektronikë, Makina, Shtëpi & Kopsht, Veshje & Aksesore, Kafshë, Sport & Hobi, Punë & Shërbime, Fëmijë, Bukuri & Shëndet, Libra & Koleksione, Ushqim & Bujqësi, Tjera

**Rregulla absolute:**
- Fol GJITHMONË shqip, me ton miqësor dhe profesional
- Jep përgjigje të sakta, praktike dhe të shkurtra (3-6 fjali)
- Kur pyesin çmime, jep range realistike sipas tregut shqiptar
- Kur pyesin produkt specifik, sugjero kategori + këshilla për blerje të sigurtë
- Mos diskuto tema jashtë ALPAZAR/tregtisë/konsumatorizmit
- Përdor emoji me moderim për të bërë bisedën më miqësore
- Formatimi me **bold** për terma të rëndësishëm`

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
    answer: 'Alpazar është **falas** për shpallje bazë! Ofrojmë edhe plan **Premium Gold** me 50 shpallje dhe badge të veçantë. 💛',
  },
  {
    keys: ['premium', 'gold', 'vip'],
    answer: 'Plani **Premium Gold** të jep: badge Gold, deri 50 shpallje aktive, prioritet në kërkim dhe statistika të shpalljeve. Shko te Profili → Premium. 👑',
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
    answer: 'Regjistrohu me **numër telefoni** (OTP SMS) ose email. Shko te "Hyr" në krye të faqes dhe ndiq hapat. 📱',
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
    keys: ['google maps', 'harta', 'vendndodhje', 'lokacion'],
    answer: 'Mund të shtosh **vendndodhjen në hartë** kur krijon shpalljen — blerësi sheh vendndodhjen tuaj (pa adresë ekzakte). 🗺️',
  },
  {
    keys: ['njoftim', 'notifikacion', 'push'],
    answer: 'Aktivizo **njoftimet push** nga profili yt për të marrë mesazhe dhe updates menjëherë edhe kur app-i është mbyllur. 🔔',
  },
  {
    keys: ['referral', 'ftesë', 'kod referimi', 'bonus'],
    answer: 'Fto miqtë me **kodin tënd të referimit** (Profili → Referime) dhe merr pikë bonus për çdo regjistrim! 🎁',
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

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`ai:${ip}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Shumë kërkesa. Provo sërisht pas pak sekondash.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Kërkesë e pavlefshme.' }, { status: 400 }) }

  const { messages } = body
  if (!messages || !Array.isArray(messages) || messages.length === 0)
    return NextResponse.json({ error: 'Mesazhe të pavlefshme' }, { status: 400 })
  if (messages.length > 50)
    return NextResponse.json({ error: 'Shumë mesazhe' }, { status: 400 })

  const ALLOWED_ROLES = new Set(['user', 'assistant'])
  for (const m of messages) {
    if (!ALLOWED_ROLES.has(m?.role) || typeof m?.content !== 'string')
      return NextResponse.json({ error: 'Format mesazhi i pavlefshëm' }, { status: 400 })
    if (m.content.length > 2000)
      return NextResponse.json({ error: 'Mesazhi është shumë i gjatë (max 2000 karaktere)' }, { status: 400 })
  }

  const lastUserMsg: string = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? ''
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (apiKey) {
    try {
      const client = new Anthropic({ apiKey })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.slice(-20).map((m: any) => ({ role: m.role, content: m.content })),
      })
      const text = response.content[0]?.type === 'text' ? response.content[0].text : ''
      return NextResponse.json({ reply: text })
    } catch (err: any) {
      const status = err?.status ?? 0
      if (status !== 401 && status !== 403 && status !== 429 && status !== 529) {
        console.error('AI route error:', err?.message ?? err)
      }
    }
  }

  /* FAQ fallback */
  return NextResponse.json({ reply: localFallback(lastUserMsg) })
}

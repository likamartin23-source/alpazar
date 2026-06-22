import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

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

    const [catRes, countRes, listingsRes] = await Promise.all([
      sb.from('categories').select('name').order('name'),
      sb.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('listings')
        .select('title,price,currency,city,category')
        .eq('is_active', true)
        .ilike('title', `%${query.slice(0, 50).replace(/[%_\\]/g, '\\$&')}%`)
        .limit(5),
    ])

    const categories = (catRes.data || []).map((c: any) => c.name).join(', ')
    const totalActive = countRes.count ?? 0
    const found = listingsRes.data || []

    let ctx = `Konteksti live i platformës (${new Date().toLocaleDateString('sq-AL')}):\n`
    ctx += `- Shpallje aktive: ${totalActive}\n`
    if (categories) ctx += `- Kategoritë: ${categories}\n`
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

function buildSystemPrompt(liveCtx: string): string {
  return `Ti je **Albi 🤖** — asistenti virtual i ALPAZAR, platforma shqiptare e tregtisë online, themeluar **2026**.

**Rregulla absolute:**
- Fol GJITHMONË shqip, me ton miqësor dhe profesional
- Jep përgjigje të sakta, praktike dhe të shkurtra (3-6 fjali)
- Mos shpik fakte — nëse s'di, thuaj "Kontakto support@alpazar.al"
- Kur pyesin produkt specifik, sugjero kategori + këshilla blerje të sigurtë
- Mos diskuto tema jashtë ALPAZAR/tregtisë/konsumatorizmit
- Kur pyesin çmime reale, përdor të dhënat live të mëposhtme

${liveCtx}`
}

function sanitizeConvo(messages: any[]): any[] {
  let convo = messages.slice(-20)
    .map((m: any) => ({ role: m.role, content: String(m.content).trim() }))
    .filter((m: any) => m.content !== '')
  while (convo.length > 0 && convo[0].role !== 'user') convo.shift()
  return convo.reduce((acc: any[], m: any) => {
    const last = acc[acc.length - 1]
    if (last && last.role === m.role) last.content += '\n' + m.content
    else acc.push({ ...m })
    return acc
  }, [])
}

async function tryGroq(convo: any[], systemPrompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...convo],
        max_tokens: 1024,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? null
  } catch {
    return null
  }
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
  const convo = sanitizeConvo(messages)
  if (convo.length === 0) return NextResponse.json({ reply: localFallback(lastUserMsg) })

  const liveCtx = await getLiveContext(lastUserMsg)
  const systemPrompt = buildSystemPrompt(liveCtx)

  // 1. Try Anthropic Claude — streaming SSE
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey, timeout: 25000 })
      const enc = new TextEncoder()
      const stream = new ReadableStream({
        async start(ctrl) {
          try {
            const anthropicStream = client.messages.stream({
              model: 'claude-haiku-4-5-20251001',
              max_tokens: 1024,
              system: systemPrompt,
              messages: convo,
            })
            for await (const chunk of anthropicStream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ t: chunk.delta.text })}\n\n`))
              }
            }
          } catch (err: any) {
            console.error('Anthropic stream error:', err?.status, err?.message ?? err)
            // Emit fallback reply so the client sees something
            const fallback = await tryGroq(convo, systemPrompt) ?? localFallback(lastUserMsg)
            ctrl.enqueue(enc.encode(`data: ${JSON.stringify({ t: fallback })}\n\n`))
          }
          ctrl.enqueue(enc.encode('data: [DONE]\n\n'))
          ctrl.close()
        },
      })
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'X-Accel-Buffering': 'no',
        },
      })
    } catch (err: any) {
      console.error('Anthropic error:', err?.status, err?.message ?? err)
    }
  }

  // 2. Try Groq (free tier — llama-3.3-70b, 100K tokens/day)
  const groqReply = await tryGroq(convo, systemPrompt)
  if (groqReply) return NextResponse.json({ reply: groqReply })

  // 3. Local FAQ fallback
  return NextResponse.json({ reply: localFallback(lastUserMsg) })
}

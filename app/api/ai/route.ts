import Anthropic from '@anthropic-ai/sdk'
import { LANG_NAMES, buildSystemPrompt, localFallback } from './kb'
import { getLiveContext, sanitizeConvo } from './context'
import { tryGroqStream, tryGroqJSON } from './groq'
import { tryPerplexityStream, tryPerplexityJSON } from './perplexity'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'

// Çelësi Anthropic + gjendja "ai_enabled" vijnë nga admin_settings (aty i vendos pronari),
// jo nga env — kështu Albi punon pa pasur nevojë të dyfishohet çelësi te Vercel. Fallback te env.
async function getAiConfig(): Promise<{ enabled: boolean; anthropicKey: string | null }> {
  try {
    const admin = getSupabaseAdmin()
    const { data } = await admin.from('admin_settings').select('key, value').in('key', ['anthropic_api_key', 'ai_enabled'])
    const m: Record<string, string> = {}
    for (const r of (data ?? []) as { key: string; value: string }[]) m[r.key] = r.value ?? ''
    return {
      enabled: (m.ai_enabled ?? 'true') !== 'false',
      anthropicKey: (m.anthropic_api_key || process.env.ANTHROPIC_API_KEY || '').trim() || null,
    }
  } catch {
    return { enabled: true, anthropicKey: (process.env.ANTHROPIC_API_KEY || '').trim() || null }
  }
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`ai:${ip}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Shumë kërkesa. Provo sërisht pas pak sekondash.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } },
    )
  }

  let body: any
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Kërkesë e pavlefshme.' }, { status: 400 }) }

  const { messages } = body
  const lang = (typeof body?.lang === 'string' && /^[a-z]{2}$/.test(body.lang) && LANG_NAMES[body.lang]) ? body.lang : 'sq'
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

  // Callers can opt out of SSE streaming (stream:false) to get a single JSON
  // { reply } — used by the new-listing AI helpers (price / description / category).
  const wantStream = body?.stream !== false
  // Ndihmësit e shpalljes dërgojnë `task` (description/price/category). Për ta, kur asnjë ofrues
  // AI real s'kthen përgjigje, NUK duhet shërbyer teksti bisedor i FAQ-së (do të futej si përshkrim
  // i pasaktë ose s'do të përputhej kurrë me një kategori). Kthejmë reply:null → klienti përdor
  // fallback-un e vet lokal (p.sh. përputhje kategorie lokale, shabllon përshkrimi).
  const isTask = typeof body?.task === 'string' && body.task.length > 0 && body.task.length < 40

  const lastUserMsg: string = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? ''
  const convo = sanitizeConvo(messages)
  if (convo.length === 0) return NextResponse.json(isTask ? { reply: null, ai: false } : { reply: localFallback(lastUserMsg) })

  const liveCtx = await getLiveContext(lastUserMsg)
  const systemPrompt = buildSystemPrompt(liveCtx, lang)

  // 1. Perplexity Router — modele frontier (Claude/GPT/Gemini) me një çelës, të ndërrueshme
  //    nga PERPLEXITY_MODEL pa deploy. Pa çelës kthen null MENJËHERË, pa thirrje rrjeti:
  //    zinxhiri i mëposhtëm mbetet saktësisht si më parë. Ky është shtegu me cilësi më të lartë;
  //    Groq mbetet rrjeta falas poshtë tij.
  if (wantStream) {
    const pplxStream = await tryPerplexityStream(convo, systemPrompt)
    if (pplxStream) return pplxStream
  } else {
    const pplxReply = await tryPerplexityJSON(convo, systemPrompt)
    if (pplxReply) return NextResponse.json({ reply: pplxReply })
  }

  // 2. Groq — falas (llama-3.1-8b-instant, 100K token/ditë)
  if (wantStream) {
    const groqStream = await tryGroqStream(convo, systemPrompt)
    if (groqStream) return groqStream
  } else {
    const groqReply = await tryGroqJSON(convo, systemPrompt)
    if (groqReply) return NextResponse.json({ reply: groqReply })
  }

  // 3. Anthropic Claude — fallback (çelësi nga admin_settings; aktiv kur ai_enabled + çelës present).
  //    Nëse llogaria s'ka kredit, gabimi kapet butë dhe shërbehet FAQ (pa ndotur error-tracking).
  const { enabled: aiEnabled, anthropicKey } = await getAiConfig()
  if (aiEnabled && anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey, timeout: 25000 })
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001', // i shpejtë e i lirë për sugjerime të shkurtra
        max_tokens: 1500,
        system: systemPrompt,
        messages: convo,
      })
      const reply = response.content[0]?.type === 'text' ? response.content[0].text : null
      if (reply) return NextResponse.json({ reply })
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      if (err?.status === 400 && /credit balance/i.test(msg)) {
        console.warn('Anthropic skipped (no credit) — serving FAQ')
      } else {
        console.error('Anthropic error:', err?.status, msg)
      }
    }
  }

  // 4. FAQ fallback (lokalizuar ne gjuhen e perdoruesit) — vetëm për bisedën e Albit.
  //    Për thirrjet e ndihmësit (task) kthejmë null që klienti të përdorë fallback-un lokal.
  if (isTask) return NextResponse.json({ reply: null, ai: false })
  /*  Perkthimi i pergjigjes rezerve NUK kalon me te Google.
   *
   *  Deri me 31 gusht 2026 kjo rreshti therriste `gtranslate()` →
   *  `translate.googleapis.com`. KORRIGJIM I MATJES SIME TE MEPARSHME: raportova
   *  se ajo dergonte "tekst te lire te perdoruesit"; nuk eshte e vertete —
   *  dergonte nje nga gjashtembedhjete pergjigjet e gatshme te FAQ-se. Por
   *  kerkesa mbante gjithsesi IP-ne e vizitorit, pra ishte transferim i te
   *  dhenave personale jashte BE-se pa instrument (nenet 26, 39-42, ligji
   *  124/2024) — per nje perkthim qe e bejme dot vete.
   *
   *  Teksti kthehet shqip; shtresa e perkthimit e nderfaqes (`lib/i18n.tsx`) e
   *  perkthen ne DOM permes funksionit TONE `translate`, qe rri te Supabase
   *  eu-west-1. Nje marres me pak, brenda BE-se.  */
  return NextResponse.json({ reply: localFallback(lastUserMsg) })
}

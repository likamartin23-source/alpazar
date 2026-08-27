import Anthropic from '@anthropic-ai/sdk'
import { LANG_NAMES, buildSystemPrompt, localFallback } from './kb'
import { getLiveContext, sanitizeConvo, gtranslate } from './context'
import { tryGroqStream, tryGroqJSON } from './groq'
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
  if (convo.length === 0) return NextResponse.json(isTask ? { reply: null, ai: false } : { reply: await gtranslate(localFallback(lastUserMsg), lang) })

  const liveCtx = await getLiveContext(lastUserMsg)
  const systemPrompt = buildSystemPrompt(liveCtx, lang)

  // 1. Groq — falas (llama-3.3-70b, 100K token/ditë)
  if (wantStream) {
    const groqStream = await tryGroqStream(convo, systemPrompt)
    if (groqStream) return groqStream
  } else {
    const groqReply = await tryGroqJSON(convo, systemPrompt)
    if (groqReply) return NextResponse.json({ reply: groqReply })
  }

  // 2. Anthropic Claude — fallback (çelësi nga admin_settings; aktiv kur ai_enabled + çelës present).
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

  // 3. FAQ fallback (lokalizuar ne gjuhen e perdoruesit) — vetëm për bisedën e Albit.
  //    Për thirrjet e ndihmësit (task) kthejmë null që klienti të përdorë fallback-un lokal.
  if (isTask) return NextResponse.json({ reply: null, ai: false })
  return NextResponse.json({ reply: await gtranslate(localFallback(lastUserMsg), lang) })
}

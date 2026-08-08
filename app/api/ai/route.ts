import Anthropic from '@anthropic-ai/sdk'
import { FAQ, LANG_NAMES, buildSystemPrompt, localFallback } from './kb'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'


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
async function getLiveContext(query: string): Promise<string> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const [catRes, countRes, usersRes, payRes, plansRes, listingsRes] = await Promise.all([
      sb.from('categories').select('name').order('name'),
      sb.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('payment_methods').select('name,type').eq('is_active', true).order('sort_order'),
      sb.from('premium_plans').select('name,price_all,billing_period,max_listings,max_images,boost_credits').eq('is_active', true).order('billing_period').order('price_all'),
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
    const plans = plansRes.data || []
    const found = listingsRes.data || []

    let ctx = `Konteksti LIVE i platformës (${new Date().toLocaleDateString('sq-AL')}):\n`
    ctx += `- Shpallje aktive: ${totalActive}\n`
    if (totalUsers) ctx += `- Përdorues të regjistruar: ${totalUsers}\n`
    if (categories) ctx += `- Kategoritë: ${categories}\n`
    if (payMethods) ctx += `- Mënyra pagese aktive: ${payMethods}\n`
    if (plans.length > 0) {
      ctx += `- PLANET PREMIUM (burimi i vetem i vertete — mos shpik cmime):\n`
      plans.forEach((p: any) => {
        ctx += `  • ${p.name}: ${Number(p.price_all).toLocaleString('sq-AL')} L${p.billing_period === 'yearly' ? '/vit' : '/muaj'} — ${p.max_listings === -1 ? 'shpallje pa limit' : p.max_listings + ' shpallje'}, ${p.max_images} foto, ${p.boost_credits} boost\n`
      })
    }
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

/* ── Groq streaming (SSE) — provider parësor, falas 100K/ditë ─────── */
async function tryGroqStream(
  convo: any[],
  systemPrompt: string,
): Promise<Response | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null

  let groqRes: globalThis.Response
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...convo],
        max_tokens: 1500,
        temperature: 0.7,
        stream: true,
      }),
      signal: AbortSignal.timeout(25000),
    })
  } catch (e) {
    console.error('Groq fetch error:', e)
    return null
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text().catch(() => '')
    console.error('Groq error:', groqRes.status, errText)
    return null
  }

  const encoder = new TextEncoder()
  const body = groqRes.body!
  const stream = new ReadableStream({
    async start(controller) {
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              return
            }
            try {
              const chunk = JSON.parse(raw)
              const text = chunk.choices?.[0]?.delta?.content
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ t: text })}\n\n`),
                )
              }
            } catch {}
          }
        }
      } finally {
        reader.cancel().catch(() => {})
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

/* ── Groq non-streaming (JSON) — for callers that want a single {reply} ──
   (e.g. the "suggest price" / "generate description" helpers on the new-listing
   form, which read res.json() and cannot consume an SSE stream). ─────────── */
async function tryGroqJSON(convo: any[], systemPrompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: systemPrompt }, ...convo],
        max_tokens: 1500,
        temperature: 0.7,
        stream: false,
      }),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) { console.error('Groq JSON error:', res.status); return null }
    const data = await res.json()
    return data.choices?.[0]?.message?.content?.trim() || null
  } catch (e) {
    console.error('Groq JSON fetch error:', e)
    return null
  }
}

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
  // { reply } — used by the new-listing AI helpers (price / description).
  const wantStream = body?.stream !== false

  const lastUserMsg: string = [...messages].reverse().find((m: any) => m.role === 'user')?.content ?? ''
  const convo = sanitizeConvo(messages)
  if (convo.length === 0) return NextResponse.json({ reply: await gtranslate(localFallback(lastUserMsg), lang) })

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

  // 2. Anthropic Claude — fallback non-streaming.
  //    Disabled by default: the Anthropic account has no credit, so calling it
  //    only adds latency and pollutes runtime error tracking with 400 "credit
  //    balance too low" entries. Re-enable instantly by setting the env var
  //    ANTHROPIC_FALLBACK_ENABLED=true once credits are added.
  const anthropicKey = process.env.ANTHROPIC_API_KEY
  if (anthropicKey && process.env.ANTHROPIC_FALLBACK_ENABLED === 'true') {
    try {
      const client = new Anthropic({ apiKey: anthropicKey, timeout: 25000 })
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: convo,
      })
      const reply = response.content[0]?.type === 'text' ? response.content[0].text : null
      if (reply) return NextResponse.json({ reply })
    } catch (err: any) {
      const msg = err?.message ?? String(err)
      // Known/expected when the account is out of credit — keep it out of error tracking.
      if (err?.status === 400 && /credit balance/i.test(msg)) {
        console.warn('Anthropic fallback skipped (no credit) — serving FAQ')
      } else {
        console.error('Anthropic error:', err?.status, msg)
      }
    }
  }

  // 3. FAQ fallback (lokalizuar ne gjuhen e perdoruesit)
  return NextResponse.json({ reply: await gtranslate(localFallback(lastUserMsg), lang) })
}

import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

import { LANG_NAMES, gtranslate, localFallback, getLiveContext, buildSystemPrompt } from './prompt'

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

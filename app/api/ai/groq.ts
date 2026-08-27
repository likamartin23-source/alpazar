// Modeli Groq — I KONFIGURUESHËM nga env (pa deploy), me default të garantuar-aktiv.
// Auditi ditor (Cowork, 21/24/25 gusht): `llama-3.3-70b-versatile` kthente 404 "does not exist
// or you do not have access" për këtë çelës → shtegu parësor binte te fallback-u. `llama-3.1-8b-instant`
// është model prodhimi i qëndrueshëm dhe i disponueshëm te tier-i falas. Pronari mund ta ngrejë te
// një model më i fuqishëm duke vendosur GROQ_MODEL te Vercel, pa prekur kodin.
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

/* ── Groq streaming (SSE) — provider parësor, falas 100K/ditë ─────── */
export async function tryGroqStream(
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
        model: GROQ_MODEL,
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
   form, which read res.json() and cannot consume an SSE stream). ───────── */
export async function tryGroqJSON(convo: any[], systemPrompt: string): Promise<string | null> {
  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) return null
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
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

// Perplexity ROUTER API — qasje te modelet frontier (Anthropic, OpenAI, Google, xAI)
// me NJË çelës të vetëm, pa ndryshuar provider. Pa web-grounding: Router-i është
// thjesht rrugëtim modelesh, jo kërkim. Për Albin kjo është pikërisht ç'duhet —
// përgjigjet ndërtohen nga KB-ja lokale (kb.ts), jo nga interneti.
//
// PSE skema Anthropic e jo OpenAI: `@anthropic-ai/sdk` ËSHTË tashmë varësi e këtij
// projekti (^0.98.0) dhe route.ts e përdor. Kështu integrimi hyn me ZERO varësi të reja.
// Router-i i pranon të gjitha modelet e listuara në të dyja skemat — Claude, GPT, Gemini
// të gjitha kalojnë përmes /messages.
//
// KURTHI I baseURL: SDK-ja e Anthropic-ut i shton VETË `/v1/messages`. Prandaj baza
// këtu është `.../router` dhe JO `.../router/v1` — përndryshe URL-ja del `/router/v1/v1/messages`.
// (Për rrugën OpenAI-compatible baza do të ishte `.../router/v1`.)
import Anthropic from '@anthropic-ai/sdk'

const ROUTER_BASE_URL = 'https://api.perplexity.ai/router'

// Slug-u është `krijues/emër-modeli`. NUK shpiket kurrë: një slug i palistuar kthen 400,
// ndërsa një model jashtë tier-it të organizatës kthen 402. Verifikoje katalogun REAL të
// çelësit tënd me `listRouterModels()` më poshtë — përgjigjja e tij është njëkohësisht
// katalogu dhe allowlist-i i atij çelësi. Ndryshohet pa deploy nga PERPLEXITY_MODEL.
const ROUTER_MODEL = process.env.PERPLEXITY_MODEL || 'anthropic/claude-sonnet-5'

function routerClient(): Anthropic | null {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return null // pa çelës → zinxhiri bie te provideri tjetër, pa gabim
  return new Anthropic({ apiKey: key, baseURL: ROUTER_BASE_URL, timeout: 25000 })
}

// Gabimet e Router-it kanë kuptim të përcaktuar; regjistrohen që auditi ditor t'i kapë.
// 429 mbart `Retry-After` — mund të jetë kufizim shpejtësie OSE mbingarkesë e përkohshme
// e modelit; në të dyja rastet biem te provideri tjetër, nuk e bllokojmë përdoruesin.
function logRouterError(where: string, err: any) {
  const status = err?.status
  if (status === 400) console.error(`Perplexity ${where}: 400 — slug modeli i panjohur (${ROUTER_MODEL})`)
  else if (status === 401) console.error(`Perplexity ${where}: 401 — çelës i pavlefshëm`)
  else if (status === 402) console.error(`Perplexity ${where}: 402 — modeli jashtë tier-it të organizatës`)
  else if (status === 429) console.error(`Perplexity ${where}: 429 — kufizim/mbingarkesë, Retry-After: ${err?.headers?.['retry-after'] ?? 'n/a'}`)
  else console.error(`Perplexity ${where}:`, status, err?.message)
}

/* ── Router streaming (SSE) ─────────────────────────────────────────────
   Skema Messages emeton ngjarje të tipizuara nga `message_start` te `message_stop`.
   Ne e përkthejmë te i njëjti zarf që pret klienti: data: {"t": "..."} + [DONE].
   (Ndryshe nga Chat Completions, këtu nuk ka `choices` dhe as stream_options.) */
export async function tryPerplexityStream(
  convo: any[],
  systemPrompt: string,
): Promise<Response | null> {
  const client = routerClient()
  if (!client) return null

  let events: AsyncIterable<any>
  try {
    events = (await client.messages.create({
      model: ROUTER_MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt, // te skema Messages `system` është parametër i nivelit të parë
      messages: convo,
      stream: true,
    })) as unknown as AsyncIterable<any>
  } catch (err: any) {
    logRouterError('stream', err)
    return null
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            const text = event.delta.text
            if (text) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ t: text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        // Ndërprerje në mes të rrjedhës: mbyllim pastër që klienti të mos ngecë.
        console.error('Perplexity stream interrupted:', err)
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } finally {
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

/* ── Router jo-streaming (JSON) — për thirrësit që lexojnë res.json()
   (sugjerimi i çmimit / gjenerimi i përshkrimit te forma e shpalljes). ── */
export async function tryPerplexityJSON(
  convo: any[],
  systemPrompt: string,
): Promise<string | null> {
  const client = routerClient()
  if (!client) return null
  try {
    const msg = await client.messages.create({
      model: ROUTER_MODEL,
      max_tokens: 1500,
      temperature: 0.7,
      system: systemPrompt,
      messages: convo,
    })
    // Messages kthen blloqe `content`, JO `choices`. Marrim tekstin e bllokut të parë.
    const block: any = (msg as any).content?.[0]
    return block?.type === 'text' ? String(block.text).trim() || null : null
  } catch (err: any) {
    logRouterError('json', err)
    return null
  }
}

/* ── Katalogu i vërtetë i çelësit ───────────────────────────────────────
   GET /router/v1/models me TË NJËJTIN çelës që përdoret për kërkesat: përgjigjja
   është tier-aware, pra njëkohësisht katalog DHE allowlist. Përdoret për të
   verifikuar një slug para se të vihet te PERPLEXITY_MODEL — jo për të hamendësuar. */
export async function listRouterModels(): Promise<string[] | null> {
  const key = process.env.PERPLEXITY_API_KEY
  if (!key) return null
  try {
    const res = await fetch(`${ROUTER_BASE_URL}/v1/models`, {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) { console.error('Perplexity models:', res.status); return null }
    const data = await res.json()
    return (data?.data ?? []).map((m: any) => m.id).filter(Boolean)
  } catch (e) {
    console.error('Perplexity models fetch error:', e)
    return null
  }
}

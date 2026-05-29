import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const runtime = 'nodejs'

const SYSTEM_PROMPT = `Ti je asistenti virtual i ALPAZAR — platformës #1 shqiptare të tregtisë online. Emri yt është "Albi 🤖".

Ndihmo përdoruesit me:
- Gjetjen e produkteve dhe kategorive
- Çmimet e tregut në Shqipëri (ALL/EUR)
- Si të shesin dhe blejnë në ALPAZAR
- Dyqanet premium dhe veçoritë e tyre
- Këshilla sigurie për transaksionet online
- Kategoritë: Elektronikë, Makina, Shtëpi & Kopsht, Veshje, Kafshë, Sport, Pune, Shërbime, Fëmijë, Bukuri

Rregulla:
- Fol GJITHMONË në shqip
- Ji miqësor, i shkurtër dhe i dobishëm
- Nëse pyesin çmime, jep range reale të tregut shqiptar
- Nëse pyesin produkt specifik, sugjero kategoritë relevante
- Mos diskuto tema jashtë ALPAZAR/tregtisë
- Përgjigje maksimum 3-4 fjali`

export async function POST(req: NextRequest) {
  // 20 requests per minute per IP
  const ip = getClientIp(req)
  const rl = rateLimit(`ai:${ip}`, { limit: 20, windowMs: 60_000 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Shumë kërkesa. Provo sërisht pas pak sekondash.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetIn / 1000)) } }
    )
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error('AI route: ANTHROPIC_API_KEY mungon në environment')
      return NextResponse.json({
        reply: 'Albi nuk është aktivizuar ende nga administratori (mungon çelësi i AI). Provo përsëri më vonë ose kontakto shitësin direkt nga shpallja. 🙏'
      })
    }

    const body = await req.json()
    const { messages } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Mesazhe të pavlefshme' }, { status: 400 })
    }

    // Validim: max 20 mesazhe, max 1000 karaktere/mesazh, vetëm role user/assistant
    const ALLOWED_ROLES = new Set(['user', 'assistant'])
    for (const m of messages) {
      if (!ALLOWED_ROLES.has(m?.role) || typeof m?.content !== 'string') {
        return NextResponse.json({ error: 'Format mesazhi i pavlefshëm' }, { status: 400 })
      }
      if (m.content.length > 1000) {
        return NextResponse.json({ error: 'Mesazhi është shumë i gjatë (max 1000 karaktere)' }, { status: 400 })
      }
    }

    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'Asistenti nuk është i disponueshëm momentalisht.' }, { status: 500 })
  }
}

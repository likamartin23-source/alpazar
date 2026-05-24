import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  try {
    const { messages } = await req.json()
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Mesazhe të pavlefshme' }, { status: 400 })
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-10),
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ reply: text })
  } catch (err: any) {
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'Asistenti nuk është i disponueshëm momentalisht.' }, { status: 500 })
  }
}

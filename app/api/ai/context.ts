import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sopafwfkrxpcdaljddoh.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Perkthim pa celes per lokalizimin e pergjigjeve FAQ (kur LLM bie).
export async function gtranslate(text: string, target: string): Promise<string> {
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

export function sanitizeConvo(messages: any[]): any[] {
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

const money = (n: any) => Number(n || 0).toLocaleString('sq-AL')
const per = (p: any) =>
  p.billing_period === 'yearly' ? '/vit' : p.billing_period === 'quarterly' ? '/3 muaj' : '/muaj'

function planLine(p: any) {
  const disc = Number(p.discount_pct) > 0 ? ` — kursen ${Number(p.discount_pct)}%` : ''
  return `  • ${p.name}: ${money(p.price_all)} L${per(p)} (${p.price_eur} EUR)${disc}\n`
}

export async function getLiveContext(query: string): Promise<string> {
  try {
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    const [catRes, countRes, usersRes, payRes, plansRes, cfgRes, listingsRes] = await Promise.all([
      sb.from('categories').select('name').order('name'),
      sb.from('listings').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
      sb.from('payment_methods').select('name,type').eq('is_active', true).order('sort_order'),
      sb.from('premium_plans')
        .select('name,tier,price_all,price_eur,billing_period,months,discount_pct,max_videos')
        .eq('is_active', true).order('tier', { ascending: false }).order('sort_order'),
      // app_config eshte tabela PUBLIKE — anon key e lexon. (admin_settings bllokohet nga RLS.)
      sb.from('app_config').select('key,value')
        .in('key', ['video_max_seconds', 'free_videos_limit', 'max_videos_premium',
                    'free_listings_limit', 'max_images_free', 'max_images_premium']),
      sb.from('listings')
        .select('title,price,currency,city,category_id')
        .eq('is_active', true)
        .ilike('title', `%${query.slice(0, 50).replace(/[%_\\]/g, '\\$&')}%`)
        .limit(5),
    ])

    const categories = (catRes.data || []).map((c: any) => c.name).join(', ')
    const totalActive = countRes.count ?? 0
    const totalUsers = usersRes.count ?? 0
    const payMethods = (payRes.data || []).map((p: any) => p.name).join(', ')
    const plans: any[] = plansRes.data || []
    const found = listingsRes.data || []

    const cfg: Record<string, string> = {}
    for (const r of (cfgRes.data || []) as any[]) cfg[r.key] = r.value

    const prem = plans.filter(p => (p.tier || 'premium') === 'premium')
    const boost = plans.filter(p => p.tier === 'boost')

    let ctx = `Konteksti LIVE i platformës (${new Date().toLocaleDateString('sq-AL')}):\n`
    ctx += `- Shpallje aktive: ${totalActive}\n`
    if (totalUsers) ctx += `- Përdorues të regjistruar: ${totalUsers}\n`
    if (categories) ctx += `- Kategoritë: ${categories}\n`
    if (payMethods) ctx += `- Mënyra pagese aktive: ${payMethods}\n`

    const nz = (v: any, d: string) => (v === undefined || v === null || v === '' ? d : String(v))
    const cap = (v: any, d: string) => (nz(v, d) === '-1' ? 'pa limit' : nz(v, d))

    ctx += `- LLOGARIA FALAS: ${cap(cfg.free_listings_limit, '10')} shpallje, `
    ctx += `${cap(cfg.max_images_free, '10')} foto dhe ${cap(cfg.free_videos_limit, '5')} video per shpallje.\n`

    if (prem.length > 0) {
      ctx += `- PLANI PREMIUM (burimi i vetem i vertete — mos shpik cmime as emra). `
      ctx += `Te gjithe perdoruesit Premium jane TE BARABARTE dhe marrin saktesisht te njejtat perfitime: `
      ctx += `shpallje PA LIMIT, renditje ne vend te pare kundrejt perdoruesve pa pagese, profil biznesi, `
      ctx += `postime pa limit, ${cap(cfg.max_images_premium, '-1')} foto dhe `
      ctx += `${cap(cfg.max_videos_premium, '10')} video per shpallje. Ndryshon vetem periudha e faturimit.\n`
      prem.forEach(p => { ctx += planLine(p) })
    }

    if (boost.length > 0) {
      ctx += `- EKSTRA BOOST VIP (produkt krejt i vecante, SHTESE mbi Premium — nuk e zevendeson ate. `
      ctx += `Blihet VETEM nga perdorues qe kane tashme Premium aktiv. Jep shikueshmeri maksimale: `
      ctx += `kreu absolut i listes, rrotullim ne faqen kryesore, prioritet maksimal ne kerkim):\n`
      boost.forEach(p => { ctx += planLine(p) })
    }

    ctx += `- VIDEO: kohezgjatja maksimale ${Math.round(Number(nz(cfg.video_max_seconds, '300')) / 60)} minuta per video.\n`
    ctx += `- KU BLIHET: planet zgjidhen te /premium. Abonimi aktual menaxhohet te /billing (anulim, fatura).\n`

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

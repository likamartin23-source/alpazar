import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from '../../../lib/supabase'
import { getSupabaseAdmin } from '../../../lib/supabase-admin'
import { rateLimit, getClientIp } from '../../../lib/rateLimit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const rl = rateLimit(`delete-account:${ip}`, { limit: 3, windowMs: 60 * 60_000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Shumë kërkesa. Provo përsëri pas pak.' }, { status: 429 })
  }
  try {
    const auth = req.headers.get('authorization')
    if (!auth?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Pa autorizim' }, { status: 401 })
    }
    const token = auth.slice(7)

    // Verify the token and get user identity
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authErr } = await userClient.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Token i pavlefshëm' }, { status: 401 })
    }

    const admin = getSupabaseAdmin()

    // Anonymize listings (don't delete — preserve marketplace integrity)
    await (admin.from('listings') as any).update({ is_active: false }).eq('user_id', user.id)

    // Delete personal data
    await admin.from('favorites').delete().eq('user_id', user.id)
    await admin.from('saved_searches').delete().eq('user_id', user.id)
    await admin.from('saved_listings').delete().eq('user_id', user.id)
    await admin.from('price_alerts').delete().eq('user_id', user.id)
    await admin.from('notifications').delete().eq('user_id', user.id)

    // GDPR Art.17 / Ligji 124/2024 — fshij mesazhet dhe bisedat e user-it
    await admin.from('messages').delete().eq('sender_id', user.id)
    await (admin.from('conversations') as any).delete().or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

    // Delete the auth user (cascades to profile via DB trigger/FK)
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Gabim i brendshëm' }, { status: 500 })
  }
}

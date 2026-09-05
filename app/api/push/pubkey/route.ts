// Çelësi VAPID PUBLIK për klientin — lexim publik nga app_config (jo sekret).
// Klienti e merr në runtime (pa nevojë për env te Vercel). Privati rri te
// admin_settings, s'del kurrë këtej.
export const dynamic = 'force-dynamic'

import { supabase } from '../../../../lib/supabase'

export async function GET() {
  try {
    const { data } = await supabase.from('app_config').select('value').eq('key', 'vapid_public').maybeSingle()
    return Response.json({ key: data?.value || '' }, { headers: { 'cache-control': 'public, max-age=300' } })
  } catch {
    return Response.json({ key: '' })
  }
}

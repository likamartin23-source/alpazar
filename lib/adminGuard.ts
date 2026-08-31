import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig'

/*  ROJA E RRUGEVE TE PRIVILEGJUARA
 *
 *  PSE ekziston (gjetur me 31 gusht 2026, kalimi i gjashte i auditimit):
 *  `/api/admin/action` dhe `/api/admin/config` dergojne kerkesen te nje Edge
 *  Function qe xhiron me `service_role`. Ai rol kalon RLS-ne, matricen e lejeve
 *  (`has_perm`/`perm_matrix`) dhe trigerin `guard_profile_privileges`. Vete
 *  funksioni e pranon kete ne komentin e vet.
 *
 *  E vetmja porte ishte nje PIN gjashtevendesh — pa sesion, pa `is_admin`, pa
 *  MFA. Nderkohe paneli vete ka kaluar te sesioni + `is_admin` + MFA dhe as nuk
 *  e kerkon me ate PIN (`app_config.admin_pin_disabled = 'true'`). Pra rrinte
 *  nje rruge paralele, me e privilegjuar se paneli, e mbrojtur me pak se ai.
 *
 *  Me `/api/admin/config` gjendja ishte edhe me e rende: ajo shkruan te
 *  `admin_settings`, tabela qe mban CDO sekret te platformes — dhe vete PIN-in.
 *
 *  Kjo roje nuk e heq PIN-in dhe nuk e ndryshon: vlera eshte e pronarit. Ajo e
 *  shnderron nga "porta e vetme" ne "faktor i dyte", duke kerkuar edhe nje
 *  sesion te vertete admini. Mbrojtja ne thellesi: nje PIN i zbuluar nuk mjafton
 *  me, dhe nje sesion i vjedhur pa PIN as ai.
 */

/** Kthen `null` kur kerkuesi eshte admin i vlefshem; perndryshe pergjigjen e
 *  gatshme te gabimit. Pa union tipesh — thirresi e ka nje kusht te vetem. */
export async function kerkoAdmin(req: Request): Promise<NextResponse | null> {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Kërkohet hyrja si administrator.' }, { status: 401 })
  }

  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data: { user }, error } = await sb.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ ok: false, error: 'Sesioni nuk është i vlefshëm.' }, { status: 401 })
  }

  // Leximi behet me token-in e vete perdoruesit, pra RLS-ja zbatohet: nuk
  // mjafton te dish nje `id`, duhet te jesh ai person.
  const { data: profil } = await sb
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profil?.is_admin) {
    return NextResponse.json({ ok: false, error: 'Nuk ke të drejta administrimi.' }, { status: 403 })
  }
  return null
}

import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './supabase'

// Lazy singleton — only instantiated on first call so build-time import
// doesn't throw when SUPABASE_SERVICE_ROLE_KEY is absent from env.
//
// Skema `<any>`: pa te, `createClient` e ka Database-in bosh dhe cdo
// `rpc('emri', {...})` i pret argumentet si `never` — pra cdo thirrje RPC
// nga serveri deshton ne tsc. Klienti i shfletuesit
// (`createClientComponentClient` te lib/supabase.ts) e ka `any` si
// parazgjedhje, ndaj kjo vetem e barazon anen e serverit me te.
// Kur te gjenerohen tipet e vertetat (`supabase gen types`), zevendesohet
// `any` me `Database`.
let _client: ReturnType<typeof createClient<any>> | null = null

export function getSupabaseAdmin() {
  if (_client) return _client
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — admin operations will fail')
  _client = createClient<any>(SUPABASE_URL, key)
  return _client
}

// Legacy named export kept for any future callers — same lazy behaviour
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient<any>>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
})

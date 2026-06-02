import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './supabase'

// Lazy singleton — only instantiated on first call so build-time import
// doesn't throw when SUPABASE_SERVICE_ROLE_KEY is absent from env.
let _client: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin() {
  if (_client) return _client
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set — admin operations will fail')
  _client = createClient(SUPABASE_URL, key)
  return _client
}

// Legacy named export kept for any future callers — same lazy behaviour
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
})

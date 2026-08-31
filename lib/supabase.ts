import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Burimi i vetem i konfigurimit rri te `supabaseConfig` — pa efekte anesore,
// qe edhe middleware-i ne edge ta lexoje pa terhequr klientin e rende.
export { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabaseConfig'

export const supabase = createClientComponentClient({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
})

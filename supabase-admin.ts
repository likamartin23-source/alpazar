import { createClient } from '@supabase/supabase-js'

// Ky client ka te drejta te plota (service role)
// Perdore VETEM ne server-side (API routes, Server Actions)
// KURRE ne client-side code!
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

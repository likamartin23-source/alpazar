import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './supabase'

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY is not set — admin operations will fail')
}

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
)

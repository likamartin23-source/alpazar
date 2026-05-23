import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sopafwfkrxpcdaljddoh.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcGFmd2ZrcnhwY2RhbGpkZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk1MzgsImV4cCI6MjA5NDc4NTUzOH0.PS9_c8DdObZ-3NlGTWtj9awvtOpbgE-7b_fdGY4ICLY'

export const supabase = createClientComponentClient({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
})

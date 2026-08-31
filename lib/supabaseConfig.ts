// Konfigurimi i Supabase-it — VETEM konstante, pa asnje efekt anesor.
//
// Ndare nga `lib/supabase.ts` me qellim: ai skedar krijon nje klient ne nivel
// moduli (`createClientComponentClient`), qe eshte kod i rende dhe i mesuar per
// shfletuesin. `middleware.ts` xhiron ne edge dhe e ngarkon Supabase-in vetem
// kur viziohet `/admin`; nese importonte `lib/supabase.ts` do te terhiqte gjithe
// ate peshe ne cdo kerkese faqeje.
//
// Te dyja shtresat — klienti dhe middleware-i — lexojne KETE burim te vetem.
// Perndryshe `createMiddlewareClient()` i lexon vete variablat e mjedisit dhe
// HEDH PERJASHTIM kur njeri mungon, duke e ridrejtuar `/admin` ne heshtje
// ndersa pjesa tjeter e faqes punon nga vlera rezerve (matur 31 gusht 2026).

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://sopafwfkrxpcdaljddoh.supabase.co'

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcGFmd2ZrcnhwY2RhbGpkZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk1MzgsImV4cCI6MjA5NDc4NTUzOH0.PS9_c8DdObZ-3NlGTWtj9awvtOpbgE-7b_fdGY4ICLY'

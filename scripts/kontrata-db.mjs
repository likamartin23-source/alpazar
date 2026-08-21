#!/usr/bin/env node
// TESTI I KONTRATES KOD↔DB (Faza 5 e harnesit — urdheri i Cowork-ut §5.B/§10.4).
//
// PSE: klasa gabimesh qe "e rrezojne projektin ne heshtje" eshte kur kodi referon
// nje kolone/tabele qe DB-ja s'e ka me (rename/drop nga nje migrim) — build-i kalon,
// por faqja deshton ne runtime. Ky skript e kthen ate ne nje PORTE CI qe bllokon merge-in.
//
// SI: per cdo varesi reale kod→DB, godet PostgREST me anon-key:
//   GET {SUPABASE_URL}/rest/v1/{tabela}?select={kolona}&limit=1
// Nese kolona/tabela mungon, PostgREST kthen 400/404 (gabim skeme PARA filtrit RLS),
// ndaj kontrolli eshte i besueshem edhe per tabela me RLS (rreshtat filtrohen, por
// gabimi i skemes del gjithsesi). Perdor VETEM anon-key publik — pa service_role, pa SQL.
//
// FAIL-CLOSED: cdo shkelje kontrate -> exit 1 (bllokon merge). Gabim infrastrukture
// pas riprovave -> exit 2 (prape bllokon; nje porte e prishur duhet vene re, jo anashkaluar).
//
// Kontrata reflekton emrat qe KODI perdor sot (grep i app/+lib/, 20 gusht 2026):
//   messages.receiver_id + sender_id · favorites(user_id,listing_id) ·
//   listings.is_active + status · listings.fts (textSearch('fts')).
// Kur kodi te ndryshoje emrin qe perdor, perditeso kete liste (nje burim i vetem).

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://sopafwfkrxpcdaljddoh.supabase.co'

const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvcGFmd2ZrcnhwY2RhbGpkZG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDk1MzgsImV4cCI6MjA5NDc4NTUzOH0.PS9_c8DdObZ-3NlGTWtj9awvtOpbgE-7b_fdGY4ICLY'

// { tabela: [kolona qe kodi referon] } — burimi i vetem i kontrates.
const KONTRATA = {
  messages: ['receiver_id', 'sender_id'],
  favorites: ['user_id', 'listing_id'],
  listings: ['is_active', 'status', 'fts', 'rank_tier', 'business_id'],
  businesses: ['owner_id', 'is_verified'],
}

async function probe(table, col, tries = 3) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(col)}&limit=1`
  let lastErr = ''
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        signal: AbortSignal.timeout(10000),
      })
      if (res.status === 200 || res.status === 206) return { ok: true }
      const body = await res.text().catch(() => '')
      // 400 = gabim skeme (kolona s'ekziston); 404 = tabela s'ekziston -> shkelje kontrate.
      if (res.status === 400 || res.status === 404) {
        return { ok: false, kind: 'contract', reason: `HTTP ${res.status}: ${body.slice(0, 200)}` }
      }
      // 401/403/5xx = i pavendosur (RLS/rrjet) — riprovo pastaj trajto si infra.
      lastErr = `HTTP ${res.status}: ${body.slice(0, 200)}`
    } catch (e) {
      lastErr = String(e?.message || e)
    }
    await new Promise(r => setTimeout(r, 500 * (i + 1)))
  }
  return { ok: false, kind: 'infra', reason: lastErr }
}

async function main() {
  const violations = []
  const infra = []
  let checks = 0
  for (const [table, cols] of Object.entries(KONTRATA)) {
    for (const col of cols) {
      checks++
      const r = await probe(table, col)
      if (r.ok) {
        console.log(`  ✓ ${table}.${col}`)
      } else if (r.kind === 'contract') {
        console.error(`  ✗ ${table}.${col} — MUNGON (${r.reason})`)
        violations.push(`${table}.${col}`)
      } else {
        console.error(`  ? ${table}.${col} — i pavendosur (${r.reason})`)
        infra.push(`${table}.${col}`)
      }
    }
  }

  console.log(`\nKontrata kod↔DB: ${checks} kontrolle · ${violations.length} shkelje · ${infra.length} te pavendosur`)

  if (violations.length) {
    console.error(`\n❌ SHKELJE KONTRATE — kodi referon kolona/tabela qe DB-ja s'i ka: ${violations.join(', ')}`)
    console.error('Rregullo migrimin ose perditeso kodin PARA merge-it. Porta CI e bllokon.')
    process.exit(1)
  }
  if (infra.length) {
    console.error(`\n⚠️  Kontrolle te pavendosura (fail-closed): ${infra.join(', ')}`)
    process.exit(2)
  }
  console.log('\n✅ Kontrata kod↔DB e plote — asnje drift.')
}

main().catch((e) => {
  console.error('Gabim fatal ne testin e kontrates:', e)
  process.exit(2)
})

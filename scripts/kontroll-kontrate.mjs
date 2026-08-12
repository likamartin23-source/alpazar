#!/usr/bin/env node
/**
 * KONTROLLI I KONTRATES KOD <-> BAZE
 *
 * Pse ekziston: dy defektet me te renda te ketij projekti ishin i njejti gabim.
 *   search_listings i referohej kolones 'search_vector' — kolona reale eshte
 *   'fts'. Kerkimi kthente gabim ne CDO thirrje dhe askush nuk e dinte.
 *   admin_attach_invoice_file thirrte 'public.public.has_perm' — deshtonte gjithnje.
 *
 * TypeScript-i nuk i kap keto: ndodhin ne SQL ne kohen e ekzekutimit.
 * Ky skript i kap ne CI, para se te mberrijne te perdoruesi.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const URL_BAZA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CELESI = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!URL_BAZA || !CELESI) {
  console.log('::notice::Mungojne kredencialet e bazes — kontrolli anashkalohet.');
  process.exit(0);
}

const SHPERFILL_DIR = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'coverage', '.vercel']);
const SHTESA = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function mblidhSkedaret(rrenja, mbledhur = []) {
  for (const emri of readdirSync(rrenja)) {
    if (SHPERFILL_DIR.has(emri)) continue;
    const rruga = join(rrenja, emri);
    const st = statSync(rruga);
    if (st.isDirectory()) mblidhSkedaret(rruga, mbledhur);
    else if (SHTESA.has(extname(emri))) mbledhur.push(rruga);
  }
  return mbledhur;
}

async function thirr(funksioni) {
  const p = await fetch(`${URL_BAZA}/rest/v1/rpc/${funksioni}`, {
    method: 'POST',
    headers: {
      apikey: CELESI,
      Authorization: `Bearer ${CELESI}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!p.ok) throw new Error(`${funksioni}: ${p.status} ${await p.text()}`);
  return p.json();
}

const manifesti = await thirr('contract_manifest');
const vetekontrolli = await thirr('contract_self_check');

const rpcEkzistuese = new Set(manifesti.rpc || []);
const tabelaEkzistuese = new Set(Object.keys(manifesti.tabela || {}));

const skedaret = mblidhSkedaret(process.cwd());
const gabime = [];

// Emra qe kodi i perdor por qe nuk jane te ynet (Supabase auth/storage etj.)
const PERJASHTIME = new Set(['objects', 'buckets', 'users']);

for (const skedari of skedaret) {
  const teksti = readFileSync(skedari, 'utf8');
  const rreshtat = teksti.split('\n');

  rreshtat.forEach((rreshti, i) => {
    for (const m of rreshti.matchAll(/\.rpc\(\s*['"`]([a-zA-Z0-9_]+)['"`]/g)) {
      if (!rpcEkzistuese.has(m[1])) {
        gabime.push({ skedari, rreshti: i + 1, lloji: 'RPC', emri: m[1] });
      }
    }
    for (const m of rreshti.matchAll(/\.from\(\s*['"`]([a-z_][a-z0-9_]*)['"`]/g)) {
      if (!tabelaEkzistuese.has(m[1]) && !PERJASHTIME.has(m[1])) {
        gabime.push({ skedari, rreshti: i + 1, lloji: 'TABELE', emri: m[1] });
      }
    }
  });
}

console.log(`Skedare te kontrolluar: ${skedaret.length}`);
console.log(`RPC ne baze: ${rpcEkzistuese.size} | Tabela ne baze: ${tabelaEkzistuese.size}`);

let deshtoi = false;

if (gabime.length) {
  deshtoi = true;
  console.error(`\n❌ ${gabime.length} referenca qe NUK ekzistojne ne baze:\n`);
  for (const g of gabime) {
    const rel = g.skedari.replace(process.cwd() + '/', '');
    console.error(`  ${rel}:${g.rreshti} — ${g.lloji} '${g.emri}'`);
    console.log(`::error file=${rel},line=${g.rreshti}::${g.lloji} '${g.emri}' nuk ekziston ne baze`);
  }
}

if (!vetekontrolli.ne_rregull) {
  deshtoi = true;
  console.error('\n❌ Baza ka funksione me referenca te prishura:\n');
  for (const x of vetekontrolli.prefiks_i_dyfishuar || []) {
    console.error(`  ${x.funksioni} — ${x.problemi}`);
    console.log(`::error::Funksioni '${x.funksioni}' ka prefiks te dyfishuar public.public.`);
  }
  for (const x of vetekontrolli.objekte_qe_mungojne || []) {
    console.error(`  ${x.funksioni} — i referohet '${x.objekti_qe_mungon}' qe nuk ekziston`);
    console.log(`::error::Funksioni '${x.funksioni}' i referohet '${x.objekti_qe_mungon}' qe nuk ekziston`);
  }
}

if (deshtoi) process.exit(1);
console.log('\n✅ Kontrata kod<->baze eshte e plote. Asnje referenca e thyer.');

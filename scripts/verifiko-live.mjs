#!/usr/bin/env node
/**
 * ROJTARI I DOMENIT PUBLIK
 *
 * PSE EKZISTON — dhe kjo eshte gjetja me e rende e gjithe projektit:
 *
 *   alpazar.al        -> 185.26.106.234, server Apache, faqe parkimi (noindex)
 *   alpazar.vercel.app-> 216.198.79.131, server Vercel, aplikacioni i vertete
 *
 * Domeni NUK ka qene kurre i lidhur me projektin ne Vercel. Cdo vendosje ka
 * qene e sukseshme, dhe asnje prej tyre nuk ka mundur te shihet kurre nga
 * perdoruesi, sepse ai viziton nje server krejt tjeter.
 *
 * Cdo kontroll ekzistues verifikonte Vercel-in. Asnje nuk verifikonte ate qe
 * sheh njeriu. Ky e ben pikerisht kete: krahason ndertimin qe sherbehet ne
 * domenin PUBLIK me ate qe sherbehet nga Vercel. Nese ndryshojne, bertet.
 */

const DOMENI_PUBLIK = process.env.DOMENI_PUBLIK || 'https://www.alpazar.al';
const DOMENI_VERCEL = process.env.DOMENI_VERCEL || 'https://alpazar.vercel.app';

async function merr(url) {
  const p = await fetch(url, {
    redirect: 'follow',
    headers: { 'cache-control': 'no-cache', 'user-agent': 'alpazar-rojtar/1' },
  });
  const teksti = await p.text();
  return { status: p.status, server: p.headers.get('server') || '?', teksti };
}

/** buildId-i i Next.js ndodhet te rrugët /_next/static/<buildId>/ */
function buildId(html) {
  const m = html.match(/\/_next\/static\/([A-Za-z0-9_-]{6,})\//);
  return m ? m[1] : null;
}

function eshteAplikacioni(html) {
  return html.includes('_next/static');
}

const probleme = [];

const [publik, vercel] = await Promise.all([
  merr(DOMENI_PUBLIK).catch((e) => ({ gabim: String(e) })),
  merr(DOMENI_VERCEL).catch((e) => ({ gabim: String(e) })),
]);

console.log(`Domeni publik : ${DOMENI_PUBLIK}`);
console.log(`Domeni Vercel : ${DOMENI_VERCEL}\n`);

if (vercel.gabim || !eshteAplikacioni(vercel.teksti || '')) {
  probleme.push(`Vercel-i nuk po sherben aplikacionin: ${vercel.gabim || 'pa _next/static'}`);
} else {
  console.log(`Vercel : ${vercel.status} | server=${vercel.server} | build=${buildId(vercel.teksti)}`);
}

if (publik.gabim) {
  probleme.push(`Domeni publik nuk u arrit: ${publik.gabim}`);
} else {
  const eshteApp = eshteAplikacioni(publik.teksti);
  console.log(`Publik : ${publik.status} | server=${publik.server} | build=${buildId(publik.teksti) ?? '—'}`);

  if (!eshteApp) {
    probleme.push(
      `${DOMENI_PUBLIK} NUK po sherben aplikacionin (server=${publik.server}). ` +
        'Domeni nuk eshte i lidhur me projektin ne Vercel, ose DNS-ja tregon diku tjeter. ' +
        'Asnje vendosje nuk mund te shihet nga perdoruesit derisa kjo te rregullohet.'
    );
  } else {
    const bPublik = buildId(publik.teksti);
    const bVercel = buildId(vercel.teksti);
    if (bPublik && bVercel && bPublik !== bVercel) {
      probleme.push(
        `Domeni publik sherben nje ndertim TE VJETER (${bPublik}) ndersa Vercel ka ${bVercel}. ` +
          'Zakonisht: cache i nderfaqes se CDN-se ose service worker i ngecur.'
      );
    }
  }
}

if (probleme.length) {
  console.error('\n❌ DOMENI PUBLIK NUK PASQYRON PRODHIMIN:\n');
  for (const p of probleme) {
    console.error(`  • ${p}`);
    console.log(`::error::${p}`);
  }
  process.exit(1);
}

console.log('\n✅ Domeni publik sherben te njejtin ndertim si Vercel.');

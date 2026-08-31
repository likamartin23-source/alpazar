/**
 * KONTROLLI I KOLONAVE TE FILTRAT — nxjerre si moduli i vet qe te jete i provueshem.
 *
 * PSE EKZISTON: më 1 shtator 2026 u mat se `app/api/payments/webhook/route.ts`
 * bënte `.from('profiles').select('id').eq('email', …)` — por `profiles` NUK ka
 * kolonë `email` (ai rri te `auth.users`). PostgREST kthen 42703, `data` mbetet
 * null, dhe pagesa binte GJITHMONË te 'review': dhënia automatike me email nuk
 * punoi kurrë. Kontrolli i kontratës nuk e kapi sepse shihte vetëm kolonat e
 * ndërvarura brenda `select('...,tabela(kol)')`, kurrë ato te filtrat.
 *
 * KONSERVATOR ME QËLLIM: një pozitiv i rremë këtu ndalon CI-në për asgjë, dhe
 * kujtesa e projektit e ka një mësim të shtrenjtë për detektuesit që s'kuptojnë
 * kontekstin. Prandaj kontrollohet VETËM kur rreshti ka saktësisht një `.from()`
 * të njohur, dhe vetëm emra kolonash krejtësisht të thjeshtë.
 */

const FILTRAT = /\.(eq|neq|gt|gte|lt|lte|is|in|like|ilike|order|contains|overlaps)\(\s*['"`]([^'"`]+)['"`]/g

/** @returns {{rresht:number, tabela:string, kolona:string}[]} */
export function kolonaTeGabuara(tekst, tabela) {
  const gabime = []
  tekst.split('\n').forEach((rreshti, i) => {
    const nga = [...rreshti.matchAll(/\.from\(\s*['"`]([a-z_][a-z0-9_]*)['"`]\s*\)/g)]
    if (nga.length !== 1) return              // zero ose disa → konteksti s'eshte i sigurt
    const t = nga[0][1]
    const kolonat = tabela[t]
    if (!Array.isArray(kolonat) || kolonat.length === 0) return
    const njohura = new Set(kolonat)

    for (const m of rreshti.matchAll(FILTRAT)) {
      const k = m[2].trim()
      // Vetem emra krejtesisht te thjeshte: pa pika, pa shigjeta, pa parantezа,
      // pa presje (renditje e shumefishte), pa hapesira.
      if (!/^[a-z_][a-z0-9_]*$/.test(k)) continue
      if (!njohura.has(k)) gabime.push({ rresht: i + 1, tabela: t, kolona: k })
    }
  })
  return gabime
}

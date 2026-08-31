import { describe, it, expect } from 'vitest'
// Modul .mjs pa deklarime tipash — sjellja testohet, jo tipi.
import { kolonaTeGabuara } from '../scripts/lib/kolonat.mjs'


const TABELA: Record<string, string[]> = {
  profiles: ['id', 'username', 'full_name', 'is_admin'],
  listings: ['id', 'title', 'price', 'user_id', 'created_at'],
}

describe('kolonaTeGabuara', () => {
  it('kap kolonen qe nuk ekziston te nje filter — defekti real i webhook-ut', () => {
    const kod = `const { data } = await db.from('profiles').select('id').eq('email', String(body.email)).maybeSingle()`
    expect(kolonaTeGabuara(kod, TABELA)).toEqual([{ rresht: 1, tabela: 'profiles', kolona: 'email' }])
  })

  it('nuk ankohet per kolona qe ekzistojne', () => {
    const kod = `supabase.from('listings').select('*').eq('user_id', uid).order('created_at')`
    expect(kolonaTeGabuara(kod, TABELA)).toEqual([])
  })

  it('hesht kur rreshti ka dy .from() — konteksti s\'eshte i sigurt', () => {
    const kod = `a.from('profiles').eq('email', x); b.from('listings').eq('title', y)`
    expect(kolonaTeGabuara(kod, TABELA)).toEqual([])
  })

  it('hesht per tabela qe s\'i njeh manifesti', () => {
    expect(kolonaTeGabuara(`x.from('e_panjohur').eq('cfaredo', 1)`, TABELA)).toEqual([])
  })

  it('nuk trajton si kolone shprehjet e ndërlikuara (pa pozitiva te rreme)', () => {
    const kod = `q.from('listings').order('created_at.desc,price.asc').eq('meta->>x', 1).in('id', ids)`
    expect(kolonaTeGabuara(kod, TABELA)).toEqual([])
  })

  it('kap disa gabime ne te njejtin rresht', () => {
    const kod = `db.from('profiles').eq('email', a).eq('phone', b)`
    expect(kolonaTeGabuara(kod, TABELA).map(g => g.kolona)).toEqual(['email', 'phone'])
  })
})

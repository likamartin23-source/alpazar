import { describe, it, expect } from 'vitest'
import { matchCategoryName, matchCategoryLocal } from '../app/listing/new/categoryMatch'

// Kategoritë reale nga baza (16) — id fiktive për test.
const CATS = [
  { id: 'c-automjete', name: 'Automjete' },
  { id: 'c-elektronike', name: 'Elektronike' },
  { id: 'c-gaming', name: 'Gaming' },
  { id: 'c-veshje', name: 'Veshje' },
  { id: 'c-mobilje', name: 'Mobilje' },
  { id: 'c-prona', name: 'Prona' },
  { id: 'c-kafshe', name: 'Kafshë' },
  { id: 'c-sport', name: 'Sport' },
  { id: 'c-ushqim', name: 'Ushqim' },
  { id: 'c-shendet', name: 'Shendet' },
  { id: 'c-arsim', name: 'Arsim' },
  { id: 'c-turizem', name: 'Turizem' },
  { id: 'c-sherbime', name: 'Shërbime' },
  { id: 'c-pune', name: 'Pune' },
  { id: 'c-biznese', name: 'Biznese' },
  { id: 'c-tjera', name: 'Te tjera' },
]

describe('matchCategoryName', () => {
  it('njeh makinat', () => {
    expect(matchCategoryName('Makinë Mercedes Benz 2015')).toBe('Automjete')
    expect(matchCategoryName('Shitet golf 4')).toBe('Automjete')
  })
  it('njeh elektronikën', () => {
    expect(matchCategoryName('iPhone 13 Pro Max')).toBe('Elektronike')
    expect(matchCategoryName('Laptop Dell i7')).toBe('Elektronike')
  })
  it('nuk ngatërron "top" me "laptop"', () => {
    // "laptop" nuk duhet të bjerë te Sport për shkak të fjalës "top"
    expect(matchCategoryName('Laptop HP')).toBe('Elektronike')
    // ndërsa një top i vërtetë futbolli → Sport
    expect(matchCategoryName('Top futbolli Nike')).toBe('Sport')
  })
  it('njeh pronat, kafshët, mobiljet', () => {
    expect(matchCategoryName('Apartament 2+1 me qira Tiranë')).toBe('Prona')
    expect(matchCategoryName('Këlysh qeni gjerman')).toBe('Kafshe')
    expect(matchCategoryName('Divan lëkure 3 vende')).toBe('Mobilje')
  })
  it('kthen null për titull të paqartë', () => {
    expect(matchCategoryName('Diçka e bukur')).toBeNull()
    expect(matchCategoryName('')).toBeNull()
  })
})

describe('matchCategoryLocal', () => {
  it('mapon te kategoria reale nga lista (toleron theksin: Kafshë)', () => {
    const c = matchCategoryLocal('Mace persiane', '', CATS)
    expect(c?.id).toBe('c-kafshe')
  })
  it('kthen null kur s’gjen (klienti bie te AI ose manuali)', () => {
    expect(matchCategoryLocal('xyz random', '', CATS)).toBeNull()
  })
  it('përdor edhe përshkrimin', () => {
    const c = matchCategoryLocal('Ofertë', 'Playstation 5 me 2 kontrollerë', CATS)
    expect(c?.id).toBe('c-gaming')
  })
})

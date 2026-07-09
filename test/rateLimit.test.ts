import { describe, it, expect } from 'vitest'
import { rateLimit, getClientIp } from '../lib/rateLimit'

// Regresion: rate-limit-i mbron endpoint-et e ndjeshme (admin, email, etj.).
// Këto teste sigurojnë që numërimi, bllokimi dhe rifreskimi i dritares punojnë.
describe('rateLimit', () => {
  it('lejon deri në limit, pastaj bllokon', () => {
    const key = `t-${Math.random()}`
    const opts = { limit: 3, windowMs: 60_000 }
    expect(rateLimit(key, opts).allowed).toBe(true)  // 1
    expect(rateLimit(key, opts).allowed).toBe(true)  // 2
    expect(rateLimit(key, opts).allowed).toBe(true)  // 3
    const blocked = rateLimit(key, opts)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('numëron remaining saktë', () => {
    const key = `t-${Math.random()}`
    const opts = { limit: 5, windowMs: 60_000 }
    expect(rateLimit(key, opts).remaining).toBe(4)
    expect(rateLimit(key, opts).remaining).toBe(3)
  })

  it('rifreskon pas dritares (windowMs të vogël)', async () => {
    const key = `t-${Math.random()}`
    const opts = { limit: 1, windowMs: 20 }
    expect(rateLimit(key, opts).allowed).toBe(true)
    expect(rateLimit(key, opts).allowed).toBe(false)
    await new Promise(r => setTimeout(r, 30))
    expect(rateLimit(key, opts).allowed).toBe(true) // dritarja u rifreskua
  })

  it('çelësa të ndryshëm janë të pavarur', () => {
    const a = `a-${Math.random()}`, b = `b-${Math.random()}`
    const opts = { limit: 1, windowMs: 60_000 }
    expect(rateLimit(a, opts).allowed).toBe(true)
    expect(rateLimit(b, opts).allowed).toBe(true) // b s'preket nga a
    expect(rateLimit(a, opts).allowed).toBe(false)
  })
})

describe('getClientIp', () => {
  it('merr IP-në e parë nga x-forwarded-for', () => {
    const req = new Request('http://x', { headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' } })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('bie te x-real-ip pastaj unknown', () => {
    const req1 = new Request('http://x', { headers: { 'x-real-ip': '9.9.9.9' } })
    expect(getClientIp(req1)).toBe('9.9.9.9')
    const req2 = new Request('http://x')
    expect(getClientIp(req2)).toBe('unknown')
  })
})

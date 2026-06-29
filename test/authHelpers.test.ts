import { describe, it, expect } from 'vitest'
import { detectType, toE164 } from '../lib/authHelpers'

describe('detectType', () => {
  it('detects email', () => {
    expect(detectType('email@x.com')).toBe('email')
  })
  it('detects Albanian mobile formats as phone', () => {
    expect(detectType('0688123456')).toBe('phone')
    expect(detectType('688123456')).toBe('phone')
    expect(detectType('+355688123456')).toBe('phone')
    expect(detectType('0035568812345')).toBe('phone')
  })
  it('ignores spaces, dashes and parens in phone', () => {
    expect(detectType('068 812-3456')).toBe('phone')
  })
  it('returns unknown for garbage', () => {
    expect(detectType('abc')).toBe('unknown')
    expect(detectType('123')).toBe('unknown')
  })
})

describe('toE164', () => {
  it('normalizes Albanian 0-prefixed mobile to +355', () => {
    expect(toE164('0688123456')).toBe('+355688123456')
  })
  it('normalizes bare mobile to +355', () => {
    expect(toE164('688123456')).toBe('+355688123456')
  })
  it('keeps an existing +', () => {
    expect(toE164('+355688123456')).toBe('+355688123456')
  })
  it('converts 00 prefix to +', () => {
    expect(toE164('0035568812345')).toBe('+35568812345')
  })
  it('strips formatting characters', () => {
    expect(toE164('068 812-3456')).toBe('+355688123456')
  })
})

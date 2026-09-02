import { describe, it, expect } from 'vitest'
import { identitySignals, showTrust } from '../app/components/identitySignals'

const recent = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() // < 30 ditë → anëtar i ri
const old = '2020-01-01T00:00:00Z'

const rich = {
  is_premium: true, has_boost: true,          // → tier vip
  is_admin: true,
  gamification_points: 135,                    // → nivel (≥100) + pikë
  created_at: recent,                          // → anëtar i ri
  shop_name: 'Dyqani',                         // → biznes
  trust_score_visible: true,
}

describe('identitySignals — burimi i vetëm i rregullit', () => {
  it('vizitori (isSelf=false) NUK sheh admin as verified (privatësi §4.6 / disponueshmëri)', () => {
    const keys = identitySignals(rich, { isSelf: false, emailVerified: true, activeListings: 3 }).map(s => s.key)
    expect(keys).not.toContain('admin')
    expect(keys).not.toContain('verified')
    // por sheh grupin publik të plotë
    expect(keys).toEqual(['tier', 'biznes', 'level', 'active', 'new', 'points'])
  })

  it('vetja (isSelf + emailVerified) sheh admin + verified në krye, në radhën e /profile', () => {
    const keys = identitySignals(rich, { isSelf: true, emailVerified: true, activeListings: 3 }).map(s => s.key)
    expect(keys).toEqual(['admin', 'verified', 'tier', 'biznes', 'level', 'active', 'new', 'points'])
  })

  it('tier: premium pa boost → premium; me boost → vip', () => {
    expect(identitySignals({ is_premium: true }).find(s => s.key === 'tier')?.tone).toBe('premium')
    expect(identitySignals({ is_premium: true, has_boost: true }).find(s => s.key === 'tier')?.tone).toBe('vip')
  })

  it('nivel: shfaqet vetëm në density=full DHE pts≥100', () => {
    expect(identitySignals({ gamification_points: 150 }, { density: 'full' }).some(s => s.key === 'level')).toBe(true)
    expect(identitySignals({ gamification_points: 150 }, { density: 'compact' }).some(s => s.key === 'level')).toBe(false)
    expect(identitySignals({ gamification_points: 50 }, { density: 'full' }).some(s => s.key === 'level')).toBe(false)
  })

  it('pikë: shfaqet kur >0, jo kur 0', () => {
    expect(identitySignals({ gamification_points: 5 }).some(s => s.key === 'points')).toBe(true)
    expect(identitySignals({ gamification_points: 0 }).some(s => s.key === 'points')).toBe(false)
  })

  it('anëtar i ri: brenda 30 ditësh po, i vjetër jo', () => {
    expect(identitySignals({ created_at: recent }).some(s => s.key === 'new')).toBe(true)
    expect(identitySignals({ created_at: old }).some(s => s.key === 'new')).toBe(false)
  })

  it('shitës aktiv: activeListings>0 → po', () => {
    expect(identitySignals({}, { activeListings: 2 }).some(s => s.key === 'active')).toBe(true)
    expect(identitySignals({}, { activeListings: 0 }).some(s => s.key === 'active')).toBe(false)
  })

  it('[O55/F1] shitës aktiv me isActiveSeller edhe kur shpalljet personale = 0 (shet përmes biznesit)', () => {
    expect(identitySignals({}, { activeListings: 0, isActiveSeller: true }).some(s => s.key === 'active')).toBe(true)
    expect(identitySignals({}, { activeListings: 0, isActiveSeller: false }).some(s => s.key === 'active')).toBe(false)
  })

  it('biznes: nga isBusiness ose shop_name', () => {
    expect(identitySignals({ shop_name: 'X' }).some(s => s.key === 'biznes')).toBe(true)
    expect(identitySignals({}, { isBusiness: true }).some(s => s.key === 'biznes')).toBe(true)
    expect(identitySignals({}).some(s => s.key === 'biznes')).toBe(false)
  })

  it('showTrust: default po; opt-out (false) → jo', () => {
    expect(showTrust({})).toBe(true)
    expect(showTrust({ trust_score_visible: false })).toBe(false)
  })

  it('subjekt bosh → asnjë sinjal', () => {
    expect(identitySignals(null)).toEqual([])
    expect(identitySignals(undefined)).toEqual([])
  })
})

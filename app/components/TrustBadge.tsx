'use client'

interface TrustBadgeProps {
  /** Burimi AUTORITATIV: `profiles.trust_score` nga baza. Kur jepet (>0), perdoret
   *  drejtperdrejt — keshtu i njejti numer shfaqet kudo (kartë, faqe shpalljeje, profil)
   *  dhe pajtohet me vulen ✓ te Avatar-it. Heuristika me poshte mbetet vetem fallback. */
  score?: number
  createdAt?: string
  listingsActive?: number
  gamificationPoints?: number
  compact?: boolean
}

/**
 * Llogarit Trust Score 0-100 bazuar në:
 * - Moshën e llogarisë (max 40 pikë)
 * - Numrin e shpalljeve aktive (max 30 pikë)
 * - Pikët e gamifikimit (max 30 pikë)
 *
 * Formula origjinale nga Notion:
 * (reviews_pozitive / total_reviews * 40) + (kohë_aktiv_muaj * 2) + (listings_aktive * 0.5)
 * Zbatuar me të dhënat ekzistuese derisa shtohet sistemi i reviews.
 */
function calcTrustScore(createdAt: string, listingsActive: number, gamificationPoints: number): number {
  const msPerMonth = 1000 * 60 * 60 * 24 * 30
  const monthsActive = Math.floor((Date.now() - new Date(createdAt).getTime()) / msPerMonth)

  const ageFactor     = Math.min(monthsActive * 2, 40)
  const listingFactor = Math.min(listingsActive * 0.5, 30)
  const pointsFactor  = Math.min(gamificationPoints / 100, 30)

  return Math.round(ageFactor + listingFactor + pointsFactor)
}

// Shkalla e BESIMIT — terma të veçantë nga çipat e identitetit, që të mos dyfishohen
// (urdhër pronari, 2 shtator 2026: "hiqe dyfishimin"). Më parë: '🆕 I ri' përplasej me çipin
// '🆕 Anëtar i ri', dhe '✅ I Verifikuar' përplasej me çipin '✓ Verifikuar' (is_verified).
// Kjo shkallë flet VETËM për besimin (histori/reputacion), jo për moshën apo verifikimin.
function trustLevel(score: number): { label: string; color: string; bg: string; icon: string } {
  if (score >= 80) return { label: 'Besim elitar',     color: '#7C3AED', bg: '#F3EEFF', icon: '🤝' }
  if (score >= 55) return { label: 'Shumë i besuar',   color: '#0E7A35', bg: '#E8F5E9', icon: '🌟' }
  if (score >= 30) return { label: 'I Besueshëm',      color: '#185FA5', bg: '#EEF4FF', icon: '🔵' }
  return               { label: 'Besim në rritje',     color: '#B45309', bg: '#FFF4E5', icon: '📈' }
}

export function TrustBadge({ score: scoreProp, createdAt, listingsActive = 0, gamificationPoints = 0, compact = false }: TrustBadgeProps) {
  // Burimi autoritativ (trust_score) prevalon; heuristika (moshë+shpallje+pikë) është fallback
  // vetëm kur s'ka score të ruajtur — deri sa sistemi i reviews ta mbushë plotësisht.
  // KUJDES: `profiles.trust_score` ka DEFAULT 0 dhe s'është populluar ende, pra 0 = "e pavendosur"
  // (sentinel), JO një zero autoritativ. Prandaj pragu është `> 0`: një 0 bie te heuristika.
  // Mos e ndrysho në `>= 0` — do t'i shfaqte TË GJITHË shitësit "Fillestar 0" dhe do vriste heuristikën.
  const computed = createdAt ? calcTrustScore(createdAt, listingsActive, gamificationPoints) : 0
  const score = (typeof scoreProp === 'number' && scoreProp > 0) ? Math.min(100, Math.round(scoreProp)) : computed
  const level = trustLevel(score)

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: level.bg, color: level.color,
        border: `1px solid ${level.color}33`,
        borderRadius: 'var(--r-btn)', padding: '2px 8px',
        fontSize: 'var(--fs-2xs)', fontWeight: 700,
      }}>
        <span aria-hidden="true">{level.icon}</span> {level.label}
      </span>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: level.bg, border: `1px solid ${level.color}33`,
      borderRadius: 'var(--r-btn)', padding: '9px 12px',
    }}>
      {/* Score ring */}
      <div style={{
        position: 'relative', width: 40, height: 40, flexShrink: 0,
      }}>
        <svg width="40" height="40" aria-hidden="true" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="20" cy="20" r="16" fill="none" stroke="#e0e0e0" strokeWidth="3.5" />
          <circle
            cx="20" cy="20" r="16" fill="none"
            stroke={level.color} strokeWidth="3.5"
            strokeDasharray={`${(score / 100) * 100.53} 100.53`}
            strokeLinecap="round"
          />
        </svg>
        <span style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--fs-xs)', fontWeight: 800, color: level.color,
        }}>{score}</span>
      </div>

      <div>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: level.color }}>
          <span aria-hidden="true">{level.icon}</span> {level.label}
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: '#555', marginTop: 2 }}>
          Besueshmëria {score}/100
        </div>
      </div>
    </div>
  )
}

export { calcTrustScore }

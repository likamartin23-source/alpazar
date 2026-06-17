'use client'

interface TrustBadgeProps {
  createdAt: string
  listingsActive: number
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

function getLevel(score: number): { label: string; color: string; bg: string; icon: string } {
  if (score >= 80) return { label: 'Shitës Ekspert',   color: '#7C3AED', bg: '#F3EEFF', icon: '🏆' }
  if (score >= 55) return { label: 'I Verifikuar',     color: '#0E7A35', bg: '#E8F5E9', icon: '✅' }
  if (score >= 30) return { label: 'I Besueshëm',      color: '#185FA5', bg: '#EEF4FF', icon: '🔵' }
  return               { label: 'Fillestar',           color: '#B45309', bg: '#FFF4E5', icon: '🆕' }
}

export function TrustBadge({ createdAt, listingsActive, gamificationPoints = 0, compact = false }: TrustBadgeProps) {
  const score = calcTrustScore(createdAt, listingsActive, gamificationPoints)
  const level = getLevel(score)

  if (compact) {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: level.bg, color: level.color,
        border: `1px solid ${level.color}33`,
        borderRadius: 9, padding: '2px 8px',
        fontSize: 9.5, fontWeight: 700,
      }}>
        {level.icon} {level.label}
      </span>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: level.bg, border: `1px solid ${level.color}33`,
      borderRadius: 10, padding: '9px 12px',
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
          fontSize: 10, fontWeight: 800, color: level.color,
        }}>{score}</span>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: level.color }}>
          {level.icon} {level.label}
        </div>
        <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
          Trust Score {score}/100
        </div>
      </div>
    </div>
  )
}

export { calcTrustScore }

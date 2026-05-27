'use client'

// Sistemi i niveleve — llogaritet nga gamification_points (pa ndryshime në DB)
export type LevelInfo = { key: string; name: string; icon: string; color: string; bg: string }

export function getLevel(points = 0): LevelInfo {
  if (points >= 1000) return { key: 'master',    name: 'Master',    icon: '💎', color: '#7C3AED', bg: '#F3ECFE' }
  if (points >= 400)  return { key: 'ekspert',   name: 'Ekspert',   icon: '🏆', color: '#E63312', bg: '#FFF0EE' }
  if (points >= 100)  return { key: 'tregtar',   name: 'Tregtar',   icon: '⚡', color: '#185FA5', bg: '#EEF4FF' }
  return                     { key: 'fillestar', name: 'Fillestar', icon: '🌱', color: '#3B6D11', bg: '#EAF3DE' }
}

// A është anëtar i ri (< 30 ditë)
export function isNewMember(createdAt?: string): boolean {
  if (!createdAt) return false
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 3600 * 1000
}

type Badge = { label: string; bg: string; color: string }

export type BadgeInput = {
  is_admin?: boolean
  is_premium?: boolean
  shop_name?: string | null
  gamification_points?: number
  created_at?: string
  verified?: boolean        // telefon/email i konfirmuar (kalohet nga thirrësi)
  activeListings?: number    // numri i shpalljeve aktive
  showLevel?: boolean        // shfaq edhe etiketën e nivelit
}

export function buildBadges(p: BadgeInput): Badge[] {
  const out: Badge[] = []
  if (p.is_admin)  out.push({ label: '🛡 Admin',    bg: '#F3ECFE', color: '#7C3AED' })
  if (p.verified)  out.push({ label: '✓ Verifikuar', bg: '#EAF3DE', color: '#3B6D11' })
  if (p.is_premium) out.push({ label: '👑 Premium',  bg: '#FEF6DA', color: '#A87900' })
  if (p.shop_name) out.push({ label: '🏪 Dyqan',     bg: '#E7F8F1', color: '#0B8A5A' })
  if (p.showLevel) {
    const lvl = getLevel(p.gamification_points || 0)
    out.push({ label: `${lvl.icon} ${lvl.name}`, bg: lvl.bg, color: lvl.color })
  }
  if ((p.activeListings ?? 0) > 0) out.push({ label: '📦 Shitës aktiv', bg: '#EEF4FF', color: '#185FA5' })
  if (isNewMember(p.created_at))   out.push({ label: '🆕 Anëtar i ri',  bg: '#FFF4E5', color: '#B45309' })
  return out
}

export function UserBadges({ profile, size = 'md', max }: { profile: BadgeInput; size?: 'sm' | 'md'; max?: number }) {
  let badges = buildBadges(profile)
  if (max) badges = badges.slice(0, max)
  if (badges.length === 0) return null
  const fs = size === 'sm' ? 9 : 10
  const pad = size === 'sm' ? '2px 7px' : '4px 10px'
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: size === 'sm' ? 5 : 8, justifyContent: 'inherit' }}>
      {badges.map((b, i) => (
        <span key={i} style={{
          fontSize: fs, padding: pad, borderRadius: 12, fontWeight: 700,
          background: b.bg, color: b.color, whiteSpace: 'nowrap', lineHeight: 1.3,
        }}>{b.label}</span>
      ))}
    </div>
  )
}

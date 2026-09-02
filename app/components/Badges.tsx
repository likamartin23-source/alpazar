'use client'

// Sistemi i niveleve — llogaritet nga gamification_points (pa ndryshime në DB).
// `min` = pragu i pikëve; e ekspozuar që shiriti i progresit te /referral ta ripërdorë
// (më parë /referral kishte një `LEVELS` të vetën me ngjyra të ndryshme — jashtë harmonisë).
// BURIM I VETËM i shkallës: emra, ikona, ngjyra, pragje — një vend.
export type LevelInfo = { key: string; name: string; icon: string; color: string; bg: string; min: number }

export const LEVELS: LevelInfo[] = [
  { key: 'fillestar', name: 'Fillestar', icon: '🌱', color: '#3B6D11', bg: '#EAF3DE', min: 0 },
  { key: 'tregtar',   name: 'Tregtar',   icon: '⚡', color: '#185FA5', bg: '#EEF4FF', min: 100 },
  { key: 'ekspert',   name: 'Ekspert',   icon: '🏆', color: '#C42B0F', bg: '#FFF0EE', min: 400 },
  { key: 'master',    name: 'Master',    icon: '💎', color: '#7C3AED', bg: '#F3ECFE', min: 1000 },
]

export function getLevel(points = 0): LevelInfo {
  let lvl = LEVELS[0]
  for (const l of LEVELS) if (points >= l.min) lvl = l
  return lvl
}

// A është anëtar i ri (< 30 ditë)
export function isNewMember(createdAt?: string): boolean {
  if (!createdAt) return false
  return Date.now() - new Date(createdAt).getTime() < 30 * 24 * 3600 * 1000
}

// A është online (last_seen brenda 3 minutave)
export function isOnline(lastSeen?: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 3 * 60 * 1000
}

// `buildBadges`/`UserBadges` u HOQËN (2 shtator 2026): ishin një renderues PARALEL i
// vulave (F1 — dy zbatime), i pathirrur nga asnjë rresht kodi, me Premium 👑 dhe ngjyra
// të sheshta — kundër vendimit ⭐ Premium / 👑 VIP dhe fjalorit të vetëm IdentityBadges.
// Renderuesi i vetëm i vulave është `IdentityBadges`. Nga ky skedar mbeten vetëm
// ndihmësit e përbashkët: LEVELS/getLevel (shkalla), isNewMember, isOnline.

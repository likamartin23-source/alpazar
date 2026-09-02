'use client'

import { TrustBadge } from './TrustBadge'
import { identitySignals, showTrust, type SignalSubject } from './identitySignals'

/**
 * SHENJAT E IDENTITETIT — lëkura chip() e /u mbi RREGULLIN E VETËM (`identitySignals`).
 *
 * §4-bis / [O46]: rregulli (CILAT vula · emrat shqip · pragjet · radha · konteksti) jeton NJË herë
 * te `identitySignals.ts`; këtu vetëm e vizatojmë me lëkurën pastel të /u. Faqet e tjera (/profile
 * .badge · /listing .schip · /biznese .bdg) e marrin TË NJËJTIN rregull dhe e vizatojnë me lëkurën
 * e vet — pra grupi i plotë del kudo (si te /profile), skinet e bukura mbeten.
 *
 * Prania online NUK është këtu — udhëton me rrethin te `Avatar`. TrustBadge (Besueshmëria) është
 * komponent i përbashkët veç, i njëjti kudo, i qeverisur nga i njëjti kusht (`showTrust`).
 */
export type IdentitySubject = SignalSubject

// Lëkura e /u: një ngjyrë çip për secilin `tone` të rregullit. (Niveli i merr ngjyrat nga getLevel.)
const TONE: Record<string, { bg: string; color: string; border: string }> = {
  admin:    { bg: '#EDE9FE', color: '#6D28D9', border: '#6D28D933' },
  verified: { bg: '#E8F5E9', color: '#0E7A35', border: '#0E7A3533' },
  vip:      { bg: '#F3E8FF', color: '#7C3AED', border: '#7C3AED33' },
  premium:  { bg: '#FFF3D6', color: '#7A4A00', border: '#F5C84255' },
  biznes:   { bg: '#E7F0FF', color: '#1D4ED8', border: '#1D4ED833' },
  active:   { bg: '#E7F6EC', color: '#0E7A35', border: '#0E7A3533' },
  new:      { bg: '#FFF4E5', color: '#B45309', border: '#F5C84255' },
  points:   { bg: '#FFF8E1', color: '#7A4A00', border: '#F5C84255' },
}

const chip = (bg: string, color: string, border: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, fontWeight: 700,
  borderRadius: 9, padding: '4px 10px', background: bg, color, border: `1px solid ${border}`, whiteSpace: 'nowrap',
})

export function IdentityBadges({
  subject,
  activeListings = 0,
  isBusiness = false,
  density = 'full',
  isSelf = false,
  emailVerified = false,
  isActiveSeller = false,
}: {
  subject: IdentitySubject
  activeListings?: number
  isBusiness?: boolean
  density?: 'full' | 'compact'
  isSelf?: boolean
  emailVerified?: boolean
  isActiveSeller?: boolean
}) {
  const signals = identitySignals(subject, { isSelf, emailVerified, isBusiness, activeListings, isActiveSeller, density })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {signals.map(s => {
        const c = s.tone === 'level'
          ? { bg: s.levelBg || '#F1F5F9', color: s.levelColor || '#334155', border: (s.levelColor || '#334155') + '33' }
          : TONE[s.tone]
        return (
          <span key={s.key} style={chip(c.bg, c.color, c.border)} role="img" aria-label={s.label}>
            <span aria-hidden="true">{s.icon}</span> {s.label}
          </span>
        )
      })}
      {showTrust(subject) && (
        <TrustBadge createdAt={subject.created_at} listingsActive={activeListings} gamificationPoints={subject.gamification_points || 0} />
      )}
    </div>
  )
}

'use client'

import { TrustBadge } from './TrustBadge'
import { getLevel } from './Badges'
import { tierNgaProfili } from './Avatar'

/**
 * SHENJAT E IDENTITETIT — një fjalor i VETËM për të gjitha sipërfaqet (§4-bis / [O39]).
 *
 * Më parë secila faqe (/u, /profile, /biznese, /listing, kartat) vendoste VETË cilat vula
 * identiteti shfaqte dhe si i quante — i njëjti sistem dilte "Besueshmëria" te njëra dhe
 * "Trust Score" te tjetra, "⚡ Tregtar" vetëm te /profile, pikët vetëm te disa. Ky komponent
 * kthen TË NJËJTIN grup vulash kudo, me TË NJËJTAT emërtime shqip; faqja vendos vetëm DENSITETIN
 * (sa), jo CILAT. Burimet janë të njëjtat që përdoreshin: tierNgaProfili · trust_score ·
 * gamification_points · has active listings. (Motra e LISTING_SELECT për projeksionin.)
 *
 * Prania online NUK është këtu — ajo udhëton me rrethin te `Avatar` (pika poshtë-majtas).
 */
export type IdentitySubject = {
  is_premium?: boolean | null
  has_boost?: boolean | null
  premium_expires_at?: string | null
  boost_expires_at?: string | null
  is_verified?: boolean | null
  trust_score?: number | null
  trust_score_visible?: boolean | null
  gamification_points?: number | null
  created_at?: string | null
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
}: {
  subject: IdentitySubject
  activeListings?: number
  isBusiness?: boolean
  density?: 'full' | 'compact'
}) {
  const tier = tierNgaProfili(subject)
  const pts = subject.gamification_points || 0
  const lvl = getLevel(pts)
  const showTrust = subject.trust_score_visible !== false

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {tier === 'vip'
        ? <span style={chip('#F3E8FF', '#7C3AED', '#7C3AED33')} role="img" aria-label="VIP Ekstra Boost"><span aria-hidden="true">👑</span> VIP Ekstra Boost</span>
        : tier === 'premium' && <span style={chip('#FFF3D6', '#7A4A00', '#F5C84255')} role="img" aria-label="Premium"><span aria-hidden="true">⭐</span> Premium</span>}
      {isBusiness && (
        <span style={chip('#E7F0FF', '#1D4ED8', '#1D4ED833')} role="img" aria-label="Biznes"><span aria-hidden="true">🏢</span> Biznes</span>
      )}
      {showTrust && (
        <TrustBadge createdAt={subject.created_at} listingsActive={activeListings} gamificationPoints={pts} />
      )}
      {/* Niveli (⚡ Tregtar/Ekspert/Master) vetëm në densitet të plotë dhe kur ka kaluar Fillestarin
          (pts≥100) — përndryshe "🌱 Fillestar" për këdo është zhurmë. */}
      {density === 'full' && pts >= 100 && (
        <span style={chip(lvl.bg, lvl.color, lvl.color + '33')} role="img" aria-label={`Niveli ${lvl.name}`}><span aria-hidden="true">{lvl.icon}</span> {lvl.name}</span>
      )}
      {pts > 0 && (
        <span style={chip('#FFF8E1', '#7A4A00', '#F5C84255')} aria-label={`${pts} pikë`}><span aria-hidden="true">⚡</span> {pts} pikë</span>
      )}
      {activeListings > 0 && (
        <span style={chip('#E7F6EC', '#0E7A35', '#0E7A3533')} role="img" aria-label="Shitës aktiv"><span aria-hidden="true">📦</span> Shitës aktiv</span>
      )}
    </div>
  )
}

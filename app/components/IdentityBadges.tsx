'use client'

import { TrustBadge } from './TrustBadge'
import { getLevel } from './Badges'
import { tierNgaProfili } from './Avatar'

/**
 * SHENJAT E IDENTITETIT — një fjalor i VETËM për të gjitha sipërfaqet (§4-bis / [O39]).
 *
 * Më parë secila faqe (/u, /profile, /biznese, /listing) vendoste VETË cilat vula shfaqte
 * dhe si i quante. Matur te [O43]/[O46]: PESË fjalorë paralelë — `.schip .sch-*`,
 * `.badge .b-*`, `.bdg`+inline, inline i pastër, dhe ky komponent.
 *
 * GRUPI REFERENCË është `/profile` (urdhër i pronarit, 2 shtator 2026: *"profili i adminit
 * pothuajse i ka të gjithë"*). Prandaj komponenti u zgjerua derisa ta mbulojë TË TËRIN —
 * `isAdmin`, `isVerified`, `isNewMember`, `isActiveSeller`, `isPrivateChat`, `rating` —
 * PARA se ndonjë sipërfaqe të migrojë. Migrimi pa këtë zgjerim do të hiqte vula = regres.
 *
 * IKONA e Premium-it është `👑`, jo `⭐`: kështu e kanë sot `/profile`, `/listing` dhe
 * `/biznese` (tri nga katër). Ndryshimi do të ishte i dukshëm pa e kërkuar askush.
 *
 * NIVELI ndjek densitetin: te profilet (`full`) shfaqet gjithmonë, si te `/profile`;
 * te çipat e ngushtë (`compact`) vetëm mbi 100 pikë, që «🌱 Fillestar» të mos bëhet zhurmë.
 *
 * Prania online NUK është këtu — ajo udhëton me rrethin te `Avatar`.
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
  isAdmin = false,
  isVerified,
  isNewMember = false,
  isActiveSeller,
  isPrivateChat = false,
  rating,
}: {
  subject: IdentitySubject
  activeListings?: number
  isBusiness?: boolean
  density?: 'full' | 'compact'
  /** 🛡 Admin — e kishin vetëm `/profile` dhe `/listing`. */
  isAdmin?: boolean
  /** ✓ Verifikuar — kur s'jepet, bie te `subject.is_verified`. */
  isVerified?: boolean
  /** 🆕 Anëtar i ri — e llogarit faqja (`isNewMember(created_at)`). */
  isNewMember?: boolean
  /** 📦 Shitës aktiv — IDENTITET, jo numër. Kur s'jepet, bie te `activeListings > 0`.
   *  Nevojitet sepse `/u` numëron vetëm shpalljet PERSONALE (`business_id is null`,
   *  Vendimi 7): një pronar që shet përmes biznesit ka 0 aty, por ËSHTË shitës aktiv.
   *  Matur live te [O55]. */
  isActiveSeller?: boolean
  /** 🔒 Bisedë private — kontekstuale, vetëm te `/listing`. */
  isPrivateChat?: boolean
  /** ★ Vlerësimi — vetëm biznesi e ka. */
  rating?: { avg: number; count: number } | null
}) {
  const tier = tierNgaProfili(subject)
  const pts = subject.gamification_points || 0
  const lvl = getLevel(pts)
  const showTrust = subject.trust_score_visible !== false
  const verified = isVerified ?? !!subject.is_verified
  const shitesAktiv = isActiveSeller ?? activeListings > 0
  const trego = (t: string) => (
    <span style={chip('#F4F4F5', '#3F3F46', '#3F3F4633')} role="img" aria-label={t}>
      <span aria-hidden="true">🔒</span> {t}
    </span>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {isAdmin && (
        <span style={chip('#EDE9FE', '#6D28D9', '#6D28D933')} role="img" aria-label="Admin"><span aria-hidden="true">🛡</span> Admin</span>
      )}
      {verified && (
        <span style={chip('#DCFCE7', '#15803D', '#15803D33')} role="img" aria-label="I verifikuar"><span aria-hidden="true">✓</span> Verifikuar</span>
      )}
      {tier === 'vip'
        ? <span style={chip('#F3E8FF', '#7C3AED', '#7C3AED33')} role="img" aria-label="VIP"><span aria-hidden="true">👑</span> VIP</span>
        : tier === 'premium' && <span style={chip('#FFF3D6', '#7A4A00', '#F5C84255')} role="img" aria-label="Premium"><span aria-hidden="true">👑</span> Premium</span>}
      {isBusiness && (
        <span style={chip('#E7F0FF', '#1D4ED8', '#1D4ED833')} role="img" aria-label="Biznes"><span aria-hidden="true">🏢</span> Biznes</span>
      )}
      {showTrust && (
        <TrustBadge createdAt={subject.created_at} listingsActive={activeListings} gamificationPoints={pts} />
      )}
      {rating && rating.count > 0 && (
        <span style={chip('#FFF8E1', '#7B5000', '#F5C84255')} aria-label={`Vlerësimi ${rating.avg.toFixed(1)} nga ${rating.count}`}>
          <span aria-hidden="true">★</span> {rating.avg.toFixed(1)} <span style={{ fontWeight: 600, opacity: .8 }}>({rating.count})</span>
        </span>
      )}
      {(density === 'full' || pts >= 100) && (
        <span style={chip(lvl.bg, lvl.color, lvl.color + '33')} role="img" aria-label={`Niveli ${lvl.name}`}><span aria-hidden="true">{lvl.icon}</span> {lvl.name}</span>
      )}
      {pts > 0 && (
        <span style={chip('#FFF8E1', '#7A4A00', '#F5C84255')} aria-label={`${pts} pikë`}><span aria-hidden="true">⚡</span> {pts} pikë</span>
      )}
      {shitesAktiv && (
        <span style={chip('#E7F6EC', '#0E7A35', '#0E7A3533')} role="img" aria-label="Shitës aktiv"><span aria-hidden="true">📦</span> Shitës aktiv</span>
      )}
      {isNewMember && (
        <span style={chip('#FFF1E6', '#B4530A', '#B4530A33')} role="img" aria-label="Anëtar i ri"><span aria-hidden="true">🆕</span> Anëtar i ri</span>
      )}
      {isPrivateChat && trego('Bisedë private')}
    </div>
  )
}

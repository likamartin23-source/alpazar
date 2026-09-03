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
 * IKONA (vendim pronari, 2 shtator): Premium = `⭐`, VIP = `👑` — si unaza e Avatar-it
 * (★ premium, 👑 VIP). Dallon qartë dy nivelet ("stili avatar").
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

const chip = (bg: string, color: string, border: string, shadow?: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-base)', fontWeight: 700,
  borderRadius: 'var(--r-btn)', padding: '4px 10px', background: bg, color,
  border: border === 'none' ? 'none' : `1px solid ${border}`, whiteSpace: 'nowrap',
  ...(shadow ? { boxShadow: shadow } : {}),
})

/* FORMAT E BUKURA (urdhër pronari, 2 shtator 2026: "rikthe format e bukura që ishin").
 * Skini i vjetër i /profile-it kishte gradientë të pasur — konsolidimi [O57] i rrafshoi
 * në pastel. Këtu rikthehet bukuria PA thyer fjalorin e vetëm: Premium = gradient ari,
 * VIP = ari→qelibar (më i ngrohtë, "më lart"), Admin = vjollcë e gjallë. Kontrasti u mat:
 * #5A3A00 mbi ar ≈ 8:1, #fff mbi #7C3AED = 5.7:1. */
export const CHIP_PREMIUM = chip('linear-gradient(135deg,#F8D24E,#F5C842)', '#5A3A00', 'none', '0 1px 4px rgba(245,200,66,.5)')
export const CHIP_VIP     = chip('linear-gradient(135deg,#F5C842,#E8892E)', '#4A2400', 'none', '0 1px 5px rgba(232,137,46,.45)')
const CHIP_ADMIN   = chip('#7C3AED', '#fff', 'none', '0 1px 4px rgba(124,58,237,.4)')

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
        <span style={CHIP_ADMIN} role="img" aria-label="Admin"><span aria-hidden="true">🛡</span> Admin</span>
      )}
      {verified && (
        <span style={chip('#DCFCE7', '#15803D', '#15803D33')} role="img" aria-label="I verifikuar"><span aria-hidden="true">✓</span> Verifikuar</span>
      )}
      {tier === 'vip'
        ? <span style={CHIP_VIP} role="img" aria-label="VIP"><span aria-hidden="true">👑</span> VIP</span>
        : tier === 'premium' && <span style={CHIP_PREMIUM} role="img" aria-label="Premium"><span aria-hidden="true">⭐</span> Premium</span>}
      {isBusiness && (
        <span style={chip('#E7F0FF', '#1D4ED8', '#1D4ED833')} role="img" aria-label="Biznes"><span aria-hidden="true">🏢</span> Biznes</span>
      )}
      {showTrust && (
        // `score` autoritativ nga baza (modeli i plotë: vlerësime+referime+raportime+porosi+
        // verifikim+moshë+pikë). Kur >0 përdoret drejtpërdrejt; përndryshe TrustBadge bie te
        // heuristika (moshë+shpallje+pikë) derisa modeli të mbushet. Kështu UI-ja tregon
        // besueshmërinë E VËRTETË, jo një përafrim të pjesshëm.
        <TrustBadge score={subject.trust_score ?? undefined} createdAt={subject.created_at} listingsActive={activeListings} gamificationPoints={pts} />
      )}
      {rating && rating.count > 0 && (
        <span style={chip('#FFF8E1', '#7B5000', '#F5C84255')} aria-label={`Vlerësimi ${rating.avg.toFixed(1)} nga ${rating.count}`}>
          <span aria-hidden="true">★</span> {rating.avg.toFixed(1)} <span style={{ fontWeight: 600 }}>({rating.count})</span>
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

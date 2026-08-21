'use client'
import { useState } from 'react'

/**
 * ALPAZAR — Avatar origjinal
 *
 * Unaze statusi + badge (✓ / 🏢) + iniciale elegante kur s'ka foto.
 * Nje komponent, perdorim i njetrajtshem kudo (shpallje, profil, biznes,
 * mesazhe, kryefaqe).
 *
 * DY VETI, JO NJE (Vendimi 1 i planit te harmonizimit):
 *
 *   `type` = KUSH eshte      → person | business
 *   `tier` = SA VLEN abonimi → free | premium | vip
 *
 * Me pare te dyja ishin ngjeshur ne nje varg te vetem ('user' | 'premium' |
 * 'business'), ndaj nje biznes premium dhe nje biznes falas dukeshin njesoj,
 * dhe VIP-i nuk shprehej dot fare. Identiteti dhe abonimi jane dy boshte te
 * ndryshem; ngjeshja e tyre e bente te pamundur shfaqjen e njerit pa humbur
 * tjetrin.
 *
 * Alias-et e vjetra NUK u ruajten me qellim: pa to, `tsc` e ndal ndertimin te
 * cdo call-site i pambuluar. Nje alias do ta linte call-site-in e harruar te
 * renderonte unaze te gabuar ne heshtje — pikerisht demi qe kerkojme te
 * shmangim.
 *
 * Rregullat Alpazar: CSS inline, JO Tailwind, JO `@/`, font Plus Jakarta Sans.
 */

export type AvatarType = 'person' | 'business'
export type AvatarTier = 'free' | 'premium' | 'vip'

interface AvatarProps {
  src?: string | null
  name?: string | null
  type?: AvatarType
  tier?: AvatarTier
  verified?: boolean
  size?: number
  onClick?: () => void
}

/**
 * Pasqyre e sakte e `public.owner_rank_tier(uuid)` te baza:
 *
 *   2 (vip)     — has_boost AKTIV **dhe** is_premium AKTIV
 *   1 (premium) — is_premium AKTIV
 *   0 (free)    — perndryshe
 *
 * "Aktiv" do te thote flamuri i ndezur DHE afati ose bosh ose ne te ardhmen.
 * VIP-i kerkon te dyja: nje boost pa premium nuk eshte VIP.
 *
 * KUJDES: nese `owner_rank_tier` ndryshon ne baze, ky funksion duhet ndryshuar
 * bashke me te. Perndryshe unaza thote nje gje dhe renditja e shpalljeve
 * (`rank_tier`) nje tjeter — dhe perdoruesi sheh nje premtim qe sistemi nuk e
 * mban.
 */
export function tierNgaProfili(p?: {
  is_premium?: boolean | null
  premium_expires_at?: string | null
  has_boost?: boolean | null
  boost_expires_at?: string | null
} | null): AvatarTier {
  if (!p) return 'free'
  const aktiv = (flamur?: boolean | null, afat?: string | null) =>
    !!flamur && (!afat || new Date(afat).getTime() > Date.now())

  const premium = aktiv(p.is_premium, p.premium_expires_at)
  if (premium && aktiv(p.has_boost, p.boost_expires_at)) return 'vip'
  return premium ? 'premium' : 'free'
}

/** Tier-i i nje shpalljeje kur e kemi `rank_tier` te gatshem nga baza. */
export function tierNgaRankTier(rank?: number | null): AvatarTier {
  if (rank === 2) return 'vip'
  if (rank === 1) return 'premium'
  return 'free'
}

function getInitials(name?: string | null): string {
  if (!name) return '?'
  const clean = name.replace(/[_\-.]/g, ' ').trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Ari i VIP-it (BLLOKU 21 gusht, Imazhi 1: VIP = ari→kuqe + kurore). */
const ARI = '#D4AF37'

/**
 * BLLOKU §2 (vendim i ngrire): "unaza = identiteti i PERDORUESIT; biznesi
 * trashegon TE NJEJTEN unaze + shenje ndertese". Prandaj unaza varet VETEM nga
 * `tier`; `type` shton vetem badge-in 🏢 — biznesi s'ka me ngjyra te vetat.
 * Matrica (Imazhi 1): falas gri (pa vule) · premium e verdhe + ★ · VIP ari→kuqe + kurore.
 */
function ringStyle(tier: AvatarTier): React.CSSProperties {
  if (tier === 'vip')     return { background: `linear-gradient(135deg,${ARI},#E63312)` }
  if (tier === 'premium') return { background: 'linear-gradient(135deg,#F5C842,#E63312)' }
  return { background: '#e2e2e2' }
}

/**
 * Pulsimi i unazes VIP (BLLOKU §3.3). Keyframes s'behen dot me stil inline,
 * ndaj injektohet nje <style> i vogel vetem kur ka VIP. `prefers-reduced-motion`
 * e fik — leviza e vazhdueshme s'i imponohet kujt qe e ka refuzuar (a11y).
 */
const VIP_PULSE_CSS = `
@keyframes alpzVipPulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}50%{box-shadow:0 0 0 6px rgba(212,175,55,0)}}
.alpz-vip-ring{animation:alpzVipPulse 2.2s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.alpz-vip-ring{animation:none}}
`

export default function Avatar({
  src, name, type = 'person', tier = 'free', verified = false, size = 48, onClick,
}: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const showImage = src && !broken
  const ring = Math.max(2, Math.round(size * 0.07))
  const white = Math.max(1, Math.round(size * 0.04))
  const inner = size - ring * 2 - white * 2
  const badge = Math.round(size * 0.34)
  const initialsFont = Math.round(inner * 0.4)

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter' || e.key === ' ') onClick() }) : undefined}
      style={{ position: 'relative', width: size, height: size, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {tier === 'vip' && <style dangerouslySetInnerHTML={{ __html: VIP_PULSE_CSS }} />}
      <div className={tier === 'vip' ? 'alpz-vip-ring' : undefined} style={{ width: size, height: size, borderRadius: '50%', padding: ring, boxSizing: 'border-box', ...ringStyle(tier), transition: 'transform .15s ease' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', padding: white, boxSizing: 'border-box' }}>
          {showImage ? (
            <img src={src as string} alt={name || 'avatar'} loading="lazy" onError={() => setBroken(true)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,#F5C842,#E63312)', color: '#fff', fontWeight: 800, fontSize: initialsFont, letterSpacing: 0.5, userSelect: 'none' }}>
              {getInitials(name)}
            </div>
          )}
        </div>
      </div>

      {/* Vula e abonimit rri lart-djathtas, qe te mos perplaset me badge-in e
          identitetit poshte-djathtas: thone dy gjera te ndryshme (abonim vs
          identitet) dhe duhen lexuar te dyja njeheresh. Matrica (Imazhi 1):
          VIP → 👑 mbi ari · premium → ★ mbi te verdhe · falas → pa vule. */}
      {tier === 'vip' && (
        <div
          role="img" aria-label="VIP"
          style={{ position: 'absolute', right: -2, top: -2, width: badge, height: badge, borderRadius: '50%', background: ARI, border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(badge * 0.5), lineHeight: 1 }}>
          <span aria-hidden="true">👑</span>
        </div>
      )}
      {tier === 'premium' && (
        <div
          role="img" aria-label="Premium"
          style={{ position: 'absolute', right: -2, top: -2, width: badge, height: badge, borderRadius: '50%', background: '#F5C842', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(badge * 0.55), color: '#7A4A00', lineHeight: 1 }}>
          <span aria-hidden="true">★</span>
        </div>
      )}

      {(type === 'business' || verified) && (
        <div role="img" aria-label={verified ? 'I verifikuar' : 'Biznes'} style={{ position: 'absolute', right: -2, bottom: -2, width: badge, height: badge, borderRadius: '50%', background: verified ? '#16a34a' : '#111', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(badge * 0.55), color: '#fff', lineHeight: 1 }}>
          {verified ? <span aria-hidden='true'>✓</span> : <span aria-hidden='true'>🏢</span>}
        </div>
      )}
    </div>
  )
}

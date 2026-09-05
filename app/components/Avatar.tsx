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
  /** Prania LIVE (BLLOKU Imazhi 1/2): pikë jeshile kur përdoruesi është online.
   *  `undefined` → asnjë pikë (fail-soft, pa gjendje të panjohur si "offline"). */
  online?: boolean
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

/**
 * ✓ VERIFIKUAR — nje perkufizim i VETEM per unazen (Avatar) dhe cipin (IdentityBadges).
 *
 * Gjendja e gjetur (inventari i 2 shtatorit 2026): ✓-ja llogaritej ne KATER menyra —
 * `trust≥60` te shumica e unazave, `is_verified||trust≥60` te /u, `is_verified` te cipat,
 * dhe `email/telefon i konfirmuar` te /profile (mbi-pohim). Unaza dhe cipi mund te
 * kundershtonin njeri-tjetrin ne te NJEJTIN avatar.
 *
 * Vendim pronari (2 shtator): person = **is_verified OSE trust≥60**; biznes = **is_verified**.
 * Nje biznes verifikohet vetem me dokument; besueshmeria e llogarise personale nuk vlen per te.
 * Kur perkufizimi te ndryshoje, ndryshohet KETU — jo ne 13 vende.
 */
export function avatarVerified(
  s?: { is_verified?: boolean | null; trust_score?: number | null } | null,
  type: AvatarType = 'person',
): boolean {
  if (!s) return false
  if (type === 'business') return !!s.is_verified
  return !!s.is_verified || (s.trust_score ?? 0) >= 60
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
  if (tier === 'vip')     return { background: `linear-gradient(135deg,${ARI},var(--az-red))` }
  if (tier === 'premium') return { background: 'linear-gradient(135deg,var(--az-yellow),var(--az-red))' }
  return { background: '#e2e2e2' }
}

/**
 * Pulsimi i unazes VIP (BLLOKU §3.3). Keyframes s'behen dot me stil inline,
 * ndaj injektohet nje <style> i vogel vetem kur ka VIP. `prefers-reduced-motion`
 * e fik — leviza e vazhdueshme s'i imponohet kujt qe e ka refuzuar (a11y).
 */
const VIP_PULSE_CSS = `
@keyframes alpzVipPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,.75)}
  50%    {box-shadow:0 0 0 var(--alpz-pulse,10px) rgba(212,175,55,0)}
}
.alpz-vip-ring{animation:alpzVipPulse 1.9s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.alpz-vip-ring{animation:none}}
`

/**
 * Pulsimi i unazes PREMIUM (BLLOKU I PERMIRESUAR §1, `ring_matrix_v3_pulse_forte`).
 * I njejti mekanizem si VIP-i, por me ngjyren premium (e verdha `var(--az-yellow)`) dhe
 * ritem pak me te qete qe te dallohet nga VIP-i. Gradienti i unazes NUK ndryshon;
 * ndryshon vetem glow-u pulsues. `prefers-reduced-motion` e fik (a11y).
 */
const PREMIUM_PULSE_CSS = `
@keyframes alpzPremiumPulse{
  0%,100%{box-shadow:0 0 0 0 rgba(245,200,66,.75)}
  50%    {box-shadow:0 0 0 var(--alpz-pulse,10px) rgba(245,200,66,0)}
}
.alpz-premium-ring{animation:alpzPremiumPulse 2.3s ease-in-out infinite}
@media (prefers-reduced-motion: reduce){.alpz-premium-ring{animation:none}}
`

export default function Avatar({
  src, name, type = 'person', tier = 'free', verified = false, online, size = 48, onClick,
}: AvatarProps) {
  const [broken, setBroken] = useState(false)
  const showImage = src && !broken
  /*  [U-00 · FAZA 0] Dyshemeja e fontit vlen edhe për inicialet: kurrë nën 12px.
   *  Inicialet 5px (avataret e vegjël te ballina/kategoritë) ishin teksti më i
   *  vogël i platformës. Por të rritësh vetëm tekstin do ta thyente rrethin, ndaj
   *  kur do shfaqen iniciale nën dysheme, rritet edhe RRETHI te ≥2.4×12=29px
   *  (spec-i i terminalit). Prek VETËM avataret pa foto nën këtë prag; ata me foto
   *  ose të mëdhenj mbeten identikë. */
  const provFont = Math.round((size - Math.max(2, Math.round(size * 0.07)) * 2 - Math.max(1, Math.round(size * 0.04)) * 2) * 0.4)
  const sz = (!showImage && provFont < 12) ? Math.max(size, 29) : size
  const ring = Math.max(2, Math.round(sz * 0.07))
  /*  PERHAPJA E PULSIT, PROPORCIONALE ME AVATARIN.
   *  Deri me 31 gusht 2026 ishte 6px FIKSE per cdo madhesi: mbi nje avatar 64px
   *  (profil, karte shitesi) dukej i zbete — 9% e diametrit — ndersa mbi nje
   *  avatar 20px brenda kartes ishte joproporcionalisht i madh. Matur ne
   *  shfletues, jo me sy. Tani 19% e diametrit, me nje dysheme prej 5px qe
   *  avataret e vegjel te mos e humbasin fare. */
  const pulse = Math.max(5, Math.round(sz * 0.19))
  const white = Math.max(1, Math.round(sz * 0.04))
  const inner = sz - ring * 2 - white * 2
  const badge = Math.round(sz * 0.34)
  const dot = Math.max(8, Math.round(sz * 0.26))
  const initialsFont = Math.max(12, Math.round(inner * 0.4))

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => { if (e.key === 'Enter' || e.key === ' ') onClick() }) : undefined}
      style={{ position: 'relative', width: sz, height: sz, flexShrink: 0, cursor: onClick ? 'pointer' : 'default', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {tier === 'vip' && <style dangerouslySetInnerHTML={{ __html: VIP_PULSE_CSS }} />}
      {tier === 'premium' && <style dangerouslySetInnerHTML={{ __html: PREMIUM_PULSE_CSS }} />}
      <div className={tier === 'vip' ? 'alpz-vip-ring' : tier === 'premium' ? 'alpz-premium-ring' : undefined} style={{ width: sz, height: sz, borderRadius: '50%', padding: ring, boxSizing: 'border-box', ...ringStyle(tier), transition: 'transform .15s ease', ['--alpz-pulse' as any]: `${pulse}px` }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff', padding: white, boxSizing: 'border-box' }}>
          {showImage ? (
            <img src={src as string} alt={name || 'avatar'} loading="lazy" onError={() => setBroken(true)} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg,var(--az-yellow),var(--az-red))', color: '#fff', fontWeight: 800, fontSize: initialsFont, letterSpacing: 0.5, userSelect: 'none' }}>
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
          style={{ position: 'absolute', right: -2, top: -2, width: badge, height: badge, borderRadius: '50%', background: 'var(--az-yellow)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(badge * 0.55), color: '#7A4A00', lineHeight: 1 }}>
          <span aria-hidden="true">★</span>
        </div>
      )}

      {(type === 'business' || verified) && (
        <div role="img" aria-label={verified ? 'I verifikuar' : 'Biznes'} style={{ position: 'absolute', right: -2, bottom: -2, width: badge, height: badge, borderRadius: '50%', background: verified ? '#16a34a' : '#111', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(badge * 0.55), color: '#fff', lineHeight: 1 }}>
          {verified ? <span aria-hidden='true'>✓</span> : <span aria-hidden='true'>🏢</span>}
        </div>
      )}

      {/* Prania LIVE (BLLOKU Imazhi 1/2): pikë jeshile poshtë-majtas — cepi i lirë,
          që të mos përplaset me vulën e abonimit (lart-djathtas) as me badge-in e
          identitetit (poshtë-djathtas). Shfaqet VETËM kur online===true. */}
      {online === true && (
        <div
          role="img" aria-label="Në linjë"
          style={{ position: 'absolute', left: -1, bottom: -1, width: dot, height: dot, borderRadius: '50%', background: '#16a34a', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.04)' }}
        />
      )}
      {/* Offline i DUKSHËM (BLLOKU I PËRMIRËSUAR §2b): pikë gri VETËM kur online===false.
          `undefined` mbetet pa pikë (fail-soft, pa "offline" të rremë kur s'e dimë). */}
      {online === false && (
        <div
          role="img" aria-label="Jashtë linje"
          style={{ position: 'absolute', left: -1, bottom: -1, width: dot, height: dot, borderRadius: '50%', background: '#9aa0a6', border: '2px solid #fff', boxShadow: '0 0 0 1px rgba(0,0,0,.04)' }}
        />
      )}
    </div>
  )
}

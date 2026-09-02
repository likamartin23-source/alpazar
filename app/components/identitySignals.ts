import { tierNgaProfili } from './Avatar'
import { getLevel, isNewMember } from './Badges'

/**
 * BURIMI I VETËM I RREGULLIT TË VULAVE TË IDENTITETIT (§4-bis / [O43]/[O46]).
 *
 * Vendimi i pronarit: RUAJ SKINET per-faqe (.schip · .badge · .bdg · chip() i IdentityBadges),
 * njëso vetëm RREGULLIN. Ky skedar është ai rregull i vetëm: CILAT vula shfaqen, me ÇFARË
 * emri shqip, në ÇFARË radhe, me ÇFARË pragu, dhe nën ÇFARË kushti konteksti. Secila faqe
 * merr TË NJËJTËN listë sinjalesh dhe e vizaton me lëkurën e vet — pra grupi i plotë del KUDO
 * (si te /profile, referenca e pronarit) pa e detyruar një pamje të vetme.
 *
 * `/profile` (referenca) sot: 🛡Admin · ✓Verifikuar · 👑/⭐Tier · 🏢Biznes · ⚡Nivel · 📦Shitës aktiv ·
 * 🆕Anëtar i ri · ⚡N pikë (+ Besueshmëria/TrustBadge veç). Këtu e kodifikojmë njëherë për të gjithë.
 *
 * KONTEKST (kritik — mos i hiq):
 *  · `admin`     shfaqet VETËM për vetveten (`isSelf`) — RLS §4.6-bis ndalon leximin e `is_admin`
 *    të tjetrit; ta shfaqësh cross-user do të kërkonte ekspozim privilegji.
 *  · `verified`  (email/telefon i konfirmuar) njihet VETËM për vetveten (vjen nga `auth.user`,
 *    jo nga profili publik). Vula ✓ e Avatar-it (trust_score≥60) është tjetër gjë dhe rri te Avatar.
 *  · pjesa tjetër (tier · biznes · nivel · pikë · shitës aktiv · anëtar i ri · besueshmëria) është
 *    publike dhe del në çdo sipërfaqe.
 */
export type SignalTone =
  | 'admin' | 'verified' | 'vip' | 'premium' | 'biznes' | 'level' | 'active' | 'new' | 'points'

export type IdentitySignal = {
  key: string
  tone: SignalTone
  icon: string
  label: string
  /** Vetëm për tone==='level': ngjyrat e nivelit nga getLevel (secila lëkurë i përdor si i duhet). */
  levelBg?: string
  levelColor?: string
}

export type SignalSubject = {
  is_premium?: boolean | null
  has_boost?: boolean | null
  premium_expires_at?: string | null
  boost_expires_at?: string | null
  is_admin?: boolean | null
  gamification_points?: number | null
  created_at?: string | null
  shop_name?: string | null
  trust_score?: number | null
  trust_score_visible?: boolean | null
}

export type SignalOpts = {
  /** Vetja e vet (gates admin + verified). */
  isSelf?: boolean
  /** Email/telefon i konfirmuar — njihet vetëm për vetveten. */
  emailVerified?: boolean
  /** A është biznes (🏢). Kur s'jepet, bie te `subject.shop_name`. */
  isBusiness?: boolean
  /** Numri i shpalljeve aktive PERSONALE (përdoret për statistikën "Shpallje"). */
  activeListings?: number
  /** [O55/F1] "Shitës aktiv" është IDENTITET, jo numër: dikush shet përmes biznesit edhe kur
   *  shpalljet personale = 0. Kur jepet `true`, vula "📦 Shitës aktiv" del pavarësisht activeListings.
   *  Ndan pyetjen "sa shpallje personale?" (numri) nga "a është shitës aktiv?" (identiteti). */
  isActiveSeller?: boolean
  /** 'full' = shfaq çipin e Nivelit (kur pts≥100); 'compact' = jo. */
  density?: 'full' | 'compact'
}

/**
 * Kthen listën e RENDITUR të vulave-çip për një subjekt, sipas rregullit të vetëm.
 * TrustBadge (Besueshmëria) NUK është këtu — është komponent më vete (unazë), i njëjti kudo;
 * përdor `showTrust()` për kushtin e tij.
 */
export function identitySignals(subject: SignalSubject | null | undefined, opts: SignalOpts = {}): IdentitySignal[] {
  if (!subject) return []
  const { isSelf = false, emailVerified = false, density = 'full' } = opts
  const isBusiness = opts.isBusiness ?? !!subject.shop_name
  const activeListings = opts.activeListings ?? 0
  const pts = subject.gamification_points || 0
  const tier = tierNgaProfili(subject)

  const out: IdentitySignal[] = []

  if (isSelf && subject.is_admin) out.push({ key: 'admin', tone: 'admin', icon: '🛡', label: 'Admin' })
  if (isSelf && emailVerified) out.push({ key: 'verified', tone: 'verified', icon: '✓', label: 'Verifikuar' })

  if (tier === 'vip') out.push({ key: 'tier', tone: 'vip', icon: '👑', label: 'VIP Ekstra Boost' })
  else if (tier === 'premium') out.push({ key: 'tier', tone: 'premium', icon: '⭐', label: 'Premium' })

  if (isBusiness) out.push({ key: 'biznes', tone: 'biznes', icon: '🏢', label: 'Biznes' })

  // Niveli vetëm kur ka kaluar Fillestarin (pts≥100) — përndryshe "🌱 Fillestar" për këdo është zhurmë.
  if (density === 'full' && pts >= 100) {
    const l = getLevel(pts)
    out.push({ key: 'level', tone: 'level', icon: l.icon, label: l.name, levelBg: l.bg, levelColor: l.color })
  }

  if (activeListings > 0 || opts.isActiveSeller) out.push({ key: 'active', tone: 'active', icon: '📦', label: 'Shitës aktiv' })
  if (isNewMember(subject.created_at)) out.push({ key: 'new', tone: 'new', icon: '🆕', label: 'Anëtar i ri' })
  if (pts > 0) out.push({ key: 'points', tone: 'points', icon: '⚡', label: `${pts} pikë` })

  return out
}

/** Kushti i vetëm i Besueshmërisë (TrustBadge) — opt-out i Ligjit 124/2024 n.19. */
export function showTrust(subject: SignalSubject | null | undefined): boolean {
  return !!subject && subject.trust_score_visible !== false
}

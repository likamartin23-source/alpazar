'use client'

// Karta universale e shpalljes — NJE komponent kudo (kryefaqe, faqe biznesi,
// profil, kerkim). Raporti 70/30: media 4/3 siper (~70%), te dhenat poshte
// (~30%): titull 1-rresht + cmim + meta (qytet · kohe).
//
// Perse nje komponent: perpara ketij, cdo siperfaqe e rindertonte karten vete
// dhe ato divergjonin — kartat e faqes se biznesit ishin katrore pa titull,
// kartat e kryefaqes 4/3 me titull. Sinkroni mbahej me mbishkrime `!important`
// te `.ig-*` ne ui-refine.css. Tani markup-i eshte nje i vetem, ndaj nuk ka
// se ku te divergjoje.
//
// CSS-ja rri te `app/ui-refine.css` (seksioni 8), jo ketu: ngarkohet nga
// layout-i ne cdo faqe, ndaj karta duket njesoj edhe atje ku faqja s'ka
// stilet e veta.

import { useEffect, useRef, useState } from 'react'
import Avatar, { tierNgaRankTier } from './Avatar'
import { FavoriteButton } from './FavoriteButton'
import { useIsOnline } from './OnlinePresence'
import { useSyteLive } from './PremiumUpsell'
import { trackEvent } from '../../lib/track'
import { nf, dayMonth } from '../../lib/format'

export type ListingCardAuthor = {
  id: string
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
  is_premium?: boolean | null
  trust_score?: number | null
}

// Biznesi te i cili i PERKET shpallja (nga listing.business_id). Kur ekziston,
// karta shfaq identitetin e biznesit (jo te personit) — model Facebook, entitete
// te ndara (Vendimi 1/7). Vjen nga join `business:business_id(...)` te query-t.
export type ListingCardBusiness = {
  id: string
  name?: string | null
  logo_url?: string | null
  is_verified?: boolean | null
}

export type ListingCardItem = {
  id: string
  title: string
  price: number
  currency: string
  city?: string | null
  condition?: string | null
  images?: string[] | null
  /** Poster i videos (thumbnail) — përdoret si kopertinë kur shpallja s'ka foto (video-only). */
  video_poster?: string | null
  /** Videot e shpalljes — për autoplay në feed (vetëm-video). E para përdoret në kartë. */
  videos?: { url: string; poster?: string | null; duration?: number | null }[] | null
  is_premium?: boolean | null
  rank_tier?: number | null
  created_at?: string | null
  author?: ListingCardAuthor | null
  business_id?: string | null
  business?: ListingCardBusiness | null
  status?: string | null
  /** Numri i shikimeve nga sistemi ekzistues (`listings.views_count`). Kur
   *  mungon te query-ja, `👁` thjesht s'shfaqet (fail-soft). */
  views_count?: number | null
}

type Props = {
  listing: ListingCardItem
  /** Renditja ne grid — percakton vonesen e animimit dhe perparesine e fotos. */
  index?: number
  /**
   * Chip-i i shitesit mbi foto. Fiket te faqja e biznesit dhe te profili,
   * ku cdo karte i perket te njejtit shites dhe chip-i vetem perserit veten.
   */
  showSeller?: boolean
  /**
   * `false` derisa komponenti te montohet: `timeAgo` varet nga `Date.now()`
   * dhe serveri e klienti do te jepnin tekst te ndryshem (mospershtatje
   * hidratimi). Prinderit qe kane tashme nje flamur `mounted` ia japin ketu.
   */
  mounted?: boolean
  /**
   * Thirret kur perdoruesi heq shpalljen nga te preferuarat. Faqja e te
   * preferuarave e perdor per ta hequr karten menjehere nga lista; siperfaqet
   * e tjera e lene bosh (zemra thjesht zbrazet).
   */
  onUnfavorite?: () => void
}

const fmt = (price: number, cur: string) =>
  !price ? 'Çmim me marrëveshje' :
  cur === 'EUR' ? `${nf(price)} €` : `${nf(price)} L`

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)     return 'tani'
  if (diff < 3600)   return `${Math.floor(diff / 60)}min`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  // `dayMonth` ne vend te `toLocaleDateString('sq-AL')`: ky i fundit varet nga
  // te dhenat ICU te mjedisit dhe jep tekst te ndryshem ne server e ne
  // shfletues — shkaku i mospershtatjeve te hidratimit qe dokumenton
  // lib/format.ts.
  return dayMonth(iso)
}

const go = (path: string) => { window.location.href = path }

export default function ListingCard({ listing, index = 0, showSeller = true, mounted = true, onUnfavorite }: Props) {
  const l = listing
  const author = l.author || null
  // Nese shpallja i perket nje biznesi (business_id + join biznesi), identiteti
  // i kartes eshte biznesi; perndryshe personi. Tier-i vjen nga `rank_tier` i
  // shpalljes (pasqyre e sakte e owner_rank_tier: VIP kur =2), jo nga `author`
  // qe mban vetem `is_premium`.
  const biz = l.business_id && l.business ? l.business : null
  const tier = tierNgaRankTier(l.rank_tier)
  // Shpallje vetëm-video (pa foto) → luajmë videon në kartë kur hyn në pamje. Përndryshe kopertina
  // mbetet foto/poster. URL-ja e videos vjen nga projeksioni i përbashkët (LISTING_SELECT.videos).
  const videoUrl = (!l.images?.[0] && l.videos?.[0]?.url) ? l.videos[0].url : null
  // Kopertina statike: foto e parë ose posteri i videos (kur s'ka foto). Përdoret jashtë pamjes
  // dhe kur s'ka URL videoje në projeksion (p.sh. disa feed-e që s'kërkojnë `videos`).
  const cover = l.images?.[0] || l.video_poster || null
  // Prania LIVE e shitësit-person (BLLOKU Imazhi 2: overlay unazë + online/offline).
  const authorOnline = useIsOnline(author?.id)
  // 🔴 Sytë live për kartën (BLLOKU I PËRMIRËSUAR §2a): THROTTLE me IntersectionObserver
  // — vetëm kartat e dukshme abonohen te presence-i (jo abonime masive për çdo kartë
  // të gridit). Kur karta del nga ekrani, `visible=false` → `useSyteLive(undefined)`
  // e mbyll kanalin. Prag: `🔴` shfaqet vetëm kur live>0.
  const cardRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = cardRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      ([e]) => {
        setVisible(e.isIntersecting)
        // Impression (BLLOKU I PËRMIRËSUAR — gjurmim): numërohet 1×/sesion kur karta
        // shfaqet realisht në ekran (jo thjesht e renderuar). Fire-and-forget.
        if (e.isIntersecting) trackEvent('impression', l.id, { once: true })
      },
      { rootMargin: '0px', threshold: 0.1 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  const live = useSyteLive(visible ? l.id : undefined)
  const open = () => go(`/listing/${l.id}`)

  return (
    <div
      ref={cardRef}
      className="listing-card"
      style={{ ['--i' as string]: String(Math.min(index, 8)) } as React.CSSProperties}
      role="link"
      tabIndex={0}
      aria-label={`${l.title} — ${fmt(l.price, l.currency)}`}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') open() }}
    >
      <div className="card-img">
        {/* Kopertina: foto e parë, ose posteri i videos kur shpallja është vetëm-video (pa foto).
            Për shpalljet vetëm-video: kur karta hyn NË PAMJE (IntersectionObserver → `visible`),
            luajmë videon vetë, pa zë, në lak (rrjedhshëm në feed); jashtë pamjes tregojmë posterin.
            Muted+playsInline → autoplay lejohet nga shfletuesit; preload='none' → pa kosto kur s'duket. */}
        {videoUrl && visible
          ? <video
              src={videoUrl}
              poster={l.video_poster || undefined}
              autoPlay muted loop playsInline preload="none"
              aria-label={l.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#0e0e0e' }}
            />
          : (cover
              ? <img
                  src={cover}
                  alt={l.title}
                  loading={index < 3 ? 'eager' : 'lazy'}
                  fetchPriority={index < 3 ? 'high' : 'auto'}
                  decoding="async"
                  width={400}
                  height={300}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              : <i className="ti ti-photo" style={{ fontSize: 26, color: '#ccc' }} aria-hidden="true" />
            )
        }
        {/* Tregues ▶ vetëm kur karta video-only ende s'ka hyrë në pamje (tregon posterin). */}
        {videoUrl && !visible && (
          <span aria-label="Video" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 2, width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <i className="ti ti-player-play-filled" style={{ fontSize: 18, color: '#fff' }} aria-hidden="true" />
          </span>
        )}
        {/* Distinktivi VIDEO kur karta është vetëm-video (sinjal i njohur, si te faqja e shpalljes). */}
        {videoUrl && (
          <span aria-hidden="true" style={{ position: 'absolute', top: 6, left: 6, zIndex: 3, background: 'rgba(230,51,18,.92)', color: '#fff', fontSize: 8.5, fontWeight: 800, padding: '2px 6px', borderRadius: 6, letterSpacing: '.4px' }}>VIDEO</span>
        )}
        {l.condition === 'i_ri' && <span className="badge-new">I ri</span>}
        {l.condition === 'i_perdorur' && <span className="badge-used">I përdorur</span>}
        {/* Vulat sipas matrices se ngrire (BLLOKU Imazhi 2): 👑 VIP mbi ari→kuqe ·
            ★ premium · falas asgje. E njejta teme si unaza e Avatar-it (ari→kuqe).
            H2: TË DYJA vulat nga i njëjti burim `tier` (=tierNgaRankTier(rank_tier)) si unaza —
            më parë ★ lexonte `is_premium` bruto, ndaj mund të mospërputhej me unazën. */}
        {tier === 'vip'
          ? <span className="badge-premium" role="img" aria-label="VIP" style={{ background: 'linear-gradient(135deg,#D4AF37,#E63312)', color: '#fff' }}><span aria-hidden="true">👑</span> VIP</span>
          : tier === 'premium' && <span className="badge-premium" role="img" aria-label="Premium"><span aria-hidden="true">★</span></span>}
        {showSeller && biz && (
          <div
            className="card-seller-ov"
            role="link"
            tabIndex={0}
            aria-label={`Biznesi ${biz.name || ''}`}
            onClick={e => { e.stopPropagation(); go(`/biznese/${biz.id}`) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); go(`/biznese/${biz.id}`) } }}
          >
            <Avatar
              src={biz.logo_url}
              name={biz.name}
              type="business"
              tier={tier}
              verified={!!biz.is_verified}
              size={18}
            />
            <span>{biz.name || 'Biznes'}</span>
          </div>
        )}
        {showSeller && !biz && author && (
          <div
            className="card-seller-ov"
            role="link"
            tabIndex={0}
            aria-label={`Profili i ${author.full_name || author.username || 'shitësit'}`}
            onClick={e => { e.stopPropagation(); go(`/u/${author.id}`) }}
            onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); go(`/u/${author.id}`) } }}
          >
            <Avatar
              src={author.avatar_url}
              name={author.full_name || author.username}
              type="person"
              tier={tier}
              verified={(author.trust_score ?? 0) >= 60}
              online={authorOnline}
              size={18}
            />
            <span>{author.full_name || author.username || 'Shitës'}</span>
          </div>
        )}
        {/* Ruaj (favorites) — kend i lire poshte-djathtas; trajton vete auth-in. */}
        <FavoriteButton
          listingId={l.id}
          size={30}
          style={{ position: 'absolute', right: 6, bottom: 6, zIndex: 3 }}
          onUnfavorite={onUnfavorite}
        />
        {/* Shitur (Vendimi 3): social proof, jo fshehje — overlay mbi media. */}
        {l.status === 'sold' && (
          <div aria-label="Shitur" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <span style={{ background: '#0E7A35', color: '#fff', fontWeight: 800, fontSize: 12, letterSpacing: '.5px', padding: '5px 14px', borderRadius: 999, transform: 'rotate(-8deg)', boxShadow: '0 2px 8px rgba(0,0,0,.3)' }}>SHITUR</span>
          </div>
        )}
      </div>
      <div className="card-body">
        <div className="card-title">{l.title}</div>
        <div className="card-price">{fmt(l.price, l.currency)}</div>
        <div className="card-meta">
          <span className="card-loc">
            <i className="ti ti-map-pin" aria-hidden="true" />
            {l.city || 'Shqipëri'}
          </span>
          <span style={{ fontSize: 11, color: '#6B6B6B', flexShrink: 0 }}>
            {mounted && l.created_at ? timeAgo(l.created_at) : ''}
          </span>
        </div>
        {/* Sytë (BLLOKU I PËRMIRËSUAR §2a): 👁 shikime (statik) · 🔴 live (throttle,
            vetëm kur >0). Shfaqet vetëm kur ka të dhëna → pa rresht bosh. */}
        {(l.views_count != null || (mounted && live > 0)) && (
          <div className="card-stats">
            {l.views_count != null && (
              <span className="cs-eye" aria-label={`${nf(l.views_count)} shikime`}>
                <span aria-hidden="true">👁</span> {nf(l.views_count)}
              </span>
            )}
            {mounted && live > 0 && (
              <span className="cs-live" aria-label={`${live} duke shikuar tani`}>
                <span aria-hidden="true">🔴</span> {live}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

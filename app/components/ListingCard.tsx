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

import Avatar from './Avatar'
import { nf, dayMonth } from '../../lib/format'

export type ListingCardAuthor = {
  id: string
  full_name?: string | null
  username?: string | null
  avatar_url?: string | null
  is_premium?: boolean | null
  trust_score?: number | null
}

export type ListingCardItem = {
  id: string
  title: string
  price: number
  currency: string
  city?: string | null
  condition?: string | null
  images?: string[] | null
  is_premium?: boolean | null
  rank_tier?: number | null
  created_at?: string | null
  author?: ListingCardAuthor | null
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

export default function ListingCard({ listing, index = 0, showSeller = true, mounted = true }: Props) {
  const l = listing
  const author = l.author || null
  const open = () => go(`/listing/${l.id}`)

  return (
    <div
      className="listing-card"
      style={{ animationDelay: `${Math.min(index * 45, 360)}ms` }}
      role="link"
      tabIndex={0}
      aria-label={`${l.title} — ${fmt(l.price, l.currency)}`}
      onClick={open}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') open() }}
    >
      <div className="card-img">
        {l.images?.[0]
          ? <img
              src={l.images[0]}
              alt={l.title}
              loading={index < 3 ? 'eager' : 'lazy'}
              fetchPriority={index < 3 ? 'high' : 'auto'}
              decoding="async"
              width={400}
              height={300}
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
            />
          : <i className="ti ti-photo" style={{ fontSize: 26, color: '#ccc' }} aria-hidden="true" />
        }
        {l.condition === 'i_ri' && <span className="badge-new">I ri</span>}
        {l.condition === 'i_perdorur' && <span className="badge-used">I përdorur</span>}
        {l.rank_tier === 2
          ? <span className="badge-premium" aria-label="VIP" style={{ background: 'linear-gradient(135deg,#7A3FA6,#B57AE0)', color: '#fff' }}>VIP</span>
          : l.is_premium && <span className="badge-premium" aria-label="Premium">⭐</span>}
        {showSeller && author && (
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
              type={author.is_premium ? 'premium' : 'user'}
              verified={(author.trust_score ?? 0) >= 60}
              size={18}
            />
            <span>{author.full_name || author.username || 'Shitës'}</span>
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
      </div>
    </div>
  )
}

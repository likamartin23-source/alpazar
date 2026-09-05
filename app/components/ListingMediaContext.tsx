'use client'

import { createContext, useContext, type ReactNode } from 'react'

export type ListingVideoItem = { url: string; poster?: string; duration?: number }
type Ctx = { videos: ListingVideoItem[]; poster?: string }

const ListingMediaContext = createContext<Ctx>({ videos: [] })

export function useListingMedia(): Ctx {
  return useContext(ListingMediaContext)
}

function normalize(videos: any, legacy?: string): ListingVideoItem[] {
  const raw = Array.isArray(videos) ? videos : []
  const out: ListingVideoItem[] = []
  for (const v of raw) {
    if (!v) continue
    if (typeof v === 'string') out.push({ url: v })
    else if (v.url) out.push({ url: String(v.url), poster: v.poster || undefined, duration: Number(v.duration) || undefined })
  }
  if (out.length === 0 && legacy) out.push({ url: String(legacy) })
  const seen: Record<string, boolean> = {}
  return out.filter(v => { if (!v.url || seen[v.url]) return false; seen[v.url] = true; return true })
}

// NJË KOLONË në desktop (vendim pronari, 5 shtator) — pa grid 2-kolonësh.
// Kolonë e vetme e qendërzuar; media mban gjerësinë e plotë të kolonës; blloqet e
// TEKSTIT (përshkrimi) kufizohen te kolona e leximit (37em) që të mos i kalojnë 75
// karaktere. `.info` ka të njëjtin `x` me median (të dyja fëmijë bllok të `.wrap`),
// gjë që e provon një kolonë. Mobil-i (<1000px) i pandryshuar.
const LISTING_DESKTOP_CSS = `
@media (min-width:1000px){
  .wrap{
    max-width:min(100%,1140px) !important;
    margin-left:auto !important;
    margin-right:auto !important;
    padding-left:clamp(32px,4vw,72px) !important;
    padding-right:clamp(32px,4vw,72px) !important;
    padding-bottom:48px !important;
    background:transparent !important;
  }
  .wrap > .info{
    background:#fff;
    border-radius:16px;
    box-shadow:0 1px 4px rgba(0,0,0,.06);
    border:1px solid #f0ece0;
  }
  /* Përshkrimi te kolona e leximit (≤75 karaktere), i lidhur me të njëjtin x majtas. */
  .wrap .desc{ max-width:var(--kolona-lexim); }
}
`

export function ListingMediaProvider({
  videos, legacy, poster, children,
}: { videos?: any; legacy?: string; poster?: string; children: ReactNode }) {
  const list = normalize(videos, legacy)
  return (
    <ListingMediaContext.Provider value={{ videos: list, poster }}>
      <style dangerouslySetInnerHTML={{ __html: LISTING_DESKTOP_CSS }} />
      {children}
    </ListingMediaContext.Provider>
  )
}

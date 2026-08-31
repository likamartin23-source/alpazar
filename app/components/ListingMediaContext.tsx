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

// Layout 2-kolonësh VETËM në desktop për faqen e shpalljes (model Instagram/FB/Temu):
// media majtas, detajet djathtas (ngjitëse). Mobil-i mbetet i pandryshuar (< 1000px).
// I kufizuar te kjo faqe sepse ky <style> renderohet vetëm brenda faqes së shpalljes.
const LISTING_DESKTOP_CSS = `
@media (min-width:1000px){
  .wrap{
    max-width:1140px !important;
    display:grid !important;
    grid-template-columns:minmax(0,1.15fr) minmax(0,0.85fr);
    column-gap:34px;
    align-items:start;
    background:transparent !important;
    padding-bottom:48px !important;
  }
  .wrap > .topbar{ grid-column:1 / -1; }
  .wrap > .info{
    grid-column:2;
    grid-row:2 / span 999;
    align-self:start;
    position:sticky;
    top:78px;
    background:#fff;
    border-radius:16px;
    box-shadow:0 1px 4px rgba(0,0,0,.06);
    border:1px solid #f0ece0;
  }
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

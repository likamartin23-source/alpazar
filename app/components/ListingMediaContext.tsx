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

export function ListingMediaProvider({
  videos, legacy, poster, children,
}: { videos?: any; legacy?: string; poster?: string; children: ReactNode }) {
  const list = normalize(videos, legacy)
  return (
    <ListingMediaContext.Provider value={{ videos: list, poster }}>
      {children}
    </ListingMediaContext.Provider>
  )
}

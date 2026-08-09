'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type V = { url: string; poster?: string; duration?: number }

function normalize(videos: any, legacy?: string): V[] {
  const out: V[] = []
  const arr = Array.isArray(videos) ? videos : []
  for (const v of arr) {
    if (!v) continue
    if (typeof v === 'string') { out.push({ url: v }); continue }
    if (v.url) out.push({ url: String(v.url), poster: v.poster || undefined, duration: Number(v.duration) || undefined })
  }
  if (out.length === 0 && legacy) out.push({ url: String(legacy) })
  const seen: Record<string, boolean> = {}
  return out.filter(v => {
    if (!v.url || seen[v.url]) return false
    seen[v.url] = true
    return true
  })
}

function mmss(s?: number) {
  if (!s || !isFinite(s) || s <= 0) return ''
  const m = Math.floor(s / 60)
  const r = Math.round(s % 60)
  return m + ':' + String(r).padStart(2, '0')
}

const VIDEO_CSS = `
.alp-vid{background:#fff;border-top:8px solid #F6F1E1;padding:14px}
.alp-vid-h{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:800;color:#111;margin-bottom:10px}
.alp-vid-h .n{font-weight:600;color:#999;font-size:11px}
.alp-vid-h .lv{background:#E63312;color:#fff;font-size:8px;font-weight:800;padding:2px 6px;border-radius:4px;letter-spacing:.5px}
.alp-vid-st{position:relative;border-radius:14px;overflow:hidden;background:#000;line-height:0}
.alp-vid-st video{width:100%;max-height:70vh;display:block;background:#000}
.alp-vid-dur{position:absolute;bottom:8px;right:8px;background:rgba(0,0,0,.72);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:6px;pointer-events:none;line-height:1.6}
.alp-vid-tabs{display:flex;gap:8px;overflow-x:auto;margin-top:10px;padding-bottom:2px;-webkit-overflow-scrolling:touch}
.alp-vid-tabs::-webkit-scrollbar{display:none}
.alp-vid-tb{flex:0 0 auto;position:relative;width:78px;height:52px;border-radius:9px;overflow:hidden;border:2px solid transparent;background:#111;cursor:pointer;padding:0}
.alp-vid-tb.on{border-color:#E63312}
.alp-vid-tb img{width:100%;height:100%;object-fit:cover;display:block;opacity:.75}
.alp-vid-tb.on img{opacity:1}
.alp-vid-tb .ix{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800;text-shadow:0 1px 3px rgba(0,0,0,.8)}
.alp-vid-note{font-size:10.5px;color:#aaa;margin-top:8px;text-align:center}
`

export default function ListingVideos({ videos, legacy, poster, images }: any) {
  const list = normalize(videos, legacy)
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [idx, setIdx] = useState(0)
  const [durs, setDurs] = useState<Record<number, number>>({})
  const vref = useRef<HTMLVideoElement | null>(null)

  // Vendos seksionin e videos menjehere para bllokut te informacionit.
  useEffect(() => {
    if (list.length === 0) return
    let host: HTMLElement | null = null
    let tries = 0
    let timer: any = null

    const place = () => {
      tries++
      const anchor = document.querySelector('.wrap .info')
      const wrap = document.querySelector('.wrap')
      if (!anchor && !wrap && tries < 40) { timer = setTimeout(place, 120); return }
      host = document.createElement('div')
      host.setAttribute('data-alp-videos', '1')
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(host, anchor)
      else if (wrap) wrap.appendChild(host)
      else document.body.appendChild(host)
      setTarget(host)
    }
    place()

    return () => {
      if (timer) clearTimeout(timer)
      if (host && host.parentNode) host.parentNode.removeChild(host)
    }
  }, [list.length])

  if (list.length === 0 || !target) return null

  const cur = list[idx] || list[0]
  const fallbackPoster = cur.poster || poster || (Array.isArray(images) ? images[0] : undefined)
  const shownDur = cur.duration || durs[idx]

  function pick(i: number) {
    setIdx(i)
    const el = vref.current
    if (el) { try { el.load() } catch { /* noop */ } }
  }

  return createPortal(
    <section className="alp-vid" aria-label="Video të shpalljes">
      <style dangerouslySetInnerHTML={{ __html: VIDEO_CSS }} />
      <div className="alp-vid-h">
        <i className="ti ti-video" aria-hidden="true" />
        Video
        <span className="lv">LIVE</span>
        {list.length > 1 && <span className="n">{idx + 1}/{list.length}</span>}
      </div>

      <div className="alp-vid-st">
        <video
          ref={vref}
          key={cur.url}
          src={cur.url}
          poster={fallbackPoster}
          controls
          playsInline
          preload="metadata"
          controlsList="nodownload"
          onLoadedMetadata={e => {
            const d = (e.currentTarget as HTMLVideoElement).duration
            if (d && isFinite(d)) setDurs(p => ({ ...p, [idx]: d }))
          }}
        />
        {!!mmss(shownDur) && <span className="alp-vid-dur">{mmss(shownDur)}</span>}
      </div>

      {list.length > 1 && (
        <div className="alp-vid-tabs" role="tablist" aria-label="Zgjidh videon">
          {list.map((v, i) => (
            <button
              key={v.url}
              type="button"
              role="tab"
              aria-selected={i === idx}
              aria-label={`Video ${i + 1}`}
              className={`alp-vid-tb ${i === idx ? 'on' : ''}`}
              onClick={() => pick(i)}
            >
              {v.poster
                ? <img src={v.poster} alt="" loading="lazy" />
                : <span className="ix">▶ {i + 1}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="alp-vid-note">Videot ndihmojnë shpalljen të shitet deri në 3× më shpejt.</div>
    </section>,
    target
  )
}

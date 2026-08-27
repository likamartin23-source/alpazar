'use client'

import { useState, useRef, useEffect } from 'react'
import { useListingMedia } from './ListingMediaContext'

interface VideoItem { url: string; poster?: string; duration?: number }
interface Props {
  images: string[]
  videos?: VideoItem[]
  poster?: string
  alt?: string
  aspectRatio?: '4/3' | '1/1' | '4/5'
  rounded?: boolean
}

type Slide = { kind: 'image'; src: string } | { kind: 'video'; src: string; poster?: string }

export function ImageCarousel({ images, videos, poster, alt = '', aspectRatio = '4/3', rounded = true }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const media = useListingMedia()

  useEffect(() => {
    if (!lightbox) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [lightbox])

  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchMoved = useRef(false)
  const mouseStartX = useRef<number | null>(null)
  const mouseMoved = useRef(false)

  const imgList = Array.isArray(images) ? images.filter(Boolean) : []
  const vidSource = (videos && videos.length) ? videos : (media?.videos || [])
  const vidList = Array.isArray(vidSource) ? vidSource.filter(v => v && v.url) : []
  const effPoster = poster || media?.poster
  const slides: Slide[] = [
    ...imgList.map((src): Slide => ({ kind: 'image', src })),
    ...vidList.map((v): Slide => ({ kind: 'video', src: v.url, poster: v.poster || effPoster || imgList[0] })),
  ]
  const count = slides.length
  const imgCount = imgList.length

  // Video-ja që është NË PAMJE nis vetë (në lak); të tjerat ndalen. Shfletuesit lejojnë autoplay
  // vetëm kur është pa zë, ndaj e nisim pa zë — POR mutojmë VETËM kur nis nga gjendja e ndalur.
  // Kështu, kur përdoruesi heq heshtjen nga controls, NUK e rimutojmë (luhet me zë e pa zë sipas tij).
  // Respekton `prefers-reduced-motion`. PARA return-it të hershëm (Rules of Hooks).
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    // Hartim sipas POZICIONIT REAL të slajdit (jo sipas indeksit te NodeList-i `video`): disa slajde
    // video renderohen si <iframe> (Cloudflare Stream) → do të prishnin numërimin nëse ndërthureshin
    // me <video> direkte. Iterojmë fëmijët e track-ut; luajmë atë të slajdit aktual, ndalim të tjerët.
    Array.from(track.children).forEach((child, slideIdx) => {
      const v = child.querySelector('video')
      if (!v) return
      if (slideIdx === current && !reduce) {
        if (v.paused) {
          v.muted = true
          const p = v.play()
          if (p && typeof (p as any).catch === 'function') (p as any).catch(() => { /* autoplay-policy: fail-soft */ })
        }
      } else {
        try { v.pause() } catch { /* ignore */ }
      }
    })
  }, [current, imgCount, count])

  if (count === 0) return (
    <div style={{ width: '100%', aspectRatio, background: 'linear-gradient(135deg,#FBF7E8,#F2EAD0)', borderRadius: rounded ? 16 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <i className="ti ti-photo" style={{ fontSize: 44, color: '#d8cfa8' }} aria-hidden="true" />
    </div>
  )

  function goTo(idx: number) {
    const i = Math.max(0, Math.min(idx, count - 1))
    setCurrent(i)
    trackRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  function onScroll() {
    if (!trackRef.current) return
    const { scrollLeft, clientWidth } = trackRef.current
    setCurrent(Math.round(scrollLeft / clientWidth))
  }

  const isImageSlide = (i: number) => slides[i]?.kind === 'image'

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchMoved.current = false
  }
  function onTouchMove(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current)
    const dy = Math.abs(e.touches[0].clientY - (touchStartY.current ?? 0))
    if (dx > 8 || dy > 8) touchMoved.current = true
  }
  function onTouchEnd() {
    if (!touchMoved.current && isImageSlide(current)) setLightbox(true)
    touchStartX.current = null
    touchStartY.current = null
    touchMoved.current = false
  }

  function onMouseDown(e: React.MouseEvent) {
    mouseStartX.current = e.clientX
    mouseMoved.current = false
  }
  function onMouseMove(e: React.MouseEvent) {
    if (mouseStartX.current !== null && Math.abs(e.clientX - mouseStartX.current) > 5)
      mouseMoved.current = true
  }
  function onMouseUp() {
    if (!mouseMoved.current && isImageSlide(current)) setLightbox(true)
    mouseStartX.current = null
    mouseMoved.current = false
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `.carousel-track::-webkit-scrollbar{display:none}` }} />
      <div style={{ position: 'relative', borderRadius: rounded ? 16 : 0, overflow: 'hidden', background: '#0e0e0e' }}>
        <div
          ref={trackRef}
          onScroll={onScroll}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: 'pointer',
          }}
          className="carousel-track"
        >
          {slides.map((s, i) => (
            <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always', aspectRatio, background: '#0e0e0e', position: 'relative', overflow: 'hidden' }}>
              {s.kind === 'image' ? (
                <>
                  <img
                    src={s.src}
                    alt=""
                    aria-hidden="true"
                    loading={i === 0 ? 'eager' : 'lazy'}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(28px) brightness(.6) saturate(1.2)', transform: 'scale(1.25)', pointerEvents: 'none' }}
                    draggable={false}
                  />
                  <img
                    src={s.src}
                    alt={`${alt} ${i + 1}`}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'auto'}
                    decoding="async"
                    style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
                    draggable={false}
                    onError={e => {
                      const img = e.currentTarget
                      img.style.display = 'none'
                      const wrap = img.parentElement
                      if (wrap && !wrap.querySelector('.img-err')) {
                        const d = document.createElement('div')
                        d.className = 'img-err'
                        d.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#ccc;background:#F6F6F6;'
                        d.innerHTML = '<i class="ti ti-photo" style="font-size:32px"></i><span style="font-size:11px;font-weight:600">Pa foto</span>'
                        wrap.appendChild(d)
                      }
                    }}
                  />
                </>
              ) : s.src.includes('cloudflarestream.com') ? (
                <>
                  {/* Video e transkoduar (Cloudflare Stream): luhet KUDO (edhe H.265→H.264), adaptiv,
                      me player-in e vetë që mban zërin/kontrollet — pa varësi shtesë në klient. */}
                  <iframe
                    src={s.src}
                    loading="lazy"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                    allowFullScreen
                    title={`Video ${i + 1}`}
                    style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', border: 'none', display: 'block', background: '#0e0e0e' }}
                  />
                  <span aria-hidden="true" style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(230,51,18,.92)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 7, letterSpacing: '.4px', pointerEvents: 'none' }}>
                    <i className="ti ti-player-play-filled" style={{ fontSize: 11 }} /> VIDEO
                  </span>
                </>
              ) : (
                <>
                  <video
                    src={s.src}
                    poster={s.poster}
                    controls
                    playsInline
                    loop
                    preload="metadata"
                    controlsList="nodownload"
                    style={{ position: 'relative', zIndex: 2, width: '100%', height: '100%', objectFit: 'contain', display: 'block', background: '#0e0e0e' }}
                  />
                  <span aria-hidden="true" style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(230,51,18,.92)', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 7px', borderRadius: 7, letterSpacing: '.4px', pointerEvents: 'none' }}>
                    <i className="ti ti-player-play-filled" style={{ fontSize: 11 }} /> VIDEO
                  </span>
                </>
              )}
            </div>
          ))}
        </div>

        {count > 1 && (
          <div aria-hidden="true" style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,.6)', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
            pointerEvents: 'none',
          }}>
            {current + 1}/{count}
          </div>
        )}
      </div>

      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
          {slides.map((s, i) => (
            <button
              key={i}
              type="button"
              aria-current={i === current ? 'true' : undefined}
              onClick={() => goTo(i)}
              aria-label={s.kind === 'video' ? `Video ${i + 1}` : `Foto ${i + 1}`}
              style={{
                width: i === current ? 18 : 7, height: 7, borderRadius: 4, border: 'none',
                background: i === current ? '#E63312' : (s.kind === 'video' ? '#9a9a9a' : '#ccc'),
                cursor: 'pointer', padding: 0, transition: 'all .2s',
              }}
            />
          ))}
        </div>
      )}

      {count > 1 && (
        <div style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 6 }}>
          <span aria-hidden="true">↔</span> Rrëshkit për të kaluar te të tjerat
        </div>
      )}
      {vidList.length > 0 && (
        <div style={{ fontSize: 11, color: '#9a9a9a', textAlign: 'center', marginTop: 6 }}>
          <span aria-hidden="true">🎬</span> Videot ndihmojnë shpalljen të shitet deri në 3× më shpejt.
        </div>
      )}

      {lightbox && isImageSlide(current) && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shfaqje foto në madhësinë e plotë"
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'lb-fade .15s ease',
          }}
        >
          <style dangerouslySetInnerHTML={{ __html: `@keyframes lb-fade{from{opacity:0}to{opacity:1}}` }} />
          <button type="button" aria-label="Mbyll" onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          {current > 0 && (
            <button type="button" onClick={e => { e.stopPropagation(); goTo(current - 1) }} aria-label="Foto e mëparshme" style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer' }}>‹</button>
          )}
          <img
            src={imgList[current]}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 8 }}
          />
          {current < imgCount - 1 && (
            <button type="button" onClick={e => { e.stopPropagation(); goTo(current + 1) }} aria-label="Foto e ardhshme" style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer' }}>›</button>
          )}
          {imgCount > 1 && (
            <div aria-hidden="true" style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 6 }}>
              {imgList.map((_, i) => (
                <div key={i} style={{ width: i === current ? 18 : 7, height: 7, borderRadius: 4, background: i === current ? '#E63312' : 'rgba(255,255,255,.4)', transition: 'all .2s' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

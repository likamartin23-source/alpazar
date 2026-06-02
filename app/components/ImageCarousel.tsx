'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface Props {
  images: string[]
  alt?: string
  aspectRatio?: '4/3' | '1/1'
}

export function ImageCarousel({ images, alt = '', aspectRatio = '4/3' }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragStart = useRef<number | null>(null)
  const dragging = useRef(false)

  const count = images.length
  if (count === 0) return (
    <div style={{ width: '100%', aspectRatio, background: '#F6F6F6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <i className="ti ti-photo" style={{ fontSize: 36, color: '#ccc' }} />
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
    const idx = Math.round(scrollLeft / clientWidth)
    setCurrent(idx)
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = e.clientX
    dragging.current = false
  }
  function onPointerMove(e: React.PointerEvent) {
    if (dragStart.current !== null && Math.abs(e.clientX - dragStart.current) > 5) dragging.current = true
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!dragging.current && dragStart.current !== null) {
      // tap → lightbox
      setLightbox(true)
    }
    dragStart.current = null
    dragging.current = false
  }

  return (
    <>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', touchAction: 'pan-y' }}>
        {/* Scroll track */}
        <div
          ref={trackRef}
          onScroll={onScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          className="carousel-track"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {images.map((src, i) => (
            <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', aspectRatio, background: '#F6F6F6', position: 'relative', overflow: 'hidden' }}>
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Counter top-right */}
        {count > 1 && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,.6)', color: '#fff',
            fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
            pointerEvents: 'none',
          }}>
            {current + 1}/{count}
          </div>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 8 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                width: i === current ? 18 : 7, height: 7, borderRadius: 4, border: 'none',
                background: i === current ? '#E63312' : '#ccc',
                cursor: 'pointer', padding: 0, transition: 'all .2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'lb-fade .15s ease',
          }}
        >
          <style>{`@keyframes lb-fade{from{opacity:0}to{opacity:1}} .carousel-track::-webkit-scrollbar{display:none}`}</style>
          <button onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          {current > 0 && (
            <button onClick={e => { e.stopPropagation(); goTo(current - 1) }} style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer' }}>‹</button>
          )}
          <img
            src={images[current]}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 8 }}
          />
          {current < count - 1 && (
            <button onClick={e => { e.stopPropagation(); goTo(current + 1) }} style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer' }}>›</button>
          )}
          {count > 1 && (
            <div style={{ position: 'absolute', bottom: 20, display: 'flex', gap: 6 }}>
              {images.map((_, i) => (
                <div key={i} style={{ width: i === current ? 18 : 7, height: 7, borderRadius: 4, background: i === current ? '#E63312' : 'rgba(255,255,255,.4)', transition: 'all .2s' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

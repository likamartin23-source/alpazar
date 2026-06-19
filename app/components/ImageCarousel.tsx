'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  images: string[]
  alt?: string
  aspectRatio?: '4/3' | '1/1'
}

export function ImageCarousel({ images, alt = '', aspectRatio = '4/3' }: Props) {
  const [current, setCurrent] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

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

  const count = images.length
  if (count === 0) return (
    <div style={{ width: '100%', aspectRatio, background: '#F6F6F6', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <i className="ti ti-photo" style={{ fontSize: 36, color: '#ccc' }} aria-hidden="true" />
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

  // Touch events — most reliable for mobile tap detection
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
    if (!touchMoved.current) setLightbox(true)
    touchStartX.current = null
    touchStartY.current = null
    touchMoved.current = false
  }

  // Mouse events for desktop
  function onMouseDown(e: React.MouseEvent) {
    mouseStartX.current = e.clientX
    mouseMoved.current = false
  }
  function onMouseMove(e: React.MouseEvent) {
    if (mouseStartX.current !== null && Math.abs(e.clientX - mouseStartX.current) > 5)
      mouseMoved.current = true
  }
  function onMouseUp() {
    if (!mouseMoved.current) setLightbox(true)
    mouseStartX.current = null
    mouseMoved.current = false
  }

  return (
    <>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
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
          {images.map((src, i) => (
            <div key={i} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', aspectRatio, background: '#F6F6F6', position: 'relative', overflow: 'hidden' }}>
              <img
                src={src}
                alt={`${alt} ${i + 1}`}
                loading={i === 0 ? 'eager' : 'lazy'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none', userSelect: 'none' }}
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
              aria-label={`Foto ${i + 1}`}
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
          <style>{`@keyframes lb-fade{from{opacity:0}to{opacity:1}} .carousel-track::-webkit-scrollbar{display:none}`}</style>
          <button aria-label="Mbyll" onClick={() => setLightbox(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          {current > 0 && (
            <button onClick={e => { e.stopPropagation(); goTo(current - 1) }} aria-label="Foto e mëparshme" style={{ position: 'absolute', left: 12, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer' }}>‹</button>
          )}
          <img
            src={images[current]}
            alt={alt}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '92vw', maxHeight: '86vh', objectFit: 'contain', borderRadius: 8 }}
          />
          {current < count - 1 && (
            <button onClick={e => { e.stopPropagation(); goTo(current + 1) }} aria-label="Foto e ardhshme" style={{ position: 'absolute', right: 12, background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 40, height: 40, fontSize: 20, cursor: 'pointer' }}>›</button>
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

'use client'
import { useState, useEffect, useRef } from 'react'
import type React from 'react'

export type DragPos = { left: number; bottom: number }

/**
 * useDraggable — zhvendosje e elementeve fixed me pointer events.
 *
 * Drag ndodh në nivel dokumenti (nuk humbet kur pointer del nga elementi).
 * Klikimi punon normalisht nëse lëvizja < 5px.
 *
 * @param storageKey  Çelësi localStorage ku ruhet pozicioni.
 * @param getDefault  Funksion që kthen pozicionin fillestar (thirret pas mount-it).
 * @param size        Dimensioni i elementit (px) për clamp brenda viewport.
 */
export function useDraggable(
  storageKey: string,
  getDefault: () => DragPos,
  size = 64
) {
  const posRef = useRef<DragPos | null>(null)
  const [pos, setPos] = useState<DragPos | null>(null)
  const [dragging, setDragging] = useState(false)
  const startRef = useRef<{ px: number; py: number; bl: number; bb: number } | null>(null)
  const didDragRef = useRef(false)

  // Ngarko pozicionin nga localStorage pas mount-it
  useEffect(() => {
    let p: DragPos
    try {
      const s = localStorage.getItem(storageKey)
      p = s ? (JSON.parse(s) as DragPos) : getDefault()
    } catch {
      p = getDefault()
    }
    posRef.current = p
    setPos(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  // Handler i dorës (onPointerDown vendoset mbi container)
  function onPointerDown(e: React.PointerEvent) {
    // Vetëm butonin e majtë (ose touch)
    if (e.button !== 0 && e.pointerType === 'mouse') return
    const cur = posRef.current ?? getDefault()
    startRef.current = { px: e.clientX, py: e.clientY, bl: cur.left, bb: cur.bottom }
    didDragRef.current = false
    setDragging(true)

    // Shto listener-ët mbi dokument (kap pointer edhe kur del jashtë elementit)
    function onMove(ev: PointerEvent) {
      if (!startRef.current) return
      const dx = ev.clientX - startRef.current.px
      const dy = ev.clientY - startRef.current.py
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) didDragRef.current = true
      if (!didDragRef.current) return
      // Parandalon scroll-in e touch-it pasi drag-u u konfirmua
      ev.preventDefault()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const newPos: DragPos = {
        left: Math.max(0, Math.min(vw - size, startRef.current.bl + dx)),
        bottom: Math.max(0, Math.min(vh - size, startRef.current.bb - dy)),
      }
      posRef.current = newPos
      setPos({ ...newPos })
    }

    function onUp() {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      setDragging(false)
      if (didDragRef.current && posRef.current) {
        try { localStorage.setItem(storageKey, JSON.stringify(posRef.current)) } catch {}
        // Mbyll klikun e ardhshëm (ndodh pas pointerup) që të mos aktivizojë butonin
        const suppress = (ce: MouseEvent) => { ce.stopPropagation(); ce.preventDefault() }
        document.addEventListener('click', suppress, { capture: true, once: true })
      }
      startRef.current = null
    }

    // passive:false nevojitet që ev.preventDefault() brenda onMove të punojë
    document.addEventListener('pointermove', onMove, { passive: false })
    document.addEventListener('pointerup', onUp)
  }

  return {
    pos,
    dragging,
    onPointerDown,
  }
}

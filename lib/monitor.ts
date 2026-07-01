'use client'

// Lightweight client → /api/monitor reporter. Never throws, de-dupes in-memory,
// and uses sendBeacon so reports survive navigation/unmount.
const reported = new Set<string>()

export function reportError(err: unknown, source: 'client' | 'boundary' | 'route' = 'client') {
  try {
    const message = err instanceof Error ? err.message : String(err ?? '')
    if (!message || message === 'null' || message === 'undefined') return
    const stack = err instanceof Error ? err.stack : undefined
    const key = message + '|' + (stack || '').slice(0, 120)
    if (reported.has(key)) return
    reported.add(key)

    const body = JSON.stringify({
      message,
      stack,
      source,
      level: 'error',
      url: typeof location !== 'undefined' ? location.href : undefined,
    })

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon('/api/monitor', new Blob([body], { type: 'application/json' }))
    } else {
      fetch('/api/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch { /* monitoring must never break the app */ }
}

// Install global handlers once (uncaught errors + unhandled promise rejections).
export function installGlobalErrorMonitor() {
  if (typeof window === 'undefined') return
  if ((window as any).__alpazarMonitor) return
  ;(window as any).__alpazarMonitor = true
  window.addEventListener('error', (e: ErrorEvent) => reportError(e.error || e.message, 'client'))
  window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => reportError(e.reason, 'client'))
}

'use client'

import { Component, ReactNode } from 'react'
import { supabase } from './supabase'
import { reportError, installGlobalErrorMonitor } from './monitor'

// Auth state sinkronizim global
export function initAuthSync() {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'TOKEN_REFRESHED') { /* silent */ }
    if (event === 'SIGNED_OUT') {
      localStorage.removeItem('alpazar_cart')
      window.location.href = '/auth/login?reason=session_expired'
    }
  })
}

// Supabase error → mesazh shqip
export function supabaseErrorToMessage(error: any): string {
  if (!error) return ''
  const code = error.code ?? ''
  const msg  = error.message ?? ''

  if (code === 'PGRST116')         return 'Rekord nuk u gjet.'
  if (code === '23505')            return 'Ky rekord ekziston tashmë.'
  if (code === '23503')            return 'Lidhja me rekordin tjetër nuk ekziston.'
  if (msg.includes('JWT'))         return 'Sesioni ka skaduar. Kyçu sërish.'
  if (msg.includes('network'))     return 'Problem me lidhjen e internetit.'
  return `Gabim: ${msg}`
}

// Global Error Boundary
export class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidMount() {
    // Start capturing uncaught errors + unhandled promise rejections app-wide.
    installGlobalErrorMonitor()
  }

  componentDidCatch(error: Error) {
    // Nje deploy i ri e ben te vjeter chunk-un JS qe kjo faqe kerkon ->
    // ChunkLoadError. Rikuperim automatik: rifresko nje here (rojtar 20s kunder
    // ciklit, i njejti celes si guard-i ne <head>) qe perdoruesi te marre
    // strukturen e re dhe kurre te mos ngece te e vjetra.
    const m = `${error?.name ?? ''} ${error?.message ?? ''}`
    if (/ChunkLoadError|Loading chunk|dynamically imported module|module script failed/i.test(m)) {
      try {
        const t = Number(sessionStorage.getItem('alpazar-chunk-reload') || 0)
        if (Date.now() - t > 20000) {
          sessionStorage.setItem('alpazar-chunk-reload', String(Date.now()))
          window.location.reload()
          return
        }
      } catch { /* vazhdo te raportimi */ }
    }
    // React render error → send to AI monitor for diagnosis.
    reportError(error, 'boundary')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh', gap: 16,
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          padding: 24, background: '#FFFBEA',
        }}>
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#C42B0F', margin: 0 }}>
            Ndodhi një gabim
          </h2>
          <p style={{ color: '#666', textAlign: 'center', fontSize: 13, maxWidth: 320 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px', background: '#E63312', color: '#fff',
              border: 'none', borderRadius: 10, cursor: 'pointer',
              fontWeight: 700, fontSize: 14, fontFamily: 'inherit',
            }}
          >
            Provo sërish
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

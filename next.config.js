// @ts-check
const { withSentryConfig } = require('@sentry/nextjs')

// Identiteti i ndertimit — burimi qe ushqen /api/version.
// SHENIM: fallback-u KURRE nuk perdor Date.now(): nje vlere qe ndryshon ne cdo
// ndertim prodhon build-id te ndryshem edhe kur kodi eshte i njejte, gje qe
// shkakton mospershtatje te rreme te versionit. Ne Vercel, VERCEL_GIT_COMMIT_SHA
// eshte gjithmone i pranishem; fallback-u eshte nje konstante e qendrueshme.
const BUILD_ID = process.env.VERCEL_GIT_COMMIT_SHA || 'dev'

/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: async () => BUILD_ID,
  env: { NEXT_PUBLIC_BUILD_ID: BUILD_ID },

  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Google Maps API key must be set in Vercel env vars, NOT here (git-exposed)
  // Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel Dashboard → Settings → Env Vars

  compress: true,
  poweredByHeader: false,

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },

  async redirects() {
    return [
      { source: '/login', destination: '/auth/login', permanent: true },
      { source: '/dyqane', destination: '/biznese', permanent: true },
      { source: '/dyqane/:id', destination: '/biznese/:id', permanent: true },
      { source: '/dyqane/:id/:path*', destination: '/biznese/:id/:path*', permanent: true },
    ]
  },

  async rewrites() {
    return [
      { source: '/favicon.ico', destination: '/favicon.png' },
      { source: '/apple-touch-icon.png', destination: '/icons/apple-touch-icon.png' },
      { source: '/apple-touch-icon-precomposed.png', destination: '/icons/apple-touch-icon.png' },
    ]
  },

  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://va.vercel-scripts.com https://vercel.live https://accounts.google.com",
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com https://fonts.gstatic.com",
      "font-src 'self' https://cdn.jsdelivr.net https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://lh3.googleusercontent.com https://avatars.githubusercontent.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://va.vercel-scripts.com https://vitals.vercel-insights.com https://nominatim.openstreetmap.org https://*.sentry.io https://de.sentry.io https://accounts.google.com",
      "frame-src 'self' https://www.openstreetmap.org https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "worker-src blob:",
      "upgrade-insecure-requests",
    ].join('; ')

    return [
      {
        // Faqet publike ISR — lejo edge-cache. Autentikimi behet 100% ne klient
        // (AlpazarProvider), ndaj HTML-ja e serverit eshte e njejte per te gjithe.
        // Me pare 'no-store' anulonte ISR-in: cdo vizite thirrte funksionin.
        source: '/',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/listing/:id',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        // Pjesa tjeter (llogari, mesazhe, admin, API) — kurre ne CDN
        source: '/((?!_next/static|_next/image|icons|favicon|listing/).*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'CDN-Cache-Control', value: 'no-store' },
          { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
      {
        source: '/icons/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: 'alpazar',
  project: 'javascript-nextjs',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})

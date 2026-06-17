import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/next'
import '@tabler/icons-webfont/dist/tabler-icons.min.css'
import { SITE_URL } from '../lib/siteConfig'

const AiFloat               = dynamic(() => import('./components/AiFloat'),            { ssr: false })
const AlpazarProviderDyn    = dynamic(() => import('../lib/context').then(m => ({ default: m.AlpazarProvider })), { ssr: false })
const NotificationToast     = dynamic(() => import('./components/NotificationToast').then(m => ({ default: m.NotificationToast })), { ssr: false })
const MaintenanceBanner     = dynamic(() => import('./components/MaintenanceBanner').then(m => ({ default: m.MaintenanceBanner })), { ssr: false })
const GlobalErrorBoundaryDyn = dynamic(() => import('../lib/error-handler').then(m => ({ default: m.GlobalErrorBoundary })), { ssr: false })
const CookieBannerDyn        = dynamic(() => import('./components/CookieBanner').then(m => ({ default: m.CookieBanner })), { ssr: false })
const AgeGateDyn             = dynamic(() => import('./components/AgeGate').then(m => ({ default: m.AgeGate })), { ssr: false })

export const metadata: Metadata = {
  title: 'ALPAZAR — Shit · Bli · Bëj Pazrin Tënd',
  description: 'Platforma #1 shqiptare e tregtisë dhe shpalljeve online. Zero reklama. Zero pagesa mes përdoruesve. Shit, bli dhe bëj pazarin tënd falas.',
  keywords: 'marketplace shqiperi, shpallje online, shit bli shqiperi, alpazar, tregti online, bazar shqip, shpallje falas',
  authors: [{ name: 'ALPAZAR', url: SITE_URL }],
  applicationName: 'ALPAZAR',
  manifest: '/manifest.json',
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ALPAZAR',
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'sq_AL',
    url: SITE_URL,
    siteName: 'ALPAZAR',
    title: 'ALPAZAR — Platforma #1 Shqiptare e Tregtisë Online',
    description: 'Shit, bli dhe bëj pazarin tënd falas. Zero reklama. Zero komision.',
    images: [{ url: `${SITE_URL}/icons/icon-512.png`, width: 512, height: 512, alt: 'ALPAZAR — Marketplace Shqiptar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALPAZAR — Platforma #1 Shqiptare e Tregtisë Online',
    description: 'Shit, bli dhe bëj pazarin tënd falas. Zero reklama.',
    images: [`${SITE_URL}/icons/icon-512.png`],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ALPAZAR',
    'msapplication-TileColor': '#111111',
    'msapplication-TileImage': '/icons/icon-144.png',
    'google-site-verification': ['VRnlK16BTSvB9jRZifv-un8DY_a2jp5X67XEXokK5xY', 'wNtd2B-Xmy2aTSr0e0eAXJ3RV4MIJyqIDSr'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5C842' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sq">
      <head>
        {/* Module 2: Performance — DNS prefetch for external origins */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://sopafwfkrxpcdaljddoh.supabase.co" />
        <link rel="preconnect" href="https://sopafwfkrxpcdaljddoh.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Module 6: Vercel Web Analytics — 100% falas, GDPR-compliant, zero konfigurim */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        {/* JSON-LD — Google e kupton si marketplace */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "ALPAZAR",
          "url": "https://alpazar.vercel.app",
          "description": "Platforma #1 shqiptare e tregtisë dhe shpalljeve online. Zero reklama.",
          "potentialAction": {
            "@type": "SearchAction",
            "target": { "@type": "EntryPoint", "urlTemplate": "https://alpazar.vercel.app/search?q={search_term_string}" },
            "query-input": "required name=search_term_string"
          },
          "publisher": {
            "@type": "Organization",
            "name": "ALPAZAR",
            "url": "https://alpazar.vercel.app",
            "logo": { "@type": "ImageObject", "url": "https://alpazar.vercel.app/icons/icon-512.png" }
          }
        })}} />
        {/* Service Worker — regjistrim me flag kundër loop-it të pafund */}
        <script dangerouslySetInnerHTML={{__html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
                var reloading = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (reloading) return;
                  reloading = true;
                  window.location.reload();
                });
              }).catch(function() {});
            });
          }
        `}} />
      </head>
      <body style={{ margin: 0, background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <AlpazarProviderDyn>
          <GlobalErrorBoundaryDyn>
          <MaintenanceBanner />
          <NotificationToast />
          <AgeGateDyn>{children}</AgeGateDyn>
          <AiFloat />
          <CookieBannerDyn />
          <Analytics />
          <footer style={{ background: '#111', padding: '22px 16px 28px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ color: '#F5C842', fontWeight: 700, fontSize: 13, letterSpacing: 1, marginBottom: 14 }}>🦅 ALPAZAR</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginBottom: 14 }}>
                <a href="https://facebook.com/alpazaral" aria-label="Facebook" target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className="ti ti-brand-facebook" /></a>
                <a href="https://instagram.com/alpazaral" aria-label="Instagram" target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className="ti ti-brand-instagram" /></a>
                <a href="https://tiktok.com/@alpazaral" aria-label="TikTok" target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className="ti ti-brand-tiktok" /></a>
                <a href="https://t.me/alpazaral" aria-label="Telegram" target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className="ti ti-brand-telegram" /></a>
                <a href="https://linkedin.com/company/alpazar" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className="ti ti-brand-linkedin" /></a>
                <a href="https://x.com/alpazaral" aria-label="X / Twitter" target="_blank" rel="noopener noreferrer" style={{ color: '#555', fontSize: 19, textDecoration: 'none' }}><i className="ti ti-brand-x" /></a>
              </div>
              <nav style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px 14px', marginBottom: 14 }}>
                <a href="/biznese" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Bizneset</a>
                <a href="/search" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Kërko</a>
                <a href="/kushtet" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Kushtet e Përdorimit</a>
                <a href="/privatesia" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Privatësia</a>
                <a href="/cookies" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Cookie-t</a>
                <a href="/rreth-nesh" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Rreth Nesh</a>
                <a href="/kontakt" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Kontakt</a>
                <a href="/siguria" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Siguria</a>
                <a href="/te-dhenat-mia" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>Të dhënat e mia</a>
                <a href="/takedown" style={{ color: '#666', fontSize: 11, textDecoration: 'none' }}>IP / Takedown</a>
                <a href="/referral" style={{ color: '#F5C842', fontSize: 11, textDecoration: 'none', fontWeight: 600 }}>🎁 Referral</a>
              </nav>
              <div style={{ fontSize: 10, color: '#444' }}>© 2026 Alpazar · NIPT/QKB: (në regjistrim) · Tiranë, Shqipëri · Të gjitha të drejtat e rezervuara</div>
            </div>
          </footer>
          </GlobalErrorBoundaryDyn>
        </AlpazarProviderDyn>
      </body>
    </html>
  )
}

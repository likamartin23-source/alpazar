import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import { Analytics } from '@vercel/analytics/next'
import './tabler-icons-subset.css'
import './fonts.css'
import './ui-refine.css'
import { SITE_URL } from '../lib/siteConfig'
import { LanguageProvider } from '../lib/i18n'
import { SiteFooter } from './components/SiteFooter'

const AiFloat               = dynamic(() => import('./components/AiFloat'),            { ssr: false })
const AlpazarProviderDyn    = dynamic(() => import('../lib/context').then(m => ({ default: m.AlpazarProvider })))
const NotificationToast     = dynamic(() => import('./components/NotificationToast').then(m => ({ default: m.NotificationToast })), { ssr: false })
const MaintenanceBanner     = dynamic(() => import('./components/MaintenanceBanner').then(m => ({ default: m.MaintenanceBanner })), { ssr: false })
const GlobalErrorBoundaryDyn = dynamic(() => import('../lib/error-handler').then(m => ({ default: m.GlobalErrorBoundary })))
const CookieBannerDyn        = dynamic(() => import('./components/CookieBanner').then(m => ({ default: m.CookieBanner })), { ssr: false })
const AgeGateDyn             = dynamic(() => import('./components/AgeGate').then(m => ({ default: m.AgeGate })))

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
        <link rel="dns-prefetch" href="https://sopafwfkrxpcdaljddoh.supabase.co" />
        <link rel="preconnect" href="https://sopafwfkrxpcdaljddoh.supabase.co" crossOrigin="anonymous" />
        {/* Fontet self-hosted (pa kërkesë të jashtme render-blocking te Google) —
            preload i peshës kryesore + ikonave për paint të shpejtë. */}
        <link rel="preload" href="/fonts/pjs-400-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/pjs-700-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/tabler-subset.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Module 6: Vercel Web Analytics — 100% falas, GDPR-compliant, zero konfigurim */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <style dangerouslySetInnerHTML={{__html:`[role="button"]:focus-visible,[role="link"]:focus-visible,[role="radio"]:focus-visible,[role="switch"]:focus-visible{outline:2px solid #F5C842;outline-offset:2px;border-radius:4px;}.skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:9999;background:#F5C842;color:#111;padding:8px 16px;font-weight:700;border-radius:4px;text-decoration:none;}.skip-link:focus{left:16px;top:16px;width:auto;height:auto;overflow:visible;}`}} />
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
        <a href="#main-content" className="skip-link">Kalo tek përmbajtja kryesore</a>
        <LanguageProvider>
        <AlpazarProviderDyn>
          <GlobalErrorBoundaryDyn>
          <MaintenanceBanner />
          <NotificationToast />
          <AgeGateDyn><main id="main-content">{children}</main></AgeGateDyn>
          <AiFloat />
          <CookieBannerDyn />
          <Analytics />
          <SiteFooter />
          </GlobalErrorBoundaryDyn>
        </AlpazarProviderDyn>
        </LanguageProvider>
      </body>
    </html>
  )
}

import type { Metadata, Viewport } from 'next'
import dynamic from 'next/dynamic'
import { ConsentedAnalytics } from './components/ConsentedAnalytics'
import './tabler-icons-subset.css'
import './fonts.css'
import './ui-refine.css'
import { SITE_URL } from '../lib/siteConfig'
import { LanguageProvider } from '../lib/i18n'
import { SiteFooter } from './components/SiteFooter'
import { OnlinePresenceProvider } from './components/OnlinePresence'
// AgeGate mbështjell TË GJITHA `children`. I ngarkuar në mënyrë statike (jo `dynamic`) që përmbajtja
// të mos presë një chunk të veçantë — përndryshe në Slow-4G LCP-ja vonohet (overlay-i i moshës del si
// elementi LCP ~7s). Është 'use client' + SSR-safe (overlay vetëm pas mount), ndaj importi statik s'prish gjë.
import { AgeGate } from './components/AgeGate'
import {
  AiFloat, UpdatePrompt, NotificationToast,
  MaintenanceBanner, AnnouncementBar,
  CookieBanner as CookieBannerDyn,
} from './components/ChromeClient'

// `ssr: false` nuk lejohet ne nje Server Component (Next 15) — keto rrine te
// ./components/ChromeClient, qe eshte modul klient. Sjellja s'ndryshon.
const AlpazarProviderDyn     = dynamic(() => import('../lib/context').then(m => ({ default: m.AlpazarProvider })))
const GlobalErrorBoundaryDyn = dynamic(() => import('../lib/error-handler').then(m => ({ default: m.GlobalErrorBoundary })))

export const metadata: Metadata = {
  title: 'ALPAZAR — Shit · Bli · Bëj Pazrin Tënd',
  description: 'Platforma #1 shqiptare e tregtisë dhe shpalljeve online. Zero reklama. Zero pagesa mes përdoruesve. Shit, bli dhe bëj pazarin tënd falas.',
  keywords: 'marketplace shqiperi, shpallje online, shit bli shqiperi, alpazar, tregti online, bazar shqip, shpallje falas',
  authors: [{ name: 'ALPAZAR', url: SITE_URL }],
  applicationName: 'ALPAZAR',
  manifest: '/manifest.json?v=3',
  metadataBase: new URL(SITE_URL),
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ALPAZAR',
  },
  icons: {
    icon: [
      { url: '/favicon.png?v=3', type: 'image/png' },
      { url: '/icons/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'sq_AL',
    url: SITE_URL,
    siteName: 'ALPAZAR',
    title: 'ALPAZAR — Platforma #1 Shqiptare e Tregtisë Online',
    description: 'Shit, bli dhe bëj pazarin tënd falas. Zero reklama. Zero komision.',
    images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: 'ALPAZAR — Marketplace Shqiptar' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALPAZAR — Platforma #1 Shqiptare e Tregtisë Online',
    description: 'Shit, bli dhe bëj pazarin tënd falas. Zero reklama.',
    images: [`${SITE_URL}/api/og`],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': 'ALPAZAR',
    'msapplication-TileColor': '#111111',
    'msapplication-TileImage': '/icons/icon-144.png?v=3',
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
        <link rel="manifest" href="/manifest.json?v=3" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png?v=3" />
        <style dangerouslySetInnerHTML={{__html:`[role="button"]:focus-visible,[role="link"]:focus-visible,[role="radio"]:focus-visible,[role="switch"]:focus-visible{outline:2px solid #F5C842;outline-offset:2px;border-radius:4px;}.skip-link{position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;z-index:9999;background:#F5C842;color:#111;padding:8px 16px;font-weight:700;border-radius:4px;text-decoration:none;}.skip-link:focus{left:16px;top:16px;width:auto;height:auto;overflow:visible;}html{scroll-padding-top:64px;scroll-padding-bottom:96px;}`}} />
        {/* Speculation Rules — navigojme me window.location.href, ndaj
            prefetch-i i Next-it nuk aktivizohet KURRE. Keto rregulla punojne
            mbi navigime dokumenti, pra jane e vetmja menyre qe kemi per te
            parangarkuar. `prefetch` (jo `prerender`) qellimisht: prerender-i
            e EKZEKUTON faqen — per nje marketplace kjo do te numeronte shikime
            shpalljesh qe s'ndodhen. Rruget private/veprim perjashtohen.
            Chromium-only, degradim i paster kudo tjeter.
            https://developer.chrome.com/docs/web-platform/prerender-pages */}
        <script type="speculationrules" dangerouslySetInnerHTML={{__html: JSON.stringify({
          prefetch: [{
            where: { and: [
              { href_matches: '/*' },
              { not: { href_matches: [
                '/api/*', '/admin*', '/auth/*', '/messages*', '/notifications*',
                '/profile*', '/dashboard*', '/favorites*', '/saved-searches*',
                '/te-dhenat-mia*', '/listing/new', '/biznese/new',
                '/listing/*/edit', '/biznese/*/edit',
              ] } },
            ] },
            eagerness: 'moderate',
          }],
        })}} />
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
            "logo": { "@type": "ImageObject", "url": "https://alpazar.vercel.app/icons/icon-512.png?v=3" },
            "sameAs": [
              "https://facebook.com/alpazaral",
              "https://instagram.com/alpazaral",
              "https://tiktok.com/@alpazaral",
              "https://t.me/alpazaral",
              "https://linkedin.com/company/alpazar",
              "https://x.com/alpazaral"
            ],
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "url": "https://alpazar.vercel.app/kontakt",
              "availableLanguage": ["sq"]
            }
          }
        })}} />
        {/* Rikuperim automatik nga ChunkLoadError — GARANCIA kunder "struktures se vjeter".
            Pas nje deploy-i, faqja e vjeter mund te kerkoje nje chunk JS qe s'ekziston
            me; e kapim globalisht (error + unhandledrejection) dhe rifreskojme nje here
            (rojtar 20s kunder ciklit). Rri ne <head> qe te jete aktiv para cdo importi. */}
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            var KEY='alpazar-chunk-reload';
            function isChunk(m){
              if(!m) return false; m=String(m);
              return m.indexOf('ChunkLoadError')>=0
                || (m.indexOf('Loading chunk')>=0 && m.indexOf('failed')>=0)
                || m.indexOf('Failed to fetch dynamically imported module')>=0
                || m.indexOf('error loading dynamically imported module')>=0
                || m.indexOf('Importing a module script failed')>=0;
            }
            function recover(){
              try{ var t=+(sessionStorage.getItem(KEY)||0); if(Date.now()-t<20000) return; sessionStorage.setItem(KEY,String(Date.now())); }catch(e){}
              // 1s-e-re->e-vjeter: SW i vjeter thyen chunk-et e reja -> ChunkLoadError -> reload -> SW sherben shell-in e vjeter.
              // Prandaj: heq SW + cache (te koordinuar), PASTAJ reload -> reload pa SW -> chunk-et e reja -> pa ChunkLoadError -> rri i ri.
              var done=false;
              function go(){ if(done) return; done=true; try{ location.reload(); }catch(e){} }
              try{
                var tasks=[];
                if ('serviceWorker' in navigator) {
                  tasks.push(navigator.serviceWorker.getRegistrations().then(function(rs){
                    return Promise.all(rs.map(function(r){ return r.unregister().catch(function(){}); }));
                  }).catch(function(){}));
                }
                if (window.caches && caches.keys) {
                  tasks.push(caches.keys().then(function(ks){
                    return Promise.all(ks.map(function(k){ return caches.delete(k).catch(function(){}); }));
                  }).catch(function(){}));
                }
                Promise.all(tasks).then(go, go);
                setTimeout(go, 1500); // fallback nese SW s'pergjigjet
              } catch(e){ go(); }
            }
            window.addEventListener('error', function(e){ var m=(e&&(e.message||(e.error&&(e.error.message||e.error.name))))||''; if(isChunk(m)) recover(); }, true);
            window.addEventListener('unhandledrejection', function(e){ var r=e&&e.reason; var m=(r&&(r.message||r.name))||(typeof r==='string'?r:''); if(isChunk(m)) recover(); });
          })();
        `}} />
        {/* SERVICE WORKER — HEQUR QËLLIMISHT.
            Për muaj të tërë PWA-ja shërbente "versionin e vjetër" në pajisje (me
            flake të së resë që kthehej me forcë te e vjetra) — kurthi klasik i një
            service worker-i që rimerr kontrollin dhe shërben app-shell-in e vjetër.
            Për freski ABSOLUTE (prioriteti #1) app-i NUK regjistron më asnjë SW.
            public/sw.js është kthyer në vetëshkatërrues: pajisjet që kanë ende
            regjistrimin e vjetër, në kontrollin e radhës të /sw.js (no-cache),
            marrin kill-switch-in që fshin çdo cache dhe ç'regjistron SW-në. Pa SW
            → pa cache → shfletuesi merr gjithmonë nga rrjeti → `no-store` garanton
            që s'ka më kurrë version i vjetër. Një pastrim shtesë nga ana e faqes
            bëhet te ChromeClient (çregjistrim + fshirje cache, një herë). */}
        <script dangerouslySetInnerHTML={{__html: `
          (function(){
            try {
              // AUTO-SHPËTIM I HESHTUR (RUAN SESIONIN): app-i NUK regjistron asnjë SW. Nëse një SW
              // i vjetër po e KONTROLLON faqen (controller != null), e çregjistrojmë + fshijmë cache-t
              // dhe bëjmë NJË reload — pa Clear-Site-Data, pra pa e nxjerrë përdoruesin nga llogaria.
              // Rojtar kundër ciklit: sessionStorage _alpz_swr (mbijeton një reload të thjeshtë).
              // Nuk e detyrojmë kurrë /rifresko automatikisht (ai fshin sesionin — vetëm me klik të
              // përdoruesit, §2). Rasti kokëfortë (iOS PWA) zgjidhet nga butoni manual "Rifresko".
              if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                var tried = false;
                try { tried = !!sessionStorage.getItem('_alpz_swr'); } catch(e){}
                if (!tried) {
                  try { sessionStorage.setItem('_alpz_swr','1'); } catch(e){}
                  var done=false; var go=function(){ if(done) return; done=true; try{ location.reload(); }catch(e){} };
                  var tasks=[];
                  tasks.push(navigator.serviceWorker.getRegistrations().then(function(rs){
                    return Promise.all(rs.map(function(r){ return r.unregister().catch(function(){}); }));
                  }).catch(function(){}));
                  if (window.caches && caches.keys) {
                    tasks.push(caches.keys().then(function(ks){
                      return Promise.all(ks.map(function(k){ return caches.delete(k).catch(function(){}); }));
                    }).catch(function(){}));
                  }
                  Promise.all(tasks).then(go, go);
                  setTimeout(go, 1500);
                  return;
                }
                // Provuam njëherë e SW-ja ende kontrollon (tipike iOS): NUK dalim nga llogaria automatikisht.
              }
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(rs){
                  rs.forEach(function(r){ r.unregister().catch(function(){}); });
                }).catch(function(){});
              }
              if (window.caches && caches.keys) {
                caches.keys().then(function(ks){ ks.forEach(function(k){ caches.delete(k).catch(function(){}); }); }).catch(function(){});
              }
            } catch(e){}
          })();
        `}} />
      </head>
      <body style={{ margin: 0, background: '#FFFBEA', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
        <a href="#main-content" className="skip-link">Kalo tek përmbajtja kryesore</a>
        <LanguageProvider>
        <AlpazarProviderDyn>
          <GlobalErrorBoundaryDyn>
          <OnlinePresenceProvider>
          <MaintenanceBanner />
          <AnnouncementBar />
          <NotificationToast />
          <AgeGate><main id="main-content">{children}</main></AgeGate>
          <AiFloat />
          <UpdatePrompt />
          <CookieBannerDyn />
          <ConsentedAnalytics />
          <SiteFooter />
          </OnlinePresenceProvider>
          </GlobalErrorBoundaryDyn>
        </AlpazarProviderDyn>
        </LanguageProvider>
      </body>
    </html>
  )
}

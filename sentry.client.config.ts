import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://244ab7a635f1c72c547df528a2c436ef@o4511440664723456.ingest.de.sentry.io/4511548220768336'

// Session Replay regjistron ekranin e përdoruesit — nuk është "thelbësore" për
// shërbimin, ndaj kërkon PËLQIM (neni 123/6, ligji 9918/2008). Gjurmimi i gabimeve
// mbetet: pa të nuk mirëmbahet dot shërbimi, dhe nuk regjistron ekran.
//
// `maskAllText:false` ishte gabim i rëndë: dërgonte te Sentry tekstin e lexueshëm
// të ekranit — mesazhe, të dhëna profili, çdo gjë e shkruar. Tani maskimi është
// gjithmonë aktiv, edhe kur përdoruesi e ka pranuar Replay-n.
const replayLejohet = (() => {
  try { return localStorage.getItem('alpazar_cookie_consent') === 'accepted' } catch { return false }
})()

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: replayLejohet ? 1.0 : 0,
  replaysSessionSampleRate: replayLejohet ? 0.05 : 0,
  integrations: replayLejohet
    ? [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })]
    : [],
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Network request failed/,
  ],
})

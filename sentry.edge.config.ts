import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  'https://244ab7a635f1c72c547df528a2c436ef@o4511440664723456.ingest.de.sentry.io/4511548220768336'

Sentry.init({
  dsn: SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})

import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Next 15 e thirr kete per cdo gabim ne server, perfshire ata brenda React
// Server Components te ndera — te cilet nuk kalojne nga error boundary-t.
// Pa te, Sentry i humbte fare (paralajmerim ne build: "Could not find
// `onRequestError` hook").
export const onRequestError = Sentry.captureRequestError

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://alpazar.vercel.app').replace(/\/$/, '')
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '')

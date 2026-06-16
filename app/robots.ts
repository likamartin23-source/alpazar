import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/auth/',
          '/dashboard',
          '/messages',
          '/notifications',
          '/favorites',
          '/saved-searches',
          '/profile',
          '/te-dhenat-mia',
          '/referral',
          '/listing/new',
          '/listing/*/edit',
          '/biznese/new',
          '/biznese/*/edit',
        ],
      },
    ],
    sitemap: 'https://alpazar.vercel.app/sitemap.xml',
  }
}

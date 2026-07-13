import { MetadataRoute } from 'next'
import { SITE_URL } from '../lib/siteConfig'

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
          '/listing/new',
          '/listing/*/edit',
          '/biznese/new',
          '/biznese/*/edit',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

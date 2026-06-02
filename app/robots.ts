import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api/', '/dashboard', '/messages', '/profile', '/listing/new', '/listing/*/edit'],
      },
    ],
    sitemap: 'https://alpazar.vercel.app/sitemap.xml',
  }
}

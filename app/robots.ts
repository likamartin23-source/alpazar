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
          // Navigim me faseta: `/search` prodhon URL të pafundme me të njëjtën
          // përmbajtje si faqet /kategori/*. Faqet e kategorive janë sipërfaqja
          // jonë e indeksueshme; kërkimi është vegël përdoruesi, jo faqe.
          // https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation
          '/search',
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

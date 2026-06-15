import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/_next/',
          '/admin/',
          '/api/',
          '/notizie/preview/',
        ],
      },
    ],
    sitemap: 'https://cvlt.ch/sitemap.xml',
  }
}

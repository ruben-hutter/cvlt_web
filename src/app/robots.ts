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
          '/wp-content/',
          '/wp-includes/',
          '/wp-admin/',
          '/wp-json/',
          '/category/',
          '/tag/',
          '/author/',
          '/page/',
          '/archives/',
          '/comments/',
          '/date/',
          '/search/',
          '/*?p=*',
          '/*?page_id=*',
          '/*?attachment_id=*',
          '/*?cat=*',
          '/*?m=*',
          '/*?s=*',
          '/*?paged=*',
        ],
      },
    ],
    sitemap: 'https://cvlt.ch/sitemap.xml',
  }
}

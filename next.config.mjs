import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['sharp'],
  async redirects() {
    return [
      // --- Old WordPress pages → new Next.js pages ---
      { source: '/il-club', destination: '/comitato', permanent: true },
      { source: '/aderire-al-club', destination: '/adesione', permanent: true },
      { source: '/pagamento-quota-sociale', destination: '/quota-sociale', permanent: true },
      { source: '/twint', destination: '/quota-sociale', permanent: true },

      // Volare in Ticino → info-volo
      { source: '/volare-in-ticino', destination: '/info-volo', permanent: true },
      { source: '/siti-di-volo', destination: '/info-volo', permanent: true },
      { source: '/le-zone-di-controllo-ctr', destination: '/info-volo', permanent: true },
      { source: '/le-zone-di-controllo-ctr-2', destination: '/info-volo', permanent: true },
      { source: '/le-awy', destination: '/info-volo', permanent: true },
      { source: '/volare-in-ticino-2', destination: '/info-volo', permanent: true },
      { source: '/il-dabs', destination: '/info-volo', permanent: true },
      { source: '/locarno-ifr-area', destination: '/info-volo', permanent: true },
      { source: '/zone-di-tranquillita', destination: '/info-volo', permanent: true },
      { source: '/links', destination: '/info-volo', permanent: true },
      { source: '/link-meteo', destination: '/info-volo', permanent: true },

      // Calendar / Activities
      { source: '/attivita', destination: '/calendario', permanent: true },
      { source: '/calendario-eventi', destination: '/calendario', permanent: true },

      // Competitions
      { source: '/ccc-regolamento', destination: '/gare', permanent: true },
      { source: '/ccc-hall-of-fame', destination: '/gare', permanent: true },

      // Other pages
      { source: '/voli-biposto', destination: '/biposto', permanent: true },
      { source: '/vento-included', destination: '/vento', permanent: true },
      { source: '/webcams', destination: '/vento', permanent: true },
      { source: '/chi-e-in-volo', destination: '/', permanent: true },
      { source: '/video', destination: '/galleria', permanent: true },
      { source: '/carica-foto', destination: '/admin', permanent: true },
      { source: '/cookie-policy', destination: '/', permanent: true },
      { source: '/guests', destination: '/', permanent: true },

      // Old WordPress events (/events/* → /calendario)
      { source: '/events/:slug*', destination: '/calendario', permanent: true },

      // Gallery pages (per-year and range pages → single gallery)
      { source: '/gallery-:year(\\d{4})', destination: '/galleria', permanent: true },
      { source: '/gallery-oggi-2017', destination: '/galleria', permanent: true },
      { source: '/gallery-2016-2001', destination: '/galleria', permanent: true },
      { source: '/gallery-2016-2013', destination: '/galleria', permanent: true },
      { source: '/gallery-2012-2009', destination: '/galleria', permanent: true },
      { source: '/gallery-2008-2005', destination: '/galleria', permanent: true },
      { source: '/gallery-2004-2001', destination: '/galleria', permanent: true },
    ]
  },
}

export default withPayload(nextConfig)

import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import React from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { validateEnvOrThrow } from '@/lib/env'
import { organizationJsonLd } from '@/lib/jsonld'
import './globals.css'

const ubuntu = Ubuntu({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

validateEnvOrThrow()

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://cvlt.ch'

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'CVLT - Club Volo Libero Ticino',
    template: '%s - CVLT',
  },
  description:
    'Club Volo Libero Ticino (CVLT) — associazione di parapendio e deltaplano in Ticino dal 1987. Gare, notizie, meteo e calendario eventi.',
  openGraph: {
    title: 'CVLT - Club Volo Libero Ticino',
    description:
      'Club Volo Libero Ticino — associazione di parapendio e deltaplano in Ticino dal 1987.',
    locale: 'it_CH',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'CVLT - Club Volo Libero Ticino' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="CVLT Notizie" href="/feed" />
        <script data-goatcounter="https://cvlt.goatcounter.com/count" async src="https://gc.zgo.at/count.js" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationJsonLd(baseUrl) }}
        />
      </head>
      <body className={`${ubuntu.className} bg-white text-cvlt-gray-900 antialiased`} suppressHydrationWarning>
        <Header />
        <div className="min-h-[calc(100vh-8rem)]">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  )
}

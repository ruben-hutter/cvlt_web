import type { Metadata } from 'next'
import { Ubuntu } from 'next/font/google'
import React from 'react'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { validateEnvOrThrow } from '@/lib/env'
import './globals.css'

const ubuntu = Ubuntu({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
})

validateEnvOrThrow()

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'https://cvlt.ch'),
  title: 'CVLT - Club Volo Libero Ticino',
  description: 'Club di parapendio del canton Ticino',
  openGraph: {
    title: 'CVLT - Club Volo Libero Ticino',
    description: 'Club di parapendio del canton Ticino',
    locale: 'it_CH',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <link rel="alternate" type="application/rss+xml" title="CVLT Notizie" href="/feed" />
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

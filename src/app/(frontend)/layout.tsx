import type { Metadata } from 'next'
import React from 'react'
import { Header } from './components/Header'
import './globals.css'

export const metadata: Metadata = {
  title: 'CVLT — Club Volo Libero Ticino',
  description: 'Club di parapendio del canton Ticino',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="bg-white text-gray-900 antialiased" suppressHydrationWarning>
        <Header />
        {children}
      </body>
    </html>
  )
}

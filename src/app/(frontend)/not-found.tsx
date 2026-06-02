import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pagina non trovata',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-6xl font-bold text-cvlt-gray-200">404</h1>
      <p className="mt-4 text-lg text-cvlt-gray-600">
        Pagina non trovata.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-cvlt-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cvlt-blue-dark"
      >
        Torna alla home
      </Link>
    </main>
  )
}

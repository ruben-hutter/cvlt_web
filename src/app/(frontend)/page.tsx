export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export default async function HomePage() {
  const payload = await getPayload({ config })

  const now = new Date().toISOString()

  const news = await payload.find({
    collection: 'news',
    where: {
      status: { equals: 'published' },
      publishDate: { less_than_equal: now },
    },
    sort: '-publishDate',
    limit: 5,
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-bold">Club Volo Libero Ticino</h1>
      <p className="mt-2 text-lg text-gray-600">Parapendio in Ticino dal 1988</p>

      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Ultime notizie</h2>
          <Link href="/notizie" className="text-sm font-medium text-blue-600 hover:underline">
            Tutte le notizie →
          </Link>
        </div>

        {news.docs.length === 0 ? (
          <p className="mt-6 text-gray-500">Nessuna notizia pubblicata.</p>
        ) : (
          <ul className="mt-6 space-y-6">
            {news.docs.map((article) => (
              <li key={article.id} className="border-b border-gray-100 pb-6">
                <Link href={`/notizie/${article.slug}`} className="group block">
                  <time className="text-sm text-gray-500">
                    {new Date(article.publishDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <h3 className="mt-1 text-lg font-semibold group-hover:text-blue-600">
                    {article.title}
                  </h3>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}

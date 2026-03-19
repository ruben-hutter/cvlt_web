import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const metadata = {
  title: 'Notizie — CVLT',
}

export default async function NewsPage() {
  const payload = await getPayload({ config })

  const news = await payload.find({
    collection: 'news',
    where: { status: { equals: 'published' } },
    sort: '-date',
    limit: 50,
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold">Notizie</h1>

      {news.docs.length === 0 ? (
        <p className="mt-6 text-gray-500">Nessuna notizia pubblicata.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {news.docs.map((article) => (
            <li key={article.id} className="border-b border-gray-100 pb-8">
              <Link href={`/notizie/${article.slug}`} className="group block">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <time>
                    {new Date(article.date).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {article.category === 'featured'
                      ? 'In evidenza'
                      : article.category === 'activities'
                        ? 'Attività'
                        : 'Archivio'}
                  </span>
                </div>
                <h2 className="mt-2 text-xl font-semibold group-hover:text-blue-600">
                  {article.title}
                </h2>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export const revalidate = 60

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

export const metadata = {
  title: 'Notizie — CVLT',
}

function getThumbnailUrl(article: any): string | null {
  if (article.thumbnail && typeof article.thumbnail === 'object') {
    return article.thumbnail.url
  }
  for (const block of article.layout || []) {
    if (block.blockType === 'image' && block.image?.url) return block.image.url
    if (block.blockType === 'textImage' && block.image?.url) return block.image.url
    if (block.blockType === 'gallery' && block.images?.[0]?.image?.url) return block.images[0].image.url
  }
  return null
}

export default async function NewsPage() {
  const payload = await getPayload({ config })

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const news = await payload.find({
    collection: 'news',
    where: {
      status: { equals: 'published' },
      publishDate: { less_than_equal: endOfToday.toISOString() },
    },
    sort: '-publishDate',
    limit: 50,
    depth: 1,
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-cvlt-gray-900">Notizie</h1>

      {news.docs.length === 0 ? (
        <p className="mt-6 text-cvlt-gray-500">Nessuna notizia pubblicata.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.docs.map((article) => {
            const thumb = getThumbnailUrl(article)
            return (
              <Link
                key={article.id}
                href={`/notizie/${article.slug}`}
                className="group overflow-hidden rounded-lg border border-cvlt-gray-200 transition-all hover:border-cvlt-blue/30 hover:shadow-lg"
              >
                {thumb ? (
                  <div className="aspect-[16/9] overflow-hidden bg-cvlt-gray-100">
                    <img
                      src={thumb}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-[16/9] items-center justify-center bg-cvlt-gray-100">
                    <svg className="h-10 w-10 text-cvlt-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                    </svg>
                  </div>
                )}
                <div className="p-4">
                  <time className="text-xs font-medium text-cvlt-gray-500">
                    {new Date(article.publishDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <h2 className="mt-1 text-base font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
                    {article.title}
                  </h2>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}

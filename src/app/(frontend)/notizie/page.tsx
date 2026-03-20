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
      <h1 className="text-3xl font-bold">Notizie</h1>

      {news.docs.length === 0 ? (
        <p className="mt-6 text-gray-500">Nessuna notizia pubblicata.</p>
      ) : (
        <ul className="mt-8 space-y-8">
          {news.docs.map((article) => {
            const thumb = getThumbnailUrl(article)
            return (
              <li key={article.id} className="border-b border-gray-100 pb-8">
                <Link href={`/notizie/${article.slug}`} className="group flex gap-5">
                  {thumb && (
                    <img
                      src={thumb}
                      alt=""
                      width={64}
                      height={64}
                      style={{ width: 64, height: 64, objectFit: 'cover', flexShrink: 0 }}
                      className="rounded"
                    />
                  )}
                  <div>
                    <time className="text-sm text-gray-500">
                      {new Date(article.publishDate).toLocaleDateString('it-CH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                    <h2 className="mt-2 text-xl font-semibold group-hover:text-blue-600">
                      {article.title}
                    </h2>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}

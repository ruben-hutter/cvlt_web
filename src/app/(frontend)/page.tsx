export const revalidate = 60 // rebuild page every 60 seconds

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'

function getThumbnailUrl(article: any): string | null {
  if (article.thumbnail && typeof article.thumbnail === 'object') {
    return article.thumbnail.url
  }
  // Fallback: first image found in layout blocks
  for (const block of article.layout || []) {
    if (block.blockType === 'image' && block.image?.url) return block.image.url
    if (block.blockType === 'textImage' && block.image?.url) return block.image.url
    if (block.blockType === 'gallery' && block.images?.[0]?.image?.url) return block.images[0].image.url
  }
  return null
}

export default async function HomePage() {
  const payload = await getPayload({ config })

  // Use end of today to include all articles published "today"
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const news = await payload.find({
    collection: 'news',
    where: {
      status: { equals: 'published' },
      publishDate: { less_than_equal: endOfToday.toISOString() },
    },
    sort: '-publishDate',
    limit: 5,
    depth: 1,
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
            {news.docs.map((article) => {
              const thumb = getThumbnailUrl(article)
              return (
                <li key={article.id} className="border-b border-gray-100 pb-6">
                  <Link href={`/notizie/${article.slug}`} className="group flex gap-4">
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        width={56}
                        height={56}
                        style={{ width: 56, height: 56, objectFit: 'cover', flexShrink: 0 }}
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
                      <h3 className="mt-1 text-lg font-semibold group-hover:text-blue-600">
                        {article.title}
                      </h3>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

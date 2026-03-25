export const dynamic = 'force-dynamic'

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
  let news = { docs: [] as any[] }

  try {
    const payload = await getPayload({ config })

    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    news = await payload.find({
      collection: 'news',
      where: {
        status: { equals: 'published' },
        publishDate: { less_than_equal: endOfToday.toISOString() },
      },
      sort: '-publishDate',
      limit: 50,
      depth: 2,
    })
  } catch (e) {
    console.error('[NOTIZIE] DB query failed:', e)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold text-cvlt-gray-900">Notizie</h1>

      {news.docs.length === 0 ? (
        <p className="mt-6 text-cvlt-gray-500">Nessuna notizia pubblicata.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.docs.map((article) => {
            const thumb = getThumbnailUrl(article)
            const event = article.relatedEvent && typeof article.relatedEvent === 'object'
              ? article.relatedEvent : null
            return (
              <div key={article.id} className="group overflow-hidden rounded-lg border border-cvlt-gray-200 transition-all hover:border-cvlt-blue/30 hover:shadow-lg">
                <Link href={`/notizie/${article.slug}`}>
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
                </Link>
                <div className="p-4">
                  <time className="text-xs font-medium text-cvlt-gray-500">
                    {new Date(article.publishDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <Link href={`/notizie/${article.slug}`}>
                    <h2 className="mt-1 text-base font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
                      {article.title}
                    </h2>
                  </Link>
                  {event && (
                    <Link
                      href={`/calendario/${event.slug || event.id}`}
                      className="mt-2 inline-flex items-center gap-1 rounded-full bg-cvlt-blue-light px-2 py-0.5 text-xs font-medium text-cvlt-blue transition-colors hover:bg-cvlt-blue hover:text-white"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                      </svg>
                      {event.title}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}

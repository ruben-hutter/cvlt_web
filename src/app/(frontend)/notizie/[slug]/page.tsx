export const revalidate = 60

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NewsLayout } from '../../components/RichTextImage'
import { ArticleLightbox } from '../../components/ArticleLightbox'
import type { Metadata } from 'next'

type Args = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'news',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
  })

  const article = result.docs[0]
  if (!article) return { title: 'Notizia non trovata — CVLT' }

  return { title: `${article.title} — CVLT` }
}

export default async function NewsArticlePage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config })

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const result = await payload.find({
    collection: 'news',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
      publishDate: { less_than_equal: endOfToday.toISOString() },
    },
    limit: 1,
    depth: 2,
  })

  const article = result.docs[0]
  if (!article) notFound()

  const relatedEvent = article.relatedEvent && typeof article.relatedEvent === 'object'
    ? article.relatedEvent
    : null

  // Collect all image URLs from layout blocks for lightbox
  const allImages: string[] = []
  for (const block of (article.layout as any[]) || []) {
    if (block.blockType === 'image' && block.image?.url) allImages.push(block.image.url)
    if (block.blockType === 'textImage' && block.image?.url) allImages.push(block.image.url)
    if (block.blockType === 'gallery') {
      for (const item of block.images || []) {
        if (item.image?.url) allImages.push(item.image.url)
      }
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/notizie"
        className="inline-flex items-center gap-1 text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Tutte le notizie
      </Link>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        {/* Article */}
        <article className="min-w-0 flex-1">
          <time className="text-sm font-medium text-cvlt-gray-500">
            {new Date(article.publishDate).toLocaleDateString('it-CH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
          <h1 className="mt-2 text-3xl font-bold text-cvlt-gray-900">{article.title}</h1>

          <ArticleLightbox images={allImages}>
            <div className="mt-8">
              <NewsLayout blocks={article.layout as any} />
            </div>
          </ArticleLightbox>
        </article>

        {/* Sidebar: related event */}
        {relatedEvent && (
          <aside className="w-full flex-shrink-0 lg:w-72">
            <div className="rounded-lg border border-cvlt-blue/20 bg-cvlt-blue-light p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cvlt-blue-dark">
                Evento collegato
              </h3>
              <Link
                href={`/calendario/${relatedEvent.id}`}
                className="mt-2 block text-lg font-semibold text-cvlt-gray-900 transition-colors hover:text-cvlt-blue"
              >
                {relatedEvent.title}
              </Link>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-cvlt-gray-500">Data</dt>
                  <dd className="text-cvlt-gray-900">
                    {new Date(relatedEvent.startDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {relatedEvent.endDate && (
                      <> — {new Date(relatedEvent.endDate).toLocaleDateString('it-CH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}</>
                    )}
                  </dd>
                </div>
                {relatedEvent.backupStartDate && (
                  <div>
                    <dt className="font-medium text-cvlt-gray-500">Data di riserva</dt>
                    <dd className="text-cvlt-gray-900">
                      {new Date(relatedEvent.backupStartDate).toLocaleDateString('it-CH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      {relatedEvent.backupEndDate && (
                        <> — {new Date(relatedEvent.backupEndDate).toLocaleDateString('it-CH', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}</>
                      )}
                    </dd>
                  </div>
                )}
                {relatedEvent.location && (
                  <div>
                    <dt className="font-medium text-cvlt-gray-500">Luogo</dt>
                    <dd className="text-cvlt-gray-900">{relatedEvent.location}</dd>
                  </div>
                )}
                {relatedEvent.status === 'tentative' && (
                  <div>
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Provvisorio
                    </span>
                  </div>
                )}
                {relatedEvent.status === 'cancelled' && (
                  <div>
                    <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Annullato
                    </span>
                  </div>
                )}
                {relatedEvent.externalLink && (
                  <div className="pt-1">
                    <a
                      href={relatedEvent.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
                    >
                      Dettagli / Iscrizione
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-4.5-6H18m0 0v4.5m0-4.5L10.5 13.5" />
                      </svg>
                    </a>
                  </div>
                )}
              </dl>
            </div>
          </aside>
        )}
      </div>
    </main>
  )
}

export const revalidate = 60

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NewsLayout } from '../../components/RichTextImage'
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link href="/notizie" className="text-sm text-blue-600 hover:underline">
        ← Tutte le notizie
      </Link>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        {/* Article */}
        <article className="min-w-0 flex-1">
          <time className="text-sm text-gray-500">
            {new Date(article.publishDate).toLocaleDateString('it-CH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
          <h1 className="mt-2 text-3xl font-bold">{article.title}</h1>

          <div className="mt-8">
            <NewsLayout blocks={article.layout as any} />
          </div>
        </article>

        {/* Sidebar: related event */}
        {relatedEvent && (
          <aside className="w-full flex-shrink-0 lg:w-72">
            <div className="rounded-lg border border-gray-200 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400">Evento collegato</h3>
              <h4 className="mt-2 text-lg font-semibold">{relatedEvent.title}</h4>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Data</dt>
                  <dd>
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
                {relatedEvent.backupDate && (
                  <div>
                    <dt className="font-medium text-gray-500">Data di riserva</dt>
                    <dd>{new Date(relatedEvent.backupDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}</dd>
                  </div>
                )}
                {relatedEvent.location && (
                  <div>
                    <dt className="font-medium text-gray-500">Luogo</dt>
                    <dd>{relatedEvent.location}</dd>
                  </div>
                )}
                {relatedEvent.status === 'tentative' && (
                  <div>
                    <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Provvisorio</span>
                  </div>
                )}
                {relatedEvent.status === 'cancelled' && (
                  <div>
                    <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Annullato</span>
                  </div>
                )}
                {relatedEvent.externalLink && (
                  <div>
                    <a
                      href={relatedEvent.externalLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Dettagli / Iscrizione →
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

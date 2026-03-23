export const revalidate = 60

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'

type Args = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config })

  try {
    const event = await payload.findByID({ collection: 'events', id, depth: 0 })
    return { title: `${event.title} — CVLT` }
  } catch {
    return { title: 'Evento non trovato — CVLT' }
  }
}

export default async function EventPage({ params }: Args) {
  const { id } = await params
  const payload = await getPayload({ config })

  let event
  try {
    event = await payload.findByID({ collection: 'events', id, depth: 0 })
  } catch {
    notFound()
  }

  // Find all published news linked to this event
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const newsResult = await payload.find({
    collection: 'news',
    where: {
      relatedEvent: { equals: event.id },
      status: { equals: 'published' },
      publishDate: { less_than_equal: endOfToday.toISOString() },
    },
    sort: '-publishDate',
    limit: 50,
    depth: 1,
  })

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

  // Find related photo albums
  const albumResult = await payload.find({
    collection: 'photo-albums',
    where: {
      relatedEvent: { equals: event.id },
    },
    limit: 10,
    depth: 1,
  })

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/calendario"
        className="inline-flex items-center gap-1 text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Calendario
      </Link>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row">
        {/* News linked to this event */}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-cvlt-gray-900">{event.title}</h1>

          {newsResult.docs.length === 0 && albumResult.docs.length === 0 ? (
            <p className="mt-8 text-cvlt-gray-500">Nessuna notizia o album collegato a questo evento.</p>
          ) : (
            <div className="mt-8 space-y-8">
              {/* News articles */}
              {newsResult.docs.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-cvlt-gray-900">Notizie</h2>
                  <div className="mt-4 space-y-4">
                    {newsResult.docs.map((article) => {
                      const thumb = getThumbnailUrl(article)
                      return (
                        <Link
                          key={article.id}
                          href={`/notizie/${article.slug}`}
                          className="group flex gap-4 rounded-lg border border-cvlt-gray-200 p-4 transition-all hover:border-cvlt-blue/30 hover:shadow-md"
                        >
                          {thumb && (
                            <img
                              src={thumb}
                              alt=""
                              width={72}
                              height={72}
                              style={{ width: 72, height: 72, objectFit: 'cover', flexShrink: 0 }}
                              className="rounded-md"
                            />
                          )}
                          <div className="min-w-0">
                            <time className="text-xs font-medium text-cvlt-gray-500">
                              {new Date(article.publishDate).toLocaleDateString('it-CH', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </time>
                            <h3 className="mt-1 text-base font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
                              {article.title}
                            </h3>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Photo albums */}
              {albumResult.docs.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-cvlt-gray-900">Galleria</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {albumResult.docs.map((album) => {
                      const cover = album.photos?.[0]
                      const coverUrl = typeof cover === 'object' && cover?.url ? cover.url : null
                      return (
                        <Link
                          key={album.id}
                          href={`/galleria/${album.id}`}
                          className="group overflow-hidden rounded-lg border border-cvlt-gray-200 transition-all hover:border-cvlt-blue/30 hover:shadow-md"
                        >
                          {coverUrl && (
                            <div className="aspect-[16/10] overflow-hidden bg-cvlt-gray-100">
                              <img
                                src={coverUrl}
                                alt={album.title}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            </div>
                          )}
                          <div className="p-3">
                            <h3 className="text-sm font-semibold text-cvlt-gray-900 group-hover:text-cvlt-blue">
                              {album.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-cvlt-gray-500">
                              {album.photos?.length || 0} foto
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Event details sidebar */}
        <aside className="w-full flex-shrink-0 lg:w-72">
          <div className="rounded-lg border border-cvlt-blue/20 bg-cvlt-blue-light p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-cvlt-blue-dark">
              Dettagli evento
            </h3>

            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-medium text-cvlt-gray-500">Data</dt>
                <dd className="text-cvlt-gray-900">
                  {new Date(event.startDate).toLocaleDateString('it-CH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {event.endDate && (
                    <> — {new Date(event.endDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}</>
                  )}
                </dd>
              </div>
              {event.backupStartDate && (
                <div>
                  <dt className="font-medium text-cvlt-gray-500">Data di riserva</dt>
                  <dd className="text-cvlt-gray-900">
                    {new Date(event.backupStartDate).toLocaleDateString('it-CH', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {event.backupEndDate && (
                      <> — {new Date(event.backupEndDate).toLocaleDateString('it-CH', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}</>
                    )}
                  </dd>
                </div>
              )}
              {event.location && (
                <div>
                  <dt className="font-medium text-cvlt-gray-500">Luogo</dt>
                  <dd className="text-cvlt-gray-900">{event.location}</dd>
                </div>
              )}
              {event.status === 'tentative' && (
                <div>
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                    Provvisorio
                  </span>
                </div>
              )}
              {event.status === 'cancelled' && (
                <div>
                  <span className="rounded bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    Annullato
                  </span>
                </div>
              )}
              {event.externalLink && (
                <div className="pt-1">
                  <a
                    href={event.externalLink}
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
      </div>
    </main>
  )
}

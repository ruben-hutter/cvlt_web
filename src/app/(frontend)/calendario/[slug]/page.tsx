export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { richTextConverters, populateLexicalLinks } from '@/lib/richtext'
import { eventJsonLd, breadcrumbJsonLd } from '@/lib/jsonld'
import { getThumbnailUrl, getAlbumImagePool, pickFallbackImage } from '../../lib/news'
import { NewsCard } from '../../components/NewsCard'
import type { Metadata } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://cvlt.ch'

type Args = { params: Promise<{ slug: string }> }

function extractPlainText(nodes: any[]): string {
  const parts: string[] = []
  for (const node of nodes) {
    if (node.type === 'text') parts.push(node.text)
    if (node.children) parts.push(extractPlainText(node.children))
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

async function findEventBySlug(payload: any, slug: string) {
  const result = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  return result.docs[0] || null
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayload({ config })

  try {
    const event = await findEventBySlug(payload, slug)
    if (!event) return { title: 'Evento non trovato' }

    const desc = event.location
      ? `${event.title} — ${new Date(event.startDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}, ${event.location}.`
      : `${event.title} — ${new Date(event.startDate).toLocaleDateString('it-CH', { day: 'numeric', month: 'long', year: 'numeric' })}.`

    return {
      title: event.title,
      description: desc,
      alternates: { canonical: `/calendario/${slug}` },
      openGraph: {
        title: event.title,
        description: desc,
        type: 'article',
      },
    }
  } catch {
    return { title: 'Evento non trovato' }
  }
}

export default async function EventPage({ params }: Args) {
  const { slug } = await params
  const payload = await getPayload({ config })

  let event
  try {
    event = await findEventBySlug(payload, slug)
    if (!event) notFound()
  } catch {
    notFound()
  }

  if (event.description) {
    event.description = await populateLexicalLinks(event.description, payload)
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

  // Find related photo albums
  const albumResult = await payload.find({
    collection: 'photo-albums',
    where: {
      relatedEvent: { equals: event.id },
    },
    limit: 10,
    depth: 1,
  })

  // Pool of album photos used as fallback thumbnails for image-less news
  const imagePool = await getAlbumImagePool(payload)

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: eventJsonLd({
            title: event.title,
            slug: event.slug || event.id,
            startDate: event.startDate,
            endDate: event.endDate,
            location: event.location,
            status: event.status,
            description: event.description?.root
              ? extractPlainText(event.description.root.children).slice(0, 300)
              : undefined,
            baseUrl,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: breadcrumbJsonLd([
            { name: 'Home', url: baseUrl },
            { name: 'Calendario', url: `${baseUrl}/calendario` },
            { name: event.title, url: `${baseUrl}/calendario/${event.slug || event.id}` },
          ]),
        }}
      />
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

          {event.description && (
            <div className="mt-6 prose prose-gray max-w-none">
              <RichText data={event.description} converters={richTextConverters} />
            </div>
          )}

          {newsResult.docs.length === 0 && albumResult.docs.length === 0 ? (
            <p className="mt-8 text-cvlt-gray-500">Nessuna notizia o album collegato a questo evento.</p>
          ) : (
            <div className="mt-8 space-y-8">
              {/* News articles */}
              {newsResult.docs.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold text-cvlt-gray-900">Notizie</h2>
                  <div className="mt-4 space-y-4">
                    {newsResult.docs.map((article) => (
                      <NewsCard
                        key={article.id}
                        variant="row"
                        showRelatedEvent={false}
                        id={article.id}
                        title={article.title}
                        slug={article.slug}
                        publishDate={article.publishDate}
                        thumbnailUrl={getThumbnailUrl(article) ?? pickFallbackImage(article.id, imagePool)}
                        tag={article.tag ?? null}
                        relatedEvent={null}
                      />
                    ))}
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
                      const coverUrl = typeof cover === 'object' && cover?.url ? (cover.sizes?.thumbnail?.url || cover.url) : null
                      return (
                        <Link
                          key={album.id}
                          href={`/galleria/${album.slug || album.id}`}
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
                    <> &mdash; {new Date(event.endDate).toLocaleDateString('it-CH', {
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
                      <> &mdash; {new Date(event.backupEndDate).toLocaleDateString('it-CH', {
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

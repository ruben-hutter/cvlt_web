export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NewsLayout } from '../../../components/RichTextImage'
import { ArticleLightbox } from '../../../components/ArticleLightbox'
import { RefreshOnSave } from '../../../components/RefreshOnSave'
import type { Metadata } from 'next'

type Args = { params: Promise<{ id: string }>; searchParams: Promise<{ live?: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config })

  try {
    const article = await payload.findByID({ collection: 'news', id, depth: 0 })
    return { title: `Anteprima: ${article.title} — CVLT` }
  } catch {
    return { title: 'Anteprima non trovata — CVLT' }
  }
}

export default async function PreviewPage({ params, searchParams }: Args) {
  const { id } = await params
  const { live } = await searchParams
  const isLivePreview = live === 'true'
  const payload = await getPayload({ config })

  // Check if user is logged in to Payload
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/admin/login')

  let article
  try {
    article = await payload.findByID({ collection: 'news', id, depth: 2 })
  } catch {
    notFound()
  }

  const relatedEvent = article.relatedEvent && typeof article.relatedEvent === 'object'
    ? article.relatedEvent
    : null

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
      <RefreshOnSave />
      {/* Preview banner — only shown when opened in new tab, not in live preview panel */}
      {!isLivePreview && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Anteprima — questa notizia non è ancora pubblicata.
          {article.status === 'draft' && ' Stato: Bozza.'}
          {article.publishDate && (
            <> Pubblicazione prevista: {new Date(article.publishDate).toLocaleDateString('it-CH', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}.</>
          )}
        </div>
      )}

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
        <article className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold text-cvlt-gray-900">{article.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-cvlt-gray-500">
            {article.author && typeof article.author === 'object' && article.author.name && (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0" />
                </svg>
                {article.author.name}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              {new Date(article.publishDate).toLocaleDateString('it-CH', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
            {relatedEvent && (
              <Link
                href={`/calendario/${relatedEvent.slug || relatedEvent.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-cvlt-blue-light px-2.5 py-0.5 font-medium text-cvlt-blue transition-colors hover:bg-cvlt-blue hover:text-white"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                </svg>
                {relatedEvent.title}
              </Link>
            )}
          </div>

          <ArticleLightbox images={allImages}>
            <div className="mt-8">
              <NewsLayout blocks={article.layout as any} />
            </div>
          </ArticleLightbox>
        </article>

        {relatedEvent && (
          <aside className="w-full flex-shrink-0 lg:w-72">
            <div className="rounded-lg border border-cvlt-blue/20 bg-cvlt-blue-light p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-cvlt-blue-dark">
                Evento collegato
              </h3>
              <Link
                href={`/calendario/${relatedEvent.slug || relatedEvent.id}`}
                className="mt-2 block text-lg font-semibold text-cvlt-gray-900 transition-colors hover:text-cvlt-blue"
              >
                {relatedEvent.title}
              </Link>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="font-medium text-cvlt-gray-500">Data</dt>
                  <dd className="text-cvlt-gray-900">
                    {new Date(relatedEvent.startDate).toLocaleDateString('it-CH', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                    {relatedEvent.endDate && (
                      <> — {new Date(relatedEvent.endDate).toLocaleDateString('it-CH', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}</>
                    )}
                  </dd>
                </div>
                {relatedEvent.backupStartDate && (
                  <div>
                    <dt className="font-medium text-cvlt-gray-500">Data di riserva</dt>
                    <dd className="text-cvlt-gray-900">
                      {new Date(relatedEvent.backupStartDate).toLocaleDateString('it-CH', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                      {relatedEvent.backupEndDate && (
                        <> — {new Date(relatedEvent.backupEndDate).toLocaleDateString('it-CH', {
                          day: 'numeric', month: 'long', year: 'numeric',
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

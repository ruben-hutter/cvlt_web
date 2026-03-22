export const revalidate = 60 // rebuild page every 60 seconds

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TwintButton } from './components/TwintButton'

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

  const events = await payload.find({
    collection: 'events',
    where: {
      startDate: { greater_than_equal: new Date().toISOString() },
      status: { not_equals: 'cancelled' },
    },
    sort: 'startDate',
    limit: 3,
  })

  return (
    <main>
      {/* Hero */}
      <section className="bg-cvlt-navy">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            Club Volo Libero Ticino
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
            La nostra associazione si prefigge di riunire gli amanti del volo libero,
            di promuovere questo sport e rappresentare i parapendisti e i deltisti verso le autorità.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/adesione"
              className="rounded-md bg-cvlt-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cvlt-blue-dark"
            >
              Diventa socio
            </Link>
            <Link
              href="/calendario"
              className="rounded-md border border-gray-500 px-5 py-2.5 text-sm font-semibold text-gray-200 transition-colors hover:border-white hover:text-white"
            >
              Calendario eventi
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_20rem]">
          {/* News section */}
          <section>
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-cvlt-gray-900">Ultime notizie</h2>
              <Link
                href="/notizie"
                className="text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
              >
                Tutte le notizie &rarr;
              </Link>
            </div>

            {news.docs.length === 0 ? (
              <p className="mt-6 text-cvlt-gray-500">Nessuna notizia pubblicata.</p>
            ) : (
              <div className="mt-6 space-y-4">
                {news.docs.map((article) => {
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
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Upcoming events */}
            <div>
              <h2 className="text-lg font-bold text-cvlt-gray-900">Prossimi eventi</h2>
              {events.docs.length === 0 ? (
                <p className="mt-4 text-sm text-cvlt-gray-500">Nessun evento in programma.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {events.docs.map((event) => (
                    <li
                      key={event.id}
                      className="rounded-lg border border-cvlt-gray-200 p-3"
                    >
                      <time className="text-xs font-medium text-cvlt-blue">
                        {new Date(event.startDate).toLocaleDateString('it-CH', {
                          day: 'numeric',
                          month: 'short',
                        })}
                        {event.endDate && (
                          <> – {new Date(event.endDate).toLocaleDateString('it-CH', {
                            day: 'numeric',
                            month: 'short',
                          })}</>
                        )}
                      </time>
                      <h3 className="mt-1 text-sm font-semibold text-cvlt-gray-900">
                        {event.title}
                      </h3>
                      {event.location && (
                        <p className="mt-0.5 text-xs text-cvlt-gray-500">{event.location}</p>
                      )}
                      {event.status === 'tentative' && (
                        <span className="mt-1 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                          Provvisorio
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <Link
                href="/calendario"
                className="mt-4 inline-block text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
              >
                Vedi calendario &rarr;
              </Link>
            </div>

            {/* Twint donations */}
            <div className="rounded-lg border border-cvlt-gray-200 p-4">
              <h2 className="text-lg font-bold text-cvlt-gray-900">Sostienici</h2>
              <div className="mt-4 space-y-5">
                <div>
                  <p className="text-sm text-cvlt-gray-700">
                    Voli nella Svizzera italiana ma non sei socio?
                    Aiutaci con un Twint di 5.– CHF a mantenere decolli e atterraggi.
                  </p>
                  <div className="mt-2">
                    <TwintButton solutionId="kcmhc" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-cvlt-gray-700">
                    Versa la quota sociale con Twint:
                  </p>
                  <div className="mt-2">
                    <TwintButton solutionId="yjfqp" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

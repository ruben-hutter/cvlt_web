export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { TwintButton } from './components/TwintButton'

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

export default async function HomePage() {
  let news = { docs: [] as any[] }
  let events = { docs: [] as any[] }
  let albums = { docs: [] as any[] }

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
      limit: 5,
      depth: 1,
    })

    events = await payload.find({
      collection: 'events',
      where: {
        startDate: { greater_than_equal: new Date().toISOString() },
        status: { not_equals: 'cancelled' },
      },
      sort: 'startDate',
      limit: 3,
    })

    albums = await payload.find({
      collection: 'photo-albums',
      sort: '-date',
      limit: 4,
      depth: 1,
    })
  } catch (e) {
    console.error('[HOME] DB query failed:', e)
  }

  return (
    <main>
      {/* Hero */}
      <section className="relative bg-cvlt-navy">
        <div
          className="absolute inset-0 bg-cover bg-fixed bg-center"
          style={{ backgroundImage: "url('/hero-bg.jpg')" }}
        />
        <div className="absolute inset-0 bg-cvlt-navy/70" />
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <img
            src="/logo_CVLT.png"
            alt="CVLT"
            className="mb-6 h-16 w-auto sm:h-20"
          />
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
                  const event = article.relatedEvent && typeof article.relatedEvent === 'object'
                    ? article.relatedEvent : null
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
                        {event && (
                          <span
                            className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-cvlt-blue-light px-2 py-0.5 text-xs font-medium text-cvlt-blue"
                          >
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                            </svg>
                            {event.title}
                          </span>
                        )}
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
                    <li key={event.id}>
                      <Link
                        href={`/calendario/${event.slug || event.id}`}
                        className="block rounded-lg border border-cvlt-gray-200 p-3 transition-all hover:border-cvlt-blue/30 hover:shadow-md"
                      >
                        <time className="text-xs font-medium text-cvlt-blue">
                          {new Date(event.startDate).toLocaleDateString('it-CH', {
                            day: 'numeric',
                            month: 'short',
                          })}
                          {event.endDate && (
                            <> &ndash; {new Date(event.endDate).toLocaleDateString('it-CH', {
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
                      </Link>
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
              <div className="mt-4">
                <p className="text-sm text-cvlt-gray-700">
                  Voli nella Svizzera italiana ma non sei socio?
                  Aiutaci con un Twint di 5.&ndash; CHF a mantenere decolli e atterraggi.
                </p>
                <div className="mt-2">
                  <TwintButton solutionId="kcmhc" />
                </div>
                <Link
                  href="/quota-sociale"
                  className="mt-4 inline-block text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
                >
                  Pagamento quota sociale &rarr;
                </Link>
              </div>
            </div>

            {/* TMA Locarno */}
            <div className="rounded-lg border border-cvlt-gray-200 p-4">
              <h2 className="text-lg font-bold text-cvlt-gray-900">TMA Locarno</h2>
              <a
                href="https://www.facebook.com/TMA-Locarno-1037676889614177/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block"
              >
                <img
                  src="/tmalocarno.png"
                  alt="TMA Locarno"
                  className="mx-auto w-full rounded"
                />
              </a>
              <p className="mt-2 text-xs text-cvlt-gray-500">
                Pianificazione settimanale su{' '}
                <a
                  href="https://www.facebook.com/TMA-Locarno-1037676889614177/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-cvlt-blue hover:underline"
                >
                  Facebook
                </a>
              </p>
              <p className="mt-1 text-xs text-cvlt-gray-500">
                ATIS:{' '}
                <a href="tel:+41918161744" className="font-medium text-cvlt-blue hover:underline">
                  +41 91 816 17 44
                </a>
              </p>
            </div>
          </aside>
        </div>

        {/* Gallery teaser */}
        {albums.docs.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-cvlt-gray-900">Galleria</h2>
              <Link
                href="/galleria"
                className="text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
              >
                Tutti gli album &rarr;
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {albums.docs.map((album) => {
                const cover = album.photos?.[0]
                const coverUrl = typeof cover === 'object' && cover?.url ? cover.url : null
                return (
                  <Link
                    key={album.id}
                    href={`/galleria/${album.id}`}
                    className="group overflow-hidden rounded-lg border border-cvlt-gray-200 transition-all hover:border-cvlt-blue/30 hover:shadow-lg"
                  >
                    {coverUrl ? (
                      <div className="aspect-[4/3] overflow-hidden bg-cvlt-gray-100">
                        <img
                          src={coverUrl}
                          alt={album.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[4/3] items-center justify-center bg-cvlt-gray-100">
                        <svg className="h-8 w-8 text-cvlt-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
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
    </main>
  )
}

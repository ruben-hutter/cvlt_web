export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getPublishedNewsWithFeaturedFirst } from '../lib/news'
import { NewsFilter } from './NewsFilter'

export const metadata = {
  title: 'Notizie',
  description:
    'Ultime notizie dal Club Volo Libero Ticino: eventi, gare, condizioni meteo e aggiornamenti dalla comunità del volo libero ticinese.',
  alternates: { canonical: '/notizie' },
}

function getThumbnailUrl(article: any): string | null {
  if (article.thumbnail && typeof article.thumbnail === 'object') {
    return article.thumbnail.sizes?.thumbnail?.url || article.thumbnail.url
  }
  for (const block of article.layout || []) {
    if (block.blockType === 'image' && block.image?.url) return block.image.sizes?.thumbnail?.url || block.image.url
    if (block.blockType === 'textImage' && block.image?.url) return block.image.sizes?.thumbnail?.url || block.image.url
    if (block.blockType === 'gallery' && block.images?.[0]?.image?.url) return block.images[0].image.sizes?.thumbnail?.url || block.images[0].image.url
  }
  return null
}

export default async function NewsPage() {
  let articles: any[] = []

  try {
    const payload = await getPayload({ config })
    articles = await getPublishedNewsWithFeaturedFirst({ payload, limit: 50, depth: 1 })
  } catch (e) {
    console.error('[NOTIZIE] DB query failed:', e)
  }

  const mapped = articles.map((a) => ({
    id: a.id,
    title: a.title,
    slug: a.slug,
    publishDate: a.publishDate,
    thumbnailUrl: getThumbnailUrl(a),
    tag: a.tag ?? null,
    relatedEvent:
      a.relatedEvent && typeof a.relatedEvent === 'object'
        ? { title: a.relatedEvent.title }
        : null,
  }))

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="mb-8 text-3xl font-bold text-cvlt-gray-900">Notizie</h1>
        <a
          href="/feed"
          target="_blank"
          rel="noopener noreferrer"
          title="Feed RSS"
          className="flex items-center gap-1.5 rounded-md border border-cvlt-gray-200 px-3 py-1.5 text-xs font-medium text-cvlt-gray-500 transition-colors hover:border-orange-300 hover:text-orange-500"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.742-7.115-15.783-15.839-15.82zm0-8.18v4.819c12.484.074 22.564 10.167 22.638 22.638h4.821c-.074-15.105-12.355-27.373-27.459-27.457z"/>
          </svg>
          RSS
        </a>
      </div>

      {mapped.length === 0 ? (
        <p className="mt-6 text-cvlt-gray-500">Nessuna notizia pubblicata.</p>
      ) : (
        <NewsFilter articles={mapped} />
      )}
    </main>
  )
}

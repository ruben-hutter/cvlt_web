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

  const result = await payload.find({
    collection: 'news',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    limit: 1,
  })

  const article = result.docs[0]
  if (!article) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/notizie" className="text-sm text-blue-600 hover:underline">
        ← Tutte le notizie
      </Link>

      <article className="mt-8">
        <time className="text-sm text-gray-500">
          {new Date(article.date).toLocaleDateString('it-CH', {
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
    </main>
  )
}

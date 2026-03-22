export const revalidate = 60

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { PhotoGrid } from '../PhotoGrid'
import type { Metadata } from 'next'

type Args = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { id } = await params
  const payload = await getPayload({ config })

  try {
    const album = await payload.findByID({ collection: 'photo-albums', id, depth: 0 })
    return { title: `${album.title} — Galleria — CVLT` }
  } catch {
    return { title: 'Album non trovato — CVLT' }
  }
}

export default async function AlbumPage({ params }: Args) {
  const { id } = await params
  const payload = await getPayload({ config })

  let album
  try {
    album = await payload.findByID({ collection: 'photo-albums', id, depth: 1 })
  } catch {
    notFound()
  }

  const photos = (album.photos || [])
    .map((p: any) => {
      if (!p || typeof p !== 'object' || !p.url) return null
      return {
        url: p.url as string,
        alt: (p.alt as string) || album.title,
        width: (p.width as number) || 1200,
        height: (p.height as number) || 800,
      }
    })
    .filter(Boolean) as { url: string; alt: string; width: number; height: number }[]

  const relatedEvent = album.relatedEvent && typeof album.relatedEvent === 'object'
    ? album.relatedEvent
    : null

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/galleria"
        className="inline-flex items-center gap-1 text-sm font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Galleria
      </Link>

      <div className="mt-6">
        <h1 className="text-3xl font-bold text-cvlt-gray-900">{album.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-cvlt-gray-500">
          <time>
            {new Date(album.date).toLocaleDateString('it-CH', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </time>
          <span>&middot;</span>
          <span>{photos.length} foto</span>
          {relatedEvent && (
            <>
              <span>&middot;</span>
              <Link
                href={`/calendario/${relatedEvent.id}`}
                className="font-medium text-cvlt-blue transition-colors hover:text-cvlt-blue-dark"
              >
                {relatedEvent.title}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="mt-8">
        {photos.length === 0 ? (
          <p className="text-cvlt-gray-500">Nessuna foto in questo album.</p>
        ) : (
          <PhotoGrid photos={photos} />
        )}
      </div>
    </main>
  )
}

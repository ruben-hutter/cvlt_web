export const dynamic = 'force-dynamic'

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
        mimeType: (p.mimeType as string) || '',
      }
    })
    .filter(Boolean) as { url: string; alt: string; width: number; height: number; mimeType: string }[]

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
          <span>{photos.length} {photos.some(p => p.mimeType.startsWith('video/')) ? 'foto/video' : 'foto'}</span>
          {relatedEvent && (
            <Link
              href={`/calendario/${relatedEvent.slug || relatedEvent.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-cvlt-blue-light px-2.5 py-0.5 font-medium text-cvlt-blue transition-colors hover:bg-cvlt-blue hover:text-white"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
              </svg>
              {relatedEvent.title}
            </Link>
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

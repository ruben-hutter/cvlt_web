export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { GalleryFilter } from './GalleryFilter'

export const metadata = {
  title: 'Galleria',
  description:
    'Galleria fotografica del Club Volo Libero Ticino: foto di volo, gare, eventi e momenti del club.',
  alternates: { canonical: '/galleria' },
}

export default async function GalleryPage() {
  let albums: Array<{
    id: number | string
    slug: string
    title: string
    date: string
    coverUrl: string | null
    coverIsVideo: boolean
    photoCount: number
  }> = []

  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'photo-albums',
      sort: '-date',
      limit: 0,
      depth: 0,
    })

    const coverIds = result.docs
      .map((a) => a.photos?.[0])
      .filter((id): id is number => typeof id === 'number')

    const covers =
      coverIds.length > 0
        ? await payload.find({
            collection: 'media',
            where: { id: { in: coverIds } },
            depth: 0,
            limit: 0,
          })
        : { docs: [] as any[] }

    const coverMap = new Map(covers.docs.map((c: any) => [String(c.id), c]))

    albums = result.docs.map((album) => {
      const firstPhotoId = album.photos?.[0]
      const cover = firstPhotoId ? coverMap.get(String(firstPhotoId)) : null
      const coverUrl = cover?.sizes?.thumbnail?.url || cover?.sizes?.medium?.url || cover?.url || null
      const coverMimeType = cover?.mimeType || ''
      return {
        id: album.id,
        slug: album.slug || String(album.id),
        title: album.title,
        date: album.date,
        coverUrl,
        coverIsVideo: coverMimeType.startsWith('video/'),
        photoCount: album.photos?.length || 0,
      }
    })
  } catch (e) {
    console.error('[GALLERIA] DB query failed:', e)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-cvlt-gray-900">Galleria</h1>
      <GalleryFilter albums={albums} />
    </main>
  )
}

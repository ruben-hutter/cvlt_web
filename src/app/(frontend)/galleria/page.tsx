export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { GalleryFilter } from './GalleryFilter'

export const metadata = {
  title: 'Galleria — CVLT',
}

export default async function GalleryPage() {
  let albums: Array<{
    id: number | string
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
      limit: 100,
      depth: 1,
    })

    albums = result.docs.map((album) => {
      const cover = album.photos?.[0]
      const coverUrl = typeof cover === 'object' && cover?.url ? cover.url : null
      const coverMimeType = typeof cover === 'object' && cover?.mimeType ? cover.mimeType : ''
      return {
        id: album.id,
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

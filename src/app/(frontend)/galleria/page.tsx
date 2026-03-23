export const revalidate = 60

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
      return {
        id: album.id,
        title: album.title,
        date: album.date,
        coverUrl,
        photoCount: album.photos?.length || 0,
      }
    })
  } catch (e) {
    console.warn('[GALLERIA] DB query failed (build-time prerender?)', e)
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-cvlt-gray-900">Galleria</h1>
      <GalleryFilter albums={albums} />
    </main>
  )
}

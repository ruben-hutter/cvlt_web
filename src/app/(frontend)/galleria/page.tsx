export const dynamic = 'force-dynamic'

import { getPayload } from 'payload'
import config from '@payload-config'
import { GalleryFilter } from './GalleryFilter'

export const metadata = {
  title: 'Galleria — CVLT',
}

export default async function GalleryPage() {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'photo-albums',
    sort: '-date',
    limit: 100,
    depth: 1,
  })

  const albums = result.docs.map((album) => {
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

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-cvlt-gray-900">Galleria</h1>
      <GalleryFilter albums={albums} />
    </main>
  )
}

import type { Payload } from 'payload'

type GetPublishedNewsOptions = {
  payload: Payload
  limit: number
  depth?: number
}

export async function getPublishedNewsWithFeaturedFirst({
  payload,
  limit,
  depth = 1,
}: GetPublishedNewsOptions): Promise<any[]> {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const publishedBaseFilter = {
    status: { equals: 'published' as const },
    publishDate: { less_than_equal: endOfToday.toISOString() },
  }

  const featured = await payload.find({
    collection: 'news',
    where: {
      ...publishedBaseFilter,
      tag: { equals: 'featured' },
    },
    sort: '-publishDate',
    limit,
    depth,
  })

  if (featured.docs.length >= limit) return featured.docs

  const regular = await payload.find({
    collection: 'news',
    where: {
      ...publishedBaseFilter,
      tag: { not_equals: 'featured' },
    },
    sort: '-publishDate',
    limit: limit - featured.docs.length,
    depth,
  })

  return [...featured.docs, ...regular.docs]
}

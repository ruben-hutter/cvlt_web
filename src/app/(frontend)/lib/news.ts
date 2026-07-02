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

/**
 * Resolve the best available thumbnail URL for a news article.
 * Prefers the optimized 400px webp `sizes.thumbnail`, falling back to the
 * original, then to the first embedded image found in the layout blocks.
 */
export function getThumbnailUrl(article: any): string | null {
  if (article.thumbnail && typeof article.thumbnail === 'object') {
    return article.thumbnail.sizes?.thumbnail?.url || article.thumbnail.url
  }
  for (const block of article.layout || []) {
    if (block.blockType === 'image' && block.image?.url)
      return block.image.sizes?.thumbnail?.url || block.image.url
    if (block.blockType === 'textImage' && block.image?.url)
      return block.image.sizes?.thumbnail?.url || block.image.url
    if (block.blockType === 'gallery' && block.images?.[0]?.image?.url)
      return block.images[0].image.sizes?.thumbnail?.url || block.images[0].image.url
  }
  return null
}

/**
 * A pool of real photos grouped by album, used as a fallback thumbnail for
 * news articles that have no image of their own. Each album is an array of
 * optimized thumbnail URLs.
 */
export type AlbumImagePool = string[][]

/**
 * Fetch album photos to use as fallback thumbnails for image-less news.
 * Sorted newest-first so the pool favours recent, lively photos.
 */
export async function getAlbumImagePool(payload: Payload, limit = 100): Promise<AlbumImagePool> {
  try {
    const result = await payload.find({
      collection: 'photo-albums',
      limit,
      depth: 1,
      sort: '-createdAt',
    })
    const pool: AlbumImagePool = []
    for (const album of result.docs) {
      const photos: string[] = []
      if (Array.isArray(album.photos)) {
        for (const p of album.photos) {
          if (p && typeof p === 'object') {
            const url = p.sizes?.thumbnail?.url || p.url
            if (url) photos.push(url)
          }
        }
      }
      if (photos.length) pool.push(photos)
    }
    return pool
  } catch (e) {
    console.error('[NEWS] album image pool fetch failed:', e)
    return []
  }
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Deterministically pick one photo from the pool for the given article.
 * Seeded by the article id so each article keeps a stable image across
 * reloads (avoiding flicker on the force-dynamic pages), while still
 * spreading different photos across the grid. Picks an album first, then a
 * photo within that album.
 */
export function pickFallbackImage(seed: string | number, pool: AlbumImagePool): string | null {
  if (!pool.length) return null
  const album = pool[hashStr(`${seed}:album`) % pool.length]
  if (!album || !album.length) return null
  return album[hashStr(`${seed}:photo`) % album.length]
}

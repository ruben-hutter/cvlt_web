import { getPayload } from 'payload'
import { titleToSlug, deduplicateSlug } from '../src/lib/slug'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  if (!process.env.PAYLOAD_SECRET?.trim()) {
    console.error('[MIGRATE-SLUGS] Missing required environment variable: PAYLOAD_SECRET')
    process.exit(1)
  }

  const configModule = await import('../src/payload.config')
  const payload = await getPayload({ config: configModule.default })

  console.log(`[MIGRATE-SLUGS] Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`)

  let page = 1
  let updated = 0

  while (true) {
    const result = await payload.find({
      collection: 'photo-albums',
      limit: 100,
      page,
      depth: 0,
    })

    for (const album of result.docs) {
      if (album.slug) {
        console.log(`[MIGRATE-SLUGS] Skipping #${album.id} "${album.title}" - already has slug: "${album.slug}"`)
        continue
      }

      const year = album.date ? new Date(album.date).getFullYear() : ''
      const baseSlug = year ? `${titleToSlug(album.title)}-${year}` : titleToSlug(album.title)
      const slug = await deduplicateSlug(payload, 'photo-albums', baseSlug, album.id)

      console.log(`[MIGRATE-SLUGS] #${album.id} "${album.title}" -> "${slug}"${dryRun ? ' (dry run)' : ''}`)

      if (!dryRun) {
        await payload.update({
          collection: 'photo-albums',
          id: album.id,
          data: { slug } as any,
        })
      }

      updated++
    }

    if (!result.hasNextPage) break
    page += 1
  }

  console.log(`[MIGRATE-SLUGS] ${dryRun ? 'Would update' : 'Updated'}: ${updated} albums`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[MIGRATE-SLUGS] Failed:', error)
    process.exit(1)
  })

import { getPayload } from 'payload'

type CliOptions = {
  dryRun: boolean
}

function parseArgs(argv: string[]): CliOptions {
  return { dryRun: argv.includes('--dry-run') }
}

async function listAllIDs(payload: Awaited<ReturnType<typeof getPayload>>, collection: 'photo-albums' | 'media') {
  const ids: number[] = []
  let page = 1

  while (true) {
    const result = await payload.find({
      collection,
      limit: 100,
      page,
      depth: 0,
    })

    ids.push(
      ...result.docs
        .map((doc) => doc.id)
        .filter((id): id is number => typeof id === 'number'),
    )

    if (!result.hasNextPage) break
    page += 1
  }

  return ids
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!process.env.PAYLOAD_SECRET) process.env.PAYLOAD_SECRET = 'local-import-secret'

  const configModule = await import('../src/payload.config')
  const payload = await getPayload({ config: configModule.default })

  const albumIDs = await listAllIDs(payload, 'photo-albums')
  const mediaIDsBefore = await listAllIDs(payload, 'media')

  console.log(`[RESET] Mode: ${options.dryRun ? 'DRY RUN' : 'WRITE'}`)
  console.log(`[RESET] Albums found: ${albumIDs.length}`)
  console.log(`[RESET] Media found: ${mediaIDsBefore.length}`)

  if (options.dryRun) {
    console.log('[RESET] Dry run complete. No records were deleted.')
    return
  }

  let deletedAlbums = 0
  for (const albumID of albumIDs) {
    await payload.delete({ collection: 'photo-albums', id: albumID })
    deletedAlbums += 1
  }

  const mediaIDsAfterAlbumDeletion = await listAllIDs(payload, 'media')
  let deletedOrphanMedia = 0
  for (const mediaID of mediaIDsAfterAlbumDeletion) {
    await payload.delete({ collection: 'media', id: mediaID })
    deletedOrphanMedia += 1
  }

  const albumsLeft = await listAllIDs(payload, 'photo-albums')
  const mediaLeft = await listAllIDs(payload, 'media')

  console.log(`[RESET] Deleted albums: ${deletedAlbums}`)
  console.log(`[RESET] Deleted remaining media: ${deletedOrphanMedia}`)
  console.log(`[RESET] Albums left: ${albumsLeft.length}`)
  console.log(`[RESET] Media left: ${mediaLeft.length}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[RESET] Failed:', error)
    process.exit(1)
  })

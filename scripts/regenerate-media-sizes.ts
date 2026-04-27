import { getPayload } from 'payload'
import { resolve, parse, format } from 'path'
import { accessSync } from 'fs'

type CliOptions = { dryRun: boolean }

function parseArgs(argv: string[]): CliOptions {
  return { dryRun: argv.includes('--dry-run') }
}

function fileExists(p: string): boolean {
  try { accessSync(p); return true } catch { return false }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (!process.env.PAYLOAD_SECRET?.trim()) {
    console.error('[REGEN] Missing required environment variable: PAYLOAD_SECRET')
    process.exit(1)
  }

  const configModule = await import('../src/payload.config')
  const payload = await getPayload({ config: configModule.default })

  let page = 1
  let processed = 0
  let skipped = 0
  let failed = 0

  console.log(`[REGEN] Mode: ${options.dryRun ? 'DRY RUN' : 'WRITE'}`)

  while (true) {
    const result = await payload.find({
      collection: 'media',
      limit: 50,
      page,
      depth: 0,
    })

    for (const doc of result.docs) {
      const mimeType: string = doc.mimeType || ''
      if (!mimeType.startsWith('image/')) {
        skipped++
        continue
      }

      const filename = doc.filename
      if (!filename || typeof filename !== 'string') {
        console.warn(`[REGEN] Skipping media ${doc.id} — no filename`)
        skipped++
        continue
      }

      if (options.dryRun) {
        console.log(`[REGEN] Would regenerate: ${doc.id} (${filename})`)
        processed++
        continue
      }

      try {
        let filePath = resolve(process.cwd(), 'media', filename)

        if (!fileExists(filePath)) {
          const { name, ext, ...rest } = parse(filePath)
          const renamed = resolve(format({ ...rest, name: `${name}-1`, ext }))
          if (fileExists(renamed)) {
            console.warn(`[REGEN] ${doc.id}: using renamed file ${name}-1${ext}`)
            filePath = renamed
          } else {
            console.warn(`[REGEN] Skipping media ${doc.id} — file not found: ${filename}`)
            failed++
            continue
          }
        }

        await payload.update({
          collection: 'media',
          id: doc.id,
          filePath,
          data: {},
        })

        processed++
        if (processed % 25 === 0) {
          console.log(`[REGEN] Progress: ${processed} images processed...`)
        }
      } catch (err) {
        console.error(`[REGEN] Failed for ${doc.id} (${filename}): ${err instanceof Error ? err.message : err}`)
        failed++
      }
    }

    if (!result.hasNextPage) break
    page += 1
  }

  console.log(`[REGEN] Done — processed: ${processed}, skipped: ${skipped}, failed: ${failed}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[REGEN] Failed:', error)
    process.exit(1)
  })

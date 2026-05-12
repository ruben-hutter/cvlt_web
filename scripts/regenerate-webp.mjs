#!/usr/bin/env node

/**
 * One-time migration script to re-generate image sizes as WebP for all existing
 * media documents. Run with: node scripts/regenerate-webp.mjs
 *
 * This triggers Payload's image processing pipeline which will create
 * thumbnail (400px) and medium (1024px) sizes in WebP format for every
 * image in the media collection.
 */

import { getPayload } from 'payload'
import config from '../src/payload.config.js'

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'media',
    limit: 0,
    depth: 0,
  })

  console.log(`Found ${docs.length} media documents`)

  let processed = 0
  let skipped = 0

  for (const doc of docs) {
    if (!doc.mimeType?.startsWith('image/')) {
      skipped++
      continue
    }

    try {
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
      })
      processed++
      if (processed % 10 === 0) {
        console.log(`Processed ${processed} images...`)
      }
    } catch (err) {
      console.error(`Failed to process media ${doc.id} (${doc.filename}):`, err.message)
    }
  }

  console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})

import { getPayload } from 'payload'
import { shopProducts, catalogKey } from '../src/lib/shop-catalog'

type CatalogSizeRef = { key: string; productName: string; variant: string; size: string; initialStock: number }

function collectCatalogSizes(): CatalogSizeRef[] {
  const rows: CatalogSizeRef[] = []
  for (const product of shopProducts) {
    for (const variant of product.variants) {
      for (const sizeEntry of variant.sizes) {
        rows.push({
          key: catalogKey(product.name, variant.label, sizeEntry.size),
          productName: product.name,
          variant: variant.label,
          size: sizeEntry.size,
          initialStock: sizeEntry.initialStock,
        })
      }
    }
  }
  return rows
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  if (!process.env.PAYLOAD_SECRET?.trim()) {
    console.error('[SEED-SHOP] Missing required environment variable: PAYLOAD_SECRET')
    process.exit(1)
  }

  const configModule = await import('../src/payload.config')
  const payload = await getPayload({ config: configModule.default })

  const catalogSizes = collectCatalogSizes()
  console.log(`[SEED-SHOP] Catalog size entries: ${catalogSizes.length}`)
  console.log(`[SEED-SHOP] Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`)

  let created = 0
  let skipped = 0

  for (const entry of catalogSizes) {
    const existing = await payload.find({
      collection: 'shop-stock',
      where: { key: { equals: entry.key } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (existing.totalDocs > 0) {
      skipped += 1
      continue
    }

    if (!dryRun) {
      await payload.create({
        collection: 'shop-stock',
        data: {
          key: entry.key,
          productName: entry.productName,
          variant: entry.variant,
          size: entry.size,
          stock: entry.initialStock,
        },
        overrideAccess: true,
      })
    }
    created += 1
    console.log(`[SEED-SHOP] ${dryRun ? 'would create' : 'created'} ${entry.key} (stock=${entry.initialStock})`)
  }

  console.log(`[SEED-SHOP] Done. created=${created}, skipped(existing)=${skipped}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[SEED-SHOP] Failed:', error)
    process.exit(1)
  })

#!/usr/bin/env node
//
// cleanup-orphan-media.mjs
//
// Finds `media` records whose main file is missing from the media/ folder
// and (with --apply) deletes them. SQLite's ON DELETE rules automatically
// null out news.thumbnail_id, news_blocks_*.image_id, news_blocks_attachment.file_id
// and cascade-delete photo_albums_rels rows — but only because this script
// explicitly enables `PRAGMA foreign_keys = ON` on its own connection
// (SQLite defaults to OFF per connection).
//
// NOTE: This script defaults to DRY RUN. Use --apply to actually delete.
// This is intentionally the opposite of the sibling scripts
// (repair-filenames.mjs / migrate-filenames.mjs), which default to WRITE
// and take --dry-run — because this operation is destructive and one-shot.
//
// Run from the project root on the server (next to package.json).
//
//   node scripts/cleanup-orphan-media.mjs                # dry-run report (default)
//   node scripts/cleanup-orphan-media.mjs --verbose      # show references per orphan
//   node scripts/cleanup-orphan-media.mjs --list         # list every orphan, not just 30
//   node scripts/cleanup-orphan-media.mjs --apply        # delete orphans (backs up DB first)
//
// Env:
//   DATABASE_URI  (default: file:./db/payload.db)
//
// The DB backup is created via `VACUUM INTO` (consistent snapshot, includes
// WAL data) to .backups/payload.db.cleanup-<timestamp> before any deletion.

import { createClient } from '@libsql/client'
import { readdirSync, existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const verbose = args.includes('--verbose')
const listAll = args.includes('--list')

const dbPath = process.env.DATABASE_URI || 'file:./db/payload.db'
const projectRoot = process.cwd()
const mediaDir = resolve(projectRoot, 'media')

// Derive the on-disk DB path from DATABASE_URI so existence checks and
// backups target the right file when the env var is overridden.
const dbFilePath = resolve(
  projectRoot,
  dbPath.startsWith('file:') ? dbPath.slice('file:'.length) : dbPath,
)

if (!existsSync(mediaDir)) {
  console.error(`[CLEANUP] Media directory not found: ${mediaDir}`)
  process.exit(1)
}
if (!existsSync(dbFilePath)) {
  console.error(`[CLEANUP] DB file not found: ${dbFilePath}`)
  process.exit(1)
}

console.log(`[CLEANUP] Mode: ${apply ? 'APPLY (will delete)' : 'DRY RUN'}`)
console.log(`[CLEANUP] DB: ${dbPath}`)
console.log(`[CLEANUP] Media dir: ${mediaDir}\n`)

const db = createClient({ url: dbPath })

// SQLite defaults PRAGMA foreign_keys = OFF per connection. Without this,
// ON DELETE CASCADE / SET NULL silently do nothing → dangling rows.
await db.execute('PRAGMA busy_timeout = 5000')
await db.execute('PRAGMA foreign_keys = ON')
const fkCheck = await db.execute('PRAGMA foreign_keys')
const fkOn = Number(fkCheck.rows[0]?.foreign_keys) === 1
if (!fkOn) {
  console.error('[CLEANUP] FAILED to enable foreign_keys pragma — aborting before any damage.')
  db.close()
  process.exit(1)
}

const diskFiles = new Set(readdirSync(mediaDir))

const { rows } = await db.execute('SELECT id, filename FROM media')
console.log(`[CLEANUP] ${rows.length} media records, ${diskFiles.size} files on disk\n`)

const orphans = []
const skippedNullFilename = []
let ok = 0

for (const row of rows) {
  if (!row.filename) {
    // Don't treat "no filename" as "file missing" — those are a separate
    // concern and shouldn't be swept up by this cleanup.
    skippedNullFilename.push(row.id)
    continue
  }
  if (diskFiles.has(row.filename)) {
    ok++
    continue
  }
  orphans.push({
    id: row.id,
    filename: row.filename,
    reason: 'file missing',
    albums: [],
    news: [],
  })
}

console.log(`[CLEANUP] OK: ${ok}, Orphans: ${orphans.length}, Null-filename (skipped): ${skippedNullFilename.length}\n`)

if (orphans.length === 0) {
  console.log('[CLEANUP] Nothing to do.')
  db.close()
  process.exit(0)
}

// Build a Map for O(1) lookup when filling in references.
const orphanById = new Map(orphans.map((o) => [o.id, o]))
const orphanIds = orphans.map((o) => o.id)
const placeholders = orphanIds.map(() => '?').join(',')

// photo_albums_rels (cascade delete) — show album titles
const albumRels = await db.execute({
  sql: `SELECT r.media_id AS media_id, r.parent_id AS album_id, a.title AS album_title
        FROM photo_albums_rels r
        LEFT JOIN photo_albums a ON a.id = r.parent_id
        WHERE r.media_id IN (${placeholders})`,
  args: orphanIds,
})
for (const r of albumRels.rows) {
  orphanById.get(r.media_id)?.albums.push(`${r.album_title || '(untitled)'} #${r.album_id}`)
}

// news thumbnail (set null) — show news titles
const newsRels = await db.execute({
  sql: `SELECT id, title, thumbnail_id FROM news WHERE thumbnail_id IN (${placeholders})`,
  args: orphanIds,
})
for (const r of newsRels.rows) {
  orphanById.get(r.thumbnail_id)?.news.push(`thumbnail: ${r.title || '(untitled)'} #${r.id}`)
}

// news_blocks_* — Payload declares these FKs as ON DELETE SET NULL but the
// columns are also NOT NULL, so SQLite cannot honour the SET NULL action and
// any attempt to delete a referenced media row fails with NOT NULL constraint.
// (Payload normally cleans up these rows itself in app code before the DB
// delete, so the contradictory FK never fires in normal use.) We handle it
// ourselves by deleting the dependent block rows before deleting media.
// Table/column names below are hardcoded literals, not user input.
const blockTables = [
  { table: 'news_blocks_image', col: 'image_id', label: 'news image block' },
  { table: 'news_blocks_text_image', col: 'image_id', label: 'news text+image block' },
  { table: 'news_blocks_gallery_images', col: 'image_id', label: 'news gallery image' },
  { table: 'news_blocks_attachment', col: 'file_id', label: 'news attachment' },
]
const blockRefsByTable = {}
for (const { table, col, label } of blockTables) {
  try {
    const r = await db.execute({
      sql: `SELECT id, ${col} AS media_id FROM ${table} WHERE ${col} IN (${placeholders})`,
      args: orphanIds,
    })
    blockRefsByTable[table] = r.rows
    for (const row of r.rows) {
      orphanById.get(row.media_id)?.news.push(`${label} block #${row.id}`)
    }
  } catch (err) {
    // Only tolerate "no such table" (older schema). Surface anything else.
    const msg = String(err?.message || err)
    if (!/no such table/i.test(msg)) throw err
  }
}

// Report
const showCount = listAll ? orphans.length : Math.min(orphans.length, 30)
console.log('[CLEANUP] === Orphan report (showing %d of %d) ===\n', showCount, orphans.length)

for (const o of orphans.slice(0, showCount)) {
  console.log(`  #${o.id}  ${o.filename}  [${o.reason}]`)
  if (o.albums.length) {
    console.log(`      albums: ${o.albums.length} reference(s)`)
    if (verbose) for (const a of o.albums.slice(0, 5)) console.log(`        - ${a}`)
  }
  if (o.news.length) {
    console.log(`      news: ${o.news.length} reference(s)`)
    if (verbose) for (const n of o.news.slice(0, 5)) console.log(`        - ${n}`)
  }
}
if (orphans.length > showCount) {
  console.log(`\n  ... and ${orphans.length - showCount} more (use --list to see all)`)
}

const refSummary = orphans.reduce(
  (acc, o) => {
    acc.albums += o.albums.length
    acc.news += o.news.length
    return acc
  },
  { albums: 0, news: 0 },
)
console.log(
  `\n[CLEANUP] References that will be cleaned:` +
    `\n  - ${refSummary.albums} album link(s) → cascade-deleted by SQLite (photo_albums_rels.media_id)` +
    `\n  - ${refSummary.news} news reference(s):`,
)
const totalBlockRefs = Object.values(blockRefsByTable).reduce((n, r) => n + r.length, 0)
const thumbnailRefs = refSummary.news - totalBlockRefs
if (thumbnailRefs > 0) {
  console.log(`      • ${thumbnailRefs} news.thumbnail_id → set to NULL by SQLite`)
}
if (totalBlockRefs > 0) {
  console.log(
    `      • ${totalBlockRefs} news_blocks_* rows → DELETED by this script` +
      ` (columns are NOT NULL with contradictory ON DELETE SET NULL, so we delete the block rows manually)`,
  )
}

if (!apply) {
  console.log('\n[CLEANUP] Dry run — no changes made. Re-run with --apply to delete.')
  db.close()
  process.exit(0)
}

// Consistent snapshot backup (includes WAL data; safe even if site is live).
const backupDir = resolve(projectRoot, '.backups')
mkdirSync(backupDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backupPath = join(backupDir, `payload.db.cleanup-${stamp}`)
// VACUUM INTO requires a string literal for the path; the path is built from
// projectRoot (not user input), so single-quote escaping is sufficient.
const escapedPath = backupPath.replace(/'/g, "''")
await db.execute(`VACUUM INTO '${escapedPath}'`)
console.log(`\n[CLEANUP] DB snapshot written to ${backupPath}`)

// Delete in small batches. For each batch we:
//   1. Manually delete dependent news_blocks_* rows (their image_id/file_id
//      columns are NOT NULL with a contradictory ON DELETE SET NULL rule,
//      so SQLite cannot clean them up itself).
//   2. Delete the media rows; SQLite then cascades photo_albums_rels
//      and nulls news.thumbnail_id (which IS nullable).
// Each batch is wrapped in a transaction so a partial failure leaves the
// DB consistent. The batch fails as a unit; re-running picks up where it
// left off (already-deleted ids are gone).
const BATCH = 200
let deleted = 0
let batchErrors = 0
for (let i = 0; i < orphanIds.length; i += BATCH) {
  const batch = orphanIds.slice(i, i + BATCH)
  const ph = batch.map(() => '?').join(',')
  try {
    await db.execute('BEGIN')
    for (const { table, col } of blockTables) {
      // Skip the query entirely if the table doesn't exist on this schema.
      if (blockRefsByTable[table] === undefined) continue
      await db.execute({
        sql: `DELETE FROM ${table} WHERE ${col} IN (${ph})`,
        args: batch,
      })
    }
    await db.execute({ sql: `DELETE FROM media WHERE id IN (${ph})`, args: batch })
    await db.execute('COMMIT')
    deleted += batch.length
    console.log(`[CLEANUP] Deleted ${deleted}/${orphanIds.length}...`)
  } catch (err) {
    try {
      await db.execute('ROLLBACK')
    } catch {
      /* ignore rollback errors */
    }
    batchErrors++
    console.error(
      `[CLEANUP] Batch failed at offset ${i} (${batch.length} ids): ${err?.message || err}`,
    )
    console.error('[CLEANUP] Aborting remaining batches. Re-run the script to finish.')
    break
  }
}

console.log(
  `\n[CLEANUP] Done. Deleted ${deleted}/${orphanIds.length} orphan media records` +
    (batchErrors > 0 ? ` (${batchErrors} batch failure(s))` : '') +
    '.',
)
if (batchErrors > 0) {
  console.log('[CLEANUP] Some batches failed; re-run to complete the cleanup.')
  db.close()
  process.exit(1)
}
console.log(
  '[CLEANUP] Album links were cascade-removed and news.thumbnail_id nulled by SQLite;' +
    ' dependent news_blocks_* rows were deleted manually.',
)
db.close()

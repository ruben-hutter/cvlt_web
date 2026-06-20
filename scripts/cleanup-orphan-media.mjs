#!/usr/bin/env node
//
// cleanup-orphan-media.mjs
//
// Finds `media` records that reference files missing from the media/ folder
// and fixes them:
//
//   - Full orphans (main `filename` missing) → DELETE the record.
//     SQLite's ON DELETE rules then cascade-delete photo_albums_rels rows
//     and null out news.thumbnail_id. news_blocks_* rows are deleted
//     manually first (NOT NULL + ON DELETE SET NULL conflict).
//
//   - Partial orphans (main file exists but thumbnail/medium variant missing)
//     → NULL out the missing variant's columns (filename, url, width, height,
//       mime_type, filesize). The record stays; Payload falls back to the
//       main file when serving.
//
// Both actions require --apply. Default is dry-run.
//
//   node scripts/cleanup-orphan-media.mjs                # dry-run report
//   node scripts/cleanup-orphan-media.mjs --verbose      # show references per orphan
//   node scripts/cleanup-orphan-media.mjs --list         # list every orphan, not just 30
//   node scripts/cleanup-orphan-media.mjs --apply        # apply fixes (backs up DB first)
//
// Env:
//   DATABASE_URI  (default: file:./db/payload.db)

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

console.log(`[CLEANUP] Mode: ${apply ? 'APPLY (will modify DB)' : 'DRY RUN'}`)
console.log(`[CLEANUP] DB: ${dbPath}`)
console.log(`[CLEANUP] Media dir: ${mediaDir}\n`)

const db = createClient({ url: dbPath })

await db.execute('PRAGMA busy_timeout = 5000')
await db.execute('PRAGMA foreign_keys = ON')
const fkCheck = await db.execute('PRAGMA foreign_keys')
if (Number(fkCheck.rows[0]?.foreign_keys) !== 1) {
  console.error('[CLEANUP] FAILED to enable foreign_keys pragma — aborting.')
  db.close()
  process.exit(1)
}

const diskFiles = new Set(readdirSync(mediaDir))

const { rows } = await db.execute(
  'SELECT id, filename, sizes_thumbnail_filename AS thumb, sizes_medium_filename AS medium FROM media',
)
console.log(`[CLEANUP] ${rows.length} media records, ${diskFiles.size} files on disk\n`)

const orphans = []
const variantOrphans = []
const skippedNullFilename = []
let ok = 0

for (const row of rows) {
  if (!row.filename) {
    skippedNullFilename.push(row.id)
    continue
  }

  const mainOk = diskFiles.has(row.filename)
  const thumbOk = !row.thumb || diskFiles.has(row.thumb)
  const mediumOk = !row.medium || diskFiles.has(row.medium)

  if (mainOk && thumbOk && mediumOk) {
    ok++
    continue
  }

  if (!mainOk) {
    orphans.push({ id: row.id, filename: row.filename, albums: [], news: [] })
  } else {
    const missing = []
    if (!thumbOk) missing.push('thumbnail')
    if (!mediumOk) missing.push('medium')
    variantOrphans.push({ id: row.id, filename: row.filename, thumb: row.thumb, medium: row.medium, missing })
  }
}

console.log(
  `[CLEANUP] OK: ${ok}` +
    ` | Full orphans (main missing, will DELETE): ${orphans.length}` +
    ` | Partial orphans (variant missing, will NULL): ${variantOrphans.length}` +
    ` | Null-filename (skipped): ${skippedNullFilename.length}\n`,
)

if (orphans.length === 0 && variantOrphans.length === 0) {
  console.log('[CLEANUP] Nothing to do.')
  db.close()
  process.exit(0)
}

// --- Reference resolution for full orphans (to show what cascades) ---

const orphanById = new Map(orphans.map((o) => [o.id, o]))
const orphanIds = orphans.map((o) => o.id)
let placeholders = orphanIds.map(() => '?').join(',')

if (orphans.length > 0) {
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

  const newsRels = await db.execute({
    sql: `SELECT id, title, thumbnail_id FROM news WHERE thumbnail_id IN (${placeholders})`,
    args: orphanIds,
  })
  for (const r of newsRels.rows) {
    orphanById.get(r.thumbnail_id)?.news.push(`thumbnail: ${r.title || '(untitled)'} #${r.id}`)
  }
}

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
    if (!/no such table/i.test(String(err?.message || err))) throw err
  }
}

// --- Report ---

if (orphans.length > 0) {
  const showCount = listAll ? orphans.length : Math.min(orphans.length, 30)
  console.log('[CLEANUP] === Full orphans (will DELETE) — showing %d of %d ===\n', showCount, orphans.length)
  for (const o of orphans.slice(0, showCount)) {
    console.log(`  #${o.id}  ${o.filename}`)
    if (o.albums.length) {
      console.log(`      albums: ${o.albums.length} reference(s)`)
      if (verbose) for (const a of o.albums.slice(0, 5)) console.log(`        - ${a}`)
    }
    if (o.news.length) {
      console.log(`      news: ${o.news.length} reference(s)`)
      if (verbose) for (const n of o.news.slice(0, 5)) console.log(`        - ${n}`)
    }
  }
  if (orphans.length > showCount) console.log(`\n  ... and ${orphans.length - showCount} more (use --list)`)
}

if (variantOrphans.length > 0) {
  const showCount = listAll ? variantOrphans.length : Math.min(variantOrphans.length, 30)
  console.log('\n[CLEANUP] === Partial orphans (will NULL variant fields) — showing %d of %d ===\n', showCount, variantOrphans.length)
  for (const v of variantOrphans.slice(0, showCount)) {
    console.log(`  #${v.id}  ${v.filename}  missing: ${v.missing.join(', ')}`)
  }
  if (variantOrphans.length > showCount) console.log(`\n  ... and ${variantOrphans.length - showCount} more (use --list)`)
}

if (!apply) {
  console.log('\n[CLEANUP] Dry run — no changes made. Re-run with --apply.')
  db.close()
  process.exit(0)
}

// --- Apply ---

const backupDir = resolve(projectRoot, '.backups')
mkdirSync(backupDir, { recursive: true })
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const backupPath = join(backupDir, `payload.db.cleanup-${stamp}`)
await db.execute(`VACUUM INTO '${backupPath.replace(/'/g, "''")}'`)
console.log(`\n[CLEANUP] DB snapshot → ${backupPath}`)

// 1. Delete full orphans
if (orphans.length > 0) {
  const BATCH = 200
  let deleted = 0
  let batchErrors = 0
  for (let i = 0; i < orphanIds.length; i += BATCH) {
    const batch = orphanIds.slice(i, i + BATCH)
    const ph = batch.map(() => '?').join(',')
    try {
      await db.execute('BEGIN')
      for (const { table, col } of blockTables) {
        if (blockRefsByTable[table] === undefined) continue
        await db.execute({ sql: `DELETE FROM ${table} WHERE ${col} IN (${ph})`, args: batch })
      }
      await db.execute({ sql: `DELETE FROM media WHERE id IN (${ph})`, args: batch })
      await db.execute('COMMIT')
      deleted += batch.length
      console.log(`[CLEANUP] Deleted ${deleted}/${orphanIds.length} full orphan records...`)
    } catch (err) {
      try { await db.execute('ROLLBACK') } catch { /* */ }
      batchErrors++
      console.error(`[CLEANUP] Batch failed at offset ${i}: ${err?.message || err}`)
      break
    }
  }
  console.log(`[CLEANUP] Full orphans: deleted ${deleted}/${orphanIds.length}`)
  if (batchErrors > 0) {
    console.error('[CLEANUP] Some delete batches failed. Fix and re-run before proceeding.')
    db.close()
    process.exit(1)
  }
}

// 2. Null out missing variant fields for partial orphans
if (variantOrphans.length > 0) {
  const thumbIds = variantOrphans.filter((v) => v.missing.includes('thumbnail')).map((v) => v.id)
  const mediumIds = variantOrphans.filter((v) => v.missing.includes('medium')).map((v) => v.id)

  if (thumbIds.length > 0) {
    const ph = thumbIds.map(() => '?').join(',')
    await db.execute({
      sql: `UPDATE media SET
              sizes_thumbnail_filename = NULL,
              sizes_thumbnail_url = NULL,
              sizes_thumbnail_width = NULL,
              sizes_thumbnail_height = NULL,
              sizes_thumbnail_mime_type = NULL,
              sizes_thumbnail_filesize = NULL
            WHERE id IN (${ph})`,
      args: thumbIds,
    })
    console.log(`[CLEANUP] Nulled thumbnail variant for ${thumbIds.length} record(s)`)
  }

  if (mediumIds.length > 0) {
    const ph = mediumIds.map(() => '?').join(',')
    await db.execute({
      sql: `UPDATE media SET
              sizes_medium_filename = NULL,
              sizes_medium_url = NULL,
              sizes_medium_width = NULL,
              sizes_medium_height = NULL,
              sizes_medium_mime_type = NULL,
              sizes_medium_filesize = NULL
            WHERE id IN (${ph})`,
      args: mediumIds,
    })
    console.log(`[CLEANUP] Nulled medium variant for ${mediumIds.length} record(s)`)
  }
}

console.log('\n[CLEANUP] Done.')
db.close()

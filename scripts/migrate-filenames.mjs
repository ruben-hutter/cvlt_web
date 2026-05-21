#!/usr/bin/env node

import { createClient } from '@libsql/client'
import { readdirSync, renameSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const verbose = args.includes('--verbose')

function sanitizeFilename(name) {
  const ext = name.match(/\.[^.]+$/)?.[0] || ''
  const base = name.replace(/\.[^.]+$/, '')
  const sanitized = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return sanitized + ext.toLowerCase()
}

const dbPath = process.env.DATABASE_URI || 'file:./db/payload.db'
const mediaDir = resolve(process.cwd(), 'media')

if (!existsSync(mediaDir)) {
  console.error(`[MIGRATE] Media directory not found: ${mediaDir}`)
  process.exit(1)
}

console.log(`[MIGRATE] Mode: ${dryRun ? 'DRY RUN' : 'WRITE'}`)
console.log(`[MIGRATE] DB: ${dbPath}`)
console.log(`[MIGRATE] Media dir: ${mediaDir}`)

const db = createClient({ url: dbPath })

const { rows } = await db.execute(
  'SELECT id, filename, url, sizes_thumbnail_filename, sizes_medium_filename FROM media'
)
console.log(`[MIGRATE] Found ${rows.length} media records\n`)

const dirtyBasenames = new Map()
for (const row of rows) {
  if (!row.filename || typeof row.filename !== 'string') continue
  const sanitized = sanitizeFilename(row.filename)
  if (sanitized !== row.filename) {
    const oldBase = row.filename.replace(/\.[^.]+$/, '')
    dirtyBasenames.set(oldBase, {
      id: row.id,
      filename: row.filename,
      sanitized,
      thumbFilename: row.sizes_thumbnail_filename,
      mediumFilename: row.sizes_medium_filename,
    })
  }
}

console.log(`[MIGRATE] ${dirtyBasenames.size} records need filename sanitization\n`)

if (dirtyBasenames.size === 0) {
  console.log('[MIGRATE] All filenames are already clean!')
  db.close()
  process.exit(0)
}

const diskFiles = readdirSync(mediaDir)
console.log(`[MIGRATE] ${diskFiles.length} files on disk\n`)

const usedNames = new Set(diskFiles)

function resolveCollision(desiredName) {
  if (!usedNames.has(desiredName)) return desiredName
  const ext = desiredName.match(/\.[^.]+$/)?.[0] || ''
  const base = desiredName.replace(/\.[^.]+$/, '')
  let i = 2
  while (usedNames.has(`${base}-${i}${ext}`)) i++
  return `${base}-${i}${ext}`
}

const fileRenames = []
const dbUpdates = []

for (const [oldBase, info] of dirtyBasenames) {
  const relatedFiles = diskFiles.filter(f => {
    const fb = f.replace(/\.[^.]+$/, '')
    return fb === oldBase || fb.startsWith(oldBase + '-')
  })

  const sanitizedBase = info.sanitized.replace(/\.[^.]+$/, '')
  let newMainFilename = null

  if (verbose) {
    console.log(`  ${info.filename} → ${info.sanitized} (${relatedFiles.length} files)`)
  }

  for (const file of relatedFiles) {
    const fileBase = file.replace(/\.[^.]+$/, '')
    const fileExt = file.match(/\.[^.]+$/)?.[0] || ''

    const suffix = fileBase === oldBase ? '' : fileBase.slice(oldBase.length)
    const desiredName = sanitizedBase + suffix + fileExt
    const newName = resolveCollision(desiredName)

    if (newName !== file) {
      fileRenames.push({ oldName: file, newName, isMain: file === info.filename })
      usedNames.delete(file)
      usedNames.add(newName)

      if (file === info.filename) {
        newMainFilename = newName
      }

      if (verbose) {
        console.log(`    ${file} → ${newName}`)
      }
    }
  }

  if (newMainFilename) {
    const sizeUpdates = {}
    if (info.thumbFilename && typeof info.thumbFilename === 'string') {
      sizeUpdates.thumb = sanitizeFilename(info.thumbFilename)
    }
    if (info.mediumFilename && typeof info.mediumFilename === 'string') {
      sizeUpdates.medium = sanitizeFilename(info.mediumFilename)
    }
    dbUpdates.push({ id: info.id, oldFilename: info.filename, newFilename: newMainFilename, sizeUpdates })
  }
}

console.log(`\n[MIGRATE] Planned ${fileRenames.length} file renames`)
console.log(`[MIGRATE] Planned ${dbUpdates.length} DB updates\n`)

if (fileRenames.length === 0) {
  console.log('[MIGRATE] Nothing to do!')
  db.close()
  process.exit(0)
}

if (dryRun) {
  console.log('[MIGRATE] === DRY RUN — showing first 15 renames ===\n')
  const mains = fileRenames.filter(r => r.isMain)
  for (const { oldName, newName } of mains.slice(0, 15)) {
    console.log(`  ${oldName}`)
    console.log(`  → ${newName}\n`)
  }
  if (mains.length > 15) {
    console.log(`  ... and ${mains.length - 15} more\n`)
  }
  const related = fileRenames.filter(r => !r.isMain)
  if (related.length > 0) {
    console.log(`  (+ ${related.length} related size/format variants)`)
  }
  console.log(`\n[MIGRATE] Dry run — no changes made. Run without --dry-run to apply.`)
  db.close()
  process.exit(0)
}

let renamed = 0
let errors = 0

for (const { oldName, newName } of fileRenames) {
  const oldPath = join(mediaDir, oldName)
  const newPath = join(mediaDir, newName)
  try {
    renameSync(oldPath, newPath)
    renamed++
    if (renamed % 100 === 0) {
      console.log(`[MIGRATE] Renamed ${renamed}/${fileRenames.length} files...`)
    }
  } catch (err) {
    console.error(`[MIGRATE] FAILED: ${oldName} → ${newName}: ${err.message}`)
    errors++
  }
}

console.log(`[MIGRATE] Renamed ${renamed} files (${errors} errors)`)

if (errors > 0) {
  console.error(`[MIGRATE] ${errors} file renames failed — skipping DB updates to avoid inconsistency`)
  console.error('[MIGRATE] Fix the errors above and re-run the script')
  db.close()
  process.exit(1)
}

console.log('[MIGRATE] Updating database...')

const stmt = await db.prepare(
  'UPDATE media SET filename = ?, sizes_thumbnail_filename = ?, sizes_medium_filename = ? WHERE id = ?'
)
let dbUpdated = 0

for (const { id, newFilename, sizeUpdates } of dbUpdates) {
  try {
    await stmt.execute({
      args: [
        newFilename,
        sizeUpdates.thumb || null,
        sizeUpdates.medium || null,
        id,
      ],
    })
    dbUpdated++
    if (dbUpdated % 100 === 0) {
      console.log(`[MIGRATE] Updated ${dbUpdated}/${dbUpdates.length} DB records...`)
    }
  } catch (err) {
    console.error(`[MIGRATE] DB update FAILED for id=${id}: ${err.message}`)
  }
}

console.log(`[MIGRATE] Updated ${dbUpdated} DB records`)
console.log(`\n[MIGRATE] Done! — ${renamed} files renamed, ${dbUpdated} DB records updated`)

db.close()

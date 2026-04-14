#!/usr/bin/env node
import { DatabaseSync } from 'node:sqlite'
import { existsSync } from 'node:fs'

const action = process.argv[2] || 'status'
const dbPath = process.argv[3] || 'db/payload.db'

if (!['status', 'clear'].includes(action)) {
  console.error('Usage: node scripts/migration-marker.mjs <status|clear> [dbPath]')
  process.exit(1)
}

if (!existsSync(dbPath)) {
  console.error(`Database file not found: ${dbPath}`)
  process.exit(1)
}

const db = new DatabaseSync(dbPath, { readOnly: action === 'status' })

try {
  const rows = db
    .prepare(
      `SELECT id, name, batch, created_at, updated_at
       FROM payload_migrations
       WHERE batch = -1 OR name = 'dev'
       ORDER BY id ASC`,
    )
    .all()

  if (action === 'status') {
    if (rows.length === 0) {
      console.log('No dev marker rows found in payload_migrations.')
    } else {
      console.log('Dev marker rows found in payload_migrations:')
      console.table(rows)
    }
    process.exit(0)
  }

  const result = db
    .prepare(`DELETE FROM payload_migrations WHERE batch = -1 OR name = 'dev'`)
    .run()

  console.log(`Deleted ${result.changes} dev marker row(s) from payload_migrations.`)
} catch (error) {
  console.error('Failed to inspect/update payload_migrations marker.')
  console.error(error)
  process.exit(1)
} finally {
  db.close()
}

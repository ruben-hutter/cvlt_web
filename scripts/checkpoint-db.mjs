/**
 * Flush SQLite WAL journal into the main DB file.
 * Run this BEFORE backing up or building to ensure payload.db
 * contains all committed data (even after an unclean shutdown).
 */
import { existsSync, statSync } from 'fs'
import { DatabaseSync } from 'node:sqlite'

const dbPath = 'db/payload.db'

if (!existsSync(dbPath)) {
  console.log('ℹ️  No database found, skipping WAL checkpoint')
  process.exit(0)
}

const { size } = statSync(dbPath)
if (size === 0) {
  console.warn('⚠️  payload.db is 0 bytes — nothing to checkpoint')
  process.exit(0)
}

try {
  const db = new DatabaseSync(dbPath)
  const result = db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get()
  db.close()
  console.log('✅ WAL checkpoint done:', result)
} catch (e) {
  console.warn('⚠️  WAL checkpoint failed (non-fatal):', e.message)
}

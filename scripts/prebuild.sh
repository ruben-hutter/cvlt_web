#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  PREBUILD — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

mkdir -p db media .backups

echo ""
echo "📂 DB files before build:"
ls -la db/ 2>/dev/null || echo "  (empty)"

echo ""
if [ -s db/payload.db ]; then
  BACKUP=".backups/payload.db.$(date +%Y%m%d_%H%M%S)"
  cp db/payload.db "$BACKUP"
  [ -f db/payload.db-wal ] && cp db/payload.db-wal "${BACKUP}-wal"
  [ -f db/payload.db-shm ] && cp db/payload.db-shm "${BACKUP}-shm"
  echo "✅ DB backed up to $BACKUP ($(wc -c < db/payload.db) bytes)"
elif [ -f db/payload.db ]; then
  echo "⚠️  DB file exists but is EMPTY (0 bytes) — nothing to back up"
else
  echo "ℹ️  No DB file found — fresh start"
fi

echo ""
echo "📊 DB table check:"
if [ -s db/payload.db ]; then
  node -e "
    const { DatabaseSync } = require('node:sqlite');
    try {
      const db = new DatabaseSync('db/payload.db');
      const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
      console.log('  Tables found:', tables.length);
      tables.forEach(t => console.log('    -', t.name));
      const users = db.prepare('SELECT count(*) as c FROM users').get();
      console.log('  Users:', users.c);
      db.close();
    } catch(e) { console.log('  Error reading DB:', e.message); }
  " 2>/dev/null || echo "  (could not inspect DB)"
else
  echo "  (no DB to inspect)"
fi

echo "========================================"

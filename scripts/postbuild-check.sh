#!/usr/bin/env bash
set -euo pipefail

echo ""
echo "========================================"
echo "  POSTBUILD CHECK — $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

echo ""
echo "📂 DB files after build:"
ls -la db/ 2>/dev/null || echo "  (empty)"

echo ""
DB_SIZE=0
if [ -f db/payload.db ]; then
  DB_SIZE=$(wc -c < db/payload.db)
fi

if [ "$DB_SIZE" -gt 0 ]; then
  echo "✅ DB file is $DB_SIZE bytes — OK"
else
  echo "❌ DB file is EMPTY or missing after build!"
  echo ""
  # Try to restore from latest backup
  LATEST_BACKUP=$(ls -t db/backups/payload.db.* 2>/dev/null | grep -v '\-wal$' | grep -v '\-shm$' | head -1)
  if [ -n "$LATEST_BACKUP" ]; then
    echo "🔄 Restoring from latest backup: $LATEST_BACKUP"
    cp "$LATEST_BACKUP" db/payload.db
    [ -f "${LATEST_BACKUP}-wal" ] && cp "${LATEST_BACKUP}-wal" db/payload.db-wal
    [ -f "${LATEST_BACKUP}-shm" ] && cp "${LATEST_BACKUP}-shm" db/payload.db-shm
    echo "✅ DB restored ($(wc -c < db/payload.db) bytes)"
  else
    echo "⚠️  No backups available to restore from"
  fi
fi

echo ""
echo "📊 DB table check after build:"
if [ -s db/payload.db ]; then
  node -e "
    const { DatabaseSync } = require('node:sqlite');
    try {
      const db = new DatabaseSync('db/payload.db');
      const tables = db.prepare(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\").all();
      console.log('  Tables found:', tables.length);
      const users = db.prepare('SELECT count(*) as c FROM users').get();
      console.log('  Users:', users.c);
      db.close();
    } catch(e) { console.log('  Error:', e.message); }
  " 2>/dev/null || echo "  (could not inspect DB)"
else
  echo "  (no DB to inspect)"
fi

echo "========================================"

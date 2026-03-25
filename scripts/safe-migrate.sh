#!/usr/bin/env bash
set -euo pipefail

# Only run payload migrate if the DB is empty or missing.
# If tables already exist (from dev push or previous migrate), skip it.
# This avoids Payload's destructive "dev mode detected" prompt.

if [ ! -f db/payload.db ] || [ ! -s db/payload.db ]; then
  echo "📦 DB is empty or missing — running payload migrate..."
  payload migrate
else
  TABLE_COUNT=$(node -e "
    const { DatabaseSync } = require('node:sqlite');
    try {
      const db = new DatabaseSync('db/payload.db');
      const r = db.prepare(\"SELECT count(*) as c FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'\").get();
      console.log(r.c);
      db.close();
    } catch(e) { console.log('0'); }
  " 2>/dev/null || echo "0")

  if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "✅ DB has $TABLE_COUNT tables — skipping migrate (tables already exist)"
  else
    echo "📦 DB file exists but has no tables — running payload migrate..."
    payload migrate
  fi
fi

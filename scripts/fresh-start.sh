#!/usr/bin/env bash
set -euo pipefail

# Fresh start script for CVLT Web on Infomaniak.
# Run this via SSH before the first build, or whenever you need to
# reset the DB and start clean.
#
# Usage:  bash scripts/fresh-start.sh

echo "=== CVLT fresh start ==="

# 1. Remove old DB (if any)
if [ -f db/payload.db ]; then
  echo "Removing old database..."
  rm -f db/payload.db
else
  echo "No existing database found."
fi

# 2. Ensure directories exist
mkdir -p db media

# 3. Run Payload migrations to create the schema
echo "Running payload migrate..."
npx payload migrate

echo ""
echo "Done! DB schema created. You can now run:"
echo "  npm run build"
echo "  npm run start"

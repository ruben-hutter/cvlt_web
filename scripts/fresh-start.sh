#!/usr/bin/env bash
set -euo pipefail

# ⚠️  DESTRUCTIVE: Deletes the database and starts fresh.
# Only use this for initial setup or when you intentionally want to wipe all data.
#
# For normal deploys, just run: npm run build && npm run start
# The build script automatically backs up and migrates the DB.
#
# Usage:  bash scripts/fresh-start.sh

echo "=== CVLT fresh start ==="
echo "⚠️  WARNING: This will DELETE the database and all its data!"
read -p "Are you sure? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

# 1. Remove old DB (if any)
if [ -f db/payload.db ]; then
  echo "Removing old database..."
  rm -f db/payload.db db/payload.db-wal db/payload.db-shm
else
  echo "No existing database found."
fi

# 2. Ensure directories exist
mkdir -p db media

# 3. Run Payload migrations to create the schema
echo "Running payload migrate..."
npx payload migrate

echo ""
echo "Running user seed..."
npx tsx --env-file .env seed/create-users.ts

echo ""
echo "Done! DB schema created and users seeded. You can now run:"
echo "  npm run build"
echo "  npm run start"

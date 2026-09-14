#!/bin/sh

# Initialize database if it doesn't exist in the volume
if [ ! -f /data/miracletree.db ]; then
  echo "Initializing new database in volume..."
  mkdir -p /data
  cp /app/dev.db /data/miracletree.db
fi

# Duplicates first. The schema push below adds the unique index on
# ProductVariant.sku, and a database from an older image still holds the
# collisions the old SKU scheme produced — four herbal teas all carrying
# MT-MORINGA-WITH-2. A unique index cannot be built over those, so the push
# fails, the schema stays behind, and the app throws on the first query against
# a table the old database does not have. This renames duplicates and deletes
# nothing; on a clean database it does nothing at all.
echo "Checking SKUs..."
DATABASE_URL="file:/data/miracletree.db" node ./scripts/repair-duplicate-skus.mjs || echo "SKU repair skipped."

echo "Updating database schema..."
DATABASE_URL="file:/data/miracletree.db" npx -y prisma@6 db push --schema=node_modules/.prisma/client/schema.prisma --accept-data-loss --skip-generate

# Start Nginx in background as daemon
nginx

# Start Next.js standalone application on port 3000
PORT=3000 HOSTNAME=0.0.0.0 node server.js

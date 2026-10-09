#!/bin/sh

# (SQLite database init removed for MongoDB)

# Duplicates first. The schema push below adds the unique index on
# ProductVariant.sku, and a database from an older image still holds the
# collisions the old SKU scheme produced — four herbal teas all carrying
# MT-MORINGA-WITH-2. A unique index cannot be built over those, so the push
# fails, the schema stays behind, and the app throws on the first query against
# a table the old database does not have. This renames duplicates and deletes
# nothing; on a clean database it does nothing at all.
echo "Checking SKUs..."
node ./scripts/repair-duplicate-skus.mjs || echo "SKU repair skipped."

echo "Updating database schema..."
npx -y prisma@6 db push --schema=node_modules/.prisma/client/schema.prisma --accept-data-loss --skip-generate

# Bring the editorial content up to date. The database above is whatever the
# volume was holding, which after the first deploy is never refreshed — so
# every copy correction since then had been landing in the image and stopping
# there. This replays the snapshot built into the image when its version
# differs from the one the database recorded, and touches nothing outside the
# content tables: no products, no orders, no customers, no reviews.
echo "Syncing content..."
node ./scripts/sync-content.mjs || echo "Content sync skipped."

echo "Injecting admin users..."
node ./scripts/inject-admin.mjs || echo "Admin injection failed."

# Start Nginx in background as daemon
nginx

# Start Next.js standalone application on port 3000
PORT=3000 HOSTNAME=0.0.0.0 node server.js

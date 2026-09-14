#!/bin/sh

# Initialize database if it doesn't exist in the volume
if [ ! -f /data/miracletree.db ]; then
  echo "Initializing new database in volume..."
  mkdir -p /data
  cp /app/dev.db /data/miracletree.db
fi

echo "Updating database schema..."
DATABASE_URL="file:/data/miracletree.db" npx -y prisma@6 db push --schema=node_modules/.prisma/client/schema.prisma --accept-data-loss --skip-generate

# Start Nginx in background as daemon
nginx

# Start Next.js standalone application on port 3000
PORT=3000 HOSTNAME=0.0.0.0 node server.js

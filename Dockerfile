# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
ENV DOCKER_BUILD="1"
RUN npx prisma generate
RUN npm run build
# Navigation, homepage sections, FAQs, story and leadership live in the
# database. Without this snapshot sync-content.mjs has nothing to apply on
# start, and the VPS shows a site with no menu and missing sections.
RUN npx tsx scripts/build-content-snapshot.ts
# The catalogue importer reuses the seed's TypeScript, so it is bundled into
# one plain module beside the seed data it reads (prisma/data).
RUN npx esbuild scripts/import-catalogue.ts --bundle --platform=node --format=esm \
    --target=node20 --packages=external --outfile=prisma/import-catalogue.mjs

# Stage 2: Serve the application with Nginx and Node.js
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install Nginx
RUN apk add --no-cache nginx

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy standalone Next.js application
# Next.js standalone output automatically copies node_modules and other required files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/repair-duplicate-skus.mjs ./scripts/repair-duplicate-skus.mjs
COPY --from=builder /app/scripts/sync-content.mjs ./scripts/sync-content.mjs
COPY --from=builder /app/content-snapshot.json ./content-snapshot.json
COPY --from=builder /app/prisma/import-catalogue.mjs ./prisma/import-catalogue.mjs
COPY --from=builder /app/prisma/data/shopify-products.json ./prisma/data/shopify-products.json
COPY --from=builder /app/scripts/inject-admin.mjs ./scripts/inject-admin.mjs

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Provide the packages needed for standalone scripts without mutating the package tree
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/dotenv ./node_modules/dotenv

# Expose port 3009
EXPOSE 3009

# Start Nginx and the Node server
CMD ["./start.sh"]

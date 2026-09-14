# Stage 1: Build the Next.js application
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma db push
RUN npm run build

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
COPY --from=builder /app/prisma/dev.db ./dev.db
COPY --from=builder /app/prisma ./prisma

# Install prisma for database migrations
RUN npm install prisma

# Copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Expose port 3009
EXPOSE 3009

# Start Nginx and the Node server
CMD ["./start.sh"]

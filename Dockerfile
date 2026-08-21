# Multi-stage Dockerfile for Production Deployment
# -----------------------------------------------------------------------------
# Stage 1: Build Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and frontend public directory
COPY src ./src

# Generate Prisma Client & Compile TypeScript
RUN npx prisma generate
RUN npm run build

# Copy public assets into dist for unified serving
RUN cp -r src/public dist/public

# -----------------------------------------------------------------------------
# Stage 2: Production Runner
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

# Copy built code & assets from builder stage
COPY --from=builder /app/dist ./dist

# Create volume mount point for SQLite database persistence
RUN mkdir -p /app/data

EXPOSE 3000

# Run database push and start application
CMD ["sh", "-c", "npx prisma db push && node dist/server.js"]

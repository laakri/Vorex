# Builder stage
FROM oven/bun:latest as builder
WORKDIR /app

# Install OpenSSL to fix Prisma warnings
RUN apt-get update -y && apt-get install -y openssl

# Copy package files first for better caching
COPY package.json bun.lockb* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# Generate Prisma Client
RUN bunx prisma generate

# Final stage
FROM oven/bun:latest
WORKDIR /app

# Install OpenSSL in final stage too
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy built files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy source code
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Run migrations and start the app
CMD ["/bin/sh", "-c", "bunx prisma migrate deploy && bun src/main.ts"]
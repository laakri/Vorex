# Builder stage
FROM oven/bun:latest as builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install

# Generate Prisma Client (now using bun in the builder stage)
RUN bunx prisma generate

# Final stage
FROM oven/bun:latest
WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Add migration command before starting the app
CMD ["/bin/sh", "-c", "bunx prisma migrate deploy && bun src/main.ts"]
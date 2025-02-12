# Builder stage
FROM oven/bun:latest as builder
WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install

# Temporary switch to Node.js for Prisma generation
FROM node:18-alpine as prisma-builder
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

# Final stage
FROM oven/bun:latest
WORKDIR /app

# Copy built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=prisma-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY . .

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "src/main.ts"]
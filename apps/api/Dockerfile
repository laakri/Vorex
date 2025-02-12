FROM oven/bun:latest as builder

WORKDIR /app

# Copy package files first
COPY package.json bun.lockb ./

# Copy Prisma schema
COPY prisma ./prisma/

# Install dependencies and generate Prisma client
RUN bun install --frozen-lockfile
RUN bunx prisma generate

# Copy the rest of the application
COPY . .

# Build the application
RUN bun run build

# Production stage
FROM oven/bun:latest

WORKDIR /app

# Copy built assets and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["bun", "run", "start:prod"]
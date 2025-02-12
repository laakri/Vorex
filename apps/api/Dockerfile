FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json .

# Copy source files
COPY . .

# Install dependencies and generate Prisma client
RUN bun install
RUN bunx prisma generate

# Build the application
RUN bun run build

EXPOSE 3000

# Add error handling and logging
CMD ["/bin/sh", "-c", "\
    echo 'Waiting for database...' && \
    sleep 5 && \
    echo 'Running database push...' && \
    bunx prisma db push && \
    echo 'Starting application...' && \
    bun --inspect run dist/src/main.js"]
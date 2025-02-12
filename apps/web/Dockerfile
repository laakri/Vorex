FROM oven/bun:latest as builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Copy source files
COPY . .

# Install dependencies
RUN bun install

# Make sure the build script exists and runs
RUN bun run build

# Production stage
FROM nginx:alpine

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
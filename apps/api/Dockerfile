FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lock ./
COPY prisma ./prisma/

RUN bun install

COPY . .

RUN bunx prisma generate
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start:prod"]
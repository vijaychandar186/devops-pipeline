FROM oven/bun:latest AS base
WORKDIR /app

FROM base AS deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001
CMD ["bun", "src/index.ts"]

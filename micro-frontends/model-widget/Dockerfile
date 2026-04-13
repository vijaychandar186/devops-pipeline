FROM oven/bun:latest AS builder
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html/widget
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

# Docker Guide

This project ships separate Docker Compose configurations for development and production.

---

## Files Overview

### Dockerfiles

- **`Dockerfile.dev`** — Development image with hot reload
- **`Dockerfile.prod`** — Production multi-stage build (standalone Next.js)
- **`docker-entrypoint.dev.sh`** — Dev entrypoint (runs Prisma migrations on startup)
- **`docker-entrypoint.prod.sh`** — Prod entrypoint (applies Prisma migrations on startup)
- **`.dockerignore`** — Files excluded from build contexts

### Docker Compose Files

- **`docker-compose.dev.yml`** — Full dev stack with hot-reload volume mounts
- **`docker-compose.prod.yml`** — Production stack; all monitoring config baked into images

---

## Development Environment

```bash
make dev           # start (foreground)
make dev-build     # rebuild images and start
make dev-down      # stop
make dev-logs      # tail all logs
```

### Access Points

| Service | URL |
|---------|-----|
| App (Next.js) | <http://localhost:3000> |
| App (via nginx) | <http://localhost:80> |
| llm-aggregator | <http://localhost:4001> |
| user-analytics | <http://localhost:4002> |
| model-widget | <http://localhost:5174> |
| Grafana | <http://localhost:3001> |
| Prometheus | <http://localhost:9090> |
| pgAdmin | <http://localhost:5050> |
| Prisma Studio | <http://localhost:5555> |
| Redis Commander | <http://localhost:8082> |

---

## Production Environment

```bash
# 1. Copy and fill in the production env file
cp .env.example .env.production

# 2. Start all services (detached)
make prod-up

# 3. Rebuild images and start (after code/config changes)
make prod-up-build

# 4. Check status / logs
make prod-ps
make prod-logs

# 5. Stop
make prod-down
```

### Access Points

| Service | URL | Notes |
|---------|-----|-------|
| App | <http://localhost/> | Through nginx |
| Model Widget | <http://localhost/widget/> | Through nginx |
| Grafana | <http://localhost:3001> | Direct port — admin only |
| Prometheus | <http://localhost:9090> | Direct port — admin only |
| pgAdmin | <http://localhost:5050> | Direct port — admin only |

### nginx routes (user-facing)

nginx listens on port 80 and proxies only end-user traffic:

| Path | Upstream |
|------|----------|
| `/` | nextjs-app:3000 |
| `/api/models` | llm-aggregator:4001/models |
| `/api/analytics/` | user-analytics:4002 |
| `/widget/` | model-widget:80 |

Grafana and Prometheus are **not** routed through nginx — they are exposed directly on their
own ports. This avoids subpath/redirect complexity and keeps the user-facing proxy simple.

### Config baked into images (Codespaces / DooD)

All monitoring config files (Prometheus, Grafana, Loki, Tempo, OTel Collector, Promtail,
postgres-exporter) are baked into their images at build time using `dockerfile_inline` in
`docker-compose.prod.yml`. This is required because Docker-outside-of-Docker (DooD) in
GitHub Codespaces cannot resolve bind-mount paths from inside the devcontainer.

To pick up config changes, rebuild the affected service:

```bash
BUILDX_NO_DEFAULT_ATTESTATIONS=1 docker compose --env-file .env.production \
  -f docker-compose.prod.yml up -d --build --no-deps <service-name>
```

---

## Database Management

### Automatic Migrations

Prisma migrations run automatically on container startup in both environments. No manual
intervention needed.

### Manual Migration

```bash
# Create a new migration (dev only)
docker compose -f docker-compose.dev.yml exec nextjs-app bunx prisma migrate dev --name your_name

# Apply migrations manually
docker compose -f docker-compose.dev.yml exec nextjs-app bunx prisma migrate deploy
```

### PostgreSQL CLI

```bash
# Development
docker exec -it postgres-db-dev psql -U admin -d mydatabase

# Production
docker exec -it postgres-db psql -U admin -d mydatabase
```

---

## Common Commands

```bash
# Tail logs for a specific service
docker compose -f docker-compose.dev.yml logs -f nextjs-bun-app-dev

# Rebuild a single service without restarting the rest
docker compose -f docker-compose.dev.yml up --build llm-aggregator

# Free disk space (build cache fills fast with monitoring images)
docker system prune -f
```

---

## Troubleshooting

### Port already in use

```bash
lsof -i :3000
```

Change the host port in the relevant `docker-compose` file or stop the conflicting process.

### OOM kills (exit code 137)

The prod stack runs ~17 containers. In memory-constrained environments (e.g. Codespaces with
no swap), the kernel may OOM-kill containers during cold start. All services have
`restart: unless-stopped` / `restart: always` so they recover automatically. Run
`make prod-up` (detached) rather than foreground mode.

### Bind mounts empty in Codespaces

Docker-outside-of-Docker means the host daemon cannot see `/workspaces/` paths. Use
`dockerfile_inline` to bake config files into images at build time — this is already the
pattern used in `docker-compose.prod.yml` for all monitoring services.

### Prisma client not found

```bash
docker compose -f docker-compose.dev.yml build --no-cache nextjs-app
```

---

## Other Compose Files

- **`docker-compose.localstack.yml`** — LocalStack for Terraform testing (see [docs/local-ci.md](local-ci.md))
- **`docker-compose.jenkins.yml`** — Local Jenkins for Jenkinsfile testing (see [docs/local-ci.md](local-ci.md))

---

## Next Steps

- [Prisma documentation](./prisma.md)
- [Docker Compose documentation](https://docs.docker.com/compose/)

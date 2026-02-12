# Docker Guide

This project includes separate Docker configurations for development and production environments.

---

## Files Overview

### Dockerfiles

- **`Dockerfile.dev`** - Development environment with hot reload
- **`Dockerfile.prod`** - Production-optimized multi-stage build
- **`docker-entrypoint.dev.sh`** - Development entrypoint (runs migrations on startup)
- **`docker-entrypoint.prod.sh`** - Production entrypoint (applies migrations on startup)
- **`.dockerignore`** - Files excluded from Docker build context

### Docker Compose Files

- **`docker-compose.yml`** - Default production configuration
- **`docker-compose.dev.yml`** - Development with volume mounts for hot reload
- **`docker-compose.prod.yml`** - Production configuration (same as default)

---

## Development Environment

### Start Development Containers

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Features

- ✅ **Hot Reload** - Source code changes reflect immediately
- ✅ **Volume Mounts** - `src/`, `public/`, `prisma/` directories mounted
- ✅ **Fast Iterations** - No rebuild needed for code changes
- ✅ **Isolated Database** - Separate PostgreSQL volume (`postgres-data-dev`)
- ✅ **Auto Migrations** - Prisma migrations run automatically on container startup

### Access Points

- **Next.js App**: http://localhost:3000
- **PostgreSQL**: localhost:5433
- **pgAdmin**: http://localhost:5050
  - Email: `admin@admin.com`
  - Password: `admin`

---

## Production Environment

### Build and Run Production Containers

```bash
# Using default docker-compose.yml
docker-compose up --build

# Or explicitly using prod file
docker-compose -f docker-compose.prod.yml up --build
```

### Features

- ✅ **Multi-Stage Build** - Optimized image size
- ✅ **Standalone Output** - Next.js standalone mode
- ✅ **No Source Mounts** - Code baked into image
- ✅ **Nginx Reverse Proxy** - Production-ready routing
- ✅ **Optimized Performance** - Production build with telemetry disabled
- ✅ **Auto Migrations** - Prisma migrations applied automatically on container startup

### Access Points

- **Nginx (Reverse Proxy)**: http://localhost:8000
- **PostgreSQL**: localhost:5433 (external)
- **pgAdmin**: http://localhost:5050

---

## Common Commands

### Stop All Containers

```bash
# Development
docker-compose -f docker-compose.dev.yml down

# Production
docker-compose down
```

### Stop and Remove Volumes

```bash
# Development (removes database data)
docker-compose -f docker-compose.dev.yml down -v

# Production
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f nextjs-app
```

### Rebuild Without Cache

```bash
# Development
docker-compose -f docker-compose.dev.yml build --no-cache

# Production
docker-compose build --no-cache
```

---

## Database Management

### Automatic Migrations

**Migrations run automatically when containers start!** Both development and production environments include entrypoint scripts that:

- **Development**: Runs `prisma migrate deploy` on startup
- **Production**: Runs `prisma migrate deploy` on startup

No manual intervention needed! 🎉

### Manual Migration (if needed)

If you need to run migrations manually or create new ones:

```bash
# Create a new migration (development only)
docker-compose -f docker-compose.dev.yml exec nextjs-app bunx prisma migrate dev --name your_migration_name

# Apply migrations manually
docker-compose -f docker-compose.dev.yml exec nextjs-app bunx prisma migrate deploy
```

### Access PostgreSQL CLI

```bash
# Development
docker exec -it postgres-db-dev psql -U admin -d mydatabase

# Production
docker exec -it postgres-db psql -U admin -d mydatabase
```

### Prisma Studio in Container

```bash
# Development
docker-compose -f docker-compose.dev.yml exec nextjs-app bunx prisma studio
```

---

## Troubleshooting

### Port Already in Use

If you get a "port already allocated" error:

```bash
# Check what's using the port
lsof -i :3000
# or
netstat -tlnp | grep 3000

# Stop the conflicting process or change the port in docker-compose
```

### Database Connection Issues

1. Ensure PostgreSQL container is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check DATABASE_URL in container:
   ```bash
   docker-compose -f docker-compose.dev.yml exec nextjs-app env | grep DATABASE_URL
   ```

3. Verify database credentials match across:
   - `.env`
   - `docker-compose.dev.yml` or `docker-compose.yml`

### Prisma Client Not Found

If you get "Cannot find module" errors for Prisma:

```bash
# Rebuild the image
docker-compose -f docker-compose.dev.yml build --no-cache nextjs-app

# Or regenerate Prisma client inside container
docker-compose -f docker-compose.dev.yml exec nextjs-app bunx prisma generate
```

### Hot Reload Not Working

Volume mounts should handle this, but if changes aren't reflected:

1. Check volume mounts in `docker-compose.dev.yml`
2. Restart the dev container:
   ```bash
   docker-compose -f docker-compose.dev.yml restart nextjs-app
   ```

---

## Environment Variables

### Required Variables

Ensure these are set in `.env`:

```env
DATABASE_URL="postgresql://admin:mysecretpassword@localhost:5432/mydatabase?schema=public"
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-key"
AUTH_GITHUB_ID="your-github-oauth-id"
AUTH_GITHUB_SECRET="your-github-oauth-secret"
PGADMIN_DEFAULT_EMAIL="admin@admin.com"
PGADMIN_DEFAULT_PASSWORD="admin"
```

### Container vs Host URLs

- **In containers**: Use service names (e.g., `postgres:5432`)
- **On host machine**: Use `localhost` with exposed port (e.g., `localhost:5433`)

The `DATABASE_URL` in `docker-compose.yml` overrides `.env` for containerized apps.

---

## Best Practices

1. **Development**: Use `docker-compose.dev.yml` for active development
2. **Production Testing**: Test with `docker-compose.prod.yml` before deployment
3. **Keep .env Updated**: Ensure credentials match across all configurations
4. **Clean Builds**: Use `--no-cache` when dependencies or Prisma schema changes
5. **Monitor Logs**: Use `docker-compose logs -f` to debug issues

---

## Next Steps

- [Prisma Documentation](./prisma.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

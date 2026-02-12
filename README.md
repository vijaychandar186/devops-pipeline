# DevOps Pipeline - Next.js + Prisma + PostgreSQL

A production-ready Next.js application with Prisma ORM, PostgreSQL database, NextAuth authentication, and Docker support for both development and production environments.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Local Development (Without Docker)](#local-development-without-docker)
- [Docker Development](#docker-development)
- [Docker Production](#docker-production)
- [Environment Variables](#environment-variables)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Runtime**: [Bun](https://bun.sh/)
- **Database**: [PostgreSQL 16](https://www.postgresql.org/)
- **ORM**: [Prisma ORM 7](https://www.prisma.io/)
- **Authentication**: [NextAuth.js v5](https://authjs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx (production)

---

## 📦 Prerequisites

### For Local Development (Without Docker):
- [Bun](https://bun.sh/) (latest version)
- [PostgreSQL 16](https://www.postgresql.org/download/) (running locally or via Docker)
- [Git](https://git-scm.com/)

### For Docker Development/Production:
- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

---

## ⚡ Quick Start

Choose your preferred method:

### Option 1: Local Development (Without Docker)
```bash
# Clone and setup
git clone <your-repo-url>
cd devops-pipeline

# Install dependencies
bun install

# Start PostgreSQL (if using Docker for DB only)
docker run -d \
  --name my-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=mydatabase \
  -p 5432:5432 \
  postgres:16

# Run migrations
bunx prisma migrate dev

# Start development server
bun run dev
```

**Access:** http://localhost:3000

### Option 2: Docker Development (Hot Reload)
```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up --build
```

**Access:** http://localhost:3000 (Migrations run automatically!)

### Option 3: Docker Production (Full Stack)
```bash
# Start production environment
docker-compose up --build
```

**Access:** http://localhost:8000 (via Nginx reverse proxy)

---

## 💻 Local Development (Without Docker)

### 1. Install Dependencies

```bash
bun install
```

### 2. Setup Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Or create `.env` manually with:

```env
# Database
DATABASE_URL="postgresql://admin:mysecretpassword@localhost:5432/mydatabase?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-key-here"

# OAuth Providers (optional)
AUTH_GITHUB_ID="your-github-oauth-id"
AUTH_GITHUB_SECRET="your-github-oauth-secret"
```

### 3. Start PostgreSQL Database

**Option A: Using existing PostgreSQL installation**
- Ensure PostgreSQL is running on `localhost:5432`
- Create database: `mydatabase`
- User: `admin` with password: `mysecretpassword`

**Option B: Using Docker for database only**
```bash
docker run -d \
  --name my-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=mydatabase \
  -p 5432:5432 \
  postgres:16
```

### 4. Run Database Migrations

```bash
bunx prisma migrate dev
```

This will:
- Create all database tables
- Apply the Prisma schema
- Generate the Prisma Client

### 5. (Optional) Seed Database

```bash
bunx prisma db seed
```

### 6. Generate Prisma Client

```bash
bunx prisma generate
```

### 7. Start Development Server

```bash
bun run dev
```

The application will be available at:
- **App**: http://localhost:3000
- **API Routes**: http://localhost:3000/api

### 8. View Database with Prisma Studio

```bash
bunx prisma studio
```

Opens at: http://localhost:5555

---

## 🐳 Docker Development

Development environment with hot reload, volume mounts, and automatic migrations.

### Start Development Environment

```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Features

✅ **Hot Reload** - Code changes reflect instantly
✅ **Volume Mounts** - `src/`, `public/`, `prisma/` mounted
✅ **Auto Migrations** - Runs on container startup
✅ **Isolated Database** - Separate dev database

### Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| **Next.js** | http://localhost:3000 | - |
| **PostgreSQL** | localhost:5433 | `admin` / `mysecretpassword` |
| **pgAdmin** | http://localhost:5050 | `admin@admin.com` / `admin` |

### Useful Commands

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart specific service
docker-compose -f docker-compose.dev.yml restart nextjs-app

# Execute command in container
docker-compose -f docker-compose.dev.yml exec nextjs-app bun run dev

# Access database
docker exec -it postgres-db-dev psql -U admin -d mydatabase

# Create new migration
docker-compose -f docker-compose.dev.yml exec nextjs-app bunx prisma migrate dev --name migration_name

# Open Prisma Studio
docker-compose -f docker-compose.dev.yml exec nextjs-app bunx prisma studio
```

### Volume Mounts

The following directories are mounted for hot reload:
- `./src` → `/app/src`
- `./public` → `/app/public`
- `./prisma` → `/app/prisma`
- `./prisma.config.ts` → `/app/prisma.config.ts`

Node modules and build artifacts are NOT mounted (for performance).

---

## 🚢 Docker Production

Production-ready environment with optimized builds, Nginx reverse proxy, and automatic migrations.

### Start Production Environment

```bash
# Using default docker-compose.yml
docker-compose up --build

# Or explicitly
docker-compose -f docker-compose.prod.yml up --build
```

### Features

✅ **Multi-Stage Build** - Optimized image size
✅ **Standalone Output** - Next.js standalone mode
✅ **Nginx Reverse Proxy** - Production-ready routing
✅ **Auto Migrations** - Applied on startup
✅ **Production Optimized** - Minified, tree-shaken

### Access Points

| Service | URL | Notes |
|---------|-----|-------|
| **Nginx (App)** | http://localhost:8000 | Reverse proxy to Next.js |
| **PostgreSQL** | localhost:5433 | External access |
| **pgAdmin** | http://localhost:5050 | Database management UI |

### Production Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database)
docker-compose down -v

# View logs
docker-compose logs -f

# Rebuild without cache
docker-compose build --no-cache

# Scale services (example)
docker-compose up --scale nextjs-app=3

# Health check
docker-compose ps
```

### Nginx Configuration

The Nginx reverse proxy is configured in [`nginx.conf`](nginx.conf). Modify for:
- SSL/TLS certificates
- Custom domains
- Rate limiting
- Caching strategies

---

## 🔐 Environment Variables

### Required Variables

```env
# Database Connection
DATABASE_URL="postgresql://admin:mysecretpassword@localhost:5432/mydatabase?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="generate-with-openssl-rand-base64-32"

# OAuth Providers (GitHub example)
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"

# pgAdmin (Docker only)
PGADMIN_DEFAULT_EMAIL="admin@admin.com"
PGADMIN_DEFAULT_PASSWORD="admin"
```

### Generate AUTH_SECRET

```bash
openssl rand -base64 32
```

or

```bash
bunx auth secret
```

### Database URL Format

**Local Development:**
```
postgresql://USER:PASSWORD@localhost:5432/DATABASE?schema=public
```

**Docker (internal):**
```
postgresql://USER:PASSWORD@postgres:5432/DATABASE
```

---

## 📚 Documentation

Detailed guides available in the [`docs/`](docs/) directory:

- **[Docker Guide](docs/docker.md)** - Complete Docker setup and troubleshooting
- **[Prisma Guide](docs/prisma.md)** - Prisma ORM, migrations, and best practices

---

## 📁 Project Structure

```
devops-pipeline/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── lib/              # Utility functions
│   │   ├── db.ts        # Prisma client singleton
│   │   ├── auth.ts      # NextAuth configuration
│   │   └── auth.config.ts
│   └── generated/        # Generated Prisma Client
│       └── prisma/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── migrations/      # Migration files
├── public/              # Static assets
├── docs/                # Documentation
│   ├── docker.md
│   └── prisma.md
├── docker-compose.yml           # Production compose
├── docker-compose.dev.yml       # Development compose
├── docker-compose.prod.yml      # Production compose (explicit)
├── Dockerfile.dev              # Development Dockerfile
├── Dockerfile.prod             # Production Dockerfile
├── docker-entrypoint.dev.sh    # Dev entrypoint (auto migrations)
├── docker-entrypoint.prod.sh   # Prod entrypoint (auto migrations)
├── nginx.conf                   # Nginx configuration
├── prisma.config.ts            # Prisma configuration
├── next.config.ts              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── .env                        # Environment variables (local)
└── package.json
```

---

## 🛠️ Common Tasks

### Database Operations

```bash
# Create migration
bunx prisma migrate dev --name your_migration_name

# Apply migrations (production)
bunx prisma migrate deploy

# Reset database (⚠️ deletes all data)
bunx prisma migrate reset

# Open Prisma Studio
bunx prisma studio

# Pull schema from database
bunx prisma db pull

# Push schema to database (without migration)
bunx prisma db push
```

### Development Commands

```bash
# Start dev server
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Lint code
bun run lint

# Format code
bun run format

# Type check
bun run type-check
```

### Docker Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build    # Start
docker-compose -f docker-compose.dev.yml down          # Stop
docker-compose -f docker-compose.dev.yml logs -f       # Logs

# Production
docker-compose up --build                              # Start
docker-compose down                                    # Stop
docker-compose logs -f                                 # Logs

# Clean up
docker-compose down -v                                 # Remove volumes
docker system prune -a                                 # Clean all
```

---

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000
# or
netstat -tlnp | grep 3000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   docker ps | grep postgres
   # or for local PostgreSQL
   sudo systemctl status postgresql
   ```

2. **Verify credentials in `.env`**

3. **Test connection:**
   ```bash
   psql -h localhost -U admin -d mydatabase
   ```

### Prisma Client Not Found

```bash
# Regenerate Prisma Client
bunx prisma generate

# If using Docker
docker-compose exec nextjs-app bunx prisma generate
```

### Hot Reload Not Working (Docker)

1. Check volume mounts in `docker-compose.dev.yml`
2. Restart containers:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

### Migration Errors

```bash
# Reset migrations (⚠️ deletes data)
bunx prisma migrate reset

# Apply specific migration
bunx prisma migrate resolve --applied "migration_name"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Authors

- **Vijay** - Initial work

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://authjs.dev/)
- [Bun](https://bun.sh/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 📞 Support

For support, please refer to:
- [Documentation](docs/)
- [Issues](https://github.com/your-repo/issues)
- [Discussions](https://github.com/your-repo/discussions)

---

**Happy Coding! 🚀**

# PostgreSQL with Docker – Updated Setup Guide (2026)

This guide provides a clean and production-ready approach to running PostgreSQL using Docker, including best practices for development and deployment.

---

## 1️⃣ Pull the Official PostgreSQL Image

```bash
docker pull postgres:16
```

> It is recommended to pin a specific version (e.g., `postgres:16`) instead of using `latest` for stability.

---

## 2️⃣ Run a PostgreSQL Container (Basic Setup)

```bash
docker run -d \
  --name my-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=mydatabase \
  -p 5432:5432 \
  postgres:16
```

### Explanation

- `POSTGRES_USER` – Creates a custom superuser
- `POSTGRES_PASSWORD` – Sets the user password
- `POSTGRES_DB` – Creates a default database
- `-p 5432:5432` – Exposes PostgreSQL to your host machine

---

## 3️⃣ Connect to PostgreSQL

### Option A: From Host (if psql installed)

```bash
psql -h localhost -U admin -d mydatabase
```

### Option B: Using Docker Exec

```bash
docker exec -it my-postgres psql -U admin -d mydatabase
```

### Option C: Temporary PostgreSQL Client Container

```bash
docker run -it --rm \
  --network container:my-postgres \
  postgres:16 \
  psql -h localhost -U admin -d mydatabase
```

---

## 4️⃣ Persist Data (Recommended for Production)

### Using Named Volume (Recommended)

```bash
docker volume create postgres_data


docker run -d \
  --name my-postgres \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -e POSTGRES_DB=mydatabase \
  -v postgres_data:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16
```

### Using Bind Mount

```bash
docker run -d \
  --name my-postgres \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -v /path/on/host:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16
```

---

## 5️⃣ Docker Compose Setup (Recommended for Projects)

Create a `docker-compose.yml` file:

```yaml
version: '3.9'

services:
  db:
    image: postgres:16
    container_name: my-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: mysecretpassword
      POSTGRES_DB: mydatabase
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start the service:

```bash
docker compose up -d
```

Stop the service:

```bash
docker compose down
```

---

## 6️⃣ Environment Variables (.env Support)

You can create a `.env` file:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=mydatabase
```

Then reference them inside `docker-compose.yml`:

```yaml
environment:
  POSTGRES_USER: ${POSTGRES_USER}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  POSTGRES_DB: ${POSTGRES_DB}
```

---

## 7️⃣ Initialization Scripts

To automatically run SQL scripts on first startup:

```bash
-v ./init.sql:/docker-entrypoint-initdb.d/init.sql
```

Any `.sql` or `.sh` file placed in `/docker-entrypoint-initdb.d/` will execute when the database initializes for the first time.

---

## 8️⃣ Backup & Restore

### Backup

```bash
docker exec my-postgres pg_dump -U admin mydatabase > backup.sql
```

### Restore

```bash
docker exec -i my-postgres psql -U admin mydatabase < backup.sql
```

---

## 9️⃣ Production Best Practices

- Always pin a specific PostgreSQL version
- Use Docker named volumes (not anonymous volumes)
- Store credentials in `.env` files or Docker secrets
- Restrict exposed ports in production
- Schedule automated backups
- Use strong passwords
- Monitor logs using:

```bash
docker logs -f my-postgres
```

---

## 🔟 Useful Commands

```bash
docker ps
docker stop my-postgres
docker start my-postgres
docker rm my-postgres
docker volume ls
```

---

## Official Documentation

- PostgreSQL Docker Image (Docker Hub)
- PostgreSQL Official Documentation

---
# Getting Started

## Adapters

# Prisma

## Prisma Adapter

### Resources

- Prisma documentation

---

## Setup

### Installation

```bash
bun add @prisma/client @prisma/extension-accelerate @auth/prisma-adapter
bun add prisma --dev
```

---

## Environment Variables

If you’re using Prisma Postgres, the `DATABASE_URL` will be automatically set up during initialization. For other databases, you’ll need to manually configure the `DATABASE_URL` environment variable.

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

For more information, refer to the Prisma documentation.

---

## Configuration

First, initialize Prisma in your project.

If you’re using Prisma Postgres:

```bash
npx prisma init --db --output ./src/generated/prisma
```

This will:

- Create a Prisma Postgres database
- Set up your schema file
- Configure the output directory for the generated Prisma Client

For other databases:

```bash
npx prisma init --output ./src/generated/prisma
```

Then manually configure your `DATABASE_URL` in the `.env` file.

---

## Creating a Singleton Prisma Client

To improve performance, create only one Prisma instance throughout the project and import it where needed.

### `prisma.ts`

```ts
import { PrismaClient } from '../src/generated/client';
import { withAccelerate } from '@prisma/extension-accelerate';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || new PrismaClient().$extends(withAccelerate());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

If you’re not using Prisma Postgres with Accelerate, omit the `withAccelerate()` extension and remove `.$extends(withAccelerate())`.

> Recommended: Use `@prisma/client@5.12.0` or above when using proxy (or middleware in older Next.js versions) or any edge runtime.

In Next.js 16+, `proxy.ts` runs on the Node.js runtime, so this may no longer be necessary.

---

### `auth.ts`

```ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: []
});
```

---

## Edge Compatibility

Prisma provides edge runtime support starting from version `5.12.0`. This requires specific database drivers and is only compatible with certain database types and hosting providers.

Check Prisma’s list of supported drivers before getting started.

You can also explore an example Auth.js application using NextAuth and Prisma on the edge.

For more details, refer to the general edge compatibility guide.

---

## Old Edge Workaround

Prisma is still working toward full compatibility with edge runtimes like Vercel’s.

Two options are available:

1. Use Prisma Accelerate
2. Use the JWT session strategy and split your `auth.ts` configuration into two files

Using Prisma with:

- `jwt` session strategy
- `@prisma/client@5.9.1` or above

Does not require additional modifications, as long as you do not execute database queries inside your proxy (or middleware in older Next.js versions).

Since `@prisma/client@5.9.1`, Prisma throws runtime errors at query time (not instantiation time) when used improperly in edge environments.

---

# Schema

You need at least **Prisma 2.26.0**.

Create a schema file at:

```
prisma/schema.prisma
```

Supported databases:

- PostgreSQL
- MySQL
- SQLite
- MongoDB

---

## Apply Schema

This command creates an SQL migration file and executes it:

```bash
bunx prisma migrate dev
```

Make sure `DATABASE_URL` is defined in your `.env` file at the root of your project.

---

## Generate Prisma Client

`prisma migrate dev` automatically generates the Prisma Client.

To manually generate it again:

```bash
bunx prisma generate
```

---

## Prisma Studio

Prisma Studio is a visual database browser that allows you to view and edit data in your database through a GUI.

To open Prisma Studio:

```bash
npx prisma studio
```

This will:

- Start a local web server (default: `http://localhost:5555`)
- Open your database in a visual editor
- Allow you to browse, create, update, and delete records
- Provide an intuitive interface for managing your database data

Prisma Studio is useful for:

- Inspecting your database during development
- Manually testing database changes
- Quickly viewing and editing data without writing SQL queries
- Debugging data-related issues

---

# Development Workflow

Whenever you modify your Prisma schema:

```bash
bunx prisma migrate dev
```

This will:

1. Generate a new migration file and apply it to your database
2. Regenerate the Prisma Client with updated types and model methods

---

## Reset Database

To reset your database and reapply all migrations from scratch:

```bash
npx prisma migrate reset
```

**Warning:** This command is destructive and will:

1. Drop the database (or delete all data in SQLite)
2. Create a new database with the same name
3. Apply all migrations from the `prisma/migrations` folder
4. Run seed scripts (if configured in `package.json`)

**Use cases:**

- Starting fresh during development
- Resolving migration conflicts
- Testing migrations from a clean state
- Resetting development database to initial state

**Important:** Never run this command in production! It will delete all your data.

For production environments, use `prisma migrate deploy` instead, which only applies pending migrations without resetting the database.

---

# Naming Conventions

If mixing `snake_case` and `camelCase` is problematic for your database or preference, use Prisma’s `@map()` feature to customize column names.

This does not affect Auth.js.

### Example: Snake Case + Plural Table Names

```prisma
model Account {
  id                 String  @id @default(cuid())
  userId             String  @map("user_id")
  type               String
  provider           String
  providerAccountId  String  @map("provider_account_id")
  refresh_token      String? @db.Text
  access_token       String? @db.Text
  expires_at         Int?
  token_type         String?
  scope              String?
  id_token           String? @db.Text
  session_state      String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime? @map("email_verified")
  image         String?
  accounts      Account[]
  sessions      Session[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```
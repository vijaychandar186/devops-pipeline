#!/bin/sh
set -e

echo "🔄 Running database migrations..."
bunx prisma migrate deploy

echo "✅ Migrations complete!"
echo "🚀 Starting development server..."
exec bun run dev

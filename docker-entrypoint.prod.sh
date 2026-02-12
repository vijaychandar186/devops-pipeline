#!/bin/sh
set -e

echo "🔄 Applying database migrations..."
bunx prisma migrate deploy

echo "✅ Migrations applied!"
echo "🚀 Starting production server..."
exec bun server.js

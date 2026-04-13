#!/bin/sh
set -e

echo "Pushing database schema..."
bunx prisma db push --accept-data-loss

echo "Schema push complete!"
echo "Starting development server..."
exec bun run dev

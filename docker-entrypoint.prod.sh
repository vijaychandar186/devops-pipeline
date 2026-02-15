#!/bin/sh
set -e

echo "Pushing database schema..."
bunx prisma db push

echo "Schema push complete!"
echo "Starting production server..."
exec bun server.js

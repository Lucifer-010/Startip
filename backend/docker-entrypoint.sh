#!/bin/bash
set -e

echo "=== StarTip Backend Starting ==="

# Wait for PostgreSQL database if configured
if [ -n "$POSTGRES_HOST" ]; then
  echo "Waiting for PostgreSQL at $POSTGRES_HOST:${POSTGRES_PORT:-5432}..."
  while ! nc -z "$POSTGRES_HOST" "${POSTGRES_PORT:-5432}" 2>/dev/null; do
    # Fallback to python check if nc is not present
    python -c "import socket; s = socket.socket(); s.connect(('$POSTGRES_HOST', int('${POSTGRES_PORT:-5432}'))); s.close()" 2>/dev/null && break
    echo "PostgreSQL is unavailable - sleeping 1s"
    sleep 1
  done
  echo "PostgreSQL is up and running!"
fi

# Run database migrations
echo "Applying database migrations..."
python manage.py migrate --noinput

# Collect static files for Whitenoise
echo "Collecting static assets..."
python manage.py collectstatic --noinput

# Seed demo creator and tips if requested or database is empty
if [ "${SEED_DEMO_DATA:-true}" = "true" ]; then
  echo "Checking demo data..."
  python manage.py seed_demo_data || true
fi

echo "=== Initialization Complete. Launching Server ==="
exec "$@"

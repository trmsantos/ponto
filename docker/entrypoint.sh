#!/bin/sh
set -e

echo "Aguardar DB..."
# Wait for the database to be available
until python manage.py migrate --check 2>/dev/null; do
  echo "DB não está pronta - aguardar..."
  sleep 2
done

echo "Correr migrations..."
python manage.py migrate

echo "Collect static files..."
python manage.py collectstatic --noinput

echo "Iniciar Gunicorn..."
exec gunicorn sistema.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -

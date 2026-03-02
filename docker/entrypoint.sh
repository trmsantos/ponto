#!/bin/sh
set -e

echo "==> Aguardar DB estar disponível..."
until python -c "
import os, MySQLdb
try:
    conn = MySQLdb.connect(
        host=os.environ.get('DB_HOST','db'),
        user=os.environ.get('DB_USER','rponto_user'),
        passwd=os.environ.get('DB_PASSWORD','rponto_pass'),
        db=os.environ.get('DB_NAME','rponto')
    )
    conn.close()
    print('DB OK')
except Exception as e:
    print(f'DB não disponível: {e}')
    exit(1)
" 2>/dev/null; do
    echo "DB não está pronta - aguardar 3 segundos..."
    sleep 3
done

echo "==> Correr migrations..."
python manage.py migrate

echo "==> Collect static files..."
python manage.py collectstatic --noinput

echo "==> Iniciar Gunicorn..."
exec gunicorn sistema.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -

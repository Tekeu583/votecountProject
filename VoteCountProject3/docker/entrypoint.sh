#!/bin/sh
set -e

cd /var/www/html

echo "→ Attente de PostgreSQL..."
until php -r "new PDO('pgsql:host=postgres;port=5432;dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}');" 2>/dev/null; do
    sleep 2
done
echo "✓ PostgreSQL prêt"

echo "→ Exécution des migrations..."
php artisan migrate --force

echo "→ Optimisation du cache..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

if [ ! -L /var/www/html/public/storage ]; then
    php artisan storage:link
fi

echo "✓ Backend prêt, lancement de supervisord..."
exec "$@"
# ═══════════════════════════════════════════════════════════════
# BACKEND LARAVEL — PHP 8.4-FPM + Nginx (via supervisord)
# ═══════════════════════════════════════════════════════════════
# CHANGEMENTS vs version précédente :
#   - Installation de nginx dans le conteneur
#   - PHP-FPM remplace `php artisan serve` (multi-processus, prod-ready)
#   - supervisord orchestre : nginx + php-fpm + queue + scheduler + reverb
#   - Nginx écoute sur 8000, transmet vers php-fpm 127.0.0.1:9000
# ═══════════════════════════════════════════════════════════════
FROM php:8.4-fpm

# -- Dépendances système ----------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    supervisor \
    nginx \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# -- Extensions PHP --------------------------------------------─
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        zip \
        gd \
        mbstring \
        exif \
        pcntl \
        bcmath \
        opcache

# -- phpredis (extension C, plus rapide que predis) ------------─
RUN pecl install redis && docker-php-ext-enable redis

# -- Composer --------------------------------------------------─
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# -- Config PHP prod --------------------------------------------
RUN { \
    echo "opcache.enable=1"; \
    echo "opcache.memory_consumption=256"; \
    echo "opcache.interned_strings_buffer=16"; \
    echo "opcache.max_accelerated_files=20000"; \
    echo "opcache.validate_timestamps=0"; \
    echo "opcache.jit=1255"; \
    echo "opcache.jit_buffer_size=128M"; \
    echo "upload_max_filesize=20M"; \
    echo "post_max_size=25M"; \
    echo "memory_limit=512M"; \
    echo "max_execution_time=120"; \
    } > /usr/local/etc/php/conf.d/prod.ini

# -- Config PHP-FPM pool ----------------------------------------
# On tune le pool pour de la vraie prod : dynamique, jusqu'à 20 workers.
# Adapté à un VPS 4 CPU / 8 GB RAM. Chaque worker ~40 Mo → 800 Mo max.
RUN { \
    echo "[www]"; \
    echo "user = www-data"; \
    echo "group = www-data"; \
    echo "listen = 127.0.0.1:9000"; \
    echo "listen.owner = www-data"; \
    echo "listen.group = www-data"; \
    echo "pm = dynamic"; \
    echo "pm.max_children = 20"; \
    echo "pm.start_servers = 4"; \
    echo "pm.min_spare_servers = 2"; \
    echo "pm.max_spare_servers = 6"; \
    echo "pm.max_requests = 500"; \
    echo "clear_env = no"; \
    echo "catch_workers_output = yes"; \
    echo "decorate_workers_output = no"; \
    echo "access.log = /proc/self/fd/2"; \
    } > /usr/local/etc/php-fpm.d/www.conf

# -- Copie du code ----------------------------------------------
WORKDIR /var/www/html
COPY . .

# -- Installation Composer --------------------------------------
RUN composer install \
    --no-dev \
    --no-interaction \
    --optimize-autoloader \
    --no-progress

# -- Permissions ------------------------------------------------
# www-data doit posséder storage/ et bootstrap/cache/ pour PHP-FPM
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# -- Config Nginx dans le conteneur -----------------------------
COPY docker/nginx.conf /etc/nginx/sites-available/default
RUN ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default \
    && rm -f /etc/nginx/sites-enabled/default.dpkg-dist

# -- Supervisord config ----------------------------------------─
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# -- Entrypoint ------------------------------------------------─
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Créer le dossier PID de nginx s'il n'existe pas
RUN mkdir -p /var/run/nginx && chown -R www-data:www-data /var/run/nginx

EXPOSE 8000 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
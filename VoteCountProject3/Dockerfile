# ═══════════════════════════════════════════════════════════════
# BACKEND LARAVEL — PHP 8.3 + PostgreSQL + Redis (phpredis)
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
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# -- Supervisord config ----------------------------------------─
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# -- Entrypoint ------------------------------------------------─
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 8000 8080

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
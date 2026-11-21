# syntax=docker/dockerfile:1

FROM composer:2.11.2@sha256:0c8e663f14c94d07b3c45b175c51f5a14718508f21fe4dd7e54f09488dd0ed71 AS composer

# Közös futtatókörnyezet (fejlesztés és production): PHP-bővítmények és a healthcheck, Composer nélkül.
FROM php:8.5.12-fpm-alpine3.24@sha256:951fb5b1780219b81d5daffa4cebef8e0077c537f3893d9790a5dfcd66ca334d AS runtime

ARG PHPREDIS_VERSION=6.3.0

# Javított libxml2 (CVE-2026-86144, HIGH): az alap-image még a sérülékeny 2.13.9-r2-t tartalmazza.
# Az alap-image újabb digestre cserélésekor ez a sor elhagyható.
RUN apk upgrade --no-cache libxml2

# A build-függőségek csak a fordítás idejére kellenek, a futtatókönyvtárak maradnak.
RUN apk add --no-cache icu-libs libzip fcgi \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev \
    && docker-php-ext-install -j"$(nproc)" intl pcntl pdo_mysql zip \
    && pecl install "redis-${PHPREDIS_VERSION}" \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -rf /tmp/pear

# Inline konfig: a build context a backend/, így a docker/php fájljai nem másolhatók.
RUN printf '[www]\nping.path = /ping\n' > /usr/local/etc/php-fpm.d/zz-healthcheck.conf

WORKDIR /var/www/backend

# Fejlesztői image (Compose, bind mount): runtime + Composer.
FROM runtime AS base

COPY --from=composer /usr/bin/composer /usr/bin/composer

# Production függőségek, fejlesztői csomagok nélkül.
FROM base AS build

COPY . .
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-progress

# Production image: a runtime-ra épül, így a Composer egyetlen rétegben sincs benne.
FROM runtime AS prod

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY --from=build --chown=www-data:www-data /var/www/backend /var/www/backend

USER www-data

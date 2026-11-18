# syntax=docker/dockerfile:1

FROM composer:2.11.2@sha256:0c8e663f14c94d07b3c45b175c51f5a14718508f21fe4dd7e54f09488dd0ed71 AS composer

FROM php:8.5.12-fpm-alpine3.24@sha256:951fb5b1780219b81d5daffa4cebef8e0077c537f3893d9790a5dfcd66ca334d AS base

ARG PHPREDIS_VERSION=6.3.0

# A build-függőségek csak a fordítás idejére kellenek, a futtatókönyvtárak maradnak.
RUN apk add --no-cache icu-libs libzip fcgi \
    && apk add --no-cache --virtual .build-deps $PHPIZE_DEPS icu-dev libzip-dev \
    && docker-php-ext-install -j"$(nproc)" intl pcntl pdo_mysql zip \
    && pecl install "redis-${PHPREDIS_VERSION}" \
    && docker-php-ext-enable redis \
    && apk del .build-deps \
    && rm -rf /tmp/pear

COPY --from=composer /usr/bin/composer /usr/bin/composer

# Inline konfig: a build context a backend/, így a docker/php fájljai nem másolhatók.
RUN printf '[www]\nping.path = /ping\n' > /usr/local/etc/php-fpm.d/zz-healthcheck.conf

WORKDIR /var/www/backend

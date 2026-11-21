#!/usr/bin/env bash
# Playwright E2E-futás elkülönített Compose-projektben (saját adatbázis, volume-ok és port);
# a fejlesztői stack, adatai és portjai érintetlenek. A takarítás csak ezt a projektet érinti, hiba esetén is.
# Követelmény: bash, docker compose; a repó gyökeréből vagy bárhonnan fut. A riport: e2e/playwright-report.
set -euo pipefail

cd "$(dirname "$0")/.."

# Fix név: a takarítás (down -v) sosem érintheti a fejlesztői "pagebuilder" projektet.
export COMPOSE_PROJECT_NAME=pagebuilder-e2e
dc() { docker compose --env-file e2e/e2e.env --profile e2e "$@"; }

cleanup() { dc down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

# A backend/.env és a vendor a hosttal közös; meglévő APP_KEY-t nem írunk felül.
[ -f backend/.env ] || cp backend/.env.example backend/.env
dc build backend frontend
[ -d backend/vendor ] || dc run --rm --no-deps backend composer install --no-interaction --no-progress
grep -q '^APP_KEY=.\+' backend/.env || dc run --rm --no-deps backend php artisan key:generate
# Linuxon a bind mountolt storage a hosté, a PHP-FPM (www-data) nem írhatna bele.
dc run --rm --no-deps backend chmod -R a+rwX storage bootstrap/cache
dc run --rm --no-deps frontend npm ci --no-fund --no-audit

# Az e2e szolgáltatás csak a run-nal indul (az up a felsorolt szolgáltatásokat indítja).
dc up -d --wait mysql redis backend worker frontend nginx
dc exec -T backend php artisan migrate --force
dc run --rm e2e

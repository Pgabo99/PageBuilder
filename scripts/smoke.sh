#!/usr/bin/env bash
# Telepítés utáni ellenőrzés: szolgáltatások, health, SPA és egy felhasználói út az API-n
# (regisztráció, webhely, oldal, publikálás, kiszolgálás). Bármely hiba nem nulla kilépési kódot ad.
# Követelmény: bash, curl, docker compose; a repó gyökeréből fut. Windows: Git Bash vagy WSL.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${NGINX_PORT:-$(sed -n 's/^NGINX_PORT=//p' .env 2>/dev/null | tail -n 1)}"
BASE="http://localhost:${PORT:-8080}"
RUN_ID="$(date +%s)"
JAR="$(mktemp)"
trap 'rm -f "$JAR"' EXIT

fail() { echo "HIBA: $*" >&2; exit 1; }
ok() { echo "OK   $*"; }

# 1. Szolgáltatások: mind fut és healthy.
for service in mysql redis backend worker frontend nginx; do
  health="$(docker compose ps --format '{{.Health}}' "$service")"
  [ "$health" = "healthy" ] || fail "a(z) $service nem healthy (állapot: '${health:-nem fut}')"
done
ok "mysql, redis, backend, worker, frontend, nginx healthy"

# 2. Health végpont és SPA.
curl -fsS -o /dev/null "$BASE/up" || fail "/up nem elérhető"
ok "/up"
curl -fsS "$BASE/" | grep -qi '<div id="app"' || fail "a SPA nem töltődik be a / címen"
ok "SPA (/)"

# 3. API-hívás Sanctum SPA hitelesítéssel (CSRF-süti és Referer).
api() {
  local method="$1" path="$2" body="${3:-}" token response
  token="$(awk '$6 == "XSRF-TOKEN" { print $7 }' "$JAR" | tail -n 1 | sed 's/%3D/=/g')"
  response="$(curl -sS --fail-with-body -X "$method" "$BASE$path" -b "$JAR" -c "$JAR" \
    -H 'Accept: application/json' -H 'Content-Type: application/json' \
    -H "Referer: $BASE/" -H "X-XSRF-TOKEN: $token" ${body:+-d "$body"})" || {
    echo "$method $path: $response" >&2
    return 1
  }
  printf '%s' "$response"
}
json_field() { grep -o "\"$1\":\"\?[^\",}]*" | head -n 1 | sed 's/.*://; s/"//'; }

curl -fsS -o /dev/null -c "$JAR" "$BASE/sanctum/csrf-cookie" || fail "a CSRF-süti nem kérhető le"

SLUG="smoke-$RUN_ID"
PASSWORD="Smoke-$RUN_ID-pass"

api POST /api/v1/register \
  "{\"name\":\"Smoke\",\"email\":\"$SLUG@example.com\",\"password\":\"$PASSWORD\",\"password_confirmation\":\"$PASSWORD\"}" \
  >/dev/null || fail "a regisztráció elbukott (adatbázis, session)"
ok "regisztráció és bejelentkezés"

WEBSITE_ID="$(api POST /api/v1/websites "{\"name\":\"Smoke\",\"slug\":\"$SLUG\"}" | json_field id)"
[ -n "$WEBSITE_ID" ] || fail "a webhely létrehozása elbukott"
ok "webhely létrehozva (id: $WEBSITE_ID)"

api POST "/api/v1/websites/$WEBSITE_ID/pages" \
  "{\"title\":\"Home\",\"slug\":\"index\",\"content\":[{\"id\":\"c1\",\"type\":\"heading\",\"text\":\"Smoke $RUN_ID\",\"level\":1}]}" \
  >/dev/null || fail "az oldal létrehozása elbukott"
ok "oldal létrehozva"

# 4. Publikálás: queue (Redis) és worker, majd kiszolgálás az Nginxen.
api POST "/api/v1/websites/$WEBSITE_ID/publish" >/dev/null || fail "a publikálás nem indítható"
status=""
for _ in $(seq 1 30); do
  status="$(api GET "/api/v1/websites/$WEBSITE_ID" | json_field publish_status)"
  [ "$status" = "succeeded" ] || [ "$status" = "failed" ] && break
  sleep 1
done
[ "$status" = "succeeded" ] || fail "a publikálás nem fejeződött be (állapot: '${status:-ismeretlen}'); lásd: docker compose logs worker"
ok "publikálás (worker, queue)"

curl -fsS "$BASE/sites/$SLUG/" | grep -q "Smoke $RUN_ID" || fail "a publikált oldal nem érhető el a /sites/$SLUG/ címen"
ok "publikált oldal kiszolgálva (/sites/$SLUG/)"

echo "Minden ellenőrzés sikeres."

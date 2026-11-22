#!/usr/bin/env bash
# Monitoring-ellenőrzés elkülönített Compose-projektben (pagebuilder-monitoring: e2e/e2e.env placeholderei, saját
# portok és volume-ok); a fejlesztői stack, adatai és portjai érintetlenek. A takarítás hiba esetén is lefut, és
# csak ennek a projektnek az erőforrásait törli.
# Ellenőrzi: Prometheus-célpontok, szintetikus SLI-k és az SLO-szabályok, a Grafana adatforrása és dashboardja,
# valamint hogy a rendelkezésre állási metrika reagál a backend leállítására és újraindítására.
# Követelmény: bash, curl, docker compose.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=pagebuilder-monitoring
export COMPOSE_PROJECT_NAME="$PROJECT"
export NGINX_PORT=18083 PROMETHEUS_PORT=19090 GRAFANA_PORT=13000
export DC="docker compose --env-file e2e/e2e.env --profile monitoring"
PROM="http://127.0.0.1:$PROMETHEUS_PORT"
GRAFANA="http://127.0.0.1:$GRAFANA_PORT"
GRAFANA_PASSWORD="$(sed -n 's/^GRAFANA_ADMIN_PASSWORD=//p' e2e/e2e.env)"

die() {
  echo "HIBA: $*" >&2
  echo "Diagnosztika: HTTP-kód api_health=$(q 'probe_http_status_code{probe="api_health"}' 2>/dev/null || true), spa=$(q 'probe_http_status_code{probe="spa"}' 2>/dev/null || true)" >&2
  echo "Diagnosztika (valódi forgalom, naplóvég): $($DC exec -T nginx sh -c 'tail -n 5 /var/log/nginx-timed/timed.log' 2>&1 | tr '\n' '|' | cut -c1-600)" >&2
  echo "Diagnosztika (valódi forgalmi metrika): $(curl -fsS --get "$PROM/api/v1/query" --data-urlencode 'query=pagebuilder_nginx_http_response_count_total' 2>&1 | cut -c1-500)" >&2
  echo "Diagnosztika (exporter-napló): $($DC logs --tail 5 nginxlog-exporter 2>&1 | tr '\n' '|' | cut -c1-500)" >&2
  echo "Diagnosztika (konténerek): $($DC ps --format '{{.Service}}={{.Status}}' 2>&1 | tr '\n' ' ' | cut -c1-500)" >&2
  echo "Diagnosztika: probe_success api_health=$(q 'probe_success{probe="api_health"}' 2>/dev/null || true), SLI api_health=$(q 'slo:synthetic_availability:ratio_15m{probe="api_health"}' 2>/dev/null || true), mintaszám=$(q 'count_over_time(probe_success{probe="api_health"}[15m])' 2>/dev/null || true)" >&2
  exit 1
}
step() { printf '\n== %s\n' "$*"; }
ok() { echo "OK   $*"; }

cleanup() {
  if [ "$COMPOSE_PROJECT_NAME" = "$PROJECT" ]; then $DC down -v --remove-orphans >/dev/null 2>&1 || true; fi
}
trap cleanup EXIT

# Prometheus-lekérdezés: az első eredmény értéke (üres, ha nincs eredmény).
q() {
  curl -fsS --get "$PROM/api/v1/query" --data-urlencode "query=$1" |
    { grep -o '"value":\[[0-9.e+]*,"[^"]*"\]' || true; } | head -n 1 | sed 's/.*,"\(.*\)"\]/\1/'
}
val_is() { [ "$(q "$1")" = "$2" ]; }
val_lt() { local v; v="$(q "$1")"; [ -n "$v" ] && awk -v v="$v" -v t="$2" 'BEGIN { exit !(v < t) }'; }
empty() { [ -z "$(q "$1")" ]; }
nonempty() { [ -n "$(q "$1")" ]; }

# Feltételre várás határidővel (nincs fix várakozás: a feltétel teljesülésekor azonnal továbblép).
wait_for() {
  local what="$1" deadline="$2" end
  shift 2
  end=$(($(date +%s) + deadline))
  until "$@" 2>/dev/null; do
    [ "$(date +%s)" -lt "$end" ] || die "időtúllépés: $what"
    sleep 2
  done
  ok "$what"
}

# A naplóformátum statikus összevetése: az Nginx log_format és az exporter format ugyanaz a sor.
nginx_format="$(grep -m1 '^log_format timed ' docker/nginx/default.conf | tr -d '\r' | cut -d"'" -f2)"
exporter_format="$(grep -m1 '^    format: ' docker/monitoring/nginxlog.yml | tr -d '\r' | cut -d"'" -f2)"
[ -n "$nginx_format" ] || die "nem található a log_format timed az Nginx-konfigban"
[ "$nginx_format" = "$exporter_format" ] || die "a naplóformátum eltér: nginx='$nginx_format' exporter='$exporter_format'"

step "Előkészítés: tiszta indulás a saját projekten"
echo "Naplóformátum: Nginx és exporter azonos"
$DC down -v --remove-orphans >/dev/null 2>&1 || true
# A backend/.env és a vendor a hosttal közös; meglévő APP_KEY-t nem írunk felül.
[ -f backend/.env ] || cp backend/.env.example backend/.env
$DC build backend frontend
[ -d backend/vendor ] || $DC run --rm --no-deps backend composer install --no-interaction --no-progress
grep -q '^APP_KEY=.\+' backend/.env || $DC run --rm --no-deps backend php artisan key:generate
$DC run --rm --no-deps backend chmod -R a+rwX storage bootstrap/cache
$DC run --rm --no-deps frontend npm ci --no-fund --no-audit
$DC up -d --wait mysql redis backend worker frontend nginx
# Hideg indulásnál (főleg Windowsos bind mounton) az első kérések lassúak, és a próba időtúllépésébe futnának:
# a bázisstacket bemelegítjük, és csak utána indul a monitoring (valós használatban is a futó stack mellé indul).
for path in /up /; do
  for _ in 1 2 3; do curl -fsS --max-time 30 -o /dev/null "http://127.0.0.1:$NGINX_PORT$path"; done
done
$DC up -d --wait blackbox prometheus grafana

step "Prometheus: célpontok és szintetikus SLI-k"
wait_for "minden célpont fut (5 db)" 90 val_is 'count(up == 1)' 5
wait_for "API-próba sikeres (probe_success=1)" 60 val_is 'probe_success{layer="synthetic",probe="api_health"}' 1
wait_for "SPA-próba sikeres (probe_success=1)" 60 val_is 'probe_success{layer="synthetic",probe="spa"}' 1
# Stabil állapot (rövid ablak): a próbák folyamatosan sikeresek és gyorsak.
wait_for "az API-próba folyamatosan sikeres (30 s)" 90 val_is 'avg_over_time(probe_success{layer="synthetic",probe="api_health"}[30s])' 1
# A válaszidő környezetfüggő (Windowsos bind mounton minden kérés lassú), ezért itt a mérhetőséget igazoljuk,
# az értéket pedig kiírjuk a 0,5 s-os SLO-küszöb mellett.
p95_expr='quantile_over_time(0.95, probe_duration_seconds{layer="synthetic",probe="api_health"}[30s])'
wait_for "p95 válaszidő mérhető (API, 30 s)" 60 nonempty "$p95_expr"
p95="$(q "$p95_expr")"
echo "INFO mért p95 válaszidő (API, 30 s): ${p95} s; SLO-küszöb: 0,5 s ($(awk -v v="$p95" 'BEGIN { print (v < 0.5) ? "a küszöb alatt" : "a küszöb felett: ebben a környezetben nem teljesül" }'))"
# Az SLI-szabályok kiértékelődnek (a 15 perces ablak értékét az alábbi kiesés-összehasonlítás vizsgálja).
wait_for "rendelkezésre állás SLI szabály kiértékelve" 60 nonempty 'slo:synthetic_availability:ratio_15m{probe="api_health"}'
wait_for "p95 válaszidő SLI szabály kiértékelve" 60 nonempty 'slo:synthetic_latency_p95:seconds_15m{probe="api_health"}'

step "Nincs SLO-megfelelési állítás fedetlen ablaknál"
wait_for "az ablak lefedettsége < 95%" 30 val_lt 'slo:synthetic_window_coverage:ratio_15m{probe="api_health"}' 0.95
empty 'slo:synthetic_availability_slo_met:bool_15m' || die "megfelelési állítás fedetlen ablaknál (rendelkezésre állás)"
empty 'slo:synthetic_latency_slo_met:bool_15m' || die "megfelelési állítás fedetlen ablaknál (válaszidő)"
ok "a megfelelési sorozatok nincsenek (nincs elég mérési adat a 15 perces ablakhoz)"

step "Grafana: adatforrás és dashboard"
wait_for "Grafana egészséges" 60 curl -fsS -o /dev/null "$GRAFANA/api/health"
curl -fsS -u "admin:$GRAFANA_PASSWORD" "$GRAFANA/api/datasources/uid/prometheus/health" | grep -q '"status":"OK"' ||
  die "a Grafana Prometheus-adatforrása nem egészséges"
ok "adatforrás egészséges"
curl -fsS -u "admin:$GRAFANA_PASSWORD" --get "$GRAFANA/api/search" --data-urlencode "query=PageBuilder" | grep -q 'pagebuilder-slo' ||
  die "a dashboard nincs provisionálva"
ok "dashboard provisionálva (pagebuilder-slo)"

step "Valódi forgalom (layer=real): a generált kérések megjelennek a metrikákban"
real_count() { local v; v="$(q "sum(pagebuilder_nginx_http_response_count_total{layer=\"real\",status=\"$1\"})")"; echo "${v:-0}"; }
real_total() { local v; v="$(q 'sum(pagebuilder_nginx_http_response_count_total{layer="real"})')"; echo "${v:-0}"; }
base200="$(real_count 200)"; base401="$(real_count 401)"; base404="$(real_count 404)"
echo "Kiindulás (valódi forgalom): 200=$base200 401=$base401 404=$base404"
base="http://127.0.0.1:$NGINX_PORT"
# Ismert mennyiségű, valódi HTTP-kérés az Nginx felé (a próbák nem számítanak bele: User-Agent szerint kimaradnak).
for _ in 1 2 3 4 5 6 7; do curl -fsS -o /dev/null "$base/up"; done
for _ in 1 2 3; do curl -sS -o /dev/null -H 'Accept: application/json' "$base/api/v1/user"; done
for _ in 1 2; do curl -sS -o /dev/null -H 'Accept: application/json' "$base/api/v1/nincs-ilyen-vegpont"; done
delta_is() { [ "$(( $(real_count "$1") - $2 ))" = "$3" ]; }
wait_for "7 db 200-as kérés megjelent (pontosan)" 90 delta_is 200 "$base200" 7
wait_for "3 db 401-es kérés megjelent (pontosan)" 60 delta_is 401 "$base401" 3
wait_for "2 db 404-es kérés megjelent (pontosan)" 60 delta_is 404 "$base404" 2
sleep 20
delta_is 200 "$base200" 7 || die "a 200-as számláló tovább nőtt: a blackbox próbák is belekerültek a valódi forgalomba"
ok "a szintetikus próbák nem számítanak a valódi forgalomba (a számláló 20 s múlva is pontosan 7)"
bad_lines="$($DC exec -T nginx sh -c 'grep -cvE "^[A-Z]+ [0-9]{3} [0-9.]+$" /var/log/nginx-timed/timed.log || true' | tr -d '\r')"
[ "$bad_lines" = 0 ] || die "a valódi forgalmi napló $bad_lines sora nem csak metódus, státusz és válaszidő (érzékeny adat kerülhet bele)"
ok "a napló minden sora csak metódus, státusz és válaszidő (nincs IP, útvonal vagy query string)"
mount_line="$($DC exec -T nginx sh -c 'grep " /var/log/nginx-timed " /proc/mounts' | tr -d '\r')"
case "$mount_line" in *tmpfs*size=16384k*) ok "a napló-kötet méretkorlátos (tmpfs, 16 MiB)" ;; *) die "a napló-kötet nem 16 MiB-os tmpfs: $mount_line" ;; esac
val_is 'sum(pagebuilder_nginx_parse_errors_total)' 0 || die "az exporter parse-hibát jelzett: a naplóformátum nem illeszkedik"
ok "nincs parse-hiba (a naplóformátum illeszkedik)"
empty 'pagebuilder_nginx_http_response_count_total{layer!="real"}' || die "a valódi forgalmi metrika nem layer=real"
empty 'probe_success{layer!="synthetic"}' || die "a szintetikus metrika nem layer=synthetic"
ok "a két réteg elkülönül (layer=real / layer=synthetic)"
wait_for "a valódi forgalmi kérés/s szabály kiértékelve" 60 nonempty 'real:http_requests:rate5m'
wait_for "a valódi 5xx-mentes arány szabály kiértékelve" 60 nonempty 'real:http_success_ratio:ratio_5m'
wait_for "a valódi p95 válaszidő szabály kiértékelve" 60 nonempty 'real:http_latency_p95:seconds_5m'

step "Hiba: a backend leállítása, majd újraindítása"
sli_before="$(q 'slo:synthetic_availability:ratio_15m{probe="api_health"}')"
[ -n "$sli_before" ] || die "nincs kiindulási SLI-érték"
echo "Kiindulási rendelkezésre állás SLI (15 perces ablak): $sli_before"
$DC stop backend
wait_for "az API-próba leesik (probe_success=0)" 60 val_is 'probe_success{layer="synthetic",probe="api_health"}' 0
val_is 'probe_success{layer="synthetic",probe="spa"}' 1 || die "az SPA-próba is leesett (a hiba nem az API-ra korlátozódik)"
ok "az SPA-próba közben sikeres: a metrika a hibás útvonalat jelzi"
wait_for "a rendelkezésre állás SLI csökken a kiindulási érték alá" 60 val_lt 'slo:synthetic_availability:ratio_15m{probe="api_health"}' "$sli_before"

$DC up -d --wait backend
# Az Nginx az induláskor oldja fel a backend címét; az újraindított backend új IP-t kaphat (különben 502).
$DC restart nginx
$DC up -d --wait nginx
wait_for "az API-próba helyreáll (probe_success=1)" 90 val_is 'probe_success{layer="synthetic",probe="api_health"}' 1
val_lt 'slo:synthetic_availability:ratio_15m{probe="api_health"}' "$sli_before" || die "a rendelkezésre állás SLI nem őrzi meg a kiesést az ablakban"
ok "az SLI a helyreállás után is tükrözi a kiesést az ablakban"

echo
echo "Minden ellenőrzés sikeres."

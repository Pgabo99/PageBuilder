#!/usr/bin/env bash
# Katasztrófa-gyakorlat: adatvesztés, élő visszaállítás és mért RPO/RTO, KIZÁRÓLAG az elkülönített
# "pagebuilder-recovery" projekten és mesterséges adattal (e2e/e2e.env placeholderei, saját port és volume-ok).
# A fejlesztői stack és adatai érintetlenek: minden destruktív lépés előtt ellenőrzi a projekt, az adatbázis és
# az adatok azonosságát. A takarítás hiba esetén is lefut, és csak ennek a projektnek az erőforrásait törli.
# Követelmény: bash, curl, docker compose; a repó gyökeréből vagy bárhonnan fut.
set -euo pipefail

cd "$(dirname "$0")/.."

PROJECT=pagebuilder-recovery
EXPECTED_DB=pagebuilder_e2e
export COMPOSE_PROJECT_NAME="$PROJECT"
export NGINX_PORT=18082
export DC="docker compose --env-file e2e/e2e.env"
work="$(mktemp -d)"
export BACKUP_DIR="$work/backups"

die() { echo "HIBA: $*" >&2; exit 1; }
step() { printf '\n== %s\n' "$*"; }
now() { date +%s; }
mysql_root() { $DC exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot "$@"' _ "$@"; }
rows_of() { awk -F'\t' -v t="$2" '$1 == t { print $2 }' "$1"; }

# Destruktív lépés előtt: csak a gyakorlat saját projektje, adatbázisa és mesterséges adata érintett.
assert_identity() {
  local check_data="${1:-yes}" cid label db others
  [ "$COMPOSE_PROJECT_NAME" = "$PROJECT" ] || die "a Compose-projekt neve nem $PROJECT"
  cid="$($DC ps -q mysql)"
  [ -n "$cid" ] || die "a mysql konténer nem található a $PROJECT projektben"
  label="$(docker inspect -f '{{index .Config.Labels "com.docker.compose.project"}}' "$cid")"
  [ "$label" = "$PROJECT" ] || die "a mysql konténer nem a $PROJECT projekté (címke: $label)"
  db="$($DC exec -T mysql sh -c 'printf %s "$MYSQL_DATABASE"')"
  [ "$db" = "$EXPECTED_DB" ] || die "az adatbázis neve nem $EXPECTED_DB (hanem: $db)"
  if [ "$check_data" = yes ]; then
    others="$(mysql_root -N -B -e "SELECT COUNT(*) FROM \`$db\`.users WHERE email NOT LIKE 'smoke-%@example.com'" | tr -d '\r')"
    [ "$others" = 0 ] || die "az adatbázisban nem mesterséges felhasználó is van"
  fi
  echo "Azonosság rendben: projekt $PROJECT, adatbázis $db$([ "$check_data" = yes ] && echo ', csak mesterséges adat')"
}

cleanup() {
  if [ "$COMPOSE_PROJECT_NAME" = "$PROJECT" ]; then $DC down -v --remove-orphans >/dev/null 2>&1 || true; fi
  rm -rf "$work"
}
trap cleanup EXIT

step "Előkészítés: tiszta indulás a saját projekten"
$DC down -v --remove-orphans >/dev/null 2>&1 || true
# A backend/.env és a vendor a hosttal közös; meglévő APP_KEY-t nem írunk felül.
[ -f backend/.env ] || cp backend/.env.example backend/.env
$DC build backend frontend
[ -d backend/vendor ] || $DC run --rm --no-deps backend composer install --no-interaction --no-progress
grep -q '^APP_KEY=.\+' backend/.env || $DC run --rm --no-deps backend php artisan key:generate
$DC run --rm --no-deps backend chmod -R a+rwX storage bootstrap/cache
$DC run --rm --no-deps frontend npm ci --no-fund --no-audit
$DC up -d --wait mysql redis backend worker frontend nginx
$DC exec -T backend php artisan migrate --force

step "Mesterséges adat az alkalmazás felhasználói útján (smoke teszt)"
bash scripts/smoke.sh
bash scripts/restore.sh --manifest >"$work/before.manifest"

step "Mentés"
t_backup_start="$(now)"
backup="$(bash scripts/backup.sh)"
t_backup_done="$(now)"

step "A mentés után keletkező adat (ez elvész a katasztrófában)"
sleep 1 # különböző másodpercben induljon a második felhasználó
bash scripts/smoke.sh
bash scripts/restore.sh --manifest >"$work/pre-disaster.manifest"

step "Katasztrófa: az élő adatbázis eldobása"
assert_identity yes
t_disaster="$(now)"
mysql_root -e "DROP DATABASE \`$EXPECTED_DB\`"
exists="$(mysql_root -N -B -e "SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='$EXPECTED_DB'" | tr -d '\r')"
[ "$exists" = 0 ] || die "az adatvesztés nem történt meg"
if bash scripts/smoke.sh >/dev/null 2>&1; then die "az alkalmazás az adatvesztés után is működik (váratlan)"; fi
echo "Az adatvesztés megtörtént: az adatbázis nincs meg, az alkalmazás nem működik."

step "Visszaállítás az élő adatbázisra (csak a gyakorlat projektjén)"
$DC stop backend worker
assert_identity no
t_restore_start="$(now)"
CONFIRM_RESTORE_LIVE=yes bash scripts/restore.sh "$backup" --live --expect "$work/before.manifest"
t_restore_done="$(now)"
$DC up -d --wait backend worker
# Az Nginx az induláskor oldja fel a backend címét; az újraindított backend új IP-t kaphat (különben 502).
$DC restart nginx
$DC up -d --wait nginx

step "Alkalmazásszintű ellenőrzés a visszaállítás után"
bash scripts/smoke.sh
t_recovered="$(now)"

users_before="$(rows_of "$work/before.manifest" users)"
users_pre="$(rows_of "$work/pre-disaster.manifest" users)"
[ "$users_pre" -gt "$users_before" ] || die "a forgatókönyv érvénytelen: nincs mentés utáni adat"

rpo=$((t_disaster - t_backup_start))
rto=$((t_recovered - t_disaster))
backup_bytes="$(wc -c <"$backup" | tr -d ' ')"
summary="$(cat <<EOF
### Katasztrófa-gyakorlat eredménye (pagebuilder-recovery, mesterséges adat)

| Mérés | Érték |
|---|---|
| RPO (a mentés kezdete és az adatvesztés között) | ${rpo} s |
| RTO (az adatvesztéstől az alkalmazás smoke-tesztjének sikeréig) | ${rto} s |
| ebből a visszaállítás és a manifeszt-ellenőrzés | $((t_restore_done - t_restore_start)) s |
| mentés időtartama | $((t_backup_done - t_backup_start)) s |
| mentés mérete | ${backup_bytes} bájt |
| elveszett felhasználó (a mentés után keletkezett) | $((users_pre - users_before)) (${users_pre} → ${users_before}) |
| adatintegritás | a visszaállított táblák sorszáma és checksumja egyezik a mentéskori manifesztel |
EOF
)"
echo
echo "$summary"
[ -z "${GITHUB_STEP_SUMMARY:-}" ] || echo "$summary" >>"$GITHUB_STEP_SUMMARY"
echo
echo "A gyakorlat sikeres."

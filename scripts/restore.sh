#!/usr/bin/env bash
# MySQL-visszaállítás a backup.sh mentéséből.
#
# Használat:
#   scripts/restore.sh <mentés.sql.gz> [--expect <manifeszt>]   külön <adatbázis>_restore adatbázisba tölt
#   scripts/restore.sh <mentés.sql.gz> --live                   az élő adatbázist dobja el és tölti újra
#   scripts/restore.sh --manifest [adatbázis]                   táblánkénti sorszám és checksum (alap: az élő adatbázis)
#
# Az élő visszaállítás destruktív: csak --live és CONFIRM_RESTORE_LIVE=yes együtt engedélyezett; előtte érdemes
# leállítani a backend és worker szolgáltatást. A manifeszt (tábla, sorszám, CHECKSUM TABLE) az ellenőrzés alapja:
# --expect esetén eltérésnél a szkript hibával áll le; --expect nélkül, külön adatbázisnál az élő adatbázissal
# összeveti és jelzi az eltérést (a mentés óta történt írás miatt az normális). Környezet: DC (alap: docker compose).
set -euo pipefail

cd "$(dirname "$0")/.."

DC="${DC:-docker compose}"

die() { echo "HIBA: $*" >&2; exit 2; }
usage() { die "Használat: scripts/restore.sh <mentés.sql.gz> [--live] [--expect <manifeszt>] | --manifest [adatbázis]"; }
sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$@"; else shasum -a 256 "$@"; fi; }

# mysql root-ként a konténerben; a jelszó a konténer környezetéből jön, nem a parancssorból.
mysql_root() { $DC exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot "$@"' _ "$@"; }
valid_name() { [[ "$1" =~ ^[A-Za-z0-9_]+$ ]] || die "Érvénytelen adatbázisnév: $1"; }

# Táblánként: név, sorszám, CHECKSUM TABLE (rendezve).
manifest() {
  local db="$1" tables t rows sum
  valid_name "$db"
  tables="$(mysql_root -N -B -e "SELECT table_name FROM information_schema.tables WHERE table_schema='$db' AND table_type='BASE TABLE' ORDER BY table_name" | tr -d '\r')"
  for t in $tables; do
    rows="$(mysql_root -N -B -e "SELECT COUNT(*) FROM \`$db\`.\`$t\`" | tr -d '\r')"
    sum="$(mysql_root -N -B -e "CHECKSUM TABLE \`$db\`.\`$t\`" | tr -d '\r' | cut -f2)"
    printf '%s\t%s\t%s\n' "$t" "$rows" "$sum"
  done
}

dump=""
live=no
expect=""
mode=restore
manifest_db=""

[ $# -gt 0 ] || usage
if [ "$1" = "--manifest" ]; then
  mode=manifest
  manifest_db="${2:-}"
else
  while [ $# -gt 0 ]; do
    case "$1" in
      --live) live=yes ;;
      --expect)
        shift
        expect="${1:-}"
        ;;
      -*) die "Ismeretlen kapcsoló: $1" ;;
      *) dump="$1" ;;
    esac
    shift
  done
fi

if [ "$mode" = "manifest" ]; then
  [ -n "$manifest_db" ] || manifest_db="$($DC exec -T mysql sh -c 'printf %s "$MYSQL_DATABASE"')"
  manifest "$manifest_db"
  exit 0
fi

# Védelmek: minden ellenőrzés az adatbázis bármilyen érintése előtt fut.
[ -n "$dump" ] || usage
[ -f "$dump" ] || die "Nincs ilyen mentés: $dump"
[ -f "$dump.sha256" ] || die "Hiányzik a checksum-fájl: $dump.sha256"
(cd "$(dirname "$dump")" && sha256 -c "$(basename "$dump").sha256" >/dev/null 2>&1) || die "Checksum-eltérés: a mentés sérült vagy módosult."
[ -z "$expect" ] || [ -f "$expect" ] || die "Nincs ilyen manifeszt: $expect"
if [ "$live" = yes ] && [ "${CONFIRM_RESTORE_LIVE:-}" != "yes" ]; then
  die "Az élő visszaállítás destruktív: állítsd be a CONFIRM_RESTORE_LIVE=yes változót."
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

db="$($DC exec -T mysql sh -c 'printf %s "$MYSQL_DATABASE"')"
valid_name "$db"
if [ "$live" = yes ]; then target="$db"; else target="${db}_restore"; fi

start="$(date +%s)"
[ "$live" = yes ] && echo "FIGYELEM: az élő adatbázis ($db) eldobása és újratöltése." >&2

mysql_root -e "DROP DATABASE IF EXISTS \`$target\`; CREATE DATABASE \`$target\`"
gzip -dc "$dump" | mysql_root "$target"
manifest "$target" >"$work/restored.manifest"

tables="$(wc -l <"$work/restored.manifest" | tr -d ' ')"
echo "Visszaállítva: $target ($tables tábla)" >&2

status=0
if [ -n "$expect" ]; then
  if diff <(tr -d '\r' <"$expect") "$work/restored.manifest" >"$work/diff.txt"; then
    echo "ELLENŐRZÉS: a visszaállított adatbázis egyezik a manifesztel." >&2
  else
    echo "ELTÉRÉS a manifesztől (tábla, sorszám, checksum):" >&2
    cat "$work/diff.txt" >&2
    status=1
  fi
elif [ "$live" = no ]; then
  manifest "$db" >"$work/live.manifest"
  if diff "$work/live.manifest" "$work/restored.manifest" >"$work/diff.txt"; then
    echo "ELLENŐRZÉS: egyezik az élő adatbázissal." >&2
  else
    echo "Eltér az élő adatbázistól (a mentés óta történt írás esetén ez várt):" >&2
    cat "$work/diff.txt" >&2
  fi
fi

echo "Visszaállítás ideje: $(($(date +%s) - start)) s" >&2
exit "$status"

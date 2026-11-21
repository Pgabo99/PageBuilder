#!/usr/bin/env bash
# MySQL-mentés a futó Compose-stackről: backups/<adatbázis>-<UTC idő>.sql.gz és .sha256. Csak olvas.
# A jelszó a konténer környezetéből jön (MYSQL_PWD), így nem kerül a parancssorba és a folyamatlistába.
# Az alkalmazás felhasználójával fut (legkisebb jogosultság). Kimenet (stdout): a mentés útvonala.
# Környezet: BACKUP_DIR (alap: backups), DC (alap: docker compose; pl. --env-file megadásához).
# A mentés valódi felhasználói adatot (e-mail, jelszó-hash) tartalmazhat: a backups/ nincs verziókezelésben.
set -euo pipefail

cd "$(dirname "$0")/.."

DC="${DC:-docker compose}"
dir="${BACKUP_DIR:-backups}"

sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$@"; else shasum -a 256 "$@"; fi; }

umask 077
mkdir -p "$dir"

db="$($DC exec -T mysql sh -c 'printf %s "$MYSQL_DATABASE"')"
file="$dir/$db-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
trap 'rm -f "$file.partial"' EXIT

# --single-transaction: konzisztens pillanatkép zárolás nélkül (InnoDB).
# --set-gtid-purged=OFF: a MySQL 9 image-ben a GTID alapból be van kapcsolva, és az AUTO érték FLUSH TABLES-t kérne
# (RELOAD jog kellene az app-felhasználónak); egy önálló adatbázis visszaállításához a GTID-utasítások sem kellenek.
# A maszkolási szabályokról szóló figyelmeztetés (nincs SELECT jog a mysql sémára; a projekt nem használ ilyet)
# ártalmatlan, csak azt a sort szűrjük, minden más hiba látszik.
$DC exec -T mysql sh -c 'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --set-gtid-purged=OFF --routines --triggers --no-tablespaces -u"$MYSQL_USER" "$MYSQL_DATABASE"' \
  2> >(grep -v 'column_masking_policy' >&2) |
  gzip >"$file.partial"

# Ép tömörítés és teljes dump: a mysqldump a végén kiírja a "Dump completed" sort.
gzip -t "$file.partial"
gzip -dc "$file.partial" | tail -n 1 | grep -q 'Dump completed' || {
  echo "HIBA: a mentés csonka (nincs 'Dump completed' sor)." >&2
  exit 1
}

mv "$file.partial" "$file"
(cd "$dir" && sha256 "$(basename "$file")" >"$(basename "$file").sha256")

echo "Mentés kész: $file" >&2
echo "$file"

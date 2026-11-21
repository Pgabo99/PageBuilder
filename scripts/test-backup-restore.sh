#!/usr/bin/env bash
# A backup.sh és a restore.sh védelmeinek offline tesztje. A DC egy kamu parancs, amely naplózza a hívását:
# ha egy védelem tilt, a szkript nem érintheti az adatbázist, tehát a napló üres marad.
set -uo pipefail

cd "$(dirname "$0")/.."
RESTORE="$PWD/scripts/restore.sh"

failures=0
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

ok() { echo "OK   $1"; }
bad() { echo "HIBA $1" >&2; failures=$((failures + 1)); }

printf '#!/bin/sh\necho "$@" >> "%s/dc.log"\nexit 1\n' "$work" >"$work/fake-dc"
chmod +x "$work/fake-dc"
export DC="$work/fake-dc"

# Egy ép és egy sérült mentés (mesterséges tartalom).
printf 'mesterseges\n' | gzip >"$work/jo.sql.gz"
(cd "$work" && { sha256sum jo.sql.gz 2>/dev/null || shasum -a 256 jo.sql.gz; } >jo.sql.gz.sha256)
cp "$work/jo.sql.gz" "$work/serult.sql.gz"
printf '0000000000000000000000000000000000000000000000000000000000000000  serult.sql.gz\n' >"$work/serult.sql.gz.sha256"
printf 'mesterseges\n' | gzip >"$work/nincs-ellenorzo.sql.gz"

# guard <név> <várt kilépési kód> <a kimenetben szereplő szöveg> <argumentumok...>
guard() {
  local name="$1" expected="$2" text="$3"
  shift 3
  : >"$work/dc.log"
  out="$(env "${ENVS[@]}" bash "$RESTORE" "$@" 2>&1)"
  code=$?
  [ "$code" = "$expected" ] && ok "$name: kilépési kód $expected" || bad "$name: kilépési kód $code (várt: $expected)"
  grep -qF -- "$text" <<<"$out" && ok "$name: üzenet: $text" || bad "$name: hiányzó üzenet: $text (kimenet: $out)"
  [ ! -s "$work/dc.log" ] && ok "$name: az adatbázis nem érintett" || bad "$name: a szkript hívta a DC-t: $(cat "$work/dc.log")"
}

ENVS=(X=1)
guard "nincs argumentum" 2 "Használat"
guard "hiányzó mentésfájl" 2 "Nincs ilyen mentés" "$work/nincs.sql.gz"
guard "hiányzó checksum-fájl" 2 "Hiányzik a checksum-fájl" "$work/nincs-ellenorzo.sql.gz"
guard "hibás checksum" 2 "Checksum-eltérés" "$work/serult.sql.gz"
guard "ismeretlen kapcsoló" 2 "Ismeretlen kapcsoló" "$work/jo.sql.gz" --torol-mindent
guard "élő visszaállítás megerősítés nélkül" 2 "CONFIRM_RESTORE_LIVE=yes" "$work/jo.sql.gz" --live
ENVS=(CONFIRM_RESTORE_LIVE=no)
guard "élő visszaállítás hibás megerősítéssel" 2 "CONFIRM_RESTORE_LIVE=yes" "$work/jo.sql.gz" --live
ENVS=(X=1)
guard "hiányzó manifeszt" 2 "Nincs ilyen manifeszt" "$work/jo.sql.gz" --expect "$work/nincs.manifest"

[ "$failures" = 0 ] && echo "Minden teszt sikeres." || { echo "$failures teszt hibás." >&2; exit 1; }

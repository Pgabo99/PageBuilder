#!/usr/bin/env bash
# A set-image-tag.sh tesztje: a manifestek másolatán fut, a repó fájljait nem módosítja.
set -uo pipefail

cd "$(dirname "$0")/.."

SCRIPT="bash scripts/set-image-tag.sh"
OLD=004f1bb5c20420c331aea432df06c8c00df5dae5
NEW=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
failures=0

check() {
  local name="$1"
  shift
  if "$@"; then echo "OK   $name"; else echo "HIBA $name" >&2; failures=$((failures + 1)); fi
}

fresh_copy() {
  work="$(mktemp -d)"
  cp -r deploy/app "$work/app"
}

count() { grep -rhoE "$1" "$work/app" | wc -l | tr -d ' '; }

fresh_copy
trap 'rm -rf "$work"' EXIT

# 1. A saját image-ek mindegyik előfordulása cserélődik (backend ×3, nginx ×1).
$SCRIPT "$NEW" "$work/app" >/dev/null
check "a saját image-ek az új SHA-ra mutatnak" test "$(count "pagebuilder-(backend|nginx):$NEW")" = 4
check "nem marad régi SHA" test "$(count "pagebuilder-(backend|nginx):$OLD")" = 0

# 2. A külső image-ek (mysql, redis) és minden más sor változatlan.
check "a mysql és redis image változatlan" test "$(count '(mysql:9|redis:8)[^ ]*@sha256:[0-9a-f]{64}')" = 2
check "csak a címke-sorok változtak" test "$(diff -r deploy/app "$work/app" | grep -c '^[<>]')" = 8

# 3. Idempotens: ugyanarra a SHA-ra újrafuttatva nincs további változás.
cp -r "$work/app" "$work/once"
$SCRIPT "$NEW" "$work/app" >/dev/null
check "ismételt futtatás nem módosít" diff -r "$work/once" "$work/app" >/dev/null

# 4. Érvénytelen SHA: 2-es kilépési kód, a fájlok érintetlenek.
fresh_copy_dir="$work/invalid"
cp -r deploy/app "$fresh_copy_dir"
for bad in "" "abc" "${NEW:0:39}" "${NEW}0" "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" "main"; do
  $SCRIPT "$bad" "$fresh_copy_dir" >/dev/null 2>&1
  check "érvénytelen SHA elutasítva: '${bad:0:12}'" test "$?" = 2
done
check "érvénytelen SHA után a fájlok érintetlenek" diff -r deploy/app "$fresh_copy_dir" >/dev/null

# 5. Ha nincs mit cserélni (hiányzó könyvtár vagy nincs saját image), hibával áll le.
$SCRIPT "$NEW" "$work/nincs-ilyen" >/dev/null 2>&1
check "hiányzó könyvtár hiba" test "$?" != 0
mkdir "$work/ures" && printf 'image: mysql:9\n' >"$work/ures/x.yaml"
$SCRIPT "$NEW" "$work/ures" >/dev/null 2>&1
check "saját image nélkül hiba" test "$?" != 0

[ "$failures" = 0 ] && echo "Minden teszt sikeres." || { echo "$failures teszt hibás." >&2; exit 1; }

#!/usr/bin/env bash
# A manifestekben a saját image-ek (pagebuilder-backend, pagebuilder-nginx) címkéjét a megadott commit SHA-ra cseréli.
# Használat: scripts/set-image-tag.sh <40 karakteres commit SHA> [manifest-könyvtár, alap: deploy/app]
set -euo pipefail

sha="${1:-}"
dir="${2:-deploy/app}"
# A címke a CI-ban a teljes commit SHA; más érték nem kerülhet a manifestbe.
pattern='(ghcr\.io/[a-z0-9-]+/pagebuilder-(backend|nginx)):[0-9a-f]{40}'

if ! [[ "$sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Érvénytelen commit SHA: '$sha' (40 kisbetűs hexadecimális karakter kell)." >&2
  exit 2
fi

[ -d "$dir" ] || { echo "Nincs ilyen könyvtár: $dir" >&2; exit 1; }

files="$(grep -rlE "$pattern" "$dir" || true)"
[ -n "$files" ] || { echo "A(z) $dir könyvtárban nincs saját image-hivatkozás." >&2; exit 1; }

# -i.bak: a GNU és a BSD sed (macOS) közös formája.
while IFS= read -r file; do
  sed -E -i.bak "s#$pattern#\\1:$sha#g" "$file"
  rm -f "$file.bak"
done <<<"$files"

echo "Image-címke: $sha"

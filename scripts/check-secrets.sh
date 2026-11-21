#!/usr/bin/env bash
# Secret-ellenőrzés a nyomon követett fájlokra és a teljes Git-előzményre.
# Használat: scripts/check-secrets.sh [repó-könyvtár, alap: .]
#
# Találatnál csak a típus és a hely (fájl, commit, kulcsnév) jelenik meg, az érték soha. A szkript csak olvas:
# nem ír át előzményt, nem rotál secretet. Kilépési kód: 0 = nincs találat, 1 = van találat.
#
# Hatókör és korlát: ismert fájlnevekre és néhány nagy megbízhatóságú tartalmi mintára keres, ezért nem
# állítja, hogy minden lehetséges secretet felismer (pl. tetszőleges jelszó vagy egyedi formátum kimarad).
# A fájlszintű értékvizsgálatot a CI Trivy fs `secret` szkennere egészíti ki.
set -uo pipefail

repo="${1:-.}"
git -C "$repo" rev-parse --git-dir >/dev/null 2>&1 || { echo "Nem git-repó: $repo" >&2; exit 2; }

findings=0
report() { echo "$1"; findings=$((findings + 1)); }
g() { git -C "$repo" "$@"; }

# Tiltott fájlnevek (a .env.example és a *.tfvars.example megengedett).
forbidden_path() {
  local p="${1##*/}"
  case "$p" in
    .env.example | *.tfvars.example) return 1 ;;
    .env | .env.* | *.pem | *.key | *.p12 | *.pfx | *.tfstate | *.tfstate.backup | *.tfvars | id_rsa | id_ed25519) return 0 ;;
  esac
  return 1
}

# 1. Nyomon követett tiltott fájlok.
while IFS= read -r path; do
  [ -n "$path" ] || continue
  forbidden_path "$path" && report "NYOMON-KÖVETETT-FÁJL  $path"
done < <(g ls-files)

# 2. Az .env-példák jelszó jellegű értékei: üres, null vagy ismert placeholder lehet.
placeholder='^(change-me|e2e-placeholder)(-[a-z]+)*$'
secret_key='(PASSWORD|SECRET|TOKEN|APP_KEY|API_KEY|PRIVATE)'
while IFS= read -r path; do
  [ -n "$path" ] || continue
  case "${path##*/}" in
    .env.example | *.env) ;;
    *) continue ;;
  esac
  line_no=0
  while IFS= read -r line || [ -n "$line" ]; do
    line_no=$((line_no + 1))
    line="${line%$'\r'}" # Windowsos sorvég (CRLF) esetén is illeszkedik a placeholder
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ "$line" == *=* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    [[ "$key" =~ $secret_key ]] || continue
    value="${value%\"}"
    value="${value#\"}"
    [ -z "$value" ] || [ "$value" = "null" ] || [[ "$value" =~ $placeholder ]] && continue
    report "NEM-PLACEHOLDER  $path:$line_no ($key)"
  done < <(g show ":$path" 2>/dev/null || cat "$repo/$path")
done < <(g ls-files)

# 3. Előzmények: valaha commitolt tiltott fájlnevek (minden ágon).
while IFS= read -r path; do
  [ -n "$path" ] || continue
  forbidden_path "$path" || continue
  commit="$(g log --all --format=%h -n 1 -- "$path")"
  report "ELŐZMÉNY-FÁJLNÉV  $path (commit $commit)"
done < <(g log --all --name-only --format= | sort -u)

# 4. Előzmények: tartalmi minták. A `git grep -l` csak a fájlnevet adja, a találat szövegét nem.
revs="$(g rev-list --all)"
if [ -n "$revs" ]; then
  # shellcheck disable=SC2086
  scan() {
    local type="$1" pattern="$2" hit rev path
    declare -A seen=()
    while IFS= read -r hit; do
      rev="${hit%%:*}"
      path="${hit#*:}"
      [ -n "${seen[$path]:-}" ] && continue
      seen[$path]=1
      report "ELŐZMÉNY-TARTALOM  $type  $path (commit ${rev:0:7})"
    done < <(g grep -l -I -E -e "$pattern" $revs 2>/dev/null)
  }

  scan PRIVATE-KEY '-----BEGIN [A-Z ]*PRIVATE KEY-----'
  scan GITHUB-TOKEN 'gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,}'
  scan AWS-ACCESS-KEY 'AKIA[0-9A-Z]{16}'
  scan AZURE-STORAGE-KEY 'AccountKey=[A-Za-z0-9+/=]{20,}'
  scan SLACK-TOKEN 'xox[baprs]-[A-Za-z0-9-]{10,}'
fi

if [ "$findings" -gt 0 ]; then
  echo "$findings találat. Az értékek nem jelennek meg; az előzmény átírása és a secret rotálása kézi döntés." >&2
  exit 1
fi
echo "Nincs találat (nyomon követett fájlok, .env-példák és Git-előzmények, az ismert mintákra)."

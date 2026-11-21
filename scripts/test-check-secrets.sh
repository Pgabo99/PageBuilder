#!/usr/bin/env bash
# A check-secrets.sh tesztje: ideiglenes git-repókon, kizárólag mesterséges értékekkel.
# Az értékek futásidőben épülnek fel, így ez a fájl maga sem tartalmaz titokra illeszkedő szöveget.
set -uo pipefail

cd "$(dirname "$0")/.."
CHECK="$PWD/scripts/check-secrets.sh"

failures=0
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

ok() { echo "OK   $1"; }
bad() { echo "HIBA $1" >&2; failures=$((failures + 1)); }

# Mesterséges "titkok" – nem valódiak, csak a minták felismerését igazolják.
FAKE_PASSWORD="Zx9-nem-placeholder-$$"
FAKE_KEY_BODY="MESTERSEGES-KULCS-TARTALOM-$$"
FAKE_GH_TOKEN="gh""p_$(printf 'A%.0s' $(seq 1 36))"
FAKE_AWS="AK""IA$(printf 'B%.0s' $(seq 1 16))"
FAKE_AZURE="Account""Key=$(printf 'C%.0s' $(seq 1 30))"
FAKE_SLACK="xo""xb-1234567890-mesterseges"
KEY_HEADER="-----BEGIN ""PRIVATE KEY-----"

new_repo() {
  repo="$(mktemp -d -p "$work")"
  git -C "$repo" init -q
  git -C "$repo" config user.email "teszt@example.com"
  git -C "$repo" config user.name "Teszt"
  git -C "$repo" config commit.gpgsign false
}

commit_all() { git -C "$repo" add -A && git -C "$repo" commit -q -m "$1"; }

# run <név> <várt kilépési kód> [értékek, amelyek nem jelenhetnek meg a kimenetben...]
run() {
  local name="$1" expected="$2"
  shift 2
  out="$(bash "$CHECK" "$repo" 2>&1)"
  code=$?
  [ "$code" = "$expected" ] && ok "$name: kilépési kód $expected" || bad "$name: kilépési kód $code (várt: $expected)"
  for secret in "$@"; do
    if grep -qF -- "$secret" <<<"$out"; then bad "$name: az érték megjelent a kimenetben"; else ok "$name: az érték nem jelenik meg"; fi
  done
}

expect_in_output() {
  grep -qF -- "$2" <<<"$out" && ok "$1: kimenet tartalmazza: $2" || bad "$1: a kimenet nem tartalmazza: $2"
}

# 1. Tiszta repó, megengedett placeholderekkel.
new_repo
printf 'MYSQL_PASSWORD=change-me\nMYSQL_ROOT_PASSWORD=change-me-root\nAPP_KEY=\nNGINX_PORT=8080\n' >"$repo/.env.example"
printf 'MYSQL_PASSWORD=e2e-placeholder\n' >"$repo/e2e.env"
echo 'kod' >"$repo/app.txt"
commit_all "tiszta"
run "tiszta repó" 0

# 2. Nyomon követett .env.
new_repo
printf 'MYSQL_PASSWORD=%s\n' "$FAKE_PASSWORD" >"$repo/.env"
commit_all "env"
run "nyomon követett .env" 1 "$FAKE_PASSWORD"
expect_in_output "nyomon követett .env" ".env"

# 3. Nem placeholder érték az .env.example-ben.
new_repo
printf 'MYSQL_PASSWORD=%s\n' "$FAKE_PASSWORD" >"$repo/.env.example"
commit_all "pelda"
run "nem placeholder jelszó" 1 "$FAKE_PASSWORD"
expect_in_output "nem placeholder jelszó" "MYSQL_PASSWORD"

# 4. Privát kulcs a history-ban, azóta törölve.
new_repo
printf '%s\n%s\n' "$KEY_HEADER" "$FAKE_KEY_BODY" >"$repo/kulcs.txt"
commit_all "kulcs"
git -C "$repo" rm -q kulcs.txt && git -C "$repo" commit -q -m "kulcs torlese"
run "törölt privát kulcs a history-ban" 1 "$FAKE_KEY_BODY"
expect_in_output "törölt privát kulcs" "PRIVATE-KEY"
expect_in_output "törölt privát kulcs" "kulcs.txt"

# 5. Tokenminták a history-ban (GitHub, AWS, Azure, Slack).
for pair in "GITHUB-TOKEN:$FAKE_GH_TOKEN" "AWS-ACCESS-KEY:$FAKE_AWS" "AZURE-STORAGE-KEY:$FAKE_AZURE" "SLACK-TOKEN:$FAKE_SLACK"; do
  type="${pair%%:*}"
  value="${pair#*:}"
  new_repo
  printf 'x=%s\n' "$value" >"$repo/config.txt"
  commit_all "token"
  git -C "$repo" rm -q config.txt && git -C "$repo" commit -q -m "token torlese"
  run "$type a history-ban" 1 "$value"
  expect_in_output "$type" "$type"
done

# 6. Korábban commitolt, azóta törölt .env (csak a fájlnév alapján).
new_repo
echo 'x=1' >"$repo/.env"
commit_all "env"
git -C "$repo" rm -q .env && git -C "$repo" commit -q -m "env torlese"
run "törölt .env a history-ban" 1
expect_in_output "törölt .env" "ELŐZMÉNY-FÁJLNÉV"

# 7. A szkript nem módosít semmit.
new_repo
printf 'MYSQL_PASSWORD=%s\n' "$FAKE_PASSWORD" >"$repo/.env.example"
commit_all "pelda"
before="$(git -C "$repo" rev-parse HEAD)"
bash "$CHECK" "$repo" >/dev/null 2>&1
after="$(git -C "$repo" rev-parse HEAD)"
[ "$before" = "$after" ] && [ -z "$(git -C "$repo" status --porcelain)" ] && ok "a szkript nem módosít (HEAD és munkafa változatlan)" || bad "a szkript módosította a repót"

[ "$failures" = 0 ] && echo "Minden teszt sikeres." || { echo "$failures teszt hibás." >&2; exit 1; }

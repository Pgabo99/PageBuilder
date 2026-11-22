#!/usr/bin/env bash
# GitOps-ellenőrzés eldobható kind-klaszterben (pagebuilder-gitops): Argo CD telepítése, a deploy/app valódi
# szinkronizálása a GitHubról (az Application a main ágra mutat), majd smoke teszt a futó alkalmazáson.
# Távoli ágat nem hoz létre és nem módosít. A takarítás hiba esetén is lefut, és csak a saját klasztert törli;
# ha már van ilyen nevű klaszter, nem nyúl hozzá, hanem leáll.
# GITOPS_KEEP=1: a klaszter megmarad hibakereséshez (kézzel törlendő: kind delete cluster --name pagebuilder-gitops).
# A kubeconfig-védelem miatt a kind/kubectl a `KUBECONFIG` változót a szkript elejétől saját ideiglenes fájlra állítja.
# Követelmény: bash, curl, docker, kubectl, sha256sum, base64. Windows: Git Bash.
set -euo pipefail

cd "$(dirname "$0")/.."

CLUSTER=pagebuilder-gitops
CTX="kind-$CLUSTER"
PORT="${GITOPS_PORT:-18083}"
TIMEOUT="${GITOPS_TIMEOUT:-900}"

# Pinnelt verziók. A kind bináris ellenőrző összege és az Argo CD manifeszt összege a repóban van rögzítve,
# nem a letöltés helyéről jön; az image-ek digest szerint rögzítettek.
KIND_VERSION=v0.33.0
KIND_SHA_LINUX=aee6151561422756b764a4ae28e7f44cda5af5a9eead3cc9985112b1de8d8e0d
KIND_SHA_WINDOWS=4b22adaa135368c5a465d56bbd8e520cbea87272a06ca00b6078e7b81515c9fc
NODE_IMAGE=kindest/node:v1.37.0@sha256:a1ed56cfb0e7b93589bdf97c8cd566405a265939e3620fc4f5de89adff580ae5
ARGO_VERSION=v3.6.1
ARGO_SHA=7be23ca7d9ca3d3074dee8332f1ca92a933b990cee7c9cf22cf3843ee8c2913e
ARGO_IMAGES=(
  "quay.io/argoproj/argocd:v3.6.1@sha256:296e3d74f449b2ce45265613fcb68c18ed7366488360c8ea32f5f2a93d2e5c54"
  "public.ecr.aws/docker/library/redis:8.10.1-alpine@sha256:ef216d85ec44f4fdf7c0e6df2d1757a4734ed32fbb278cabd3181b5a27353b79"
  "ghcr.io/dexidp/dex:v2.46.0@sha256:933fcd3f523338c847b88ef84a7145fb2fcb7b9917f08418612afeaaa2001777"
)

WORK="$(mktemp -d)"

# A felhasználó kubeconfigja (KUBECONFIG vagy ~/.kube/config) védett: a szkript csak saját, ideiglenes
# fájlt használ (kind és kubectl is), és a futás végén ellenőrzi, hogy a felhasználóé bájtra azonos maradt.
user_kubeconfig_hash() {
  local f
  IFS=':' read -ra files <<<"${USER_KUBECONFIG:-$HOME/.kube/config}"
  for f in "${files[@]}"; do
    if [ -f "$f" ]; then sha256sum "$f" | cut -d' ' -f1; else echo "nincs:$f"; fi
  done
}
USER_KUBECONFIG="${KUBECONFIG:-}"
KUBECONFIG_BEFORE="$(user_kubeconfig_hash)"
if command -v cygpath >/dev/null; then KUBECONFIG="$(cygpath -m "$WORK")/kubeconfig"; else KUBECONFIG="$WORK/kubeconfig"; fi
export KUBECONFIG
CREATED=0
PF_PID=""
START=$SECONDS
PHASES=()

phase() { PHASES+=("$1|$((SECONDS - START))"); START=$SECONDS; echo "OK   $1"; }
k() { kubectl --context "$CTX" "$@"; }

diagnostics() {
  [ "$CREATED" = 1 ] || return 0
  echo "--- Diagnosztika ---" >&2
  k get applications.argoproj.io -n argocd pagebuilder -o jsonpath='{.status.sync.status} {.status.health.status} {.status.operationState.message}{"\n"}' >&2 2>&1 || true
  echo "Nem Healthy erőforrások:" >&2
  k -n argocd get applications.argoproj.io pagebuilder -o jsonpath='{range .status.resources[?(@.health.status!="Healthy")]}{.kind}/{.name} {.health.status} {.health.message}{"\n"}{end}' >&2 2>&1 || true
  k get pods -A >&2 2>&1 || true
  k get events -n pagebuilder --sort-by=.lastTimestamp 2>&1 | tail -n 15 >&2 || true
  k get pods -n pagebuilder -o name 2>/dev/null | while read -r pod; do
    echo "--- $pod ---" >&2
    k logs -n pagebuilder "$pod" --all-containers --tail 15 >&2 2>&1 || true
  done
}

cleanup() {
  status=$?
  [ -z "$PF_PID" ] || kill "$PF_PID" 2>/dev/null || true
  [ "$status" -eq 0 ] || diagnostics
  # Csak az ebben a futásban létrehozott klaszter törlődik.
  if [ "$CREATED" = 1 ] && [ "${GITOPS_KEEP:-}" != "1" ]; then
    "$KIND" delete cluster --name "$CLUSTER" --kubeconfig "$KUBECONFIG" >/dev/null 2>&1 || true
  fi
  rm -rf "$WORK"
  if [ "$(user_kubeconfig_hash)" != "$KUBECONFIG_BEFORE" ]; then
    echo "HIBA: a felhasználó kubeconfigja megváltozott a futás alatt!" >&2
    status=1
  fi
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

fail() { echo "HIBA: $*" >&2; exit 1; }

# --- Előfeltételek ---
for cmd in docker kubectl curl sha256sum base64; do
  command -v "$cmd" >/dev/null || fail "hiányzik: $cmd"
done
docker info >/dev/null 2>&1 || fail "a Docker nem érhető el"

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) KIND_OS=windows; KIND_SHA=$KIND_SHA_WINDOWS; KIND="$WORK/kind.exe" ;;
  Linux) KIND_OS=linux; KIND_SHA=$KIND_SHA_LINUX; KIND="$WORK/kind" ;;
  *) fail "nem támogatott operációs rendszer: $(uname -s) (Linux vagy Windows/Git Bash)" ;;
esac

# --- Eszközök: kind (ellenőrző összeggel) ---
curl -fsSL -o "$KIND" "https://github.com/kubernetes-sigs/kind/releases/download/$KIND_VERSION/kind-$KIND_OS-amd64"
echo "$KIND_SHA  $KIND" | sha256sum -c - >/dev/null || fail "a kind bináris ellenőrző összege nem egyezik"
chmod +x "$KIND"

if "$KIND" get clusters 2>/dev/null | grep -qx "$CLUSTER"; then
  fail "már létezik a(z) $CLUSTER klaszter; nem nyúlok hozzá. Törlés: kind delete cluster --name $CLUSTER"
fi
phase "előfeltételek és kind $KIND_VERSION (ellenőrző összeg rendben)"

# --- Klaszter ---
"$KIND" create cluster --name "$CLUSTER" --kubeconfig "$KUBECONFIG" --image "$NODE_IMAGE" --wait 180s >/dev/null
CREATED=1
k cluster-info >/dev/null
phase "kind-klaszter ($NODE_IMAGE)"

# --- Argo CD ---
manifest="$WORK/argocd-install.yaml"
curl -fsSL -o "$manifest" "https://raw.githubusercontent.com/argoproj/argo-cd/$ARGO_VERSION/manifests/install.yaml"
echo "$ARGO_SHA  $manifest" | sha256sum -c - >/dev/null || fail "az Argo CD manifeszt ellenőrző összege nem egyezik"
# Az image-ek digestre rögzítve.
for ref in "${ARGO_IMAGES[@]}"; do
  sed -i.bak "s#image: ${ref%%@*}\$#image: $ref#" "$manifest"
done
rm -f "$manifest.bak"
unpinned="$(grep -E '^\s+image:' "$manifest" | grep -v '@sha256:' || true)"
[ -z "$unpinned" ] || fail "digest nélküli Argo CD image maradt: $unpinned"

k create namespace argocd >/dev/null
k apply -n argocd --server-side -f "$manifest" >/dev/null
# A nem használt komponensek leállítása (memória).
k -n argocd scale deploy argocd-dex-server argocd-notifications-controller argocd-applicationset-controller --replicas=0 >/dev/null
for d in argocd-server argocd-repo-server argocd-redis; do
  k -n argocd rollout status "deploy/$d" --timeout=300s >/dev/null
done
k -n argocd rollout status statefulset/argocd-application-controller --timeout=300s >/dev/null
# A kind-ben nincs ingress-vezérlő (a k3s-ben a Traefik van), ezért az Ingress sosem kap címet, és az Argo
# alapértelmezett ellenőrzése örökre Progressing állapotban tartaná az Application-t. Csak az Ingress
# egészségellenőrzése lesz felülírva; a Service-en át a smoke teszt igazolja az alkalmazást. Külön field manager:
# a telepítő manager-ével azonos kulccsal az apply törölné a ConfigMap többi mezőjét, a címkéit is.
k apply --server-side --field-manager=pagebuilder-gitops -f - >/dev/null <<'YAML'
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-cm
  namespace: argocd
data:
  resource.customizations.health.networking.k8s.io_Ingress: |
    hs = {}
    hs.status = "Healthy"
    hs.message = "Ingress-vezérlő nincs a kind-klaszterben; a cím nem várható."
    return hs
YAML
phase "Argo CD $ARGO_VERSION (digest-pinnelt image-ek, Ingress-egészség felülírva)"

# --- Eldobható titkok (nincsenek a gitben, értékük nem jelenik meg) ---
k create namespace pagebuilder >/dev/null
k -n pagebuilder create secret generic pagebuilder-secrets \
  --from-literal=APP_KEY="base64:$(head -c 32 /dev/urandom | base64)" \
  --from-literal=MYSQL_PASSWORD="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')" \
  --from-literal=MYSQL_ROOT_PASSWORD="$(head -c 18 /dev/urandom | base64 | tr -dc 'A-Za-z0-9')" >/dev/null
phase "eldobható titkok"

# --- Application és szinkron ---
k apply -f deploy/argocd/application.yaml >/dev/null
deadline=$((SECONDS + TIMEOUT))
state=""
while [ "$SECONDS" -lt "$deadline" ]; do
  state="$(k -n argocd get applications.argoproj.io pagebuilder -o jsonpath='{.status.sync.status}/{.status.health.status}' 2>/dev/null || true)"
  [ "$state" = "Synced/Healthy" ] && break
  sleep 5
done
[ "$state" = "Synced/Healthy" ] || fail "az Application nem lett Synced/Healthy ${TIMEOUT} s alatt (állapot: '${state:-ismeretlen}')"
phase "Application Synced/Healthy"

# --- A futó image-ek egyeznek a szinkronizált revízió manifesztjeivel ---
revision="$(k -n argocd get applications.argoproj.io pagebuilder -o jsonpath='{.status.sync.revision}')"
repo="$(k -n argocd get applications.argoproj.io pagebuilder -o jsonpath='{.spec.source.repoURL}')"
slug="${repo#https://github.com/}"; slug="${slug%.git}"
[[ "$revision" =~ ^[0-9a-f]{40}$ ]] || fail "érvénytelen revízió: '$revision'"
expected="$(for f in backend worker nginx; do
  curl -fsSL "https://raw.githubusercontent.com/$slug/$revision/deploy/app/$f.yaml" | grep -oE 'ghcr\.io/[a-z0-9-]+/pagebuilder-(backend|nginx):[0-9a-f]{40}'
done | sort -u)"
[ -n "$expected" ] || fail "a revízió ($revision) manifesztjeiben nincs saját image"
running="$(k -n pagebuilder get pods -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.image}{"\n"}{end}{range .spec.initContainers[*]}{.image}{"\n"}{end}{end}' | grep pagebuilder- | sort -u)"
[ "$running" = "$expected" ] || fail "a futó image-ek eltérnek a revízióétól. Várt: $expected | Futó: $running"
phase "futó image-ek = a revízió ($revision) manifesztjei: $(echo "$running" | sed 's/.*://' | sort -u | cut -c1-7 | tr '\n' ' ')"

# --- Smoke teszt a Service-en át (a kind-ben nincs Traefik) ---
k -n pagebuilder port-forward svc/nginx "$PORT:80" >/dev/null 2>&1 &
PF_PID=$!
for _ in $(seq 1 30); do
  curl -fsS -o /dev/null "http://127.0.0.1:$PORT/up" 2>/dev/null && break
  sleep 1
done
# A SANCTUM_STATEFUL_DOMAINS portot nem tartalmaz, ezért a Referer port nélküli.
SMOKE_SKIP_COMPOSE=1 SMOKE_REFERER=http://localhost NGINX_PORT="$PORT" bash scripts/smoke.sh >"$WORK/smoke.log" 2>&1 \
  || { cat "$WORK/smoke.log" >&2; fail "a smoke teszt elbukott"; }
cat "$WORK/smoke.log"
phase "smoke teszt (/up, SPA, regisztráció, publikálás, kiszolgálás)"

# --- Mérés ---
node_stats="$(docker stats --no-stream --format '{{.MemUsage}} memória, {{.CPUPerc}} CPU' "$CLUSTER-control-plane" 2>/dev/null || echo 'nem mérhető')"

summary() {
  echo "### GitOps-ellenőrzés (kind + Argo CD)"
  echo
  echo "Revízió: \`$revision\` · node image: \`$NODE_IMAGE\`"
  echo
  echo "| Fázis | Idő (s) |"
  echo "|---|---|"
  for p in "${PHASES[@]}"; do echo "| ${p%|*} | ${p##*|} |"; done
  echo
  echo "Node-konténer erőforrásigénye a smoke teszt után: $node_stats"
}
summary
[ -z "${GITHUB_STEP_SUMMARY:-}" ] || summary >>"$GITHUB_STEP_SUMMARY"
echo "Minden ellenőrzés sikeres."

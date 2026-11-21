# DevOps

> **Hatókör:** nincs Azure-kitelepítés; a Terraform és a `deploy/` kész és tesztelt, de nem telepített, a bizonyíték helyben (Compose, kind) vagy CI-ban fut ([roadmap](roadmap.md)). Az Azure-specifikus szakaszok (TLS, Blob backup, Application Insights) a kitelepítéshez szólnak.
>
> A „Lokális környezet” és a „CI (MVP)” szakasz aktuális; a többi **bővített terv** a beadandó utáni továbbfejlesztéshez, nem karbantartott. Az MVP-hatókör: [roadmap](roadmap.md), a halasztott elemek: [backlog](backlog.md).

## Repó-szerkezet

```
backend/    Laravel API (PHP-FPM image)
frontend/   Vue SPA (build az Nginx image-be)
e2e/        Playwright
load/       k6 szkriptek
docker/     Dockerfile-ok, Nginx-konfiguráció (lokális és éles közös alap)
deploy/     sima manifestek: app/ (az alkalmazás), argocd/ (Application)
infra/      Terraform (bootstrap/, main/), Grafana dashboardok
docs/
```

## Lokális környezet (Docker Compose)

Szolgáltatások: `nginx`, `backend` (PHP-FPM), `worker`, `scheduler`, `mysql`, `redis`, `frontend` (Vite dev szerver). Mindegyiken healthcheck van, az indítás `service_healthy` feltétellel. A gépen csak Docker és Git kell. Rögzített image tagek, commitolt lock fájlok, `.env.example`.

- A hitelesítő adatok egyetlen forrása a gyökér `.env`; a backend `DB_*` változóit a Compose adja, és ezek elsőbbséget élveznek a `backend/.env`-vel szemben.
- Teszt-adatbázis: `<MYSQL_DATABASE>_testing`, külön, csak arra jogosult felhasználóval (`docker/mysql/init/`); a `phpunit.xml` `force="true"`-val a `mysql_testing` kapcsolatot, `array` sessiont és cache-t, `sync` queue-t ír elő.
- A backend healthcheckje a PHP-FPM `/ping` végpontja (`cgi-fcgi`).
- Nginx: egyetlen host port (`127.0.0.1:${NGINX_PORT:-8080}`); csak a `backend/public` van mountolva, így a `.env` és a többi backend-fájl nem érhető el HTTP-n; az `APP_URL`-t a Compose adja.
- Publikált webhelyek: a `sites-data` kötet (`/var/www/sites`, `PUBLISH_PATH`): kizárólag a worker írja és törli (a webes PHP-FPM más felhasználóként fut, és nem is csatlakozik a kötetre), az Nginx csak olvassa. Az Nginx `/sites/{slug}/` alatt szolgálja ki (dev és prod konfig), `Content-Security-Policy: default-src 'none'` fejléccel, így a publikált oldalon semmilyen script nem fut; a rejtett (ideiglenes) könyvtárak tiltottak. Production Kubernetes-ben a megosztott kötet a T6-ban készül.
- Worker: a backend image-éből (`x-backend` anchor), `queue:work --timeout=60`, ami kisebb a Redis queue `retry_after` (90 s) értékénél; healthcheck: `pgrep`.
- Közös origin: az Nginx az `/api`, `/sanctum`, `/up` útvonalat a Laravelhez, minden mást a Vite dev szerverhez (WebSocket/HMR) továbbít; a rejtett fájlokat mindkét irányban tiltja (kivétel a Vite `/node_modules/.vite/` függőségei). A frontend `node_modules` named volume-ban van; a HMR a `NGINX_PORT`-on, pollinggal (Windowsos bind mount) működik.
- A `DB_TEST_*` változók és a tesztfelhasználó csak a lokális és a CI-környezetben léteznek; az éles backend környezetébe nem kerülnek (a `mysql_testing` kapcsolat ott hitelesítő adat nélkül nem használható).

## CI (MVP)

- `.github/workflows/ci.yml` PR-ra és `main`-re: `backend` (Pint, Pest) és `frontend` (Oxlint/ESLint, Prettier, `type-check`, Vitest) job, ugyanazon a Compose-stacken, mint lokálisan; lockfile alapú telepítés, fájlmódosítás nélküli ellenőrzések; hitelesítő adatként csak a `.env.example` placeholderei (eldobható CI-adatbázis).
- `install` job: a README első indítási lépései tiszta checkouton (`.env.example` placeholderekkel), majd `scripts/smoke.sh`: szolgáltatások, health, SPA és felhasználói út az API-n. A GitHub-runnerek nem futtatnak Linux-konténert Windowson és macOS-en, ezért ott a CI nem ellenőriz; a Windows-ellenőrzés kézi (a README rögzíti).
- `security` job, párhuzamosan: Trivy fs (`--scanners vuln,secret`, `aquasec/trivy` digest alapján), `composer audit --locked`, `npm audit`. Minden súlyosság megjelenik, csak a HIGH és CRITICAL blokkol; automatikus javítás nincs, sérülékenység figyelmen kívül hagyása csak külön jóváhagyással (`.trivyignore`, indoklással). A Trivy az npm fejlesztői függőségeket alapból nem vizsgálja, ezeket az `npm audit` lefedi.
- `images` job: a production image-ek buildje és `trivy image` vizsgálata; teljes riport, de csak a javítható HIGH/CRITICAL blokkol (`--ignore-unfixed`, csak itt; AI-045).
- Production image-ek: PHP (`docker/php/Dockerfile`, `prod` target: a Composer nélküli `runtime` stage-re épül, fejlesztői csomagok és tesztek nélkül, `www-data`), Nginx (`docker/nginx/Dockerfile`, a gyökér az allowlistes build context: Vite build + `backend/public`, `prod.conf`, `nginx` felhasználó, 8080). A backend és a worker ugyanazt a PHP image-et használja.
- `publish` job (csak `main` push, minden ellenőrzés után): build, Trivy-kapu mindkét image-re, majd push: `ghcr.io/<owner>/pagebuilder-backend:<commit SHA>` és `pagebuilder-nginx:<commit SHA>`; `latest` tag nincs, a deploy és a rollback a SHA-ra épül. `GITHUB_TOKEN`, `packages: write` csak ebben a jobban. A push után digest alapján letölti és füstteszteli az image-eket; a tag és a digest a futás összefoglalójában. A csomagok nyilvánosak: a `source` label a nyilvános repóhoz köti őket, és annak láthatóságát öröklik; titkot nem tartalmaznak, így a k3s-nek nem kell pull secret (AI-046).
- `main` branch protection (nyilvános repó, ingyenes csomag): kötelező PR, kötelező és naprakész `backend`, `frontend`, `security` és `images` ellenőrzés, 0 jóváhagyás, force push és törlés tiltva, adminra is.

## Image-ek

| Image | Tartalom | Build |
|---|---|---|
| `ghcr.io/<owner>/pagebuilder-backend` | PHP-FPM, Laravel; a worker és a scheduler is ezt használja más paranccsal | multi-stage (Composer → runtime), nem root |
| `ghcr.io/<owner>/pagebuilder-nginx` | Nginx és a SPA buildje | multi-stage (Node build → Nginx), nem root |

Tag: commit SHA; release esetén SemVer is.

## CI/CD

```mermaid
flowchart LR
  pr[Pull request] --> lint[Lint: Pint, ESLint, vue-tsc]
  pr --> test[Pest]
  pr --> e2e[Playwright Compose-stacken]
  pr --> scan1[composer/npm audit, Trivy config, Gitleaks]
  main[Merge main-re] --> build[Image build]
  build --> scan2[Trivy image scan<br/>HIGH/CRITICAL = stop]
  scan2 --> push[Push GHCR]
  push --> bump[Commit: image tag a deploy/app-ban]
  bump --> argo[Argo CD sync]
  argo --> smoke[Smoke teszt: /up, /sites/demo/]
```

- Az actionök commit SHA-ra rögzítettek, a `permissions` minimális (alapból `contents: read`; a tag-commit job `contents: write`, a push `packages: write`).
- A tag-commit nem indít újabb buildet (a `deploy/**` útvonal kizárva).
- A scan-eredmények CI-artifactként elérhetők; SARIF-feltöltés, ha az előfizetés támogatja.
- Kivétel (pl. `.trivyignore`) csak indoklással, jóváhagyással és lejárati dátummal ([security.md](security.md)).

## GitOps, deploy és rollback

- Az Argo CD a `main` ág `deploy/app` könyvtárát szinkronizálja (`deploy/argocd/application.yaml`: automated sync, self-heal, prune). A kézzel létrehozott `pagebuilder-secrets` nem része a gitnek, ezért a prune nem érinti.
- A tag-commit PR-ban érkezik (a branch protection érvényben marad); alkalmazás-rollback: a tag-commit `git revert`-je; az Argo CD visszaállítja az előző image-et. Minden deploy és rollback commitként visszakereshető.
- A webhely-tartalom rollbackje alkalmazásszintű ([publishing.md](publishing.md)), ettől független.

### Argo CD bootstrap (a VM és a k3s létrejötte után, egyszer)

A VM-en (SSH, `sudo k3s kubectl`; a k3s API kívülről zárt):

```
V=v3.6.1   # rögzített, 2 hétnél régebbi kiadás
sudo k3s kubectl create namespace argocd
sudo k3s kubectl apply -n argocd --server-side -f https://raw.githubusercontent.com/argoproj/argo-cd/$V/manifests/install.yaml
# Memória: a nem használt komponensek leállítása
sudo k3s kubectl -n argocd scale deploy argocd-dex-server argocd-notifications-controller argocd-applicationset-controller --replicas=0
# A titkok létrehozása: lásd "Alkalmazás-manifesztek", majd az Application:
sudo k3s kubectl apply -f https://raw.githubusercontent.com/Pgabo99/PageBuilder/main/deploy/argocd/application.yaml
```

- A telepítő a hivatalos kiadási címkéről jön; futtatás előtt érdemes átnézni.
- Az Argo CD UI-nak nincs nyilvános portja (NSG, nincs Ingress): `sudo k3s kubectl -n argocd port-forward svc/argocd-server 8081:443` és SSH-tunnel (`ssh -L 8081:localhost:8081 …`). A kezdeti admin jelszó: `sudo k3s kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d`.
- Az Argo CD saját erőforrás-limitjei a T7 (megfigyelés) idején mérhetők; a `kubectl top` mutatja a valós használatot.

## Infrastruktúra (Terraform, Azure)

Egyetlen stack az `infra/` könyvtárban (az MVP-ben nincs bootstrap-stack és Key Vault):

| Erőforrás | Megjegyzés |
|---|---|
| Resource group, VNet, alhálózat | az alhálózaton `Microsoft.Storage` service endpoint (ingyenes) |
| NSG | bejövő: 80/443 az internetről, 22 csak `ssh_allowed_cidr`-ről; minden más (k3s API 6443, MySQL, Redis, Prometheus, Grafana) az Azure `DenyAllInbound` miatt zárt |
| Statikus publikus IP | `<dns_label>.<régió>.cloudapp.azure.com` |
| Linux VM (Ubuntu 24.04) | méret a `vm_size` változóból (alap `Standard_B2s`, 4 GB), csak SSH-kulcs, cloud-init: k3s |
| Backup storage account | LRS, privát konténer, tiltó hálózati alapértelmezés (csak a VM alhálózata és a `backup_allowed_ips`), `backup_retention_days` utáni törlés |
| Leállítási ütemezés | opcionális (`auto_shutdown_time`), a felejtett VM költsége ellen |

Használat (a Terraform konténerből fut; `az login` és `terraform.tfvars` a felhasználó dolga, a `terraform.tfvars.example` alapján):

```
docker run --rm -v "$PWD/infra:/work" -w /work hashicorp/terraform:1.17.1 init
... plan / apply     # az apply csak külön jóváhagyással
```

- A state lokális (`terraform.tfstate`), a `.gitignore` kizárja a state-et, a `*.tfvars` és a `*.tfplan` fájlokat; a `.terraform.lock.hcl` commitolt. A state titkot nem tartalmaz (az SSH-nek csak a nyilvános kulcsa kerül be).
- Tesztek: `terraform fmt -check`, `validate` és `terraform test` (mock provider, a NSG-portok, a kulcsos belépés, a privát backup-tároló és a változó-validációk ellenőrzése); a CI `terraform` jobja futtatja. Az `apply` a CI-ban nincs.
- A k3s a hivatalos telepítővel (`get.k3s.io`) települ a `stable` csatornáról (`k3s_channel`); a kubeconfig csak rootnak olvasható.
- Trivy `config` scan (2026-11-21): az NSG HTTP/HTTPS-szabálya (AZU-0047, CRITICAL) és a NIC publikus IP-je (AZU-0076) a publikus weboldal miatt szándékos; a tárolónaplózás, a CMK, az infrastruktúra-szintű titkosítás és a georedundancia (AZU-0057/0058/0060/0061) többletköltség vagy -komponens (Log Analytics, Key Vault, GRS), az MVP-ben nincs. A hálózati alapértelmezés (AZU-0012) javítva.
- A VM leállítható (deallocate), amikor nincs használatban.

## Alkalmazás-manifesztek (`deploy/app`)

Sima manifestek, egy `pagebuilder` namespace-ben; az Argo CD ezt a könyvtárat szinkronizálja (T6.2/2).

| Fájl | Tartalom |
|---|---|
| `00-namespace-config.yaml` | namespace és `pagebuilder-config` ConfigMap (titok nélkül) |
| `mysql.yaml`, `redis.yaml` | StatefulSet + ClusterIP Service + PVC (5 Gi, 1 Gi); csak a clusteren belül érhetők el |
| `backend.yaml` | PHP-FPM Deployment, `migrate` initContainer, Service (9000) |
| `worker.yaml` | queue worker (`Recreate`), `sites-data` PVC: az egyetlen író |
| `nginx.yaml` | Nginx Deployment (a `sites-data` csak olvasható), Service, Traefik Ingress |

- **Titkok** a `pagebuilder-secrets` Secretben vannak, nem a gitben. Egyszeri létrehozás (a klaszter létrejötte után, az Argo CD előtt):
  ```
  kubectl create namespace pagebuilder
  kubectl -n pagebuilder create secret generic pagebuilder-secrets     --from-literal=APP_KEY="base64:$(openssl rand -base64 32)"     --from-literal=MYSQL_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=')"     --from-literal=MYSQL_ROOT_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=')"
  ```
  Az `APP_KEY` elvesztése a titkosított adatok (pl. sessionök) érvénytelenné válásával jár; a jelszavak a MySQL első indításakor kerülnek az adatbázisba.
- **Image-ek**: `ghcr.io/pgabo99/pagebuilder-{backend,nginx}:<teljes commit SHA>`; a tag a backend (3 helyen) és az nginx manifestben van, a CI (T6.4) cseréli. A `sites-data` RWO PVC-t a worker és az Nginx egy node-on osztja meg (egy VM).
- **Erőforrások** (a 4 GB-os VM-hez, [m6-terv](m6-terv.md)): requestek összesen ~0,7 GB, limitek ~1,5 GB az alkalmazás podjaira; a MySQL kis buffer poollal és kikapcsolt performance schemával fut.
- **Biztonság**: minden pod nem root felhasználóval, `readOnlyRootFilesystem`, minden capability eldobva, `seccomp: RuntimeDefault`; írható csak az `emptyDir` (tmp, Blade-gyorsítótár, `bootstrap/cache`, MySQL socket) és a PVC. A MySQL, Redis, backend és Nginx nem root, read-only módját helyben `docker run`-nal kipróbáltuk; a k3s-en még nem futott.
- Trivy `config` (2026-11-21), elfogadott találatok: CPU-limit hiánya (LOW, a throttling elkerülésére), UID/GID ≤ 10000 (LOW, az image-ek fix felhasználói), `ghcr.io` nem „megbízható registry” (MEDIUM, saját image-ek), a ConfigMap „érzékeny tartalma” (MEDIUM, téves: csak felhasználónevek és hosztok, a jelszavak Secretben).
- A `APP_URL`, `SANCTUM_STATEFUL_DOMAINS` és `SESSION_SECURE_COOKIE` értékét a T6.3 (HTTPS, tényleges DNS-név) állítja át; addig a bejelentkezés `http://localhost`-ról (port-forward) használható.

## Platformkomponensek a clusterben

Argo CD, Sealed Secrets, cert-manager (ClusterIssuer: Let's Encrypt staging, majd production), kube-prometheus-stack (Alertmanager nélkül), mysqld-exporter, redis-exporter, blackbox exporter. Mindegyik deklaratívan, rögzített chartverzióval, erőforráskorlátokkal.

## TLS

- Hosztnév: `<label>.<region>.cloudapp.azure.com`.
- Előbb Let's Encrypt staginggel teszteljük, siker után production. HTTP→HTTPS átirányítás.
- Ismert kockázat: a közös `azure.com` limit miatt az első igénylés elbukhat (AI-024). Ilyenkor újrapróbálás, végső esetben DuckDNS.
- A Laravel `TrustProxies` csak a cluster belső hálózatát fogadja el.

## Megfigyelhetőség

**Metrikaforrások:** Traefik (HTTP), Laravel `/metrics` (`promphp/prometheus_client_php`, Redis tároló, csak clusteren belül), node-exporter, kube-state-metrics, mysqld- és redis-exporter, backup- és restore-metrikák.

**Szabályok:** nincs magas kardinalitású címke (`user_id`, `website_id`); rövid megőrzés (pl. 7 nap); erőforráskorlátok. Ha a 4 GB RAM kevés, egyszerűsített stack jön (Prometheus és Grafana operator nélkül).

**Dashboardok:** JSON-ként verziózva (`infra/grafana/`), provisioninggel betöltve.

**Elérhetőség:** belül blackbox exporter, kívül Application Insights Standard test (API `/up` és egy publikált oldal).

**Naplózás:** JSON a stdout-ra (Laravel `stderr` csatorna JSON formatterrel, Nginx JSON access log). A Loki opcionális.

### SLI és SLO

| SLI | SLO (30 nap, hosszú távú cél) | Forrás |
|---|---|---|
| API-rendelkezésre állás (nem 5xx arány) | ≥ 99% | Traefik |
| API-latencia p95 | < 500 ms | Traefik |
| Publikált oldalak rendelkezésre állása | ≥ 99,5% | Traefik, Application Insights |
| Publikálás sikeraránya (validációs hiba nélkül) | ≥ 95% | `/metrics` |
| Publikálási idő p95 (queue-várakozással) | < 60 s | `/metrics` |

A beadandóban rövidebb ablakban, reprodukálható k6 terheléssel demonstráljuk ([testing-strategy.md](testing-strategy.md)). A 30 napos SLO teljesülését elegendő mérési adat nélkül nem állítjuk.

## Titokkezelés

Sealed Secrets (titkosítva a gitben). A controller kulcsa az Azure Key Vaultban van, amely a Terraform state-ben nem tárol titokértéket. A CI-titkok GitHub Secrets-ben vannak; GHCR-hez `GITHUB_TOKEN`. Visszaállítás és rotáció: `docs/runbooks/` (T8.3 feladat).

## Backup és restore

| Elem | Érték |
|---|---|
| Tartalom | MySQL dump (`--single-transaction`), médiakötet, release-kötet; manifest és SHA-256 |
| Ütemezés | napi CronJob; a mentés idejére a publikálás felfüggesztve (lock) a konzisztencia érdekében |
| Cél | külön Azure storage account, titkosított tárolás, HTTPS |
| Megőrzés | 7 napi és 4 heti (lifecycle policy) |
| Jogosultság | a backup csak írhat, a restore csak olvashat |
| Restore-teszt | heti CronJob izolált ideiglenes MySQL-be; checksum- és integritás-ellenőrzés |
| Metrikák | `backup_last_success_timestamp`, `restore_test_last_success_timestamp`; a mentés elmaradása látható a dashboardon |
| Cél | RPO ≤ 24 óra, RTO ≤ 2 óra |

### Disaster recovery

Forgatókönyv: a VM elvész. Lépések: `terraform apply` (main) → k3s → a Sealed Secrets kulcsának visszaállítása a Key Vaultból → Argo CD bootstrap → szinkron → restore a legutóbbi backupból → ellenőrzés. Tartalék: release-újragenerálás pillanatképből. Egy ténylegesen végrehajtott gyakorlat mért RPO- és RTO-értékekkel kerül dokumentálásra.

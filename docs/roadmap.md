# Ütemterv (MVP)

Egyetemi beadandó: minden követelményhez a legegyszerűbb működő megoldás. A halasztott fejlesztések a [backlogban](backlog.md) vannak. Minden mérföldkőnek azonos nevű GitHub milestone felel meg; egy feladat egy kis issue.

Státusz: ✅ kész · 🔄 folyamatban

## Követelmények és megoldás

| Szempont (pont) | MVP-megoldás |
|---|---|
| Rendszerhatár (5) | rövid architektúra-ábra és rendszerhatár ([architecture.md](architecture.md)) |
| Setup és repository (5) | Compose-stack, README, branch protection, issue/PR workflow |
| CI (9) | GitHub Actions PR-ra: Pint, ESLint, `vue-tsc`, Pest, Vitest, Playwright |
| Artifact és security (7) | SHA-tagelt image-ek a GHCR-ben; Trivy (fs, image), `composer audit`, `npm audit` |
| Deployment és rollback (9) | a CI átírja az image taget a `deploy/`-ban → Argo CD sync → smoke teszt; rollback: a tag-commit `git revert`-je |
| GitOps (5) | k3s és Argo CD egy VM-en, sima manifestek (`deploy/`); a secret egyszeri `kubectl create secret` |
| IaC (5) | Terraform: VM, NSG, publikus IP DNS-címkével, backup storage account; k3s cloud-inittel; lokális state |
| Observability és SLO (7) | Prometheus és Grafana; SLI a Traefik-metrikákból (sikeres kérések aránya, p95), 2 SLO, 1 dashboard |
| Recovery (4) | CronJob: napi `mysqldump` a VM-en és Azure Blobban (VM-en kívül); egyszer ténylegesen végrehajtott, ellenőrzött visszaállítás |
| AI audit (4) | [ai-audit.md](ai-audit.md), jelentős döntések |

HTTPS: a k3s beépített Traefikje Let's Encrypt tanúsítványt kér az Azure DNS-címre.

## Alkalmazás (MVP)

Regisztráció és bejelentkezés (Sanctum); webhelyek és oldalak CRUD, Policy-vel; szerkesztő 3 komponenstípussal (címsor, szöveg, gomb/link), egyszerű drag & droppal, a komponensek a `pages.content` JSON oszlopban; publikálás queue jobbal statikus HTML-be, kiszolgálás `/sites/{slug}/` alatt, állapot: folyamatban / kész / hibás.

## M1 – Fejlesztői környezet

| ID | Feladat |
|---|---|
| T1.1 ✅ | Laravel 13 a `backend/`-ben, konténerből |
| T1.2 ✅ | Vue 3 a `frontend/`-ben, konténerből (Vitest) |
| T1.3/1 ✅ | Compose: MySQL, Redis (AOF) |
| T1.3/2 ✅ | Compose: backend, teszt-adatbázis |
| T1.3/3 ✅ | Compose: Nginx, `/up` a hostról, `.env` tiltva |
| T1.3/4 ✅ | Compose: frontend dev szerver az Nginx mögött |
| T1.3/5 ✅ | Compose: `worker` (`queue:work`) |
| T1.4 ✅ | Pint, ESLint és Prettier (hivatalos Vue-konfig), Pest; egységes parancsok |

## M2 – CI és artifact

| ID | Feladat |
|---|---|
| T2.1 ✅ | PR-workflow: lint, Pest, Vitest, `vue-tsc`; branch protection |
| T2.2 ✅ | Security: Trivy fs, `composer audit`, `npm audit` |
| T2.3 ✅ | Production image-ek (backend, nginx a SPA buildjével) |
| T2.4 ✅ | Build, Trivy image scan, push GHCR-be `main`-en, SHA-taggel |

## M3 – Hitelesítés

| ID | Feladat |
|---|---|
| T3.1 ✅ | Auth API (register, login, logout, user); Pest: siker és hibautak |
| T3.2 ✅ | Frontend: API-kliens, auth store, login és regisztráció nézet, router guard |

## M4 – Webhelyek és szerkesztő

| ID | Feladat |
|---|---|
| T4.1 ✅ | Webhelyek API és Policy (idegen erőforrásra 404) |
| T4.2 ✅ | Oldalak API, `content` JSON validálása (3 típus) |
| T4.3 ✅ | Frontend: webhely- és oldalkezelés |
| T4.4 ✅ | Szerkesztő: komponensek hozzáadása, szerkesztése, törlése, drag & drop, mentés |

## M5 – Publikálás

| ID | Feladat |
|---|---|
| T5.1 | Publish végpont és job: Blade → statikus HTML, állapot |
| T5.2 | Nginx `/sites/{slug}/`; publikálás gomb és állapot a felületen |

## M6 – Infrastruktúra és GitOps

| ID | Feladat |
|---|---|
| T6.1 | Terraform: VM k3s-sel, NSG, publikus IP DNS-címkével, backup storage account (költségbecslés és jóváhagyás után) |
| T6.2 | `deploy/` manifestek; Argo CD bootstrap; secretek |
| T6.3 | Traefik HTTPS (Let's Encrypt) |
| T6.4 | CI: image tag commit → Argo CD sync → smoke teszt; rollback `git revert`-tel, dokumentálva |

## M7 – Observability és recovery

| ID | Feladat |
|---|---|
| T7.1 | Prometheus és Grafana; SLI/SLO (rendelkezésre állás, p95), dashboard |
| T7.2 | Backup CronJob: `mysqldump` PVC-re és Azure Blobba |
| T7.3 | Ellenőrzött visszaállítás külön adatbázisba, dokumentálva |

## M8 – E2E és lezárás

| ID | Feladat |
|---|---|
| T8.1 | Playwright a CI-ban: regisztráció és bejelentkezés; webhely, oldal, szerkesztés; publikálás |
| T8.2 | README, architektúra véglegesítése, AI audit |

## Technikai adósság

- MySQL healthcheck (`compose.yaml`): a `MYSQL_PWD` elavult (a 9.7.4-en működik); csere: `--defaults-extra-file`.
- Redis: `noeviction` mellett `maxmemory` esetén a cache-írások hibára futnak; a cache elkülönítése a backlogban.

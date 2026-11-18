# Ütemterv

Inkrementális haladás: egyszerre egy feladat. A feladat előtt tisztázzuk a részleteket, utána ellenőrzés és teszt következik, a következő feladat csak jóváhagyással indul. A sorrend tracer bullet elvű: a teljes út (kód → CI → GHCR → Argo CD → éles) korán, minimális alkalmazással működjön, és erre épüljenek a funkciók.

Státusz: ⬜ nincs elkezdve · 🔄 folyamatban · ✅ kész

Minden mérföldkőnek azonos nevű GitHub milestone felel meg; az `M0 – Rendszertervezés` (tervezési dokumentáció, Claude Code konfiguráció) a roadmap előtti, lezárt szakasz.

## M1 – Fejlesztői környezet

| ID | Feladat | Elfogadási kritérium | Előtte tisztázandó |
|---|---|---|---|
| T1.1 | Laravel inicializálása a `backend/`-ben konténerből | `php artisan --version` konténerben fut; `composer.lock` verziózva | Laravel- és PHP-verzió |
| T1.2 | Vue inicializálása a `frontend/`-ben konténerből | `npm run build` és `vue-tsc` zöld; strict mód | frontend unit tesztkeret (pl. Vitest); ESLint-konfiguráció |
| T1.3 | Docker Compose: nginx, backend, worker, scheduler, mysql, redis, frontend; healthcheckek; `.env.example` | `docker compose up` után a `/up` és a SPA elérhető; minden szolgáltatás healthy | Redis-perzisztencia (AOF) |
| T1.4 | Minőségi eszközök: Pint, ESLint, Pest alap; egységes parancsok | mindegyik konténerben fut, zöld | parancsfuttató (Makefile vagy npm/composer script) |

## M2 – CI és szállítási út (tracer bullet)

| ID | Feladat | Elfogadási kritérium | Előtte tisztázandó |
|---|---|---|---|
| T2.1 | PR workflow: lint, Pest, `composer audit`, `npm audit`, Gitleaks, Trivy config | zöld futás egy PR-on; artifactok | branch protection |
| T2.2 | Production Dockerfile-ok (backend, nginx), multi-stage, nem root | lokálisan buildel; Trivy image scan zöld | base image-ek |
| T2.3 | Build, scan és push GHCR-be a main ágon | SHA-tagelt image a GHCR-ben | csomag láthatósága |
| T2.4 | `deploy/` Kustomize base és prod overlay | `kustomize build` és Trivy config zöld | erőforráskorlátok |
| T2.5 | Terraform bootstrap: state storage, Key Vault, backup storage | `terraform apply`; `prevent_destroy` | költségbecslés és jóváhagyás; előfizetés, régió, elnevezés |
| T2.6 | Terraform main: hálózat, NSG, statikus IP DNS-címkével, VM k3s-sel | SSH és `kubectl get nodes` működik | költségbecslés és jóváhagyás; VM-méret, SSH-hozzáférés |
| T2.7 | Argo CD és Sealed Secrets bootstrap, kulcsmentés a Key Vaultba | az Argo CD szinkronizálja a prod overlayt | bootstrap módja (szkript vagy cloud-init) |
| T2.8 | cert-manager, LE staging → production, HTTPS-átirányítás | érvényes tanúsítvány a hosztnéven | — |
| T2.9 | CI tag-commit → Argo CD deploy → smoke teszt; rollback `git revert`-tel | dokumentált deploy és rollback commit | — |

## M3 – Hitelesítés

| ID | Feladat | Elfogadási kritérium |
|---|---|---|
| T3.1 | Auth API (register, login, logout, user), rate limit, Redis session | Pest: siker, 422, 429, session-regenerálás |
| T3.2 | Frontend: API-kliens, `useAuthStore`, login és regisztráció nézet, router guard | loading és hibaállapotok; a11y |
| T3.3 | Playwright-alap és auth E2E a CI-ban | zöld E2E Compose-stacken |

## M4 – Webhelyek és oldalak

| ID | Feladat | Elfogadási kritérium |
|---|---|---|
| T4.1 | Websites API és Policy | Pest: CRUD, IDOR, validáció |
| T4.2 | Pages API, sorrend, `references` | Pest: kétfázisú átrendezés, egyedi slug |
| T4.3 | Frontend: webhely- és oldalkezelés | loading, empty és error állapotok |

## M5 – Komponensek és szerkesztő

| ID | Feladat | Elfogadási kritérium | Előtte tisztázandó |
|---|---|---|---|
| T5.1 | Komponenstáblák, modellek, morph map, `config/components.php`, `Link` value object | migrációk és factory-k; integritásteszt | — |
| T5.2 | `GET`/`PUT /pages/{page}/components`, típusvalidáció, `lock_version` | Pest: atomicitás, 409, idegen hivatkozás | — |
| T5.3 | Média: feltöltés, lista, törlés, privát `/file` (`X-Accel-Redirect`) | Pest: MIME, SVG, IDOR, közvetlen elérés tiltva | maximális fájlméret |
| T5.4 | Szerkesztő elrendezése, registry, vászon, tulajdonságszerkesztők | mind az 5 típus szerkeszthető; reszponzív | — |
| T5.5 | Drag & drop és billentyűzetes sorrendezés | húzással és billentyűzettel is működik | natív vagy könyvtár (függőség) |
| T5.6 | Mentési állapotok, 409-kezelés, elhagyási figyelmeztetés | négy állapot látható; a helyi módosítás megmarad | — |
| T5.7 | Blade renderer, közös CSS, előnézet végpont és sandboxolt iframe | a képek hitelesítve töltődnek; az 1. E2E folyamat zöld | — |

## M6 – Publikálás

| ID | Feladat | Elfogadási kritérium | Előtte tisztázandó |
|---|---|---|---|
| T6.1 | `deployments`, `deployment_logs`, `page_versions`; publish végpont, lock, 409 | Pest: konkurencia, dispatch commit után | — |
| T6.2 | Publish job: validálás, pillanatkép, render, média, manifest, atomi aktiválás | Pest: idempotens retry, a hiba nem érinti az élest | timeout, retry, backoff alapértékek |
| T6.3 | Nginx `/sites/` kiszolgálás, csak olvasható mount, CSP | a publikált oldal elérhető lokálisan | webhely slugjának módosíthatósága |
| T6.4 | Előzmények és naplók a felületen, polling, gombtiltás | állapotváltások láthatók | — |
| T6.5 | Rollback (pillanatképből újragenerálással) | Pest: forrásszabályok, manifest, a draft változatlan | — |
| T6.6 | Scheduler: beragadt deploymentek, release-megőrzés, médiatörlés | Pest: szabályok | — |
| T6.7 | E2E: 2–4. folyamat | zöld a CI-ban | — |

## M7 – Megfigyelhetőség

| ID | Feladat | Elfogadási kritérium |
|---|---|---|
| T7.1 | JSON-naplózás (Laravel, Nginx) | a `kubectl logs` kimenete JSON |
| T7.2 | `/metrics` (`promphp/prometheus_client_php`), csak belül | metrikák a Prometheusban; kívülről nem érhető el |
| T7.3 | kube-prometheus-stack (szűkített), exporterek, korlátok | mért memóriahasználat a VM-en |
| T7.4 | Grafana dashboardok kódként, SLO-panelek | provisioninggel betöltve |
| T7.5 | Blackbox exporter és Application Insights availability test | külső mérési adatok láthatók |
| T7.6 | k6 forgatókönyvek és workflow | futtatott mérés, JSON-összegzés artifactként |

## M8 – Backup és DR

| ID | Feladat | Elfogadási kritérium |
|---|---|---|
| T8.1 | Backup CronJob (DB, média, releases, manifest), publikálási lock | backup a Blobban, checksum egyezik |
| T8.2 | Heti restore-teszt CronJob és metrikák | sikeres izolált restore; metrika a dashboardon |
| T8.3 | DR-gyakorlat és runbookok (`docs/runbooks/`), titok-rotáció | ténylegesen mért RPO és RTO dokumentálva |

## M9 – Lezárás

| ID | Feladat | Elfogadási kritérium |
|---|---|---|
| T9.1 | README, dokumentáció véglegesítése, AI audit bizonyítékokkal | minden bizonyíték hivatkozott, reprodukálható |

## Nyitott részletkérdések

A feladattábláknál felsoroltakon túl:
- Költség: Azure-erőforrás csak előzetes költségbecslés és külön egyeztetés után jön létre (T2.5, T2.6, T7.5). A VM a T2.6-tól fut; használaton kívül leállítható (deallocate).

## Opcionális továbbfejlesztések

Staging; autosave; draft visszaállítása pillanatképből; WYSIWYG; új komponenstípusok; szerepkörök; e-mail-megerősítés, jelszó-visszaállítás, 2FA, OAuth; saját domain és aldomaines címzés; Loki; Alertmanager; CodeQL; signed URL; Velero; point-in-time restore.

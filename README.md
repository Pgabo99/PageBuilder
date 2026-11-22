# PageBuilder

Vizuális weboldalszerkesztő egyetemi Cloud és DevOps beadandóhoz: webhelyek és oldalak előre definiált komponensekből, aszinkron statikus publikálás, előzmények és rollback.

**Stack:** Vue 3, TypeScript, Laravel, MySQL, Redis, Nginx, Docker, k3s, Argo CD, Terraform (Azure, nincs kitelepítve), GitHub Actions, Prometheus, Grafana.

## Dokumentáció

- [Architektúra és döntésnapló](docs/architecture.md)
- [Adatbázis-terv](docs/database-design.md)
- [API-terv](docs/api-design.md)
- [Frontend-terv](docs/frontend-design.md)
- [Publikálás](docs/publishing.md)
- [DevOps](docs/devops.md)
- [Tesztelési stratégia](docs/testing-strategy.md)
- [Biztonság](docs/security.md)
- [Ütemterv (MVP)](docs/roadmap.md)
- [Backlog](docs/backlog.md)
- [AI audit](docs/ai-audit.md)

## Telepítés és futtatás

Minden parancs konténerben fut; a gépen csak az alábbi előfeltételek kellenek.

| OS | Előfeltétel |
|---|---|
| Windows 10/11 | Docker Desktop (WSL2 háttér), Git for Windows (Git Bash a smoke teszthez) |
| Linux | Docker Engine Compose v2 bővítménnyel, Git, bash, curl |
| macOS | Docker Desktop, Git (a bash és a curl alapból megvan) |

Ellenőrzés: `docker compose version`. Szabad port kell a `127.0.0.1:8080`-on (`NGINX_PORT`).

Ellenőrzött platformok: Linux (a CI `install` jobja minden PR-on) és Windows 11 (Docker Desktop, Git Bash). macOS-en nem ellenőriztük.

### Első indítás

Linux, macOS, Git Bash vagy WSL:

```sh
git clone https://github.com/Pgabo99/PageBuilder.git && cd PageBuilder
cp .env.example .env
cp backend/.env.example backend/.env
docker compose build
docker compose run --rm --no-deps backend composer install
docker compose run --rm --no-deps frontend npm ci
docker compose run --rm --no-deps backend php artisan key:generate   # csak első alkalommal
docker compose run --rm --no-deps backend chmod -R a+rwX storage bootstrap/cache
docker compose up -d --wait                                          # minden szolgáltatás healthy
docker compose exec backend php artisan migrate
bash scripts/smoke.sh
```

PowerShell: csak a két másolás más, a többi sor azonos (a smoke tesztet Git Bash-ben futtasd):

```powershell
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
```

Az alkalmazás: http://localhost:8080 (a SPA a `/`, a Laravel az `/api`, `/sanctum`, `/up` alatt, HMR-rel). Csak az Nginx érhető el a hostról.

### Környezeti változók

A gyökér `.env` (a `.env.example` másolata, nincs verziókezelésben) az egyetlen forrás; az `APP_KEY` a `backend/.env`-be generálódik. A repóban csak placeholder érték van.

| Változó | Szerep | Alapérték |
|---|---|---|
| `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD` | az alkalmazás adatbázisa | `pagebuilder`, `change-me` |
| `MYSQL_ROOT_PASSWORD` | MySQL root | `change-me-root` |
| `MYSQL_TEST_USER`, `MYSQL_TEST_PASSWORD` | teszt-adatbázis (`<MYSQL_DATABASE>_testing`) | `pagebuilder_test`, `change-me-test` |
| `NGINX_PORT` | host port (csak `127.0.0.1`) | `8080` |

A jelszavakat helyi használatra a placeholder is megteszi; máshol az első indítás előtt cseréld le. A MySQL a jelszavakat csak az első indításkor olvassa: utólagos csere az adat-volume törlését igényli (`docker compose down -v`, adatvesztés).

### Ellenőrzés

`bash scripts/smoke.sh` (a repó gyökeréből): minden szolgáltatás healthy, `/up`, SPA, majd egy felhasználói út az API-n: regisztráció, webhely, oldal, publikálás (queue és worker), a publikált oldal kiszolgálása. Hibánál nem nulla kilépési kóddal áll le. Ugyanezt futtatja a CI `install` jobja tiszta checkouton.

### Monitoring (opcionális profil)

`docker compose --profile monitoring up -d --wait` a futó stack mellé indítja a Prometheust, a blackbox exportert és a Grafanát (az alap `docker compose up` nem indítja őket). Csak `127.0.0.1`-en érhetők el: Grafana http://localhost:3000 (`admin`, jelszó: `GRAFANA_ADMIN_PASSWORD`, placeholder az `.env.example`-ben), Prometheus http://localhost:9090. A dashboard: „PageBuilder – SLO (szintetikus)" (felül a szintetikus SLO-k, alul külön sorban a valódi forgalom az Nginx naplójából, `layer=real`). Leírás és SLO-k: [DevOps](docs/devops.md#monitoring-helyi-megvalósítva). Ellenőrzés: `bash scripts/monitoring-check.sh` (elkülönített projekten).

### Backup és restore (MySQL)

- `bash scripts/backup.sh`: mentés a futó stackről a `backups/` mappába (`<db>-<UTC>.sql.gz` és `.sha256`; a mappa nincs verziókezelésben, mert valódi adatot tartalmazhat). Csak olvas, az app-felhasználóval fut. Ütemezéshez a `cron` (Linux, macOS) vagy a Windows Feladatütemező hívhatja a szkriptet; beépített ütemezés nincs.
- `bash scripts/restore.sh backups/<mentés>.sql.gz`: ellenőrzi a checksumot, majd külön `<db>_restore` adatbázisba tölt, és táblánként (sorszám, `CHECKSUM TABLE`) összeveti az élő adatbázissal. Az élő adatbázis felülírása csak `--live` és `CONFIRM_RESTORE_LIVE=yes` mellett lehetséges (destruktív; előtte `docker compose stop backend worker`, utána `docker compose up -d --wait backend worker && docker compose restart nginx`: az Nginx induláskor oldja fel a backend címét, az újraindított backend új IP-t kaphat, és enélkül 502 a válasz).
- Hatókör: csak a MySQL; a publikált oldalak újragenerálhatók, a Redis nincs mentve. A teljes gyakorlat (adatvesztés, élő visszaállítás, mért RPO és RTO): `bash scripts/recovery-drill.sh` az elkülönített `pagebuilder-recovery` projekten, mesterséges adattal; a fejlesztői adataidhoz nem nyúl.

### E2E tesztek (Playwright)

`bash scripts/e2e.sh`: elkülönített Compose-projektben (`pagebuilder-e2e`, saját adatbázis, volume-ok és a 18081-es port; a fejlesztői stack és adatai érintetlenek) indítja a stacket, lefuttatja a Chromium-teszteket, majd csak ezt a projektet takarítja, hiba esetén is. Az első futás letölti a pinnelt Playwright image-et. A riport: `e2e/playwright-report/` (`npx playwright show-report` vagy a `index.html` megnyitása). Folyamatok (`e2e/tests/`, Chromium, 1 worker, mind saját felhasználóval és adattal, ezért külön is futtathatók): szerkesztés és mentés (oldalfrissítés után is ellenőrizve), publikálás és a publikált oldal tartalma, hibaút (hibás belépés; oldal nélküli webhely publikálása). Egyes tesztek: `E2E_ARGS="tests/errors.spec.ts" bash scripts/e2e.sh`. Az `e2e/e2e.env` csak placeholder értékeket tartalmaz; a regisztráció és belépés percenkénti korlátja itt 100 (`AUTH_THROTTLE_PER_MINUTE`), máshol 5.

### Hibaelhárítás

- `másold a .env.example-t .env néven`: hiányzik a `.env`.
- Foglalt port: `NGINX_PORT` átírása a `.env`-ben, majd `docker compose up -d --wait`.
- `/up` 500-as hibát ad Linuxon: a PHP-FPM (`www-data`) nem ír a hoszt felhasználójának `storage/` könyvtárába; a fenti `chmod` lépés pótolja.
- Docker Desktopon a bind mount lassú, és az első kérések átmenetileg `I/O error`-ral hibázhatnak (Laravel-napló): várj, majd futtasd újra a smoke tesztet.
- A smoke teszt minden futáskor új felhasználót regisztrál; a regisztráció és belépés korlátja 5/perc, ezért 429 esetén várj egy percet.
- Leállítás: `docker compose down` (a `-v` az adat-volume-okat is törli).

### Egyéb

- Fut: `mysql`, `redis`, `backend` (PHP-FPM), `worker` (Redis queue), `frontend` (Vite), `nginx`.
- A hitelesítő adatok és a teszt-adatbázis részletei: [DevOps](docs/devops.md#lokális-környezet-docker-compose).
- A teszt-adatbázist új MySQL volume-on az init szkript hozza létre. Korábbi (T1.3/1-es) volume esetén, adatvesztés nélkül: `docker compose up -d --wait mysql`, majd `docker compose exec mysql sh /docker-entrypoint-initdb.d/01-testing-db.sh`.
- Ellenőrzések (konténerből; a `check:*`/`*:check` és a `lint` (backend) nem módosít fájlt):

  | | Lint | Formázás | Teszt |
  |---|---|---|---|
  | Backend | `docker compose exec backend composer lint` (Pint) | `… composer format` | `… composer test` (Pest) |
  | Frontend | `docker compose exec frontend npm run check:lint` (Oxlint, ESLint) | `… npm run format:check`; javítás: `npm run lint`, `npm run format` | `… npm run test:unit -- --run`, `npm run type-check` |

- A worker a kódot induláskor tölti be: backend-módosítás után `docker compose restart worker`.
- Leállítás: `docker compose down` (a `-v` az adat-volume-okat is törli).

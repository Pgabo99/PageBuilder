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

## Indítás

Követelmény: Docker (Compose v2) és Git; minden parancs konténerben fut. A lenti parancsok POSIX shellt igényelnek (Windows: Git Bash).

```sh
cp .env.example .env                                         # a jelszavakat cseréld le
[ -f backend/.env ] || cp backend/.env.example backend/.env
docker compose build
docker compose run --rm --no-deps backend composer install
docker compose run --rm --no-deps frontend npm ci
docker compose run --rm --no-deps backend sh -c 'grep -q "^APP_KEY=." .env || php artisan key:generate'
docker compose up -d --wait                                  # minden szolgáltatás healthy
docker compose exec backend php artisan migrate
docker compose exec backend php artisan test
```

- Fut: `mysql`, `redis`, `backend` (PHP-FPM), `worker` (Redis queue), `frontend` (Vite), `nginx`. Csak az Nginx érhető el a hostról: http://localhost:8080 (`NGINX_PORT`); a SPA a `/`, a Laravel az `/api`, `/sanctum`, `/up` alatt, HMR-rel. A többi szolgáltatás a [T1.3](docs/roadmap.md) további lépéseiben készül.
- A hitelesítő adatok és a teszt-adatbázis részletei: [DevOps](docs/devops.md#lokális-környezet-docker-compose).
- A teszt-adatbázist új MySQL volume-on az init szkript hozza létre. Korábbi (T1.3/1-es) volume esetén, adatvesztés nélkül: `docker compose up -d --wait mysql`, majd `docker compose exec mysql sh /docker-entrypoint-initdb.d/01-testing-db.sh`.
- Ellenőrzések (konténerből; a `check:*`/`*:check` és a `lint` (backend) nem módosít fájlt):

  | | Lint | Formázás | Teszt |
  |---|---|---|---|
  | Backend | `docker compose exec backend composer lint` (Pint) | `… composer format` | `… composer test` (Pest) |
  | Frontend | `docker compose exec frontend npm run check:lint` (Oxlint, ESLint) | `… npm run format:check`; javítás: `npm run lint`, `npm run format` | `… npm run test:unit -- --run`, `npm run type-check` |

- A worker a kódot induláskor tölti be: backend-módosítás után `docker compose restart worker`.
- Leállítás: `docker compose down` (a `-v` az adat-volume-okat is törli).

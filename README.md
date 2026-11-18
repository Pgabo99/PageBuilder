# PageBuilder

Vizuális weboldalszerkesztő egyetemi Cloud és DevOps beadandóhoz: webhelyek és oldalak előre definiált komponensekből, aszinkron statikus publikálás, előzmények és rollback.

**Stack:** Vue 3, TypeScript, Laravel, MySQL, Redis, Nginx, Docker, k3s, Argo CD, Terraform (Azure), GitHub Actions, Prometheus, Grafana.

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
docker compose run --rm --no-deps backend sh -c 'grep -q "^APP_KEY=." .env || php artisan key:generate'
docker compose up -d --wait                                  # minden szolgáltatás healthy
docker compose exec backend php artisan migrate
docker compose exec backend php artisan test
```

- Fut: `mysql`, `redis`, `backend` (PHP-FPM); a host gépen egyik sem érhető el. A többi szolgáltatás a [T1.3](docs/roadmap.md) további lépéseiben készül.
- A hitelesítő adatok és a teszt-adatbázis részletei: [DevOps](docs/devops.md#lokális-környezet-docker-compose).
- A teszt-adatbázist új MySQL volume-on az init szkript hozza létre. Korábbi (T1.3/1-es) volume esetén, adatvesztés nélkül: `docker compose up -d --wait mysql`, majd `docker compose exec mysql sh /docker-entrypoint-initdb.d/01-testing-db.sh`.
- Leállítás: `docker compose down` (a `-v` az adat-volume-okat is törli).

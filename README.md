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
- [Ütemterv](docs/roadmap.md)
- [AI audit](docs/ai-audit.md)

## Indítás

Követelmény: Docker (Compose v2) és Git.

```sh
cp .env.example .env    # a jelszavakat cseréld le
docker compose up -d --wait
docker compose ps       # minden szolgáltatás healthy
```

Jelenleg a `mysql` és a `redis` fut (T1.3/1); a host gépen egyik sem érhető el, a többi szolgáltatás a [T1.3](docs/roadmap.md) további lépéseiben készül. Leállítás: `docker compose down` (a `-v` az adat-volume-okat is törli).

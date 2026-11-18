---
paths:
  - "**/Dockerfile*"
  - "**/docker-compose*.yml"
  - "**/compose*.yml"
  - "docker/**"
  - ".github/**"
  - "infra/**"
  - "deploy/**"
  - "**/*.tf"
  - "**/.env.example"
---

# DevOps szabályok

## Fejlesztői környezet

- Docker-first: minden parancs (Composer, Artisan, npm, tesztek) konténerben fut; a gépen csak Docker és Git szükséges.
- Reprodukálható környezet: rögzített image tagek (nem `latest`), commitolt lock fájlok (`composer.lock`, `package-lock.json`, `.terraform.lock.hcl`).
- Minden szükséges változó szerepel a `.env.example`-ben, értelmes alapértékkel vagy üresen.

## Docker

- Multi-stage build a production image-eknél (build és runtime szétválasztva).
- Nem root felhasználó a runtime konténerben.
- Healthcheck minden szolgáltatáson; a függőségek `depends_on: condition: service_healthy` alapján indulnak.
- `.dockerignore` minden build kontextusban.

## CI/CD (GitHub Actions)

- Pipeline lépései: lint (Pint, ESLint, `vue-tsc`), tesztek (Pest, Playwright), biztonsági vizsgálat (függőségek, image), build, push GHCR-be.
- Image tagelés commit SHA-val és szemantikus verzióval; a rollback egy korábbi tag újratelepítése.
- Actionök rögzített verzióval, a `GITHUB_TOKEN` minimális `permissions` beállítással.
- Titkos adat csak GitHub Secrets-ből.

## Terraform

- Az infrastruktúra kódként verziózott; távoli state zárolással.
- Változók típussal és leírással; érzékeny változók `sensitive = true` jelöléssel.
- `terraform fmt` és `terraform validate` a CI-ban; `apply` csak jóváhagyás után.

## Üzemeltetés

- Strukturált (JSON) naplózás stdout/stderr-re.
- Prometheus metrikák az alkalmazásból és az infrastruktúrából; Grafana dashboardok kódként verziózva.
- Dokumentált és kipróbált MySQL backup és restore folyamat.

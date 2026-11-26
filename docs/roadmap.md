# Ütemterv (MVP)

Egyetemi beadandó: minden követelményhez a legegyszerűbb működő megoldás. A halasztott fejlesztések a [backlogban](backlog.md) vannak. Minden mérföldkőnek azonos nevű GitHub milestone felel meg; egy feladat egy kis issue.

Státusz: ✅ kész · 🔄 folyamatban

## Követelmények és megoldás

Hatókör: a rendszert nem telepítjük Azure-ba vagy más publikus felhőbe. A cél a reprodukálható futtatás és telepítés (Windows, Linux, macOS), a bizonyíték helyben vagy CI-ban futó, ténylegesen végrehajtott folyamat.

| Szempont (pont) | MVP-megoldás |
|---|---|
| Rendszerhatár (5) | rövid architektúra-ábra és rendszerhatár ([architecture.md](architecture.md)) |
| Setup és repository (5) | Compose-stack, README telepítési és futtatási útmutató (Windows, Linux, macOS), tiszta gépen reprodukálható indítás valódi secretek nélkül, branch protection, issue/PR workflow |
| CI (9) | GitHub Actions PR-ra: Pint, ESLint, `vue-tsc`, Pest, Vitest, Playwright (felhasználói út) |
| Artifact és security (7) | SHA-tagelt image-ek a GHCR-ben; Trivy (fs, image, config), `composer audit`, `npm audit` |
| Deployment és rollback (9) | a CI az image taget PR-ban írja át a `deploy/`-ban (a branch protection érvényben marad); bizonyított: a tag-bump PR (#85) és a manifesztek Trivy config vizsgálata; a kind + Argo CD szinkron igazolt (T6.4/2a); a clusteres rollback (`git revert`) **nincs bizonyítva**, a T6.4/2b nem készül el |
| GitOps (5) | sima manifestek (`deploy/`), Argo CD `Application`; bizonyított: a valódi Argo CD sync kind-en, helyben és CI-ban (T6.4/2a); a rollback **nincs bizonyítva** (a T6.4/2b nem készül el) |
| IaC (5) | Terraform (Azure VM, NSG, IP, storage) megtartva: `fmt`, `validate`, offline `terraform test` a CI-ban; `apply` nincs |
| Observability és SLO (7) | Compose-profil: Prometheus, Grafana, exporterek; két mérhető SLO (rendelkezésre állás, p95), dashboard |
| Recovery (4) | helyi backup és restore szkript; ténylegesen végrehajtott, ellenőrzött visszaállítás mért RPO/RTO-val |
| AI audit (4) | [ai-audit.md](ai-audit.md), jelentős döntések |

## Alkalmazás (MVP)

Regisztráció és bejelentkezés (Sanctum); webhelyek és oldalak CRUD, Policy-vel; szerkesztő 12 komponenstípussal (címsor H1–H6 szinttel, a szinttől független előre definiált mérettel és igazítással, szöveg (opcionálisan formázott: félkövér, dőlt, listák, link), gomb/link (kitöltött, körvonalas, halvány vagy szöveges stílussal, választható mérettel, igazítással és lekerekítéssel), kártyacsoport (választható oszlopszámmal, ikonhellyel és -mérettel, szövegigazítással, kerettel, árnyékkal, lekerekítéssel, gombhellyel és térközökkel): 1–6 kártya ikonnal, címmel, leírással és opcionális gombbal, elválasztó vonal vastagsággal, stílussal és színnel, állítható függőleges térköz (1–20 rem), értesítődoboz (információ, siker, figyelmeztetés, hiba; opcionális ikon és cím), idézet szerzővel és opcionális, linkelhető forrással, statisztikák (1–6 kiemelt érték megnevezéssel, ikonnal, előtaggal és utótaggal, animáció nélkül), közösségi média (8 platform márkaikonja és linkje, sorrendezhető), lábléc (copyright, linkek, e-mail, telefon, cím; oldalanként egy, a publikált oldal végén), becsukható részek: 1–20 rész natív details/summary elemekkel, JavaScript nélkül), a címsorhoz választható előre definiált ikonnal (20 Feather-ikon, [licenc](third-party-licenses.md)), egyszerű drag & droppal, a komponensek a `pages.content` JSON oszlopban; a webhely megjelenése: téma, kiemelőszín és egyedi színpaletta (háttér, szöveg, elsődleges szín a `websites.palette` JSON oszlopban, WCAG AA kontrasztfigyelmeztetéssel); publikálás queue jobbal statikus HTML-be, kiszolgálás `/sites/{slug}/` alatt, állapot: folyamatban / kész / hibás. A szerkesztő egységes, visszafogott animációkat használ (közös tokenek, `prefers-reduced-motion` tiszteletben tartva; a publikált accordion is smooth nyílik, ahol a böngésző támogatja), a komponensek az „+ Elem hozzáadása” kategorizált, kereshető, összecsukható választóból vehetők fel.

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
| T5.1 ✅ | Publish végpont és job: Blade → statikus HTML, állapot |
| T5.2 ✅ | Nginx `/sites/{slug}/` kiszolgálás, közös kötet |
| T5.3 ✅ | Publikálás gomb és állapot a felületen (polling) |

## M6 – Infrastruktúra és GitOps

| ID | Feladat |
|---|---|
| T6.1 ✅ | Terraform: VM k3s-sel, NSG, publikus IP, backup storage account (megtartva; `apply` nem lesz) |
| T6.2/1 ✅ | `deploy/app` manifestek (MySQL, Redis, backend, worker, Nginx, Ingress), titok nélkül |
| T6.2/2 ✅ | Argo CD `Application` és bootstrap-leírás |
| T6.3 ✅ | Telepítési és futtatási útmutató (előfeltételek, `.env`, parancsok Windows, Linux, macOS); tiszta gépen reprodukálható indítás, secret nélküli `.env.example`, `.gitattributes` |
| T6.4/1 ✅ | CI: image tag PR-ban a `deploy/`-ban (branch protection megkerülése nélkül) |
| T6.4/2a ✅ | Külön indítható CI-job: kind, Argo CD, a `deploy/app` valódi szinkronja smoke teszttel (helyben és CI-ban igazolt) |
| T6.4/2b ✖ | Deploy és rollback (`git revert`) eldobható `ci/gitops-*` ágon, smoke teszttel: **nem készül el** (hatókör-lezárás), a backlogban sincs |

## M7 – Observability és recovery

| ID | Feladat |
|---|---|
| T7.1/1 ✅ | Compose-profil (`monitoring`): Prometheus, blackbox exporter, Grafana; két mérhető szintetikus SLO (rendelkezésre állás, p95 válaszidő), dashboard |
| T7.1/2 ✅ | Valódi forgalmi metrikák az Nginx hozzáférési naplójából, külön a szintetikus rétegtől |
| T7.2 ✅ | Helyi backup és restore szkript (`mysqldump`, Compose-kötet) |
| T7.3 ✅ | Ténylegesen végrehajtott, ellenőrzött visszaállítás külön adatbázisba, mért RPO/RTO, dokumentálva |

## M8 – E2E és lezárás

| ID | Feladat |
|---|---|
| T8.1/1 ✅ | E2E-környezet: konfigurálható auth-korlát, Playwright Compose-profil, `scripts/e2e.sh`, próbateszt |
| T8.1/2 ✅ | Három folyamat (szerkesztés és mentés; publikálás; hibaút) Playwrighttal, CI `e2e` job, hibakeresési artifact |
| T8.2 ✅ | README, architektúra véglegesítése, AI audit |

## Technikai adósság

- MySQL healthcheck (`compose.yaml`): a `MYSQL_PWD` elavult (a 9.7.4-en működik); csere: `--defaults-extra-file`.
- Redis: `noeviction` mellett `maxmemory` esetén a cache-írások hibára futnak; a cache elkülönítése a backlogban.

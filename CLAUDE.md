# PageBuilder

Egyetemi Cloud és DevOps projekt: weboldalépítő alkalmazás szerkeszthető és publikált oldalakkal.

## Stack

- Frontend: Vue 3, TypeScript, Vite, Pinia
- Backend: Laravel REST API, Sanctum, Laravel Queue (Redis)
- Adatbázis: MySQL
- Infrastruktúra: Nginx, Docker Compose, Terraform, GitHub Actions, GHCR
- Tesztelés: Pest, Playwright
- Megfigyelhetőség: Prometheus, Grafana

## Tervezett könyvtárszerkezet

`backend/` (Laravel), `frontend/` (Vue), `e2e/` (Playwright), `load/` (k6), `docker/`, `deploy/` (Kustomize, Argo CD), `infra/` (Terraform, Grafana), `docs/`. Az útvonalalapú szabályok erre épülnek; ha a szerkezet változik, a `.claude/rules/*.md` `paths` mezőit is frissíteni kell.

## Kommunikáció

- Tömör, lényegre törő válaszok bevezetés, ismétlés és magától értetődő magyarázat nélkül; részletes magyarázat csak kérésre.
- Fájlba írt kódot a válasz nem ismétel meg.
- Összetett döntésnél az alternatívák röviden, előnyökkel és hátrányokkal.
- Csak szükséges fájl, dokumentáció és komment készül; a tömörség nem mehet a helyesség és a biztonság rovására.

## Nyelv

- Kommunikáció, dokumentáció, kódkomment, PHPDoc és commit üzenet: magyarul, ékezetekkel, UTF-8 kódolással.
- Azonosítók (változó, osztály, függvény, tábla, oszlop, API-végpont), fájl- és könyvtárnevek: angolul.
- Technikai naplóüzenetek angolul is lehetnek.

## Alapelvek

- KISS, DRY, SOLID, YAGNI: a legegyszerűbb működő megoldás, absztrakció csak valós igényre.
- A keretrendszerek hivatalos, aktuális konvenciói az irányadók.
- Minden változtatás a feladat hatókörén belül marad.
- A hibák kiváltó okát javítsd; a hibát a felszínen tartsd, ne kerüld meg.
- Konfigurálható értékek környezeti változóból vagy konfigurációból jönnek.
- Komment csak a „miért”-et magyarázza.

## Munkamenet

Small Issues, Small Commits, Small PRs, Small Context. Egyszerre egy GitHub issue (ütemterv-feladatnál `docs/roadmap.md` azonosítóval), saját branchen: terv → jóváhagyás → issue → implementáció → tesztek → kódellenőrzés → atomi commitok → push → PR (`Closes #`) → merge jóváhagyás után → `main` frissítése. Részletek: `.claude/rules/ai-workflow.md`.

## Szabályfájlok

A részletes szabályok a `.claude/rules/` könyvtárban vannak; a technológiaspecifikusak csak az érintett fájlok szerkesztésekor töltődnek be:
`backend.md`, `frontend.md`, `database.md`, `testing.md`, `devops.md` (útvonalalapú), `security.md`, `documentation.md`, `ai-workflow.md` (mindig érvényes).

## Skillek

- `/mattpocock-skills:grilling`: terv vagy követelmény átvilágítása implementáció előtt.
- `/mattpocock-skills:domain-modeling`: fogalomtár (`docs/GLOSSARY.md`) és a döntésnapló (`docs/architecture.md`).
- `/mattpocock-skills:tdd`: új funkció vagy hibajavítás Red-Green-Refactor ciklusban.
- `/mattpocock-skills:diagnosing-bugs`: nehezen reprodukálható hibák, teljesítményromlás.
- `/mattpocock-skills:code-review`, `/security-review`: változtatások ellenőrzése commit előtt.

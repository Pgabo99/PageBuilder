# Tesztelési stratégia

Tesztvezérelt fejlesztés (Red-Green-Refactor); hibajavításhoz regressziós teszt. A munkamódszer szabályai a `.claude/rules/testing.md`-ben vannak.

## Szintek

| Szint | Eszköz | Hatókör | Futás |
|---|---|---|---|
| Unit | Pest | linkfeloldás, renderer, manifest, validációs szabályok | PR |
| Feature | Pest (MySQL-lel, Compose-ban) | API-végpontok, Policy-k, jobok, tranzakciók | PR |
| Frontend unit | eldöntendő a T1.2 előtt (pl. Vitest, új függőség) | store-ok, composable-ok, registry | PR |
| E2E | Playwright | négy MVP folyamat | PR (Compose-stack) |
| Terhelés | k6 (Docker image) | SLO-küszöbök | kézi workflow |
| Infrastruktúra | `terraform validate`, Trivy config, smoke teszt | IaC, deploy után | PR, deploy |

## Kötelező lefedettség

- **Minden végpont:** siker, 401, 404 (más felhasználó erőforrása, IDOR), 422, és ahol releváns, 409.
- **Mentés:** atomi szinkron (a hiba közbeni rollbackje), típusonkénti validáció, idegen média- és oldalhivatkozás elutasítása, `lock_version`-ütközés.
- **Publikálás:**
  - 409 párhuzamos kérésre;
  - a dispatch csak commit után történik;
  - idempotens retry (kész release újrahasználata, sérült release újraépítése);
  - validációs hiba esetén az éles verzió változatlan;
  - beragadt deployment kezelése;
  - megőrzési szabályok.
- **Rollback:** csak saját `succeeded` deployment; manifest-ellenőrzés; újragenerálás pillanatképből; a draft változatlan.
- **Média:** MIME- és méretvalidáció, SVG tiltása, privát elérés (`X-Accel-Redirect`), közvetlen elérés tiltva, IDOR.
- **Integritás:** nincs árva polimorf sor; a backend és a frontend registry konzisztens.
- **Hitelesítés:** regisztráció, login, logout, rate limit, session-regenerálás.

## E2E folyamatok (Playwright)

1. Szerkesztés: regisztráció → webhely → oldal → komponensek hozzáadása, sorrendezése, szerkesztése → mentés → előnézet.
2. Sikeres publikálás → `/sites/{slug}/` tartalma → előzmények.
3. Sikertelen publikálás (törött link vagy hiányzó kötelező mező) → `failed` napló → az előző verzió elérhető.
4. Rollback → a régi tartalom elérhető.

Szelektorok: `getByRole`, `getByLabel`, szükség esetén `data-testid`. A tesztek függetlenek, saját adatot hoznak létre.

## Terheléses teszt (k6)

Forgatókönyvek: publikált oldal olvasása, hitelesített API-olvasás, párhuzamos publikálások különböző webhelyeken. A küszöbök az SLO-k: `http_req_failed < 1%`, `p(95) < 500ms` (API), publikálási idő p95 < 60 s. A JSON-összegzés CI-artifact. Az eredmények csak a ténylegesen lefuttatott mérésből kerülnek a dokumentációba.

## CI-kapuk

Merge csak zöld lint, Pest, Playwright és scan mellett; élesítés csak sikeres Trivy image scan után.

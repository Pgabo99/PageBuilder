---
paths:
  - "backend/tests/**"
  - "backend/phpunit.xml"
  - "frontend/**/*.spec.ts"
  - "frontend/**/*.test.ts"
  - "e2e/**"
  - "load/**"
---

# Tesztelési szabályok

## Munkamódszer

- Tesztvezérelt fejlesztés, Red-Green-Refactor: először a hibásan futó (red) teszt, majd a minimális implementáció (green), végül refaktorálás zöld tesztekkel.
- Hibajavításnál először regressziós teszt, amely reprodukálja a hibát.
- A teszt a specifikációt rögzíti: piros teszt esetén az implementációt javítsd. Teszt módosítása csak akkor indokolt, ha maga a követelmény változott, és ezt jelezd.

## Backend (Pest)

- Feature tesztek az API-végpontokra, unit tesztek az izolált logikára.
- Minden végponthoz: sikeres eset, validációs hiba (422), hitelesítés hiánya (401), nem létező erőforrás (404), és ütközés (409), ahol releváns.
- IDOR teszt: más felhasználó erőforrására 404 a válasz (a létezése sem derül ki).
- Adatbázis-állapot `RefreshDatabase`-szel, tesztadat factory-kkal.
- Futtatás: `docker compose exec backend php artisan test`.

## End-to-end (Playwright)

- A kritikus felhasználói folyamatok lefedése (regisztráció, bejelentkezés, oldal szerkesztése, publikálás).
- Szelektorok: `getByRole`, `getByLabel`, szükség esetén `data-testid`.
- A tesztek egymástól függetlenek, saját adatot hoznak létre.

## Eredmények

- Teszteredményt csak ténylegesen lefuttatott tesztről jelents, a valós kimenet alapján.

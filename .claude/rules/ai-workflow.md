# AI együttműködési szabályok

## Munka előtt

- Implementáció előtt vizsgáld meg a meglévő kódot, konvenciókat és dokumentációt.
- Összetett feladatnál írásos terv, és a felhasználó jóváhagyása a végrehajtás előtt.
- Jelentős architekturális döntésnél mutasd be az alternatívákat és következményeiket, majd várd meg a felhasználó döntését.
- Ellentmondásos vagy nem egyértelmű követelményt jelezz, mielőtt feltételezésre építenél.

## Engedélyhez kötött műveletek

- Új függőség telepítése (Composer, npm, Docker image, Terraform provider, Claude Code plugin).
- Destruktív művelet: fájl- vagy könyvtártörlés, adatbázis törlése vagy `migrate:fresh`, `docker volume rm`, `git reset --hard`, `terraform destroy`.
- Felhőerőforrás létrehozása vagy módosítása (`terraform apply`): előtte költségbecslés és külön egyeztetés.
- Push, PR-nyitás és merge: csak kifejezett felhasználói jóváhagyással. Helyi commit feature branchen jóváhagyás nélkül is készülhet; a `main`-re közvetlen commit tilos.

## Git workflow (fejlesztési feladatonként)

1. Frissített `main`-ről új branch: `feature/t<mérföldkő>-<sorszám>-<rövid-leírás>` (pl. `feature/t1-2-vue-init`); dokumentációhoz `docs/<rövid-leírás>`.
2. Terv, majd jóváhagyás.
3. Implementáció.
4. Automatizált tesztek futtatása (valós eredménnyel).
5. Kódellenőrzés (`/code-review`, szükség esetén `/security-review`), a talált hibák javítása.
6. Commitok menet közben, kis logikai egységenként, magyar üzenettel (pl. dokumentáció és kód külön), hogy ne maradjon commitolatlan munka.
7. Push.
8. Pull Request magyar címmel és leírással (`gh pr create`); assignee a felhasználó, a feladat mérföldkövének milestone-ja, illő labelek (pl. `enhancement`, `documentation`).
9. Merge csak a felhasználó jóváhagyása után.
10. A lokális `main` frissítése (`git switch main && git pull`).
11. A következő feladat csak ezután indul.

## Feladat végén

Kizárólag rövid összefoglaló, az üres pontok elhagyásával:
- Elvégzett módosítások
- Érintett fájlok
- Futtatott tesztek és eredmények
- Nyitott problémák
- Következő lépés

## AI audit napló (`docs/ai-audit.md`)

- Minden jelentős AI-javaslat bekerül: dátum, javaslat, indoklás, státusz.
- A státusz („elfogadva” / „elutasítva”) csak a felhasználó tényleges visszajelzése alapján kerül rögzítésre; addig „függőben”.
- Teszteredmény, mérés és technikai bizonyíték csak valós, ellenőrizhető forrásból kerül a naplóba.

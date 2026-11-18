# AI együttműködési szabályok

## Alapelvek

Small Issues, Small Commits, Small PRs, Small Context: kicsi, önállóan tesztelhető issue; atomi commit; könnyen átnézhető PR; csak az aktuális issue-hoz szükséges kontextus. A dokumentációs, konfigurációs és DevOps-feladatokra is vonatkozik.

MVP-beadandó: minden követelményhez a legegyszerűbb működő megoldás ([roadmap](../../docs/roadmap.md)); edge case-ekre és halasztott funkciókra ([backlog](../../docs/backlog.md)) nem készülünk előre.

## Munka előtt

- Implementáció előtt vizsgáld meg a meglévő kódot, konvenciókat és dokumentációt.
- Minden issue előtt rövid terv, és a felhasználó jóváhagyása.
- Jelentős architekturális döntésnél mutasd be az alternatívákat és következményeiket, majd várd meg a felhasználó döntését.
- Ellentmondásos vagy nem egyértelmű követelményt jelezz, mielőtt feltételezésre építenél.
- Egyszerre egy issue; későbbi funkciót ne tervezz és ne implementálj előre.

## Engedélyhez kötött műveletek

- Új függőség telepítése (Composer, npm, Docker image, Terraform provider, Claude Code plugin).
- Destruktív művelet: fájl- vagy könyvtártörlés, adatbázis törlése vagy `migrate:fresh`, `docker volume rm`, `git reset --hard`, `terraform destroy`.
- Felhőerőforrás létrehozása vagy módosítása (`terraform apply`): előtte költségbecslés és külön egyeztetés.
- Merge: csak a felhasználó jóváhagyásával. A terv jóváhagyása az issue, a branch, a commitok, a push és a PR létrehozására is felhatalmaz. A `main`-re közvetlen commit tilos.

## GitHub Issues

- Minden feladathoz magyar nyelvű issue a `.github/ISSUE_TEMPLATE/task.md` sablon szerint.
- Ütemterv-feladatnál a cím a feladatazonosítóval kezdődik (pl. „T1.2: Vue inicializálása”), a túl nagy feladat több issue-ra bomlik („T1.3/1: …”); más issue-nál az azonosító elmarad.
- Assignee a felhasználó, milestone a mérföldkő, illő labelek (pl. `enhancement`, `documentation`).

## Git workflow (issue-nként)

1. Rövid terv és jóváhagyás, majd issue.
2. Frissített `main`-ről új branch: `<típus>/<issue-szám>-<rövid-leírás>` (típus: `feature`, `fix`, `docs`, `chore`; pl. `feature/12-vue-init`). Egy branch egy issue.
3. Implementáció.
4. Automatizált tesztek futtatása (valós eredménnyel).
5. Gyors kódellenőrzés (`/code-review`); a kétirányú `/mattpocock-skills:code-review` és a `/security-review` csak nagyobb vagy biztonsági szempontból kockázatos változtatásnál. A talált hibák javítása.
6. Atomi commitok menet közben, magyar üzenettel: egy commit egy logikailag összetartozó módosítás; független módosítás nem kerül egy commitba, összetartozó nem darabolódik mesterségesen.
7. Push.
8. Pull Request egy issue-ra, magyar címmel, a `.github/pull_request_template.md` szerint (`Closes #<szám>`); assignee, milestone és labelek, mint az issue-nál.
9. Merge csak teszt, kódellenőrzés és a felhasználó jóváhagyása után.
10. A lokális `main` frissítése (`git switch main && git pull`), a merge-elt helyi branch törlése.
11. A következő issue csak ezután indul.

## Feladat végén

Kizárólag rövid összefoglaló, az üres pontok elhagyásával:
- Elvégzett módosítások
- Érintett fájlok
- Futtatott tesztek és eredmények
- Nyitott problémák
- Következő lépés

## AI audit napló (`docs/ai-audit.md`)

- Csak jelentős döntés, eltérés vagy incidens kerül bele (nem minden feladat): dátum, javaslat, indoklás, státusz.
- A státusz („elfogadva” / „elutasítva”) csak a felhasználó tényleges visszajelzése alapján kerül rögzítésre; addig „függőben”.
- Teszteredmény, mérés és technikai bizonyíték csak valós, ellenőrizhető forrásból kerül a naplóba.

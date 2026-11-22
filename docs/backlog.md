# Backlog

A beadandó után, igény szerint. A részletes, bővített terv a `docs/` többi tervfájljában van (fejlécükkel jelölve).

## Alkalmazás

- Médiafeltöltés és képkomponens; további komponenstípusok (a kártyák és a becsukható részek elkészültek); WYSIWYG
- Komponenstáblák (morph map) a JSON oszlop helyett
- Optimista zárolás (409), autosave, elhagyási figyelmeztetés
- Billentyűzetes sorrendezés
- Előnézet sandboxolt iframe-ben
- Publikálási előzmények, naplók, oldalverziók, pillanatképből rollback, atomi aktiválás, manifest
- Scheduler: beragadt publikálások, release-megőrzés, médiatörlés
- Szerepkörök; e-mail-megerősítés, jelszó-visszaállítás, 2FA, OAuth; rate limit finomhangolása
- Saját domain és aldomaines címzés

- A 419-es CSRF-újrapróbálás böngészős ellenőrzése (jelenleg csak unit teszt fedi)
- Magyar nyelvű backend-validációs üzenetek (a Laravel nyelve `en`)

## DevOps

- Tényleges kitelepítés (`terraform apply`, k3s VM), Traefik HTTPS (Let's Encrypt), VM-en kívüli (Azure Blob) backup
- Kustomize-overlayek, staging környezet
- Sealed Secrets, Key Vault, titok-rotáció
- Terraform távoli state zárolással
- cert-manager, CSP
- Gitleaks, SBOM, image-aláírás, CodeQL
- Nem root, multi-stage fejlesztői image-ek
- JSON-naplózás, Laravel `/metrics`, Alertmanager, blackbox exporter, Application Insights, Loki
- k6 terheléses mérés
- Heti automatikus restore-teszt, DR-gyakorlat, runbookok, Velero, point-in-time restore
- Redis cache elkülönítése (külön adatbázis vagy példány)
- A fejlesztői környezet válaszideje (0,4–4,5 s, Windowsos bind mount)

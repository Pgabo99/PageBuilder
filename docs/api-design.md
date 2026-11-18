# API-terv

> **Bővített terv** a beadandó utáni továbbfejlesztéshez; nem karbantartott. Az MVP-hatókör: [roadmap](roadmap.md), a halasztott elemek: [backlog](backlog.md).

REST, JSON, `/api/v1` előtag. Hitelesítés: Laravel Sanctum SPA cookie, azonos originről. Minden erőforrás-végpont Policy-vel védett; egy webhely gyerekerőforrásai (oldal, komponens, média, deployment) a webhely tulajdonosán keresztül jogosultak. Más felhasználó erőforrására 404 a válasz (az erőforrás létezése sem derül ki).

## Konvenciók

- Válasz: API Resource; listáknál `data`, `links`, `meta` (lapozás: `?page=`).
- Shallow nesting: létrehozás és listázás a szülő alatt, egyedi műveletek közvetlenül (`/pages/{page}`).
- Validáció: Form Request; hibák magyarul.
- Írási kérésekhez `X-XSRF-TOKEN` (Sanctum).

### Hibaformátum

```json
{ "message": "Az oldal időközben módosult.", "errors": { "lock_version": ["…"] } }
```

| Kód | Eset |
|---|---|
| 401 | nincs hitelesítés |
| 404 | nem létező vagy nem saját erőforrás |
| 409 | optimista zárolási ütközés; aktív deployment; használatban lévő média |
| 419 | lejárt CSRF-token |
| 422 | validációs hiba |
| 429 | rate limit |

## Végpontok

### Hitelesítés

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | CSRF-cookie |
| POST | `/api/v1/auth/register` | regisztráció és bejelentkezés (rate limit) |
| POST | `/api/v1/auth/login` | bejelentkezés, session-regenerálás (rate limit) |
| POST | `/api/v1/auth/logout` | session érvénytelenítése |
| GET | `/api/v1/user` | aktuális felhasználó |

### Webhelyek és oldalak

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET, POST | `/api/v1/websites` | saját webhelyek listája, létrehozás |
| GET, PATCH, DELETE | `/api/v1/websites/{website}` | részletek, módosítás, törlés |
| GET, POST | `/api/v1/websites/{website}/pages` | oldalak listája, létrehozás |
| PUT | `/api/v1/websites/{website}/pages/order` | oldalsorrend (`page_ids` tömb) |
| GET, PATCH, DELETE | `/api/v1/pages/{page}` | részletek, módosítás, törlés |
| GET | `/api/v1/pages/{page}/references` | az oldalra mutató belső linkek (törlés előtti figyelmeztetéshez) |

### Komponensek és előnézet

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/api/v1/component-types` | a registry típusai és alapértékei |
| GET | `/api/v1/pages/{page}/components` | az oldal komponensei sorrendben, `lock_version`-nel |
| PUT | `/api/v1/pages/{page}/components` | teljes lista mentése egy tranzakcióban |
| GET | `/api/v1/pages/{page}/preview` | a mentett draft HTML-je a közös Blade rendererrel (`text/html`) |

`PUT` kérés:

```json
{
  "lock_version": 7,
  "components": [
    { "id": 12, "type": "hero", "props": { "title": "Üdv", "alignment": "center", "cta_label": "Tovább", "cta_link_type": "internal", "cta_target_page_id": 3 } },
    { "id": null, "type": "text", "props": { "body": "**Bemutatkozás**" } }
  ]
}
```

- A tömb sorrendje adja a `position` értékét. A `null` id új komponens, a hiányzó id törlést jelent.
- A meglévő `id`-nek ehhez az oldalhoz kell tartoznia, a típus nem változhat.
- Validáció típusonként a registry szabályai szerint. Közös linkszabály: `internal` esetén azonos webhelyen lévő oldal, `external` esetén csak `https:` vagy `mailto:`.
- Minden hivatkozott `media_id` ugyanahhoz a webhelyhez tartozik.
- Eltérő `lock_version` esetén 409, és a kliens megtartja a helyi módosításokat. Siker esetén a válasz az új állapot az új `lock_version`-nel.

### Média

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET, POST | `/api/v1/websites/{website}/media` | lista, feltöltés (multipart) |
| DELETE | `/api/v1/media/{media}` | soft delete; használatban lévőnél 409 |
| GET | `/api/v1/media/{media}/file` | privát fájl |

Feltöltés: engedélyezett MIME-típusok JPEG, PNG, WebP és GIF; SVG tiltott; a maximális méret konfigurálható. A tartalom alapján ellenőrzünk, nem a kiterjesztés alapján.

A `/file` végpont a Policy-ellenőrzés után üres törzzsel és `X-Accel-Redirect: /_protected_media/{storage_path}` fejléccel válaszol. Az útvonal csak a DB-ben tárolt `storage_path`-ból képződik. Az Nginx `internal` locationje szolgálja ki, `Cache-Control: private, no-store` fejléccel.

### Deploymentek

| Metódus | Útvonal | Leírás |
|---|---|---|
| GET | `/api/v1/websites/{website}/deployments` | előzmények (lapozott) |
| POST | `/api/v1/websites/{website}/deployments` | publikálás → 202; aktív deployment esetén 409 |
| GET | `/api/v1/deployments/{deployment}` | állapot és naplók |
| POST | `/api/v1/deployments/{deployment}/rollback` | rollback erre a deploymentre → 202; csak saját webhely `succeeded` deploymentje; aktív deployment esetén 409 |

A felület az aktív deploymentet pollingolja (`GET /deployments/{id}`), amíg az állapot `queued` vagy `running`.

### Üzemeltetés

| Útvonal | Leírás |
|---|---|
| `/up` | Laravel health (DB- és Redis-ellenőrzéssel bővítve) |
| `/metrics` | Prometheus-metrikák; csak clusteren belül (az Nginx kívülről tiltja, NetworkPolicy) |

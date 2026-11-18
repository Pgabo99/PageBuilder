---
paths:
  - "backend/**/*.php"
  - "backend/composer.json"
---

# Backend szabályok (Laravel)

## Kódstílus

- PSR-12 és Laravel konvenciók; a formázást a Laravel Pint végzi (`docker compose exec backend ./vendor/bin/pint`).
- PHPDoc csak ott, ahol a típus nem fejezi ki a szándékot; nyelve magyar.

## Rétegek

- Controller: vékony; validál (Form Request), jogosultságot ellenőriz (Policy), delegál, és API Resource-szal válaszol.
- Validáció: kizárólag Form Request osztályokban.
- Válasz: API Resource / Resource Collection; nyers modell nem kerül a válaszba.
- Jogosultság: Policy osztályok, `authorize()` vagy `can` middleware; idegen erőforrásra 404 (`Response::denyAsNotFound()`).
- Üzleti logika: modellben vagy Action/Service osztályban. Service osztály akkor indokolt, ha a logika több modellt érint, vagy több belépési pontról (controller, job, command) hívják.

## Eloquent

- Kapcsolatok explicit visszatérési típussal (`HasMany`, `MorphTo` stb.).
- Eager loading (`with`, `load`) a listázó végpontokon; N+1 ellen fejlesztésben `Model::preventLazyLoading()`.
- Több táblát érintő írás `DB::transaction()`-ben.
- Mass assignment védelem: `$fillable` explicit felsorolással.

## Háttérfolyamatok (Queue)

- A jobok idempotensek: ismételt futtatás ugyanazt az állapotot eredményezi.
- `$tries`, `backoff()` és `failed()` metódus minden jobon; a hibák naplózva, nem elnyelve.
- Jobnak azonosítót adj át, ne teljes modellt, ha az állapota futásig változhat.

## API

- REST végpontok `/api/v1` előtaggal, többes számú, kebab-case erőforrásnevekkel.
- Hibaválaszok egységes JSON formátumban, megfelelő HTTP státuszkóddal.
- Hitelesítés: Laravel Sanctum (SPA cookie-alapú hitelesítés).

---
paths:
  - "backend/database/**"
  - "backend/app/Models/**"
---

# Adatbázis-szabályok

## Séma

- MVP: a felhasználók, webhelyek és oldalak relációs táblákban élnek; az oldal komponensei sorrendben, egyetlen JSON oszlopban (`pages.content`) vannak. A JSON szerkezetét az API validálja (`App\Support\PageContentRules`), az ismeretlen mezők eldobódnak.
- A relációs komponensmodell (komponenstípusonként tábla, `page_components`, polimorf kapcsolat) a `docs/backlog.md`-ben van; bevezetésekor a korábbi szabályok érvényesek: `Relation::enforceMorphMap()`, típusvalidálás a morph map alapján, a komponens és a `page_components` sor egy tranzakcióban.
- A szerkeszthető (draft) és a publikált tartalom elkülönül; a publikálás a draft állapotot másolja át, a publikált változat a draftból nem módosul közvetlenül.

## Integritás

- Idegen kulcs minden nem polimorf hivatkozáson, tudatosan választott `onDelete` viselkedéssel.
- Egyediségi megszorítás az üzleti kulcsokon (pl. `slug`, `(page_id, position)`).
- Index a gyakran szűrt és rendezett oszlopokon, valamint a polimorf oszloppáron.
- Polimorf kapcsolatoknál az adatbázis nem véd, ezért az alkalmazás igen:
  - `Relation::enforceMorphMap()` rövid, stabil típusnevekkel;
  - a komponenstípus validálása a morph map alapján;
  - a komponens és a `page_components` sor létrehozása és törlése egy tranzakcióban.

## Migrációk és seederek

- Minden sémaváltozás új migráció; a már lefutott migráció változatlan marad.
- Minden migrációnak működő `down()` metódusa van.
- Seederek és factory-k a fejlesztői és teszt adatokhoz; valós személyes adat nem kerül beléjük.

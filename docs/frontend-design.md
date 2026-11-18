# Frontend-terv

Vue 3 (`<script setup lang="ts">`), TypeScript strict, Vite, Pinia, Vue Router.

## Nézetek

| Útvonal | Nézet | Hitelesítés |
|---|---|---|
| `/login`, `/register` | bejelentkezés, regisztráció | vendég |
| `/websites` | webhelyek listája | igen |
| `/websites/:websiteId` | oldalak, média, deploymentek fülek | igen |
| `/websites/:websiteId/pages/:pageId/edit` | vizuális szerkesztő | igen |

Egy router guard irányít át a `/login`-ra; az auth állapot a `useAuthStore`-ból jön.

## Szerkesztő elrendezése

```
┌──────────────────────────────────────────────────────────────┐
│ Oldal neve   ● Mentetlen   [Mentés] [Előnézet] [Publikálás]   │
├────────────┬───────────────────────────────┬─────────────────┤
│ Komponens- │  Vászon                       │ Tulajdonságok   │
│ választó   │  ┌─────────────────────────┐  │ (a kijelölt     │
│  Hero      │  │ Hero          ↑ ↓ ✕     │  │  komponens      │
│  Szöveg    │  ├─────────────────────────┤  │  űrlapja)       │
│  Kép       │  │ Szöveg        ↑ ↓ ✕     │  │                 │
│  Gomb      │  └─────────────────────────┘  │                 │
│  Galéria   │                               │                 │
└────────────┴───────────────────────────────┴─────────────────┘
```

Keskeny képernyőn a két oldalsáv fiókként nyílik. A Publikálás és a Rollback gomb aktív deployment alatt le van tiltva.

## Állapotkezelés

| Store | Tartalom |
|---|---|
| `useAuthStore` | aktuális felhasználó, login, logout |
| `useEditorStore` | betöltött oldal, komponenslista, kijelölés, `lock_version`, mentési állapot (`clean`, `dirty`, `saving`, `saved`, `error`) |

Minden más adat (listák, deploymentek) nézetszintű, composable-on keresztül töltődik.

## Komponensregistry

A `src/editor/componentRegistry.ts` típusonként rögzíti:

```ts
interface ComponentDefinition<P> {
  type: ComponentType          // 'hero' | 'text' | 'image' | 'button' | 'gallery'
  label: string                // magyar megjelenítési név
  defaults: () => P
  canvas: Component            // vászonnézet
  inspector: Component         // tulajdonságszerkesztő
}
```

A típusokat és az alapértékeket a backend (`GET /api/v1/component-types`) is közli. Egy automatizált teszt ellenőrzi, hogy a két registry típuskészlete azonos.

## API-kommunikáció

- Egy közös kliens (`src/api/client.ts`): alap URL, `withCredentials`, XSRF-fejléc, első íráskor CSRF-cookie lekérése, egységes hibatípus (`ApiError`: státusz, üzenet, mezőhibák).
- `useAsync`-jellegű composable a loading, empty és error állapothoz.
- A 401-es válasz a `/login`-ra irányít; 409-nél a szerkesztő megtartja a helyi állapotot, és újratöltést vagy felülvizsgálatot kínál.

## Drag & drop és akadálymentesség

- Sorrendezés húzással, és alternatívaként billentyűzettel (fel/le gombok, fókuszkezelés); a változásról `aria-live` értesítés.
- A drag & drop megvalósítása (natív HTML5 vagy könyvtár) a T5.5 feladat előtt eldöntendő, mert új függőséget jelenthet.

## Előnézet

A backend `GET /pages/{page}/preview` HTML-jét sandboxolt iframe jeleníti meg (`sandbox="allow-same-origin"`, `allow-scripts` nélkül; a hitelesített képkéréseket teszt igazolja). Mentetlen módosításnál a felület figyelmeztet, hogy az előnézet és a publikálás a mentett állapotból dolgozik.

## Mentetlen módosítások

`beforeunload` és router `beforeRouteLeave` figyelmeztetés `dirty` állapotban.

## Megjelenés

Közös design tokenek CSS változókban; a vászon és a publikált kimenet azonos komponens-CSS-t használ (a backend renderer stíluslapja), így a megjelenés egyezik.

# Frontend-terv

> **Bővített terv** a beadandó utáni továbbfejlesztéshez; nem karbantartott. Az MVP-hatókör: [roadmap](roadmap.md), a halasztott elemek: [backlog](backlog.md).

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

### Design tokenek (`frontend/src/assets/main.css`)

- **Felületek:** három réteg (`--color-bg` < `--color-surface` < `--color-surface-raised`), plusz `--color-field` (űrlapmező); a mezők kerete `--color-border-strong` (legalább 3:1), a gomboké halkabb `--color-border-control`. Az akcentus egységes (indigó-ibolya, `--color-primary*`), az állapotokat áttetsző rétegek adják (`--state-hover/active`), így bármely felületen működnek.
- **Skálák:** sugár (`--radius-sm/md/lg`; a vezérlők `--radius`, a panelek `--radius-lg`), árnyék (`--shadow-xs/sm/pop`), betű (`--text-*`, `--weight-*`, `--leading-*`), ikon (`--icon-*`), térköz (`--space-*`), mozgás (`--motion-*`, `--ease`).
- **Téma:** a sötét téma önálló paletta (kék-fekete rétegek, halkabb keretek), nem a világos invertálása; minden színtokent felülír. A szöveg és az interaktív színek kontrasztja legalább 4,5, a mezőkeret legalább 3:1 – ezt a `styles.spec.ts` ellenőrzi mindkét témára.
- **Állapotszínek:** `--color-danger`, `--color-success`, `--color-warning` (a „nem mentett” jelzés borostyán, nem piros).
- **Mozgás:** `prefers-reduced-motion` esetén az animációs tokenek 0 ms-ra állnak.
- A komponensek nyers színt, sugarat vagy árnyékot nem használnak; kivétel a publikált oldal egyezését szolgáló előnézet (`PagePreview`), mert a felhasználók oldalainak megjelenése nem változik.

### Űrlapelemek

- Egységes vezérlőmagasság (`--control-height`): szöveges mező, legördülő, színminta, ikonválasztó csempe. A mező kerete `--color-border-strong`, fókuszra akcentus és `--color-primary-soft` gyűrű; a hibát `aria-invalid` és a mező alatti üzenet jelzi.
- `CheckboxField`, `RadioField`, `SwitchField`: a natív input (billentyűzet, képernyőolvasó, form) a háttérben marad, a megjelenés a közös `.choice*` CSS-ből jön (`main.css`); a kapcsoló `role="switch"`. Az ikonválasztó ugyanerre a mintára épül (`.choice__face`).

### Gombok és ikongombok

- `.btn` változatok: elsődleges (alap), `--secondary`, `--ghost` (halk), `--danger-soft` (finom veszélyes: piros szöveg, hoverre jelenik meg a háttér), `--danger` (kitöltött, csak megerősítő ablakban). Egy nézeten egy kitöltött elsődleges gomb van.
- `IconButton`: Feather ikon (`uiIcons`), kötelező `label` (aria-label és natív súgó; az ikon nem helyettesíti a megnevezést), változatok `secondary`/`ghost`/`danger`, méret `sm`/`md`. Érintőképernyőn (`pointer: coarse`) a gombok legalább 44 px-esek.

### App shell

- Fejléc (`AppHeader`): logó (akcentus jelvény ikonnal), „Webhelyeim” navigáció, belépve a `UserMenu` (avatar a név kezdőbetűivel, név, e-mail-cím, témaváltó, kijelentkezés), kijelentkezve az ikonos `ThemeToggle`. Mobilon (≤ 40 rem) csak az avatar látszik, így a fejléc nem tör sorba és nem nyúlik túl.
- `ActionMenu`: általános, ARIA `menu` szerepkörű lenyíló (nyilak, Home/End, Escape, Tab, kívülre kattintás; zárás után a fókusz a gyújtóra tér vissza); a panel `position: fixed`, szükség esetén felfelé nyílik. A tételek a `.menu__item` gombok; a kártyák és listák hárompontos menüje (U4, U9) is ezt használja.
- Konténerek: lista és adatlap `60rem`, szerkesztő `80rem` (korábban 48 és 72).

---
paths:
  - "frontend/**/*.{vue,ts,tsx,css,scss}"
  - "frontend/package.json"
  - "frontend/vite.config.ts"
  - "frontend/tsconfig*.json"
---

# Frontend szabályok (Vue 3)

## TypeScript

- `strict: true`; típus helyett `unknown` és szűkítés, ahol a típus valóban ismeretlen.
- API-válaszok típusai egy helyen (`src/types/`), a backend Resource-ok szerkezetét követve.

## Komponensek

- Kizárólag `<script setup lang="ts">` és Composition API.
- `defineProps` / `defineEmits` típusos szintaxissal.
- Egy komponens egy felelősség; az ismétlődő UI-elemek közös komponensbe kerülnek.
- Megosztott, állapotot kezelő logika composable-ba (`src/composables/useXxx.ts`).
- Pinia store csak valóban globális állapothoz (pl. hitelesített felhasználó, szerkesztett oldal); lokális állapot a komponensben marad.

## API-kommunikáció

- Minden HTTP-hívás egyetlen közös API-kliensen keresztül megy (alap URL, CSRF cookie, hibakezelés egy helyen).
- Minden adatbetöltő nézet kezeli a loading, empty és error állapotot.

## UI

- Reszponzív, mobile-first elrendezés.
- Akadálymentesség: szemantikus HTML, címkézett űrlapelemek, billentyűzetes navigáció, látható fókusz, megfelelő kontraszt.
- Egységes vizuális megjelenés közös design tokenekkel (szín, térköz, tipográfia).
- Felhasználói tartalom megjelenítése `v-html` nélkül; ha elkerülhetetlen, csak szanitizált HTML-lel.

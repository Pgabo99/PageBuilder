# Biztonság

Általános szabályok: `.claude/rules/security.md`. Ez a dokumentum a projekt-specifikus fenyegetéseket és kontrollokat rögzíti.

## Fenyegetések és kontrollok

| Fenyegetés | Kontroll |
|---|---|
| IDOR (más webhelyének elérése) | Policy minden végponton; a gyerekerőforrás a webhely tulajdonosán keresztül jogosult; idegen erőforrásra 404; tesztek |
| Idegen hivatkozás mentéskor | a `media_id` és a `target_page_id` azonos webhelyhez tartozásának validálása |
| XSS a komponensekben | Blade escaping; korlátozott Markdown (`html_input: strip`, `allow_unsafe_links: false`); URL-séma whitelist (`https`, `mailto`); nincs `v-html` szanitizálás nélkül |
| XSS feltöltött fájlon keresztül | SVG tiltva; MIME-ellenőrzés tartalom alapján; UUID fájlnév; `X-Content-Type-Options: nosniff` |
| Közös origin a publikált webhelyeken | a publikált oldalak nem tartalmaznak felhasználói JS-t; CSP a `/sites/` alatt |
| Privát média kiszivárgása | csak hitelesített végponton; `internal` Nginx-location; `Cache-Control: private, no-store`; path traversal ellen a DB-ből képzett útvonal |
| CSRF | Sanctum SPA, XSRF-cookie |
| Session-eltérítés | Secure, HttpOnly, SameSite cookie; regenerálás loginkor; érvénytelenítés logoutkor; Redis session |
| Brute force | rate limit a login és a regisztráció végponton |
| SQL injection | Eloquent és Query Builder paraméterkötéssel |
| Belső szolgáltatások kitettsége | csak a Traefik publikus; `/metrics`, Grafana, Argo CD és Prometheus csak belül; NSG; NetworkPolicy |
| Titokszivárgás | Sealed Secrets; GitHub Secrets; OIDC; Gitleaks; nincs titok a naplóban és az artifactban |
| Sérülékeny függőség vagy image | `composer audit`, `npm audit`, Trivy; HIGH/CRITICAL blokkolja az élesítést |
| Ellátási lánc a CI-ban | SHA-ra rögzített actionök, rögzített eszközverziók, minimális `permissions` |

## Jogosultsági modell

Egy tulajdonos webhelyenként (`websites.user_id`). Nincs admin és nincs megosztás. Legkisebb jogosultság: külön DB-felhasználó az alkalmazásnak, nem root konténerek, szűk Azure RBAC (backup: írás, restore: olvasás).

## Hitelesítés

Regisztráció, login, logout. A jelszópolicy központi (`Password::defaults()`, legalább 8 karakter), a jelszótárolás Laravel Hash, az e-mail cím egyedi. Opcionális: e-mail-megerősítés, jelszó-visszaállítás, 2FA, OAuth.

## Biztonsági kivételek

Scanner-kivétel csak bejegyzéssel ebben a táblában, és a megfelelő ignore fájlban (pl. `.trivyignore`), hivatkozással.

| Azonosító | Komponens | Indoklás | Jóváhagyta | Lejárat |
|---|---|---|---|---|
| — | — | — | — | — |

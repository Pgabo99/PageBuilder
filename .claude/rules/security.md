# Biztonsági szabályok

- Titkos adat (jelszó, API-kulcs, token, privát kulcs) csak környezeti változóban vagy secret store-ban; a repóba `.env.example` kerül placeholder értékekkel.
- Minden felhasználói bemenet validált (Form Request a backenden, űrlapvalidáció a frontenden is).
- SQL injection ellen: Eloquent és Query Builder paraméterkötéssel; nyers SQL csak kötött paraméterekkel.
- XSS ellen: Blade/Vue automatikus escaping; HTML-tartalom csak szanitizálva jelenik meg.
- CSRF ellen: Sanctum SPA hitelesítés CSRF cookie-val.
- IDOR ellen: minden erőforrás-hozzáférés Policy-n keresztül ellenőrzött, a lekérdezések a felhasználó saját adataira szűkítettek.
- Legkisebb jogosultság: adatbázis-felhasználó, konténer, CI token és felhőszerepkör csak a szükséges jogokat kapja.
- Hibajavításkor a biztonsági ellenőrzések (CSRF, auth middleware, policy, TLS-ellenőrzés, validáció) érvényben maradnak; ha egy ellenőrzés akadályoz, a kiváltó okot keresd meg.
- Hibaüzenet és napló nem tartalmaz titkos adatot vagy belső részletet production környezetben.

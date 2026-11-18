# Dokumentációs szabályok

- A dokumentáció magyar nyelvű, ékezetes, UTF-8 kódolású Markdown, a `docs/` könyvtárban (kivétel: gyökér `README.md`).
- Tömör stílus: ami a kódból, konfigurációból vagy `--help` kimenetből kiderül, azt ne ismételd meg; a döntések okát és a nem nyilvánvaló buktatókat rögzítsd.
- Jelentős architekturális döntés a `docs/architecture.md` döntésnaplójába kerül (döntés, részletek helye, audit-azonosító); az indoklás és az elvetett alternatívák a `docs/ai-audit.md`-ben. Külön ADR-fájl nem készül.
- A szakmai fogalmak egységes elnevezése a `docs/GLOSSARY.md` fogalomtárban.
- A kódban magyar komment csak a „miért”-et magyarázza.
- Commit üzenet: magyar, főnévi szerkezetű rövid összefoglaló sor (pl. „Laravel 13 inicializálása”, max. ~72 karakter), szükség esetén üres sor után felsorolásos részletek.
- A dokumentáció a kóddal együtt frissül: ha egy változtatás érinti a leírt viselkedést, ugyanabban a módosításban a dokumentáció is módosul.

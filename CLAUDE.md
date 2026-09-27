# KECY Žilina 2027 – web

Statický web: HTML + Tailwind CSS v4 (CLI) + vanilla JS. Build: `npm run build` → `dist/`. Nasadenie: GitHub Action `.github/workflows/deploy.yml` na GitHub Pages (push do main), alternatívne ručne cez FTP. Dev: `npm run dev` (http://localhost:5173).

- Zdroj dizajnu: Figma súbor KECY 26, frame „iPhone 17 Pro“ (node 189:74). Mobil je základ, desktop je vlastná interpretácia.
- Stránky: `src/index.html` (hlavná) a `src/registracia/index.html` (info pred prihláškou, bez formulára).
- `scripts/build.mjs`: `REGISTER_URL` (kam vedú CTA z hlavnej stránky, `/registracia/`) a `FORM_URL` (externá prihláška, tlačidlo na konci /registracia/).
- Fotky: originály v `fotky-originaly/` (gitignored) → `npm run photos` → `src/assets/img/photos/<názov>-640|1280|2400.webp`. V HTML `srcset` + `data-full` (2400 px pre lightbox). Každá fotka musí mať výstižný slovenský `alt`; v lightboxe sa popis nezobrazuje.
- Postavičky (hlavy, kontakty, baby v hero) sú komponenty z Figmy poskladané do priehľadných WebP (MCP export z Figmy vracia šedé pozadie, preto sa skladajú z vrstiev).

## Pravidlá

- Sekcia **„“Come to KECY” they said“** je schválená ako finálna. Nemeň v nej nič (HTML, CSS `.head` / `.quote-*`, JS `initQuotes`) bez výslovného súhlasu – vždy sa najprv opýtaj.

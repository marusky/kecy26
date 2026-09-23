# KECY Žilina 2026 – web

Statický web: HTML + Tailwind CSS v4 (CLI) + vanilla JS. Build: `npm run build` → `dist/` (nahráva sa ručne cez FTP). Dev: `npm run dev` (http://localhost:5173).

- Zdroj dizajnu: Figma súbor KECY 26, frame „iPhone 17 Pro“ (node 189:74). Mobil je základ, desktop je vlastná interpretácia.
- Registračné tlačidlá používajú `%REGISTER_URL%`, hodnota je v `scripts/build.mjs`.

## Pravidlá

- Sekcia **„“Come to KECY” they said“** je schválená ako finálna. Nemeň v nej nič (HTML, CSS `.head` / `.quote-*`, JS `initQuotes`) bez výslovného súhlasu – vždy sa najprv opýtaj.

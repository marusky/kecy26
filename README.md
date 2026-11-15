# KECY Žilina 2027 – web

Statická stránka: HTML + Tailwind CSS v4 + vanilla JS.

## Príkazy

```bash
npm install        # prvýkrát
npm run dev        # vývoj: http://localhost:5173 (sleduje zmeny, dostupné aj z telefónu na rovnakej wifi)
npm run build      # produkčný build do dist/
npm run photos     # fotky z fotky-originaly/ → src/assets/img/photos/ (WebP 640/1280/2400)
```

## Nasadenie

Web beží na **Cloudflare** ako Worker so statickými súbormi (`wrangler.jsonc`, rovnako ako mrshq.sk): `dist/` sa servíruje priamo z edge
na `https://kecy.ecavza.sk`. Neznáme URL dostanú `404.html` so stavom 404, hlavičky a cache sú v `src/_headers`.

Push do `main` → GitHub Actions (`.github/workflows/ci.yml`) zbuilduje web a spustí `wrangler deploy`.
Kým v repozitári nie sú secrets (nižšie), krok nasadenia sa preskočí s upozornením.

### Jednorazové nastavenie

1. **Cloudflare API token:** My Profile → API Tokens → Create Token → šablóna *Edit Cloudflare Workers*,
   Account Resources = účet, v ktorom je zóna ecavza.sk, Zone Resources = Specific zone `ecavza.sk`.
2. **GitHub (marusky/kecy26) → Settings → Secrets and variables → Actions:**
   `CLOUDFLARE_API_TOKEN` (token z bodu 1) a `CLOUDFLARE_ACCOUNT_ID` (Account ID účtu so zónou ecavza.sk).
3. **Prepnutie (pár minút výpadku kecy.ecavza.sk):** v Cloudflare → ecavza.sk → DNS zmaž záznam `kecy`
   (A 195.181.248.21, starý web 2026). Custom domain Workera nesmie mať existujúci záznam, Cloudflare si ho vytvorí sám.
   Potom spusti *Actions → CI → Run workflow*.
4. Voliteľne: GitHub Pages už netreba (*Settings → Pages* → vypnúť).

### Ručný deploy

```bash
npx wrangler login
npm run deploy
```

Nasadí lokálny build vrátane necommitnutých zmien. Bežne stačí push do `main`.

### Rollback

Cloudflare → Workers & Pages → kecy26 → Deployments → staršia verzia → *Rollback*, alebo `npx wrangler rollback`.

Adresa webu (canonical, OG, sitemap) je v `scripts/build.mjs` → `SITE_URL` (predvolene `https://kecy.ecavza.sk`).

## Štruktúra

```
src/
  index.html          – stránka
  css/main.css        – Tailwind vstup, farby, fonty, komponenty
  assets/js/main.js   – pás „viacinfo“, citáty, lightbox, video
  assets/img/         – obrázky (WebP)
  404.html, _headers  – stránka 404 a HTTP hlavičky pre Cloudflare
  robots.txt, sitemap.xml, favicon…
scripts/build.mjs     – build (kopíruje src → dist, fonty, minifikuje CSS)
```

Nová podstránka (napr. `/registracia/`) = `src/registracia/index.html` + pridať do `sitemap.xml`.

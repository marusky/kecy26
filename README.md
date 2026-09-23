# KECY Žilina 2026 – web

Statická stránka: HTML + Tailwind CSS v4 + vanilla JS.

## Príkazy

```bash
npm install        # prvýkrát
npm run dev        # vývoj: http://localhost:5173 (sleduje zmeny)
npm run build      # produkčný build do dist/
```

## Nasadenie

1. `npm run build`
2. Celý **obsah** priečinka `dist/` nahraj cez FTP do koreňa webu.

Adresa webu (canonical, OG, sitemap) je v `scripts/build.mjs` → `SITE_URL`.

## Štruktúra

```
src/
  index.html          – stránka
  css/main.css        – Tailwind vstup, farby, fonty, komponenty
  assets/js/main.js   – pás „viacinfo“, citáty, lightbox, video
  assets/img/         – obrázky (WebP)
  robots.txt, sitemap.xml, favicon…
scripts/build.mjs     – build (kopíruje src → dist, fonty, minifikuje CSS)
```

Nová podstránka (napr. `/registracia/`) = `src/registracia/index.html` + pridať do `sitemap.xml`.

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

**GitHub Pages (automaticky):** každý push do `main` spustí `.github/workflows/deploy.yml`, ktorý web zbuilduje a nasadí.
Jednorazovo: v repozitári *Settings → Pages → Source: GitHub Actions*. Vlastnú doménu (napr. `kecy.ecavza.sk`) nastavíš tamtiež
a v DNS pridáš CNAME záznam na `<používateľ>.github.io`.

**Ručne cez FTP:** `npm run build` a obsah priečinka `dist/` nahraj do koreňa webu.

Adresa webu (canonical, OG, sitemap) je v `scripts/build.mjs` → `SITE_URL` (Action ju nastaví sama).

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

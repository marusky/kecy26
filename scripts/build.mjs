// Build: src/ → dist/ (hotové na nahratie cez FTP)
//   npm run build   – jednorazový build (minifikované CSS)
//   npm run dev     – build + sledovanie zmien + lokálny server
import { spawn, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, watch, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Adresa, na ktorej stránka pobeží (canonical, OG, sitemap). GitHub Action ju nastaví sama podľa GitHub Pages.
const SITE_URL = (process.env.SITE_URL || "https://kecy.ecavza.sk").replace(/\/$/, "");
// Podcesta, ak web nebeží v koreni domény (napr. GitHub Pages bez vlastnej domény: /kecy26). Inak prázdne.
const BASE_PATH = (process.env.BASE_PATH || "").replace(/\/$/, "");
// Kam vedú tlačidlá „Registrácia“ na hlavnej stránke (tracky pridávajú ?track=english / ?track=sports).
const REGISTER_URL = "/registracia/";
// Externá prihláška (napr. emsreg.eu), na ktorú vedie tlačidlo na konci stránky /registracia/.
// Keď bude link na KECY 2027, stačí ho vložiť sem.
const FORM_URL = "https://emsreg.eu/public_otm/events/16861/registrations/landing_page"; // zatiaľ prihláška 2026

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");
const watchMode = process.argv.includes("--watch");
const buildId = Date.now().toString(36);

const fonts = {
  "bricolage-grotesque-latin.woff2": "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-standard-normal.woff2",
  "bricolage-grotesque-latin-ext.woff2": "@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-ext-standard-normal.woff2",
  "instrument-sans-latin.woff2": "@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-normal.woff2",
  "instrument-sans-latin-ext.woff2": "@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-standard-normal.woff2",
  "instrument-sans-latin-italic.woff2": "@fontsource-variable/instrument-sans/files/instrument-sans-latin-standard-italic.woff2",
  "instrument-sans-latin-ext-italic.woff2": "@fontsource-variable/instrument-sans/files/instrument-sans-latin-ext-standard-italic.woff2",
  "caveat-latin.woff2": "@fontsource-variable/caveat/files/caveat-latin-wght-normal.woff2",
  "caveat-latin-ext.woff2": "@fontsource-variable/caveat/files/caveat-latin-ext-wght-normal.woff2",
};

function copyStatic() {
  cpSync(src, dist, {
    recursive: true,
    filter: (p) => !relative(src, p).startsWith("css"),
  });
  mkdirSync(join(dist, "assets/fonts"), { recursive: true });
  for (const [name, from] of Object.entries(fonts)) {
    cpSync(join(root, "node_modules", from), join(dist, "assets/fonts", name));
  }
  // placeholdery vo všetkých HTML/XML/TXT súboroch (aj v podstránkach)
  const files = readdirSync(dist, { recursive: true }).filter((f) => /\.(html|xml|txt)$/.test(f));
  for (const file of files) {
    const p = join(dist, file);
    let text = readFileSync(p, "utf8");
    // absolútne cesty („/assets/…“, „/registracia/“, „/“) doplníme o podcestu
    if (BASE_PATH && file.endsWith(".html")) text = text.replace(/(href="|src="|srcset="|data-full="|, )\/(?!\/)/g, `$1${BASE_PATH}/`);
    writeFileSync(
      p,
      text
        .replaceAll("%SITE_URL%", SITE_URL)
        .replaceAll("%REGISTER_URL%", REGISTER_URL.startsWith("/") ? BASE_PATH + REGISTER_URL : REGISTER_URL)
        .replaceAll("%FORM_URL%", FORM_URL)
        .replaceAll("%BUILD%", buildId),
    );
  }
}

const twArgs = ["@tailwindcss/cli", "-i", "src/css/main.css", "-o", "dist/assets/css/main.css"];

rmSync(dist, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
copyStatic();

if (!watchMode) {
  const r = spawnSync("npx", [...twArgs, "--minify"], { cwd: root, stdio: "inherit" });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`✔ dist/ je pripravený (build ${buildId})`);
} else {
  spawn("npx", [...twArgs, "--watch=always"], { cwd: root, stdio: ["ignore", "inherit", "inherit"] });
  let t;
  watch(src, { recursive: true }, (_e, file) => {
    if (file?.startsWith("css")) return;
    clearTimeout(t);
    t = setTimeout(() => {
      copyStatic();
      console.log(`↻ ${file}`);
    }, 50);
  });
  await import("./serve.mjs");
}

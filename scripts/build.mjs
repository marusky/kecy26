// Build: src/ → dist/ (hotové na nahratie cez FTP)
//   npm run build   – jednorazový build (minifikované CSS)
//   npm run dev     – build + sledovanie zmien + lokálny server
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, watch, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Adresa, na ktorej stránka pobeží (canonical, OG, sitemap). Zmeň pred nasadením, ak je iná.
const SITE_URL = "https://kecy.ecavza.sk";

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
  // placeholdery v HTML/XML/TXT
  for (const file of ["index.html", "robots.txt", "sitemap.xml"]) {
    const p = join(dist, file);
    if (!existsSync(p)) continue;
    writeFileSync(p, readFileSync(p, "utf8").replaceAll("%SITE_URL%", SITE_URL).replaceAll("%BUILD%", buildId));
  }
}

const twArgs = ["@tailwindcss/cli", "-i", "src/css/main.css", "-o", "dist/assets/css/main.css"];

rmSync(dist, { recursive: true, force: true });
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

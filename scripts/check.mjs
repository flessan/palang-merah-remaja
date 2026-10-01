#!/usr/bin/env node
// PMR Wira — engineering guardrails (`npm run check`).
//
// Catches the regressions this redesign explicitly forbids:
//   * a Postgres/Neon dependency creeping back in;
//   * backend secrets leaking into the browser bundle;
//   * gradients sneaking into the "solid colours only" design system;
//   * syntax errors in Pages Functions or scripts;
//   * broken JSON/PWA metadata.
//
// Runs offline and never prints secret values.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const notes = [];

function fail(message) {
  problems.push(message);
  console.log(`  ✖ ${message}`);
}

function pass(message) {
  console.log(`  ✓ ${message}`);
}

function note(message) {
  notes.push(message);
  console.log(`  ! ${message}`);
}

function read(relative) {
  return fs.readFileSync(path.join(ROOT, relative), "utf8");
}

function exists(relative) {
  return fs.existsSync(path.join(ROOT, relative));
}

function walk(dir, extension, found = []) {
  const absolute = path.join(ROOT, dir);
  if (!fs.existsSync(absolute)) return found;
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const full = path.join(absolute, entry.name);
    if (entry.isDirectory()) walk(path.join(dir, entry.name), extension, found);
    else if (entry.isFile() && full.endsWith(extension)) found.push(path.join(dir, entry.name));
  }
  return found;
}

/* ------------------------------------------------------------------ */
console.log("\n1. Struktur modul");
const required = [
  "src/main.jsx",
  "src/app/App.jsx",
  "src/lib/api.js",
  "src/lib/content.js",
  "src/lib/media.js",
  "src/lib/utils.js",
  "src/data/fallback.js",
  "src/styles/tokens.css",
  "src/styles/base.css",
  "src/styles/layout.css",
  "src/styles/components.css",
  "src/styles/pages.css",
  "functions/_lib/telegraph.js",
  "functions/_lib/auth.js",
  "functions/_lib/content.js",
  "functions/_lib/response.js",
  "functions/api/[[path]].js",
  "shared/content.js",
  "shared/fallback.js",
  "scripts/migrate-content.mjs",
  "scripts/migrate-assets.mjs",
  "scripts/validate-telegraph.mjs",
];
for (const file of required) {
  if (exists(file)) pass(file);
  else fail(`Berkas wajib hilang: ${file}`);
}

for (const banned of ["src/main.jsx.backup", "db", "functions/_lib/admin-handler.js", "functions/_lib/fallback-legacy.js"]) {
  // `db/` and the removed legacy handler must not come back.
  if (banned === "src/main.jsx.backup") continue;
  if (exists(banned)) fail(`Berkas lama seharusnya sudah dihapus: ${banned}`);
}

const srcFiles = [...walk("src", ".js"), ...walk("src", ".jsx")];
const largest = srcFiles
  .map((file) => ({ file, lines: read(file).split("\n").length }))
  .sort((a, b) => b.lines - a.lines);
if (largest[0]) {
  if (largest[0].lines > 700) fail(`Modul terlalu besar (${largest[0].lines} baris): ${largest[0].file}`);
  else pass(`Modul terbesar ${largest[0].lines} baris (${largest[0].file})`);
}

/* ------------------------------------------------------------------ */
console.log("\n2. Tidak ada dependency Neon/Postgres");
const packageJson = JSON.parse(read("package.json"));
const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
for (const banned of ["@neondatabase/serverless", "pg", "postgres", "drizzle-orm", "prisma", "@prisma/client"]) {
  if (allDeps[banned]) fail(`Dependency database terlarang: ${banned}`);
}
if (!problems.length) pass("Tidak ada driver SQL/Postgres di package.json");

const scanTargets = [...walk("src", ".js"), ...walk("src", ".jsx"), ...walk("functions", ".js"), "index.html", "wrangler.toml", ".env.example"];
for (const file of scanTargets) {
  const content = read(file);
  if (/DATABASE_URL/.test(content)) fail(`Referensi DATABASE_URL ditemukan di ${file}`);
  if (/neon\.tech|@neondatabase/.test(content)) fail(`Referensi Neon ditemukan di ${file}`);
}
if (exists("db")) fail("Folder db/ (skema SQL) masih ada — Postgres bukan lagi backend PMR.");
if (!fs.existsSync(path.join(ROOT, "db"))) pass("Folder db/ sudah dihapus");

/* ------------------------------------------------------------------ */
console.log("\n3. Rahasia tidak bocor ke bundle browser");
const secretNames = ["TELEGRAPH_API_KEY", "TELEGRAPH_PROJECT_ID", "API_KEY_PEPPER", "ADMIN_PIN", "TG_Bot_Token", "BASIC_PASS"];
for (const file of [...walk("src", ".js"), ...walk("src", ".jsx"), "index.html"]) {
  const content = read(file);
  for (const secret of secretNames) {
    if (content.includes(secret)) fail(`Nama rahasia ${secret} muncul di ${file} (hanya boleh di functions/)`);
  }
  if (/import\.meta\.env/.test(content)) fail(`import.meta.env dipakai di ${file} — konfigurasi hanya boleh di server`);
}
if (!problems.length) pass("Tidak ada nama rahasia / import.meta.env di kode browser");

/* ------------------------------------------------------------------ */
console.log("\n4. Design system: tanpa gradient");
for (const file of walk("src", ".css")) {
  const content = read(file);
  const matches = content.match(/(linear|radial|conic)-gradient/g);
  if (matches) fail(`Gradient terdeteksi di ${file}: ${[...new Set(matches)].join(", ")}`);
  if (/border-radius:\s*(6|8)px/.test(content)) note(`Sudut 6/8px terdeteksi di ${file} — periksa apakah masih sesuai bahasa visual.`);
}
if (!problems.some((problem) => problem.includes("Gradient"))) pass("Tidak ada gradient di seluruh CSS");

/* ------------------------------------------------------------------ */
console.log("\n5. Sintaks Pages Functions & skrip");
const nodeFiles = [...walk("functions", ".js"), ...walk("scripts", ".mjs"), ...walk("shared", ".js")];
for (const file of nodeFiles) {
  try {
    execFileSync(process.execPath, ["--check", path.join(ROOT, file)], { stdio: "pipe" });
  } catch (error) {
    fail(`${file} gagal pemeriksaan sintaks: ${String(error.stderr || error.message).split("\n")[0]}`);
  }
}
if (!problems.some((problem) => problem.includes("gagal pemeriksaan sintaks"))) {
  pass(`${nodeFiles.length} berkas server/scripts bebas kesalahan sintaks`);
}

/* ------------------------------------------------------------------ */
console.log("\n6. Aset statis & PWA");
for (const file of ["public/manifest.webmanifest", "public/sitemap.xml", "public/robots.txt", "public/_redirects", "public/_headers", "public/sw.js"]) {
  if (exists(file)) pass(file);
  else fail(`Berkas statis hilang: ${file}`);
}
try {
  const manifest = JSON.parse(read("public/manifest.webmanifest"));
  if (!manifest.icons?.length) fail("manifest.webmanifest tanpa ikon");
  if (!manifest.shortcuts?.length) fail("manifest.webmanifest tanpa shortcuts");

  const missingIcons = manifest.icons
    .map((icon) => String(icon.src || "").replace(/^\//, ""))
    .filter((src) => src && !fs.existsSync(path.join(ROOT, "public", src)));
  if (missingIcons.length) fail(`Ikon manifest tidak ditemukan: ${missingIcons.join(", ")}`);
  const missingShortcuts = (manifest.shortcuts || [])
    .map((shortcut) => String(shortcut.url || ""))
    .filter((url) => !/^\/(\?tab=\w+)?$/.test(url));
  if (missingShortcuts.length) fail(`Shortcut manifest memakai rute tak dikenal: ${missingShortcuts.join(", ")}`);

  const sizes = manifest.icons.map((icon) => icon.sizes);
  if (!sizes.includes("192x192") || !sizes.includes("512x512")) {
    fail("manifest.webmanifest harus menyediakan ikon 192x192 dan 512x512 untuk instalasi PWA");
  }
  if (!problems.some((problem) => problem.includes("manifest"))) {
    pass("manifest.webmanifest valid (ikon + shortcuts + ukuran instalasi)");
  }
} catch (error) {
  fail(`manifest.webmanifest bukan JSON valid: ${error.message}`);
}

// Every URL the service worker precaches must exist in public/.
const shellMatch = read("public/sw.js").match(/const SHELL = \[([^\]]*)\]/);
if (shellMatch) {
  const shellEntries = [...shellMatch[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
  const brokenShell = shellEntries.filter((entry) => entry !== "/" && !fs.existsSync(path.join(ROOT, "public", entry.replace(/^\//, ""))));
  if (brokenShell.length) fail(`Precache service worker menunjuk berkas yang tidak ada: ${brokenShell.join(", ")}`);
  else pass(`Precache service worker valid (${shellEntries.length} entri)`);
} else {
  fail("public/sw.js tidak mendeklarasikan daftar SHELL");
}
if (/pathname\.startsWith\("\/\?tab=admin"\)/.test(read("public/sw.js"))) {
  fail("public/sw.js memeriksa tab=admin lewat pathname — kueri tidak akan pernah cocok");
}

const redirects = read("public/_redirects");
for (const route of ["/profil", "/sejarah", "/uks", "/edukasi", "/galeri", "/kontak"]) {
  if (!redirects.includes(route)) fail(`_redirects kehilangan rute lama ${route}`);
}
if (!problems.some((problem) => problem.includes("_redirects"))) pass("_redirects menjaga URL lama");

const html = read("index.html");
for (const needle of ["og:title", "twitter:card", "application/ld+json", "rel=\"canonical\"", "manifest.webmanifest"]) {
  if (!html.includes(needle)) fail(`index.html kehilangan metadata SEO: ${needle}`);
}
if (!problems.some((problem) => problem.includes("SEO"))) pass("index.html mempertahankan metadata SEO & PWA");

/* ------------------------------------------------------------------ */
console.log("\n7. Konten fallback");
const fallback = read("shared/fallback.js");
if (/https?:\/\/(?!www\.instagram|wa\.me|pmr\.likesyou)/.test(fallback) && !/p\/<projectId>/.test(fallback)) {
  note("Fallback memuat URL eksternal — pastikan itu disengaja.");
}
for (const needle of ["Winda Hairani", "Adilla Hafiza", "Ruang UKS terbuka"]) {
  if (!fallback.includes(needle)) fail(`Fallback kehilangan data organisasi nyata: ${needle}`);
}
if (!problems.some((problem) => problem.includes("Fallback"))) pass("Fallback memuat data organisasi nyata (bukan placeholder)");

/* ------------------------------------------------------------------ */
console.log(`\n${problems.length ? "✖" : "✔"} npm run check: ${problems.length} masalah, ${notes.length} catatan\n`);
if (problems.length) {
  for (const problem of problems) console.log(`  - ${problem}`);
  process.exit(1);
}

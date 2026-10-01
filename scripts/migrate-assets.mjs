#!/usr/bin/env node
// PMR Wira — asset migration into Telegraph Cloud Object Storage.
//
//   node scripts/migrate-assets.mjs                     # public/gudang/** → bucket
//   node scripts/migrate-assets.mjs --from public/gudang
//   node scripts/migrate-assets.mjs --dry-run
//   node scripts/migrate-assets.mjs --force             # re-upload existing keys
//   node scripts/migrate-assets.mjs --delay 3500        # Telegram rate-limit friendly
//
// Output: scripts/.migration-output/asset-map-<ts>.json containing
//   { mapping: { "/gudang/gallery/1.jpg": "<public telegraph url>", … } }
// which `migrate-content.mjs` consumes to rewrite content references.
//
// Local files in `public/gudang/**` are NOT deleted: they remain the offline
// fallback for un-migrated content and previews.

import fs from "node:fs";
import path from "node:path";
import { createClient, log, parseArgs, requireConfig, ROOT, step, writeReport } from "./telegraph-cli.mjs";

const args = parseArgs();
const dryRun = Boolean(args["dry-run"]);
const force = Boolean(args.force);
const delay = Number(args.delay ?? 3500);
const sourceDir = path.resolve(ROOT, typeof args.from === "string" ? args.from : "public/gudang");

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

/** Folder mapping: local directory → Telegraph object prefix. */
function folderFor(relativePath) {
  const [top] = relativePath.split(path.sep);
  if (top === "logo") return "branding";
  if (top === "org") return "organization";
  if (top === "gallery") return "gallery";
  return "documents";
}

function safeKey(relativePath) {
  return relativePath
    .split(path.sep)
    .map((segment) => segment.replace(/[^\w.\-]+/g, "-").toLowerCase())
    .join("/");
}

function walk(dir, base = dir, found = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, found);
    else if (entry.isFile()) found.push(path.relative(base, full));
  }
  return found;
}

async function main() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`✖ Folder sumber tidak ditemukan: ${sourceDir}`);
    process.exit(2);
  }

  const files = walk(sourceDir).sort();
  log(`\n→ Sumber aset: ${path.relative(ROOT, sourceDir)} (${files.length} berkas)`);

  const plan = files
    .map((relative) => {
      const publicPath = `/${path.relative(path.join(ROOT, "public"), path.join(sourceDir, relative)).split(path.sep).join("/")}`;
      const folder = folderFor(relative);
      const key = `${folder}/${safeKey(relative)}`;
      const extension = path.extname(relative).toLowerCase();
      return {
        relative,
        publicPath,
        key,
        absolute: path.join(sourceDir, relative),
        contentType: MIME[extension] || "application/octet-stream",
        supported: Boolean(MIME[extension]),
      };
    })
    .filter((entry) => entry.supported);

  const skipped = files.length - plan.length;
  log(`→ ${plan.length} berkas didukung, ${skipped} dilewati (jenis tidak dikenal)`);

  if (dryRun) {
    const file = writeReport("asset-map-dry-run", { generated_at: new Date().toISOString(), dry_run: true, entries: plan.map(({ absolute, ...rest }) => rest) });
    log(`\n✔ Dry-run selesai. Rencana unggah: ${path.relative(ROOT, file)}\n`);
    return;
  }

  const config = requireConfig();
  const client = createClient(config, { delayMs: delay });

  const mapping = {};
  const report = { generated_at: new Date().toISOString(), bucket: config.bucket, uploaded: [], skipped: [], failed: [], mapping };
  let index = 0;

  for (const entry of plan) {
    index += 1;
    step(index, plan.length, `${entry.publicPath} → ${entry.key}`);

    try {
      const head = await client.headObject(entry.key);
      if (head.ok && !force) {
        mapping[entry.publicPath] = client.publicUrl(entry.key);
        report.skipped.push({ key: entry.key, reason: "sudah ada" });
        continue;
      }
    } catch {
      // HEAD 404 or transient failure: attempt the upload below.
    }

    try {
      const bytes = fs.readFileSync(entry.absolute);
      await client.putObject(entry.key, bytes, entry.contentType);
      mapping[entry.publicPath] = client.publicUrl(entry.key);
      report.uploaded.push({ key: entry.key, bytes: bytes.byteLength, from: entry.publicPath });
    } catch (cause) {
      report.failed.push({ key: entry.key, from: entry.publicPath, error: String(cause.message || cause) });
      log(`  ✖ ${cause.message}`);
      if (cause.status === 429) {
        log("  … rate limit Telegram tercapai, menunggu 60 detik sebelum lanjut");
        await new Promise((resolve) => setTimeout(resolve, 60_000));
      }
    }
  }

  const file = writeReport("asset-map", report);
  log("");
  log(`✔ Diunggah: ${report.uploaded.length} · sudah ada: ${report.skipped.length} · gagal: ${report.failed.length}`);
  log(`  Peta aset: ${path.relative(ROOT, file)}`);
  log(`  Langkah berikutnya: node scripts/migrate-content.mjs --asset-map ${path.relative(ROOT, file)}\n`);
  if (report.failed.length) process.exit(1);
}

main().catch((cause) => {
  console.error(`\n✖ Migrasi aset gagal: ${cause.message}\n`);
  process.exit(1);
});

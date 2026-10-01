#!/usr/bin/env node
// PMR Wira — content migration into Telegraph Cloud collections.
//
//   node scripts/migrate-content.mjs                 # bundled PMR content (safe default)
//   node scripts/migrate-content.mjs --from export.json
//   node scripts/migrate-content.mjs --asset-map scripts/.migration-output/asset-map-*.json
//   node scripts/migrate-content.mjs --dry-run
//   node scripts/migrate-content.mjs --force          # update documents that already exist
//
// Properties:
//   * repeatable — every document carries a stable `legacy_key`; re-running skips
//     documents that already migrated (unless --force, which updates them);
//   * non-destructive — nothing is ever deleted, and existing records are only
//     replaced when explicitly forced;
//   * offline-friendly — `--dry-run` prints the exact payloads without network.

import fs from "node:fs";
import path from "node:path";
import { buildContent, COLLECTIONS } from "../shared/content.js";
import { fallbackDocuments } from "../shared/fallback.js";
import {
  COLLECTIONS_TO_MIGRATE,
  buildDocuments,
  normaliseLegacyExport,
} from "./migrate-lib.mjs";
import { createClient, log, parseArgs, readJson, requireConfig, ROOT, slugify, step, writeReport } from "./telegraph-cli.mjs";

const args = parseArgs();
const dryRun = Boolean(args["dry-run"]);
const force = Boolean(args.force);
const only = typeof args.only === "string" ? args.only.split(",").map((value) => value.trim()) : null;

function loadSource() {
  if (typeof args.from === "string") {
    const file = path.resolve(ROOT, args.from);
    if (!fs.existsSync(file)) {
      console.error(`✖ Berkas sumber tidak ditemukan: ${file}`);
      process.exit(2);
    }
    log(`→ Sumber: ${file}`);
    return normaliseLegacyExport(readJson(file));
  }
  log("→ Sumber: konten PMR bawaan (shared/fallback.js)");
  return fallbackDocuments;
}

function loadAssetMap() {
  if (typeof args["asset-map"] === "string") {
    return readJson(args["asset-map"]);
  }
  // Fall back to the most recent map produced by migrate-assets.mjs.
  const dir = path.join(ROOT, "scripts", ".migration-output");
  if (!fs.existsSync(dir)) return null;
  const candidates = fs.readdirSync(dir).filter((name) => name.startsWith("asset-map")).sort();
  if (!candidates.length) return null;
  const file = path.join(dir, candidates[candidates.length - 1]);
  log(`→ Peta aset: ${file}`);
  return readJson(file);
}

/** Rewrites `/gudang/...` references using the asset migration map. */
function applyAssetMap(documents, map) {
  if (!map?.mapping) return { documents, replaced: 0 };
  let replaced = 0;
  const rewrite = (value) => {
    if (typeof value === "string") {
      const target = map.mapping[value];
      if (target) {
        replaced += 1;
        return target;
      }
      return value;
    }
    if (Array.isArray(value)) return value.map(rewrite);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, rewrite(entry)]));
    }
    return value;
  };
  return { documents: rewrite(documents), replaced };
}

async function main() {
  const source = loadSource();
  const { documents, keys, legacyKeys } = buildDocuments(source);
  const map = args["asset-map"] === false ? null : loadAssetMap();
  const { documents: mapped, replaced } = applyAssetMap(documents, map);

  log("");
  log("Ringkasan migrasi:");
  for (const collection of COLLECTIONS_TO_MIGRATE) {
    const count = (mapped[collection] || []).length;
    log(`  • ${collection.padEnd(14)} ${String(count).padStart(3)} dokumen`);
  }
  log(`  • referensi aset lokal diganti: ${replaced}`);

  // A quick sanity pass: every document must satisfy the shared normalisers.
  const preview = buildContent(mapped, { fallback: {}, source: "migration-preview" });
  log(`  • pratinjau konten: ${preview.announcements.length} kabar, ${preview.gallery.length} album, ${preview.guides.length} panduan, ${preview.uks.inventory.length} item UKS`);

  if (dryRun) {
    const file = writeReport("migrate-content-dry-run", { generated_at: new Date().toISOString(), keys, legacyKeys, documents: mapped });
    log(`\n✔ Dry-run selesai. Payload lengkap: ${path.relative(ROOT, file)}\n`);
    return;
  }

  const config = requireConfig();
  const client = createClient(config, { delayMs: Number(args.delay || 0) });

  // Index existing documents by their stable legacy key so re-runs are cheap.
  const existing = new Map();
  for (const collection of COLLECTIONS_TO_MIGRATE) {
    try {
      const current = await client.listAll(collection);
      for (const document of current) {
        if (document?.legacy_key) existing.set(`${collection}:${document.legacy_key}`, document);
      }
      log(`→ ${collection}: ${current.length} dokumen sudah ada`);
    } catch (cause) {
      log(`! ${collection}: gagal membaca koleksi (${cause.status || "?"}) — lanjut sebagai kosong`);
    }
  }

  const report = { generated_at: new Date().toISOString(), created: [], updated: [], skipped: [], failed: [] };
  const selected = only ? COLLECTIONS_TO_MIGRATE.filter((name) => only.includes(name)) : COLLECTIONS_TO_MIGRATE;
  const total = selected.reduce((sum, collection) => sum + (mapped[collection] || []).length, 0);
  let index = 0;

  for (const collection of selected) {
    for (const document of mapped[collection] || []) {
      index += 1;
      const key = `${collection}:${document.legacy_key}`;
      const current = existing.get(key);
      step(index, total, `${collection} → ${document.legacy_key}`);

      if (current && !force) {
        report.skipped.push({ collection, legacy_key: document.legacy_key, id: current.id });
        continue;
      }

      try {
        if (current) {
          const result = await client.patch(collection, current.id, document, { expectedVersion: current.version });
          report.updated.push({ collection, legacy_key: document.legacy_key, id: result?.data?.id || current.id });
        } else {
          const result = await client.create(collection, document, `pmr-migrate-${collection}-${slugify(document.legacy_key)}`);
          report.created.push({ collection, legacy_key: document.legacy_key, id: result?.data?.id || "" });
        }
      } catch (cause) {
        report.failed.push({ collection, legacy_key: document.legacy_key, error: String(cause.message || cause) });
        log(`  ✖ ${cause.message}`);
      }
    }
  }

  const file = writeReport("migrate-content", report);
  log("");
  log(`✔ Dibuat: ${report.created.length} · diperbarui: ${report.updated.length} · dilewati: ${report.skipped.length} · gagal: ${report.failed.length}`);
  log(`  Laporan: ${path.relative(ROOT, file)}`);
  log(`  Verifikasi dengan: node scripts/validate-telegraph.mjs\n`);
  if (report.failed.length) process.exit(1);
}

export { applyAssetMap, loadAssetMap };

main().catch((cause) => {
  console.error(`\n✖ Migrasi gagal: ${cause.message}\n`);
  process.exit(1);
});

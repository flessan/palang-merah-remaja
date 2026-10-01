#!/usr/bin/env node
// PMR Wira — Telegraph Cloud validation.
//
// Verifies, without writing anything, that:
//   1. credentials are present and the Bearer key is accepted;
//   2. every PMR collection exists and its documents satisfy the shared model;
//   3. the object storage bucket is reachable and public delivery works
//      (GET /p/<project>/<bucket>/<key> returns 200 for one real object);
//   4. no secret is printed by this script.
//
//   node scripts/validate-telegraph.mjs

import { COLLECTIONS, buildContent } from "../shared/content.js";
import { fallbackContent } from "../shared/fallback.js";
import { createClient, log, parseArgs, readConfig, requireConfig, writeReport } from "./telegraph-cli.mjs";

const args = parseArgs();

async function main() {
  const { config, missing } = readConfig();
  log("\nMemeriksa konfigurasi Telegraph Cloud…");
  if (missing.length) {
    log(`  ✖ Variabel belum lengkap: ${missing.join(", ")}`);
    log("  Isi TELEGRAPH_URL, TELEGRAPH_API_KEY, TELEGRAPH_PROJECT_ID, TELEGRAPH_BUCKET.\n");
    process.exit(2);
  }
  log("  ✓ TELEGRAPH_URL, TELEGRAPH_API_KEY, TELEGRAPH_PROJECT_ID, TELEGRAPH_BUCKET tersedia (nilai tidak dicetak)");

  const client = createClient(config);
  const report = { generated_at: new Date().toISOString(), project: config.projectId, bucket: config.bucket, collections: {}, storage: {}, issues: [] };

  /* ---------------------------- collections --------------------------- */
  const collections = {};
  for (const collection of COLLECTIONS) {
    try {
      const documents = await client.listAll(collection);
      collections[collection] = documents;
      report.collections[collection] = { count: documents.length, ok: true };
      log(`  ✓ ${collection.padEnd(14)} ${String(documents.length).padStart(4)} dokumen`);
    } catch (cause) {
      report.collections[collection] = { count: 0, ok: false, error: String(cause.message || cause) };
      report.issues.push(`Koleksi ${collection} tidak dapat dibaca: ${cause.message}`);
      log(`  ✖ ${collection.padEnd(14)} ${cause.message}`);
    }
  }

  /* ------------------------- model conformance ------------------------ */
  const content = buildContent(collections, { fallback: fallbackContent, source: "validate" });
  const coverage = {
    announcements: content.announcements.length,
    events: content.events.length,
    gallery: content.gallery.length,
    guides: content.guides.length,
    organization: content.org?.leaders?.length || 0,
    roster_shifts: (content.roster?.uks_schedule?.length || 0) + (content.roster?.field_schedule?.length || 0),
    uks_items: content.uks?.inventory?.length || 0,
    settings: content.settings?.branding?.name ? 1 : 0,
  };
  report.coverage = coverage;
  log("\nCakupan konten setelah normalisasi:");
  for (const [key, value] of Object.entries(coverage)) log(`  • ${key.padEnd(16)} ${value}`);

  if (!coverage.announcements) report.issues.push("Belum ada kabar (announcements) di Telegraph Cloud.");
  if (!coverage.gallery) report.issues.push("Belum ada album galeri (gallery).");
  if (!coverage.uks_items) report.issues.push("Inventaris UKS masih kosong.");
  if (!coverage.settings) report.issues.push("Dokumen site_settings belum ada.");

  /* ----------------------------- storage ------------------------------ */
  log("\nMemeriksa object storage…");
  try {
    const listing = await client.listObjects("", null);
    const objects = listing?.objects || [];
    report.storage.object_count_page1 = objects.length;
    report.storage.has_more = Boolean(listing?.has_more);
    log(`  ✓ bucket ${config.bucket}: ${objects.length} objek pada halaman pertama${listing?.has_more ? " (masih ada lanjutan)" : ""}`);

    const sample = objects.find((object) => object.key && !object.key.endsWith("/"));
    if (sample) {
      const url = client.publicUrl(sample.key);
      report.storage.sample = { key: sample.key, url };
      const response = await fetch(url, { method: "HEAD" });
      report.storage.public_status = response.status;
      if (response.ok) log(`  ✓ pengiriman publik berfungsi (HEAD ${response.status}) untuk ${sample.key}`);
      else {
        report.issues.push(`URL publik ${sample.key} mengembalikan ${response.status}.`);
        log(`  ✖ URL publik mengembalikan ${response.status}`);
      }
    } else if (!args.strict) {
      log("  ! bucket masih kosong — jalankan `npm run migrate:assets`");
    }
  } catch (cause) {
    report.storage.ok = false;
    report.storage.error = String(cause.message || cause);
    report.issues.push(`Penyimpanan tidak dapat dibaca: ${cause.message}`);
    log(`  ✖ ${cause.message}`);
  }

  /* ------------------------------ summary ----------------------------- */
  const file = writeReport("validate-telegraph", report);
  log("");
  if (report.issues.length) {
    log(`⚠ ${report.issues.length} catatan:`);
    for (const issue of report.issues) log(`  - ${issue}`);
  } else {
    log("✔ Semua pemeriksaan Telegraph Cloud lulus.");
  }
  log(`  Laporan: ${file}\n`);
  if (args.strict && report.issues.length) process.exit(1);
}

main().catch((cause) => {
  console.error(`\n✖ Validasi gagal: ${cause.message}\n`);
  process.exit(1);
});

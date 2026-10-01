// Shared helpers for the PMR migration/validation scripts.
//
// These scripts are the ONLY place outside the Pages Functions that speaks to
// Telegraph Cloud, and they run on a developer machine or CI — never in the
// browser. Credentials come from the environment and are never printed.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const OUTPUT_DIR = path.join(ROOT, "scripts", ".migration-output");

export function readConfig(env = process.env) {
  const config = {
    url: String(env.TELEGRAPH_URL || "").trim().replace(/\/+$/, ""),
    apiKey: String(env.TELEGRAPH_API_KEY || "").trim(),
    projectId: String(env.TELEGRAPH_PROJECT_ID || "").trim(),
    bucket: String(env.TELEGRAPH_BUCKET || "pmr-assets").trim(),
  };
  const missing = [];
  if (!config.url) missing.push("TELEGRAPH_URL");
  if (!config.apiKey) missing.push("TELEGRAPH_API_KEY");
  if (!config.projectId) missing.push("TELEGRAPH_PROJECT_ID");
  if (!config.bucket) missing.push("TELEGRAPH_BUCKET");
  return { config, missing };
}

export function requireConfig() {
  const { config, missing } = readConfig();
  if (missing.length) {
    console.error(`\n✖ Variabel lingkungan belum lengkap: ${missing.join(", ")}`);
    console.error("  Set nilai tersebut (jangan di-commit), lalu jalankan ulang.\n");
    process.exit(2);
  }
  return config;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      const [name, inline] = token.slice(2).split("=");
      if (inline !== undefined) args[name] = inline;
      else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        args[name] = argv[index + 1];
        index += 1;
      } else args[name] = true;
    } else {
      args._.push(token);
    }
  }
  return args;
}

export function ensureOutputDir() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return OUTPUT_DIR;
}

export function writeReport(name, data) {
  ensureOutputDir();
  const file = path.join(OUTPUT_DIR, `${name}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  return file;
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(ROOT, file), "utf8"));
}

export function log(message) {
  console.log(message);
}

export function step(current, total, message) {
  console.log(`[${String(current).padStart(3, " ")}/${total}] ${message}`);
}

export function slugify(value, fallback = "item") {
  const slug = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || fallback;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Minimal Telegraph Cloud client for scripts (mirrors the runtime adapter but
 * with a progress callback and no timeout inheritance).
 */
export function createClient(config, { delayMs = 0, onRequest } = {}) {
  async function api(pathname, { method = "GET", body, contentType = "application/json", raw = false, extraHeaders } = {}) {
    if (delayMs && method !== "GET") await sleep(delayMs);
    const headers = { Authorization: `Bearer ${config.apiKey}`, ...(extraHeaders || {}) };
    if (!raw) headers.Accept = "application/json";
    if (body !== undefined && contentType) headers["Content-Type"] = contentType;

    const response = await fetch(`${config.url}/api${pathname}`, { method, headers, body });
    onRequest?.({ pathname, method, status: response.status });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      const error = new Error(`${method} ${pathname} → ${response.status} ${text.slice(0, 200)}`);
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  return {
    request: api,
    listCollection: async (collection, { limit = 100, cursor } = {}) => {
      const query = new URLSearchParams({ limit: String(limit) });
      if (cursor) query.set("cursor", cursor);
      return api(`/db/${encodeURIComponent(collection)}?${query}`);
    },
    listAll: async (collection) => {
      const documents = [];
      let cursor = null;
      for (let page = 0; page < 40; page += 1) {
        const result = await api(`/db/${encodeURIComponent(collection)}?limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`);
        documents.push(...(result?.data || []).map((entry) => entry?.data || entry).filter(Boolean));
        if (!result?.has_more || !result?.next_cursor) break;
        cursor = result.next_cursor;
      }
      return documents;
    },
    create: (collection, document, idempotencyKey) =>
      api(`/db/${encodeURIComponent(collection)}`, {
        method: "POST",
        body: JSON.stringify(document),
        extraHeaders: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    patch: (collection, id, patch, { idempotencyKey, expectedVersion } = {}) =>
      api(`/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ ...patch, ...(expectedVersion ? { _expected_version: expectedVersion } : {}) }),
        extraHeaders: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
      }),
    remove: (collection, id, expectedVersion) =>
      api(`/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({ _expected_version: expectedVersion }),
      }),
    listObjects: (prefix = "", cursor = null) =>
      api(`/storage/${encodeURIComponent(config.bucket)}?limit=100${prefix ? `&prefix=${encodeURIComponent(prefix)}` : ""}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
    headObject: async (key) => {
      const response = await fetch(`${config.url}/api/storage/${encodeURIComponent(config.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`, {
        method: "HEAD",
        headers: { Authorization: `Bearer ${config.apiKey}` },
      });
      return { ok: response.ok, status: response.status, headers: response.headers };
    },
    putObject: (key, bytes, contentType) =>
      api(`/storage/${encodeURIComponent(config.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`, {
        method: "PUT",
        body: bytes,
        contentType,
      }),
    publicUrl: (key) =>
      `${config.url}/p/${encodeURIComponent(config.projectId)}/${encodeURIComponent(config.bucket)}/${key.split("/").map(encodeURIComponent).join("/")}`,
  };
}

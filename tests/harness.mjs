// Shared test harness for the PMR suite (dependency-free).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function createReporter(title) {
  let passed = 0;
  const failures = [];

  function check(name, condition, detail = "") {
    if (condition) {
      passed += 1;
      console.log(`  PASS  ${name}`);
    } else {
      failures.push(detail ? `${name} — ${detail}` : name);
      console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
    }
  }

  function equal(name, actual, expected) {
    check(name, actual === expected, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }

  function summary() {
    console.log("\n========================================");
    console.log(`${title}: ${passed} PASS, ${failures.length} FAIL`);
    if (failures.length) {
      console.log("Gagal:");
      for (const failure of failures) console.log(`  - ${failure}`);
      process.exit(1);
    }
    console.log("SEMUA PEMERIKSAAN LULUS");
  }

  return { check, equal, summary, failures, get passed() { return passed; } };
}

export function jsonResponse(body, status = 200, headers = {}) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/**
 * In-memory Telegraph Cloud stand-in for the API tests.
 * Mirrors the documented shapes of /api/db/*, /api/storage/* and /p/*.
 */
export function createMockTelegraph({ failMode = null } = {}) {
  const collections = new Map();
  const objects = new Map();
  let counter = 0;
  const calls = [];

  function nextId(prefix = "rec_") {
    counter += 1;
    return `${prefix}${String(counter).padStart(4, "0")}`;
  }

  function records(collection) {
    if (!collections.has(collection)) collections.set(collection, new Map());
    return collections.get(collection);
  }

  function seed(collection, documents) {
    documents.forEach((document, index) => {
      const id = `${collection.slice(0, 3)}_${String(index + 1).padStart(3, "0")}`;
      records(collection).set(id, { data: { ...document, id }, version: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    });
  }

  const fetchImpl = async (input, init = {}) => {
    const url = typeof input === "string" ? new URL(input) : new URL(input.url);
    const method = (init.method || "GET").toUpperCase();
    const pathname = url.pathname;
    calls.push({ method, pathname, search: url.search });

    if (failMode === "all" ) throw new Error("mock network failure");
    if (failMode === "db" && pathname.startsWith("/api/db")) throw new Error("mock db failure");
    if (failMode === "storage" && pathname.startsWith("/api/storage")) throw new Error("mock storage failure");

    // Public delivery
    if (pathname.startsWith("/p/") && (method === "GET" || method === "HEAD")) {
      const parts = pathname.split("/").filter(Boolean); // p, project, bucket, ...key
      const key = parts.slice(3).map(decodeURIComponent).join("/");
      const object = objects.get(key);
      if (!object) return new Response("not found", { status: 404 });
      return new Response(method === "HEAD" ? null : object.bytes, {
        status: 200,
        headers: { "Content-Type": object.contentType, ETag: `"${object.version}"` },
      });
    }

    if (pathname.startsWith("/api/storage")) {
      const parts = pathname.split("/").filter(Boolean); // api, storage, bucket, ...key
      const key = parts.slice(3).map(decodeURIComponent).join("/");
      if (!key) {
        const prefix = url.searchParams.get("prefix") || "";
        const list = [...objects.entries()]
          .filter(([name]) => name.startsWith(prefix) && !name.endsWith("/"))
          .map(([name, object]) => ({
            bucket: parts[2],
            key: name,
            size: object.bytes.byteLength,
            content_type: object.contentType,
            updated_at: object.updatedAt,
            metadata: object.metadata || {},
          }));
        return jsonResponse({ objects: list, limit: 100, order: "key:asc", has_more: false });
      }
      if (method === "PUT") {
        const bytes = new Uint8Array(typeof init.body === "string" ? Buffer.from(init.body) : init.body);
        objects.set(key, {
          bytes,
          contentType: init.headers?.["Content-Type"] || "application/octet-stream",
          version: 1,
          updatedAt: new Date().toISOString(),
          metadata: {},
        });
        return jsonResponse({ bucket: parts[2], key, size: bytes.byteLength, version: 1 }, 201);
      }
      if (method === "HEAD") {
        const object = objects.get(key);
        if (!object) return new Response(null, { status: 404 });
        return new Response(null, { status: 200, headers: { "Content-Type": object.contentType, "Content-Length": String(object.bytes.byteLength) } });
      }
      if (method === "GET") {
        const object = objects.get(key);
        if (!object) return new Response("not found", { status: 404 });
        return new Response(object.bytes, { status: 200, headers: { "Content-Type": object.contentType } });
      }
      if (method === "DELETE") {
        objects.delete(key);
        return jsonResponse({ deleted: key }, 200);
      }
    }

    if (pathname.startsWith("/api/db")) {
      if (url.searchParams.get("simulate") === "invalid") {
        return new Response("<html>not json</html>", { status: 200, headers: { "Content-Type": "application/json" } });
      }
      const parts = pathname.split("/").filter(Boolean); // api, db, collection, id?
      const collection = decodeURIComponent(parts[2] || "");
      const id = parts[3] ? decodeURIComponent(parts[3]) : null;

      if (!collection) return jsonResponse({ error: "invalid_collection" }, 400);

      if (!id) {
        if (method === "GET") {
          const entries = [...records(collection).entries()].map(([recordId, record]) => ({
            data: { ...record.data, id: recordId },
            version: record.version,
          }));
          return jsonResponse({ data: entries, limit: 100, order: "id:asc", has_more: false });
        }
        if (method === "POST") {
          const body = init.body ? JSON.parse(init.body) : {};
          const recordId = nextId("rec_");
          const record = { data: { ...body, id: recordId }, version: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
          records(collection).set(recordId, record);
          return jsonResponse({ data: record.data, version: 1, created_at: record.created_at, updated_at: record.updated_at }, 201, { Location: `/api/db/${collection}/${recordId}` });
        }
        return jsonResponse({ error: "method_not_allowed" }, 405);
      }

      const record = records(collection).get(id);
      if (method === "GET") {
        if (!record) return jsonResponse({ error: "record_not_found" }, 404);
        return jsonResponse({ data: { ...record.data, id }, version: record.version });
      }
      if (method === "PATCH") {
        if (!record) return jsonResponse({ error: "record_not_found" }, 404);
        const body = init.body ? JSON.parse(init.body) : {};
        if (!Number.isSafeInteger(body._expected_version)) return jsonResponse({ error: "precondition_required" }, 428);
        if (body._expected_version !== record.version) return jsonResponse({ error: "version_conflict" }, 409);
        const { _expected_version, ...patch } = body;
        record.data = { ...record.data, ...patch, id };
        record.version += 1;
        return jsonResponse({ data: record.data, version: record.version });
      }
      if (method === "DELETE") {
        if (!record) return jsonResponse({ error: "record_not_found" }, 404);
        records(collection).delete(id);
        return jsonResponse({ data: { id, deleted: true }, version: record.version + 1 });
      }
    }

    return jsonResponse({ error: "not_found" }, 404);
  };

  return { fetchImpl, collections, objects, calls, seed, records };
}

export function readDist() {
  const dist = path.join(ROOT, "dist");
  const html = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const assets = fs.readdirSync(path.join(dist, "assets"));
  const entry = assets.find((file) => file.startsWith("index") && file.endsWith(".js"));
  return { html, entry, entryPath: path.join(dist, "assets", entry), dist };
}

/**
 * The production entry is an ES module that imports a vendor chunk. jsdom can
 * only evaluate classic scripts, so the built output is re-bundled to a single
 * IIFE with the same esbuild that Vite uses — the executed code is identical.
 */
export async function bundleForJsdom(entryPath) {
  const { build } = await import("esbuild");
  const result = await build({
    entryPoints: [entryPath],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    target: "es2020",
    logLevel: "silent",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  return result.outputFiles[0].text;
}

export async function waitFor(fn, { timeout = 4000, interval = 25, label = "kondisi" } = {}) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const value = fn();
      if (value) return value;
    } catch {
      /* keep polling */
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Timeout menunggu ${label}`);
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

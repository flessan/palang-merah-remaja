/**
 * Telegraph Cloud — satu-satunya klien data & penyimpanan objek untuk proyek ini.
 *
 * Dokumentasi acuan:
 *   - https://telestorage.pages.dev/llms.txt
 *   - https://telestorage.pages.dev/openapi.json
 *
 * Catatan penting:
 *   - Ini BUKAN SQL. Tidak ada PostgreSQL / Prisma / Drizzle di proyek ini.
 *   - Kredensial hanya dibaca dari environment (TELEGRAPH_*), tidak pernah ditulis di kode.
 *   - Setiap penulisan butuh `_expected_version` (optimistic concurrency) dan
 *     mengembalikan 409 `version_conflict` bila versi sudah berubah.
 *   - Penulisan dibatasi ±20 mutasi / 60 detik per project → klien ini membatalkan
 *     penulisan yang gagal dengan backoff pendek dan mengangkat error 429 ke pemanggil.
 *
 * Modul ini adalah satu-satunya jembatan ke Telegraph Cloud; jangan membuat
 * klien kedua di tempat lain.
 */

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_PAGES = 20; // pengaman: maksimal 20 halaman × 100 dokumen
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const DOCUMENT_LIMIT_BYTES = 96 * 1024;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Baca konfigurasi Telegraph dari environment (Cloudflare Pages env / .dev.vars). */
export function telegraphConfig(env) {
  const url = String(env?.TELEGRAPH_URL || "").trim().replace(/\/+$/, "");
  const apiKey = String(env?.TELEGRAPH_API_KEY || "").trim();
  const project = String(env?.TELEGRAPH_PROJECT || "").trim();
  return { url, project, apiKey, configured: Boolean(url && apiKey) };
}

/**
 * Normalisasi bentuk record Telegraph.
 * API bisa mengembalikan `{ id, version, data }` (Record) atau
 * `{ data, version, created_at, updated_at }` (RecordResponse) — keduanya diterima.
 */
export function normalizeRecord(raw) {
  if (!raw || typeof raw !== "object") return null;
  const hasBody = raw.data && typeof raw.data === "object" && !Array.isArray(raw.data);
  const body = hasBody ? raw.data : raw;
  return {
    id: raw.id || body.id || null,
    version: Number.isFinite(raw.version) ? raw.version : Number(body.version) || 0,
    created_at: raw.created_at || body.created_at || null,
    updated_at: raw.updated_at || body.updated_at || null,
    data: { ...body },
  };
}

export class TelegraphError extends Error {
  constructor(message, { status = 0, code = "telegraph_error", payload = null } = {}) {
    super(message);
    this.name = "TelegraphError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
}

export class TelegraphClient {
  constructor(config, { fetchImpl = globalThis.fetch, timeoutMs = 12000 } = {}) {
    this.baseUrl = config.url;
    this.apiKey = config.apiKey;
    this.project = config.project;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
  }

  /** GET/POST/PATCH/DELETE dengan Bearer key, timeout, dan backoff untuk error yang aman diulang. */
  async request(path, { method = "GET", body, headers = {}, attempts = 3 } = {}) {
    const url = `${this.baseUrl}${path}`;
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            Accept: "application/json",
            ...(body === undefined ? {} : { "Content-Type": "application/json" }),
            ...headers,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.status === 204) return null;

        const text = await response.text();
        const payload = text ? safeJson(text) : null;

        if (response.ok) return payload;

        const code = payload?.error || `http_${response.status}`;
        const retryable = RETRYABLE.has(response.status) && attempt < attempts;
        if (retryable) {
          await sleep(220 * attempt * attempt);
          lastError = new TelegraphError(`Telegraph ${response.status}: ${code}`, { status: response.status, code, payload });
          continue;
        }
        throw new TelegraphError(`Telegraph ${response.status}: ${code}`, { status: response.status, code, payload });
      } catch (cause) {
        clearTimeout(timer);
        if (cause instanceof TelegraphError) throw cause;
        lastError = new TelegraphError(`Tidak dapat menghubungi Telegraph Cloud: ${cause.message}`, {
          status: 0,
          code: cause.name === "AbortError" ? "timeout" : "network_error",
        });
        if (attempt < attempts) {
          await sleep(200 * attempt);
          continue;
        }
      }
    }
    throw lastError || new TelegraphError("Permintaan Telegraph Cloud gagal.");
  }

  /* ---------------------------------------------------------------
     DATABASE DOKUMEN — CRUD generik untuk semua koleksi
  --------------------------------------------------------------- */

  /** Satu halaman dokumen: GET /api/db/{collection} */
  async list(collection, { limit = DEFAULT_LIMIT, cursor, filter } = {}) {
    const params = new URLSearchParams();
    params.set("limit", String(clampLimit(limit)));
    if (cursor) params.set("cursor", cursor);
    for (const [key, value] of Object.entries(filter || {})) {
      if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
    }
    const payload = await this.request(`/api/db/${encodeURIComponent(collection)}?${params.toString()}`);
    const records = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
    return {
      records: records.map(normalizeRecord).filter(Boolean),
      hasMore: Boolean(payload?.has_more),
      nextCursor: payload?.next_cursor || null,
    };
  }

  /** Semua dokumen (mengikuti cursor), dibatasi MAX_PAGES demi keamanan waktu respons. */
  async listAll(collection, { filter, limit = MAX_LIMIT } = {}) {
    const all = [];
    let cursor = null;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const result = await this.list(collection, { limit, cursor, filter });
      all.push(...result.records);
      if (!result.hasMore || !result.nextCursor) break;
      cursor = result.nextCursor;
    }
    return all;
  }

  /** Dokumen pertama yang cocok dengan filter exact-match (mis. `{ key: "stats" }`). */
  async findOne(collection, filter) {
    const { records } = await this.list(collection, { limit: 1, filter });
    return records[0] || null;
  }

  /** GET /api/db/{collection}/{id} */
  async get(collection, id) {
    if (!id) return null;
    try {
      const payload = await this.request(`/api/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`);
      return normalizeRecord(payload);
    } catch (cause) {
      if (cause.status === 404) return null;
      throw cause;
    }
  }

  /**
   * POST /api/db/{collection} — membuat dokumen baru.
   * `Idempotency-Key` dikirim agar percobaan ulang tidak membuat duplikat.
   */
  async create(collection, data, { idempotencyKey } = {}) {
    assertDocumentSize(data);
    const payload = await this.request(`/api/db/${encodeURIComponent(collection)}`, {
      method: "POST",
      body: data,
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    });
    return normalizeRecord(payload);
  }

  /**
   * PATCH /api/db/{collection}/{id} — memperbarui dokumen.
   * Selalu mengirim dokumen penuh + `_expected_version` (optimistic concurrency).
   */
  async update(collection, id, data, { expectedVersion } = {}) {
    assertDocumentSize(data);
    const body = { ...data };
    if (Number.isFinite(expectedVersion) && expectedVersion > 0) body._expected_version = expectedVersion;
    const payload = await this.request(`/api/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body,
    });
    return normalizeRecord(payload) || { id, version: (expectedVersion || 0) + 1, data };
  }

  /** DELETE /api/db/{collection}/{id} — tombstone berversi, butuh `_expected_version`. */
  async remove(collection, id, { expectedVersion } = {}) {
    return this.request(`/api/db/${encodeURIComponent(collection)}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      body: Number.isFinite(expectedVersion) && expectedVersion > 0 ? { _expected_version: expectedVersion } : {},
    });
  }

  /* ---------------------------------------------------------------
     OBJECT STORAGE — untuk file besar (foto), dokumen hanya menyimpan URL
  --------------------------------------------------------------- */

  /** PUT /api/storage/{bucket}/{key} — unggah/ganyang objek (maks 20 MiB). */
  async putObject(bucket, key, bytes, contentType = "application/octet-stream") {
    const response = await this.requestRaw(`/api/storage/${encodeURIComponent(bucket)}/${encodePath(key)}`, {
      method: "PUT",
      body: bytes,
      headers: { "Content-Type": contentType },
    });
    return response;
  }

  /** GET /api/storage/{bucket}/{key} — unduh objek (dipakai proxy /api/media). */
  async getObject(bucket, key, { range } = {}) {
    const response = await this.requestRaw(`/api/storage/${encodeURIComponent(bucket)}/${encodePath(key)}`, {
      method: "GET",
      headers: range ? { Range: range } : {},
      attempts: 2,
    });
    return response;
  }

  /** DELETE /api/storage/{bucket}/{key} */
  async deleteObject(bucket, key) {
    return this.requestRaw(`/api/storage/${encodeURIComponent(bucket)}/${encodePath(key)}`, { method: "DELETE", attempts: 2 });
  }

  /** Varian request() yang mengembalikan Response mentah (untuk byte objek). */
  async requestRaw(path, { method = "GET", body, headers = {}, attempts = 3 } = {}) {
    const url = `${this.baseUrl}${path}`;
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs * 3);
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers: { Authorization: `Bearer ${this.apiKey}`, ...headers },
          body,
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (response.ok || response.status === 404 || response.status === 304) return response;
        const text = await response.text();
        const code = safeJson(text)?.error || `http_${response.status}`;
        if (RETRYABLE.has(response.status) && attempt < attempts) {
          await sleep(220 * attempt * attempt);
          lastError = new TelegraphError(`Telegraph ${response.status}: ${code}`, { status: response.status, code });
          continue;
        }
        throw new TelegraphError(`Telegraph ${response.status}: ${code}`, { status: response.status, code });
      } catch (cause) {
        clearTimeout(timer);
        if (cause instanceof TelegraphError) throw cause;
        lastError = new TelegraphError(`Tidak dapat menghubungi Telegraph Cloud: ${cause.message}`, { status: 0, code: "network_error" });
        if (attempt < attempts) await sleep(200 * attempt);
      }
    }
    throw lastError || new TelegraphError("Permintaan objek Telegraph Cloud gagal.");
  }

  /** Status ringkas untuk /api/health — tidak pernah membocorkan API key. */
  async health() {
    try {
      const payload = await this.request("/api/health", { attempts: 1 });
      return { reachable: true, status: payload?.status || "ok", project: this.project || null };
    } catch (cause) {
      return { reachable: false, status: "unreachable", error: cause.code || "error", project: this.project || null };
    }
  }
}

export function createTelegraph(env, options) {
  const config = telegraphConfig(env);
  if (!config.configured) return null;
  return new TelegraphClient(config, options);
}

function clampLimit(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.trunc(numeric)));
}

function encodePath(key) {
  return String(key).split("/").map(encodeURIComponent).join("/");
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function assertDocumentSize(data) {
  const bytes = new TextEncoder().encode(JSON.stringify(data)).length;
  if (bytes > DOCUMENT_LIMIT_BYTES) {
    throw new TelegraphError(
      `Dokumen terlalu besar (${bytes} byte). Batas Telegraph Cloud ±96 KiB — simpan file besar di object storage.`,
      { status: 413, code: "document_too_large" },
    );
  }
}

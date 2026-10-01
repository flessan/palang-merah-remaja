// Telegraph Cloud client for the PMR Wira Pages Functions adapter.
//
// The browser never talks to Telegraph Cloud. Every call here happens
// server-side with the developer Bearer key taken from the Pages environment.
//
// Surfaces used (documented by Telegraph Cloud Phases 2–7):
//   GET/POST/PATCH/DELETE  /api/db/:collection[/:id]     — document database
//   GET/PUT/DELETE         /api/storage/:bucket[/:key]   — object storage
//   GET                    /p/:projectId/:bucket/:key    — public object delivery

const REQUEST_TIMEOUT_MS = 12_000;
const MAX_PAGES = 8;

export class TelegraphError extends Error {
  constructor(message, { code = "telegraph_error", status = 502, details = null } = {}) {
    super(message);
    this.name = "TelegraphError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function telegraphConfig(env = {}) {
  const url = String(env.TELEGRAPH_URL || "").trim().replace(/\/+$/, "");
  const apiKey = String(env.TELEGRAPH_API_KEY || "").trim();
  const projectId = String(env.TELEGRAPH_PROJECT_ID || "").trim();
  const bucket = String(env.TELEGRAPH_BUCKET || "pmr-assets").trim();
  return {
    url,
    apiKey,
    projectId,
    bucket,
    configured: Boolean(url && apiKey),
    storageConfigured: Boolean(url && apiKey),
  };
}

/** Human-readable configuration problems, used by /api/health and the admin. */
export function telegraphConfigIssues(env = {}) {
  const config = telegraphConfig(env);
  const issues = [];
  if (!config.url) issues.push("TELEGRAPH_URL belum diatur.");
  if (!config.apiKey) issues.push("TELEGRAPH_API_KEY belum diatur.");
  if (!config.projectId) issues.push("TELEGRAPH_PROJECT_ID belum diatur.");
  if (!config.bucket) issues.push("TELEGRAPH_BUCKET belum diatur.");
  if (!String(env.ADMIN_PIN || "").trim()) issues.push("ADMIN_PIN belum diatur (memakai PIN demo).");
  return issues;
}

function withTimeout() {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  }
  return undefined;
}

function encodeSegment(value) {
  return encodeURIComponent(String(value));
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function readErrorPayload(response) {
  const raw = await response.text().catch(() => "");
  if (!raw) return {};
  const parsed = safeJsonParse(raw);
  if (parsed && typeof parsed === "object") return parsed;
  return { error: raw.slice(0, 200) };
}

/**
 * Creates a minimal, dependency-free Telegraph Cloud client.
 * Every method throws `TelegraphError` on failure so callers can decide
 * between falling back to cached/local content or surfacing the error.
 */
export function createTelegraph(env = {}) {
  const config = telegraphConfig(env);

  async function request(path, { method = "GET", body, headers = {}, expect = "json" } = {}) {
    if (!config.configured) {
      throw new TelegraphError("Telegraph Cloud belum dikonfigurasi.", { code: "not_configured", status: 503 });
    }
    const response = await fetch(`${config.url}/api${path}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        ...headers,
      },
      body,
      signal: withTimeout(),
    }).catch((cause) => {
      throw new TelegraphError("Tidak dapat menghubungi Telegraph Cloud.", {
        code: "upstream_unreachable",
        status: 502,
        details: String(cause?.message || cause),
      });
    });

    if (!response.ok) {
      const payload = await readErrorPayload(response);
      throw new TelegraphError(payload.error || `Telegraph Cloud menolak permintaan (${response.status}).`, {
        code: payload.error || "upstream_error",
        status: response.status,
        details: payload.message || null,
      });
    }

    if (expect === "response") return response;
    if (expect === "none") return { ok: true, status: response.status, headers: response.headers };
    if (expect === "text") return { text: await response.text(), headers: response.headers };
    const text = await response.text();
    return { data: safeJsonParse(text), headers: response.headers, status: response.status };
  }

  /* ----------------------------- database ----------------------------- */

  async function listCollection(collection, { limit = 100, cursor } = {}) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (cursor) query.set("cursor", cursor);
    const { data } = await request(`/db/${encodeSegment(collection)}?${query.toString()}`);
    // An upstream response that is not the documented list shape must be treated
    // as a failure so callers can fall back instead of silently showing nothing.
    if (!data || !Array.isArray(data.data)) {
      throw new TelegraphError("Respons daftar dari Telegraph Cloud tidak dikenali.", {
        code: "invalid_response",
        status: 502,
      });
    }
    // Telegraph wraps each record as `{ data, version, created_at, … }`; the
    // adapter flattens that into one document with a `version` used for the
    // optimistic-concurrency precondition on updates.
    const records = data.data.map((entry) => {
      const source = entry?.data && typeof entry.data === "object" ? entry.data : entry || {};
      return {
        ...source,
        id: source.id || entry?.id || "",
        version: entry?.version,
        created_at: entry?.created_at || "",
        updated_at: entry?.updated_at || "",
      };
    }).filter((entry) => entry.id || Object.keys(entry).length > 3);
    return {
      documents: records,
      records,
      next_cursor: data?.next_cursor || null,
      has_more: Boolean(data?.has_more),
    };
  }

  /** Reads up to MAX_PAGES pages of one collection (Telegraph lists are bounded). */
  async function readCollection(collection, { pageSize = 100, maxPages = MAX_PAGES } = {}) {
    const collected = [];
    let cursor = null;
    for (let page = 0; page < maxPages; page += 1) {
      const result = await listCollection(collection, { limit: pageSize, cursor });
      collected.push(...result.records);
      if (!result.has_more || !result.next_cursor) break;
      cursor = result.next_cursor;
    }
    return collected;
  }

  async function getRecord(collection, id) {
    const { data } = await request(`/db/${encodeSegment(collection)}/${encodeSegment(id)}`);
    return data;
  }

  async function createRecord(collection, document, { idempotencyKey } = {}) {
    const { data } = await request(`/db/${encodeSegment(collection)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(document || {}),
    });
    return data;
  }

  /** Shallow partial update. Telegraph requires the current version precondition. */
  async function updateRecord(collection, id, patch, { idempotencyKey, expectedVersion } = {}) {
    let version = expectedVersion;
    if (!version) {
      const current = await getRecord(collection, id).catch(() => null);
      version = current?.version;
    }
    const body = { ...patch };
    if (version) body._expected_version = version;
    const { data } = await request(`/db/${encodeSegment(collection)}/${encodeSegment(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });
    return data;
  }

  async function deleteRecord(collection, id, { idempotencyKey, expectedVersion } = {}) {
    let version = expectedVersion;
    if (!version) {
      const current = await getRecord(collection, id).catch(() => null);
      version = current?.version;
    }
    if (!version) {
      throw new TelegraphError("Data tidak ditemukan atau sudah dihapus.", { code: "record_not_found", status: 404 });
    }
    const { data } = await request(`/db/${encodeSegment(collection)}/${encodeSegment(id)}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify({ _expected_version: version }),
    });
    return data;
  }

  async function replaceRecord(collection, id, document, options = {}) {
    if (!id) return createRecord(collection, document, options);
    try {
      return await updateRecord(collection, id, document, options);
    } catch (cause) {
      if (cause instanceof TelegraphError && cause.status === 404) {
        return createRecord(collection, document, options);
      }
      throw cause;
    }
  }

  /* ------------------------------ storage ----------------------------- */

  async function listObjects({ prefix = "", delimiter, limit = 100, cursor } = {}) {
    const query = new URLSearchParams({ limit: String(limit) });
    if (prefix) query.set("prefix", prefix);
    if (delimiter) query.set("delimiter", delimiter);
    if (cursor) query.set("cursor", cursor);
    const { data } = await request(`/storage/${encodeSegment(config.bucket)}?${query.toString()}`);
    if (!data || !Array.isArray(data.objects)) {
      throw new TelegraphError("Respons daftar objek tidak dikenali.", { code: "invalid_response", status: 502 });
    }
    return {
      objects: data.objects,
      common_prefixes: Array.isArray(data?.common_prefixes) ? data.common_prefixes : [],
      next_cursor: data?.next_cursor || null,
      has_more: Boolean(data?.has_more),
    };
  }

  async function listAllObjects({ prefix = "", maxPages = MAX_PAGES, pageSize = 100 } = {}) {
    const collected = [];
    let cursor = null;
    for (let page = 0; page < maxPages; page += 1) {
      const result = await listObjects({ prefix, limit: pageSize, cursor });
      collected.push(...result.objects);
      if (!result.has_more || !result.next_cursor) break;
      cursor = result.next_cursor;
    }
    return collected;
  }

  async function putObject(key, bytes, { contentType = "application/octet-stream", metadata = {}, idempotencyKey } = {}) {
    const body = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const { data } = await request(`/storage/${encodeSegment(config.bucket)}/${key.split("/").map(encodeSegment).join("/")}`, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(body.byteLength),
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
        ...Object.fromEntries(Object.entries(metadata).map(([name, value]) => [`X-Amz-Meta-${name}`, String(value)])),
      },
      body,
    });
    return data;
  }

  async function deleteObject(key) {
    const { data } = await request(
      `/storage/${encodeSegment(config.bucket)}/${key.split("/").map(encodeSegment).join("/")}`,
      { method: "DELETE", expect: "json" },
    );
    return data;
  }

  async function objectMetadata(key) {
    const response = await request(
      `/storage/${encodeSegment(config.bucket)}/${key.split("/").map(encodeSegment).join("/")}`,
      { method: "HEAD", expect: "none" },
    );
    return {
      content_type: response.headers?.get?.("Content-Type") || "application/octet-stream",
      length: Number(response.headers?.get?.("Content-Length") || 0),
      etag: response.headers?.get?.("ETag") || "",
    };
  }

  /** Returns the raw (private, credential-authenticated) object Response. */
  async function readObject(key) {
    return request(`/storage/${encodeSegment(config.bucket)}/${key.split("/").map(encodeSegment).join("/")}`, {
      method: "GET",
      expect: "response",
    });
  }

  /**
   * Public, unlisted delivery URL for an object. This is the path the browser
   * uses for images; it never carries credentials.
   */
  function publicUrl(key) {
    const cleanKey = String(key || "").replace(/^\/+/, "");
    if (!cleanKey) return "";
    const encoded = cleanKey.split("/").map(encodeSegment).join("/");
    if (!config.url || !config.projectId) return `/api/media/${encoded}`;
    return `${config.url}/p/${encodeSegment(config.projectId)}/${encodeSegment(config.bucket)}/${encoded}`;
  }

  return {
    config,
    request,
    listCollection,
    readCollection,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
    replaceRecord,
    listObjects,
    listAllObjects,
    putObject,
    deleteObject,
    objectMetadata,
    readObject,
    publicUrl,
  };
}

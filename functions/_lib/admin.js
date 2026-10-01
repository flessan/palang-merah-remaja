// Admin API for PMR Wira (server-side only).
//
//   POST   /api/admin/login              { pin } → short-lived session token
//   GET    /api/admin/data               every collection + canonical content
//   POST   /api/admin/:collection        create/update one item
//   DELETE /api/admin/:collection?id=…   delete one item
//   POST   /api/admin/content            update singleton collections
//   GET    /api/admin/assets?prefix=…    list Telegraph Cloud objects
//   POST   /api/admin/assets             multipart upload → object key + public URL
//   DELETE /api/admin/assets?key=…       tombstone one object
//   GET    /api/admin/backup             full JSON export (restore-friendly)
//   POST   /api/admin/restore            upsert a previous backup export
//
// Every route requires a valid admin session; nothing here exposes the
// Telegraph Cloud key, Telegram identifiers, or private object metadata.

import { isAdmin, createSessionToken, AUTH } from "./auth.js";
import { COLLECTIONS } from "./schema.js";
import { BUILDERS, buildSingleton, idempotencyKey, loadContent } from "./content.js";
import { TelegraphError, createTelegraph } from "./telegraph.js";
import { clean, cleanList, error, json, readJson } from "./response.js";

const ITEM_COLLECTIONS = Object.keys(BUILDERS); // announcements, events, gallery, guides
const SINGLETON_COLLECTIONS = ["organization", "roster", "uks", "site_settings"];
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml", "application/pdf"]);
const ASSET_FOLDERS = ["branding", "gallery", "organization", "documents"];

function adminOnly(request, env) {
  return json({ ok: false, error: "Sesi admin tidak valid atau sudah berakhir." }, 401, request, { headers: { "WWW-Authenticate": "Bearer" } });
}

function telegraphFailure(cause, request) {
  if (cause instanceof TelegraphError) {
    const status = cause.status === 404 ? 404 : cause.status >= 400 && cause.status < 500 ? 400 : 502;
    return error(cause.message, status, request, { code: cause.code });
  }
  // Validation failures raised by the builders carry their own 4xx status.
  const status = Number(cause?.status);
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return error(String(cause.message || "Data tidak valid."), status, request, { code: "validation_error", field: cause.field || null });
  }
  return error("Terjadi kesalahan saat menghubungi Telegraph Cloud.", 502, request, { code: "upstream_error", details: String(cause?.message || cause) });
}

async function findExistingId(telegraph, collection) {
  const records = await telegraph.readCollection(collection, { pageSize: 20, maxPages: 1 });
  const record = records[0];
  return record?.id || null;
}

function documentVersion(record) {
  return Number(record?.version || 0) || undefined;
}

/* ------------------------------------------------------------------ */
/* assets                                                             */
/* ------------------------------------------------------------------ */

function folderFor(value) {
  const folder = clean(value, 40).toLowerCase().replace(/[^a-z0-9-]/g, "");
  return ASSET_FOLDERS.includes(folder) ? folder : "gallery";
}

function safeFilename(value) {
  const base = clean(value, 120)
    .toLowerCase()
    .replace(/\.[a-z0-9]{1,5}$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "pmr-asset";
}

function extensionFor(type, filename) {
  const fromName = /\.([a-z0-9]{2,5})$/i.exec(String(filename || ""));
  if (fromName) return fromName[1].toLowerCase();
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/svg+xml": "svg",
    "application/pdf": "pdf",
  };
  return map[type] || "bin";
}

function publicAsset(telegraph, object) {
  return {
    key: object.key,
    url: telegraph.publicUrl(object.key),
    name: String(object.key || "").split("/").pop(),
    folder: String(object.key || "").split("/")[0] || "",
    size: Number(object.size || 0),
    type: clean(object.content_type, 80),
    updated_at: clean(object.updated_at, 40),
  };
}

async function handleAssets(request, env, telegraph) {
  const url = new URL(request.url);

  if (request.method === "GET") {
    const prefix = clean(url.searchParams.get("prefix"), 120);
    const folder = folderFor(url.searchParams.get("folder") || prefix.split("/")[0]);
    const search = clean(url.searchParams.get("q"), 80).toLowerCase();
    const objects = await telegraph.listAllObjects({ prefix: `${folder}/` });
    const assets = objects
      .filter((object) => object.key && !object.key.endsWith("/"))
      .map((object) => publicAsset(telegraph, object))
      .filter((asset) => !search || asset.key.toLowerCase().includes(search))
      .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    return json({ ok: true, folder, folders: ASSET_FOLDERS, assets }, 200, request);
  }

  if (request.method === "POST") {
    let form;
    try {
      form = await request.formData();
    } catch {
      return error("Unggahan harus berupa multipart/form-data.", 415, request);
    }
    const file = form.get("file");
    if (!file || typeof file === "string") return error("Berkas belum dipilih.", 422, request);
    if (file.size > MAX_UPLOAD_BYTES) return error("Ukuran berkas melebihi 8 MB.", 413, request);
    const type = clean(file.type || "application/octet-stream", 80);
    if (!ALLOWED_UPLOAD_TYPES.has(type)) return error(`Jenis berkas ${type} tidak diizinkan.`, 415, request);

    const folder = folderFor(form.get("folder"));
    const key = `${folder}/${safeFilename(form.get("name") || file.name)}-${Date.now().toString(36)}.${extensionFor(type, file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    await telegraph.putObject(key, bytes, {
      contentType: type,
      metadata: { source: "pmr-admin", folder },
      idempotencyKey: idempotencyKey("pmr-upload"),
    });

    return json({ ok: true, asset: publicAsset(telegraph, { key, size: bytes.byteLength, content_type: type, updated_at: new Date().toISOString() }) }, 201, request);
  }

  if (request.method === "DELETE") {
    const key = clean(url.searchParams.get("key") || (await readJson(request))?.key, 300);
    if (!key) return error("Parameter `key` wajib diisi.", 422, request);
    if (!ASSET_FOLDERS.some((folder) => key.startsWith(`${folder}/`))) {
      return error("Objek di luar folder PMR tidak dapat dihapus dari panel ini.", 403, request);
    }
    await telegraph.deleteObject(key);
    return json({ ok: true, deleted: key }, 200, request);
  }

  return error("Metode tidak didukung.", 405, request);
}

/* ------------------------------------------------------------------ */
/* item + singleton writes                                            */
/* ------------------------------------------------------------------ */

async function upsertItem(request, env, telegraph, collection) {
  const builder = BUILDERS[collection];
  const body = (await readJson(request)) || {};
  const payload = builder(body);
  const id = clean(body.id, 80);
  const result = await telegraph.replaceRecord(collection, id, payload, { idempotencyKey: idempotencyKey(`pmr-${collection}`) });
  return json({ ok: true, collection, id: result?.data?.id || id, item: result?.data || { id, ...payload } }, 200, request);
}

async function upsertSingleton(request, env, telegraph, collection) {
  const body = (await readJson(request)) || {};
  const payload = buildSingleton(collection, body.value ?? body);
  const existingId = await findExistingId(telegraph, collection);
  const result = await telegraph.replaceRecord(collection, existingId, payload, { idempotencyKey: idempotencyKey(`pmr-${collection}`) });
  return json({ ok: true, collection, id: result?.data?.id || existingId, item: result?.data || payload }, 200, request);
}

async function handleContentWrite(request, env, telegraph) {
  const body = (await readJson(request)) || {};
  const requested = clean(body.collection || body.key, 40).toLowerCase();
  const targets = requested
    ? SINGLETON_COLLECTIONS.filter((name) => name === requested)
    : SINGLETON_COLLECTIONS.filter((name) => body[name] !== undefined);

  if (!targets.length) {
    return error(`Koleksi tidak dikenal. Gunakan salah satu dari: ${SINGLETON_COLLECTIONS.join(", ")}.`, 422, request);
  }

  const updated = {};
  for (const collection of targets) {
    const value = requested ? body.value ?? body : body[collection];
    const payload = buildSingleton(collection, value);
    const existingId = await findExistingId(telegraph, collection);
    const result = await telegraph.replaceRecord(collection, existingId, payload, { idempotencyKey: idempotencyKey(`pmr-${collection}`) });
    updated[collection] = result?.data || payload;
  }
  return json({ ok: true, updated: Object.keys(updated), collections: updated }, 200, request);
}

/* ------------------------------------------------------------------ */
/* backup / restore                                                    */
/* ------------------------------------------------------------------ */

async function handleBackup(request, env, telegraph) {
  const { content } = await loadContent(env, { source: "telegraph" });
  return json({ ok: true, version: content.version, exported_at: new Date().toISOString(), content }, 200, request);
}

async function handleRestore(request, env, telegraph) {
  const body = (await readJson(request)) || {};
  const backup = body.content || body.backup || body;
  if (!backup || typeof backup !== "object") return error("Berkas backup tidak valid.", 422, request);

  const restoreItems = [
    ["announcements", backup.announcements],
    ["events", backup.events],
    ["gallery", backup.gallery],
    ["guides", backup.guides],
  ];

  let written = 0;
  for (const [collection, items] of restoreItems) {
    for (const item of Array.isArray(items) ? items.slice(0, 200) : []) {
      const payload = BUILDERS[collection](item);
      await telegraph.createRecord(collection, payload, { idempotencyKey: idempotencyKey("pmr-restore") });
      written += 1;
    }
  }
  for (const [collection, value] of [["organization", backup.org], ["roster", backup.roster], ["uks", backup.uks], ["site_settings", backup.settings]]) {
    if (!value) continue;
    const payload = buildSingleton(collection, value);
    const existingId = await findExistingId(telegraph, collection);
    await telegraph.replaceRecord(collection, existingId, payload, { idempotencyKey: idempotencyKey("pmr-restore") });
    written += 1;
  }
  return json({ ok: true, restored: written }, 200, request);
}

/* ------------------------------------------------------------------ */
/* entry point                                                        */
/* ------------------------------------------------------------------ */

export async function handleAdmin(context, segments) {
  const { request, env } = context;
  const telegraph = createTelegraph(env);
  const action = segments[0] || "data";

  if (action === "login" && request.method === "POST") {
    const body = (await readJson(request)) || {};
    const { safeEqual, adminPin } = await import("./auth.js");
    if (!safeEqual(clean(body.pin, 40), adminPin(env))) {
      return error("PIN admin tidak valid.", 401, request);
    }
    if (!telegraph.config.configured) {
      return json({ ok: true, token: await createSessionToken(env), expires_in: AUTH.TOKEN_TTL_MS, mode: "fallback", message: "Telegraph Cloud belum dikonfigurasi. Panel berjalan dalam mode fallback." }, 200, request);
    }
    return json({ ok: true, token: await createSessionToken(env), expires_in: AUTH.TOKEN_TTL_MS, mode: "telegraph" }, 200, request);
  }

  if (!(await isAdmin(request, env))) return adminOnly(request, env);

  if (!telegraph.config.configured) {
    return error("Telegraph Cloud belum dikonfigurasi (TELEGRAPH_URL / TELEGRAPH_API_KEY).", 503, request, { code: "not_configured" });
  }

  try {
    if (action === "data" && request.method === "GET") {
      const { content, degraded, errors } = await loadContent(env);
      const raw = {};
      await Promise.all(
        COLLECTIONS.map(async (collection) => {
          const records = await telegraph.readCollection(collection).catch(() => []);
          raw[collection] = records.map((record) => ({
            ...record,
            id: record.id || "",
            _version: documentVersion(record),
            _created_at: record.created_at || "",
            _updated_at: record.updated_at || "",
          }));
        }),
      );
      return json({ ok: true, data: { ...content, collections: raw, meta: { ...content.meta, degraded, errors } } }, 200, request);
    }

    if (action === "assets") return await handleAssets(request, env, telegraph);

    if (action === "content" && (request.method === "POST" || request.method === "PUT")) {
      return await handleContentWrite(request, env, telegraph);
    }

    if (action === "backup" && request.method === "GET") return await handleBackup(request, env, telegraph);

    if (action === "restore" && request.method === "POST") return await handleRestore(request, env, telegraph);

    if (ITEM_COLLECTIONS.includes(action)) {
      if (request.method === "POST" || request.method === "PUT") return await upsertItem(request, env, telegraph, action);

      if (request.method === "DELETE") {
        const url = new URL(request.url);
        const body = request.method === "DELETE" ? (await readJson(request)) || {} : {};
        const id = clean(url.searchParams.get("id") || body.id, 80);
        if (!id) return error("Parameter `id` wajib diisi.", 422, request);
        await telegraph.deleteRecord(action, id, { idempotencyKey: idempotencyKey("pmr-delete") });
        return json({ ok: true, deleted: id, collection: action }, 200, request);
      }
    }

    if (SINGLETON_COLLECTIONS.includes(action)) {
      if (request.method === "POST" || request.method === "PUT") return await upsertSingleton(request, env, telegraph, action);
    }

    if (action === "reset" && request.method === "POST") {
      return error("Reset massal dinonaktifkan. Gunakan backup/restore agar data tidak hilang tanpa jejak.", 403, request);
    }

    return error(`Endpoint admin tidak ditemukan: /api/admin/${segments.join("/")}`, 404, request);
  } catch (cause) {
    return telegraphFailure(cause, request);
  }
}

export const ADMIN_CONSTANTS = Object.freeze({ ITEM_COLLECTIONS, SINGLETON_COLLECTIONS, ASSET_FOLDERS, MAX_UPLOAD_BYTES });
export { cleanList };

/**
 * Portal Admin PMR Wira — handler sederhana di atas Telegraph Cloud.
 *
 * Kontrak endpoint sengaja dipertahankan sama seperti sebelumnya agar UI admin
 * tetap ringkas dan tidak perlu tahu detail penyimpanan:
 *   GET    /api/admin/data
 *   POST   /api/admin/announcements | events | gallery     (buat / perbarui)
 *   DELETE /api/admin/announcements | events | gallery?id=
 *   POST   /api/admin/content                              ({ key, value } atau { all })
 *   POST   /api/admin/reset
 *   POST   /api/admin/restore                              ({ backup })
 *   POST   /api/admin/upload                               (FormData / JSON base64)
 *
 * Tanpa TELEGRAPH_URL + TELEGRAPH_API_KEY, panel berjalan dengan data demo di
 * memori sesi sehingga masih bisa dipreview. Tidak ada database kedua.
 */
import { clean, error, json, readBody } from "./response.js";
import { COLLECTIONS, CONTENT_KEYS, MEDIA_BUCKET, formatDateLabel, galleryToDocument, todayISO } from "./collections.js";
import { getClient, getDemoStore, invalidateContentCache, loadSiteData, resetDemoStore, saveContentKey } from "./content-store.js";
import { demoContent } from "./fallback.js";

function verifyPin(request, env) {
  const pinHeader = request?.headers?.get("X-Admin-Pin") || "";
  const authHeader = request?.headers?.get("Authorization") || "";
  const token = (pinHeader || authHeader.replace(/^Bearer\s+/i, "")).trim();
  if (!token) return false;
  const validPin = env?.ADMIN_PIN || env?.ADMIN_SECRET || "2026";
  return token === validPin;
}

/* ------------------------------------------------------------------
   Utilitas bentuk data admin
------------------------------------------------------------------ */

const asBool = (value) => value !== false && value !== "false" && value !== 0 && value !== "0";

const ANNOUNCEMENT_KEYS = ["category", "title", "excerpt", "date_label", "image_url", "is_published"];
const EVENT_KEYS = ["title", "date_label", "time_label", "location", "description", "status", "is_published"];

function pickKeys(source, keys) {
  const output = {};
  for (const key of keys) if (source[key] !== undefined) output[key] = source[key];
  return output;
}

/* ------------------------------------------------------------------
   Handler utama
------------------------------------------------------------------ */

export async function handleAdminRequest(context, subPath) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return json({}, 200, request);

  const parts = String(subPath || "data").split("/").filter(Boolean);
  const action = parts[0] || "data";

  if (!verifyPin(request, env)) {
    return json({ ok: false, error: "PIN Admin tidak valid." }, 401, request);
  }

  const body = ["GET", "DELETE"].includes(request.method) ? {} : (await readBody(request)) || {};
  const queryId = new URL(request.url).searchParams.get("id");
  const client = getClient(env);
  const demoStore = getDemoStore();

  /* ------------------------- GET /api/admin/data ------------------------- */
  if (request.method === "GET" && action === "data") {
    if (!client) return json({ ok: true, data: { ...demoStore, source: "demo" } }, 200, request);
    const site = await loadSiteData(env, { force: true, includeDrafts: true });
    const payload = { ...site.data, source: site.source };
    return json({ ok: true, data: payload }, 200, request);
  }

  /* ---------------------- CRUD kabar / agenda / galeri ---------------------- */
  const CRUD = {
    announcements: {
      collection: COLLECTIONS.announcements,
      build: buildAnnouncement,
      createId: () => `news-${Date.now()}`,
      fallbackKey: "announcements",
    },
    events: {
      collection: COLLECTIONS.events,
      build: buildEvent,
      createId: () => `event-${Date.now()}`,
      fallbackKey: "events",
    },
    gallery: {
      collection: COLLECTIONS.gallery,
      build: buildGallery,
      createId: () => `${Date.now()}`,
      fallbackKey: "gallery",
    },
  };

  if (CRUD[action]) {
    const config = CRUD[action];

    if (request.method === "POST" || request.method === "PUT") {
      const record = config.build(body);
      if (record.error) return error(record.error, 422, request);

      if (!client) {
        const list = demoStore[config.fallbackKey];
        const index = body.id ? list.findIndex((item) => String(item.id) === String(body.id)) : -1;
        if (index >= 0) list[index] = { ...list[index], ...record.document, id: body.id };
        else list.unshift({ ...record.document, id: body.id || config.createId() });
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore[config.fallbackKey] }, 200, request);
      }

      try {
        // Id trunked dari Telegraph (rec_…) menandakan pembaruan; selain itu buat baru.
        const existing = body.id && String(body.id).startsWith("rec_") ? await client.get(config.collection, body.id) : null;
        if (existing) {
          await client.update(config.collection, existing.id, record.document, { expectedVersion: existing.version });
        } else {
          await client.create(config.collection, record.document, { idempotencyKey: `${action}-${Date.now()}` });
        }
        invalidateContentCache();
        const site = await loadSiteData(env, { force: true, includeDrafts: true });
        return json({ ok: true, persisted: true, list: site.data[config.fallbackKey] }, 200, request);
      } catch (cause) {
        return error(describe(cause, "menyimpan"), 500, request);
      }
    }

    if (request.method === "DELETE") {
      const targetId = parts[1] || queryId || body.id;
      if (!targetId) return error("ID wajib dicantumkan.", 422, request);

      if (!client) {
        demoStore[config.fallbackKey] = demoStore[config.fallbackKey].filter((item) => String(item.id) !== String(targetId));
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore[config.fallbackKey] }, 200, request);
      }
      try {
        if (String(targetId).startsWith("rec_")) {
          const existing = await client.get(config.collection, targetId);
          if (existing) await client.remove(config.collection, existing.id, { expectedVersion: existing.version });
        }
        invalidateContentCache();
        const site = await loadSiteData(env, { force: true, includeDrafts: true });
        return json({ ok: true, persisted: true, list: site.data[config.fallbackKey] }, 200, request);
      } catch (cause) {
        return error(describe(cause, "menghapus"), 500, request);
      }
    }
  }

  /* -------------------------- POST /api/admin/content -------------------------- */
  if (action === "content" && ["POST", "PUT"].includes(request.method)) {
    const updates = [];
    if (body.all && typeof body.all === "object") {
      for (const key of CONTENT_KEYS) if (body.all[key] !== undefined) updates.push([key, body.all[key]]);
    } else {
      const key = clean(body.key, 50);
      if (!CONTENT_KEYS.includes(key) || body.value == null) {
        return error(`Key konten harus salah satu dari: ${CONTENT_KEYS.join(", ")}.`, 422, request);
      }
      updates.push([key, body.value]);
    }

    if (!client) {
      for (const [key, value] of updates) demoStore[key] = value;
      return json({ ok: true, persisted: false, demoMode: true, data: demoStore }, 200, request);
    }
    try {
      for (const [key, value] of updates) await saveContentKey(client, key, value);
      invalidateContentCache();
      const site = await loadSiteData(env, { force: true, includeDrafts: true });
      return json({ ok: true, persisted: true, data: { ...site.data, source: site.source } }, 200, request);
    } catch (cause) {
      return error(describe(cause, "menyimpan konten"), 500, request);
    }
  }

  /* --------------------------- POST /api/admin/reset --------------------------- */
  if (action === "reset" && request.method === "POST") {
    const store = resetDemoStore();

    if (!client) {
      return json({ ok: true, persisted: false, demoMode: true, message: "Data demo berhasil direset ke bawaan.", data: store }, 200, request);
    }
    try {
      // Reset seluruh bagian site_content (6 penulisan) — hemat kuota mutasi Telegraph.
      for (const key of CONTENT_KEYS) await saveContentKey(client, key, demoContent[key]);
      invalidateContentCache();
      return json({ ok: true, persisted: true, message: "Bagian konten (statistik, organisasi, kontak, panduan, jadwal, UKS) dipulihkan ke bawaan. Kabar/agenda/galeri dapat dihapus per item." }, 200, request);
    } catch (cause) {
      return error(describe(cause, "mereset"), 500, request);
    }
  }

  /* -------------------------- POST /api/admin/restore -------------------------- */
  if (action === "restore" && request.method === "POST") {
    const backup = body.backup || body;
    if (!backup || typeof backup !== "object") return error("File backup tidak valid.", 422, request);

    if (!client) {
      for (const key of [...CONTENT_KEYS, ...["announcements", "events", "gallery"]]) {
        if (backup[key]) demoStore[key] = backup[key];
      }
      return json({ ok: true, persisted: false, demoMode: true, message: "Backup dipulihkan (mode memori lokal).", data: demoStore }, 200, request);
    }

    // Batasi jumlah mutasi agar tidak menabrak kuota Telegraph Cloud (20 mutasi / 60 detik).
    const MAX_WRITES = 18;
    let writes = 0;
    const skipped = [];
    try {
      for (const key of CONTENT_KEYS) {
        if (backup[key] === undefined || writes >= MAX_WRITES) continue;
        await saveContentKey(client, key, backup[key]);
        writes += 1;
      }
      for (const [kind, collection, build] of [
        ["announcements", COLLECTIONS.announcements, buildAnnouncement],
        ["events", COLLECTIONS.events, buildEvent],
        ["gallery", COLLECTIONS.gallery, buildGallery],
      ]) {
        const list = Array.isArray(backup[kind]) ? backup[kind] : [];
        if (writes >= MAX_WRITES) {
          if (list.length) skipped.push(kind);
          continue;
        }
        for (const item of list) {
          if (writes >= MAX_WRITES) { skipped.push(kind); break; }
          const record = build({ ...item, id: undefined });
          if (record.error) continue;
          await client.create(collection, record.document, { idempotencyKey: `restore-${kind}-${writes}` });
          writes += 1;
        }
      }
      invalidateContentCache();
      const note = skipped.length ? ` Sebagian data (${[...new Set(skipped)].join(", ")}) belum diimpor karena kuota mutasi Telegraph Cloud; ulangi restore setelah satu menit.` : "";
      return json({ ok: true, persisted: true, message: `Restore selesai — ${writes} dokumen tersimpan ke Telegraph Cloud.${note}` }, 200, request);
    } catch (cause) {
      return error(describe(cause, "memulihkan backup"), 500, request);
    }
  }

  /* -------------------------- POST /api/admin/upload -------------------------- */
  if (action === "upload" && request.method === "POST") {
    if (!client) return error("Unggah foto memerlukan konfigurasi Telegraph Cloud (TELEGRAPH_URL & TELEGRAPH_API_KEY).", 400, request);
    try {
      const file = await readUpload(request, body);
      if (!file) return error("Berkas gambar wajib dicantumkan.", 422, request);
      if (file.bytes.byteLength > 20 * 1024 * 1024) return error("Ukuran berkas melebihi batas 20 MiB Telegraph Cloud.", 413, request);

      const key = `uploads/${todayISO()}/${Date.now()}-${slugify(file.name)}`;
      await client.putObject(MEDIA_BUCKET, key, file.bytes, file.type);
      const url = `/api/media/${key}`;
      return json({ ok: true, data: { url, display_url: url, key, bucket: MEDIA_BUCKET } }, 200, request);
    } catch (cause) {
      return error(describe(cause, "mengunggah berkas"), 500, request);
    }
  }

  return error(`Endpoint admin tidak ditemukan: /api/admin/${action}`, 404, request);
}

/* ------------------------------------------------------------------
   Pembangun dokumen + pembantu
------------------------------------------------------------------ */

function buildAnnouncement(body) {
  const title = clean(body.title, 250);
  if (!title) return { error: "Judul kabar wajib diisi." };
  return {
    document: {
      ...pickKeys(body, ANNOUNCEMENT_KEYS),
      title,
      category: clean(body.category || "Kegiatan", 100),
      excerpt: clean(body.excerpt, 800),
      date_label: clean(body.date_label || body.date || formatDateLabel(), 100),
      image_url: clean(body.image_url || body.image, 500),
      is_published: asBool(body.is_published),
      published_at: body.published_at || new Date().toISOString(),
    },
  };
}

function buildEvent(body) {
  const title = clean(body.title, 250);
  if (!title) return { error: "Judul agenda wajib diisi." };
  return {
    document: {
      ...pickKeys(body, EVENT_KEYS),
      title,
      date_label: clean(body.date_label || body.date || "Segera", 100),
      time_label: clean(body.time_label || body.time || "15.00–17.00 WITA", 100),
      location: clean(body.location || "SMKN 4 Banjarmasin", 200),
      description: clean(body.description, 800),
      status: clean(body.status || "Informasi", 100),
      is_published: asBool(body.is_published),
      starts_at: body.starts_at || new Date().toISOString(),
    },
  };
}

function buildGallery(body) {
  const title = clean(body.title, 250);
  if (!title) return { error: "Judul album galeri wajib diisi." };
  return {
    document: galleryToDocument({
      ...pickKeys(body, ["category", "cover_url", "description", "is_published", "event_date"]),
      title,
      date_label: clean(body.date_label || body.date || formatDateLabel(), 100),
      event_date: clean(body.event_date || todayISO(), 30),
      images: Array.isArray(body.images) ? body.images.map((image) => clean(image, 500)).filter(Boolean) : [],
      cover_url: clean(body.cover_url || body.cover, 500),
      description: clean(body.description, 800),
    }),
  };
}

/** Terima JSON `{ image: dataURL }` maupun FormData `image=<File>`. */
async function readUpload(request, body) {
  const contentType = request.headers.get("Content-Type") || "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const entry = form.get("image") || form.get("file");
    if (!entry || typeof entry === "string") return null;
    return { bytes: await entry.arrayBuffer(), type: entry.type || "application/octet-stream", name: entry.name || "foto" };
  }
  const dataUrl = typeof body.image === "string" ? body.image : "";
  if (!dataUrl) return null;
  const [meta, base64] = dataUrl.includes(",") ? dataUrl.split(",", 2) : ["", dataUrl];
  const type = /data:([^;]+)/.exec(meta)?.[1] || body.type || "image/jpeg";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return { bytes, type, name: body.name || "foto" };
}

function slugify(value) {
  const base = String(value || "foto")
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `${base || "foto"}.jpg`;
}

function describe(cause, activity) {
  const code = cause?.code || "";
  if (code === "version_conflict") return "Data sudah diubah di tempat lain (versi konflik). Muat ulang lalu simpan kembali.";
  if (code === "rate_limited") return "Kuota penulisan Telegraph Cloud sedang penuh (maks 20 mutasi/menit). Coba lagi sebentar lagi.";
  if (code === "document_too_large") return "Dokumen terlalu besar. Simpan berkas besar di object storage, bukan di dokumen.";
  if (code === "api_key_scope_forbidden") return "API key Telegraph Cloud tidak punya izin tulis (db:write / storage:write).";
  return `Gagal ${activity} ke Telegraph Cloud: ${cause?.message || "kesalahan tidak dikenal"}.`;
}

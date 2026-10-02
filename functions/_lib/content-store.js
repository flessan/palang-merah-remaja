/**
 * Lapisan baca/tulis konten situs di atas Telegraph Cloud.
 * Dipakai bersama oleh endpoint publik (/api/content) dan Portal Admin (/api/admin/*).
 */
import {
  COLLECTIONS,
  CONTENT_KEYS,
  announcementFromRecord,
  eventFromRecord,
  galleryFromRecord,
  galleryToDocument,
} from "./collections.js";
import { demoContent } from "./fallback.js";
import { createTelegraph } from "./telegraph.js";

const READ_CACHE_MS = 15_000;

// Cache modul sederhana supaya navigasi publik tidak menembak Telegraph Cloud
// berulang-ulang. Selalu dibersihkan setiap kali admin menulis.
let readCache = { at: 0, token: "", payload: null };

/** Salinan dalam dari data demo agar tidak ada state yang bocor antar request. */
export function demoClone() {
  return JSON.parse(JSON.stringify(demoContent));
}

/**
 * Penyimpanan demo bersama (hanya saat Telegraph belum dikonfigurasi).
 * Dipakai endpoint admin untuk menulis dan endpoint publik untuk membaca,
 * supaya perubahan di Portal Admin langsung terlihat pada pratinjau sesi ini.
 */
export function getDemoStore() {
  if (!globalThis.__pmrDemoState) globalThis.__pmrDemoState = demoClone();
  return globalThis.__pmrDemoState;
}

export function resetDemoStore() {
  globalThis.__pmrDemoState = demoClone();
  invalidateContentCache();
  return globalThis.__pmrDemoState;
}

export function invalidateContentCache() {
  readCache = { at: 0, token: "", payload: null };
}

/** Ambil klien Telegraph; null bila belum dikonfigurasi (mode demo). */
export function getClient(env) {
  return createTelegraph(env);
}

/**
 * Muat seluruh data situs.
 * @param {{ force?: boolean, includeDrafts?: boolean }} options
 */
export async function loadSiteData(env, { force = false, includeDrafts = false } = {}) {
  const client = getClient(env);
  if (!client) return { source: "demo", configured: false, data: getDemoStore() };

  const token = `${client.baseUrl}|${includeDrafts ? "admin" : "public"}`;
  const cacheUsable = !includeDrafts && !force && readCache.payload && readCache.token === token && Date.now() - readCache.at < READ_CACHE_MS;
  if (cacheUsable) return readCache.payload;

  try {
    const [contentRecords, announcementRecords, eventRecords, galleryRecords] = await Promise.all([
      client.listAll(COLLECTIONS.siteContent),
      client.listAll(COLLECTIONS.announcements),
      client.listAll(COLLECTIONS.events),
      client.listAll(COLLECTIONS.gallery),
    ]);

    const demo = demoClone();
    const published = (record) => record.data?.is_published !== false;

    const announcements = announcementRecords
      .map(announcementFromRecord)
      .filter((item) => includeDrafts || item.is_published)
      .sort((a, b) => String(b.published_at || "").localeCompare(String(a.published_at || "")));

    const events = eventRecords.map(eventFromRecord).filter((item) => includeDrafts || item.is_published);
    const gallery = galleryRecords.map(galleryFromRecord).filter((item) => includeDrafts || item.is_published);

    const content = contentRecords;
    const byKey = {};
    for (const record of content) {
      const key = record.data?.key;
      if (key) byKey[key] = record;
    }
    const pick = (key, fallback) => (byKey[key] ? byKey[key].data.value ?? fallback : fallback);

    const data = {
      stats: pick("stats", demo.stats),
      org: pick("org", demo.org),
      contact: pick("contact", demo.contact),
      guides: pick("guides", demo.guides),
      roster: pick("roster", demo.roster),
      uks_info: pick("uks_info", demo.uks_info),
      announcements: announcements.length ? announcements : includeDrafts ? demo.announcements : [],
      events: events.length ? events : includeDrafts ? demo.events : [],
      gallery: gallery.length ? gallery : includeDrafts ? demo.gallery : [],
    };

    // Mode demo dipakai saat koleksi masih kosong, supaya situs tidak pernah kosong.
    if (!includeDrafts) {
      if (!data.announcements.length) data.announcements = demo.announcements;
      if (!data.events.length) data.events = demo.events;
      if (!data.gallery.length) data.gallery = demo.gallery;
    }

    const payload = { source: "telegraph", configured: true, project: client.project || null, data };
    if (!includeDrafts) readCache = { at: Date.now(), token, payload };
    return payload;
  } catch (cause) {
    console.error("Telegraph read failed", cause?.code || cause?.message);
    return { source: "demo", configured: true, degraded: true, error: cause?.code || "read_failed", data: getDemoStore() };
  }
}

/** Bentuk yang dipakai UI publik (tanpa metadata internal). */
export function publicContentFrom(siteData) {
  const { data } = siteData;
  return {
    source: siteData.source,
    stats: data.stats,
    announcements: data.announcements.map(({ version, recordId, ...rest }) => rest),
    events: data.events.map(({ version, recordId, ...rest }) => rest),
    gallery: data.gallery.map(({ version, recordId, ...rest }) => rest),
    org: data.org,
    contact: data.contact,
    guides: data.guides,
    roster: data.roster,
    uks_info: data.uks_info,
  };
}

/* ------------------------------------------------------------------
   Penulisan konten (dipakai Portal Admin)
------------------------------------------------------------------ */

/** Simpan satu bagian site_content (stats/org/contact/guides/roster/uks_info). */
export async function saveContentKey(client, key, value) {
  if (!CONTENT_KEYS.includes(key)) throw new Error(`Key konten tidak dikenal: ${key}`);
  const document = { key, value, updated_at: new Date().toISOString() };
  const existing = await client.findOne(COLLECTIONS.siteContent, { key });
  if (existing?.id) {
    return client.update(COLLECTIONS.siteContent, existing.id, document, { expectedVersion: existing.version });
  }
  return client.create(COLLECTIONS.siteContent, document, { idempotencyKey: `site_content-${key}-v1` });
}

/** Pemetaan dokumen domain untuk announcements/events/gallery. */
export function documentFor(kind, input) {
  if (kind === "announcements") {
    return {
      category: input.category,
      title: input.title,
      excerpt: input.excerpt,
      date_label: input.date_label,
      image_url: input.image_url,
      is_published: input.is_published,
      published_at: input.published_at || new Date().toISOString(),
    };
  }
  if (kind === "events") {
    return {
      title: input.title,
      date_label: input.date_label,
      time_label: input.time_label,
      location: input.location,
      description: input.description,
      status: input.status,
      is_published: input.is_published,
      starts_at: input.starts_at || new Date().toISOString(),
    };
  }
  return galleryToDocument(input);
}

/** Cari record berdasarkan id Telegraph, dengan fallback ke field `id` dokumen. */
export async function findRecordById(client, collection, id) {
  if (!id) return null;
  const direct = await client.get(collection, id);
  if (direct) return direct;
  return null;
}

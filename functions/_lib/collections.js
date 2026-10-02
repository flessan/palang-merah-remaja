/**
 * Peta koleksi Telegraph Cloud untuk situs PMR Wira.
 *
 * Semua data situs hidup di Telegraph Cloud (document API) — tidak ada SQL,
 * tidak ada ORM, tidak ada database kedua:
 *
 *   site_content    → { key, value, updated_at }  (stats, org, contact, guides, roster, uks_info)
 *   announcements   → kabar terkini
 *   events          → agenda kegiatan
 *   gallery_albums  → album galeri (gambar disimpan sebagai URL/objek storage)
 *
 * Bucket object storage dipakai hanya untuk file besar (foto unggahan admin),
 * dan dokumen hanya menyimpan URL-nya.
 */

export const COLLECTIONS = {
  siteContent: "site_content",
  announcements: "announcements",
  events: "events",
  gallery: "gallery_albums",
};

export const CONTENT_KEYS = ["stats", "org", "contact", "guides", "roster", "uks_info"];

export const MEDIA_BUCKET = "pmr-media";

/** Ukuran/waktu label gaya Indonesia yang dipakai tabel admin. */
export function formatDateLabel(date = new Date()) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------
   Pemetaan dokumen ⇄ objek domain
------------------------------------------------------------------ */

/** site_content: dokumen `{ key, value }` → nilai mentah. */
export function contentToValue(record) {
  if (!record?.data) return null;
  return record.data.value ?? null;
}

export function valueToContent(key, value) {
  return { key, value, updated_at: new Date().toISOString() };
}

/** Kumpulan dokumen site_content → objek `{ stats, org, ... }`. */
export function siteContentMap(records) {
  const map = {};
  for (const record of records) {
    const key = record?.data?.key;
    if (key && CONTENT_KEYS.includes(key)) map[key] = record.data.value;
  }
  return map;
}

export function announcementFromRecord(record) {
  const d = record.data || {};
  return {
    id: record.id,
    recordId: record.id,
    category: d.category || "Kegiatan",
    title: d.title || "",
    excerpt: d.excerpt || "",
    date: d.date_label || record.created_at || "",
    date_label: d.date_label || "",
    image: d.image_url || "",
    image_url: d.image_url || "",
    is_published: d.is_published !== false,
    published_at: d.published_at || record.created_at || null,
    version: record.version,
  };
}

export function eventFromRecord(record) {
  const d = record.data || {};
  return {
    id: record.id,
    recordId: record.id,
    title: d.title || "",
    date: d.date_label || record.created_at || "",
    date_label: d.date_label || "",
    time: d.time_label || "",
    time_label: d.time_label || "",
    location: d.location || "",
    description: d.description || "",
    status: d.status || "Informasi",
    is_published: d.is_published !== false,
    starts_at: d.starts_at || record.created_at || null,
    version: record.version,
  };
}

export function galleryFromRecord(record) {
  const d = record.data || {};
  const images = Array.isArray(d.images) ? d.images : [];
  return {
    id: record.id,
    recordId: record.id,
    title: d.title || "",
    date: d.date_label || d.event_date || "",
    date_label: d.date_label || "",
    event_date: d.event_date || "",
    category: d.category || "Kegiatan",
    cover: d.cover_url || images[0] || "",
    cover_url: d.cover_url || images[0] || "",
    images,
    description: d.description || "",
    is_published: d.is_published !== false,
    version: record.version,
  };
}

/** Objek admin → dokumen galeri untuk Telegraph Cloud. */
export function galleryToDocument(input) {
  const images = Array.isArray(input.images) ? input.images.filter(Boolean) : [];
  return {
    title: input.title,
    category: input.category || "Kegiatan",
    date_label: input.date_label || "",
    event_date: input.event_date || todayISO(),
    cover_url: input.cover_url || images[0] || "",
    images,
    description: input.description || "",
    is_published: input.is_published !== false,
  };
}

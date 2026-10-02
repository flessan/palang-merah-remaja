// Shared PMR Wira content contract.
//
// This module is imported by BOTH the browser bundle (`src/lib/content.js`)
// and the Pages Functions adapter (`functions/**`). It contains no credentials,
// no network code, and no Cloudflare-specific APIs — only the canonical shape
// of PMR content plus small pure helpers that normalise legacy/loose data into
// that shape.
//
// Telegraph Cloud collections (documents in project <TELEGRAPH_PROJECT_ID>):
//   announcements · events · gallery · guides · organization · members · roster · uks · site_settings
//
// `members` is one document per person (name, class, division, role, photo…),
// so the admin panel can add or edit a single member without rewriting a whole
// directory document.

export const COLLECTIONS = Object.freeze([
  "announcements",
  "events",
  "gallery",
  "guides",
  "organization",
  "members",
  "roster",
  "uks",
  "site_settings",
]);

export const CONTENT_VERSION = 3;

export const CATEGORY_DEFAULT = "Kabar PMR";

/* ------------------------------------------------------------------ */
/* small value helpers                                                 */
/* ------------------------------------------------------------------ */

export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function text(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function list(value) {
  return Array.isArray(value) ? value : [];
}

export function objects(value) {
  return list(value).filter(isPlainObject);
}

export function bool(value, fallback = true) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const normalised = String(value).trim().toLowerCase();
  if (["false", "0", "no", "tidak", "draft", "unpublished"].includes(normalised)) return false;
  if (["true", "1", "yes", "ya", "published", "publish"].includes(normalised)) return true;
  return fallback;
}

export function recordId(document, fallback = "") {
  if (!isPlainObject(document)) return fallback;
  return text(document.id || document._id || document.record_id, fallback);
}

/** Decimal-safe integer formatting for public statistics. */
export function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
}

/* ------------------------------------------------------------------ */
/* per-collection normalisers                                          */
/* ------------------------------------------------------------------ */

export function normaliseAnnouncement(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    id: recordId(doc),
    category: text(doc.category, CATEGORY_DEFAULT),
    title: text(doc.title),
    excerpt: text(doc.excerpt),
    date: text(doc.date || doc.date_label, "Kabar terbaru"),
    date_iso: text(doc.date_iso, ""),
    image: text(doc.image || doc.image_url, ""),
    published: bool(doc.published ?? doc.is_published, true),
    sort: number(doc.sort, 0),
    updated_at: text(doc.updated_at, ""),
  };
}

export function normaliseEvent(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    id: recordId(doc),
    title: text(doc.title),
    date: text(doc.date || doc.date_label, "Menyesuaikan kalender sekolah"),
    time: text(doc.time || doc.time_label, ""),
    location: text(doc.location, "SMKN 4 Banjarmasin"),
    description: text(doc.description),
    status: text(doc.status, "Informasi"),
    published: bool(doc.published ?? doc.is_published, true),
    sort: number(doc.sort, 0),
    updated_at: text(doc.updated_at, ""),
  };
}

export function normaliseAlbum(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  const images = list(doc.images).map((item) => text(item)).filter(Boolean);
  const cover = text(doc.cover || doc.cover_url, images[0] || "");
  return {
    id: recordId(doc),
    title: text(doc.title),
    date: text(doc.date || doc.date_label, ""),
    category: text(doc.category, "Kegiatan"),
    description: text(doc.description),
    cover: cover || images[0] || "",
    images: images.length ? images : cover ? [cover] : [],
    published: bool(doc.published ?? doc.is_published, true),
    sort: number(doc.sort, 0),
    updated_at: text(doc.updated_at, ""),
  };
}

export function normaliseGuide(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  const id = text(doc.id || doc.slug || doc.title, "panduan").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id,
    title: text(doc.title),
    icon: text(doc.icon, "shield-check"),
    tone: text(doc.tone, "red"),
    tag: text(doc.tag, "Panduan"),
    summary: text(doc.summary || doc.description),
    steps: list(doc.steps).map((step) => text(step)).filter(Boolean),
    published: bool(doc.published ?? doc.is_published, true),
    sort: number(doc.sort, 0),
    updated_at: text(doc.updated_at, ""),
  };
}

export function normalisePerson(raw = {}, { roleKey = "role", titleKey = "nama" } = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    role: text(doc[roleKey] || doc.role || doc.jabatan),
    name: text(doc[titleKey] || doc.name || doc.nama),
    description: text(doc.description || doc.deskripsi),
    icon: text(doc.icon, ""),
    photo: text(doc.photo || doc.foto, ""),
    tone: text(doc.tone, ""),
  };
}

export function normaliseDivision(raw = {}, index = 0) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    name: text(doc.name || doc.divisi || doc.division, `Divisi ${index + 1}`),
    icon: text(doc.icon, "heart-handshake"),
    tone: text(doc.tone, ""),
    description: text(doc.description || doc.deskripsi),
    photo: text(doc.photo || doc.foto, ""),
    members: list(doc.members || doc.anggota).map((member) => text(member)).filter(Boolean),
  };
}

export function normaliseOrganization(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    id: recordId(doc),
    period: text(doc.period || doc.periode, "2026/2027"),
    vision: text(doc.vision || doc.visi, ""),
    mission: list(doc.mission || doc.misi).map((item) => text(item)).filter(Boolean),
    advisory: objects(doc.advisory).map((person) => normalisePerson(person, { roleKey: "jabatan", titleKey: "nama" })),
    leaders: objects(doc.leaders).map((person) => normalisePerson(person)),
    divisions: objects(doc.divisions).map((division, index) => normaliseDivision(division, index)),
    updated_at: text(doc.updated_at, ""),
  };
}

/** One person in the PMR member directory (with an optional portrait). */
export function normaliseMember(raw = {}, index = 0) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    id: recordId(doc, `member-${index + 1}`),
    name: text(doc.name || doc.nama),
    role: text(doc.role || doc.jabatan, "Anggota"),
    class_name: text(doc.class_name || doc.class || doc.kelas),
    division: text(doc.division || doc.divisi),
    photo: text(doc.photo || doc.foto, ""),
    phone: text(doc.phone || doc.wa, ""),
    note: text(doc.note || doc.catatan),
    active: bool(doc.active ?? doc.aktif, true),
    published: bool(doc.published ?? doc.is_published, true),
    sort: number(doc.sort, 0),
    updated_at: text(doc.updated_at, ""),
  };
}

/**
 * A duty-schedule officer may be a plain name (legacy documents, free text) or
 * an object that points at a directory member. Both shapes normalise to one
 * object so the public roster can show portraits when they exist.
 */
export function normaliseOfficer(raw = {}) {
  if (typeof raw === "string") {
    const label = text(raw);
    if (!label) return null;
    const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(label);
    return { id: "", name: text(match ? match[1] : label), class_name: text(match ? match[2] : ""), photo: "" };
  }
  const doc = isPlainObject(raw) ? raw : {};
  const name = text(doc.name || doc.nama);
  if (!name) return null;
  return {
    id: recordId(doc),
    name,
    class_name: text(doc.class_name || doc.class || doc.kelas),
    photo: text(doc.photo || doc.foto, ""),
    role: text(doc.role || doc.jabatan, ""),
  };
}

/** Stable label used in WhatsApp text, tables and summaries. */
export function officerLabel(officer) {
  const person = normaliseOfficer(officer);
  if (!person) return "";
  return person.class_name ? `${person.name} (${person.class_name})` : person.name;
}

export function normaliseShift(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    date: text(doc.date || doc.tanggal),
    day: text(doc.day || doc.hari, ""),
    officers: list(doc.officers || doc.petugas).map(normaliseOfficer).filter(Boolean),
  };
}

export function normaliseRoster(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    id: recordId(doc),
    period: text(doc.period || doc.periode, ""),
    month_label: text(doc.month_label || doc.bulan_label, ""),
    description: text(doc.description || doc.keterangan, ""),
    uks_schedule: objects(doc.uks_schedule).map(normaliseShift),
    field_schedule: objects(doc.field_schedule || doc.lapangan_schedule).map(normaliseShift),
    published: bool(doc.published ?? doc.is_published, true),
    updated_at: text(doc.updated_at, ""),
  };
}

export function normaliseInventoryItem(raw = {}, index = 0) {
  const doc = isPlainObject(raw) ? raw : {};
  return {
    id: text(doc.id, `item-${index + 1}`),
    name: text(doc.name || doc.nama),
    category: text(doc.category || doc.kategori, "Perlengkapan"),
    purpose: text(doc.purpose || doc.kegunaan),
    status: text(doc.status, "Tersedia & Gratis"),
  };
}

export function normaliseUks(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  const banner = isPlainObject(doc.welcome_banner) ? doc.welcome_banner : {};
  return {
    id: recordId(doc),
    welcome_banner: {
      title: text(banner.title, "Ruang UKS terbuka untuk seluruh siswa"),
      subtitle: text(banner.subtitle),
      highlight: text(banner.highlight),
    },
    service_hours: text(doc.service_hours || doc.jam_layanan, ""),
    location: text(doc.location || doc.lokasi, ""),
    inventory: objects(doc.inventory || doc.stok_obat_dan_alat).map(normaliseInventoryItem),
    procedure: objects(doc.procedure || doc.prosedur_kunjungan).map((step, index) => ({
      step: text(step.step, `Langkah ${index + 1}`),
      description: text(step.description || step.deskripsi),
    })),
    rules: list(doc.rules || doc.tata_tertib).map((rule) => text(rule)).filter(Boolean),
    updated_at: text(doc.updated_at, ""),
  };
}

export function normaliseSettings(raw = {}) {
  const doc = isPlainObject(raw) ? raw : {};
  const branding = isPlainObject(doc.branding) ? doc.branding : {};
  const emergency = isPlainObject(doc.emergency) ? doc.emergency : {};
  return {
    id: recordId(doc),
    branding: {
      name: text(branding.name, "PMR Wira SMKN 4 Banjarmasin"),
      short_name: text(branding.short_name, "PMR WIRA"),
      school: text(branding.school, "SMKN 4 Banjarmasin"),
      tagline: text(branding.tagline, "Humanis. Peduli. Tanggap."),
      logo: text(branding.logo, "/gudang/logo/pmr-logo.webp"),
      icon: text(branding.icon, "/gudang/logo/icon.svg"),
      og_image: text(branding.og_image, "/gudang/logo/og-image.png"),
      canonical_url: text(branding.canonical_url, "https://pmr.likesyou.org/"),
    },
    contact: isPlainObject(doc.contact) ? doc.contact : {},
    emergency: {
      headline: text(emergency.headline, "Butuh bantuan medis segera?"),
      number: text(emergency.number, "119"),
      note: text(emergency.note, "Hubungi ambulans atau petugas UKS sekolah."),
      wa_link: text(emergency.wa_link, ""),
    },
    social_links: objects(doc.social_links).map((link) => ({
      label: text(link.label),
      url: text(link.url),
      icon: text(link.icon, "link"),
    })),
    stats: normaliseStats(doc.stats),
    updated_at: text(doc.updated_at, ""),
  };
}

/** Statistics are stored inside `site_settings.stats`. */
export function normaliseStats(raw) {
  return objects(raw).map((stat) => ({
    value: number(stat.value, 0),
    label: text(stat.label),
    icon: text(stat.icon, "sparkles"),
    suffix: text(stat.suffix, ""),
  }));
}

/* ------------------------------------------------------------------ */
/* collection → canonical content mapping                              */
/* ------------------------------------------------------------------ */

/** Sort published items first, then by explicit `sort`, then by date text. */
function bySort(a, b) {
  if (a.sort !== b.sort) return b.sort - a.sort;
  return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
}

function publishedFirst(items) {
  return [...items].sort((a, b) => {
    if (a.published !== b.published) return a.published ? -1 : 1;
    return bySort(a, b);
  });
}

/**
 * Turns raw Telegraph Cloud collection documents into the single content
 * object the public site and admin panel consume.
 */
export function buildContent(collections = {}, { fallback = {}, source = "telegraph", meta = {} } = {}) {
  const pick = (name) => (Array.isArray(collections[name]) ? collections[name] : null);

  const announcements = publishedFirst((pick("announcements") || []).map(normaliseAnnouncement)).filter((item) => item.title);
  const events = publishedFirst((pick("events") || []).map(normaliseEvent)).filter((item) => item.title);
  const gallery = publishedFirst((pick("gallery") || []).map(normaliseAlbum)).filter((album) => album.title);
  const guides = publishedFirst((pick("guides") || []).map(normaliseGuide)).filter((guide) => guide.title);

  const members = publishedFirst((pick("members") || []).map(normaliseMember)).filter((member) => member.name);
  const orgDocs = (pick("organization") || []).map(normaliseOrganization);
  const rosterDocs = (pick("roster") || []).map(normaliseRoster);
  const uksDocs = (pick("uks") || []).map(normaliseUks);
  const settingDocs = (pick("site_settings") || []).map(normaliseSettings);

  const settings = settingDocs[0] || normaliseSettings(fallback.settings);
  const stats = settings.stats?.length ? settings.stats : normaliseStats(fallback.stats);

  const hasCollections = COLLECTIONS.some((name) => Array.isArray(collections[name]));

  return {
    version: CONTENT_VERSION,
    source,
    meta: {
      generated_at: new Date().toISOString(),
      collections: Object.fromEntries(COLLECTIONS.map((name) => [name, Array.isArray(collections[name]) ? collections[name].length : 0])),
      degraded: !hasCollections,
      ...meta,
    },
    stats,
    announcements: announcements.length ? announcements : list(fallback.announcements),
    events: events.length ? events : list(fallback.events),
    gallery: gallery.length ? gallery : list(fallback.gallery),
    guides: guides.length ? guides : list(fallback.guides),
    members: members.length ? members : list(fallback.members),
    org: orgDocs[0] || fallback.org,
    roster: rosterDocs[0] || fallback.roster,
    uks: uksDocs[0] || fallback.uks,
    settings,
    contact: isPlainObject(settings.contact) && Object.keys(settings.contact).length ? settings.contact : fallback.contact,
  };
}

/**
 * The public site must never render blank. If the network/API fails, merge the
 * (validated) API payload over the bundled fallback dataset.
 */
export function mergeContent(data, fallback) {
  if (!isPlainObject(data)) return fallback;
  const merged = {
    ...fallback,
    ...data,
    meta: { ...fallback.meta, ...(isPlainObject(data.meta) ? data.meta : {}) },
  };
  const keepIfNotEmpty = (key) => {
    const value = data[key];
    if (Array.isArray(value) && value.length === 0) merged[key] = fallback[key];
    if (!value) merged[key] = fallback[key];
  };
  ["stats", "announcements", "events", "gallery", "guides", "members"].forEach(keepIfNotEmpty);
  ["org", "roster", "uks", "contact"].forEach((key) => {
    if (!isPlainObject(merged[key]) || !Object.keys(merged[key]).length) merged[key] = fallback[key];
  });
  if (!isPlainObject(merged.settings) || !Object.keys(merged.settings).length) merged.settings = fallback.settings;
  // Partial settings documents must never drop the header logo, emergency
  // number, or contact block: fill the gaps from the bundled defaults.
  merged.settings = {
    ...fallback.settings,
    ...merged.settings,
    branding: { ...fallback.settings.branding, ...(isPlainObject(merged.settings.branding) ? merged.settings.branding : {}) },
    emergency: { ...fallback.settings.emergency, ...(isPlainObject(merged.settings.emergency) ? merged.settings.emergency : {}) },
    contact: { ...fallback.settings.contact, ...(isPlainObject(merged.settings.contact) ? merged.settings.contact : {}) },
  };
  return merged;
}

/** Documents the public site is allowed to receive (no admin-only fields). */
export const PUBLIC_CONTENT_META = Object.freeze({
  collections: COLLECTIONS,
  cache_seconds: 60,
});

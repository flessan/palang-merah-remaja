// Content read/write service for the PMR adapter.
//
// Reads: Telegraph Cloud collections → canonical PMR content JSON.
// Writes: validated admin payloads → Telegraph Cloud documents.
//
// The bundled fallback dataset lives in `./fallback.js` (shared with the
// browser build) so the site can still render when Telegraph Cloud is
// unavailable or not configured.

import {
  COLLECTIONS,
  buildContent,
  cleanString,
  isPlainObject,
} from "./schema.js";
import { fallbackContent, fallbackDocuments } from "./fallback.js";
import { createTelegraph, TelegraphError } from "./telegraph.js";

/* ------------------------------------------------------------------ */
/* reads                                                               */
/* ------------------------------------------------------------------ */

/**
 * Reads every collection and returns `{ content, degraded, errors }`.
 * A per-collection failure degrades only that section instead of blanking
 * the whole site.
 */
const fallbackCollections = fallbackDocuments;

export async function loadContent(env, { source = "telegraph" } = {}) {
  const telegraph = createTelegraph(env);
  if (!telegraph.config.configured) {
    return { content: { ...fallbackContent, source: "fallback", meta: { ...fallbackContent.meta, reason: "unconfigured" } }, degraded: true, errors: ["unconfigured"] };
  }

  const entries = await Promise.all(
    COLLECTIONS.map(async (collection) => {
      try {
        const records = await telegraph.readCollection(collection);
        return [collection, records.filter(isPlainObject), null];
      } catch (cause) {
        return [collection, [], cause instanceof TelegraphError ? cause.message : String(cause)];
      }
    }),
  );

  const collections = {};
  const errors = [];
  for (const [collection, documents, failure] of entries) {
    collections[collection] = documents;
    if (failure) errors.push(`${collection}: ${failure}`);
  }

  const everyEmpty = COLLECTIONS.every((name) => !collections[name]?.length);
  if (everyEmpty) {
    return {
      content: { ...fallbackContent, source: errors.length ? "fallback" : "empty", meta: { ...fallbackContent.meta, reason: errors.length ? "upstream" : "empty" } },
      degraded: true,
      errors,
    };
  }

  const content = buildContent(collections, {
    fallback: fallbackContent,
    source: errors.length ? "telegraph-partial" : source,
    meta: { degraded_sections: errors.length, errors },
  });

  return { content, degraded: errors.length > 0, errors };
}

export async function loadCollection(env, collection) {
  const name = cleanString(collection, 40).toLowerCase();
  if (!COLLECTIONS.includes(name)) return { error: "unknown_collection", status: 404 };
  const telegraph = createTelegraph(env);
  if (!telegraph.config.configured) {
    return { documents: fallbackCollections[name] || [], degraded: true };
  }
  try {
    const records = await telegraph.readCollection(name);
    return { documents: records.filter(isPlainObject), degraded: false };
  } catch (cause) {
    return {
      documents: fallbackCollections[name] || [],
      degraded: true,
      failure: cause instanceof TelegraphError ? cause.message : String(cause),
    };
  }
}

/* ------------------------------------------------------------------ */
/* writes                                                              */
/* ------------------------------------------------------------------ */

const TONES = ["red", "yellow", "blue", "mint", "pink", "ink"];
const ICON_PATTERN = /^[a-z0-9-]{1,32}$/;
const SAFE_IMAGE = /^(\/|https:\/\/)[^\s"'<>]{0,600}$/;

function safeImage(value, fallback = "") {
  const candidate = cleanString(value, 600);
  if (!candidate) return fallback;
  if (!SAFE_IMAGE.test(candidate)) return fallback;
  if (candidate.startsWith("//")) return fallback;
  return candidate;
}

function safeTone(value, fallback = "red") {
  const tone = cleanString(value, 16).toLowerCase();
  return TONES.includes(tone) ? tone : fallback;
}

function safeIcon(value, fallback = "shield-check") {
  const icon = cleanString(value, 32).toLowerCase();
  return ICON_PATTERN.test(icon) ? icon : fallback;
}

function validationError(field, message) {
  const error = new Error(message);
  error.status = 422;
  error.field = field;
  return error;
}

export function buildAnnouncement(body = {}) {
  const title = cleanString(body.title, 200);
  if (!title) throw validationError("title", "Judul kabar wajib diisi.");
  return {
    category: cleanString(body.category, 80) || "Kabar PMR",
    title,
    excerpt: cleanString(body.excerpt, 600),
    date: cleanString(body.date || body.date_label, 80) || "Kabar terbaru",
    date_iso: cleanString(body.date_iso, 30),
    image: safeImage(body.image || body.image_url),
    published: body.published !== false && body.is_published !== false,
    sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0,
  };
}

export function buildEvent(body = {}) {
  const title = cleanString(body.title, 200);
  if (!title) throw validationError("title", "Judul agenda wajib diisi.");
  return {
    title,
    date: cleanString(body.date || body.date_label, 80) || "Menyesuaikan kalender sekolah",
    time: cleanString(body.time || body.time_label, 80),
    location: cleanString(body.location, 160) || "SMKN 4 Banjarmasin",
    description: cleanString(body.description, 700),
    status: cleanString(body.status, 80) || "Informasi",
    published: body.published !== false && body.is_published !== false,
    sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0,
  };
}

export function buildAlbum(body = {}) {
  const title = cleanString(body.title, 200);
  if (!title) throw validationError("title", "Judul album wajib diisi.");
  const images = (Array.isArray(body.images) ? body.images : [])
    .map((image) => safeImage(image))
    .filter(Boolean)
    .slice(0, 60);
  const cover = safeImage(body.cover || body.cover_url, images[0] || "");
  if (!images.length && !cover) {
    throw validationError("images", "Album galeri memerlukan minimal satu foto.");
  }
  return {
    title,
    date: cleanString(body.date || body.date_label, 80),
    category: cleanString(body.category, 80) || "Kegiatan",
    description: cleanString(body.description, 700),
    cover,
    images: images.length ? images : cover ? [cover] : [],
    published: body.published !== false && body.is_published !== false,
    sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0,
  };
}

export function buildGuide(body = {}) {
  const title = cleanString(body.title, 120);
  if (!title) throw validationError("title", "Judul panduan wajib diisi.");
  const steps = (Array.isArray(body.steps) ? body.steps : [])
    .map((step) => cleanString(step, 400))
    .filter(Boolean)
    .slice(0, 12);
  if (!steps.length) throw validationError("steps", "Minimal satu langkah panduan diperlukan.");
  return {
    slug: cleanString(body.slug || body.id, 60).toLowerCase().replace(/[^a-z0-9-]/g, "") || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    title,
    icon: safeIcon(body.icon),
    tone: safeTone(body.tone),
    tag: cleanString(body.tag, 60) || "Panduan",
    summary: cleanString(body.summary, 400),
    steps,
    published: body.published !== false && body.is_published !== false,
    sort: Number.isFinite(Number(body.sort)) ? Number(body.sort) : 0,
  };
}

export function buildOrganization(body = {}) {
  const org = isPlainObject(body) ? body : {};
  return {
    period: cleanString(org.period || org.periode, 60) || "2026/2027",
    vision: cleanString(org.vision || org.visi, 600),
    mission: (Array.isArray(org.mission || org.misi) ? org.mission || org.misi : []).map((item) => cleanString(item, 300)).filter(Boolean).slice(0, 12),
    advisory: (Array.isArray(org.advisory) ? org.advisory : []).slice(0, 20).map((person) => ({
      name: cleanString(person?.name || person?.nama, 120),
      role: cleanString(person?.role || person?.jabatan, 120),
      description: cleanString(person?.description || person?.deskripsi, 400),
      icon: safeIcon(person?.icon, "graduation-cap"),
      icon_hint: true,
    })),
    leaders: (Array.isArray(org.leaders) ? org.leaders : []).slice(0, 24).map((person) => ({
      name: cleanString(person?.name || person?.nama, 120),
      role: cleanString(person?.role || person?.jabatan, 120),
      description: cleanString(person?.description || person?.deskripsi, 400),
      icon: safeIcon(person?.icon, "user-round"),
      photo: safeImage(person?.photo || person?.foto),
    })),
    divisions: (Array.isArray(org.divisions) ? org.divisions : []).slice(0, 16).map((division, index) => ({
      name: cleanString(division?.name || division?.divisi, 120) || `Divisi ${index + 1}`,
      icon: safeIcon(division?.icon, "heart-handshake"),
      tone: safeTone(division?.tone, TONES[index % TONES.length]),
      description: cleanString(division?.description || division?.deskripsi, 300),
      photo: safeImage(division?.photo || division?.foto),
      members: (Array.isArray(division?.members || division?.anggota) ? division.members || division.anggota : [])
        .map((member) => cleanString(member, 120))
        .filter(Boolean)
        .slice(0, 60),
    })),
  };
}

export function buildRoster(body = {}) {
  const roster = isPlainObject(body) ? body : {};
  const shift = (entry) => ({
    date: cleanString(entry?.date || entry?.tanggal, 120),
    day: cleanString(entry?.day || entry?.hari, 40),
    officers: (Array.isArray(entry?.officers || entry?.petugas) ? entry.officers || entry.petugas : [])
      .map((officer) => cleanString(officer, 160))
      .filter(Boolean)
      .slice(0, 40),
  });
  return {
    period: cleanString(roster.period || roster.periode, 60),
    month_label: cleanString(roster.month_label || roster.bulan_label, 60),
    description: cleanString(roster.description || roster.keterangan, 600),
    uks_schedule: (Array.isArray(roster.uks_schedule) ? roster.uks_schedule : []).slice(0, 40).map(shift),
    field_schedule: (Array.isArray(roster.field_schedule || roster.lapangan_schedule) ? roster.field_schedule || roster.lapangan_schedule : [])
      .slice(0, 40)
      .map(shift),
    published: roster.published !== false && roster.is_published !== false,
  };
}

export function buildUks(body = {}) {
  const uks = isPlainObject(body) ? body : {};
  const banner = isPlainObject(uks.welcome_banner) ? uks.welcome_banner : {};
  return {
    welcome_banner: {
      title: cleanString(banner.title, 200) || "Ruang UKS terbuka untuk seluruh siswa",
      subtitle: cleanString(banner.subtitle, 600),
      highlight: cleanString(banner.highlight, 400),
    },
    service_hours: cleanString(uks.service_hours || uks.jam_layanan, 200),
    location: cleanString(uks.location || uks.lokasi, 240),
    inventory: (Array.isArray(uks.inventory || uks.stok_obat_dan_alat) ? uks.inventory || uks.stok_obat_dan_alat : [])
      .slice(0, 80)
      .map((item, index) => ({
        id: cleanString(item?.id, 40) || `item-${index + 1}`,
        name: cleanString(item?.name || item?.nama, 200),
        category: cleanString(item?.category || item?.kategori, 80) || "Perlengkapan",
        purpose: cleanString(item?.purpose || item?.kegunaan, 400),
        status: cleanString(item?.status, 80) || "Tersedia & Gratis",
      }))
      .filter((item) => item.name),
    procedure: (Array.isArray(uks.procedure || uks.prosedur_kunjungan) ? uks.procedure || uks.prosedur_kunjungan : [])
      .slice(0, 12)
      .map((step, index) => ({
        step: cleanString(step?.step, 160) || `Langkah ${index + 1}`,
        description: cleanString(step?.description || step?.deskripsi, 500),
      })),
    rules: (Array.isArray(uks.rules || uks.tata_tertib) ? uks.rules || uks.tata_tertib : [])
      .map((rule) => cleanString(rule, 400))
      .filter(Boolean)
      .slice(0, 20),
  };
}

export function buildSettings(body = {}) {
  const settings = isPlainObject(body) ? body : {};
  const branding = isPlainObject(settings.branding) ? settings.branding : {};
  const emergency = isPlainObject(settings.emergency) ? settings.emergency : {};
  const contact = isPlainObject(settings.contact) ? settings.contact : {};
  const sekretariat = isPlainObject(contact.sekretariat) ? contact.sekretariat : {};
  const bergabung = isPlainObject(contact.bergabung) ? contact.bergabung : {};
  return {
    branding: {
      name: cleanString(branding.name, 140) || "PMR Wira SMKN 4 Banjarmasin",
      short_name: cleanString(branding.short_name, 40) || "PMR WIRA",
      school: cleanString(branding.school, 80) || "SMKN 4 Banjarmasin",
      tagline: cleanString(branding.tagline, 120) || "Humanis. Peduli. Tanggap.",
      logo: safeImage(branding.logo, "/gudang/logo/pmr-logo.webp"),
      icon: safeImage(branding.icon, "/gudang/logo/icon.svg"),
      og_image: safeImage(branding.og_image, "/gudang/logo/og-image.png"),
      canonical_url: cleanString(branding.canonical_url, 200) || "https://pmr.likesyou.org/",
    },
    stats: (Array.isArray(settings.stats) ? settings.stats : [])
      .slice(0, 12)
      .map((stat, index) => ({
        value: Number.isFinite(Number(stat?.value)) ? Number(stat.value) : 0,
        label: cleanString(stat?.label, 80) || `Statistik ${index + 1}`,
        icon: safeIcon(stat?.icon, "sparkles"),
        suffix: cleanString(stat?.suffix, 8),
      })),
    emergency: {
      headline: cleanString(emergency.headline, 160) || "Butuh bantuan medis segera?",
      number: cleanString(emergency.number, 32) || "119",
      note: cleanString(emergency.note, 240),
      wa_link: cleanString(emergency.wa_link, 300),
    },
    contact: {
      sekretariat: {
        alamat: cleanString(sekretariat.alamat, 200),
        telepon: cleanString(sekretariat.telepon, 60),
        email: cleanString(sekretariat.email, 120),
        instagram: cleanString(sekretariat.instagram, 80).replace(/^@/, ""),
        wa_link: cleanString(sekretariat.wa_link, 300),
        whatsapp_number: cleanString(sekretariat.whatsapp_number, 30),
        jadwal: (Array.isArray(sekretariat.jadwal) ? sekretariat.jadwal : []).slice(0, 10).map((slot) => ({
          hari: cleanString(slot?.hari, 60),
          waktu: cleanString(slot?.waktu, 60),
        })),
      },
      bergabung: {
        deskripsi: cleanString(bergabung.deskripsi, 700),
        persyaratan: (Array.isArray(bergabung.persyaratan) ? bergabung.persyaratan : []).map((item) => cleanString(item, 200)).filter(Boolean).slice(0, 12),
        catatan: cleanString(bergabung.catatan, 400),
        link_wa: cleanString(bergabung.link_wa, 300),
      },
    },
    social_links: (Array.isArray(settings.social_links) ? settings.social_links : []).slice(0, 10).map((link) => ({
      label: cleanString(link?.label, 60),
      url: cleanString(link?.url, 300),
      icon: safeIcon(link?.icon, "link"),
    })),
  };
}

export const BUILDERS = Object.freeze({
  announcements: buildAnnouncement,
  events: buildEvent,
  gallery: buildAlbum,
  guides: buildGuide,
});

/* ------------------------------------------------------------------ */
/* admin payload for one collection                                    */
/* ------------------------------------------------------------------ */

export function buildSingleton(collection, body) {
  if (collection === "organization") return buildOrganization(body);
  if (collection === "roster") return buildRoster(body);
  if (collection === "uks") return buildUks(body);
  if (collection === "site_settings") return buildSettings(body);
  return null;
}

export function idempotencyKey(prefix) {
  const random = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

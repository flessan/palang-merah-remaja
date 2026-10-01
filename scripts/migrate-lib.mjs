// Pure helpers shared by the migration scripts (no network, easy to test).

import { COLLECTIONS } from "../shared/content.js";
import {
  buildAlbum,
  buildAnnouncement,
  buildEvent,
  buildGuide,
  buildOrganization,
  buildRoster,
  buildSettings,
  buildUks,
} from "../functions/_lib/content.js";

export const COLLECTIONS_TO_MIGRATE = COLLECTIONS;

const SINGLETON_COLLECTIONS = ["organization", "roster", "uks", "site_settings"];

function slug(value, fallback = "item") {
  const result = String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return result || fallback;
}

/**
 * Accepts either the bundled PMR content shape or a legacy Neon/PostgreSQL
 * export (site_content rows or a plain JSON dump) and returns the canonical
 * document map keyed by Telegraph collection.
 */
export function normaliseLegacyExport(input) {
  if (!input || typeof input !== "object") return {};
  const source = input.content || input.data || input;

  const pickSingleton = (name, aliases = []) => {
    const candidates = [name, ...aliases];
    for (const key of candidates) {
      const value = source[key];
      if (Array.isArray(value)) return value[0] || null;
      if (value && typeof value === "object") return value;
    }
    // Legacy `site_content` rows: [{ key, value }]
    if (Array.isArray(source.site_content)) {
      const row = source.site_content.find((entry) => candidates.includes(entry?.key));
      if (row) return typeof row.value === "string" ? JSON.parse(row.value) : row.value;
    }
    return null;
  };

  const settings = pickSingleton("site_settings", ["settings"]) || {};
  const contact = pickSingleton("contact");

  return {
    announcements: source.announcements || [],
    events: source.events || [],
    gallery: source.gallery || source.gallery_albums || [],
    guides: source.guides || [],
    organization: [pickSingleton("organization", ["org"])].filter(Boolean),
    roster: [pickSingleton("roster")].filter(Boolean),
    uks: [pickSingleton("uks", ["uks_info"])].filter(Boolean),
    site_settings: [
      {
        ...settings,
        stats: settings.stats || pickSingleton("stats") || [],
        social_links: settings.social_links || [],
        contact: settings.contact || contact || {},
      },
    ],
  };
}

function withKey(collection, index, document) {
  const legacyKey = document.legacy_key
    || `${slug(document.slug || document.title || `${collection}-${index + 1}`, `${collection}-${index + 1}`)}`;
  return { ...document, legacy_key: legacyKey, migrated_from: "pmr-v1" };
}

/**
 * Builds the Telegraph documents for every collection, reusing the exact
 * builders the runtime admin API uses so migrated content is shaped identically.
 */
export function buildDocuments(source = {}) {
  const documents = {};
  const keys = {};

  documents.announcements = (source.announcements || []).map((item, index) =>
    withKey("announcements", index, buildAnnouncement(item)),
  );
  documents.events = (source.events || []).map((item, index) => withKey("events", index, buildEvent(item)));
  documents.gallery = (source.gallery || []).map((item, index) => withKey("gallery", index, buildAlbum(item)));
  documents.guides = (source.guides || []).map((item, index) => withKey("guides", index, buildGuide(item)));

  documents.organization = (source.organization || []).map((item) => withKey("organization", 0, buildOrganization(item)));
  documents.roster = (source.roster || []).map((item) => withKey("roster", 0, buildRoster(item)));
  documents.uks = (source.uks || []).map((item) => withKey("uks", 0, buildUks(item)));

  const settingsSource = (source.site_settings || [])[0] || {};
  const settings = buildSettings(settingsSource);
  settings.stats = (settingsSource.stats || []).slice(0, 12).map((stat, index) => ({
    value: Number(stat?.value) || 0,
    label: String(stat?.label || `Statistik ${index + 1}`).slice(0, 80),
    icon: String(stat?.icon || "sparkles").slice(0, 32),
    suffix: String(stat?.suffix || "").slice(0, 8),
  }));
  documents.site_settings = [withKey("site_settings", 0, settings)];

  for (const collection of Object.keys(documents)) {
    keys[collection] = documents[collection].map((document) => document.legacy_key);
  }

  return { documents, keys, legacyKeys: keys };
}

export { SINGLETON_COLLECTIONS };

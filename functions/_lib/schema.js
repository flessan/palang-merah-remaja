// Re-exports the shared PMR content contract for the Pages Functions bundle,
// plus the bounded string helper used by the admin validators.
//
// `shared/content.js` is framework-agnostic (no Cloudflare APIs, no secrets) so
// the same normalisers run in the browser bundle and server-side.
import { text } from "../../shared/content.js";

export {
  CATEGORY_DEFAULT,
  COLLECTIONS,
  CONTENT_VERSION,
  PUBLIC_CONTENT_META,
  bool,
  buildContent,
  isPlainObject,
  list,
  mergeContent,
  normaliseAlbum,
  normaliseAnnouncement,
  normaliseEvent,
  normaliseGuide,
  normaliseOrganization,
  normaliseRoster,
  normaliseSettings,
  normaliseUks,
  objects,
  text,
} from "../../shared/content.js";

/**
 * Trimmed, length-bounded string for admin input.
 * Unlike the normaliser `text(value, fallback)`, the second argument is a
 * maximum length — validators depend on that distinction.
 */
export function cleanString(value, max = 500) {
  const base = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";
  return base.slice(0, max);
}

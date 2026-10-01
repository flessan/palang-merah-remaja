// Small, dependency-free helpers shared across the PMR UI.

/** Joins class names, ignoring falsy values. */
export function cn(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatNumber(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return parsed.toLocaleString("id-ID");
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Deterministic pseudo-random in [-spread, spread].
 * Used for the scrapbook rotation so a photo always tilts the same way.
 */
export function tilt(seed = "", spread = 2.4) {
  let hash = 0;
  const text = String(seed);
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 100000;
  }
  const unit = (hash % 1000) / 1000; // 0..1
  return Number(((unit * 2 - 1) * spread).toFixed(2));
}

export function formatDateLabel(value, fallback = "") {
  const text = String(value || "").trim();
  if (!text) return fallback;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text;
  return parsed.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

export function initials(name) {
  return String(name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

export function isUrl(value) {
  return /^(https?:\/\/|\/)[^\s]+$/.test(String(value || ""));
}

export function whatsappLink(number, message = "") {
  const digits = String(number || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

export function groupBy(items, keyFn) {
  return (items || []).reduce((accumulator, item) => {
    const key = keyFn(item) || "Lainnya";
    accumulator[key] = accumulator[key] || [];
    accumulator[key].push(item);
    return accumulator;
  }, {});
}

export function truncate(value, length = 120) {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}

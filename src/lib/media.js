// Media helpers.
//
// Assets live either in Telegraph Cloud object storage (public delivery URL
// `/p/<projectId>/<bucket>/<key>`) or in the local `/gudang/…` fallback folder.
// The browser only ever sees public URLs — never a storage credential.

import { tilt } from "./utils.js";

export const DEFAULT_LOGO = "/gudang/logo/pmr-logo.webp";
export const DEFAULT_ICON = "/gudang/logo/icon.svg";
export const DEFAULT_OG_IMAGE = "/gudang/logo/og-image.png";

/** Fallback photo used when a card references a missing image. */
export const PLACEHOLDER_PHOTO = "/gudang/gallery/4.jpg";

export function isRemote(url) {
  return /^https?:\/\//i.test(String(url || ""));
}

export function isLocalAsset(url) {
  return String(url || "").startsWith("/gudang/");
}

/** Resolves a content image reference into something <img> can load. */
export function resolveMedia(url, fallback = PLACEHOLDER_PHOTO) {
  const value = String(url || "").trim();
  if (!value) return fallback;
  if (value.startsWith("//")) return fallback;
  if (!/^(https?:\/\/|\/)/i.test(value)) return fallback;
  return value;
}

/** Adds a deterministic tilt + offset for scrapbook compositions. */
export function photoStyle(seed, { spread = 2.4, lift = 0 } = {}) {
  const degrees = tilt(seed, spread);
  return {
    "--tilt": `${degrees}deg`,
    "--lift": `${lift}px`,
  };
}

/**
 * Builds a `srcset` when the same asset folder also carries `@2x` variants.
 * Returns `undefined` when no variant is known, so callers can skip the attr.
 */
export function srcSetFor(url) {
  const value = String(url || "");
  if (!value || /\.svg$/i.test(value)) return undefined;
  const match = /^(.*)\.(avif|webp|jpe?g|png)$/i.exec(value);
  if (!match) return undefined;
  const [, base, extension] = match;
  return `${base}.${extension} 1x, ${base}@2x.${extension} 2x`;
}

export function altText(primary, fallback = "Dokumentasi kegiatan PMR Wira SMKN 4 Banjarmasin") {
  return String(primary || "").trim() || fallback;
}

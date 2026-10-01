// Content helpers for the browser bundle.
//
// The canonical contract lives in `shared/content.js`, which is also used by
// the Pages Functions adapter — one model, two runtimes.

export {
  buildContent,
  isPlainObject,
  mergeContent,
  normaliseAlbum,
  normaliseAnnouncement,
  normaliseEvent,
  normaliseGuide,
  normaliseOrganization,
  normaliseSettings,
  normaliseUks,
  text,
} from "../../shared/content.js";

import { fallbackContent } from "../../shared/fallback.js";

export const FALLBACK_CONTENT = fallbackContent;

export const NAV_ITEMS = [
  { id: "beranda", label: "Beranda", icon: "home", description: "Kabar, agenda & jadwal jaga" },
  { id: "profil", label: "Profil", icon: "user-round", description: "Visi, misi & struktur organisasi" },
  { id: "sejarah", label: "Sejarah", icon: "landmark", description: "Riwayat & pendiri PMR Wira" },
  { id: "uks", label: "UKS", icon: "heart-pulse", description: "Layanan kesehatan & obat gratis" },
  { id: "edukasi", label: "Edukasi P3K", icon: "shield-plus", description: "Panduan pertolongan pertama" },
  { id: "galeri", label: "Galeri", icon: "images", description: "Dokumentasi kegiatan" },
  { id: "kontak", label: "Kontak", icon: "message-circle", description: "Sekretariat & jam layanan" },
];

export const TAB_IDS = [...NAV_ITEMS.map((item) => item.id), "admin"];

export const PAGE_TITLES = {
  beranda: "PMR Wira — SMKN 4 Banjarmasin | Palang Merah Remaja",
  profil: "Profil & Struktur — PMR Wira SMKN 4 Banjarmasin",
  sejarah: "Sejarah & Pendiri — PMR Wira SMKN 4 Banjarmasin",
  uks: "Ruang UKS & Obat Gratis — PMR Wira SMKN 4 Banjarmasin",
  edukasi: "Edukasi P3K — PMR Wira SMKN 4 Banjarmasin",
  galeri: "Galeri Kegiatan — PMR Wira SMKN 4 Banjarmasin",
  kontak: "Kontak Sekretariat — PMR Wira SMKN 4 Banjarmasin",
  admin: "Portal Admin — PMR Wira SMKN 4 Banjarmasin",
};

/** Unknown/legacy `?tab=` values fall back to beranda instead of a blank page. */
export function tabFromLocation(search = typeof window === "undefined" ? "" : window.location.search) {
  const tab = new URLSearchParams(search).get("tab");
  return tab && TAB_IDS.includes(tab) ? tab : "beranda";
}

/** Categories used by gallery filters, in a stable, human order. */
export function galleryCategories(albums) {
  const preferred = [];
  for (const album of albums || []) {
    if (album.category && !preferred.includes(album.category)) preferred.push(album.category);
  }
  return ["Semua", ...preferred];
}

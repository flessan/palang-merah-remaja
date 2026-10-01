// Field definitions + validation for admin forms.
// Kept declarative so tables and forms share one source of truth.

import { isUrl } from "../../lib/utils.js";

export const FIELD_DEFS = {
  announcements: [
    { name: "title", label: "Judul kabar", type: "text", required: true, max: 200, span: 2 },
    { name: "category", label: "Kategori", type: "text", max: 80, placeholder: "Kabar PMR" },
    { name: "date", label: "Tanggal (teks)", type: "text", max: 80, placeholder: "16 Januari 2026" },
    { name: "excerpt", label: "Ringkasan", type: "textarea", max: 600, span: 2 },
    { name: "image", label: "Gambar utama", type: "image", span: 2 },
    { name: "published", label: "Tayangkan di situs", type: "boolean" },
  ],
  events: [
    { name: "title", label: "Nama agenda", type: "text", required: true, max: 200, span: 2 },
    { name: "date", label: "Tanggal / keterangan", type: "text", max: 80, placeholder: "Setiap Kamis" },
    { name: "time", label: "Waktu", type: "text", max: 80, placeholder: "15.00–17.00 WITA" },
    { name: "location", label: "Lokasi", type: "text", max: 160, span: 2 },
    { name: "description", label: "Deskripsi", type: "textarea", max: 700, span: 2 },
    { name: "status", label: "Status", type: "text", max: 80, placeholder: "Terbuka untuk anggota" },
    { name: "published", label: "Tayangkan di situs", type: "boolean" },
  ],
  gallery: [
    { name: "title", label: "Judul album", type: "text", required: true, max: 200, span: 2 },
    { name: "category", label: "Kategori", type: "text", max: 80, placeholder: "Latihan" },
    { name: "date", label: "Tanggal (teks)", type: "text", max: 80, placeholder: "16 Januari 2026" },
    { name: "description", label: "Deskripsi album", type: "textarea", max: 700, span: 2 },
    { name: "cover", label: "Foto sampul", type: "image", span: 2 },
    { name: "images", label: "Daftar foto album", type: "images", span: 2 },
    { name: "published", label: "Tayangkan di situs", type: "boolean" },
  ],
  guides: [
    { name: "title", label: "Judul panduan", type: "text", required: true, max: 120 },
    { name: "tag", label: "Label", type: "text", max: 60, placeholder: "Tindakan cepat" },
    { name: "icon", label: "Ikon", type: "icon" },
    { name: "tone", label: "Warna", type: "tone" },
    { name: "summary", label: "Ringkasan", type: "textarea", max: 400, span: 2 },
    { name: "steps", label: "Langkah-langkah", type: "steps", span: 2 },
    { name: "published", label: "Tayangkan di situs", type: "boolean" },
  ],
};

export const ICON_OPTIONS = [
  "droplets", "flame", "wind", "accessibility", "shield-plus", "bandage", "stethoscope",
  "heart-pulse", "thermometer", "pill", "briefcase-medical", "circle-alert", "hand-heart",
];

export const TONE_OPTIONS = ["red", "yellow", "blue", "mint", "pink"];

export function emptyItem(collection) {
  if (collection === "announcements") return { category: "Kabar PMR", title: "", excerpt: "", date: "", image: "", published: true };
  if (collection === "events") return { title: "", date: "", time: "", location: "SMKN 4 Banjarmasin", description: "", status: "Informasi", published: true };
  if (collection === "gallery") return { title: "", category: "Kegiatan", date: "", description: "", cover: "", images: [], published: true };
  if (collection === "guides") return { title: "", tag: "Panduan", icon: "shield-plus", tone: "red", summary: "", steps: [""], published: true };
  return {};
}

/** Returns a `{ field: message }` map; empty means valid. */
export function validate(collection, item) {
  const errors = {};
  for (const field of FIELD_DEFS[collection] || []) {
    const value = item[field.name];
    if (field.required && !String(value ?? "").trim()) {
      errors[field.name] = `${field.label} wajib diisi.`;
      continue;
    }
    if (field.max && String(value ?? "").length > field.max) {
      errors[field.name] = `${field.label} maksimal ${field.max} karakter.`;
    }
    if ((field.name === "image" || field.name === "cover") && String(value || "").trim() && !isUrl(value)) {
      errors[field.name] = "Gunakan URL yang valid atau pilih dari aset.";
    }
  }
  if (collection === "guides") {
    const steps = (item.steps || []).map((step) => String(step).trim()).filter(Boolean);
    if (!steps.length) errors.steps = "Tambahkan minimal satu langkah.";
  }
  if (collection === "gallery") {
    const images = (item.images || []).filter(Boolean);
    if (!images.length && !String(item.cover || "").trim()) errors.images = "Pilih minimal satu foto.";
  }
  return errors;
}

export function summarize(collection, item) {
  if (collection === "announcements") return item.excerpt;
  if (collection === "events") return `${item.date || ""} · ${item.location || ""}`;
  if (collection === "gallery") return `${(item.images || []).length} foto · ${item.category || ""}`;
  if (collection === "guides") return `${(item.steps || []).length} langkah`;
  return "";
}

export const COLLECTION_LABELS = {
  announcements: "Kabar & berita",
  events: "Agenda kegiatan",
  gallery: "Galeri album",
  guides: "Panduan P3K",
  organization: "Organisasi & divisi",
  roster: "Jadwal jaga",
  uks: "Ruang UKS",
  site_settings: "Pengaturan situs",
};

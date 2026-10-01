// Unit tests for the shared PMR content contract (browser + server).
// Run: node tests/content.test.mjs

import { createReporter } from "./harness.mjs";
import { COLLECTIONS, buildContent, mergeContent, normaliseAnnouncement, normaliseAlbum, normaliseUks } from "../shared/content.js";
import { fallbackContent, fallbackDocuments } from "../shared/fallback.js";

const { check, equal, summary } = createReporter("tests/content");

console.log("\n== Kontrak konten ==");
check("delapan koleksi Telegraph terdaftar", COLLECTIONS.length === 8 && COLLECTIONS.includes("site_settings"));

console.log("\n== Normalisasi tahan data rusak ==");
{
  const announcement = normaliseAnnouncement({
    id: "ann_1",
    title: "  Kabar penting  ",
    category: "",
    excerpt: null,
    image: "/gudang/gallery/1.jpg",
    is_published: "false",
    date_label: "1 Januari 2026",
  });
  equal("judul di-trim", announcement.title, "Kabar penting");
  equal("kategori kosong → default", announcement.category, "Kabar PMR");
  equal("teks null → string kosong", announcement.excerpt, "");
  equal("is_published dukung string", announcement.published, false);
  equal("date_label dipetakan", announcement.date, "1 Januari 2026");

  const album = normaliseAlbum({ title: "Album", images: ["a.jpg", "", null, "b.jpg"], cover: "" });
  equal("gambar kosong disaring", album.images.length, 2);
  equal("cover jatuh ke gambar pertama", album.cover, "a.jpg");

  const uks = normaliseUks({ stok_obat_dan_alat: [{ nama: "Paracetamol", kegunaan: "Demam", status: "Ada" }] });
  equal("legacy inventory dipetakan", uks.inventory[0].name, "Paracetamol");
  equal("legacy purpose dipetakan", uks.inventory[0].purpose, "Demam");

  check("objek null tidak melempar", Boolean(normaliseAnnouncement(null)));
  check("array sebagai dokumen tidak melempar", Boolean(normaliseAlbum([1, 2, 3])));
}

console.log("\n== buildContent ==");
{
  const content = buildContent(
    {
      announcements: [
        { id: "a1", title: "Terbit", published: true, sort: 2 },
        { id: "a2", title: "Draf", published: false, sort: 9 },
      ],
      guides: [{ title: "Mimisan", steps: ["Duduk", "Pencet"] }],
    },
    { fallback: fallbackContent, source: "telegraph" },
  );
  equal("sumber dilaporkan", content.source, "telegraph");
  equal("item tidak tayang ada di belakang", content.announcements[0].title, "Terbit");
  // Drafts stay in the payload for the admin panel, but never lead the list.
  check("draf tetap dikirim ke admin", content.announcements.length === 2);
  check("koleksi kosong memakai fallback", content.gallery.length > 0);
  check("meta mencatat jumlah koleksi", content.meta.collections.announcements === 2);
  check("degraded=false saat koleksi tersedia", content.meta.degraded === false);

  const empty = buildContent({}, { fallback: fallbackContent, source: "empty" });
  equal("tanpa koleksi → degraded", empty.meta.degraded, true);
  check("fallback dipakai penuh", empty.gallery.length === fallbackContent.gallery.length);
}

console.log("\n== mergeContent (mode fallback) ==");
{
  const merged = mergeContent({ stats: [], announcements: [], guides: [], source: "telegraph-partial" }, fallbackContent);
  check("array kosong diganti fallback", merged.announcements.length === fallbackContent.announcements.length);
  check("stats kosong diganti fallback", merged.stats.length === fallbackContent.stats.length);
  check("sumber parsial dipertahankan", merged.source === "telegraph-partial");

  const bad = mergeContent("bukan objek", fallbackContent);
  check("payload tidak valid → fallback", bad === fallbackContent);
  const nullish = mergeContent(null, fallbackContent);
  check("payload null → fallback", nullish === fallbackContent);

  const partial = mergeContent(
    { settings: { branding: { name: "PMR Wira SMKN 4" } }, source: "telegraph" },
    fallbackContent,
  );
  equal("branding parsial dipertahankan", partial.settings.branding.name, "PMR Wira SMKN 4");
  check("field branding lain diisi default", Boolean(partial.settings.branding.logo));
  check("emergency diisi default", Boolean(partial.settings.emergency.number));
  check("roster fallback tetap utuh", partial.roster.uks_schedule.length > 0);
}

console.log("\n== Dataset fallback ==");
{
  check("statistik nyata", fallbackContent.stats.length >= 3);
  check("panduan P3K empat topik", fallbackContent.guides.length === 4);
  check("setiap panduan punya langkah", fallbackContent.guides.every((guide) => guide.steps.length >= 4));
  check("pengurus inti lengkap", fallbackContent.org.leaders.some((leader) => leader.role === "Ketua"));
  check("divisi berjumlah empat", fallbackContent.org.divisions.length === 4);
  check("inventaris UKS terisi", fallbackContent.uks.inventory.length >= 10);
  check("jadwal jaga UKS tersedia", fallbackContent.roster.uks_schedule.length > 0);
  check("aset tetap lokal untuk fallback", JSON.stringify(fallbackContent.gallery).includes("/gudang/"));
  check("dokumen fallback siap migrasi", Array.isArray(fallbackDocuments.announcements) && fallbackDocuments.gallery.length > 0);
}

summary();

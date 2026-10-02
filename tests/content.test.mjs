// Unit tests for the shared PMR content contract (browser + server).
// Run: node tests/content.test.mjs

import { createReporter } from "./harness.mjs";
import {
  COLLECTIONS,
  buildContent,
  mergeContent,
  normaliseAnnouncement,
  normaliseAlbum,
  normaliseMember,
  normaliseOfficer,
  normaliseShift,
  normaliseUks,
  officerLabel,
} from "../shared/content.js";
import { fallbackContent, fallbackDocuments } from "../shared/fallback.js";
import { buildMonthShifts, classOptions, divisionOptions, groupByDivision, resolveOfficer, roleOptions } from "../src/lib/members.js";

const { check, equal, summary } = createReporter("tests/content");

console.log("\n== Kontrak konten ==");
check("sembilan koleksi Telegraph terdaftar", COLLECTIONS.length === 9 && COLLECTIONS.includes("site_settings"));
check("koleksi anggota tersedia", COLLECTIONS.includes("members"));

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

console.log("\n== Direktori anggota & petugas jaga ==");
{
  const member = normaliseMember({ nama: "  Siti Aminah ", kelas: "XI-A1", divisi: "Humas", foto: "/gudang/org/x.jpeg" });
  equal("nama anggota dibersihkan", member.name, "Siti Aminah");
  equal("kelas legacy dibaca", member.class_name, "XI-A1");
  equal("divisi legacy dibaca", member.division, "Humas");
  equal("foto anggota dibaca", member.photo, "/gudang/org/x.jpeg");
  equal("jabatan default", normaliseMember({ name: "Budi" }).role, "Anggota");
  check("anggota tanpa nama tetap objek aman", Boolean(normaliseMember(null)));

  // Roster officers: legacy strings, directory objects, and both together.
  const legacy = normaliseOfficer("Muhammad Yorda Herdana (XI-RPL 1)");
  equal("nama dipisah dari kelas", legacy.name, "Muhammad Yorda Herdana");
  equal("kelas dibaca dari tanda kurung", legacy.class_name, "XI-RPL 1");

  const linked = normaliseOfficer({ id: "mem_2", name: "Sari", class_name: "XI-A2", photo: "/p/x.jpg" });
  equal("tautan direktori dipertahankan", linked.id, "mem_2");
  check("nama kosong diabaikan", normaliseOfficer("   ") === null && normaliseOfficer({}) === null);

  const shift = normaliseShift({ officers: ["Petugas piket", { id: "m1", name: "Sari", class_name: "XI-A2" }] });
  equal("dua bentuk petugas dinormalisasi", shift.officers.length, 2);
  equal("label petugas untuk teks WhatsApp", officerLabel(shift.officers[1]), "Sari (XI-A2)");
  equal("label tanpa kelas", officerLabel("Petugas piket"), "Petugas piket");
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

  const directory = fallbackContent.members;
  check("direktori anggota terisi dari data nyata", directory.length >= 30);
  check("direktori memuat pengurus", directory.some((member) => member.role === "Ketua"));
  check("kelas anggota terbaca dari jadwal", directory.filter((member) => member.class_name).length >= 10);
  check("foto anggota memakai berkas asli", directory.filter((member) => member.photo).every((member) => member.photo.startsWith("/gudang/org/")));
  check("tidak ada anggota bernama contoh", !directory.some((member) => /lorem|contoh|test/i.test(member.name)));
  check("setiap divisi berisi orang", groupByDivision(directory, fallbackContent.org).every((group) => group.members.length > 0));
  const wall = groupByDivision(directory.filter((member) => member.division), fallbackContent.org);
  check("dinding anggota hanya berisi empat divisi", wall.length === 4);
}

console.log("\n== Opsi picker admin ==");
{
  const members = fallbackContent.members;
  check("opsi kelas berasal dari data nyata", classOptions(members, fallbackContent.roster).length >= 10);
  check("opsi divisi memuat empat divisi", divisionOptions(members, fallbackContent.org).length >= 4);
  check("opsi jabatan memuat jabatan pengurus", roleOptions(members, fallbackContent.org).some((option) => option.value === "Sekretaris 1"));

  const officer = { id: "", name: members[0].name, class_name: "", photo: "" };
  equal("petugas string dicocokkan ke direktori", resolveOfficer(officer, members).photo, members[0].photo);
  const unknown = resolveOfficer("Orang Baru", members);
  equal("nama di luar direktori tetap aman", unknown.name, "Orang Baru");
  equal("foto kosong bila tidak ada", unknown.photo, "");

  const generated = buildMonthShifts({ month: "Juli", year: 2026, days: ["Senin", "Rabu"], count: 4 });
  equal("generator sebulan menghasilkan 8 shift", generated.length, 8);
  equal("urutan kronologis dimulai dari hari pertama bulan itu", generated[0].date, "Rabu, 1 Juli 2026");
  check("hanya hari yang dipilih", generated.every((shift) => ["Senin", "Rabu"].includes(shift.day)));
  check("empat Senin dan empat Rabu", generated.filter((shift) => shift.day === "Senin").length === 4);
  check("tanggal berformat Indonesia", generated.every((shift) => new RegExp(`^${shift.day}, \\d+ Juli 2026$`).test(shift.date)));
  check("tanggal menaik", generated.every((shift, index) => index === 0 || generated[index - 1].date !== shift.date));
  check("shift baru belum berisi petugas", generated.every((shift) => shift.officers.length === 0));
}

summary();

const galleryImages = [
  "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif",
  "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_tbchum.avif",
  "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_2_gzls5q.avif",
];

export const demoContent = {
  source: "demo",
  stats: [
    { value: 342, label: "Total alumni", icon: "users" },
    { value: 120, label: "Relawan aktif", icon: "user-round-check" },
    { value: 56, label: "Aksi sosial", icon: "heart-handshake" },
  ],
  announcements: [
    { id: "news-1", category: "Latihan gabungan", title: "Latgab bersama Pramuka MAN 3 Banjarmasin", excerpt: "Mempererat silaturahmi sekaligus mengasah keterampilan pertolongan pertama antarorganisasi.", date: "16 Januari 2026", image: galleryImages[0] },
    { id: "news-2", category: "Kabar PMR", title: "PMR Wira terus bergerak untuk kemanusiaan", excerpt: "Dari latihan rutin hingga aksi sosial, setiap anggota belajar hadir dan memberi dampak.", date: "Kabar terbaru", image: "/gudang/gallery/juara.avif" },
    { id: "news-3", category: "Dokumentasi", title: "Belajar, berlatih, dan tumbuh bersama", excerpt: "Dokumentasi kegiatan anggota PMR Wira SMKN 4 Banjarmasin.", date: "Arsip kegiatan", image: "/gudang/gallery/IMG-20260129-WA0032_p6mnxz_ggclja.avif" },
  ],
  events: [
    { id: "event-1", title: "Latihan rutin PMR", date: "Setiap Kamis", time: "15.00–17.00 WITA", location: "Aula / lapangan sekolah", description: "Latihan keterampilan kepalangmerahan, P3K, dan kesiapsiagaan untuk anggota.", status: "Terbuka untuk anggota" },
    { id: "event-2", title: "Pendaftaran anggota baru", date: "Awal semester genap", time: "Menyesuaikan pengumuman", location: "SMKN 4 Banjarmasin", description: "Kesempatan untuk siswa aktif yang ingin bertumbuh dalam aksi kemanusiaan.", status: "Informasi" },
  ],
  gallery: [
    { id: 1, title: "Latgab Pramuka MAN 3 bersama PMR", date: "16 Januari 2026", category: "Latihan", cover: galleryImages[0], images: galleryImages, description: "Latihan gabungan untuk mempererat silaturahmi dan meningkatkan keterampilan pertolongan pertama." },
    { id: 2, title: "Latgab PMR Wira dan Pramuka", date: "17 Januari 2026", category: "Latihan", cover: "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_nl0mgr.avif", images: ["/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_nl0mgr.avif", "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_2_allwc1.avif", "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_1_efbbiz.avif"], description: "Belajar bekerja sama, berbagi peran, dan tetap tanggap dalam setiap simulasi." },
    { id: 3, title: "Dokumentasi aksi dan kebersamaan", date: "2026", category: "Aksi sosial", cover: "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", images: ["/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", "/gudang/gallery/IMG-20260129-WA0035_fwkslt_jjng7f.avif"], description: "Momen kebersamaan anggota PMR Wira dalam menjalankan semangat humanis, peduli, dan tanggap." },
    { id: 4, title: "Prestasi PMR Wira", date: "Arsip kegiatan", category: "Prestasi", cover: "/gudang/gallery/juara.avif", images: ["/gudang/gallery/juara.avif"], description: "Apresiasi untuk kerja keras, disiplin, dan semangat belajar seluruh anggota." },
    { id: 5, title: "Latihan keterampilan anggota", date: "Arsip kegiatan", category: "Latihan", cover: "/gudang/gallery/IMG-20260129-WA0037_ywu4kh_eldskn.avif", images: ["/gudang/gallery/IMG-20260129-WA0037_ywu4kh_eldskn.avif"], description: "Latihan yang membangun kepercayaan diri dan kesiapan untuk membantu sesama." },
  ],
  org: {
    periode: "2026/2027",
    advisory: [
      { jabatan: "Wakasek Kesiswaan", nama: "Eka Lisdyawati, M.Pd.", icon: "graduation-cap", deskripsi: "Penanggung jawab umum kebijakan kesiswaan dan pengembangan organisasi sekolah." },
      { jabatan: "Pembina UKS", nama: "Winda Hairani, S.Pd.", icon: "user-round", deskripsi: "Pembimbing teknis operasional dan jembatan antara kurikulum dengan kegiatan PMR." },
    ],
    leaders: [
      { role: "Pembina PMR", nama: "Winda Hairani, S.Pd.", icon: "shield-check", deskripsi: "Guru pembimbing ekstrakurikuler PMR Wira SMKN 4 Banjarmasin." },
      { role: "Ketua", nama: "Adilla Hafiza", icon: "crown", deskripsi: "Pemimpin eksekutif dan penanggung jawab utama seluruh program kerja PMR Wira." },
      { role: "Wakil Ketua", nama: "Assyifa Qolbi", icon: "users", foto: "/gudang/org/wakil_1782458849_771dbdcc.jpeg", deskripsi: "Pendamping ketua dalam koordinasi internal dan pengawasan kinerja." },
      { role: "Sekretaris", nama: "Muhammad Thio Saputra", icon: "notebook-pen", foto: "/gudang/org/wakil_sekretaris_1784116447_104d55b6.jpeg", deskripsi: "Penanggung jawab administrasi dan dokumentasi organisasi." },
      { role: "Bendahara", nama: "Erinne Berlianta Manik", icon: "wallet-cards", deskripsi: "Pengelola keuangan dan transparansi anggaran organisasi." },
    ],
    divisions: [
      { divisi: "Unit Kesehatan Siswa", icon: "heart-pulse", foto: "/gudang/gallery/IMG-20260129-WA0037_ywu4kh_eldskn.avif", anggota: ["Syifa Maurinjia", "Nazma Az Zahra", "Nahdhah", "Andi Nabilla Ramadani", "Maulidia Hayuningdiah", "Naufa Azmi Khairizqa", "Melsia Oktavia"] },
      { divisi: "Hubungan Masyarakat", icon: "megaphone", foto: "/gudang/org/kord_1784120541_e1bb0122.jpeg", anggota: ["Eva Regina Putri Riyanti", "Lisa Erfina", "Naylah Azkiya", "Rama", "Alia Rahmawati", "Ferdi Herlino", "Almira Fakhriah Hasan"] },
      { divisi: "Pengembangan Sumber Daya Manusia", icon: "users-round", foto: "/gudang/gallery/IMG-20260129-WA0035_fwkslt_jjng7f.avif", anggota: ["A. Ustman Abdullah", "Kirani", "Halissa Azzahra", "Delya Ananda", "Lionel Abdi Darma W.", "Selviana Dewi", "Muhammad Sultan Ariady"] },
      { divisi: "Sosial Masyarakat", icon: "hand-heart", foto: "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", anggota: ["Nur Aleesya Nashirah", "Nabila Rosydah Zahro", "Zahrah Fitri Aisy", "Wulandari", "Lietya Aisya", "Firy al Humairoh Rahmah", "Sofha Raihana Kamelia"] },
    ],
  },
  contact: { sekretariat: { alamat: "Ruang UKS, SMKN 4 Banjarmasin", telepon: "+62 831-9173-5329", email: "pmr@smkn4bjm.sch.id", instagram: "pmrskenpatbjm", wa_link: "https://wa.me/6283191735329", jadwal: [{ hari: "Senin – Kamis", waktu: "07:00 – 15:00 WITA" }, { hari: "Jumat", waktu: "07:00 – 11:30 WITA" }, { hari: "Sabtu – Minggu", waktu: "Tutup" }] }, bergabung: { deskripsi: "Siap menjadi bagian dari pergerakan kemanusiaan di sekolah?", persyaratan: ["Siswa aktif SMKN 4 Banjarmasin", "Sehat jasmani dan rohani", "Bersedia mengikuti latihan rutin"], catatan: "Pendaftaran dibuka setiap awal semester genap.", link_wa: "https://wa.me/6283191735329" } },
  guides: [
    { id: "mimisan", title: "Mimisan", icon: "droplets", tone: "red", tag: "Tindakan cepat", summary: "Langkah aman menghentikan mimisan sebelum bantuan medis tiba.", steps: ["Duduk tegak dan condongkan tubuh sedikit ke depan.", "Pencet bagian lunak hidung selama 5–10 menit tanpa melepasnya.", "Bernapas lewat mulut dan tetap tenang.", "Jika tidak berhenti atau berulang, hubungi petugas medis."] },
    { id: "pingsan", title: "Pingsan", icon: "accessibility", tone: "yellow", tag: "Keadaan darurat", summary: "Bantu korban tetap aman dan periksa responsnya.", steps: ["Baringkan korban di tempat aman dan datar.", "Periksa respons dan pernapasan korban.", "Longgarkan pakaian yang ketat dan jangan beri makanan atau minuman saat belum sadar.", "Hubungi bantuan medis jika tidak sadar lebih dari satu menit atau tidak bernapas normal."] },
    { id: "luka-bakar", title: "Luka bakar", icon: "flame", tone: "orange", tag: "Luka bakar ringan", summary: "Dinginkan area luka dan lindungi jaringan dari kerusakan lanjutan.", steps: ["Siram dengan air mengalir suhu ruang selama 20 menit.", "Lepas perhiasan sebelum area membengkak, tetapi jangan menarik benda yang menempel.", "Jangan gunakan es, mentega, atau pasta gigi.", "Tutup longgar dengan kain bersih dan cari bantuan untuk luka serius."] },
    { id: "tersedak", title: "Tersedak", icon: "wind", tone: "blue", tag: "Perlu bantuan", summary: "Kenali kondisi tersedak berat dan segera minta bantuan.", steps: ["Tanyakan apakah korban tersedak; jika masih bisa batuk, biarkan batuk.", "Jika tidak bisa bernapas atau berbicara, minta orang lain menghubungi 119.", "Berikan dorongan punggung dan perut sesuai pelatihan P3K yang benar.", "Jika korban tidak responsif, mulai RJP bila terlatih dan ikuti instruksi petugas."] },
  ],
  faq: [
    { question: "Apa itu PMR?", answer: "Palang Merah Remaja adalah wadah kegiatan siswa untuk belajar nilai kemanusiaan, hidup sehat, pertolongan pertama, dan kesiapsiagaan." },
    { question: "Kapan latihan rutin dilaksanakan?", answer: "Latihan rutin PMR dilaksanakan setiap Kamis pukul 15.00–17.00 WITA di aula atau lapangan sekolah. Jadwal dapat berubah mengikuti kalender sekolah." },
    { question: "Siapa yang bisa bergabung?", answer: "Siswa aktif SMKN 4 Banjarmasin yang sehat jasmani dan rohani serta bersedia mengikuti latihan rutin dapat mendaftar." },
    { question: "Apakah materi P3K bisa menggantikan tenaga medis?", answer: "Tidak. Materi ini bersifat edukatif. Untuk keadaan serius, pastikan lokasi aman dan segera hubungi 119 atau fasilitas kesehatan terdekat." },
  ],
};

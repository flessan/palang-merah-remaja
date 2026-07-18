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
    { id: "event-2", title: "Latihan gabungan & aksi sosial", date: "Menyesuaikan kalender sekolah", time: "Diumumkan via kanal resmi", location: "SMKN 4 Banjarmasin", description: "Momen berlatih bersama, berbagi peran, dan terjun langsung membantu masyarakat.", status: "Informasi" },
  ],
  gallery: [
    { id: 1, title: "Latgab Pramuka MAN 3 bersama PMR", date: "16 Januari 2026", category: "Latihan", cover: galleryImages[0], images: galleryImages, description: "Latihan gabungan untuk mempererat silaturahmi dan meningkatkan keterampilan pertolongan pertama." },
    { id: 2, title: "Latgab PMR Wira dan Pramuka", date: "17 Januari 2026", category: "Latihan", cover: "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_nl0mgr.avif", images: ["/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_nl0mgr.avif", "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_2_allwc1.avif", "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_1_efbbiz.avif"], description: "Belajar bekerja sama, berbagi peran, dan tetap tanggap dalam setiap simulasi." },
    { id: 3, title: "Dokumentasi aksi dan kebersamaan", date: "2026", category: "Aksi sosial", cover: "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", images: ["/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif", "/gudang/gallery/IMG-20260129-WA0035_fwkslt_jjng7f.avif"], description: "Momen kebersamaan anggota PMR Wira dalam menjalankan semangat humanis, peduli, dan tanggap." },
    { id: 4, title: "Prestasi PMR Wira", date: "Arsip kegiatan", category: "Prestasi", cover: "/gudang/gallery/juara.avif", images: ["/gudang/gallery/juara.avif"], description: "Apresiasi untuk kerja keras, disiplin, dan semangat belajar seluruh anggota.", is_published: true },
    { id: 5, title: "Latihan keterampilan anggota", date: "Arsip kegiatan", category: "Latihan", cover: "/gudang/gallery/IMG-20260129-WA0037_ywu4kh_eldskn.avif", images: ["/gudang/gallery/IMG-20260129-WA0037_ywu4kh_eldskn.avif"], description: "Latihan yang membangun kepercayaan diri dan kesiapan untuk membantu sesama.", is_published: true },
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
      { divisi: "Unit Kesehatan Siswa", icon: "heart-pulse", anggota: ["Syifa Maurinjia", "Nazma Az Zahra", "Nahdhah", "Andi Nabilla Ramadani", "Maulidia Hayuningdiah", "Naufa Azmi Khairizqa", "Melsia Oktavia"] },
      { divisi: "Hubungan Masyarakat", icon: "megaphone", foto: "/gudang/org/kord_1784120541_e1bb0122.jpeg", anggota: ["Eva Regina Putri Riyanti", "Lisa Erfina", "Naylah Azkiya", "Rama", "Alia Rahmawati", "Ferdi Herlino", "Almira Fakhriah Hasan"] },
      { divisi: "Pengembangan Sumber Daya Manusia", icon: "users-round", anggota: ["A. Ustman Abdullah", "Kirani", "Halissa Azzahra", "Delya Ananda", "Lionel Abdi Darma W.", "Selviana Dewi", "Muhammad Sultan Ariady"] },
      { divisi: "Sosial Masyarakat", icon: "hand-heart", anggota: ["Nur Aleesya Nashirah", "Nabila Rosydah Zahro", "Zahrah Fitri Aisy", "Wulandari", "Lietya Aisya", "Firy al Humairoh Rahmah", "Sofha Raihana Kamelia"] },
    ],
  },
  contact: { sekretariat: { alamat: "Ruang UKS, SMKN 4 Banjarmasin", telepon: "+62 831-9173-5329", email: "pmr@smkn4bjm.sch.id", instagram: "pmrskenpatbjm", wa_link: "https://wa.me/6283191735329", jadwal: [{ hari: "Senin – Kamis", waktu: "07:00 – 15:00 WITA" }, { hari: "Jumat", waktu: "07:00 – 11:30 WITA" }, { hari: "Sabtu – Minggu", waktu: "Tutup" }] }, bergabung: { deskripsi: "Siap menjadi bagian dari pergerakan kemanusiaan di sekolah? Kenali syarat umumnya, lalu hubungi sekretariat untuk informasi lebih lanjut.", persyaratan: ["Siswa aktif SMKN 4 Banjarmasin", "Sehat jasmani dan rohani", "Bersedia mengikuti latihan rutin setiap Kamis"], catatan: "Informasi keanggotaan dapat ditanyakan langsung kepada Pembina PMR atau sekretariat melalui WhatsApp.", link_wa: "https://wa.me/6283191735329" } },
  guides: [
    { id: "mimisan", title: "Mimisan", icon: "droplets", tone: "red", tag: "Tindakan cepat", summary: "Langkah aman menghentikan mimisan sebelum bantuan medis tiba.", steps: ["Duduk tegak dan condongkan tubuh sedikit ke depan.", "Pencet bagian lunak hidung selama 5–10 menit tanpa melepasnya.", "Bernapas lewat mulut dan tetap tenang.", "Jika tidak berhenti atau berulang, hubungi petugas medis."] },
    { id: "pingsan", title: "Pingsan", icon: "accessibility", tone: "yellow", tag: "Keadaan darurat", summary: "Bantu korban tetap aman dan periksa responsnya.", steps: ["Baringkan korban di tempat aman dan datar.", "Periksa respons dan pernapasan korban.", "Longgarkan pakaian yang ketat dan jangan beri makanan atau minuman saat belum sadar.", "Hubungi bantuan medis jika tidak sadar lebih dari satu menit atau tidak bernapas normal."] },
    { id: "luka-bakar", title: "Luka bakar", icon: "flame", tone: "orange", tag: "Luka bakar ringan", summary: "Dinginkan area luka dan lindungi jaringan dari kerusakan lanjutan.", steps: ["Siram dengan air mengalir suhu ruang selama 20 menit.", "Lepas perhiasan sebelum area membengkak, tetapi jangan menarik benda yang menempel.", "Jangan gunakan es, mentega, atau pasta gigi.", "Tutup longgar dengan kain bersih dan cari bantuan untuk luka serius."] },
    { id: "tersedak", title: "Tersedak", icon: "wind", tone: "blue", tag: "Perlu bantuan", summary: "Kenali kondisi tersedak berat dan segera minta bantuan.", steps: ["Tanyakan apakah korban tersedak; jika masih bisa batuk, biarkan batuk.", "Jika tidak bisa bernapas atau berbicara, minta orang lain menghubungi 119.", "Berikan dorongan punggung dan perut sesuai pelatihan P3K yang benar.", "Jika korban tidak responsif, mulai RJP bila terlatih dan ikuti instruksi petugas."] },
  ],
  roster: {
    periode: "Juli 2026",
    bulan_label: "Juli 2026",
    keterangan: "Jadwal resmi penjagaan Ruang UKS (Senin–Jumat) dan piket lapangan upacara (Setiap Senin) untuk seluruh anggota aktif PMR Wira SMKN 4 Banjarmasin.",
    petugas_per_shift_uks: 1,
    petugas_per_shift_lapangan: 8,
    uks_schedule: [
      { tanggal: "Senin, 13 Juli 2026", hari: "Senin", petugas: ["Muhammad Yorda Herdana (XI-RPL 1)"] },
      { tanggal: "Selasa, 14 Juli 2026", hari: "Selasa", petugas: ["Muhammad Akeyla (XI-HTL 2)"] },
      { tanggal: "Rabu, 15 Juli 2026", hari: "Rabu", petugas: ["Fitri Rahmadhani (XI-A2)"] },
      { tanggal: "Kamis, 16 Juli 2026", hari: "Kamis", petugas: ["Nahdhah (XI-A3)"] },
      { tanggal: "Jumat, 17 Juli 2026", hari: "Jumat", petugas: ["Nabila Rosydah Zahro (XI-DPB 2)"] },
      { tanggal: "Senin, 20 Juli 2026", hari: "Senin", petugas: ["Syifa Maurinja (XI-DPB 3)"] },
      { tanggal: "Selasa, 21 Juli 2026", hari: "Selasa", petugas: ["Maulidia Hayuningdiah (XI-ULW)"] },
      { tanggal: "Rabu, 22 Juli 2026", hari: "Rabu", petugas: ["Assyifa Qolbi (XI-KC)"] },
      { tanggal: "Kamis, 23 Juli 2026", hari: "Kamis", petugas: ["Eva Regina Putri Riyanti (XI-DPB 2)"] },
      { tanggal: "Jumat, 24 Juli 2026", hari: "Jumat", petugas: ["Almira Fakhriah Hasan (XI-DPB 2)"] },
      { tanggal: "Senin, 27 Juli 2026", hari: "Senin", petugas: ["Syailha Nor Rahma (XI-A2)"] },
      { tanggal: "Selasa, 28 Juli 2026", hari: "Selasa", petugas: ["Lionel Abdi Dharma Wicaksono (XI-A2)"] },
      { tanggal: "Rabu, 29 Juli 2026", hari: "Rabu", petugas: ["A. Ustman Abdullah (XI-RPL 2)"] },
      { tanggal: "Kamis, 30 Juli 2026", hari: "Kamis", petugas: ["Kirani (XI-HTL 1)"] },
      { tanggal: "Jumat, 31 Juli 2026", hari: "Jumat", petugas: ["Halissa Azzahra (XI-A1)"] },
    ],
    lapangan_schedule: [
      {
        tanggal: "Senin, 13 Juli 2026",
        hari: "Senin",
        petugas: [
          "Eva Regina Putri Riyanti XI-DPB 2",
          "Almira Fakhriah Hasan XI-DPB 2",
          "Assyifa Qolbi XI-KC",
          "Muhammad Akeyla XI-HTL 2",
          "Maulidia Hayuningdiah XI-ULW",
          "Syailha Nor Rahma XI-A2",
          "Syifa Maurinja XI-DPB 3",
          "Lionel Abdi Dharma Wicaksono XI-A2"
        ]
      },
      {
        tanggal: "Senin, 20 Juli 2026",
        hari: "Senin",
        petugas: [
          "Muhammad Yorda Herdana XI-RPL 1",
          "Fitri Rahmadhani XI-A2",
          "Nahdhah XI-A3",
          "Nabila Rosydah Zahro XI-DPB 2",
          "A. Ustman Abdullah XI-RPL 2",
          "Kirani XI-HTL 1",
          "Halissa Azzahra XI-A1",
          "Selviana Dewi XI-DPB 1"
        ]
      },
      {
        tanggal: "Senin, 27 Juli 2026",
        hari: "Senin",
        petugas: [
          "Muhammad Sultan Ariady XI-TKJ 1",
          "Nur Aleesya Nashirah XI-A3",
          "Zahrah Fitri Aisy XI-DPB 2",
          "Wulandari XI-HTL 1",
          "Lietya Aisya XI-KC",
          "Firy al Humairoh Rahmah XI-A1",
          "Sofha Raihana Kamelia XI-RPL 2",
          "Andi Nabilla Ramadani XI-ULW"
        ]
      }
    ],
    is_published: true,
    updated_at: "2026-07-17T11:00:00Z"
  },
  uks_info: {
    welcome_banner: {
      title: "Ruang UKS Terbuka untuk Seluruh Siswa-Siswi",
      subtitle: "Merasa kurang sehat, pusing, demam, atau butuh pertolongan pertama saat berada di sekolah? Jangan ragu untuk datang ke Ruang UKS SMKN 4 Banjarmasin.",
      highlight: "Semua pemeriksaan dasar dan obat-obatan P3K di Ruang UKS disediakan secara 100% GRATIS untuk seluruh siswa-siswi aktif."
    },
    jam_layanan: "Senin – Jumat selama jam pelajaran berlangsung (07.00 – 15.30 WITA)",
    lokasi: "Lantai 1 Ruang UKS SMKN 4 Banjarmasin (Dekat lapangan utama / Kantor guru)",
    stok_obat_dan_alat: [
      { id: 1, kategori: "Obat Minum Ringan", nama: "Paracetamol / Tablet Pereda Nyeri & Demam", kegunaan: "Meredakan sakit kepala, pusing, demam ringan, dan nyeri otot akut.", status: "Tersedia & Gratis" },
      { id: 2, kategori: "Obat Minum Ringan", nama: "Antasida / Obat Maag & Asam Lambung", kegunaan: "Meredakan nyeri ulu hati, kembung, perih, dan mual akibat telat makan.", status: "Tersedia & Gratis" },
      { id: 3, kategori: "Obat Luar & Cairan", nama: "Minyak Kayu Putih & Minyak Angin Aromatherapi", kegunaan: "Meredakan perut kembung, masuk angin, mual ringan, dan gigitan serangga.", status: "Tersedia & Gratis" },
      { id: 4, kategori: "Obat Luar & Cairan", nama: "Povidone Iodine (Betadine) & Cairan Antiseptik", kegunaan: "Membersihkan, mensterilkan, dan mencegah infeksi pada luka gores, lecet, atau luka jatuh.", status: "Tersedia & Gratis" },
      { id: 5, kategori: "Obat Luar & Cairan", nama: "Alkohol 70% & Cairan Pembersih Luka (NaCl 0.9%)", kegunaan: "Sterilisasi area luka atau pembersih kotoran sebelum dibalut perban steril.", status: "Tersedia & Gratis" },
      { id: 6, kategori: "Obat Luar & Cairan", nama: "Salep Luka Bakar (Bioplacenton / Burnazin)", kegunaan: "Pertolongan pertama pada luka bakar ringan, terkena knalpot, atau air panas.", status: "Tersedia & Gratis" },
      { id: 7, kategori: "Obat Luar & Cairan", nama: "Krim Meredakan Memar / Thrombophob & Ethylchloride Spray", kegunaan: "Meredakan pembengkakan kronis, memar akibat benturan fisik atau olahraga.", status: "Tersedia & Gratis" },
      { id: 8, kategori: "Perban & P3K", nama: "Kasa Steril, Plester & Perban Gulung Berbagai Ukuran", kegunaan: "Menutup dan melindungi luka terbuka agar tetap bersih dari debu dan bakteri.", status: "Tersedia & Gratis" },
      { id: 9, kategori: "Perban & P3K", nama: "Mitella (Kain Segitiga P3K) & Bidai / Spalk Kayu", kegunaan: "Fiksasi darurat saat terjadi cedera terkilir, keseleo berat, atau dugaan patah tulang.", status: "Tersedia & Gratis" },
      { id: 10, kategori: "Alat Medis Dasar", nama: "Termometer Digital & Tensi Darah (Sphygmomanometer)", kegunaan: "Pemeriksaan akurat tanda vital (suhu tubuh & tekanan darah) oleh petugas UKS.", status: "Tersedia & Gratis" },
      { id: 11, kategori: "Alat Medis Dasar", nama: "Oxymeter & Tabung Oksigen Portable (Oxycan)", kegunaan: "Bantuan darurat pernapasan bagi siswa yang mengalami sesak napas, asma, atau kelelahan berat.", status: "Tersedia & Gratis" },
      { id: 12, kategori: "Fasilitas Istirahat", nama: "Tempat Tidur Istirahat UKS & Kursi Roda Darurat", kegunaan: "Fasilitas baring sementara bagi siswa yang pingsan, kram perut, atau sakit sebelum penjemputan.", status: "Tersedia & Gratis" }
    ],
    prosedur_kunjungan: [
      { step: "Izin Guru Mata Pelajaran", deskripsi: "Minta izin secara sopan kepada guru yang sedang mengajar di kelas sebelum menuju ke Ruang UKS." },
      { step: "Lapor kepada Petugas Jaga UKS", deskripsi: "Saat tiba di Ruang UKS, laporkan keluhan medis atau gejala yang kamu rasakan kepada petugas PMR atau Pembina yang bertugas." },
      { step: "Pemeriksaan & Pemberian Obat Gratis", deskripsi: "Petugas akan memeriksa kondisi vital dasar (seperti suhu atau tensi) dan memberikan obat minum/luar sesuai keluhan secara 100% gratis." },
      { step: "Istirahat Sementara atau Surat Rujukan", deskripsi: "Jika butuh baring, siswa dipersilakan beristirahat di ranjang UKS. Jika kondisi membutuhkan penanganan medis intensif, sekolah akan menghubungi orang tua untuk penjemputan." }
    ],
    tata_tertib: [
      "Ruang UKS diperuntukkan khusus bagi siswa-siswi yang benar-benar membutuhkan pertolongan kesehatan atau istirahat medis.",
      "Dilarang membuat keributan, makan/minum berat, atau berkumpul/nongkrong di dalam Ruang UKS.",
      "Jaga kebersihan ranjang, sprei, tirai, dan peralatan P3K setelah selesai digunakan.",
      "Pengambilan obat wajib seizin dan dicatat oleh petugas/pembina UKS demi keselamatan dosis dan riwayat alergi."
    ]
  }
};

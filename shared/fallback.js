// PMR Wira fallback dataset.
//
// This is deliberately a *small* dataset, not a second backend: it keeps the
// public site readable (and the admin panel usable for demos) when Telegraph
// Cloud is unreachable, unconfigured, or still being migrated.
//
// Real organisation data and real event photos — never placeholder people.
// Media paths here stay local (`/gudang/...`) so the fallback also works
// offline; migrated content points at Telegraph Cloud public object URLs.

import { buildContent } from "./content.js";

const LATGAB_1 = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif";
const LATGAB_2 = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_tbchum.avif";
const LATGAB_3 = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_2_gzls5q.avif";
const LATGAB_4 = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_nl0mgr.avif";
const LATGAB_5 = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_2_allwc1.avif";
const LATGAB_6 = "/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.49_1_efbbiz.avif";
const AKSI_1 = "/gudang/gallery/IMG-20260129-WA0031_icpj2a_fqfute.avif";
const AKSI_2 = "/gudang/gallery/IMG-20260129-WA0032_p6mnxz_ggclja.avif";
const AKSI_3 = "/gudang/gallery/IMG-20260129-WA0035_fwkslt_jjng7f.avif";
const AKSI_4 = "/gudang/gallery/IMG-20260129-WA0037_ywu4kh_eldskn.avif";
const TROPHY = "/gudang/gallery/juara.avif";
const TEAM_1 = "/gudang/gallery/1.jpg";
const TEAM_2 = "/gudang/gallery/2.jpg";
const TEAM_3 = "/gudang/gallery/3.jpg";
const TEAM_4 = "/gudang/gallery/4.jpg";
const TEAM_5 = "/gudang/gallery/5.jpg";

export const fallbackDocuments = {
  announcements: [
    {
      id: "fallback-news-1",
      category: "Latihan gabungan",
      title: "Latgab bersama Pramuka MAN 3 Banjarmasin",
      excerpt: "Mempererat silaturahmi sekaligus mengasah keterampilan pertolongan pertama antarorganisasi.",
      date: "16 Januari 2026",
      image: LATGAB_1,
      published: true,
      sort: 3,
    },
    {
      id: "fallback-news-2",
      category: "Kabar PMR",
      title: "PMR Wira terus bergerak untuk kemanusiaan",
      excerpt: "Dari latihan rutin hingga aksi sosial, setiap anggota belajar hadir dan memberi dampak.",
      date: "Kabar terbaru",
      image: AKSI_1,
      published: true,
      sort: 2,
    },
    {
      id: "fallback-news-3",
      category: "Dokumentasi",
      title: "Belajar, berlatih, dan tumbuh bersama",
      excerpt: "Dokumentasi kegiatan anggota PMR Wira SMKN 4 Banjarmasin sepanjang periode ini.",
      date: "Arsip kegiatan",
      image: AKSI_2,
      published: true,
      sort: 1,
    },
  ],

  events: [
    {
      id: "fallback-event-1",
      title: "Latihan rutin PMR",
      date: "Setiap Kamis",
      time: "15.00–17.00 WITA",
      location: "Aula / lapangan sekolah",
      description: "Latihan keterampilan kepalangmerahan, P3K, dan kesiapsiagaan untuk anggota.",
      status: "Terbuka untuk anggota",
      published: true,
      sort: 3,
    },
    {
      id: "fallback-event-2",
      title: "Piket penjagaan Ruang UKS",
      date: "Senin – Jumat",
      time: "07.00–15.30 WITA",
      location: "Ruang UKS SMKN 4 Banjarmasin",
      description: "Petugas jaga bergiliran melayani siswa yang membutuhkan pertolongan pertama dan obat gratis.",
      status: "Rutin harian",
      published: true,
      sort: 2,
    },
    {
      id: "fallback-event-3",
      title: "Latihan gabungan & aksi sosial",
      date: "Menyesuaikan kalender sekolah",
      time: "Diumumkan via kanal resmi",
      location: "SMKN 4 Banjarmasin",
      description: "Momen berlatih bersama, berbagi peran, dan terjun langsung membantu masyarakat.",
      status: "Informasi",
      published: true,
      sort: 1,
    },
  ],

  gallery: [
    {
      id: "fallback-album-1",
      title: "Latgab Pramuka MAN 3 bersama PMR Wira",
      date: "16 Januari 2026",
      category: "Latihan",
      description: "Latihan gabungan untuk mempererat silaturahmi dan meningkatkan keterampilan pertolongan pertama.",
      cover: LATGAB_1,
      images: [LATGAB_1, LATGAB_2, LATGAB_3],
      published: true,
      sort: 6,
    },
    {
      id: "fallback-album-2",
      title: "Simulasi evakuasi dan tali",
      date: "17 Januari 2026",
      category: "Latihan",
      description: "Belajar bekerja sama, berbagi peran, dan tetap tanggap dalam setiap simulasi.",
      cover: LATGAB_4,
      images: [LATGAB_4, LATGAB_5, LATGAB_6],
      published: true,
      sort: 5,
    },
    {
      id: "fallback-album-3",
      title: "Kebersamaan anggota lintas divisi",
      date: "2026",
      category: "Kebersamaan",
      description: "Momen kebersamaan anggota PMR Wira dalam menjalankan semangat humanis, peduli, dan tanggap.",
      cover: AKSI_1,
      images: [AKSI_1, AKSI_3, TEAM_3],
      published: true,
      sort: 4,
    },
    {
      id: "fallback-album-4",
      title: "Prestasi dan penghargaan",
      date: "Arsip kegiatan",
      category: "Prestasi",
      description: "Apresiasi untuk kerja keras, disiplin, dan semangat belajar seluruh anggota.",
      cover: TROPHY,
      images: [TROPHY],
      published: true,
      sort: 3,
    },
    {
      id: "fallback-album-5",
      title: "Latihan keterampilan anggota",
      date: "Arsip kegiatan",
      category: "Latihan",
      description: "Latihan yang membangun kepercayaan diri dan kesiapan untuk membantu sesama.",
      cover: AKSI_4,
      images: [AKSI_4, AKSI_2],
      published: true,
      sort: 2,
    },
    {
      id: "fallback-album-6",
      title: "Angkatan PMR Wira SMKN 4 Banjarmasin",
      date: "Arsip kegiatan",
      category: "Kebersamaan",
      description: "Wajah-wajah anggota yang menjaga tradisi kepedulian di sekolah.",
      cover: TEAM_4,
      images: [TEAM_4, TEAM_5, TEAM_1, TEAM_2],
      published: true,
      sort: 1,
    },
  ],

  guides: [
    {
      id: "mimisan",
      title: "Mimisan",
      icon: "droplets",
      tone: "red",
      tag: "Tindakan cepat",
      summary: "Langkah aman menghentikan mimisan sebelum bantuan medis tiba.",
      steps: [
        "Dudukkan korban tegak dan condongkan tubuh sedikit ke depan agar darah tidak mengalir ke tenggorokan.",
        "Pencet bagian lunak hidung (bukan tulang) selama 5–10 menit tanpa melepasnya sesekali.",
        "Minta korban bernapas lewat mulut, tetap tenang, dan jangan mendongakkan kepala.",
        "Bila perdarahan tidak berhenti lebih dari 20 menit atau berulang, hubungi petugas medis.",
      ],
      published: true,
      sort: 4,
    },
    {
      id: "pingsan",
      title: "Pingsan",
      icon: "accessibility",
      tone: "yellow",
      tag: "Keadaan darurat",
      summary: "Bantu korban tetap aman dan periksa responsnya dengan tenang.",
      steps: [
        "Baringkan korban di tempat aman dan datar, lalu tinggikan kedua kakinya sekitar 30 cm.",
        "Periksa respons dan pernapasan; longgarkan pakaian yang ketat.",
        "Jangan memberi makanan atau minuman saat korban belum sadar penuh.",
        "Hubungi bantuan medis bila korban tidak sadar lebih dari satu menit atau napasnya tidak normal.",
      ],
      published: true,
      sort: 3,
    },
    {
      id: "luka-bakar",
      title: "Luka bakar",
      icon: "flame",
      tone: "pink",
      tag: "Luka bakar ringan",
      summary: "Dinginkan area luka dan lindungi jaringan dari kerusakan lanjutan.",
      steps: [
        "Jauhkan korban dari sumber panas, lalu siram area luka dengan air mengalir suhu ruang selama 20 menit.",
        "Lepas perhiasan atau pakaian longgar di sekitar luka sebelum area membengkak; jangan menarik kain yang menempel.",
        "Jangan gunakan es, mentega, pasta gigi, atau salep sembarangan pada luka baru.",
        "Tutup longgar dengan kain bersih dan cari bantuan untuk luka luas, luka di wajah, atau luka bakar listrik/kimia.",
      ],
      published: true,
      sort: 2,
    },
    {
      id: "tersedak",
      title: "Tersedak",
      icon: "wind",
      tone: "blue",
      tag: "Perlu bantuan",
      summary: "Kenali kondisi tersedak berat dan segera minta bantuan.",
      steps: [
        "Tanyakan apakah korban tersedak. Bila masih bisa batuk atau bicara, biarkan ia batuk sendiri.",
        "Bila korban tidak bisa bernapas atau bersuara, minta orang lain menghubungi 119 segera.",
        "Berdiri di samping korban dan berikan dorongan punggung atau perut sesuai pelatihan P3K yang benar.",
        "Bila korban menjadi tidak responsif, mulai RJP bila terlatih dan ikuti instruksi petugas medis.",
      ],
      published: true,
      sort: 1,
    },
  ],

  organization: [
    {
      id: "fallback-org",
      period: "2026/2027",
      vision: "Mewujudkan anggota Palang Merah Remaja yang berkarakter, peduli, terampil, dan siap berperan di sekolah maupun masyarakat.",
      mission: [
        "Menanamkan nilai kepedulian, kemanusiaan, dan solidaritas.",
        "Meningkatkan pengetahuan kepalangmerahan dan keterampilan P3K.",
        "Membentuk sikap disiplin, tanggung jawab, dan kerja sama.",
        "Mendukung sekolah yang sehat, aman, dan siaga.",
        "Berperan aktif dalam kegiatan sosial di masyarakat.",
      ],
      advisory: [
        { name: "Eka Lisdyawati, M.Pd.", role: "Wakasek Kesiswaan", description: "Penanggung jawab umum kebijakan kesiswaan dan pengembangan organisasi sekolah.", icon: "graduation-cap" },
        { name: "Winda Hairani, S.Pd.", role: "Pembina UKS", description: "Pembimbing teknis operasional kegiatan PMR dan UKS sekolah.", icon: "user-round" },
      ],
      leaders: [
        { name: "Winda Hairani, S.Pd.", role: "Pembina PMR", description: "Guru pembimbing ekstrakurikuler PMR Wira SMKN 4 Banjarmasin.", icon: "shield-check" },
        { name: "Adilla Hafiza", role: "Ketua", description: "Pemimpin eksekutif dan penanggung jawab utama seluruh program kerja PMR Wira.", icon: "crown" },
        { name: "Assyifa Qolbi", role: "Wakil Ketua", description: "Pendamping ketua dalam koordinasi internal dan pengawasan kinerja.", icon: "users", photo: "/gudang/org/wakil_1782458849_771dbdcc.jpeg" },
        { name: "Eliana Nur Khanza", role: "Sekretaris 1", description: "Penanggung jawab administrasi dan dokumentasi organisasi.", icon: "notebook-pen" },
        { name: "Muhammad Thio Saputra", role: "Sekretaris 2", description: "Penanggung jawab administrasi, dokumentasi, dan kanal digital organisasi.", icon: "notebook-pen", photo: "/gudang/org/wakil_sekretaris_1784116447_104d55b6.jpeg" },
        { name: "Siti Zahra Naila Husna", role: "Bendahara 1", description: "Pengelola keuangan dan transparansi anggaran organisasi.", icon: "wallet-cards" },
        { name: "Erinne Berlianta Manik", role: "Bendahara 2", description: "Pengelola keuangan dan transparansi anggaran organisasi.", icon: "wallet-cards", photo: "/gudang/org/bendahara_1784116821_f8728168.jpeg" },
      ],
      divisions: [
        {
          name: "Unit Kesehatan Siswa",
          icon: "heart-pulse",
          tone: "red",
          description: "Menjaga layanan Ruang UKS, stok obat, dan pemeriksaan dasar untuk seluruh siswa.",
          photo: "/gudang/org/uks_1784124308_e5164f19.jpeg",
          members: ["Syifa Maurinjia", "Nazma Az Zahra", "Nahdhah", "Andi Nabilla Ramadani", "Maulidia Hayuningdiah", "Naufa Azmi Khairizqa", "Melsia Oktavia"],
        },
        {
          name: "Hubungan Masyarakat",
          icon: "megaphone",
          tone: "blue",
          description: "Mengelola informasi, dokumentasi, dan komunikasi organisasi dengan sekolah dan publik.",
          photo: "/gudang/org/humas_1784124684_69633f9d.jpeg",
          members: ["Eva Regina Putri Riyanti", "Lisa Erfina", "Naylah Azkiya", "Rama", "Alia Rahmawati", "Ferdi Herlino", "Almira Fakhriah Hasan"],
        },
        {
          name: "Pengembangan Sumber Daya Manusia",
          icon: "users-round",
          tone: "mint",
          description: "Menyiapkan materi latihan, pembinaan anggota baru, dan peningkatan keterampilan.",
          photo: "/gudang/org/psdm_1784124722_165e0558.jpeg",
          members: ["A. Ustman Abdullah", "Kirani", "Halissa Azzahra", "Delya Ananda", "Lionel Abdi Darma W.", "Selviana Dewi", "Muhammad Sultan Ariady"],
        },
        {
          name: "Sosial Masyarakat",
          icon: "hand-heart",
          tone: "yellow",
          description: "Merancang dan menjalankan aksi sosial serta bakti masyarakat.",
          photo: "/gudang/org/sosmas_1784124748_66d7612c.jpeg",
          members: ["Nur Aleesya Nashirah", "Nabila Rosydah Zahro", "Zahrah Fitri Aisy", "Wulandari", "Lietya Aisya", "Firy al Humairoh Rahmah", "Sofha Raihana Kamelia"],
        },
      ],
    },
  ],

  roster: [
    {
      id: "fallback-roster",
      period: "Juli 2026",
      month_label: "Juli 2026",
      description: "Jadwal penjagaan Ruang UKS (Senin–Jumat) dan piket lapangan upacara untuk seluruh anggota aktif PMR Wira SMKN 4 Banjarmasin.",
      uks_schedule: [
        { date: "Senin, 13 Juli 2026", day: "Senin", officers: ["Muhammad Yorda Herdana (XI-RPL 1)"] },
        { date: "Selasa, 14 Juli 2026", day: "Selasa", officers: ["Muhammad Akeyla (XI-HTL 2)"] },
        { date: "Rabu, 15 Juli 2026", day: "Rabu", officers: ["Fitri Rahmadhani (XI-A2)"] },
        { date: "Kamis, 16 Juli 2026", day: "Kamis", officers: ["Nahdhah (XI-A3)"] },
        { date: "Jumat, 17 Juli 2026", day: "Jumat", officers: ["Nabila Rosydah Zahro (XI-DPB 2)"] },
        { date: "Senin, 20 Juli 2026", day: "Senin", officers: ["Syifa Maurinja (XI-DPB 3)"] },
        { date: "Selasa, 21 Juli 2026", day: "Selasa", officers: ["Maulidia Hayuningdiah (XI-ULW)"] },
        { date: "Rabu, 22 Juli 2026", day: "Rabu", officers: ["Assyifa Qolbi (XI-KC)"] },
        { date: "Kamis, 23 Juli 2026", day: "Kamis", officers: ["Eva Regina Putri Riyanti (XI-DPB 2)"] },
        { date: "Jumat, 24 Juli 2026", day: "Jumat", officers: ["Almira Fakhriah Hasan (XI-DPB 2)"] },
        { date: "Senin, 27 Juli 2026", day: "Senin", officers: ["Syailha Nor Rahma (XI-A2)"] },
        { date: "Selasa, 28 Juli 2026", day: "Selasa", officers: ["Lionel Abdi Dharma Wicaksono (XI-A2)"] },
        { date: "Rabu, 29 Juli 2026", day: "Rabu", officers: ["A. Ustman Abdullah (XI-RPL 2)"] },
        { date: "Kamis, 30 Juli 2026", day: "Kamis", officers: ["Kirani (XI-HTL 1)"] },
        { date: "Jumat, 31 Juli 2026", day: "Jumat", officers: ["Halissa Azzahra (XI-A1)"] },
      ],
      field_schedule: [
        {
          date: "Senin, 13 Juli 2026",
          day: "Senin",
          officers: ["Eva Regina Putri Riyanti XI-DPB 2", "Almira Fakhriah Hasan XI-DPB 2", "Assyifa Qolbi XI-KC", "Muhammad Akeyla XI-HTL 2", "Maulidia Hayuningdiah XI-ULW", "Syailha Nor Rahma XI-A2", "Syifa Maurinja XI-DPB 3", "Lionel Abdi Dharma Wicaksono XI-A2"],
        },
        {
          date: "Senin, 20 Juli 2026",
          day: "Senin",
          officers: ["Muhammad Yorda Herdana XI-RPL 1", "Fitri Rahmadhani XI-A2", "Nahdhah XI-A3", "Nabila Rosydah Zahro XI-DPB 2", "A. Ustman Abdullah XI-RPL 2", "Kirani XI-HTL 1", "Halissa Azzahra XI-A1", "Selviana Dewi XI-DPB 1"],
        },
        {
          date: "Senin, 27 Juli 2026",
          day: "Senin",
          officers: ["Muhammad Sultan Ariady XI-RPL 1", "Nur Aleesya Nashirah XI-A3", "Zahrah Fitri Aisy XI-DPB 2", "Wulandari XI-HTL 1", "Lietya Aisya XI-KC", "Firy al Humairoh Rahmah XI-A1", "Sofha Raihana Kamelia XI-RPL 2", "Andi Nabilla Ramadani XI-ULW"],
        },
      ],
      published: true,
    },
  ],

  uks: [
    {
      id: "fallback-uks",
      welcome_banner: {
        title: "Ruang UKS terbuka untuk seluruh siswa-siswi",
        subtitle: "Merasa kurang sehat, pusing, demam, atau butuh pertolongan pertama saat berada di sekolah? Jangan ragu datang ke Ruang UKS SMKN 4 Banjarmasin.",
        highlight: "Pemeriksaan dasar dan obat-obatan P3K di Ruang UKS disediakan gratis untuk seluruh siswa-siswi aktif.",
      },
      service_hours: "Senin – Jumat selama jam pelajaran berlangsung (07.00 – 15.30 WITA)",
      location: "Lantai 1 Ruang UKS SMKN 4 Banjarmasin (dekat lapangan utama, di samping aula sekolah)",
      inventory: [
        { id: "obat-1", name: "Paracetamol", category: "Obat minum ringan", purpose: "Meredakan sakit kepala, pusing, demam ringan, dan nyeri otot akut.", status: "Tersedia & gratis" },
        { id: "obat-2", name: "Antasida", category: "Obat minum ringan", purpose: "Meredakan nyeri ulu hati, kembung, perih, dan mual akibat telat makan.", status: "Tersedia & gratis" },
        { id: "obat-3", name: "Minyak kayu putih & minyak angin", category: "Obat luar & cairan", purpose: "Meredakan perut kembung, masuk angin, mual ringan, dan gigitan serangga.", status: "Tersedia & gratis" },
        { id: "obat-4", name: "Povidone iodine & antiseptik", category: "Obat luar & cairan", purpose: "Membersihkan dan mencegah infeksi pada luka gores, lecet, atau luka jatuh.", status: "Tersedia & gratis" },
        { id: "obat-5", name: "Alkohol 70% & NaCl 0,9%", category: "Obat luar & cairan", purpose: "Pembersih luka sebelum dibalut perban steril.", status: "Tersedia & gratis" },
        { id: "obat-6", name: "Salep luka bakar", category: "Obat luar & cairan", purpose: "Pertolongan pertama pada luka bakar ringan, terkena knalpot, atau air panas.", status: "Tersedia & gratis" },
        { id: "obat-7", name: "Krim memar & cold spray", category: "Obat luar & cairan", purpose: "Meredakan pembengkakan dan memar akibat benturan fisik atau olahraga.", status: "Tersedia & gratis" },
        { id: "obat-8", name: "Kasa steril, plester & perban gulung", category: "Perban & P3K", purpose: "Menutup dan melindungi luka terbuka agar tetap bersih.", status: "Tersedia & gratis" },
        { id: "obat-9", name: "Mitella & bidai kayu", category: "Perban & P3K", purpose: "Fiksasi darurat saat terkilir, keseleo berat, atau dugaan patah tulang.", status: "Tersedia & gratis" },
        { id: "alat-1", name: "Termometer digital & tensimeter", category: "Alat medis dasar", purpose: "Pemeriksaan tanda vital (suhu tubuh & tekanan darah) oleh petugas UKS.", status: "Tersedia & gratis" },
        { id: "alat-2", name: "Oximeter & oksigen portable", category: "Alat medis dasar", purpose: "Bantuan darurat pernapasan bagi siswa yang sesak napas atau kelelahan berat.", status: "Tersedia & gratis" },
        { id: "fas-1", name: "Tempat tidur UKS & tandu lipat", category: "Fasilitas istirahat", purpose: "Fasilitas baring sementara bagi siswa yang pingsan, kram perut, atau sakit.", status: "Tersedia & gratis" },
      ],
      procedure: [
        { step: "Izin guru mata pelajaran", description: "Minta izin kepada guru yang sedang mengajar sebelum menuju Ruang UKS." },
        { step: "Lapor petugas jaga UKS", description: "Sampaikan keluhan atau gejala yang dirasakan kepada petugas PMR/pembina yang bertugas." },
        { step: "Pemeriksaan & obat gratis", description: "Petugas memeriksa tanda vital dasar dan memberikan obat sesuai keluhan secara gratis." },
        { step: "Istirahat atau rujukan", description: "Bila perlu, siswa beristirahat di ranjang UKS. Untuk kondisi serius, sekolah menghubungi orang tua." },
      ],
      rules: [
        "Ruang UKS diperuntukkan bagi siswa yang benar-benar membutuhkan pertolongan kesehatan atau istirahat medis.",
        "Dilarang membuat keributan, makan berat, atau berkumpul di dalam Ruang UKS.",
        "Jaga kebersihan ranjang, sprei, tirai, dan peralatan P3K setelah digunakan.",
        "Pengambilan obat wajib seizin dan dicatat petugas UKS demi keselamatan dosis dan riwayat alergi.",
      ],
    },
  ],

  site_settings: [
    {
      id: "fallback-settings",
      branding: {
        name: "PMR Wira SMKN 4 Banjarmasin",
        short_name: "PMR WIRA",
        school: "SMKN 4 Banjarmasin",
        tagline: "Humanis. Peduli. Tanggap.",
        logo: "/gudang/logo/pmr-logo.webp",
        icon: "/gudang/logo/icon.svg",
        og_image: "/gudang/logo/og-image.png",
        canonical_url: "https://pmr.likesyou.org/",
      },
      stats: [
        { value: 442, label: "Total alumni", icon: "users" },
        { value: 120, label: "Relawan aktif", icon: "user-round-check" },
        { value: 56, label: "Aksi sosial", icon: "heart-handshake" },
      ],
      emergency: {
        headline: "Butuh bantuan medis segera?",
        number: "119",
        note: "Hubungi ambulans atau petugas UKS sekolah. Untuk kondisi darurat, utamakan keselamatan diri dan korban.",
        wa_link: "https://wa.me/6283191735329",
      },
      contact: {
        sekretariat: {
          alamat: "Ruang UKS, SMKN 4 Banjarmasin",
          telepon: "+62 831-9173-5329",
          email: "pmr@smkn4bjm.sch.id",
          instagram: "pmrskenpatbjm",
          wa_link: "https://wa.me/6283191735329",
          whatsapp_number: "6283191735329",
          jadwal: [
            { hari: "Senin – Kamis", waktu: "07:00 – 15:00 WITA" },
            { hari: "Jumat", waktu: "07:00 – 11:30 WITA" },
            { hari: "Sabtu – Minggu", waktu: "Tutup" },
          ],
        },
        bergabung: {
          deskripsi: "Siap menjadi bagian dari pergerakan kemanusiaan di sekolah? Kenali syarat umumnya, lalu hubungi sekretariat untuk informasi lebih lanjut.",
          persyaratan: ["Siswa aktif SMKN 4 Banjarmasin", "Sehat jasmani dan rohani", "Bersedia mengikuti latihan rutin setiap Kamis"],
          catatan: "Informasi keanggotaan dapat ditanyakan langsung kepada Pembina PMR atau sekretariat melalui WhatsApp.",
          link_wa: "https://wa.me/6283191735329",
        },
      },
      social_links: [
        { label: "Instagram @pmrskenpatbjm", url: "https://www.instagram.com/pmrskenpatbjm", icon: "instagram" },
        { label: "WhatsApp sekretariat", url: "https://wa.me/6283191735329", icon: "message-circle" },
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Member directory                                                    */
/* ------------------------------------------------------------------ */
//
// The directory is derived from the real organisation document above: every
// advisor, leader and division member becomes one entry. Nothing is invented —
// a person appears here only because the organisation already lists them.
// Class names are read from the duty roster (e.g. "Nama (XI-RPL 1)").

function slugifyName(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function classFromOfficers(rosterDocuments) {
  const found = new Map();
  for (const roster of rosterDocuments) {
    for (const shift of [...(roster.uks_schedule || []), ...(roster.field_schedule || [])]) {
      for (const officer of shift.officers || []) {
        const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(String(officer));
        if (match && match[2].toUpperCase().startsWith("XI")) {
          found.set(match[1].trim().toLowerCase(), match[2].trim());
        }
      }
    }
  }
  return found;
}

function buildMemberDirectory() {
  const org = fallbackDocuments.organization[0];
  const classes = classFromOfficers(fallbackDocuments.roster);
  const directory = new Map();

  const add = (person, extra = {}) => {
    const name = String(person?.name || "").trim();
    if (!name) return;
    const key = name.toLowerCase();
    const previous = directory.get(key);
    const entry = {
      id: `fallback-member-${slugifyName(name) || directory.size + 1}`,
      name,
      role: person.role || extra.role || "Anggota",
      class_name: classes.get(key) || extra.class_name || "",
      division: extra.division || "",
      photo: person.photo || previous?.photo || extra.photo || "",
      phone: "",
      note: person.description || "",
      active: true,
      published: true,
      sort: 0,
    };
    // Prefer the richest entry when someone appears in several places.
    directory.set(key, { ...previous, ...entry, role: person.role || previous?.role || entry.role });
  };

  (org.advisory || []).forEach((person) => add(person, { role: "Penasihat" }));
  (org.leaders || []).forEach((person) => add(person));
  (org.divisions || []).forEach((division) => {
    (division.members || []).forEach((name) => add({ name }, { division: division.name, role: "Anggota" }));
  });
  (fallbackDocuments.roster[0]?.uks_schedule || []).forEach((shift) => {
    (shift.officers || []).forEach((label) => {
      const match = /^(.*?)\s*\(([^)]+)\)\s*$/.exec(String(label));
      add({ name: (match ? match[1] : label).trim() }, { role: "Petugas UKS", class_name: match ? match[2] : "" });
    });
  });

  return [...directory.values()].map((member, index) => ({ ...member, sort: 100 - index }));
}

fallbackDocuments.members = buildMemberDirectory();

export const fallbackContent = buildContent(fallbackDocuments, {
  fallback: {
    stats: fallbackDocuments.site_settings[0].stats,
    announcements: [],
    events: [],
    gallery: [],
    guides: [],
    members: fallbackDocuments.members,
    org: fallbackDocuments.organization[0],
    roster: fallbackDocuments.roster[0],
    uks: fallbackDocuments.uks[0],
    settings: fallbackDocuments.site_settings[0],
    contact: fallbackDocuments.site_settings[0].contact,
  },
  source: "fallback",
  meta: { reason: "bundled-fallback" },
});

/** Public account details reused by contact/emergency UI. */
export const FALLBACK_EMERGENCY = fallbackDocuments.site_settings[0].emergency;
export const FALLBACK_CONTACT = fallbackDocuments.site_settings[0].contact;

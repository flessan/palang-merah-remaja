# PMR Wira — React + Vite + Telegraph Cloud + Cloudflare Pages

Situs resmi ekstrakurikuler Palang Merah Remaja (PMR) Wira SMKN 4 Banjarmasin.
Situs publik tetap statis dan cepat; konten dibaca dari Cloudflare Pages Functions
yang terhubung ke **Telegraph Cloud** (document API + object storage).

Desain antarmuka memakai gaya **Playful & Clean**: tombol chunky yang memantul
saat ditekan, permukaan bersih tanpa tekstur, sudut membulat konsisten, dan warna
ceria. Mode gelap memakai palet navy dalam dengan aksen yang sama cerahnya.

## Fitur

- React + Vite single-page navigation dengan URL `?tab=` yang tetap bisa di-bookmark.
- **Hero beranda memakai galeri blur sebagai latar**: tiap foto dipasang **pas satu layar** (`flex: 0 0 100%` + `object-fit: cover`) lalu diberi **efek blur** (`--hero-blur`), jadi latarnya lembut dan tidak "kelebihan besar". Foto bergerak pelan sebagai dinding latar (dekoratif, `aria-hidden`) dan **bisa digeser sendiri** oleh pengunjung — drag di desktop, geser native di layar sentuh; gerak otomatisnya berhenti 2,6 detik setelah pengguna menyentuhnya, saat tab tidak aktif, atau saat hero di luar layar. Tanpa lapisan gelap: yang dipakai adalah lapisan cahaya (`--hero-wash`) yang ikut tema, sehingga hero tetap terang di mode terang dan tetap nyaman di mode gelap. Statistik menyatu di dalam hero sehingga tidak ada pita kosong terpisah.
- **Menu aksesibilitas mengambang** (kiri bawah): ukuran teks (Normal/Besar/Ekstra), warna & kontras (Normal/Kontras tinggi/Warna lembut), jenis huruf (Normal/Mudah dibaca untuk disleksia), dan gerak (Aktif/Dikurangi) — tersimpan otomatis di peramban.
- Mode terang/gelap (putih bersih ↔ navy dalam) dengan preferensi tersimpan; keduanya dirancang setara, bukan sekadar inversi.
- Menu hamburger mobile: drawer geser penuh dengan ikon, deskripsi, toggle tema, dan tautan cepat.
- Halaman **Sejarah & Pendiri** khusus (`?tab=sejarah`): lini masa, tingkatan PMR (Mula/Madya/Wira), dan para pendiri/penerus organisasi.
- Beranda dengan hero bergaleri, kabar terbaru, agenda, jadwal shift UKS & lapangan (disusun manual dari Portal Admin), dan banner UKS.
- Profil, visi/misi, struktur organisasi yang dapat dibuka per divisi.
- EduScope: panduan interaktif P3K (mimisan, pingsan, luka bakar, tersedak) dengan disclaimer medis.
- Galeri responsif dengan pencarian, filter kategori, lightbox album, dan navigasi keyboard.
- Halaman kontak informatif: jam sekretariat, info keanggotaan, dan tombol langsung WhatsApp/Email/Instagram.
- Portal Admin (PIN): kelola kabar, agenda, galeri, **jadwal shift manual**, struktur organisasi, statistik, panduan P3K, kontak, dan stok obat UKS — lengkap dengan backup/restore JSON dan unggah foto.
- Fallback demo otomatis saat Telegraph Cloud belum dikonfigurasi sehingga frontend tetap dapat dipreview.

## Perubahan produk (Juli 2026)

- **Formulir pendaftaran relawan dihapus.** Informasi keanggotaan diarahkan ke sekretariat via WhatsApp.
- **Kotak masuk pesan & FAQ dihapus.** Pengunjung menghubungi tim langsung via WhatsApp/Email/Instagram.
- **Neon Postgres digantikan Telegraph Cloud.** Tidak ada SQL, ORM, atau database kedua di proyek ini.
- **Unggah foto memakai object storage Telegraph Cloud**, bukan lagi layanan pihak ketiga.

## Menjalankan lokal

```bash
npm install
npm run dev
```

`npm run dev` menjalankan Vite **beserta** Pages Functions dalam mode dev, jadi
Portal Admin (PIN demo `2026`) langsung bisa dicoba tanpa `wrangler`.

Untuk memakai data Telegraph Cloud sungguhan, buat `.env` (sudah di-ignore):

```env
TELEGRAPH_URL=https://telestorage.pages.dev
TELEGRAPH_PROJECT=prj_Ooc9HEir37tMqV3Q5uWUMw
TELEGRAPH_API_KEY=tg_live_…
ADMIN_PIN=2026
```

Tanpa `TELEGRAPH_API_KEY`, API mengembalikan data demo dan perubahan Admin
disimpan di memori sesi.

## Data layer: Telegraph Cloud

Telegraph Cloud adalah **satu-satunya** lapisan data proyek ini. Dokumentasi
acuan: <https://telestorage.pages.dev/llms.txt> dan
<https://telestorage.pages.dev/openapi.json>.

```
GET/POST            /api/db/{collection}
GET/PATCH/DELETE    /api/db/{collection}/{id}
PUT/GET/DELETE      /api/storage/{bucket}/{key}
```

Peta koleksi ada di [`db/collections.md`](db/collections.md):

| Koleksi          | Isi                                                      |
| ---------------- | -------------------------------------------------------- |
| `site_content`   | Satu dokumen per bagian `{ key, value }`                 |
| `announcements`  | Kabar terkini                                            |
| `events`         | Agenda kegiatan                                          |
| `gallery_albums` | Album galeri (dokumen menyimpan URL, bukan byte gambar)  |

Implementasi klien tunggal: `functions/_lib/telegraph.js` — dipakai ulang oleh
endpoint publik (`functions/api/[[path]].js`) dan Portal Admin
(`functions/_lib/admin-handler.js`). Jangan membuat klien kedua.

### Prinsip yang dipegang

- **Bukan SQL.** Tidak ada PostgreSQL, Prisma, Drizzle, atau wire protocol SQL.
- **Optimistic concurrency.** Setiap penulisan mengirim `_expected_version`;
  konflik mengembalikan `409 version_conflict` dan pesan yang ramah di panel admin.
- **Kuota mutasi** ±20 per 60 detik per project. Panel admin menulis per bagian
  agar hemat kuota; percobaan ulang otomatis memakai backoff pendek.
- **Batas dokumen ±96 KiB.** Berkas besar selalu ke object storage; dokumen hanya
  menyimpan URL.
- **Rahasia hanya di environment.** `TELEGRAPH_API_KEY` dibaca dari env saat
  runtime, tidak pernah ditulis di kode, dokumen, atau berkas ini.

### Endpoint

Publik (read-only):

- `GET /api/content` — seluruh konten publik.
- `GET /api/gallery` dan `GET /api/events` — koleksi terpisah.
- `GET /api/media/{key}` — proxy objek dari bucket `pmr-media` (kunci tetap di server).
- `GET /api/health` — status function dan apakah Telegraph Cloud terdeteksi.

Admin (header `X-Admin-Pin`, default demo `2026`):

- `GET /api/admin/data`
- `POST|PUT|DELETE /api/admin/announcements|events|gallery`
- `POST /api/admin/content` — `{ key, value }` atau `{ all }`
- `POST /api/admin/reset`, `POST /api/admin/restore`
- `POST /api/admin/upload` — FormData `image` atau JSON `{ image: dataURL }` → bucket `pmr-media`

## Panduan gaya UI

Seluruh gaya hidup di `src/styles.css`, dibagi menjadi tiga lapis:

1. **Design tokens** (`:root` / `[data-theme='dark']`) — palet warna, bayangan,
   radius (`--cut*` kini berupa nilai sudut membulat 12–24px, bukan bentuk
   guntingan), gerak (`--bounce`), dan tipografi.
2. **Aturan komponen** — struktur grid/flex halaman.
3. **Lapisan *skin* Playful UI** (bagian bernomor 1–22 di akhir berkas) — warna,
   bayangan, bentuk sudut, tipografi, dan gerak (1–18), lalu latar hero (19),
   menu aksesibilitas + mode kontras/huruf/gerak (20), perapian jarak antarbagian
   (21), dan penyesuaian responsif hero (22). Struktur halaman tetap sama.

### Tombol playful

Setiap tombol memakai pola "chunky 3D": dasar solid 4px (`0 4px 0 …`) yang
membuat tombol tampak seperti kancing, lalu:

- **Hover** — terangkat 2px, dasar menebal jadi 6px, ikon membesar & miring.
- **Klik** — tertekan 3px dengan dasar menyusut jadi 1px (efek ditekan).
- Varian warna: `button-primary` (merah), `button-yellow`, `button-wa` (hijau),
  `button-ghost` (outline), `button-dark`. Setiap varian punya bayangan dasar
  yang disetel untuk mode gelap agar tidak "menyala" berlebihan.

Komponen lain yang ikut memantul: tab navigasi (pil), pill filter, sub-nav admin,
dropdown petugas, tombol ikon (tema/menu/tutup), dan tombol kembali ke atas.
Semua gerakan dinonaktifkan otomatis saat `prefers-reduced-motion: reduce`.

### Mode gelap

Mode gelap bukan inversi otomatis: latarnya navy dalam (`--paper: #0f1220`)
dengan permukaan kartu yang lebih terang satu tingkat, aksen warna diterangkan
agar tetap kontras, dan bayangan 3D tombol diganti dasar hitam. Bagian 17 di
akhir `src/styles.css` mengatur penyesuaian khusus: header, pita pengumuman,
tabel admin, dropdown, chip berwarna lembut, panel gelap, dan kartu jadwal.

### Aksesibilitas

Tombol bulat di kiri bawah membuka panel **Aksesibilitas**. Semua pilihan
disimpan di `localStorage` (`pmr_a11y`) dan diterapkan sebagai atribut pada
`<html>` (`data-text`, `data-contrast`, `data-font`, `data-motion`) sehingga bisa
diatur lewat CSS. Skrip kecil di `index.html` menerapkannya sebelum render
pertama supaya tidak ada kedipan.

- **Ukuran teks** — `zoom` pada `main#main-content`: mengikuti perilaku zoom
  peramban (konten mengalir ulang, bukan terpotong). Modal jadwal dipindahkan ke
  `<body>` lewat portal agar tetap presisi.
- **Warna & kontras** — *Kontras tinggi* memakai permukaan solid, garis hitam/putih
  tegas, sudut lebih tegas, dan latar hero yang nyaris pekat; *Warna lembut*
  memakai palet krem/redup yang menenangkan mata.
- **Jenis huruf** — *Mudah dibaca* mengganti seluruh tipografi ke Lexend/Verdana
  dengan spasi huruf & baris lebih lega (ramah disleksia).
- **Gerak** — *Dikurangi* menghentikan animasi CSS sekaligus latar hero yang
  berjalan (latar tetap bisa digeser manual).

### Jadwal shift (manual, bukan otomatis)

Modul **Jadwal Shift** di Portal Admin disusun manual:

- Tambah baris shift lewat pemilih tanggal, atau tekan **Buat Kerangka Hari Kerja**
  untuk menyiapkan baris Senin–Jumat (UKS) / Senin (lapangan) tanpa mengisi nama.
- Setiap shift diisi lewat **dropdown yang bisa dicari**, berisi daftar anggota
  dari modul Organisasi & Divisi. Anggota yang sudah masuk shift itu otomatis
  tidak ditawarkan lagi; nama di luar daftar tetap bisa ditambahkan manual.
- Petugas bisa diganti, dihapus, atau barisnya dihapus seluruhnya.

## Pengujian smoke

Smoke test E2E tanpa browser (berbasis jsdom) menjalankan bundle produksi asli
lalu menstimulasikan interaksi pengguna: navigasi seluruh tab, halaman Sejarah,
drawer hamburger, modal album/panduan, toggle tema gelap, tombol kembali ke atas,
hero bergaleri (24 slide latar, satu layar per foto, blur, bisa digeser, statistik
menyatu), menu aksesibilitas (empat
kelompok pengaturan, penerapan ke `<html>`, penyimpanan, dan atur ulang), login
Portal Admin (PIN demo `2026`), penyusunan jadwal shift manual (tambah baris,
dropdown pencarian anggota, hapus petugas/shift), pembukaan semua modal admin,
hingga kontrak endpoint Pages Functions — termasuk pemeriksaan tidak adanya sisa
Neon/SQL/ORM dan tidak adanya lagi fungsi "jadwal jaga adil" otomatis.

```bash
npm run test:smoke   # build + 159 pemeriksaan otomatis
```

## Deploy ke Cloudflare Pages

1. Push repository ke GitHub dan buat Pages project dengan **Connect to Git**.
2. Framework preset: **Vite**. Build command: `npm run build`. Output: `dist`.
3. Tambahkan environment variable di Settings → Environment variables (Preview & Production):
   - `TELEGRAPH_URL` = `https://telestorage.pages.dev`
   - `TELEGRAPH_PROJECT` = `prj_Ooc9HEir37tMqV3Q5uWUMw`
   - `TELEGRAPH_API_KEY` = kunci `tg_live_…` (secret, jangan di `VITE_*`)
   - `ADMIN_PIN` = PIN portal admin (jangan pakai bawaan `2026`)
4. Setelah deploy, cek `/api/health` dan masuk Portal Admin untuk memastikan CRUD berjalan.

Folder `functions/` otomatis dipasang sebagai Pages Functions oleh Cloudflare
Pages. `public/_redirects` menangani fallback SPA, sementara request `/api/*`
ditangani oleh function.

## Catatan keamanan

- `TELEGRAPH_API_KEY` tidak boleh diletakkan di variable `VITE_*`, `src/`, atau `wrangler.toml`.
- Kunci Telegraph dibuat di <https://telestorage.pages.dev/console> (Project → API → API Keys) dengan scope `db:read`, `db:write`, `storage:read`, `storage:write` dan hanya ditampilkan sekali.
- Ubah PIN admin default melalui environment variable `ADMIN_PIN`.
- Unggahan foto diproksi lewat `/api/media/*` supaya API key tidak pernah sampai ke browser.
- Isi edukasi P3K bersifat umum dan edukatif, bukan pengganti tenaga medis. Untuk kondisi serius, hubungi 119.

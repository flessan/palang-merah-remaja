# PMR Wira — React + Vite + Telegraph Cloud + Cloudflare Pages

Situs resmi ekstrakurikuler Palang Merah Remaja (PMR) Wira SMKN 4 Banjarmasin.
Situs publik tetap statis dan cepat; konten dibaca dari Cloudflare Pages Functions
yang terhubung ke **Telegraph Cloud** (document API + object storage).

Desain antarmuka memakai gaya **Paper-Cut Scrapbook (kolase digital)**: ilusi
tumpukan kertas, bentuk guntingan asimetris, tekstur kertas daur ulang, dan
aksen coretan spidol — tanpa mengubah susunan/tata letak halaman.

## Fitur

- React + Vite single-page navigation dengan URL `?tab=` yang tetap bisa di-bookmark.
- Mode terang/gelap (palet kertas kraft ↔ papan gabus malam) dengan preferensi tersimpan.
- Menu hamburger mobile: drawer geser penuh dengan ikon, deskripsi, toggle tema, dan tautan cepat.
- Halaman **Sejarah & Pendiri** khusus (`?tab=sejarah`): lini masa, tingkatan PMR (Mula/Madya/Wira), dan para pendiri/penerus organisasi.
- Beranda dengan kabar terbaru, agenda, statistik, jadwal jaga adil (UKS & lapangan), dan banner UKS.
- Profil, visi/misi, struktur organisasi yang dapat dibuka per divisi.
- EduScope: panduan interaktif P3K (mimisan, pingsan, luka bakar, tersedak) dengan disclaimer medis.
- Galeri responsif dengan pencarian, filter kategori, lightbox album, dan navigasi keyboard.
- Halaman kontak informatif: jam sekretariat, info keanggotaan, dan tombol langsung WhatsApp/Email/Instagram.
- Portal Admin (PIN): kelola kabar, agenda, galeri, jadwal jaga adil, struktur organisasi, statistik, panduan P3K, kontak, dan stok obat UKS — lengkap dengan backup/restore JSON dan unggah foto.
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

1. **Design tokens** (`:root` / `[data-theme='dark']`) — palet kertas, bayangan
   berlapis, token bentuk guntingan (`--cut`, `--cut-a..c`, `--cut-pill`), dan
   tekstur organik berupa SVG inline (`--tex-grain`, `--tex-fiber`, `--tex-watercolor`).
2. **Aturan komponen asli** — struktur grid/flex halaman, tidak diubah.
3. **Lapisan *skin* Paper-Cut Scrapbook** (bagian bernomor 1–16 di akhir berkas) —
   hanya menyentuh warna, latar, bayangan, bentuk potongan, dan tipografi.
   Properti tata letak sengaja tidak disentuh agar susunan halaman tetap sama.

Tipografi: `Baloo 2` (judul), `Nunito` (isi), `Caveat` (tulisan tangan/label),
`DM Mono` (angka & meta).

## Pengujian smoke

Smoke test E2E tanpa browser (berbasis jsdom) menjalankan bundle produksi asli
lalu menstimulasikan interaksi pengguna: navigasi seluruh tab, halaman Sejarah,
drawer hamburger, modal album/panduan, toggle tema gelap, tombol kembali ke atas,
login Portal Admin (PIN demo `2026`), pembukaan semua modal admin, hingga kontrak
endpoint Pages Functions — termasuk pemeriksaan tidak adanya sisa Neon/SQL/ORM.

```bash
npm run test:smoke   # build + 108 pemeriksaan otomatis
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

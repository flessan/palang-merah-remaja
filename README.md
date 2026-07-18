# PMR Wira — React + Vite + Neon + Cloudflare Pages

Migrasi dari HTML/PHP lama ke single-page React app. Situs publik tetap statis dan cepat, hanya membaca konten dari Cloudflare Pages Functions yang terhubung ke Neon Postgres.

## Fitur

- React + Vite single-page navigation dengan URL `?tab=` yang tetap bisa di-bookmark.
- Mode terang/gelap yang dirancang ulang (palet gelap laut-dalam) dengan preferensi tersimpan.
- Menu hamburger mobile: drawer geser penuh dengan ikon, deskripsi, toggle tema, dan tautan cepat.
- Halaman **Sejarah & Pendiri** khusus (`?tab=sejarah`): lini masa, tingkatan PMR (Mula/Madya/Wira), dan para pendiri/ penerus organisasi.
- Beranda dengan kabar terbaru, agenda, statistik, jadwal jaga adil (UKS & lapangan), dan banner UKS.
- Profil, visi/misi, struktur organisasi yang dapat dibuka per divisi.
- EduScope: panduan interaktif P3K (mimisan, pingsan, luka bakar, tersedak) dengan disclaimer medis.
- Galeri responsif dengan pencarian, filter kategori, lightbox album, dan navigasi keyboard.
- Halaman kontak informatif: jam sekretariat, info keanggotaan, dan tombol langsung WhatsApp/Email/Instagram.
- Portal Admin (PIN): kelola kabar, agenda, galeri, jadwal jaga adil, struktur organisasi, statistik, panduan P3K, kontak, dan stok obat UKS — lengkap dengan backup/restore JSON.
- Modal pop-up modern (bottom-sheet di mobile dengan gagang geser) — bebas bug layar blank.
- Fallback demo otomatis saat Neon belum dikonfigurasi sehingga frontend tetap dapat dipreview.

## Perubahan produk (Juli 2026)

- **Formulir pendaftaran relawan dihapus.** Informasi keanggotaan diarahkan ke sekretariat via WhatsApp. Endpoint `POST /api/registrations`, tab Admin "Pendaftar Relawan", dan tabel `registrations` dihapus dari kode.
- **Kotak masuk pesan & FAQ dihapus.** Pengunjung menghubungi tim langsung via WhatsApp/Email/Instagram. Endpoint `POST /api/messages`, tab Admin "Pesan Masuk", editor FAQ, dan tabel `contact_messages` dihapus dari kode.
- Jika database Neon kamu dibuat dari skema lama, tabel lawas dapat dibersihkan (opsional):

  ```sql
  DROP TABLE IF EXISTS registrations;
  DROP TABLE IF EXISTS contact_messages;
  ```

## Menjalankan lokal

```bash
npm install
npm run dev
```

Untuk menjalankan frontend dan Pages Functions secara lokal, buat `.dev.vars` (file ini sudah di-ignore):

```env
DATABASE_URL=postgresql://...neon.tech/pmr?sslmode=require
```

Lalu:

```bash
npm run build
npx wrangler pages dev dist
```

Tanpa `DATABASE_URL`, API mengembalikan data demo dan perubahan Admin disimpan di memori sesi.

## Pengujian smoke

Situs ini punya smoke test E2E tanpa browser (berbasis jsdom) yang menjalankan bundle produksi asli lalu menstimulasikan interaksi pengguna: navigasi seluruh tab, halaman Sejarah, drawer hamburger, modal album/panduan, toggle tema gelap, tombol kembali ke atas, login Portal Admin (PIN demo `2026`), pembukaan semua modal admin, hingga kontrak endpoint Pages Functions.

```bash
npm run test:smoke   # build + 84 pemeriksaan otomatis
```

Gunakan sebelum setiap deploy untuk memastikan tidak ada regresi (mis. layar kosong).

## Menyiapkan Neon

1. Buat project/database di [Neon](https://neon.tech).
2. Jalankan `db/schema.sql` pada Neon SQL Editor.
3. Jalankan `db/seed.sql` untuk data awal (opsional — fallback demo sudah tersedia).
4. Simpan connection string hanya sebagai secret `DATABASE_URL`.

API memakai `@neondatabase/serverless` hanya di Pages Function; connection string tidak pernah masuk ke bundle Vite/browser.

Endpoint publik (read-only):

- `GET /api/content` — seluruh konten publik.
- `GET /api/gallery` dan `GET /api/events` — koleksi terpisah.
- `GET /api/health` — status function dan apakah Neon terdeteksi.

Endpoint admin (`X-Admin-Pin`, default demo `2026`): `GET /api/admin/data`, CRUD `/api/admin/announcements|events|gallery`, `POST /api/admin/content`, `POST /api/admin/reset|restore|upload`.

## Deploy ke Cloudflare Pages

1. Push repository ke GitHub dan buat Pages project dengan **Connect to Git**.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Tambahkan environment variable `DATABASE_URL` di Settings → Environment variables untuk Preview dan Production. Gunakan value secret dari Neon.
6. Setelah deploy, cek `/api/health` dan masuk ke Portal Admin untuk memastikan CRUD berjalan.

Folder `functions/` otomatis dipasang sebagai Pages Functions oleh Cloudflare Pages. `public/_redirects` menangani fallback SPA, sementara request `/api/*` ditangani oleh function.

## Catatan keamanan

- `DATABASE_URL` tidak boleh diletakkan di `VITE_*` variable, `src/`, atau `wrangler.toml`.
- Ubah PIN admin default melalui environment variable `ADMIN_PIN` agar tidak memakai bawaan `2026`.
- Isi edukasi P3K bersifat umum dan edukatif, bukan pengganti tenaga medis. Untuk kondisi serius, hubungi 119.

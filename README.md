# PMR Wira — React + Vite + Neon + Cloudflare Pages

Migrasi dari HTML/PHP lama ke single-page React app. Situs publik tetap statis dan cepat, sedangkan data yang perlu berubah serta formulir publik dilayani oleh Cloudflare Pages Functions yang terhubung ke Neon Postgres.

## Fitur

- React + Vite single-page navigation dengan URL `?tab=` yang tetap bisa di-bookmark.
- Mode terang/gelap, mobile bottom navigation, aksesibilitas keyboard, reduced-motion, dan PWA manifest.
- Beranda dengan kabar terbaru, agenda, statistik, dan CTA relawan.
- Profil, visi/misi, struktur organisasi yang dapat dibuka per divisi, dan FAQ.
- EduScope: panduan interaktif P3K (mimisan, pingsan, luka bakar, tersedak) dengan disclaimer medis.
- Galeri responsif dengan pencarian, filter kategori, lightbox album, dan navigasi keyboard.
- Pendaftaran relawan dan formulir pesan yang masuk ke Neon melalui Pages Functions.
- Fallback demo otomatis saat Neon belum dikonfigurasi sehingga frontend tetap dapat dipreview.

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

Tanpa `DATABASE_URL`, API mengembalikan data demo dan formulir tidak disimpan.

## Menyiapkan Neon

1. Buat project/database di [Neon](https://neon.tech).
2. Jalankan `db/schema.sql` pada Neon SQL Editor.
3. Jalankan `db/seed.sql` untuk data awal (opsional — fallback demo sudah tersedia).
4. Simpan connection string hanya sebagai secret `DATABASE_URL`.

API memakai `@neondatabase/serverless` hanya di Pages Function; connection string tidak pernah masuk ke bundle Vite/browser.

Endpoint publik:

- `GET /api/content` — seluruh konten publik.
- `GET /api/gallery` dan `GET /api/events` — koleksi terpisah.
- `GET /api/health` — status function dan apakah Neon terdeteksi.
- `POST /api/registrations` — pendaftaran relawan.
- `POST /api/messages` — pesan kontak.

## Deploy ke Cloudflare Pages

1. Push repository ke GitHub dan buat Pages project dengan **Connect to Git**.
2. Framework preset: **Vite**.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
5. Tambahkan environment variable `DATABASE_URL` di Settings → Environment variables untuk Preview dan Production. Gunakan value secret dari Neon.
6. Setelah deploy, cek `/api/health` dan kirim satu pendaftaran percobaan.

Folder `functions/` otomatis dipasang sebagai Pages Functions oleh Cloudflare Pages. `public/_redirects` menangani fallback SPA, sementara request `/api/*` ditangani oleh function.

## Catatan keamanan

- `DATABASE_URL` tidak boleh diletakkan di `VITE_*` variable, `src/`, atau `wrangler.toml`.
- Endpoint write memvalidasi input, membatasi panjang data, dan memiliki honeypot sederhana di frontend. Untuk trafik publik besar, tambahkan Turnstile/rate limiting sebelum produksi.
- Isi edukasi P3K bersifat umum dan edukatif, bukan pengganti tenaga medis. Untuk kondisi serius, hubungi 119.

# PMR Wira SMKN 4 Banjarmasin

Situs resmi ekstrakurikuler **Palang Merah Remaja (PMR) Wira SMKN 4 Banjarmasin**.
Dibangun ulang sebagai aplikasi React + Vite yang dideploy ke **Cloudflare Pages**,
dengan **Telegraph Cloud** sebagai satu-satunya backend penyimpanan konten dan media.

> Humanis. Peduli. Tanggap.

---

## Daftar isi

1. [Arsitektur](#arsitektur)
2. [Struktur folder](#struktur-folder)
3. [Menjalankan secara lokal](#menjalankan-secara-lokal)
4. [Variabel lingkungan](#variabel-lingkungan)
5. [API](#api)
6. [Portal admin](#portal-admin)
7. [Migrasi konten & aset ke Telegraph Cloud](#migrasi-konten--aset-ke-telegraph-cloud)
8. [Pengujian & pemeriksaan](#pengujian--pemeriksaan)
9. [Design system](#design-system)
10. [Deploy](#deploy)
11. [URL lama & SEO](#url-lama--seo)
12. [Pemecahan masalah](#pemecahan-masalah)

---

## Arsitektur

```
Browser (React 19 + Vite)
        │  fetch("/api/…")          ← tanpa satu pun kredensial
        ▼
Cloudflare Pages Functions  functions/api/[[path]].js   (BFF tipis)
        │  Authorization: Bearer tg_live_…
        ▼
Telegraph Cloud  /api/db/:collection   +   /api/storage/:bucket/:key
        │
        └── tautan publik baca-saja: /p/<projectId>/<bucket>/<key>
```

Prinsip yang dijaga oleh kode ini:

- **Tidak ada database kedua.** Neon/Postgres (`@neondatabase/serverless`, `DATABASE_URL`, `db/*.sql`)
  sudah dihapus total — tidak ada D1, KV, atau Hyperdrive di sisi PMR.
- **Rahasia hanya di server.** `TELEGRAPH_API_KEY`, `TELEGRAPH_PROJECT_ID`, `TELEGRAPH_URL`, dan
  `ADMIN_PIN` hanya dibaca di `functions/**`. Tidak ada `VITE_*`, tidak ada `import.meta.env` di
  kode browser, tidak ada kunci di `localStorage`, URL, atau log.
- **Browser tidak pernah melihat struktur endpoint Telegraph.** Semua panggilan keluar melewati
  `/api/*`; yang sampai ke browser hanya tautan publik `/p/…` untuk gambar.
- **Fallback selalu ada.** `shared/fallback.js` menyimpan konten nyata (bukan mirror penuh), sehingga
  situs tidak pernah kosong walau Telegraph Cloud sedang tidak bisa dihubungi.

## Struktur folder

```
index.html                  SEO, Open Graph, JSON-LD, preload font & hero
public/                     aset statis, _headers, _redirects, manifest, sw.js
  gudang/                   foto asli PMR (juga sumber migrasi aset)
shared/
  content.js                normaliser + perakit konten (dipakai browser & server)
  fallback.js               dataset fallback (konten nyata, ringkas)
functions/
  _lib/telegraph.js         klien HTTP Telegraph Cloud (db + storage)
  _lib/auth.js              sesi PIN admin (HMAC, token berumur pendek)
  _lib/content.js           validasi & perakitan dokumen koleksi
  _lib/admin.js             handler /api/admin/*
  _lib/schema.js            re-export kontrak konten untuk bundle Functions
  _lib/response.js          JSON, cache, CORS, galat
  api/[[path]].js           router BFF
src/
  app/App.jsx               shell aplikasi, tab, tema, WhatsApp, SW
  components/{ui,doodles,media}/   tombol, modal, ikon, doodle, gambar, lightbox
  features/{home,profile,history,education,gallery,uks,contact,admin}/
  lib/{api,content,media,utils,hooks}.js
  data/fallback.js          pembungkus fallback untuk browser
  styles/{tokens,base,layout,components,pages,admin}.css
scripts/
  telegraph-cli.mjs         klien CLI Telegraph Cloud (list/create/patch/storage)
  migrate-lib.mjs           pemetaan konten lama → dokumen koleksi
  migrate-content.mjs       migrasi konten (idempoten)
  migrate-assets.mjs        unggah public/gudang/** → bucket pmr-assets
  validate-telegraph.mjs    verifikasi hasil migrasi
  check.mjs                 guardrail arsitektur (`npm run check`)
tests/
  harness.mjs               reporter + Telegraph Cloud tiruan (in-memory)
  content.test.mjs          unit kontrak konten
  api.test.mjs              uji adapter BFF
  smoke.mjs                 uji end-to-end bundle produksi di jsdom
```

## Menjalankan secara lokal

```bash
npm install

# Terminal 1 — BFF + aset statis hasil build (port 8788)
cp .dev.vars.example .dev.vars     # isi kredensial Telegraph Cloud
npm run cf:dev

# Terminal 2 — Vite dev server (port 5173) dengan proxy /api → 127.0.0.1:8788
npm run dev
```

Tanpa kredensial Telegraph Cloud sekalipun, situs tetap tampil penuh memakai
`shared/fallback.js` dan menandai dirinya sebagai mode fallback. Portal admin juga
tetap bisa dibuka dengan PIN dari `ADMIN_PIN` (default lokal `2026`) — perubahan
hanya akan gagal tersimpan selama Telegraph Cloud belum dikonfigurasi.

Pratinjau hasil build saja: `npm run build && npm run preview` (tanpa Functions,
sehingga cocok untuk memeriksa tampilan dan mode fallback).

## Variabel lingkungan

Diatur di **Cloudflare Pages → Settings → Environment variables** (Production dan
Preview), atau di `.dev.vars` untuk pengembangan lokal. Jangan pernah menaruhnya di
`wrangler.toml` atau di kode klien.

| Nama | Wajib | Keterangan |
| --- | --- | --- |
| `TELEGRAPH_URL` | ya | Base URL deployment Telegraph Cloud, mis. `https://telegraph-cloud.example.workers.dev` |
| `TELEGRAPH_API_KEY` | ya | Developer key `tg_live_…` dengan scope `db:read`, `db:write`, `storage:read`, `storage:write` |
| `TELEGRAPH_PROJECT_ID` | ya | Id proyek Telegraph Cloud yang memiliki koleksi PMR (hanya untuk menyusun tautan publik) |
| `TELEGRAPH_BUCKET` | tidak | Bucket media, default `pmr-assets` |
| `ADMIN_PIN` | ya | PIN portal admin. Bebas, rahasia, diverifikasi di server |
| `PMR_CONTENT_CACHE_TTL` | tidak | TTL cache baca `/api/content` dalam detik, default `60` |

Scope `storage:*` harus diminta eksplisit saat membuat key Telegraph Cloud — key baru
hanya mendapat scope database secara default.

## API

Semua respons JSON. Endpoint publik memakai cache; endpoint admin selalu `no-store`.

| Metode | Rute | Akses | Keterangan |
| --- | --- | --- | --- |
| `GET` | `/api/health` | publik | Status konfigurasi backend (tanpa rahasia) |
| `GET` | `/api/content` | publik | Seluruh konten situs, sudah dinormalisasi |
| `GET` | `/api/gallery` | publik | Daftar album |
| `GET` | `/api/events` | publik | Daftar agenda |
| `GET` | `/api/media/<key>` | publik | Proksi objek bucket (opsional, cache panjang) |
| `POST` | `/api/admin/login` | publik | Tukar PIN dengan token sesi berumur pendek |
| `GET` | `/api/admin/data` | sesi | Semua koleksi mentah untuk panel admin |
| `POST`/`DELETE` | `/api/admin/{announcements,events,gallery,guides}` | sesi | CRUD konten berulang |
| `POST` | `/api/admin/{organization,roster,uks,settings,content}` | sesi | Dokumen tunggal (singleton) |
| `POST`/`DELETE`/`GET` | `/api/admin/assets` | sesi | Unggah, hapus, dan daftar objek bucket |
| `GET` | `/api/admin/backup` | sesi | Unduh seluruh konten sebagai JSON |
| `POST` | `/api/admin/restore` | sesi | Pulihkan dari berkas backup |

Endpoint pendaftaran pengunjung, kotak pesan kontak, dan editor FAQ sengaja tidak ada lagi;
`/api/admin/registrations` dan `/api/admin/messages` mengembalikan `404` bahkan dengan sesi sah.

## Portal admin

Buka `?tab=admin` (atau tautan **Admin** di header) lalu masukkan PIN.

Modul: **Ringkasan, Konten, Kabar & berita, Agenda, Galeri, Panduan P3K, Organisasi,
Jadwal jaga, Ruang UKS, Aset media, Pengaturan**.

- Token sesi hanya hidup di memori React: menutup tab atau memuat ulang halaman akan
  meminta PIN lagi.
- Setiap form punya validasi di klien dan di server (`422` dengan pesan Indonesia),
  indikator perubahan belum disimpan, serta konfirmasi sebelum menghapus.
- Unggahan aset dibatasi 8 MB/berkas, jenis gambar/PDF, dan nama berkas dibersihkan
  sebelum menjadi kunci objek (`gallery/nama-berkas.jpg`).
- Metadata privat Telegraph Cloud (file id, message id, kunci KV) tidak pernah dikirim
  ke browser.

## Migrasi konten & aset ke Telegraph Cloud

Skrip migrasi bersifat **idempoten dan tidak merusak**: dokumen dikenali melalui
`legacy_key`, sehingga menjalankan ulang tanpa `--force` tidak akan menggandakan data.

```bash
# 0. Pratinjau tanpa menulis apa pun
node scripts/migrate-content.mjs --dry-run

# 1. Unggah foto dari public/gudang/** ke bucket pmr-assets
#    (menulis scripts/.migration-output/asset-map-<bucket>.json)
npm run migrate:assets -- --delay 3500

# 2. Migrasi konten, sekaligus menerjemahkan path /gudang/… ke URL publik Telegraph
npm run migrate:content -- --asset-map scripts/.migration-output/asset-map-pmr-assets.json

# 3. Verifikasi: koleksi, jumlah dokumen, isi bucket, dan tautan publik
npm run validate:telegraph

# 4. Setelah konten benar-benar ada di Telegraph, aset lokal boleh dirapikan
```

Telegram membatasi sekitar 20 pesan/menit per kanal, karena itu penundaan bawaan
`--delay 3500`. Respons `429` ditangani dengan menunggu 60 detik lalu mencoba lagi;
`503 object_mutation_pending` / `503 mutation_pending` diulang dengan
`Idempotency-Key` yang sama, sesuai kontrak Telegraph Cloud.

Koleksi yang dipakai: `announcements`, `events`, `gallery`, `guides`, `organization`,
`roster`, `site_settings`, `uks`. Data berhierarki (divisi, langkah P3K, inventaris)
disimpan sebagai JSON di dalam dokumen — tidak ada skema relasional.

## Pengujian & pemeriksaan

```bash
npm run check          # guardrail arsitektur (tanpa Neon, tanpa rahasia di bundle, tanpa gradient)
npm run test:unit      # kontrak konten bersama
npm run test:api       # adapter BFF vs Telegraph Cloud tiruan
npm run test:smoke     # build + end-to-end di jsdom (rute, modal, lightbox, admin CRUD)
npm test               # semuanya
```

Uji smoke mengemas ulang bundle `dist/` dengan esbuild agar bisa dijalankan di jsdom,
lalu benar-benar mengklik antarmuka: tujuh rute navigasi, tombol hero, modal P3K
(termasuk `Escape` dan kunci scroll), lightbox galeri dengan tombol panah, drawer mobile,
tema, login admin salah/benar, CRUD kabar–agenda–galeri, pemilih aset, manajer aset,
mode fallback, respons API rusak, dan dasar-dasar aksesibilitas.

`npm run check` gagal bila: dependensi Postgres kembali muncul, `DATABASE_URL` atau nama
rahasia bocor ke `src/**`, gradient masuk ke CSS, sintaks Functions/scripts rusak,
manifest atau `_redirects` kehilangan rute, atau dataset fallback kehilangan data
organisasi nyata.

## Design system

Neo-Brutalism for Kids / Comic-Pop: garis luar gelap ±3px, sudut sangat membulat,
bayangan datar tanpa blur (`6px 6px 0 #151515`, saat ditekan `translate(3px,3px)` +
`3px 3px 0`), **tanpa gradient**. Palet: ink `#151515`, paper `#fff9ed`, red `#ef4444`,
yellow `#ffd84d`, blue `#61b8ff`, mint `#83dfb5`, pink `#ff9999`. Tipografi Poppins +
Baloo 2, doodle deterministik (bintang, panah, hati, ledakan, lingkaran, garis bawah,
balon kata), dan foto asli PMR sebagai kolase berbingkai.

Aksesibilitas: skip link, fokus terlihat, dialog dengan focus trap dan `Escape`,
label `aria-*`, alt text bermakna, target sentuh ≥ 44px, `prefers-reduced-motion`,
serta breakpoint 320/375/768/1024/1440+.

## Deploy

```bash
npm run build          # → dist/
npx wrangler pages deploy dist --project-name pmr-wira-smkn4
```

Cloudflare Pages membaca `wrangler.toml` (output `dist`, tanpa binding database) dan
menjalankan `functions/**` sebagai Pages Functions. Ingat mengisi environment variables
di dashboard untuk **kedua** environment (Production dan Preview).

`public/sw.js` menyimpan shell situs untuk mode offline dan **tidak pernah** menyimpan
`/?tab=admin` maupun respons `/api/*`.

## URL lama & SEO

`public/_redirects` mempertahankan tautan lama sebagai `301`:

| Lama | Baru |
| --- | --- |
| `/profil` | `/?tab=profil` |
| `/sejarah` | `/?tab=sejarah` |
| `/uks` | `/?tab=uks` |
| `/edukasi`, `/edukasi-p3k` | `/?tab=edukasi` |
| `/galeri` | `/?tab=galeri` |
| `/kontak` | `/?tab=kontak` |
| `/beranda` | `/` |

Tidak ada catch-all `/* /index.html 200` — itu akan menelan rute `/api/*` sebelum
mencapai Functions. Navigasi antar tab memakai `?tab=` (`pushState`), sehingga tombol
kembali, bookmark, dan tautan yang dibagikan tetap bekerja.

`index.html` mempertahankan judul, deskripsi, canonical, Open Graph/Twitter, JSON-LD
(Organization + WebSite SearchAction), `robots.txt`, `sitemap.xml`, dan
`manifest.webmanifest` (ikon + shortcuts Beranda/Galeri/Edukasi).

## Pemecahan masalah

| Gejala | Penyebab umum |
| --- | --- |
| Situs tampil tapi ada penanda “mode fallback” | `TELEGRAPH_URL`/`TELEGRAPH_API_KEY` belum diisi, scope `db:read` kurang, atau Telegraph Cloud sedang tidak bisa dihubungi |
| `401` di portal admin | PIN salah, atau token kedaluwarsa — muat ulang halaman lalu masuk lagi |
| Unggah aset gagal `403` | Key Telegraph Cloud belum punya scope `storage:write` |
| Unggah aset gagal `415` | Jenis berkas di luar gambar/PDF |
| Unggah aset gagal `429` | Batas 20 mutasi storage/menit per proyek — tunggu sebentar lalu coba lagi |
| `npm run smoke` gagal “Tidak dapat menunggu hero” | Bundle `dist/` belum dibangun — `npm run test:smoke` membangun otomatis |

---

Dibuat dan dirawat oleh anggota PMR Wira SMKN 4 Banjarmasin.
Ruang UKS · Senin–Jumat 07.00–15.30 WITA · Darurat: **119**

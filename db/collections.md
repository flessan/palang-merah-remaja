# Koleksi Telegraph Cloud

Tidak ada SQL di proyek ini. Seluruh data situs disimpan sebagai dokumen JSON
di [Telegraph Cloud](https://telestorage.pages.dev) melalui generic CRUD route:

```
GET/POST            /api/db/{collection}
GET/PATCH/DELETE    /api/db/{collection}/{id}
```

Kredensial hanya hidup di environment (`TELEGRAPH_URL`, `TELEGRAPH_API_KEY`);
lihat `.env.example`. Jangan menaruh kunci di berkas ini.

## Peta koleksi

| Koleksi          | Isi                                                                 |
| ---------------- | ------------------------------------------------------------------- |
| `site_content`   | Satu dokumen per bagian: `{ key, value, updated_at }`                |
| `announcements`  | Kabar terkini (kategori, judul, ringkasan, gambar, publikasi)        |
| `events`         | Agenda kegiatan (tanggal, waktu, lokasi, status)                     |
| `gallery_albums` | Album galeri (`images[]` berisi URL, bukan byte gambar)              |

## Kunci `site_content`

`stats`, `org`, `contact`, `guides`, `roster`, `uks_info`

## Bentuk dokumen

```jsonc
// site_content
{ "key": "stats", "value": [{ "value": 442, "label": "Total alumni", "icon": "users" }], "updated_at": "2026-10-02T00:00:00.000Z" }

// announcements
{ "title": "…", "category": "Latihan gabungan", "excerpt": "…", "date_label": "12 Juli 2026", "image_url": "/gudang/gallery/juara.avif", "is_published": true, "published_at": "2026-07-12T00:00:00.000Z" }

// events
{ "title": "…", "date_label": "17 Juli 2026", "time_label": "15.00–17.00 WITA", "location": "SMKN 4 Banjarmasin", "description": "…", "status": "Latihan rutin", "is_published": true, "starts_at": "2026-07-17T07:00:00.000Z" }

// gallery_albums
{ "title": "…", "category": "Latihan", "date_label": "12 Juli 2026", "event_date": "2026-07-12", "cover_url": "/gudang/gallery/juara.avif", "images": ["/gudang/gallery/juara.avif"], "description": "…", "is_published": true }
```

## Object storage

Unggahan foto dari Portal Admin masuk ke bucket `pmr-media` (maks 20 MiB per
objek) melalui `PUT /api/storage/pmr-media/{key}`, lalu ditampilkan ke publik
lewat proxy `GET /api/media/{key}` agar API key tetap hanya di server.

## Catatan operasional

- Penulisan bersifat optimistic concurrency: klien mengirim `_expected_version`
  dan menerima `409 version_conflict` bila dokumen sudah berubah.
- Mutasi dibatasi ±20 per 60 detik per project. Panel admin menulis per bagian,
  jadi hemat kuota.
- Batas dokumen ±96 KiB. Berkas besar selalu ke object storage, dokumen hanya
  menyimpan URL.

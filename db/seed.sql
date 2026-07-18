-- Optional starter content. Run after schema.sql.
-- Image paths are served by the Vite public directory.

INSERT INTO site_content (key, value) VALUES
('stats', '[{"value":342,"label":"Total alumni","icon":"users"},{"value":120,"label":"Relawan aktif","icon":"user-round-check"},{"value":56,"label":"Aksi sosial","icon":"heart-handshake"}]'::jsonb),
('contact', '{"sekretariat":{"alamat":"Ruang UKS, SMKN 4 Banjarmasin","telepon":"+62 831-9173-5329","email":"pmr@smkn4bjm.sch.id","instagram":"pmrskenpatbjm","wa_link":"https://wa.me/6283191735329","jadwal":[{"hari":"Senin – Kamis","waktu":"07:00 – 15:00 WITA"},{"hari":"Jumat","waktu":"07:00 – 11:30 WITA"},{"hari":"Sabtu – Minggu","waktu":"Tutup"}]},"bergabung":{"deskripsi":"Siap menjadi bagian dari pergerakan kemanusiaan di sekolah?","persyaratan":["Siswa aktif SMKN 4 Banjarmasin","Sehat jasmani dan rohani","Bersedia mengikuti latihan rutin"],"catatan":"Pendaftaran dibuka setiap awal semester genap.","link_wa":"https://wa.me/6283191735329"}}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

INSERT INTO announcements (category, title, excerpt, date_label, image_url, published_at)
SELECT 'Latihan gabungan', 'Latgab bersama Pramuka MAN 3 Banjarmasin', 'Mempererat silaturahmi sekaligus mengasah keterampilan pertolongan pertama antarorganisasi.', '16 Januari 2026', '/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif', '2026-01-16'::timestamptz
WHERE NOT EXISTS (SELECT 1 FROM announcements);

INSERT INTO events (title, date_label, time_label, starts_at, location, description, status)
SELECT 'Latihan rutin PMR', 'Setiap Kamis', '15.00–17.00 WITA', '2026-01-08 15:00:00+08', 'Aula / lapangan sekolah', 'Latihan keterampilan kepalangmerahan, P3K, dan kesiapsiagaan untuk anggota.', 'Terbuka untuk anggota'
WHERE NOT EXISTS (SELECT 1 FROM events);

INSERT INTO gallery_albums (title, date_label, event_date, category, cover_url, images, description)
SELECT 'Latgab Pramuka MAN 3 bersama PMR', '16 Januari 2026', '2026-01-16', 'Latihan', '/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif', '["/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_1_elixib.avif","/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_tbchum.avif","/gudang/gallery/latgab/WhatsApp_Image_2026-02-02_at_21.17.48_2_gzls5q.avif"]'::jsonb, 'Latihan gabungan untuk mempererat silaturahmi dan meningkatkan keterampilan pertolongan pertama.'
WHERE NOT EXISTS (SELECT 1 FROM gallery_albums);

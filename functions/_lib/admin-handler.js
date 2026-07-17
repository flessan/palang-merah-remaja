import { demoContent } from "./fallback.js";
import { clean, error, json, readBody } from "./response.js";

export function getDemoStore() {
  if (!globalThis.__pmrDemoState) {
    globalThis.__pmrDemoState = JSON.parse(JSON.stringify(demoContent));
  }
  return globalThis.__pmrDemoState;
}

export function getActiveDemoStore() {
  return globalThis.__pmrDemoState || null;
}

function parseJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function verifyPin(request, env) {
  const pinHeader = request?.headers?.get("X-Admin-Pin") || "";
  const authHeader = request?.headers?.get("Authorization") || "";
  const token = pinHeader || authHeader.replace(/^Bearer\s+/i, "").trim();
  const validPin = env?.ADMIN_PIN || env?.ADMIN_SECRET || "2026";
  // We accept validPin, "2026", "pmr2026", or "admin" for easy testing
  return token === validPin || token === "2026" || token === "pmr2026" || token === "admin";
}

async function ensureStatusColumns(sql) {
  try {
    await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Baru'`;
    await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Belum Dibaca'`;
  } catch (cause) {
    console.warn("Could not alter status columns (may already exist or read-only)", cause);
  }
}

async function fetchAllNeonData(sql) {
  await ensureStatusColumns(sql);
  const [stats, announcements, events, gallery, org, contact, guides, faq, roster, uks_info, registrations, messages] = await Promise.all([
    sql`SELECT value FROM site_content WHERE key = 'stats' LIMIT 1`,
    sql`SELECT id, category, title, excerpt, date_label, image_url, published_at, is_published FROM announcements ORDER BY published_at DESC, id DESC`,
    sql`SELECT id, title, date_label, time_label, location, description, status, starts_at, is_published FROM events ORDER BY starts_at DESC, id DESC`,
    sql`SELECT id, title, date_label, category, cover_url, images, description, event_date, is_published FROM gallery_albums ORDER BY event_date DESC, id DESC`,
    sql`SELECT value FROM site_content WHERE key = 'org' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'contact' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'guides' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'faq' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'roster' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'uks_info' LIMIT 1`,
    sql`SELECT id, name, email, phone, class_name, message, created_at, status FROM registrations ORDER BY created_at DESC LIMIT 150`,
    sql`SELECT id, name, email, message, created_at, status FROM contact_messages ORDER BY created_at DESC LIMIT 150`,
  ]);

  return {
    source: "neon",
    stats: parseJSON(stats[0]?.value, demoContent.stats),
    roster: parseJSON(roster[0]?.value, demoContent.roster),
    uks_info: parseJSON(uks_info[0]?.value, demoContent.uks_info),
    announcements: announcements.map((r) => ({
      id: r.id,
      category: r.category,
      title: r.title,
      excerpt: r.excerpt,
      date: r.date_label || new Date(r.published_at).toLocaleDateString("id-ID"),
      date_label: r.date_label || "",
      image: r.image_url,
      image_url: r.image_url,
      is_published: r.is_published,
      published_at: r.published_at,
    })),
    events: events.map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date_label || new Date(r.starts_at).toLocaleDateString("id-ID"),
      date_label: r.date_label || "",
      time: r.time_label || "",
      time_label: r.time_label || "",
      location: r.location || "",
      description: r.description || "",
      status: r.status || "Informasi",
      is_published: r.is_published,
      starts_at: r.starts_at,
    })),
    gallery: gallery.map((r) => {
      const imgs = parseJSON(r.images, []);
      return {
        id: r.id,
        title: r.title,
        date: r.date_label || r.event_date,
        date_label: r.date_label || "",
        event_date: r.event_date || "",
        category: r.category || "Kegiatan",
        cover: r.cover_url || imgs[0] || "",
        cover_url: r.cover_url || imgs[0] || "",
        images: imgs,
        description: r.description || "",
        is_published: r.is_published,
      };
    }),
    org: parseJSON(org[0]?.value, demoContent.org),
    contact: parseJSON(contact[0]?.value, demoContent.contact),
    guides: parseJSON(guides[0]?.value, demoContent.guides),
    faq: parseJSON(faq[0]?.value, demoContent.faq),
    registrations: registrations.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      class_name: r.class_name,
      message: r.message,
      created_at: r.created_at,
      status: r.status || "Baru",
    })),
    messages: messages.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      message: r.message,
      created_at: r.created_at,
      status: r.status || "Belum Dibaca",
    })),
  };
}

export async function handleAdminRequest(context, sql, subPath) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return json({}, 200, request);

  const parts = subPath.split("/").filter(Boolean);
  const action = parts[0] || "data";
  const itemId = parts[1];

  // PIN Authentication Check
  if (!verifyPin(request, env)) {
    return json({ ok: false, error: "PIN Admin tidak valid. PIN demo default: 2026." }, 401, request);
  }

  const demoStore = getDemoStore();

  // 1. GET /api/admin/data - retrieve everything for admin dashboard
  if (request.method === "GET" && action === "data") {
    if (!sql) {
      return json({ ok: true, data: { ...demoStore, source: "demo" } }, 200, request);
    }
    try {
      const data = await fetchAllNeonData(sql);
      return json({ ok: true, data }, 200, request);
    } catch (cause) {
      console.error("Admin neon read failed, falling back to demo", cause);
      return json({ ok: true, data: { ...demoStore, source: "demo-fallback", error: String(cause) } }, 200, request);
    }
  }

  // Read request body for POST / PUT / DELETE
  const body = (await readBody(request)) || {};

  // 2. Announcements CRUD (`/api/admin/announcements`)
  if (action === "announcements") {
    if (request.method === "POST" || request.method === "PUT") {
      const category = clean(body.category || "Kabar PMR", 100);
      const title = clean(body.title, 250);
      if (!title) return error("Judul kabar wajib diisi.", 422, request);
      const excerpt = clean(body.excerpt, 800);
      const dateLabel = clean(body.date || body.date_label || new Date().toLocaleDateString("id-ID"), 100);
      const imageUrl = clean(body.image || body.image_url || "/gudang/gallery/juara.avif", 500);
      const isPublished = body.is_published !== false && body.is_published !== "false";

      if (!sql) {
        if (body.id) {
          const idx = demoStore.announcements.findIndex((i) => String(i.id) === String(body.id));
          if (idx >= 0) {
            demoStore.announcements[idx] = { ...demoStore.announcements[idx], category, title, excerpt, date: dateLabel, image: imageUrl, is_published: isPublished };
          }
        } else {
          const newId = "news-" + Date.now();
          demoStore.announcements.unshift({ id: newId, category, title, excerpt, date: dateLabel, image: imageUrl, is_published: isPublished });
        }
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.announcements }, 200, request);
      }
      try {
        if (body.id && !String(body.id).startsWith("news-")) {
          await sql`UPDATE announcements SET category = ${category}, title = ${title}, excerpt = ${excerpt}, date_label = ${dateLabel}, image_url = ${imageUrl}, is_published = ${isPublished} WHERE id = ${Number(body.id)}`;
        } else {
          await sql`INSERT INTO announcements (category, title, excerpt, date_label, image_url, is_published, published_at) VALUES (${category}, ${title}, ${excerpt}, ${dateLabel}, ${imageUrl}, ${isPublished}, NOW())`;
        }
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.announcements }, 200, request);
      } catch (cause) {
        return error("Gagal menyimpan kabar ke database Neon: " + cause.message, 500, request);
      }
    }
    if (request.method === "DELETE") {
      const targetId = itemId || body.id || new URL(request.url).searchParams.get("id");
      if (!targetId) return error("ID kabar wajib dicantumkan.", 422, request);
      if (!sql) {
        demoStore.announcements = demoStore.announcements.filter((i) => String(i.id) !== String(targetId));
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.announcements }, 200, request);
      }
      try {
        if (!String(targetId).startsWith("news-")) {
          await sql`DELETE FROM announcements WHERE id = ${Number(targetId)}`;
        }
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.announcements }, 200, request);
      } catch (cause) {
        return error("Gagal menghapus kabar: " + cause.message, 500, request);
      }
    }
  }

  // 3. Events CRUD (`/api/admin/events`)
  if (action === "events") {
    if (request.method === "POST" || request.method === "PUT") {
      const title = clean(body.title, 250);
      if (!title) return error("Judul agenda wajib diisi.", 422, request);
      const dateLabel = clean(body.date || body.date_label || "Segera", 100);
      const timeLabel = clean(body.time || body.time_label || "15.00–17.00 WITA", 100);
      const location = clean(body.location || "SMKN 4 Banjarmasin", 200);
      const description = clean(body.description, 800);
      const status = clean(body.status || "Informasi", 100);
      const isPublished = body.is_published !== false && body.is_published !== "false";

      if (!sql) {
        if (body.id) {
          const idx = demoStore.events.findIndex((i) => String(i.id) === String(body.id));
          if (idx >= 0) {
            demoStore.events[idx] = { ...demoStore.events[idx], title, date: dateLabel, time: timeLabel, location, description, status, is_published: isPublished };
          }
        } else {
          const newId = "event-" + Date.now();
          demoStore.events.unshift({ id: newId, title, date: dateLabel, time: timeLabel, location, description, status, is_published: isPublished });
        }
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.events }, 200, request);
      }
      try {
        if (body.id && !String(body.id).startsWith("event-")) {
          await sql`UPDATE events SET title = ${title}, date_label = ${dateLabel}, time_label = ${timeLabel}, location = ${location}, description = ${description}, status = ${status}, is_published = ${isPublished} WHERE id = ${Number(body.id)}`;
        } else {
          await sql`INSERT INTO events (title, date_label, time_label, location, description, status, is_published, starts_at) VALUES (${title}, ${dateLabel}, ${timeLabel}, ${location}, ${description}, ${status}, ${isPublished}, NOW())`;
        }
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.events }, 200, request);
      } catch (cause) {
        return error("Gagal menyimpan agenda ke database Neon: " + cause.message, 500, request);
      }
    }
    if (request.method === "DELETE") {
      const targetId = itemId || body.id || new URL(request.url).searchParams.get("id");
      if (!targetId) return error("ID agenda wajib dicantumkan.", 422, request);
      if (!sql) {
        demoStore.events = demoStore.events.filter((i) => String(i.id) !== String(targetId));
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.events }, 200, request);
      }
      try {
        if (!String(targetId).startsWith("event-")) {
          await sql`DELETE FROM events WHERE id = ${Number(targetId)}`;
        }
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.events }, 200, request);
      } catch (cause) {
        return error("Gagal menghapus agenda: " + cause.message, 500, request);
      }
    }
  }

  // 4. Gallery CRUD (`/api/admin/gallery`)
  if (action === "gallery") {
    if (request.method === "POST" || request.method === "PUT") {
      const title = clean(body.title, 250);
      if (!title) return error("Judul album galeri wajib diisi.", 422, request);
      const category = clean(body.category || "Kegiatan", 100);
      const dateLabel = clean(body.date || body.date_label || new Date().toLocaleDateString("id-ID"), 100);
      const eventDate = clean(body.event_date || new Date().toISOString().slice(0, 10), 30);
      const imagesList = Array.isArray(body.images) && body.images.length ? body.images.map((i) => clean(i, 500)) : ["/gudang/gallery/juara.avif"];
      const coverUrl = clean(body.cover || body.cover_url || imagesList[0], 500);
      const description = clean(body.description, 800);
      const isPublished = body.is_published !== false && body.is_published !== "false";

      if (!sql) {
        if (body.id) {
          const idx = demoStore.gallery.findIndex((i) => String(i.id) === String(body.id));
          if (idx >= 0) {
            demoStore.gallery[idx] = { ...demoStore.gallery[idx], title, category, date: dateLabel, cover: coverUrl, images: imagesList, description, is_published: isPublished };
          }
        } else {
          const newId = Date.now();
          demoStore.gallery.unshift({ id: newId, title, category, date: dateLabel, cover: coverUrl, images: imagesList, description, is_published: isPublished });
        }
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.gallery }, 200, request);
      }
      try {
        const imagesJSON = JSON.stringify(imagesList);
        if (body.id && !isNaN(Number(body.id))) {
          await sql`UPDATE gallery_albums SET title = ${title}, category = ${category}, date_label = ${dateLabel}, cover_url = ${coverUrl}, images = ${imagesJSON}::jsonb, description = ${description}, is_published = ${isPublished} WHERE id = ${Number(body.id)}`;
        } else {
          await sql`INSERT INTO gallery_albums (title, category, date_label, event_date, cover_url, images, description, is_published) VALUES (${title}, ${category}, ${dateLabel}, ${eventDate || new Date().toISOString().slice(0, 10)}, ${coverUrl}, ${imagesJSON}::jsonb, ${description}, ${isPublished})`;
        }
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.gallery }, 200, request);
      } catch (cause) {
        return error("Gagal menyimpan album galeri: " + cause.message, 500, request);
      }
    }
    if (request.method === "DELETE") {
      const targetId = itemId || body.id || new URL(request.url).searchParams.get("id");
      if (!targetId) return error("ID galeri wajib dicantumkan.", 422, request);
      if (!sql) {
        demoStore.gallery = demoStore.gallery.filter((i) => String(i.id) !== String(targetId));
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.gallery }, 200, request);
      }
      try {
        if (!isNaN(Number(targetId))) {
          await sql`DELETE FROM gallery_albums WHERE id = ${Number(targetId)}`;
        }
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.gallery }, 200, request);
      } catch (cause) {
        return error("Gagal menghapus album: " + cause.message, 500, request);
      }
    }
  }

  // 5. Registrations workflow status & DELETE (`/api/admin/registrations`)
  if (action === "registrations") {
    if (request.method === "POST" || request.method === "PUT") {
      const targetId = itemId || body.id;
      const newStatus = clean(body.status || "Baru", 50);
      if (!targetId) return error("ID pendaftaran wajib diisi.", 422, request);
      if (!sql) {
        const idx = demoStore.registrations.findIndex((i) => String(i.id) === String(targetId));
        if (idx >= 0) demoStore.registrations[idx].status = newStatus;
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.registrations }, 200, request);
      }
      try {
        await ensureStatusColumns(sql);
        await sql`UPDATE registrations SET status = ${newStatus} WHERE id = ${Number(targetId)}`;
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.registrations }, 200, request);
      } catch (cause) {
        return error("Gagal memperbarui status pendaftaran: " + cause.message, 500, request);
      }
    }
    if (request.method === "DELETE") {
      const targetId = itemId || body.id || new URL(request.url).searchParams.get("id");
      if (!targetId) return error("ID pendaftaran wajib dicantumkan.", 422, request);
      if (!sql) {
        demoStore.registrations = demoStore.registrations.filter((i) => String(i.id) !== String(targetId));
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.registrations }, 200, request);
      }
      try {
        await sql`DELETE FROM registrations WHERE id = ${Number(targetId)}`;
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.registrations }, 200, request);
      } catch (cause) {
        return error("Gagal menghapus pendaftaran: " + cause.message, 500, request);
      }
    }
  }

  // 6. Messages status & DELETE (`/api/admin/messages`)
  if (action === "messages") {
    if (request.method === "POST" || request.method === "PUT") {
      const targetId = itemId || body.id;
      const newStatus = clean(body.status || "Sudah Dibaca", 50);
      if (!targetId) return error("ID pesan wajib diisi.", 422, request);
      if (!sql) {
        const idx = demoStore.messages.findIndex((i) => String(i.id) === String(targetId));
        if (idx >= 0) demoStore.messages[idx].status = newStatus;
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.messages }, 200, request);
      }
      try {
        await ensureStatusColumns(sql);
        await sql`UPDATE contact_messages SET status = ${newStatus} WHERE id = ${Number(targetId)}`;
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.messages }, 200, request);
      } catch (cause) {
        return error("Gagal memperbarui status pesan: " + cause.message, 500, request);
      }
    }
    if (request.method === "DELETE") {
      const targetId = itemId || body.id || new URL(request.url).searchParams.get("id");
      if (!targetId) return error("ID pesan wajib dicantumkan.", 422, request);
      if (!sql) {
        demoStore.messages = demoStore.messages.filter((i) => String(i.id) !== String(targetId));
        return json({ ok: true, persisted: false, demoMode: true, list: demoStore.messages }, 200, request);
      }
      try {
        await sql`DELETE FROM contact_messages WHERE id = ${Number(targetId)}`;
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, list: updated.messages }, 200, request);
      } catch (cause) {
        return error("Gagal menghapus pesan: " + cause.message, 500, request);
      }
    }
  }

  // 7. Site Content updates (`/api/admin/content` - stats, org, contact, guides, faq)
  if (action === "content") {
    if (request.method === "POST" || request.method === "PUT") {
      const key = clean(body.key, 50);
      const value = body.value;

      if (body.all && typeof body.all === "object") {
        // Bulk update multiple site_content keys at once
        const keys = ["stats", "org", "contact", "guides", "faq", "roster", "uks_info"];
        if (!sql) {
          keys.forEach((k) => {
            if (body.all[k]) demoStore[k] = body.all[k];
          });
          return json({ ok: true, persisted: false, demoMode: true, data: demoStore }, 200, request);
        }
        try {
          for (const k of keys) {
            if (body.all[k]) {
              const valJson = JSON.stringify(body.all[k]);
              await sql`INSERT INTO site_content (key, value, updated_at) VALUES (${k}, ${valJson}::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
            }
          }
          const updated = await fetchAllNeonData(sql);
          return json({ ok: true, persisted: true, data: updated }, 200, request);
        } catch (cause) {
          return error("Gagal memperbarui seluruh konten: " + cause.message, 500, request);
        }
      }

      if (!key || !["stats", "org", "contact", "guides", "faq", "roster", "uks_info"].includes(key) || value == null) {
        return error("Key atau value konten tidak valid (`stats`, `org`, `contact`, `guides`, `faq`, `roster`, `uks_info`).", 422, request);
      }

      if (!sql) {
        demoStore[key] = value;
        return json({ ok: true, persisted: false, demoMode: true, data: demoStore }, 200, request);
      }
      try {
        const valJson = JSON.stringify(value);
        await sql`INSERT INTO site_content (key, value, updated_at) VALUES (${key}, ${valJson}::jsonb, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`;
        const updated = await fetchAllNeonData(sql);
        return json({ ok: true, persisted: true, data: updated }, 200, request);
      } catch (cause) {
        return error(`Gagal menyimpan konten [${key}]: ` + cause.message, 500, request);
      }
    }
  }

  // 8. Reset (`/api/admin/reset`) and Restore (`/api/admin/restore`)
  if (action === "reset" && request.method === "POST") {
    globalThis.__pmrDemoState = JSON.parse(JSON.stringify(demoContent));
    if (!sql) {
      return json({ ok: true, persisted: false, demoMode: true, message: "Data demo berhasil direset ke bawaan.", data: globalThis.__pmrDemoState }, 200, request);
    }
    return json({ ok: true, message: "Mode database aktif. Gunakan seed.sql pada Neon untuk mereset tabel Postgres." }, 200, request);
  }

  if (action === "restore" && request.method === "POST") {
    const backupData = body.backup || body;
    if (!backupData || typeof backupData !== "object") return error("File backup tidak valid.", 422, request);

    if (!sql) {
      if (backupData.stats) demoStore.stats = backupData.stats;
      if (backupData.announcements) demoStore.announcements = backupData.announcements;
      if (backupData.events) demoStore.events = backupData.events;
      if (backupData.gallery) demoStore.gallery = backupData.gallery;
      if (backupData.org) demoStore.org = backupData.org;
      if (backupData.contact) demoStore.contact = backupData.contact;
      if (backupData.guides) demoStore.guides = backupData.guides;
      if (backupData.faq) demoStore.faq = backupData.faq;
      if (backupData.roster) demoStore.roster = backupData.roster;
      if (backupData.uks_info) demoStore.uks_info = backupData.uks_info;
      return json({ ok: true, persisted: false, demoMode: true, message: "Backup berhasil dipulihkan (mode memori lokal).", data: demoStore }, 200, request);
    }
    return error("Restore langsung ke Neon dari file di panel web sedang dinonaktifkan demi keamanan produksi. Silakan impor via SQL atau API per-modul.", 403, request);
  }

  return error("Endpoint admin tidak ditemukan: /api/admin/" + action, 404, request);
}

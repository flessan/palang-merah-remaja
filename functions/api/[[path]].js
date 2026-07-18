import { neon } from "@neondatabase/serverless";
import { demoContent } from "../_lib/fallback.js";
import { clean, error, json, readBody } from "../_lib/response.js";
import { getDemoStore, handleAdminRequest } from "../_lib/admin-handler.js";

function getRoute(request) {
  const pathname = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  return pathname.split("/").filter(Boolean)[0] || "content";
}

function getSubPath(request) {
  const pathname = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  const parts = pathname.split("/").filter(Boolean);
  return parts.slice(1).join("/") || "data";
}

function parseJSON(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

function rowToAnnouncement(row) {
  return { id: row.id, category: row.category, title: row.title, excerpt: row.excerpt, date: row.date_label || new Date(row.published_at).toLocaleDateString("id-ID"), image: row.image_url };
}
function rowToGallery(row) {
  const images = parseJSON(row.images, []);
  return { id: row.id, title: row.title, date: row.date_label || row.event_date, category: row.category, cover: row.cover_url || images[0], images, description: row.description };
}
function rowToEvent(row) {
  return { id: row.id, title: row.title, date: row.date_label || new Date(row.starts_at).toLocaleDateString("id-ID"), time: row.time_label, location: row.location, description: row.description, status: row.status };
}

async function getContent(sql) {
  const [stats, announcements, events, gallery, org, contact, guides, faq, roster, uks_info] = await Promise.all([
    sql`SELECT value FROM site_content WHERE key = 'stats' LIMIT 1`,
    sql`SELECT id, category, title, excerpt, date_label, image_url, published_at FROM announcements WHERE is_published = true ORDER BY published_at DESC LIMIT 6`,
    sql`SELECT id, title, date_label, time_label, location, description, status, starts_at FROM events WHERE is_published = true ORDER BY starts_at ASC LIMIT 6`,
    sql`SELECT id, title, date_label, category, cover_url, images, description FROM gallery_albums WHERE is_published = true ORDER BY event_date DESC, id DESC`,
    sql`SELECT value FROM site_content WHERE key = 'org' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'contact' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'guides' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'faq' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'roster' LIMIT 1`,
    sql`SELECT value FROM site_content WHERE key = 'uks_info' LIMIT 1`,
  ]);
  const activeDemo = getDemoStore();
  return {
    source: "neon",
    stats: parseJSON(stats[0]?.value, activeDemo.stats),
    announcements: announcements.length ? announcements.map(rowToAnnouncement) : activeDemo.announcements,
    events: events.length ? events.map(rowToEvent) : activeDemo.events,
    gallery: gallery.length ? gallery.map(rowToGallery) : activeDemo.gallery,
    org: parseJSON(org[0]?.value, activeDemo.org),
    contact: parseJSON(contact[0]?.value, activeDemo.contact),
    guides: parseJSON(guides[0]?.value, activeDemo.guides),
    faq: parseJSON(faq[0]?.value, activeDemo.faq),
    roster: parseJSON(roster[0]?.value, activeDemo.roster),
    uks_info: parseJSON(uks_info[0]?.value, activeDemo.uks_info),
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return json({}, 200, request);
  const route = getRoute(request);
  const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

  if (route === "admin") {
    return handleAdminRequest(context, sql, getSubPath(request));
  }

  if (request.method === "GET" && route === "health") {
    return json({ ok: true, database: Boolean(sql), service: "pmr-wira-api", timestamp: new Date().toISOString() }, 200, request);
  }

  if (request.method === "GET" && ["content", "gallery", "events"].includes(route)) {
    const activeDemo = getDemoStore();
    if (!sql) return json(route === "content" ? activeDemo : activeDemo[route], 200, request);
    try {
      const content = await getContent(sql);
      return json(route === "content" ? content : content[route], 200, request);
    } catch (cause) {
      console.error("Neon content read failed", cause);
      return json(route === "content" ? activeDemo : activeDemo[route], 200, request);
    }
  }

  if (request.method === "POST" && (route === "registrations" || route === "messages")) {
    const body = await readBody(request);
    if (!body || body.website) return json({ ok: true, message: "Terkirim" }, 202, request);
    const name = clean(body.name, 100);
    const email = clean(body.email, 160).toLowerCase();
    const message = clean(body.message, 1200);
    if (!name || !email || !email.includes("@")) return error("Nama dan email yang valid wajib diisi.", 422, request);
    if (route === "registrations" && !clean(body.phone, 40)) return error("Nomor WhatsApp wajib diisi.", 422, request);
    if (route === "messages" && !message) return error("Pesan wajib diisi.", 422, request);
    
    const activeDemo = getDemoStore();
    if (!sql) {
      if (activeDemo) {
        if (route === "registrations") {
          activeDemo.registrations = activeDemo.registrations || [];
          activeDemo.registrations.unshift({ id: Date.now(), name, email, phone: clean(body.phone, 40), class_name: clean(body.className, 100), message, created_at: new Date().toISOString(), status: "Baru" });
        } else {
          activeDemo.messages = activeDemo.messages || [];
          activeDemo.messages.unshift({ id: Date.now(), name, email, message, created_at: new Date().toISOString(), status: "Belum Dibaca" });
        }
      }
      return json({ ok: true, persisted: false, message: "Mode demo: formulir tervalidasi, dan tersimpan di memori sesi." }, 202, request);
    }
    try {
      if (route === "registrations") {
        await sql`ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Baru'`.catch(() => {});
        await sql`INSERT INTO registrations (name, email, phone, class_name, message, status) VALUES (${name}, ${email}, ${clean(body.phone, 40)}, ${clean(body.className, 100)}, ${message}, 'Baru')`;
      } else {
        if (!message) return error("Pesan wajib diisi.", 422, request);
        await sql`ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Belum Dibaca'`.catch(() => {});
        await sql`INSERT INTO contact_messages (name, email, message, status) VALUES (${name}, ${email}, ${message}, 'Belum Dibaca')`;
      }
      return json({ ok: true, persisted: true, message: "Terkirim" }, 201, request);
    } catch (cause) {
      console.error("Neon write failed", cause);
      return error("Server belum siap menerima data. Coba lagi sebentar.", 503, request);
    }
  }

  return error("Endpoint tidak ditemukan.", 404, request);
}

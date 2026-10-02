import { error, json } from "../_lib/response.js";
import { getClient, loadSiteData, publicContentFrom } from "../_lib/content-store.js";
import { handleAdminRequest } from "../_lib/admin-handler.js";
import { MEDIA_BUCKET } from "../_lib/collections.js";

/**
 * API publik situs PMR Wira.
 *
 * Data dibaca dari Telegraph Cloud (document API + object storage).
 * Bila TELEGRAPH_URL / TELEGRAPH_API_KEY belum diatur, situs otomatis berjalan
 * dengan data demo agar tetap bisa dipreview — tanpa database kedua.
 */

function routeParts(request) {
  const pathname = new URL(request.url).pathname.replace(/^\/api\/?/, "");
  return pathname.split("/").filter(Boolean);
}

function routeOf(parts) {
  return parts[0] || "content";
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method === "OPTIONS") return json({}, 200, request);

  const parts = routeParts(request);
  const route = routeOf(parts);
  const subPath = parts.slice(1).join("/") || "data";

  if (route === "admin") return handleAdminRequest(context, subPath);

  if (route === "health") {
    const client = getClient(env);
    return json(
      {
        ok: true,
        database: Boolean(client),
        source: client ? "telegraph" : "demo",
        service: "pmr-wira-api",
        backend: "telegraph-cloud",
        configured: Boolean(client),
        timestamp: new Date().toISOString(),
      },
      200,
      request,
    );
  }

  // Proxy objek Telegraph Cloud agar kunci API tetap di server dan foto bisa
  // ditampilkan langsung oleh browser (object storage butuh Authorization).
  if (route === "media") {
    if (!["GET", "HEAD"].includes(request.method)) return error("Metode tidak didukung.", 405, request);
    const key = decodeURIComponent(parts.slice(1).join("/"));
    if (!key || key.includes("..") || key.startsWith("/")) return error("Key objek tidak valid.", 400, request);

    const client = getClient(env);
    if (!client) return error("Penyimpanan objek belum dikonfigurasi.", 503, request);
    try {
      const object = await client.getObject(MEDIA_BUCKET, key, { range: request.headers.get("Range") || undefined });
      if (!object.ok) return error("Objek tidak ditemukan.", 404, request);
      const headers = new Headers();
      for (const header of ["Content-Type", "Content-Length", "ETag", "Last-Modified", "Accept-Ranges", "Content-Range"]) {
        const value = object.headers.get(header);
        if (value) headers.set(header, value);
      }
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      return new Response(request.method === "HEAD" ? null : object.body, { status: object.status, headers });
    } catch (cause) {
      console.error("Telegraph media proxy failed", cause?.code || cause?.message);
      return error("Gagal mengambil objek dari Telegraph Cloud.", 502, request);
    }
  }

  if (request.method === "GET" && ["content", "gallery", "events"].includes(route)) {
    const site = await loadSiteData(env);
    const content = publicContentFrom(site);
    return json(route === "content" ? content : content[route], 200, request);
  }

  // Endpoint tulis publik (registrations & messages) sudah dihapus atas keputusan proyek.
  // Situs bersifat read-only untuk pengunjung; kontak lewat WhatsApp/Instagram/email.
  return error("Endpoint tidak ditemukan.", 404, request);
}
